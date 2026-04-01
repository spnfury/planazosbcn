import { NextResponse } from 'next/server';

export const maxDuration = 300; // Allow enough time for video rendering

export async function POST(req) {
  try {
    const props = await req.json();
    console.log('Proxying render request to Oracle render farm...');

    const res = await fetch('https://occur-handy-cow-relating.trycloudflare.com/api/render', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(props),
      // Set high timeout since video rendering takes time. Next.js natively handles fetches but Vercel limits route timeout itself.
    });

    if (!res.ok) {
      const errorText = await res.text();
      let is408 = res.status === 408;
      throw new Error(`Render Farm Error (${res.status}): ${is408 ? 'La conexión finalizó por un timeout de red.' : errorText}`);
    }

    const textPayload = await res.text();
    // Parse the JSON manually stripping leading whitespaces injected by keep-alive heartbeats
    const data = JSON.parse(textPayload.trim());
    return NextResponse.json(data);

  } catch (error) {
    console.error('Render API error:', error);
    return NextResponse.json({ error: error.message || 'Error rendering video' }, { status: 500 });
  }
}
