-- ============================================
-- PlanazosBCN: Reviews + Shipping Cost + Activity Logs
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add shipping_cost column to plans (if missing)
ALTER TABLE plans ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC DEFAULT 0;

-- 2. Create plan_reviews table
CREATE TABLE IF NOT EXISTS plan_reviews (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  status TEXT DEFAULT 'public' CHECK (status IN ('public', 'hidden', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_plan_reviews_plan_id ON plan_reviews(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_user_id ON plan_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_status ON plan_reviews(status);

ALTER TABLE plan_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read public reviews" ON plan_reviews
  FOR SELECT USING (status = 'public');

CREATE POLICY "Users can insert own reviews" ON plan_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews" ON plan_reviews
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews" ON plan_reviews
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on plan_reviews" ON plan_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

CREATE TRIGGER plan_reviews_updated_at
  BEFORE UPDATE ON plan_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- 3. Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id BIGSERIAL PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  details JSONB DEFAULT '{}',
  status TEXT DEFAULT 'success' CHECK (status IN ('success', 'error')),
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON activity_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_status ON activity_logs(status);

-- No RLS needed — only accessed via service role (server-side)
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read logs through the browser
CREATE POLICY "Admins can read activity_logs" ON activity_logs
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
