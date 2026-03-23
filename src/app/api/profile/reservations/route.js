import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    // 1. Link orphan reservations that belong to this user's email
    if (user.email) {
      const { error: linkError } = await supabaseAdmin
        .from('reservations')
        .update({ user_id: user.id })
        .is('user_id', null)
        .eq('customer_email', user.email);

      if (linkError) {
        console.error('Error linking reservations:', linkError);
      }
    }

    // 2. Fetch all reservations for this user
    const { data: reservations, error } = await supabaseAdmin
      .from('reservations')
      .select('*, plans(title, slug, image, date, venue)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user reservations:', error);
      return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
    }

    return NextResponse.json({ reservations });
  } catch (err) {
    console.error('Profile reservations error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
