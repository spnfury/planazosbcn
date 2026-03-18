import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { planId, ticketId, quantity = 1, customerEmail, userId } = body;

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

    // Generate unique QR code token
    const qrCode = crypto.randomUUID();

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
      return NextResponse.json({
        url: `${baseUrl}/checkout/success?session_id=${reservation.stripe_session_id}`,
        free: true,
      });
    }

    // Create Stripe Checkout Session
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: customerEmail,
      line_items: [
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
      ],
      mode: 'payment',
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel?plan=${plan.slug}`,
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
      total_amount: Math.round(unitPrice * 100 * quantity),
      stripe_session_id: session.id,
      status: 'pending',
      qr_code: qrCode,
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

