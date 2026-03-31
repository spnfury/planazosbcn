import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const envFile = fs.readFileSync('.env.local', 'utf8');
const env = {};
envFile.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key) env[key.trim()] = values.join('=').trim();
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function test() {
  const { data, error } = await supabase.from('chat_messages').select('*').limit(5);
  console.log('Messages:', data);
  console.log('Error:', error);
  
  const { error: rError } = await supabase.from('reservations').insert({
    plan_id: 1, // dummy
    customer_email: 'test@test.com',
    status: 'pending',
    shipping_name: 'test'
  }).select();
  console.log('Res insert error:', rError);
}
test();
