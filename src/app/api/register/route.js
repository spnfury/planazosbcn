import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { email, password, fullName, avatarUrl } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son obligatorios' },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'La contraseña debe tener al menos 6 caracteres' },
        { status: 400 }
      );
    }

    // Create user via admin API — skips email confirmation
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // auto-confirm email
      user_metadata: {
        full_name: fullName || '',
        ...(avatarUrl ? { avatar_url: avatarUrl } : {}),
      },
    });

    if (createError) {
      console.error('Admin createUser error:', createError);

      if (createError.message?.includes('already been registered') || 
          createError.message?.includes('already exists')) {
        return NextResponse.json(
          { error: 'Este email ya está registrado. ¿Quieres iniciar sesión?' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: createError.message || 'Error al crear la cuenta' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      user: { id: userData.user.id, email: userData.user.email },
    });
  } catch (err) {
    console.error('Register API error:', err);
    return NextResponse.json(
      { error: 'Error inesperado al crear la cuenta' },
      { status: 500 }
    );
  }
}
