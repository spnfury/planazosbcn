import { supabaseAdmin } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/notify-admins';

export async function POST(request) {
  try {
    const { email, password, fullName, phone, avatarUrl } = await request.json();

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
        ...(phone ? { phone } : {}),
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

    // Save phone to profiles table
    if (phone) {
      await supabaseAdmin
        .from('profiles')
        .update({ phone })
        .eq('id', userData.user.id);
    }

    // Notify admins of new registration
    await notifyAdmins({
      subject: `🆕 Nuevo usuario registrado: ${email}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Nuevo registro en PlanazosBCN</h2>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Nombre:</strong> ${fullName || 'No especificado'}</p>
          <p><strong>Teléfono:</strong> ${phone || 'No especificado'}</p>
          <p><strong>Método:</strong> Email + Contraseña</p>
          <p style="color: #666; font-size: 0.85em; margin-top: 20px;">Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
        </div>
      `,
    });

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
