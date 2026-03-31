const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function run() {
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 1. Get a restaurant
  const { data: rests, error: e1 } = await supabaseAdmin.from('restaurants').select('id, nombre').limit(1);
  if (e1 || !rests || rests.length === 0) {
    return console.log('❌ Error: No restaurant found to test with.', e1);
  }
  const restaurant = rests[0];
  console.log('✅ Restaurante para prueba:', restaurant);

  // 2. Test auth user creation
  const testEmail = 'test-rest-user-' + Date.now() + '@planazosbcn.com';
  console.log('⏳ Intentando crear user auth:', testEmail);
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: testEmail,
    password: 'Password123!',
    email_confirm: true,
  });

  if (authError) {
    return console.log('❌ Error auth creation:', authError);
  }
  console.log('✅ Auth user Creado:', authData.user.id);

  // 3. Test insert into restaurant_users
  console.log('⏳ Insertando en restaurant_users...');
  const { data: restUser, error: insertError } = await supabaseAdmin
    .from('restaurant_users')
    .insert({
      auth_user_id: authData.user.id,
      restaurant_id: restaurant.id,
      email: testEmail,
      name: 'Prueba API',
      role: 'restaurant',
    })
    .select()
    .single();

  if (insertError) {
    return console.log('❌ Error insert:', insertError);
  }
  
  console.log('✅ INSERCIÓN COMPLETADA:', restUser);

  // Cleanup
  console.log('🧹 Limpiando prueba...');
  await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
  console.log('✅ Eliminado.');
}

run();
