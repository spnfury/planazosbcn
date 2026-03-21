import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { stripe } from '@/lib/stripe';

export async function POST(request) {
  try {
    const { reservationId } = await request.json();

    if (!reservationId) {
      return NextResponse.json({ error: 'Falta reservationId' }, { status: 400 });
    }

    // Obtenemos la reserva
    const { data: reservation, error: fetchError } = await supabaseAdmin
      .from('reservations')
      .select('*, plans(id, title), plan_tickets(id, name, capacity, spots_taken)')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      return NextResponse.json({ error: 'Reserva no encontrada' }, { status: 404 });
    }

    if (reservation.status === 'cancelled') {
      return NextResponse.json({ error: 'La reserva ya está cancelada' }, { status: 400 });
    }

    // Cancelar/reembolsar en Stripe si existe el payment_intent y está pagada
    if (reservation.stripe_payment_intent && reservation.status === 'paid') {
      try {
        await stripe.refunds.create({
          payment_intent: reservation.stripe_payment_intent,
        });
      } catch (stripeError) {
        console.error('Error al reembolsar en Stripe:', stripeError);
        return NextResponse.json({ error: 'Error al procesar el reembolso en Stripe: ' + stripeError.message }, { status: 500 });
      }
    }

    // Actualizamos el estado a cancelada en Supabase
    const { error: updateError } = await supabaseAdmin
      .from('reservations')
      .update({ status: 'cancelled' })
      .eq('id', reservationId);

    if (updateError) {
      return NextResponse.json({ error: 'Error al cancelar la reserva en base de datos' }, { status: 500 });
    }

    // Liberamos las plazas ocupadas
    const qty = parseInt(reservation.quantity, 10) || 1;

    // Restar de plans
    if (reservation.plan_id) {
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('spots_taken')
        .eq('id', reservation.plan_id)
        .single();
        
      if (plan) {
        const newSpots = Math.max(0, plan.spots_taken - qty);
        await supabaseAdmin
          .from('plans')
          .update({ spots_taken: newSpots })
          .eq('id', reservation.plan_id);
      }
    }

    // Restar de plan_tickets si aplica
    if (reservation.ticket_id && reservation.plan_tickets) {
      const ticket = reservation.plan_tickets;
      const newSpots = Math.max(0, ticket.spots_taken - qty);
      await supabaseAdmin
        .from('plan_tickets')
        .update({
          spots_taken: newSpots,
          sold_out: newSpots >= ticket.capacity,
        })
        .eq('id', reservation.ticket_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelando reserva:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
