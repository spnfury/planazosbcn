import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('session_id');

    if (!sessionId) {
      return NextResponse.json({ error: 'session_id is required' }, { status: 400 });
    }

    // Use supabaseAdmin to bypass RLS
    const { data, error } = await supabaseAdmin
      .from('reservations')
      .select('*, plans(title, date, venue, address, time_start, time_end, image, excerpt, category_label, price, precio_reserva)')
      .eq('stripe_session_id', sessionId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Reservation not found' }, { status: 404 });
    }

    return NextResponse.json({ reservation: data });
  } catch (err) {
    console.error('Error fetching reservation:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
