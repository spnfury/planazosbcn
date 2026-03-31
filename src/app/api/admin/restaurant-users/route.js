import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET — List all restaurant users (admin only)
export async function GET(request) {
  try {
    const { data, error } = await supabaseAdmin
      .from('restaurant_users')
      .select('*, restaurants(nombre, direccion)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching restaurant users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err) {
    console.error('Restaurant users GET error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// POST — Create a new restaurant user
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, password, name, restaurant_id, logo_url } = body;

    if (!email || !password || !name || !restaurant_id) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: email, password, name, restaurant_id' },
        { status: 400 }
      );
    }

    // 1. Verify the restaurant exists
    const { data: restaurant, error: restError } = await supabaseAdmin
      .from('restaurants')
      .select('id, nombre')
      .eq('id', restaurant_id)
      .single();

    if (restError || !restaurant) {
      return NextResponse.json(
        { error: 'Restaurante no encontrado' },
        { status: 404 }
      );
    }

    // 2. Create auth user in Supabase
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth creation error:', authError);
      return NextResponse.json(
        { error: `Error al crear usuario: ${authError.message}` },
        { status: 400 }
      );
    }

    // 3. Insert into restaurant_users table
    const { data: restUser, error: insertError } = await supabaseAdmin
      .from('restaurant_users')
      .insert({
        auth_user_id: authData.user.id,
        restaurant_id,
        email,
        name,
        logo_url: logo_url || null,
        role: 'restaurant',
      })
      .select('*, restaurants(nombre)')
      .single();

    if (insertError) {
      // Rollback: delete the auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error('Restaurant user insert error:', insertError);
      return NextResponse.json(
        { error: `Error al guardar usuario restaurante: ${insertError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: restUser,
      message: `Usuario restaurante creado para ${restaurant.nombre}`,
    });
  } catch (err) {
    console.error('Restaurant user POST error:', err);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
