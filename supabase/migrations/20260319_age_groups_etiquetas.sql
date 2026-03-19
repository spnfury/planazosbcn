-- ============================================
-- Add age_groups and etiquetas arrays to plans
-- ============================================

-- age_groups: array of age range strings (e.g. '{"todos","30-40","40-50"}')
ALTER TABLE plans ADD COLUMN IF NOT EXISTS age_groups TEXT[] DEFAULT '{}';

-- etiquetas: array of etiqueta IDs (e.g. '{"lgbtq","con-ninos","fiesta"}')
ALTER TABLE plans ADD COLUMN IF NOT EXISTS etiquetas TEXT[] DEFAULT '{}';

-- Migrate existing age_restriction data into age_groups array
UPDATE plans SET age_groups = ARRAY[age_restriction]
  WHERE age_restriction IS NOT NULL AND age_restriction != '' AND (age_groups IS NULL OR age_groups = '{}');
