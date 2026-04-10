import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import crypto from 'crypto';

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

// Generate a short unique code (6 chars, URL-safe)
function generateCode() {
  return crypto.randomBytes(4).toString('base64url').slice(0, 6).toLowerCase();
}

// GET /api/admin/qr-codes?plan_id=X — List QR codes for a plan with scan counts
export async function GET(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const planId = searchParams.get('plan_id');

  if (!planId) {
    return NextResponse.json({ error: 'plan_id requerido' }, { status: 400 });
  }

  // Get QR codes for this plan
  const { data: qrCodes, error } = await supabaseAdmin
    .from('plan_qr_codes')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get scan counts + last scan for each QR code
  const qrCodeIds = (qrCodes || []).map((q) => q.id);

  let scanStats = {};
  if (qrCodeIds.length > 0) {
    // Get total scans per QR code
    const { data: scans } = await supabaseAdmin
      .from('plan_qr_scans')
      .select('qr_code_id, scanned_at')
      .in('qr_code_id', qrCodeIds)
      .order('scanned_at', { ascending: false });

    if (scans) {
      for (const scan of scans) {
        if (!scanStats[scan.qr_code_id]) {
          scanStats[scan.qr_code_id] = {
            total: 0,
            lastScan: scan.scanned_at,
          };
        }
        scanStats[scan.qr_code_id].total += 1;
      }
    }
  }

  // Merge scan stats into QR codes
  const result = (qrCodes || []).map((qr) => ({
    ...qr,
    scan_count: scanStats[qr.id]?.total || 0,
    last_scan: scanStats[qr.id]?.lastScan || null,
  }));

  return NextResponse.json(result);
}

// POST /api/admin/qr-codes — Create new QR code
export async function POST(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { plan_id, label } = await request.json();

    if (!plan_id || !label?.trim()) {
      return NextResponse.json({ error: 'plan_id y label son requeridos' }, { status: 400 });
    }

    // Generate unique code, retry if collision
    let code;
    let attempts = 0;
    while (attempts < 5) {
      code = generateCode();
      const { data: existing } = await supabaseAdmin
        .from('plan_qr_codes')
        .select('id')
        .eq('code', code)
        .single();

      if (!existing) break;
      attempts++;
    }

    const { data: qrCode, error } = await supabaseAdmin
      .from('plan_qr_codes')
      .insert({ plan_id, label: label.trim(), code })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(qrCode, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/admin/qr-codes — Delete a QR code
export async function DELETE(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const { id } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'id requerido' }, { status: 400 });
    }

    // Cascade will delete scans too
    const { error } = await supabaseAdmin
      .from('plan_qr_codes')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
