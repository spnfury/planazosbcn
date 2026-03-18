import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const { localizador, partnerId } = await request.json();

    if (!localizador || !partnerId) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    // Convert localizador to uppercase for case-insensitive matching
    const code = localizador.toUpperCase().trim();

    // 1. Find the reservation
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*, plans:plan_id(title, collaborator_id)')
      .eq('localizador', code)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Código de reserva no encontrado' }, { status: 404 });
    }

    // 2. Check if the partner is authorized for this plan
    // Admin override could be added here if needed
    if (reservation.plans.collaborator_id !== partnerId) {
      // Check if user is an admin
      const { data: adminUser } = await supabaseAdmin
        .from('admin_users')
        .select('id')
        .eq('id', partnerId)
        .single();
        
      if (!adminUser) {
        return NextResponse.json({ error: 'No tienes permiso para validar esta reserva' }, { status: 403 });
      }
    }

    // 3. Check if already validated
    if (reservation.validated_at) {
      return NextResponse.json({ 
        error: 'Esta reserva ya ha sido validada anteriormente',
        validatedAt: reservation.validated_at,
        reservation: reservation
      }, { status: 400 });
    }

    // 4. Update the reservation
    const { data: updatedReservation, error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ validated_at: new Date().toISOString() })
      .eq('id', reservation.id)
      .select('*, plans(title), plan_tickets(name)')
      .single();

    if (updateError) {
      console.error('Error updating reservation:', updateError);
      return NextResponse.json({ error: 'Error al actualizar la reserva' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Reserva validada correctamente',
      reservation: updatedReservation 
    });

  } catch (error) {
    console.error('Validation API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
