import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Helper: check admin auth from Authorization header
async function checkAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

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

// GET /api/admin/plans — List all plans with stats
export async function GET(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const category = searchParams.get('category');
  const search = searchParams.get('search');

  let query = supabaseAdmin
    .from('plans')
    .select('*, plan_tickets(*), plan_tags(*)')
    .order('created_at', { ascending: false });

  if (category) {
    query = query.eq('category', category);
  }

  if (search) {
    query = query.ilike('title', `%${search}%`);
  }

  const { data: plans, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get reservation counts per plan
  const { data: resCounts } = await supabaseAdmin
    .from('reservations')
    .select('plan_id, quantity')
    .eq('status', 'paid');

  const revenueByPlan = {};
  if (resCounts) {
    for (const r of resCounts) {
      if (!revenueByPlan[r.plan_id]) revenueByPlan[r.plan_id] = 0;
      revenueByPlan[r.plan_id] += r.quantity;
    }
  }

  const plansWithStats = plans.map((p) => ({
    ...p,
    totalReservations: revenueByPlan[p.id] || 0,
  }));

  return NextResponse.json(plansWithStats);
}

// POST /api/admin/plans — Create new plan
export async function POST(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { tags, tickets, guestLists, schedule, reels, ...planData } = body;

    // Create plan
    const { data: plan, error: planError } = await supabaseAdmin
      .from('plans')
      .insert(planData)
      .select()
      .single();

    if (planError) {
      return NextResponse.json({ error: planError.message }, { status: 400 });
    }

    // Insert related data
    if (tags?.length) {
      await supabaseAdmin.from('plan_tags').insert(
        tags.map((tag) => ({ plan_id: plan.id, tag }))
      );
    }

    if (tickets?.length) {
      await supabaseAdmin.from('plan_tickets').insert(
        tickets.map((t, i) => ({ ...t, plan_id: plan.id, sort_order: i }))
      );
    }

    if (guestLists?.length) {
      await supabaseAdmin.from('plan_guest_lists').insert(
        guestLists.map((g, i) => ({ ...g, plan_id: plan.id, sort_order: i }))
      );
    }

    if (schedule?.length) {
      await supabaseAdmin.from('plan_schedule').insert(
        schedule.map((s, i) => ({ ...s, plan_id: plan.id, sort_order: i }))
      );
    }

    if (reels?.length) {
      await supabaseAdmin.from('plan_reels').insert(
        reels.map((url, i) => ({ plan_id: plan.id, url: url.trim(), sort_order: i }))
      );
    }

    return NextResponse.json(plan, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
