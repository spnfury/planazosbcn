import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { logActivity } from '@/lib/log';

// Verify the request comes from an authenticated admin
async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) return null;

  // Check admin_users table
  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  return adminUser ? user : null;
}

export async function GET(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // Get all reviews with profile and plan information
    const { data: reviews, error } = await supabaseAdmin
      .from('plan_reviews')
      .select(`
        *,
        profiles ( full_name, email:id ),
        plans ( title, slug )
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return NextResponse.json(reviews || []);
  } catch (err) {
    console.error('API /api/admin/reviews GET error:', err);
    return NextResponse.json({ error: 'Error al cargar reseñas' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('plan_reviews')
      .update({ status })
      .eq('id', id);

    if (error) throw error;

    await logActivity({ action: 'review.status_changed', entityType: 'review', entityId: id, userId: admin.id, userEmail: admin.email, details: { newStatus: status } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API /api/admin/reviews PATCH error:', err);
    return NextResponse.json({ error: 'Error al actualizar reseña' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Falta ID' }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from('plan_reviews')
      .delete()
      .eq('id', id);

    if (error) throw error;

    await logActivity({ action: 'review.deleted', entityType: 'review', entityId: id, userId: admin.id, userEmail: admin.email });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('API /api/admin/reviews DELETE error:', err);
    return NextResponse.json({ error: 'Error al borrar reseña' }, { status: 500 });
  }
}
