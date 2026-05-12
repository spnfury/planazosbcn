-- ============================================
-- WhatsApp Group Click Tracking
-- Run this in Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS wa_clicks (
  id BIGSERIAL PRIMARY KEY,
  clicked_at TIMESTAMPTZ DEFAULT now(),
  source TEXT NOT NULL DEFAULT 'direct',
  medium TEXT,
  campaign TEXT,
  referer TEXT,
  user_agent TEXT,
  ip TEXT
);

CREATE INDEX IF NOT EXISTS idx_wa_clicks_clicked_at ON wa_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_wa_clicks_source ON wa_clicks(source);
CREATE INDEX IF NOT EXISTS idx_wa_clicks_campaign ON wa_clicks(campaign);

ALTER TABLE wa_clicks ENABLE ROW LEVEL SECURITY;

-- Public insert (the /wa redirect logs anonymously)
CREATE POLICY "Public can insert wa_clicks" ON wa_clicks
  FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admins can read wa_clicks" ON wa_clicks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
