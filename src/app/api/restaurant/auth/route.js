import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// POST — Verify restaurant user login
export async function POST(request) {
  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json({ error: 'user_id requerido' }, { status: 400 });
    }

    // Check if authentication user is a restaurant user
    const { data: restUser, error } = await supabaseAdmin
      .from('restaurant_users')
      .select('*, restaurants(nombre, direccion)')
      .eq('auth_user_id', user_id)
      .eq('active', true)
      .single();

    if (error || !restUser) {
      return NextResponse.json({
        isRestaurant: false,
        error: 'No eres un usuario restaurante autorizado',
      }, { status: 403 });
    }

    return NextResponse.json({
      isRestaurant: true,
      user: restUser,
    });
  } catch (err) {
    console.error('Restaurant auth check error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
