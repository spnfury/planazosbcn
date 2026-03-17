// Verify Supabase connection and data
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y'
);

async function main() {
  const tables = ['plans', 'plan_tags', 'plan_tickets', 'plan_guest_lists', 'plan_schedule', 'profiles', 'reservations', 'admin_users'];
  
  console.log('=== Supabase Data Verification ===\n');
  
  for (const table of tables) {
    const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' });
    if (error) {
      console.log(`❌ ${table}: ERROR — ${error.message}`);
    } else {
      console.log(`✅ ${table}: ${data.length} rows`);
      if (data.length > 0 && table === 'plans') {
        data.forEach(p => console.log(`   - [${p.id}] ${p.title} (${p.type})`));
      }
    }
  }
}

main().catch(console.error);
