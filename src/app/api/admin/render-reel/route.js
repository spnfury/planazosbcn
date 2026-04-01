import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const props = await req.json();
    console.log('Proxying render request to Oracle render farm...');

    const res = await fetch('https://planazos-remotion-2026.loca.lt/api/render', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Bypass-Tunnel-Reminder': 'true'
      },
      body: JSON.stringify(props),
      // Set high timeout since video rendering takes time. Next.js natively handles fetches but Vercel limits route timeout itself.
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Render Farm Error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Render API error:', error);
    return NextResponse.json({ error: error.message || 'Error rendering video' }, { status: 500 });
  }
}
