import * as fs from 'fs';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const projectRef = 'hepwciepmhojfahycito';

const sql = fs.readFileSync('supabase/migrations/20260319_reviews_logs.sql', 'utf-8');

async function tryExecuteSQL() {
  // Approach 1: Try the /pg/query endpoint (used internally by Supabase dashboard)
  console.log('Trying /pg/query endpoint...');
  try {
    const res = await fetch(`${supabaseUrl}/pg/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      console.log('SUCCESS via /pg/query!');
      console.log(text);
      return;
    }
    console.log('Response:', text.substring(0, 200));
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Approach 2: Try /rest/v1/rpc with a direct function approach
  console.log('\nTrying individual SQL statements via PostgREST...');

  // Split SQL into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`Found ${statements.length} statements`);

  // Approach 3: Try Supabase Management API
  console.log('\nTrying Supabase Management API...');
  try {
    const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      console.log('SUCCESS via Management API!');
      console.log(text);
      return;
    }
    console.log('Response:', text.substring(0, 300));
  } catch (e) {
    console.log('Error:', e.message);
  }

  // Approach 4: Try the /sql endpoint  
  console.log('\nTrying /sql endpoint...');
  try {
    const res = await fetch(`${supabaseUrl}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
        'apikey': serviceKey,
      },
      body: JSON.stringify({ query: sql }),
    });
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    if (res.ok) {
      console.log('SUCCESS via /sql!');
      console.log(text);
      return;
    }
    console.log('Response:', text.substring(0, 200));
  } catch (e) {
    console.log('Error:', e.message);
  }

  console.log('\nAll API approaches failed. Need to use direct database connection or CLI.');
}

tryExecuteSQL();
