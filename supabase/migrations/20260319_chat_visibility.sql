-- ============================================
-- Chat messages table + Profile visibility
-- ============================================

-- Chat messages per plan
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_plan ON chat_messages(plan_id, created_at);

-- RLS policies: Only paid attendees can read/write messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendees can read chat" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.plan_id = chat_messages.plan_id
        AND reservations.user_id = auth.uid()
        AND reservations.status = 'paid'
    )
  );

CREATE POLICY "Attendees can send chat" ON chat_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM reservations
      WHERE reservations.plan_id = chat_messages.plan_id
        AND reservations.user_id = auth.uid()
        AND reservations.status = 'paid'
    )
  );

-- Profile visibility toggle (default: visible)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS show_profile BOOLEAN DEFAULT true;
