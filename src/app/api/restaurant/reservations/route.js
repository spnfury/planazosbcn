import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// GET — Get reservations for the authenticated restaurant user
export async function GET(request) {
  try {
    // Get auth token from header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: 'Token inválido' }, { status: 401 });
    }

    // Get restaurant user info
    const { data: restUser, error: restError } = await supabaseAdmin
      .from('restaurant_users')
      .select('id, restaurant_id, restaurants(nombre)')
      .eq('auth_user_id', user.id)
      .eq('active', true)
      .single();

    if (restError || !restUser) {
      return NextResponse.json({ error: 'No eres un usuario restaurante autorizado' }, { status: 403 });
    }

    // Get URL params for filters
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('from');
    const dateTo = searchParams.get('to');
    const status = searchParams.get('status');

    // Query reservations validated by this restaurant user
    let query = supabaseAdmin
      .from('reservations')
      .select('*, plans(title, slug, date, venue)')
      .eq('validated_by', restUser.id)
      .order('validated_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (dateFrom) {
      query = query.gte('validated_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('validated_at', dateTo);
    }

    const { data: reservations, error: resError } = await query.limit(100);

    if (resError) {
      console.error('Error fetching restaurant reservations:', resError);
      return NextResponse.json({ error: resError.message }, { status: 500 });
    }

    // Get stats
    const { count: todayCount } = await supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('validated_by', restUser.id)
      .gte('validated_at', new Date().toISOString().split('T')[0]);

    const { count: totalCount } = await supabaseAdmin
      .from('reservations')
      .select('*', { count: 'exact', head: true })
      .eq('validated_by', restUser.id);

    return NextResponse.json({
      reservations: reservations || [],
      stats: {
        today: todayCount || 0,
        total: totalCount || 0,
      },
      restaurant: restUser.restaurants,
    });
  } catch (err) {
    console.error('Restaurant reservations error:', err);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
