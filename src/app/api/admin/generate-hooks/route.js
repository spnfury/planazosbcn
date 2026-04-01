import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { title, description, price, zone, category } = await req.json();

    if (!title) {
      return NextResponse.json({ error: 'Título requerido' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    const systemPrompt = `Eres un experto creador de contenido viral para Instagram Reels y TikTok, especializado en planes y experiencias en Barcelona.

Tu trabajo es generar EXACTAMENTE 4 frases cortas ("ganchos") que aparecerán superpuestas en un vídeo vertical (Reel/TikTok).

REGLAS ESTRICTAS:
- Máximo 8-10 palabras por gancho
- El primer gancho SIEMPRE debe ser una pregunta provocadora o un dato sorprendente ("hook")
- El segundo expande la idea con información atractiva
- El tercero menciona el precio o valor (si hay precio, decir la cifra; si es gratis, resaltarlo)
- El cuarto es un CTA emocional ("Guarda esto", "Etiqueta a tu pareja", etc.)
- Usa un tono cercano, directo, como un tiktoker español joven
- NO uses hashtags ni emojis en los textos
- Cada gancho debe impactar en menos de 2 segundos de lectura

Responde SOLO con un JSON válido con el formato:
{ "hooks": ["gancho1", "gancho2", "gancho3", "gancho4"] }`;

    const userContent = `Plan: "${title}"
Zona: ${zone || 'Barcelona'}
Precio: ${price || 'No especificado'}
Categoría: ${category || 'general'}
Descripción: ${description ? description.substring(0, 300) : 'Sin descripción'}`;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userContent },
        ],
        temperature: 0.8,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ error: 'Error generando ganchos con IA' }, { status: response.status });
    }

    const data = await response.json();
    const result = JSON.parse(data.choices[0].message.content);

    return NextResponse.json({ hooks: result.hooks });
  } catch (error) {
    console.error('Error generando hooks:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}
