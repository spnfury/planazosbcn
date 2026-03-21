import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get('file');
    const extractTextOnly = formData.get('extractTextOnly') === 'true';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // If only text extraction is requested (for menu generation)
    if (extractTextOnly) {
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default || (await import('pdf-parse/lib/pdf-parse.js'));
      const data = await pdfParse(buffer);
      return NextResponse.json({ success: true, text: data.text });
    }

    // Upload PDF to storage using service role (bypasses RLS)
    const ext = file.name?.split('.').pop() || 'pdf';
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `menus/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('docs')
      .upload(filePath, buffer, {
        contentType: file.type || 'application/pdf',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('PDF upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('docs')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (error) {
    console.error('Error processing PDF:', error);
    return NextResponse.json({ error: 'Failed to process PDF file', details: error.message }, { status: 500 });
  }
}
