import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);


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

      // Fetch plan details for the email
      const { data: plan } = await supabaseAdmin
        .from('plans')
        .select('title')
        .eq('id', reservation.plan_id)
        .single();
        
      let ticketName = '';
      if (reservation.ticket_id) {
         const { data: tData } = await supabaseAdmin.from('plan_tickets').select('name').eq('id', reservation.ticket_id).single();
         if (tData) ticketName = tData.name;
      }

      console.log(`✅ Reservation ${reservation.id} paid — ${qty} spots claimed`);

      // Send confirmation email
      if (reservation.customer_email && plan) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const successUrl = `${baseUrl}/checkout/success?session_id=${reservation.stripe_session_id}`;
        
        try {
          await resend.emails.send({
            from: 'PlanazosBCN Tickets <onboarding@resend.dev>', // Update to your domain later
            to: [reservation.customer_email],
            subject: `🎟️ Tu entrada para: ${plan.title}`,
            html: `
              <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h1 style="color: #000;">¡Pago confirmado! 🎉</h1>
                <p>Hola,</p>
                <p>Hemos recibido el pago de tu reserva para <strong>${plan.title}</strong> y tu entrada ya está confirmada.</p>
                ${ticketName ? `<p><strong>Tipo de Entrada:</strong> ${ticketName}</p>` : ''}
                <p><strong>Cantidad:</strong> ${qty}</p>
                <p><strong>Localizador:</strong> <span style="font-size: 1.2em; font-weight: bold; font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px;">${reservation.localizador || 'Ver en enlace'}</span></p>
                
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${successUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                    Ver mi entrada / QR
                  </a>
                </div>
                
                <p style="color: #666; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                  Si tienes alguna pregunta, responde a este correo.<br>
                  PlanazosBCN
                </p>
              </div>
            `,
          });
          console.log(`✉️ Email sent to ${reservation.customer_email}`);
        } catch (emailError) {
          console.error('Failed to send confirmation email automatically:', emailError);
        }
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
