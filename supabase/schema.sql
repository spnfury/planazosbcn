-- ============================================
-- PlanazosBCN Database Schema
-- Run this in Supabase SQL Editor
-- ============================================

-- Plans table (main table)
CREATE TABLE IF NOT EXISTS plans (
  id BIGSERIAL PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  type TEXT DEFAULT 'plan' CHECK (type IN ('plan', 'evento')),
  title TEXT NOT NULL,
  excerpt TEXT,
  description TEXT,
  image TEXT,
  poster_image TEXT,
  category TEXT NOT NULL,
  category_label TEXT,
  zone TEXT,
  date TEXT,
  price TEXT,
  venue TEXT,
  address TEXT,
  time_start TEXT,
  time_end TEXT,
  capacity INTEGER DEFAULT 0,
  spots_taken INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  sponsored BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  age_restriction TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan tags
CREATE TABLE IF NOT EXISTS plan_tags (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE,
  tag TEXT NOT NULL
);

-- Plan tickets (for eventos)
CREATE TABLE IF NOT EXISTS plan_tickets (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price TEXT,
  description TEXT,
  capacity INTEGER DEFAULT 0,
  spots_taken INTEGER DEFAULT 0,
  sold_out BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Plan guest lists (for eventos)
CREATE TABLE IF NOT EXISTS plan_guest_lists (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  time_range TEXT,
  price TEXT DEFAULT 'Gratis',
  description TEXT,
  sold_out BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0
);

-- Plan schedule items (for eventos)
CREATE TABLE IF NOT EXISTS plan_schedule (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE,
  time TEXT NOT NULL,
  description TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- Reservations (ticket purchases)
CREATE TABLE IF NOT EXISTS reservations (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE SET NULL,
  ticket_id BIGINT REFERENCES plan_tickets(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  quantity INTEGER DEFAULT 1,
  total_amount INTEGER DEFAULT 0, -- in cents
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- Indexes
-- ============================================
CREATE INDEX IF NOT EXISTS idx_plans_slug ON plans(slug);
CREATE INDEX IF NOT EXISTS idx_plans_category ON plans(category);
CREATE INDEX IF NOT EXISTS idx_plans_published ON plans(published);
CREATE INDEX IF NOT EXISTS idx_plan_tags_plan_id ON plan_tags(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_tickets_plan_id ON plan_tickets(plan_id);
CREATE INDEX IF NOT EXISTS idx_reservations_plan_id ON reservations(plan_id);
CREATE INDEX IF NOT EXISTS idx_reservations_status ON reservations(status);
CREATE INDEX IF NOT EXISTS idx_reservations_stripe_session ON reservations(stripe_session_id);

-- ============================================
-- RLS Policies
-- ============================================
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_guest_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Public read for published plans
CREATE POLICY "Public can read published plans" ON plans
  FOR SELECT USING (published = true);

CREATE POLICY "Public can read plan tags" ON plan_tags
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM plans WHERE plans.id = plan_tags.plan_id AND plans.published = true)
  );

CREATE POLICY "Public can read plan tickets" ON plan_tickets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM plans WHERE plans.id = plan_tickets.plan_id AND plans.published = true)
  );

CREATE POLICY "Public can read plan guest lists" ON plan_guest_lists
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM plans WHERE plans.id = plan_guest_lists.plan_id AND plans.published = true)
  );

CREATE POLICY "Public can read plan schedule" ON plan_schedule
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM plans WHERE plans.id = plan_schedule.plan_id AND plans.published = true)
  );

-- Admin full access (via service role, bypasses RLS anyway)
-- These policies are for admin users using the anon key through the browser
CREATE POLICY "Admins can do everything on plans" ON plans
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can do everything on plan_tags" ON plan_tags
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can do everything on plan_tickets" ON plan_tickets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can do everything on plan_guest_lists" ON plan_guest_lists
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can do everything on plan_schedule" ON plan_schedule
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admins can read reservations" ON reservations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE POLICY "Admin users can read own record" ON admin_users
  FOR SELECT USING (id = auth.uid());

-- ============================================
-- Auto-update updated_at trigger
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER plans_updated_at
  BEFORE UPDATE ON plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
