-- ============================================
-- QR Code Tracking System
-- Run this in Supabase SQL Editor
-- ============================================

-- QR codes per plan (each with a label for tracking)
CREATE TABLE IF NOT EXISTS plan_qr_codes (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual scan records
CREATE TABLE IF NOT EXISTS plan_qr_scans (
  id BIGSERIAL PRIMARY KEY,
  qr_code_id BIGINT REFERENCES plan_qr_codes(id) ON DELETE CASCADE,
  scanned_at TIMESTAMPTZ DEFAULT now(),
  ip TEXT,
  user_agent TEXT,
  referer TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plan_qr_codes_plan_id ON plan_qr_codes(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_qr_codes_code ON plan_qr_codes(code);
CREATE INDEX IF NOT EXISTS idx_plan_qr_scans_qr_code_id ON plan_qr_scans(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_plan_qr_scans_scanned_at ON plan_qr_scans(scanned_at);

-- RLS
ALTER TABLE plan_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_qr_scans ENABLE ROW LEVEL SECURITY;

-- Public read on plan_qr_codes (needed for redirect endpoint with anon key)
CREATE POLICY "Public can read qr codes" ON plan_qr_codes
  FOR SELECT USING (true);

-- Public insert on plan_qr_scans (the redirect endpoint logs scans)
CREATE POLICY "Public can insert scans" ON plan_qr_scans
  FOR INSERT WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admins can do everything on plan_qr_codes" ON plan_qr_codes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can do everything on plan_qr_scans" ON plan_qr_scans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
