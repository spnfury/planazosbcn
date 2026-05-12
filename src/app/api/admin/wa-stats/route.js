import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

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

export async function GET(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const since = new Date();
    since.setDate(since.getDate() - 30);

    const { data: clicks, error } = await supabaseAdmin
      .from('wa_clicks')
      .select('clicked_at, source, medium, campaign')
      .gte('clicked_at', since.toISOString())
      .order('clicked_at', { ascending: false });

    if (error) throw error;

    const rows = clicks || [];

    // Aggregations
    const bySource = {};
    const byMedium = {};
    const byCampaign = {};
    const daily = {};

    for (const c of rows) {
      bySource[c.source] = (bySource[c.source] || 0) + 1;
      if (c.medium) byMedium[c.medium] = (byMedium[c.medium] || 0) + 1;
      if (c.campaign) byCampaign[c.campaign] = (byCampaign[c.campaign] || 0) + 1;
      const day = c.clicked_at.slice(0, 10);
      daily[day] = (daily[day] || 0) + 1;
    }

    const toSorted = (obj) =>
      Object.entries(obj)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);

    // Last 30 days time series (fill zeros)
    const series = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, clicks: daily[key] || 0 });
    }

    return NextResponse.json({
      total: rows.length,
      bySource: toSorted(bySource),
      byMedium: toSorted(byMedium),
      byCampaign: toSorted(byCampaign),
      series,
    });
  } catch (err) {
    console.error('[wa-stats] error', err);
    return NextResponse.json({ error: 'Error al obtener stats' }, { status: 500 });
  }
}
