import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request, { params }) {
  try {
    const { id: planId } = await params;

    if (!planId) {
      return NextResponse.json({ error: 'planId requerido' }, { status: 400 });
    }

    // Get total attendee count (paid reservations)
    const { data: reservations, error: resError } = await supabaseAdmin
      .from('reservations')
      .select('user_id, quantity')
      .eq('plan_id', planId)
      .eq('status', 'paid');

    if (resError) {
      console.error('Attendees fetch error:', resError);
      return NextResponse.json({ error: 'Error al cargar asistentes' }, { status: 500 });
    }

    // Total people = sum of quantities
    const totalAttendees = (reservations || []).reduce((sum, r) => sum + (r.quantity || 1), 0);

    // Get unique user_ids that have profiles
    const userIds = [...new Set((reservations || []).map(r => r.user_id).filter(Boolean))];

    let attendees = [];
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, avatar_url, show_profile')
        .in('id', userIds);

      attendees = (profiles || [])
        .filter(p => p.show_profile !== false)
        .map(p => ({
          id: p.id,
          name: p.full_name || 'Anónimo',
          avatar: p.avatar_url || null,
        }));
    }

    return NextResponse.json({
      total: totalAttendees,
      attendees,
    });
  } catch (err) {
    console.error('Attendees GET error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
