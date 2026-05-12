import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

async function checkAdmin(request) {
  const authHeader = request.headers.get('authorization');

  if (process.env.NODE_ENV === 'development') {
    return { id: 'local-dev-user', email: 'admin@planazosbcn.com' };
  }

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

function monthKey(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const url = new URL(request.url);
  const month = url.searchParams.get('month') || monthKey();
  const [year, m] = month.split('-').map(Number);
  const monthStart = new Date(Date.UTC(year, m - 1, 1));
  const nextMonth = new Date(Date.UTC(year, m, 1));

  try {
    // All clicks in the month
    const { data: clicks } = await supabaseAdmin
      .from('referral_clicks')
      .select('referrer_user_id, code, clicked_at')
      .gte('clicked_at', monthStart.toISOString())
      .lt('clicked_at', nextMonth.toISOString());

    const rows = clicks || [];

    // Group by code (and referrer_user_id)
    const byCode = new Map();
    for (const c of rows) {
      const key = c.code;
      if (!byCode.has(key)) {
        byCode.set(key, { code: c.code, userId: c.referrer_user_id, count: 0 });
      }
      byCode.get(key).count += 1;
    }
    const ranking = Array.from(byCode.values()).sort((a, b) => b.count - a.count);

    // Enrich with profile name/email if available
    const userIds = ranking.map((r) => r.userId).filter(Boolean);
    let profilesById = {};
    if (userIds.length > 0) {
      const { data: profiles } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);
      profilesById = Object.fromEntries((profiles || []).map((p) => [p.id, p]));
    }

    const enriched = ranking.map((r) => ({
      ...r,
      name: profilesById[r.userId]?.full_name || null,
    }));

    // Raffle row for this month
    const { data: raffle } = await supabaseAdmin
      .from('referral_raffles')
      .select('*')
      .eq('month', month)
      .maybeSingle();

    return NextResponse.json({
      month,
      totalClicks: rows.length,
      uniqueReferrers: byCode.size,
      ranking: enriched,
      raffle: raffle || null,
    });
  } catch (err) {
    console.error('[admin referidos] error', err);
    return NextResponse.json({ error: 'Error al obtener datos' }, { status: 500 });
  }
}

// POST → draw a winner for given month (weighted random by click count)
export async function POST(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const month = body.month || monthKey();
    const prizeDescription = body.prizeDescription || null;
    const notes = body.notes || null;
    const force = !!body.force;

    // Check existing
    const { data: existing } = await supabaseAdmin
      .from('referral_raffles')
      .select('*')
      .eq('month', month)
      .maybeSingle();

    if (existing && !force) {
      return NextResponse.json({ error: 'Ya hay sorteo para este mes', raffle: existing }, { status: 409 });
    }

    const [year, m] = month.split('-').map(Number);
    const monthStart = new Date(Date.UTC(year, m - 1, 1));
    const nextMonth = new Date(Date.UTC(year, m, 1));

    const { data: clicks } = await supabaseAdmin
      .from('referral_clicks')
      .select('referrer_user_id, code')
      .gte('clicked_at', monthStart.toISOString())
      .lt('clicked_at', nextMonth.toISOString());

    const rows = clicks || [];
    if (rows.length === 0) {
      return NextResponse.json({ error: 'No hay participaciones este mes' }, { status: 400 });
    }

    // Weighted random: each click = 1 ticket
    const idx = Math.floor(Math.random() * rows.length);
    const winner = rows[idx];

    const payload = {
      month,
      winner_user_id: winner.referrer_user_id,
      winner_code: winner.code,
      prize_description: prizeDescription,
      notes,
      drawn_at: new Date().toISOString(),
    };

    let raffle;
    if (existing) {
      const { data, error } = await supabaseAdmin
        .from('referral_raffles')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single();
      if (error) throw error;
      raffle = data;
    } else {
      const { data, error } = await supabaseAdmin
        .from('referral_raffles')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      raffle = data;
    }

    return NextResponse.json({ raffle, totalTickets: rows.length });
  } catch (err) {
    console.error('[admin referidos POST] error', err);
    return NextResponse.json({ error: 'Error al sortear' }, { status: 500 });
  }
}
