-- ============================================
-- PlanazosBCN: Private Events & Invitations
-- Run in Supabase SQL Editor
-- ============================================

-- 1. Add privacy columns to plans table
ALTER TABLE plans ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;
ALTER TABLE plans ADD COLUMN IF NOT EXISTS invite_token UUID DEFAULT gen_random_uuid();

-- 2. Create plan_invitations table
CREATE TABLE IF NOT EXISTS plan_invitations (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT REFERENCES plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'confirmed')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_plan_invitations_plan_id ON plan_invitations(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_invitations_user_id ON plan_invitations(user_id);

ALTER TABLE plan_invitations ENABLE ROW LEVEL SECURITY;

-- Policies for plan_invitations
CREATE POLICY "Users can see their own invitations" ON plan_invitations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can see all invitations" ON plan_invitations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE admin_users.id = auth.uid())
  );
  
-- We will insert invitations via service_role bypassing RLS, 
-- or we could add a policy for authenticated users to insert their own if they have the token.
-- For simplicity, our API routes will handle the insertions using service_role.

-- 3. Add phone number support to users/profiles
-- If you don't have a profiles table or want to store it securely, 
-- we can store phone in auth.users raw_user_meta_data.
-- But if you explicitly have a profiles table, it's good to ensure it has a phone column.
-- We'll assume auth.users raw_user_meta_data is used for name/phone, 
-- which is accessible via supabase.auth.admin.updateUserById or from the user session.
