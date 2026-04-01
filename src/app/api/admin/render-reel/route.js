import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const props = await req.json();
    console.log('Proxying render request to Hetzner render farm...');

    const res = await fetch('http://78.46.100.91:5050/api/render', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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
