import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    if (!partnerId) {
      return NextResponse.json({ error: 'Falta ID de colaborador' }, { status: 400 });
    }

    // Check if user is an admin
    const { data: adminUser } = await supabaseAdmin
      .from('admin_users')
      .select('id')
      .eq('id', partnerId)
      .single();

    let query = supabaseAdmin
      .from('reservations')
      .select(`
        *,
        plans!inner(id, title, collaborator_id),
        plan_tickets(name),
        profiles(full_name, avatar_url)
      `)
      .order('created_at', { ascending: false })
      .limit(limit);

    // If not an admin, restrict to plans where they are the collaborator
    if (!adminUser) {
      query = query.eq('plans.collaborator_id', partnerId);
    }

    const { data: reservations, error } = await query;

    if (error) {
      console.error('Error fetching partner reservations:', error);
      return NextResponse.json({ error: 'Error al obtener reservas' }, { status: 500 });
    }

    return NextResponse.json({ reservations });

  } catch (error) {
    console.error('Partner Reservations API error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
