import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

async function checkAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();

  return adminUser ? user : null;
}

// GET /api/admin/plans/[id]
export async function GET(request, { params }) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  const { data: plan, error } = await supabaseAdmin
    .from('plans')
    .select('*, plan_tags(*), plan_tickets(*), plan_guest_lists(*), plan_schedule(*)')
    .eq('id', id)
    .single();

  if (error || !plan) {
    return NextResponse.json({ error: 'Plan no encontrado' }, { status: 404 });
  }

  // Get reservations for this plan
  const { data: reservations } = await supabaseAdmin
    .from('reservations')
    .select('*')
    .eq('plan_id', id)
    .order('created_at', { ascending: false });

  return NextResponse.json({ ...plan, reservations: reservations || [] });
}

// PUT /api/admin/plans/[id]
export async function PUT(request, { params }) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { tags, tickets, guestLists, schedule, ...planData } = body;

    // Update plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .update(planData)
      .eq('id', id)
      .select()
      .single();

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 400 });
    }

    // Replace tags
    if (tags !== undefined) {
      await supabaseAdmin.from('plan_tags').delete().eq('plan_id', id);
      if (tags.length) {
        await supabaseAdmin.from('plan_tags').insert(
          tags.map((tag) => ({ plan_id: id, tag }))
        );
      }
    }

    // Replace tickets
    if (tickets !== undefined) {
      await supabaseAdmin.from('plan_tickets').delete().eq('plan_id', id);
      if (tickets.length) {
        await supabaseAdmin.from('plan_tickets').insert(
          tickets.map((t, i) => ({ ...t, plan_id: id, sort_order: i }))
        );
      }
    }

    // Replace guest lists
    if (guestLists !== undefined) {
      await supabaseAdmin.from('plan_guest_lists').delete().eq('plan_id', id);
      if (guestLists.length) {
        await supabaseAdmin.from('plan_guest_lists').insert(
          guestLists.map((g, i) => ({ ...g, plan_id: id, sort_order: i }))
        );
      }
    }

    // Replace schedule
    if (schedule !== undefined) {
      await supabaseAdmin.from('plan_schedule').delete().eq('plan_id', id);
      if (schedule.length) {
        await supabaseAdmin.from('plan_schedule').insert(
          schedule.map((s, i) => ({ ...s, plan_id: id, sort_order: i }))
        );
      }
    }

    return NextResponse.json(plan);
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/admin/plans/[id]
export async function DELETE(request, { params }) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Delete related data first
    await supabaseAdmin.from('plan_tags').delete().eq('plan_id', id);
    await supabaseAdmin.from('plan_tickets').delete().eq('plan_id', id);
    await supabaseAdmin.from('plan_guest_lists').delete().eq('plan_id', id);
    await supabaseAdmin.from('plan_schedule').delete().eq('plan_id', id);

    // Hard delete the plan
    const { error } = await supabaseAdmin
      .from('plans')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'Plan eliminado permanentemente' });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
