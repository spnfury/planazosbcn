import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve('C:/Users/Sergio/planazos/planazosbcn/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Testing collaborator insertion and plan updates...');
  
  // 1. Get a random user to act as collaborator
  const { data: users, error: userError } = await supabase.auth.admin.listUsers();
  if (userError || !users.users.length) {
    console.log('Error getting users or no users found', userError);
    return;
  }
  
  const testUser = users.users[0];
  console.log(`Using user ${testUser.email} as test partner`);
  
  // 2. Add them as collaborator
  const { error: collabError } = await supabase.from('collaborators').upsert({
    id: testUser.id,
    email: testUser.email,
    company_name: 'Test Partner Restaurant'
  });
  
  if (collabError) {
    console.error('Error adding collaborator:', collabError);
  } else {
    console.log('Successfully added collaborator');
  }
  
  // 3. Get a plan and assign partner
  const { data: plans } = await supabase.from('plans').select('id, title').limit(1);
  if (!plans || !plans.length) {
    return console.log('No plans found');
  }
  
  const testPlan = plans[0];
  console.log(`Assigning plan "${testPlan.title}" to partner (${testPlan.id})`);
  
  await supabase.from('plans').update({ collaborator_id: testUser.id }).eq('id', testPlan.id);
  
  // 4. Create a dummy reservation for this plan with a localizador
  const dummyLocalizador = 'TEST01';
  console.log(`Creating dummy reservation with localizador: ${dummyLocalizador}`);
  
  const { error: resError } = await supabase.from('reservations').upsert({
    id: 99999, // use high ID to avoid conflicts
    plan_id: testPlan.id,
    user_id: testUser.id,
    customer_email: 'testcustomer@example.com',
    customer_name: 'Test Customer',
    quantity: 2,
    total_amount: 5000,
    status: 'paid',
    stripe_session_id: 'test_session_123',
    qr_code: '00000000-0000-0000-0000-000000000000',
    localizador: dummyLocalizador
  });
  
  if (resError) console.error('Error inserting test reservation', resError);
  
  console.log('Test setup complete! You can now test the login and validation UI with the email:', testUser.email);
}

test();
