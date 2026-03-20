const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y',
  { auth: { persistSession: false } }
);

async function check() {
  // Try to insert a dummy record and console.log the error
  const { data, error } = await supabase.from('reservations').insert({
      plan_id: '00000000-0000-0000-0000-000000000000',
      ticket_id: null,
      user_id: null,
      customer_email: 'test@example.com',
      quantity: 1,
      total_amount: 1000,
      stripe_session_id: 'test_session_id',
      status: 'pending',
      qr_code: 'test_qr',
      localizador: 'TEST12',
      shipping_name: null,
      shipping_address: null,
      shipping_phone: null,
      shipping_date: null,
      shipping_message: null,
  }).select();
  
  if (error) {
    console.error('Insert error:', error);
  } else {
    console.log('Insert success:', data);
  }
}
check();
