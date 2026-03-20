const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y'
);

async function check() {
  const { data, error } = await supabase.rpc('get_reservations_schema');
  if (error) {
    // try selecting 1 row to get the keys
    const { data: d2 } = await supabase.from('reservations').select('*').limit(1);
    console.log('Columns from empty select:', d2);
  } else {
    console.log('Schema:', data);
  }
}
check();
