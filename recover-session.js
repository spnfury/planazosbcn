const fs = require('fs');
const Stripe = require('stripe');
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

// Load env vars manually
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) envVars[match[1]] = match[2];
});

const stripe = new Stripe(envVars.STRIPE_SECRET_KEY);
const supabase = createClient(
  envVars.NEXT_PUBLIC_SUPABASE_URL,
  envVars.SUPABASE_SERVICE_ROLE_KEY
);

async function recoverAndInsertReservation(sessionId) {
  try {
    console.log(`Recovering Stripe session: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (!session) {
      console.error('Session not found in Stripe.');
      return;
    }

    if (session.payment_status !== 'paid') {
      console.log('Session is not paid. Payment status:', session.payment_status);
      return;
    }

    // Check if it already exists
    const { data: existing, error: findError } = await supabase
      .from('reservations')
      .select('id')
      .eq('stripe_session_id', sessionId)
      .single();

    if (existing) {
      console.log('Reservation already exists in Supabase. Nothing to do.');
      return;
    }

    console.log('Reservation not found. Inserting from Stripe metadata...');
    
    // Extract metadata
    const { planId, ticketId, quantity } = session.metadata || {};
    if (!planId) {
      console.error('No planId found in session metadata.');
      return;
    }

    const { customer_details, amount_total } = session;

    // Generate credentials
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let localizador = '';
    for (let i = 0; i < 6; i++) {
      localizador += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    const qrCode = crypto.randomUUID();

    const insertData = {
      plan_id: planId,
      ticket_id: ticketId || null,
      user_id: null, // Since we don't have it explicitly stored, null is safe
      customer_email: customer_details?.email,
      quantity: quantity ? parseInt(quantity, 10) : 1,
      total_amount: amount_total,
      stripe_session_id: sessionId,
      status: 'paid',
      qr_code: qrCode,
      localizador: localizador,
      shipping_name: session.shipping_details?.name || null,
      shipping_address: session.shipping_details?.address ? JSON.stringify(session.shipping_details.address) : null,
      shipping_phone: session.customer_details?.phone || null,
    };

    const { data: inserted, error: insertError } = await supabase
      .from('reservations')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('Failed to insert recovered reservation:', insertError);
    } else {
      console.log('Successfully inserted recovered reservation:', inserted);
    }

  } catch (err) {
    console.error('Recovery failed:', err);
  }
}

const argSession = process.argv[2];
if (argSession) {
  recoverAndInsertReservation(argSession);
} else {
  console.log('Please pass session_id as argument.');
}
