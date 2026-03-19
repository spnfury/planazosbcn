import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { logActivity } from '@/lib/log';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'Falta planId' }, { status: 400 });
    }

    // Since this is a public endpoint, we can use the regular client.
    // The RLS policy "Public can read public reviews" will apply (status='public').
    // BUT we need the profiles table to get the user's name/avatar.
    const { supabaseAdmin } = await import('@/lib/supabase-server');
    
    // Using admin to bypass RLS if profiles table has strict RLS, but we filter by public status manually
    const { data: reviews, error } = await supabaseAdmin
      .from('plan_reviews')
      .select(`
        *,
        profiles (
          full_name,
          avatar_url
        )
      `)
      .eq('plan_id', planId)
      .eq('status', 'public')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(reviews || []);
  } catch (err) {
    console.error('API /api/reviews GET error:', err);
    return NextResponse.json({ error: 'Error al cargar reseñas' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { supabaseAdmin } = await import('@/lib/supabase-server');
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const { createClient: createSupabaseAuth } = await import('@supabase/supabase-js');
    const supabaseUser = createSupabaseAuth(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: { user }, error: userError } = await supabaseUser.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Usuario no válido' }, { status: 401 });
    }

    const { planId, rating, comment } = await request.json();

    if (!planId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Datos de reseña inválidos' }, { status: 400 });
    }

    // Optional business rule check: Does the user have a paid reservation for this plan?
    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('user_id', user.id)
      .eq('plan_id', planId)
      .eq('status', 'paid')
      .limit(1);

    if (!reservation || reservation.length === 0) {
      return NextResponse.json(
        { error: 'Solo puedes valorar si has comprado entradas para este plan.' },
        { status: 403 }
      );
    }

    // Insert the review
    const { data, error } = await supabaseAdmin
      .from('plan_reviews')
      .insert({
        plan_id: planId,
        user_id: user.id,
        rating: Number(rating),
        comment: comment || '',
        status: 'public', // default to public
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({ action: 'review.created', entityType: 'review', entityId: data.id, userId: user.id, userEmail: user.email, details: { planId, rating, comment: comment || '' } });

    return NextResponse.json(data);
  } catch (err) {
    console.error('API /api/reviews POST error:', err);
    return NextResponse.json({ error: 'Error al guardar la reseña' }, { status: 500 });
  }
}
