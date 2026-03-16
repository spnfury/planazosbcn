import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    try {
      // Update reservation status to paid
      const { data: reservation, error: resError } = await supabaseAdmin
        .from('reservations')
        .update({
          status: 'paid',
          stripe_payment_intent: session.payment_intent,
        })
        .eq('stripe_session_id', session.id)
        .select()
        .single();

      if (resError) {
        console.error('Error updating reservation:', resError);
        return NextResponse.json({ error: 'Error updating reservation' }, { status: 500 });
      }

      // Increment spots taken
      const { planId, ticketId, quantity } = session.metadata;
      const qty = parseInt(quantity, 10) || 1;

      // Update plan spots_taken
      await supabaseAdmin
        .from('plans')
        .update({
          spots_taken: reservation.plan_id
            ? (await supabaseAdmin.from('plans').select('spots_taken').eq('id', reservation.plan_id).single()).data.spots_taken + qty
            : qty,
        })
        .eq('id', reservation.plan_id);

      // Update ticket spots_taken if applicable
      if (reservation.ticket_id) {
        const { data: ticket } = await supabaseAdmin
          .from('plan_tickets')
          .select('spots_taken, capacity')
          .eq('id', reservation.ticket_id)
          .single();

        if (ticket) {
          const newSpots = ticket.spots_taken + qty;
          await supabaseAdmin
            .from('plan_tickets')
            .update({
              spots_taken: newSpots,
              sold_out: newSpots >= ticket.capacity,
            })
            .eq('id', reservation.ticket_id);
        }
      }

      console.log(`✅ Reservation ${reservation.id} paid — ${qty} spots claimed`);
    } catch (error) {
      console.error('Webhook processing error:', error);
      return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
