-- PlanazosBCN: Add terraza columns to plans table
-- Run this in the Supabase SQL Editor

ALTER TABLE plans ADD COLUMN IF NOT EXISTS menu_terraza text;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS suplemento_terraza text;
