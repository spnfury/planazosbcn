import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req) {
  try {
    const { productId, planName, amount, commerceName, commerceEmail } = await req.json();

    if (!amount || !planName) {
      return NextResponse.json({ error: 'Missing required configuration' }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://planazosbcn.com';

    // Para evitar problemas de "Precios creados al vuelo" y modo suscripción,
    // en Stripe no puedes pasar price_data en mode="subscription" a no ser 
    // que crearas un Producto. Usamos mode='payment' para que sea fácil
    // de arrancar, y luego el webhook los trackea o si preferimos usar suscripción literal
    // creamos un producto por API temporal.
    // Para simplificar la salida hoy, modelaremos como pago de visibilidad anual/mensual pero usando `mode: 'payment'` 
    // o generaremos el precio on the fly si Stripe lo permite.
    // Update: Stripe permite `price_data` si pasamos `recurring`.
    
    let lineItem = {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `Suscripción B2B: ${planName}`,
          description: `PlanazosBCN de visibilidad para el local: ${commerceName || 'Tu Comercio'}`,
          images: ['https://planazosbcn.com/apple-icon.png']
        },
        unit_amount: Math.round(amount * 100), // En céntimos
        recurring: {
          interval: 'month'
        }
      },
      quantity: 1,
    };

    // Si es un servicio puntual
    if (productId && productId.includes('servicio')) {
      delete lineItem.price_data.recurring;
      lineItem.price_data.product_data.name = `Servicio Adicional: ${planName}`;
    }

    const mode = lineItem.price_data.recurring ? 'subscription' : 'payment';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [lineItem],
      mode: mode,
      success_url: `${baseUrl}/checkout/b2b-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/comercios?canceled=true`,
      customer_email: commerceEmail || undefined,
      metadata: {
        b2b: 'true', // marca para el webhook
        planName,
        commerceName
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error('B2B Checkout Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
