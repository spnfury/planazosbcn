-- Add Instagram fields to restaurants table
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS instagram_url text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS logo_url text;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS reels jsonb DEFAULT '[]'::jsonb;
