-- ============================================
-- QR Codes: Add support for generic QR codes
-- (not tied to a specific plan)
-- Run this in Supabase SQL Editor
-- ============================================

-- Make plan_id nullable (allows generic QR codes)
ALTER TABLE plan_qr_codes ALTER COLUMN plan_id DROP NOT NULL;

-- Add target_url for generic QR codes that redirect to any URL
ALTER TABLE plan_qr_codes ADD COLUMN IF NOT EXISTS target_url TEXT;

-- Add a type column to distinguish plan QR codes from generic ones
ALTER TABLE plan_qr_codes ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'plan';

-- Index for quick lookups
CREATE INDEX IF NOT EXISTS idx_plan_qr_codes_target_type ON plan_qr_codes(target_type);
