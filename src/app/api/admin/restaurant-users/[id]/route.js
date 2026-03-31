import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// PUT — Update restaurant user
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, logo_url, active, new_password } = body;

    const updates = { updated_at: new Date().toISOString() };
    if (name !== undefined) updates.name = name;
    if (logo_url !== undefined) updates.logo_url = logo_url;
    if (active !== undefined) updates.active = active;

    // Update restaurant_users record
    const { data, error } = await supabaseAdmin
      .from('restaurant_users')
      .update(updates)
      .eq('id', id)
      .select('*, restaurants(nombre)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If password reset requested
    if (new_password && data.auth_user_id) {
      const { error: pwError } = await supabaseAdmin.auth.admin.updateUserById(
        data.auth_user_id,
        { password: new_password }
      );
      if (pwError) {
        return NextResponse.json(
          { error: `Usuario actualizado pero error al cambiar contraseña: ${pwError.message}` },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true, user: data });
  } catch (err) {
    console.error('Restaurant user PUT error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// DELETE — Delete restaurant user (removes auth user too)
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    // Get the auth_user_id first
    const { data: restUser, error: fetchError } = await supabaseAdmin
      .from('restaurant_users')
      .select('auth_user_id')
      .eq('id', id)
      .single();

    if (fetchError || !restUser) {
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 });
    }

    // Delete from restaurant_users
    const { error: deleteError } = await supabaseAdmin
      .from('restaurant_users')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Delete from Supabase Auth
    await supabaseAdmin.auth.admin.deleteUser(restUser.auth_user_id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Restaurant user DELETE error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
