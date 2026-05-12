import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const RESERVED = new Set(['ADMIN', 'PLANAZOS', 'PLANAZOSBCN', 'API', 'TEST', 'WHATSAPP']);

function buildCodeFromUser(user) {
  // Try first name from metadata, else email prefix, fallback random
  const base =
    (user.user_metadata?.full_name ||
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'planazos')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .slice(0, 8) || 'PLAN';
  const tail = Math.floor(1000 + Math.random() * 9000);
  return `${base}${tail}`;
}

async function generateUniqueCode(user) {
  for (let i = 0; i < 8; i++) {
    const candidate = buildCodeFromUser(user);
    if (RESERVED.has(candidate)) continue;
    const { data: exists } = await supabaseAdmin
      .from('referral_codes')
      .select('id')
      .eq('code', candidate)
      .maybeSingle();
    if (!exists) return candidate;
  }
  // Fallback purely random
  return `PLAN${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
}

async function getUserFromAuth(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  return user;
}

export async function GET(request) {
  const user = await getUserFromAuth(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  // Get-or-create referral code
  let { data: codeRow } = await supabaseAdmin
    .from('referral_codes')
    .select('code')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!codeRow) {
    const code = await generateUniqueCode(user);
    const { data: inserted, error: insertErr } = await supabaseAdmin
      .from('referral_codes')
      .insert({ user_id: user.id, code })
      .select('code')
      .single();
    if (insertErr) {
      console.error('[referral] insert error', insertErr);
      return NextResponse.json({ error: 'Error al generar código' }, { status: 500 });
    }
    codeRow = inserted;
  }

  // Click count this month (each unique IP per code per day already deduped at insert)
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: clicksThisMonth } = await supabaseAdmin
    .from('referral_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_user_id', user.id)
    .gte('clicked_at', monthStart.toISOString());

  const { count: clicksTotal } = await supabaseAdmin
    .from('referral_clicks')
    .select('id', { count: 'exact', head: true })
    .eq('referrer_user_id', user.id);

  // Active raffle (current month)
  const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;
  const { data: raffle } = await supabaseAdmin
    .from('referral_raffles')
    .select('month, winner_user_id, winner_code, prize_description, drawn_at')
    .eq('month', monthKey)
    .maybeSingle();

  return NextResponse.json({
    code: codeRow.code,
    clicksThisMonth: clicksThisMonth || 0,
    clicksTotal: clicksTotal || 0,
    raffle: raffle || null,
    currentMonth: monthKey,
  });
}
