-- ============================================
-- Referral System
-- Run this in Supabase SQL Editor
-- ============================================

-- One unique code per user
CREATE TABLE IF NOT EXISTS referral_codes (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Each click on /r/CODE (deduped by ip_hash per day in application layer)
CREATE TABLE IF NOT EXISTS referral_clicks (
  id BIGSERIAL PRIMARY KEY,
  referrer_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referer TEXT,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

-- Monthly raffle records
CREATE TABLE IF NOT EXISTS referral_raffles (
  id BIGSERIAL PRIMARY KEY,
  month TEXT UNIQUE NOT NULL,
  winner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  winner_code TEXT,
  prize_description TEXT,
  drawn_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_referrer ON referral_clicks(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_code ON referral_clicks(code);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_at ON referral_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_referral_clicks_dedupe ON referral_clicks(code, ip_hash, clicked_at);

ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_raffles ENABLE ROW LEVEL SECURITY;

-- User can read their own code
CREATE POLICY "Users read own referral code" ON referral_codes
  FOR SELECT USING (auth.uid() = user_id);

-- User can insert their own code (first creation)
CREATE POLICY "Users insert own referral code" ON referral_codes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Admin full access on codes
CREATE POLICY "Admin all on referral_codes" ON referral_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- Public insert on clicks (the /r/CODE route logs anonymously)
CREATE POLICY "Public insert referral_clicks" ON referral_clicks
  FOR INSERT WITH CHECK (true);

-- User reads only their own click count (referrer_user_id = their id)
CREATE POLICY "Users read own clicks" ON referral_clicks
  FOR SELECT USING (auth.uid() = referrer_user_id);

-- Admin full access on clicks
CREATE POLICY "Admin all on referral_clicks" ON referral_clicks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- Raffles: public read (everyone can see who won this month), admin write
CREATE POLICY "Public read raffles" ON referral_raffles
  FOR SELECT USING (true);

CREATE POLICY "Admin all on raffles" ON referral_raffles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
