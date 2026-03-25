import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ hasReservation: false });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'planId requerido' }, { status: 400 });
    }

    // Retroactively link orphaned reservations
    if (user.email) {
      await supabaseAdmin
        .from('reservations')
        .update({ user_id: user.id })
        .is('user_id', null)
        .eq('plan_id', planId)
        .eq('customer_email', user.email);
    }

    // Check reservation
    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('id, localizador, quantity, created_at')
      .eq('plan_id', planId)
      .eq('status', 'paid')
      .or(`user_id.eq.${user.id},customer_email.eq.${user.email}`)
      .limit(1)
      .single();

    if (!reservation) {
      return NextResponse.json({ hasReservation: false });
    }

    return NextResponse.json({
      hasReservation: true,
      reservation: {
        id: reservation.id,
        localizador: reservation.localizador,
        quantity: reservation.quantity,
      },
    });
  } catch (err) {
    console.error('Reservation check error:', err);
    return NextResponse.json({ hasReservation: false });
  }
}
