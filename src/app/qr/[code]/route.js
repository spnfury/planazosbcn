import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function GET(request, { params }) {
  const { code } = await params;

  if (!code) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  // Look up the QR code — supports both plan-linked and generic QR codes
  const { data: qrCode, error } = await supabase
    .from('plan_qr_codes')
    .select('id, plan_id, target_url, target_type, plans(slug)')
    .eq('code', code)
    .single();

  if (error || !qrCode) {
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

  // Determine redirect destination
  let destination;

  if (qrCode.target_type === 'plan' && qrCode.plans?.slug) {
    // Plan QR code → redirect to plan page
    destination = new URL(`/planes/${qrCode.plans.slug}`, request.url);
  } else if (qrCode.target_url) {
    // Generic QR code → redirect to target URL
    // If it's a relative URL, resolve it against the request origin
    if (qrCode.target_url.startsWith('http')) {
      destination = qrCode.target_url;
    } else {
      destination = new URL(qrCode.target_url, request.url);
    }
  } else {
    // Fallback to homepage
    destination = new URL('/', request.url);
  }

  return NextResponse.redirect(destination, 302);
}
