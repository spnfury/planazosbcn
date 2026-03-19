-- Plan Instagram Reels
CREATE TABLE IF NOT EXISTS plan_reels (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_plan_reels_plan_id ON plan_reels(plan_id);

ALTER TABLE plan_reels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read plan_reels" ON plan_reels
  FOR SELECT USING (true);

CREATE POLICY "Authenticated insert plan_reels" ON plan_reels
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Authenticated update plan_reels" ON plan_reels
  FOR UPDATE USING (true);

CREATE POLICY "Authenticated delete plan_reels" ON plan_reels
  FOR DELETE USING (true);
