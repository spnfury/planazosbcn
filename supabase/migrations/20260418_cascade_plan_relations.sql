-- Añade ON DELETE CASCADE en las FK de las tablas hijas de `plans`.
-- Motivo: al borrar un plan quedaban filas huérfanas (ej. plan_tickets con plan_id de un plan ya inexistente),
-- lo que causaba basura en BBDD y potenciales fallos de renderizado en la ficha pública.

BEGIN;

-- plan_tickets
ALTER TABLE public.plan_tickets
  DROP CONSTRAINT IF EXISTS plan_tickets_plan_id_fkey,
  ADD CONSTRAINT plan_tickets_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

-- plan_guest_lists
ALTER TABLE public.plan_guest_lists
  DROP CONSTRAINT IF EXISTS plan_guest_lists_plan_id_fkey,
  ADD CONSTRAINT plan_guest_lists_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

-- plan_schedule
ALTER TABLE public.plan_schedule
  DROP CONSTRAINT IF EXISTS plan_schedule_plan_id_fkey,
  ADD CONSTRAINT plan_schedule_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

-- plan_tags
ALTER TABLE public.plan_tags
  DROP CONSTRAINT IF EXISTS plan_tags_plan_id_fkey,
  ADD CONSTRAINT plan_tags_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

-- plan_reels
ALTER TABLE public.plan_reels
  DROP CONSTRAINT IF EXISTS plan_reels_plan_id_fkey,
  ADD CONSTRAINT plan_reels_plan_id_fkey
    FOREIGN KEY (plan_id) REFERENCES public.plans(id) ON DELETE CASCADE;

COMMIT;
