import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { qr_code } = body;

    if (!qr_code) {
      return NextResponse.json(
        { error: 'Código QR requerido' },
        { status: 400 }
      );
    }

    // Find reservation by QR code
    const { data: reservation, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('*, plans(title, date, venue)')
      .eq('qr_code', qr_code)
      .single();

    if (resError || !reservation) {
      return NextResponse.json(
        { error: 'Código QR no válido' },
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
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ validated_at: new Date().toISOString() })
      .eq('id', reservation.id);

    if (updateError) {
      return NextResponse.json(
        { error: 'Error al validar la entrada' },
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
