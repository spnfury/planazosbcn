-- Add localizador column to reservations if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reservations'
      AND column_name = 'localizador'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN localizador TEXT;
  END IF;
END $$;
