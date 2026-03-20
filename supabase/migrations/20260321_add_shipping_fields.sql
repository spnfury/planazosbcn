-- Add shipping columns to the reservations table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'reservations'
      AND column_name = 'shipping_name'
  ) THEN
    ALTER TABLE public.reservations ADD COLUMN shipping_name TEXT;
    ALTER TABLE public.reservations ADD COLUMN shipping_address TEXT;
    ALTER TABLE public.reservations ADD COLUMN shipping_phone TEXT;
    ALTER TABLE public.reservations ADD COLUMN shipping_date TEXT;
    ALTER TABLE public.reservations ADD COLUMN shipping_message TEXT;
  END IF;
END $$;
