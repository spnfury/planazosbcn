import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Look up the QR code and its associated plan
  const { data: qrCode, error } = await supabase
    .from('plan_qr_codes')
    .select('id, plan_id, plans(slug)')
    .eq('code', code)
    .single();

  if (error || !qrCode || !qrCode.plans?.slug) {
    // QR code not found — redirect to homepage
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Log the scan (fire and forget — don't block the redirect)
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';
  const userAgent = request.headers.get('user-agent') || '';
  const referer = request.headers.get('referer') || '';

  // We don't await this — the redirect should be instant
  supabase.from('plan_qr_scans').insert({
    qr_code_id: qrCode.id,
    ip,
    user_agent: userAgent,
    referer,
  }).then(() => {});

  // Redirect to the plan page
  const destination = new URL(`/planes/${qrCode.plans.slug}`, request.url);
  return NextResponse.redirect(destination, 302);
}
