-- ============================================
-- Plan Reviews (Opiniones de Planes)
-- ============================================

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

-- Index for faster queries on plan pages
CREATE INDEX IF NOT EXISTS idx_plan_reviews_plan_id ON plan_reviews(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_user_id ON plan_reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_plan_reviews_status ON plan_reviews(status);

-- Enable Row Level Security
ALTER TABLE plan_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read ONLY 'public' reviews
CREATE POLICY "Public can read public reviews" ON plan_reviews
  FOR SELECT USING (status = 'public');

-- Authenticated users can insert their own reviews
CREATE POLICY "Users can insert own reviews" ON plan_reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own reviews
CREATE POLICY "Users can update own reviews" ON plan_reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Authenticated users can delete their own reviews
CREATE POLICY "Users can delete own reviews" ON plan_reviews
  FOR DELETE USING (auth.uid() = user_id);

-- Admins can do everything on reviews
CREATE POLICY "Admins can do everything on plan_reviews" ON plan_reviews
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );

-- Trigger for updated_at
CREATE TRIGGER plan_reviews_updated_at
  BEFORE UPDATE ON plan_reviews
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
