const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y'
);

async function main() {
  const email = 'admin@planazosbcn.com';
  const password = 'Password123!';

  console.log(`Creating user: ${email}...`);

  // 1. Create user in Auth
  const { data: user, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
        console.log('User already exists. Getting user ID...');
        const { data: users } = await supabase.auth.admin.listUsers();
        const existingUser = users.users.find(u => u.email === email);
        if (existingUser) {
            await makeAdmin(existingUser.id);
            return;
        }
    } else {
        console.error('Auth Error:', authError.message);
        return;
    }
  }

  if (user && user.user) {
    console.log('User created:', user.user.id);
    await makeAdmin(user.user.id);
  }
}

async function makeAdmin(userId) {
    console.log(`Making user ${userId} an admin...`);
    const { error: adminError } = await supabase
      .from('admin_users')
      .upsert({ id: userId, email: 'admin@planazosbcn.com' });

    if (adminError) {
      console.error('Admin Error:', adminError.message);
    } else {
      console.log('✅ Admin user successfully created and authorized!');
      console.log('--- CREDENTIALS ---');
      console.log('Email: admin@planazosbcn.com');
      console.log('Password: Password123!');
    }
}

main();
