import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { logActivity } from '@/lib/log';
import { notifyAdmins } from '@/lib/notify-admins';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;


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
      // --- FLUJO B2B ---
      if (session.metadata?.b2b === 'true') {
        const planName = session.metadata.planName || 'Plan Comercial';
        const commerceName = session.metadata.commerceName || 'Un local';
        const customerEmail = session.customer_details?.email || session.customer_email;
        
        console.log(`✅ B2B Pago de Suscripción confirmado: ${commerceName} - ${planName}`);
        
        // Avisar a los admins inmediatamente para que activen la visibilidad manualmente
        await notifyAdmins({
          subject: `💸 NUEVO CLIENTE B2B: ${commerceName}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2>¡Ha entrado una factura B2B! 💸</h2>
              <p>Un local acaba de pagar en Stripe por visibilidad/servicios.</p>
              <br/>
              <p><strong>Comercio/Local:</strong> ${commerceName}</p>
              <p><strong>Email Cliente:</strong> ${customerEmail}</p>
              <p><strong>Plan Contratado:</strong> ${planName}</p>
              <p><strong>Importe:</strong> ${(session.amount_total / 100).toFixed(2)}€</p>
              <hr/>
              <p>Acción Requerida: Entra a Supabase y pon <code>featured = true</code> en el/los planes de este cliente. Escríbele al email de arriba para recoger sus videos/fotos si aún no los has pedido.</p>
            </div>
          `,
        });
        
        return NextResponse.json({ received: true });
      }

      // --- FLUJO B2C (Reservas) ---
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
        .select('title, slug')
        .eq('id', reservation.plan_id)
        .single();
        
      let ticketName = '';
      if (reservation.ticket_id) {
         const { data: tData } = await supabaseAdmin.from('plan_tickets').select('name').eq('id', reservation.ticket_id).single();
         if (tData) ticketName = tData.name;
      }

      console.log(`✅ Reservation ${reservation.id} paid — ${qty} spots claimed`);

      await logActivity({ action: 'payment.completed', entityType: 'reservation', entityId: reservation.id, userEmail: reservation.customer_email, details: { planId: reservation.plan_id, quantity: qty, amount: reservation.total_amount } });

      // Send confirmation email
      if (reservation.customer_email && plan) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        const successUrl = `${baseUrl}/checkout/success?session_id=${reservation.stripe_session_id}`;
        
        try {
          if (resend) {
            await resend.emails.send({
              from: 'PlanazosBCN Tickets <tickets@planazosbcn.com>',
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

                <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 24px 0;">
                  <p style="margin: 0 0 6px; font-weight: 700; color: #1E40AF; font-size: 0.95em;">💬 ¡Chatea con los demás asistentes!</p>
                  <p style="margin: 0 0 10px; color: #3B82F6; font-size: 0.88em; line-height: 1.5;">Entra en la página del plan para hablar con el resto de personas que se han apuntado.</p>
                  <a href="${baseUrl}/planes/${plan.slug || ''}?chat=true" style="color: #1E40AF; font-weight: 700; text-decoration: underline; font-size: 0.9em;">Ir al chat del plan →</a>
                </div>
                
                <p style="color: #666; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                  Si tienes alguna pregunta, responde a este correo.<br>
                  PlanazosBCN
                </p>
              </div>
            `,
            });
            console.log(`✉️ Email sent to ${reservation.customer_email}`);
          } else {
            console.log('Skipping email send because RESEND_API_KEY is not set');
          }
        } catch (emailError) {
          console.error('Failed to send confirmation email automatically:', emailError);
        }

        // Separate admin notification
        await notifyAdmins({
          subject: `💰 Pago confirmado: ${plan.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h2>Pago confirmado en PlanazosBCN</h2>
              <p><strong>Plan:</strong> ${plan.title}</p>
              <p><strong>Cliente:</strong> ${reservation.customer_email}</p>
              ${ticketName ? `<p><strong>Tipo de Entrada:</strong> ${ticketName}</p>` : ''}
              <p><strong>Cantidad:</strong> ${qty}</p>
              <p><strong>Importe:</strong> ${(reservation.total_amount / 100).toFixed(2)}€</p>
              <p><strong>Localizador:</strong> ${reservation.localizador || 'N/A'}</p>
              <div style="margin: 25px 0; text-align: center;">
                <a href="${baseUrl}/admin/reservas" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  📊 Ver en Panel de Control
                </a>
              </div>
              <p style="color: #666; font-size: 0.85em; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
            </div>
          `,
        });
      }

    } catch (error) {
      console.error('Webhook processing error:', error);
      return NextResponse.json({ error: 'Webhook processing error' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}
