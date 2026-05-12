import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

const WHATSAPP_URL =
  process.env.NEXT_PUBLIC_WHATSAPP_CHANNEL_URL ||
  'https://chat.whatsapp.com/GDiYK6fC7OhHbAu2XipW9z';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const source = (searchParams.get('utm_source') || 'direct').slice(0, 80);
  const medium = (searchParams.get('utm_medium') || '').slice(0, 80) || null;
  const campaign = (searchParams.get('utm_campaign') || '').slice(0, 80) || null;
  const referer = (request.headers.get('referer') || '').slice(0, 500) || null;
  const ua = (request.headers.get('user-agent') || '').slice(0, 500) || null;
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    null;

  // Fire-and-forget insert; never block the redirect.
  try {
    await supabaseAdmin.from('wa_clicks').insert({
      source,
      medium,
      campaign,
      referer,
      user_agent: ua,
      ip,
    });
  } catch (err) {
    console.error('[wa-redirect] insert failed', err);
  }

  const response = NextResponse.redirect(WHATSAPP_URL, 302);
  response.cookies.set('wa_source', source, {
    maxAge: 60 * 60 * 24 * 30,
    httpOnly: false,
    sameSite: 'lax',
    path: '/',
  });
  return response;
}
