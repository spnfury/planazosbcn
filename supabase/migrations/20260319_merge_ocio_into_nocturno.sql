-- Migration: Merge 'Ocio & Fiesta' category into 'Nocturno'
-- All plans with category 'ocio' are reassigned to 'nocturno'

UPDATE plans
SET category = 'nocturno',
    category_label = 'Nocturno'
WHERE category = 'ocio';
