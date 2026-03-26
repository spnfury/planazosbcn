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
    const mimeType = file.type || 'application/octet-stream';
    const isImage = mimeType.startsWith('image/');
    const isPdf = mimeType === 'application/pdf' || file.name?.toLowerCase().endsWith('.pdf');

    // If only text extraction is requested (for menu generation)
    if (extractTextOnly) {
      if (isImage) {
        // For images, we need to upload first, then use OCR
        const ext = file.name?.split('.').pop() || 'jpg';
        const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const tempPath = `menus/${filename}`;

        const { error: tempUploadError } = await supabaseAdmin.storage
          .from('docs')
          .upload(tempPath, buffer, {
            contentType: mimeType,
            cacheControl: '3600',
            upsert: false,
          });

        if (tempUploadError) {
          return NextResponse.json({ error: 'Error subiendo imagen: ' + tempUploadError.message }, { status: 500 });
        }

        const { data: urlData } = supabaseAdmin.storage.from('docs').getPublicUrl(tempPath);
        
        // Use OCR.space to extract text from the image
        const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
        const ocrUrl = `https://api.ocr.space/parse/imageurl?apikey=${apiKey}&url=${encodeURIComponent(urlData.publicUrl)}&language=spa&isOverlayRequired=false&OCREngine=2`;
        const ocrRes = await fetch(ocrUrl, { method: 'GET' });
        const ocrData = await ocrRes.json();

        let text = '';
        if (ocrData.ParsedResults && ocrData.ParsedResults.length > 0) {
          ocrData.ParsedResults.forEach(page => { text += page.ParsedText + '\n'; });
        }

        return NextResponse.json({ success: true, text, uploadedUrl: urlData.publicUrl });
      } else {
        // PDF text extraction
        const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default || (await import('pdf-parse/lib/pdf-parse.js'));
        const data = await pdfParse(buffer);
        return NextResponse.json({ success: true, text: data.text });
      }
    }

    // Upload file to storage using service role (bypasses RLS)
    const ext = file.name?.split('.').pop() || (isImage ? 'jpg' : 'pdf');
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const filePath = `menus/${filename}`;

    const { error: uploadError } = await supabaseAdmin.storage
      .from('docs')
      .upload(filePath, buffer, {
        contentType: mimeType,
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('File upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    // Get public URL
    const { data } = supabaseAdmin.storage
      .from('docs')
      .getPublicUrl(filePath);

    return NextResponse.json({ success: true, url: data.publicUrl });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json({ error: 'Failed to process file', details: error.message }, { status: 500 });
  }
}
