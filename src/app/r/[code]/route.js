import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const HASH_SALT = process.env.REFERRAL_HASH_SALT || 'planazos-ref-salt';
const DEDUPE_HOURS = 24;

function hashIp(ip) {
  return crypto
    .createHash('sha256')
    .update(`${HASH_SALT}::${ip || 'unknown'}`)
    .digest('hex')
    .slice(0, 32);
}

export async function GET(request, { params }) {
  const { code: rawCode } = await params;
  const code = (rawCode || '').toUpperCase().slice(0, 24);
  const origin = new URL(request.url).origin;

  // Resolve referrer by code
  const { data: referral } = await supabaseAdmin
    .from('referral_codes')
    .select('user_id, code')
    .eq('code', code)
    .single();

  if (!referral) {
    // Invalid code → redirect to /wa direct (still useful)
    return NextResponse.redirect(`${origin}/wa?utm_source=referral-unknown&utm_medium=ref`, 302);
  }

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';
  const ipHash = hashIp(ip);
  const referer = (request.headers.get('referer') || '').slice(0, 500) || null;
  const ua = (request.headers.get('user-agent') || '').slice(0, 500) || null;

  // Dedupe: ignore if same code+ip clicked within DEDUPE_HOURS
  const cutoff = new Date(Date.now() - DEDUPE_HOURS * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabaseAdmin
    .from('referral_clicks')
    .select('id')
    .eq('code', code)
    .eq('ip_hash', ipHash)
    .gte('clicked_at', cutoff)
    .limit(1);

  if (!recent || recent.length === 0) {
    try {
      await supabaseAdmin.from('referral_clicks').insert({
        referrer_user_id: referral.user_id,
        code,
        ip_hash: ipHash,
        user_agent: ua,
        referer,
      });
    } catch (err) {
      console.error('[r-redirect] insert failed', err);
    }
  }

  const target = new URL(`${origin}/wa`);
  target.searchParams.set('utm_source', 'referral');
  target.searchParams.set('utm_medium', `ref-${code}`);
  target.searchParams.set('utm_campaign', 'invite');

  const response = NextResponse.redirect(target.toString(), 302);
  response.cookies.set('referral_code', code, {
    maxAge: 60 * 60 * 24 * 60,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
