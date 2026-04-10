import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Helper: check admin auth
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

// GET /api/admin/dashboard-stats — Full dashboard statistics
export async function GET(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    // 1. Basic counts
    const [
      { count: totalPlans },
      { count: totalEvents },
      { data: reservations },
      { count: totalUsers },
    ] = await Promise.all([
      supabaseAdmin.from('plans').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('plans').select('*', { count: 'exact', head: true }).eq('type', 'evento'),
      supabaseAdmin.from('reservations').select('*').eq('status', 'paid'),
      supabaseAdmin.from('profiles').select('*', { count: 'exact', head: true }),
    ]);

    const totalReservations = reservations?.length || 0;
    const totalRevenue = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

    // 2. QR scan data: all QR codes with plan info
    const { data: qrCodes } = await supabaseAdmin
      .from('plan_qr_codes')
      .select('id, label, plan_id, plans(title)')
      .order('created_at', { ascending: false });

    // 3. All scans (last 30 days) 
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: recentScans } = await supabaseAdmin
      .from('plan_qr_scans')
      .select('qr_code_id, scanned_at')
      .gte('scanned_at', thirtyDaysAgo.toISOString())
      .order('scanned_at', { ascending: true });

    // 4. All scans ever (for totals)
    const { data: allScans } = await supabaseAdmin
      .from('plan_qr_scans')
      .select('qr_code_id, scanned_at');

    // Build scan counts per QR code
    const qrScanCounts = {};
    for (const scan of (allScans || [])) {
      qrScanCounts[scan.qr_code_id] = (qrScanCounts[scan.qr_code_id] || 0) + 1;
    }

    // Build scans by day (last 30 days)
    const scansByDay = {};
    for (const scan of (recentScans || [])) {
      const day = scan.scanned_at.slice(0, 10); // YYYY-MM-DD
      scansByDay[day] = (scansByDay[day] || 0) + 1;
    }

    // Fill in missing days
    const dailyScans = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      dailyScans.push({ date: key, scans: scansByDay[key] || 0 });
    }

    // Build scans per plan (aggregate QR codes per plan)
    const scansByPlan = {};
    for (const qr of (qrCodes || [])) {
      const planTitle = qr.plans?.title || `Plan #${qr.plan_id}`;
      const sc = qrScanCounts[qr.id] || 0;
      if (!scansByPlan[qr.plan_id]) {
        scansByPlan[qr.plan_id] = { title: planTitle, scans: 0 };
      }
      scansByPlan[qr.plan_id].scans += sc;
    }

    // Top plans by QR scans
    const topPlansByScans = Object.entries(scansByPlan)
      .map(([pid, data]) => ({ plan_id: Number(pid), title: data.title, scans: data.scans }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);

    // Top QR codes
    const topQrCodes = (qrCodes || [])
      .map((qr) => ({
        id: qr.id,
        label: qr.label,
        plan_title: qr.plans?.title || `Plan #${qr.plan_id}`,
        scans: qrScanCounts[qr.id] || 0,
      }))
      .sort((a, b) => b.scans - a.scans)
      .slice(0, 10);

    // 5. Recent reservations
    const { data: recentReservations } = await supabaseAdmin
      .from('reservations')
      .select('*, plans(title)')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      counts: {
        totalPlans: totalPlans || 0,
        totalEvents: totalEvents || 0,
        totalReservations,
        totalRevenue,
        totalUsers: totalUsers || 0,
        totalQrCodes: qrCodes?.length || 0,
        totalScans: allScans?.length || 0,
      },
      topPlansByScans,
      topQrCodes,
      dailyScans,
      recentReservations: recentReservations || [],
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
