import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyAdmins } from '@/lib/notify-admins';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=missing_code`);
  }

  // Create a Supabase client for server-side auth exchange
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(`${origin}/login?error=auth_failed`);
  }

  // Check if the user has a phone in their profile
  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('phone')
    .eq('id', data.user.id)
    .single();

  // If no phone number, this is likely a new Google OAuth user
  if (!profile?.phone) {
    // Notify admins of new Google registration
    const userEmail = data.user.email || 'desconocido';
    const userName = data.user.user_metadata?.full_name || data.user.user_metadata?.name || '';
    await notifyAdmins({
      subject: `🆕 Nuevo usuario registrado (Google): ${userEmail}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
          <h2>Nuevo registro en PlanazosBCN</h2>
          <p><strong>Email:</strong> ${userEmail}</p>
          <p><strong>Nombre:</strong> ${userName || 'No disponible'}</p>
          <p><strong>Método:</strong> Google OAuth</p>
          <p style="color: #666; font-size: 0.85em; margin-top: 20px;">Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
        </div>
      `,
    });

    return NextResponse.redirect(`${origin}/completar-perfil`);
  }

  return NextResponse.redirect(`${origin}/cuenta`);
}
