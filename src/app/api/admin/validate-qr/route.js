import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    // Verify service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY === 'dummy') {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured — validation will fail');
      return NextResponse.json(
        { error: 'Configuración del servidor incompleta (service role key)' },
        { status: 500 }
      );
    }
    const body = await request.json();
    const { qr_code } = body;

    if (!qr_code) {
      return NextResponse.json(
        { error: 'Código QR requerido' },
        { status: 400 }
      );
    }

    // Try finding reservation by QR code first, then by localizador
    let reservation = null;
    let resError = null;

    // Try qr_code (UUID format)
    const { data: byQr, error: qrErr } = await supabaseAdmin
      .from('reservations')
      .select('*, plans(title, date, venue)')
      .eq('qr_code', qr_code)
      .single();

    if (byQr) {
      reservation = byQr;
    } else {
      // Try localizador (short alphanumeric code)
      const { data: byLoc, error: locErr } = await supabaseAdmin
        .from('reservations')
        .select('*, plans(title, date, venue)')
        .eq('localizador', qr_code.toUpperCase())
        .single();

      if (byLoc) {
        reservation = byLoc;
      } else {
        resError = qrErr || locErr;
      }
    }

    if (resError || !reservation) {
      return NextResponse.json(
        { error: 'Código QR o localizador no válido' },
        { status: 404 }
      );
    }

    // Check status
    if (reservation.status !== 'paid') {
      return NextResponse.json(
        { error: `La reserva no está confirmada (estado: ${reservation.status})` },
        { status: 400 }
      );
    }

    // Check if already validated
    if (reservation.validated_at) {
      return NextResponse.json({
        valid: false,
        already_validated: true,
        validated_at: reservation.validated_at,
        reservation,
        message: `Esta entrada ya fue validada el ${new Date(reservation.validated_at).toLocaleString('es-ES')}`,
      });
    }

    // Validate the ticket
    const { data: updatedRes, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ validated_at: new Date().toISOString() })
      .eq('id', reservation.id)
      .select()
      .single();

    if (updateError) {
      console.error('QR validation update error:', updateError, 'Reservation ID:', reservation.id);
      return NextResponse.json(
        { error: 'Error al validar la entrada: ' + updateError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      valid: true,
      reservation: {
        ...reservation,
        validated_at: new Date().toISOString(),
      },
      message: '✅ Entrada validada correctamente',
    });
  } catch (error) {
    console.error('QR validation error:', error);
    return NextResponse.json(
      { error: 'Error al procesar la validación' },
      { status: 500 }
    );
  }
}

// GET method for QR scan redirect (optional admin view)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.json({ error: 'Código requerido' }, { status: 400 });
  }

  // Find reservation
  const { data: reservation, error } = await supabaseAdmin
    .from('reservations')
    .select('*, plans(title, date, venue)')
    .eq('qr_code', code)
    .single();

  if (error || !reservation) {
    return NextResponse.json({ error: 'Código no válido' }, { status: 404 });
  }

  return NextResponse.json({
    reservation,
    validated: !!reservation.validated_at,
  });
}
