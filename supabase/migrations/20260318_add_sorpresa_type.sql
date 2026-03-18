-- Add new plan type 'sorpresa' and shipping cost
ALTER TABLE public.plans
  DROP CONSTRAINT IF EXISTS plans_type_check;

ALTER TABLE public.plans
  ADD CONSTRAINT plans_type_check CHECK (type IN ('plan', 'evento', 'sorpresa'));

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS shipping_cost numeric DEFAULT 0;

-- Add shipping fields to reservations
ALTER TABLE public.reservations
  ADD COLUMN IF NOT EXISTS shipping_name TEXT,
  ADD COLUMN IF NOT EXISTS shipping_address TEXT,
  ADD COLUMN IF NOT EXISTS shipping_phone TEXT,
  ADD COLUMN IF NOT EXISTS shipping_date TEXT,
  ADD COLUMN IF NOT EXISTS shipping_message TEXT;
