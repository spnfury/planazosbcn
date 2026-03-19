import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase/server';

export async function PUT(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { showProfile } = await request.json();

    if (typeof showProfile !== 'boolean') {
      return NextResponse.json({ error: 'showProfile debe ser boolean' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ show_profile: showProfile })
      .eq('id', user.id);

    if (error) {
      console.error('Profile visibility update error:', error);
      return NextResponse.json({ error: 'Error al actualizar visibilidad' }, { status: 500 });
    }

    return NextResponse.json({ success: true, showProfile });
  } catch (err) {
    console.error('Visibility PUT error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
