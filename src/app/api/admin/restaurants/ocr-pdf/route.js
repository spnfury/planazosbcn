import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { pdfUrl } = await req.json();

    if (!pdfUrl) {
      return NextResponse.json({ error: 'pdfUrl is required' }, { status: 400 });
    }

    // OCR.space API URL
    // We use the basic free tier key if no custom one is provided.
    // Pro-tip: 'helloworld' or 'K88647716988957' are common public/free keys.
    const apiKey = process.env.OCR_SPACE_API_KEY || 'helloworld';
    
    // Config: OCREngine=2 (usually better for receipts/menus), language=spa (Spanish)
    const ocrUrl = `https://api.ocr.space/parse/imageurl?apikey=${apiKey}&url=${encodeURIComponent(pdfUrl)}&language=spa&isOverlayRequired=false&OCREngine=2`;

    const response = await fetch(ocrUrl, { method: 'GET' });
    const data = await response.json();

    if (data.IsErroredOnProcessing) {
      console.error('OCR.space processing error:', data);
      throw new Error(data.ErrorMessage ? data.ErrorMessage[0] : 'Error en OCR API');
    }

    // Extract text from all pages
    let fullText = '';
    if (data.ParsedResults && data.ParsedResults.length > 0) {
      data.ParsedResults.forEach(page => {
        fullText += page.ParsedText + '\n';
      });
    }

    if (!fullText.trim()) {
      return NextResponse.json({ success: false, error: 'No se pudo detectar texto en la imagen o el PDF.' }, { status: 400 });
    }

    return NextResponse.json({ success: true, text: fullText });
  } catch (error) {
    console.error('Error in OCR processing:', error);
    return NextResponse.json({ error: 'Fallback OCR falló', details: error.message }, { status: 500 });
  }
}
