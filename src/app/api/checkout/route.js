import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';
import { Resend } from 'resend';
import { notifyAdmins } from '@/lib/notify-admins';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;


export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, ticketId, quantity = 1, customerEmail, userId, customerName, shippingData, shippingCost } = body;

    if (!planId || !customerEmail) {
      return NextResponse.json(
        { error: 'planId y customerEmail son requeridos' },
        { status: 400 }
      );
    }

    // Get plan details
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', planId)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
    }

    // Check capacity
    let ticketData = null;
    let unitPrice = 0;
    let itemName = plan.title;

    if (ticketId) {
      // Get specific ticket
      const { data: ticket, error: ticketError } = await supabaseAdmin
        .from('plan_tickets')
        .select('*')
        .eq('id', ticketId)
        .single();

      if (ticketError || !ticket) {
        return NextResponse.json({ error: 'Ticket no encontrado' }, { status: 404 });
      }

      if (ticket.sold_out) {
        return NextResponse.json({ error: 'Entradas agotadas' }, { status: 400 });
      }

      const available = ticket.capacity - ticket.spots_taken;
      if (quantity > available) {
        return NextResponse.json(
          { error: `Solo quedan ${available} entradas disponibles` },
          { status: 400 }
        );
      }

      ticketData = ticket;
      unitPrice = parseFloat(ticket.price) || 0;
      itemName = `${plan.title} — ${ticket.name}`;
    } else {
      // General plan reservation
      if (plan.price === 'Gratis') {
        unitPrice = 0;
      } else {
        if (plan.precio_reserva && plan.precio_reserva > 0) {
           unitPrice = Number(plan.precio_reserva);
           itemName = `Reserva: ${plan.title}`;
        } else {
           unitPrice = parseFloat(plan.price) || 0;
        }
      }

      const available = plan.capacity - plan.spots_taken;
      if (quantity > available) {
        return NextResponse.json(
          { error: `Solo quedan ${available} plazas disponibles` },
          { status: 400 }
        );
      }
    }

    // Generate unique QR code token and localizador
    const qrCode = crypto.randomUUID();
    
    // Generate a short 6-character alphanumeric code for easy manual verification
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removed I, O, 1, 0 to avoid confusion
    let localizador = '';
    for (let i = 0; i < 6; i++) {
      localizador += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // If free, create reservation directly
    if (unitPrice === 0) {
      const { data: reservation, error: resError } = await supabaseAdmin
        .from('reservations')
        .insert({
          plan_id: planId,
          ticket_id: ticketId || null,
          user_id: userId || null,
          customer_email: customerEmail,
          quantity,
          total_amount: 0,
          status: 'paid',
          stripe_session_id: `free_${Date.now()}`,
          qr_code: qrCode,
          localizador: localizador,
          shipping_name: shippingData?.name || null,
          shipping_address: shippingData?.address || null,
          shipping_phone: shippingData?.phone || null,
          shipping_date: shippingData?.date || null,
          shipping_message: shippingData?.message || null,
        })
        .select()
        .single();

      if (resError) {
        return NextResponse.json({ error: 'Error al crear reserva' }, { status: 500 });
      }

      // Update spots
      await supabaseAdmin.rpc('increment_spots', {
        p_plan_id: planId,
        p_ticket_id: ticketId || null,
        p_quantity: quantity,
      });

      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
      const successUrl = `${baseUrl}/checkout/success?session_id=${reservation.stripe_session_id}`;

      // Send email for free reservation
      try {
        if (resend) {
          await resend.emails.send({
          from: 'PlanazosBCN Tickets <tickets@planazosbcn.com>',
          to: [customerEmail],
          subject: `🎟️ Tu entrada para: ${plan.title}`,
          html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
              <h1 style="color: #000;">¡Reserva confirmada! 🎉</h1>
              <p>Hola,</p>
              <p>Tu reserva para <strong>${plan.title}</strong> ha sido confirmada correctamente.</p>
              ${ticketData ? `<p><strong>Tipo de Entrada:</strong> ${ticketData.name}</p>` : ''}
              <p><strong>Cantidad:</strong> ${quantity}</p>
              <p><strong>Localizador:</strong> <span style="font-size: 1.2em; font-weight: bold; font-family: monospace; background: #eee; padding: 2px 6px; border-radius: 4px;">${localizador}</span></p>
              
              <div style="margin: 30px 0; text-align: center;">
                <a href="${successUrl}" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Ver mi entrada / QR
                </a>
              </div>

              <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 12px; padding: 16px; margin: 24px 0;">
                <p style="margin: 0 0 6px; font-weight: 700; color: #1E40AF; font-size: 0.95em;">💬 ¡Chatea con los demás asistentes!</p>
                <p style="margin: 0 0 10px; color: #3B82F6; font-size: 0.88em; line-height: 1.5;">Entra en la página del plan para hablar con el resto de personas que se han apuntado.</p>
                <a href="${baseUrl}/planes/${plan.slug || ''}" style="color: #1E40AF; font-weight: 700; text-decoration: underline; font-size: 0.9em;">Ir al chat del plan →</a>
              </div>
              
              <p style="color: #666; font-size: 0.9em; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                Si tienes alguna pregunta, responde a este correo.<br>
                PlanazosBCN
              </p>
            </div>
          `,
          });
        }
      } catch (emailError) {
        console.error('Failed to send confirmation email automatically:', emailError);
        // We don't want to block the success response if the email fails.
      }

      // Separate admin notification for free reservation
      await notifyAdmins({
        subject: `🎟️ Nueva reserva gratuita: ${plan.title}`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2>Nueva reserva gratuita en PlanazosBCN</h2>
            <p><strong>Plan:</strong> ${plan.title}</p>
            <p><strong>Cliente:</strong> ${customerEmail}</p>
            ${ticketData ? `<p><strong>Tipo de Entrada:</strong> ${ticketData.name}</p>` : ''}
            <p><strong>Cantidad:</strong> ${quantity}</p>
            <p><strong>Localizador:</strong> ${localizador}</p>
            <p style="color: #666; font-size: 0.85em; margin-top: 20px;">Fecha: ${new Date().toLocaleString('es-ES', { timeZone: 'Europe/Madrid' })}</p>
          </div>
        `,
      });

      return NextResponse.json({
        url: successUrl,
        free: true,
      });
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const lineItems = [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: itemName,
            description: plan.excerpt || undefined,
            images: plan.image ? [plan.image] : undefined,
          },
          unit_amount: Math.round(unitPrice * 100), // Stripe uses cents
        },
        quantity,
      },
    ];

    if (shippingCost && parseFloat(shippingCost) > 0) {
      lineItems.push({
        price_data: {
          currency: 'eur',
          product_data: {
            name: 'Gastos de envío a domicilio',
          },
          unit_amount: Math.round(parseFloat(shippingCost) * 100),
        },
        quantity: 1, // Shipping cost applies once per order, not per quantity
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: lineItems,
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?plan=${plan.slug}`,
      payment_intent_data: {
        statement_descriptor: 'PLANAZOSBCN',
        description: `PlanazosBCN — ${itemName} (x${quantity})`,
      },
      metadata: {
        planId: String(planId),
        ticketId: ticketId ? String(ticketId) : '',
        quantity: String(quantity),
      },
    });

    // Create pending reservation with QR code
    await supabaseAdmin.from('reservations').insert({
      plan_id: planId,
      ticket_id: ticketId || null,
      user_id: userId || null,
      customer_email: customerEmail,
      quantity,
      total_amount: Math.round((unitPrice * 100 * quantity) + (parseFloat(shippingCost || 0) * 100)),
      stripe_session_id: session.id,
      status: 'pending',
      qr_code: qrCode,
      localizador: localizador,
      shipping_name: shippingData?.name || null,
      shipping_address: shippingData?.address || null,
      shipping_phone: shippingData?.phone || null,
      shipping_date: shippingData?.date || null,
      shipping_message: shippingData?.message || null,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: 'Error al procesar el checkout' },
      { status: 500 }
    );
  }
}

