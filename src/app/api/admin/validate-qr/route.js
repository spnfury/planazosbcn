import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Identify the validator — can be admin or restaurant user.
 * Returns { type: 'admin'|'restaurant', userId, restaurantUser? }
 */
async function identifyValidator(request) {
  const authHeader = request.headers.get('authorization');
  const validatorHeader = request.headers.get('x-validator-id');

  if (validatorHeader) {
    // Restaurant user is validating — verify their identity
    const { data: restUser, error } = await supabaseAdmin
      .from('restaurant_users')
      .select('id, name, restaurant_id, restaurants(nombre)')
      .eq('id', validatorHeader)
      .eq('active', true)
      .single();

    if (!error && restUser) {
      return { type: 'restaurant', userId: restUser.id, restaurantUser: restUser };
    }
  }

  // Fallback: admin user (legacy behavior)
  return { type: 'admin', userId: null, restaurantUser: null };
}

/**
 * Send validation notification email to customer
 */
async function sendValidationNotification(reservation, plan, validatorInfo) {
  if (!resend || !reservation.customer_email) return;

  const validatorName = validatorInfo.restaurantUser?.restaurants?.nombre
    || validatorInfo.restaurantUser?.name
    || 'PlanazosBCN';

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://planazosbcn.com';

  try {
    await resend.emails.send({
      from: 'PlanazosBCN Tickets <tickets@planazosbcn.com>',
      to: [reservation.customer_email],
      subject: `✅ Tu entrada para ${plan?.title || 'tu plan'} ha sido validada`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 600px; margin: 0 auto; color: #333; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
            <h1 style="color: #16A34A; margin: 0; font-size: 1.5em;">¡Entrada validada!</h1>
          </div>
          
          <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 12px; padding: 20px; margin-bottom: 20px;">
            <p style="margin: 0 0 8px; font-size: 0.95em;">Tu entrada para <strong>${plan?.title || 'tu plan'}</strong> ha sido validada correctamente.</p>
            ${plan?.venue ? `<p style="margin: 0 0 8px; font-size: 0.9em; color: #666;">📍 ${plan.venue}</p>` : ''}
            ${plan?.date ? `<p style="margin: 0 0 8px; font-size: 0.9em; color: #666;">🗓️ ${plan.date}</p>` : ''}
            <p style="margin: 0; font-size: 0.9em; color: #666;">🏪 Validado por: <strong>${validatorName}</strong></p>
          </div>
          
          <div style="background: #F9FAFB; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
            <p style="margin: 0 0 6px; font-weight: 600; font-size: 0.9em;">Detalles:</p>
            <p style="margin: 0 0 4px; font-size: 0.85em; color: #666;">
              <strong>Cantidad:</strong> ${reservation.quantity} ${reservation.quantity === 1 ? 'entrada' : 'entradas'}
            </p>
            ${reservation.localizador ? `<p style="margin: 0 0 4px; font-size: 0.85em; color: #666;"><strong>Localizador:</strong> <code style="background: #eee; padding: 2px 6px; border-radius: 4px;">${reservation.localizador}</code></p>` : ''}
            <p style="margin: 0; font-size: 0.85em; color: #666;">
              <strong>Fecha validación:</strong> ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}
            </p>
          </div>
          
          <p style="text-align: center; color: #999; font-size: 0.8em; margin-top: 30px;">
            ¡Disfruta de tu planazo! 🎉<br/>
            <a href="${baseUrl}" style="color: #999;">PlanazosBCN</a>
          </p>
        </div>
      `,
    });
    console.log(`📧 Validation notification sent to ${reservation.customer_email}`);
  } catch (emailErr) {
    console.error('Failed to send validation notification:', emailErr);
  }
}

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

    // Identify who is validating
    const validatorInfo = await identifyValidator(request);

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

    // Validate the ticket with validator info
    const updateData = {
      validated_at: new Date().toISOString(),
    };

    // Add validated_by if restaurant user
    if (validatorInfo.type === 'restaurant' && validatorInfo.userId) {
      updateData.validated_by = validatorInfo.userId;
    }

    const { data: updatedRes, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update(updateData)
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

    // Send notification email to customer
    await sendValidationNotification(reservation, reservation.plans, validatorInfo);

    return NextResponse.json({
      valid: true,
      reservation: {
        ...reservation,
        validated_at: new Date().toISOString(),
        validated_by: validatorInfo.userId,
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
