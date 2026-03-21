import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const pdfParse = (await import('pdf-parse')).default || (await import('pdf-parse'));
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Extract text from PDF
    const data = await pdfParse(buffer);
    const text = data.text;

    return NextResponse.json({ success: true, text });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: 'Failed to process PDF file', details: error.message }, { status: 500 });
  }
}
