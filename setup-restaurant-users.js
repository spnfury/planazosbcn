/**
 * Setup script: Create restaurant_users table and add validated_by to reservations.
 * Run once: node setup-restaurant-users.js
 */
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y'
);

async function main() {
  console.log('🔧 Setting up restaurant_users table...\n');

  // 1. Create restaurant_users table
  const { error: tableError } = await supabase.rpc('exec_sql', {
    query: `
      CREATE TABLE IF NOT EXISTS restaurant_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
        restaurant_id UUID NOT NULL,
        email TEXT NOT NULL,
        name TEXT NOT NULL,
        logo_url TEXT,
        role TEXT NOT NULL DEFAULT 'restaurant',
        active BOOLEAN NOT NULL DEFAULT true,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
        UNIQUE(auth_user_id),
        UNIQUE(email)
      );
    `
  });

  if (tableError) {
    // rpc might not exist, try direct approach — create via insert test
    console.log('ℹ️  Cannot use exec_sql RPC. Creating table via Supabase Dashboard SQL Editor instead.');
    console.log('\nPlease run this SQL in the Supabase Dashboard SQL Editor:\n');
    console.log(`
-- Create restaurant_users table
CREATE TABLE IF NOT EXISTS restaurant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restaurant_id UUID NOT NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  logo_url TEXT,
  role TEXT NOT NULL DEFAULT 'restaurant',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(auth_user_id),
  UNIQUE(email)
);

-- Add validated_by column to reservations
ALTER TABLE reservations ADD COLUMN IF NOT EXISTS validated_by UUID;

-- Enable RLS
ALTER TABLE restaurant_users ENABLE ROW LEVEL SECURITY;

-- Admin full access
CREATE POLICY "Admin full access on restaurant_users" ON restaurant_users
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Restaurant user can read own record
CREATE POLICY "Restaurant user read own" ON restaurant_users
  FOR SELECT USING (auth_user_id = auth.uid());

-- Service role bypass (for API routes)
CREATE POLICY "Service role bypass restaurant_users" ON restaurant_users
  FOR ALL USING (auth.role() = 'service_role');
    `);
  } else {
    console.log('✅ restaurant_users table created');
  }

  // 2. Check if table exists by trying to select
  const { data, error: checkError } = await supabase
    .from('restaurant_users')
    .select('id')
    .limit(1);

  if (checkError) {
    console.log('\n⚠️  Table does not exist yet. Please run the SQL above in the Supabase Dashboard.');
    console.log('   Go to: https://supabase.com/dashboard → SQL Editor');
  } else {
    console.log('✅ restaurant_users table verified — exists and accessible');
  }

  // 3. Check validated_by column on reservations
  const { data: resData, error: resError } = await supabase
    .from('reservations')
    .select('validated_by')
    .limit(1);

  if (resError && resError.message.includes('validated_by')) {
    console.log('⚠️  validated_by column not found on reservations. Please run the ALTER TABLE above.');
  } else {
    console.log('✅ reservations.validated_by column verified');
  }

  console.log('\n🎉 Setup check complete!');
}

main().catch(console.error);
