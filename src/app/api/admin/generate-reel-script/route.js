import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { plan } = await req.json();

    if (!plan) {
      return NextResponse.json({ error: 'Plan data is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    // Collect all available media from the plan
    const availableMedia = [];
    if (plan.image) availableMedia.push({ type: 'image', url: plan.image, label: 'Imagen principal del plan' });
    if (plan.poster_image) availableMedia.push({ type: 'image', url: plan.poster_image, label: 'Poster del plan' });
    if (plan.plan_reels && plan.plan_reels.length > 0) {
      plan.plan_reels.forEach((r, i) => {
        availableMedia.push({ type: 'reel', url: r.url, label: `Reel de Instagram #${i + 1}` });
      });
    }

    const systemPrompt = `
Eres un experto en marketing digital y creación de contenido viral para Instagram Reels y TikTok.
Tu misión es crear un guion ESPECTACULAR para un Reel de 15-30 segundos que promocione un plan en Barcelona.

REGLAS DE ORO PARA EL GUION:
1. EL HOOK ES TODO: Los primeros 1-2 segundos deben ser una frase que haga que la persona NO pueda seguir scrolleando.
   Ejemplos de hooks potentes:
   - "ESTO es lo que NO te cuentan de Barcelona..."
   - "Si no has ido aquí, NO conoces Barcelona"
   - "El plan SECRETO que solo conocen los locales"
   - "¿Buscas un plan ÚNICO? Mira esto 👇"
   - Usa MAYÚSCULAS estratégicamente para enfatizar

2. RITMO VISUAL: Cada 3 segundos DEBE cambiar la imagen o vídeo. El Reel debe tener entre 5-10 segmentos visuales.

3. TEXTO SUPERPUESTO: Para cada segmento, escribe un texto corto (máx 8-10 palabras) que se muestre sobre la imagen/vídeo.

4. CTA FINAL: Termina con una llamada a la acción clara: "Reserva en planazosbcn.com" o similar.

5. MÚSICA: Sugiere un tipo de música de fondo (no canción específica, sino el estilo/mood).

MEDIOS DISPONIBLES del plan:
${JSON.stringify(availableMedia, null, 2)}

Responde SOLO con un JSON válido sin ningún wrapper markdown. El formato debe ser:

{
  "hook": "El texto del hook (1-2 segundos, frase que retiene)",
  "musicStyle": "Descripción del estilo de música sugerido",
  "totalDuration": 18,
  "segments": [
    {
      "startTime": 0,
      "endTime": 3,
      "overlayText": "Texto superpuesto corto e impactante",
      "narration": "Texto que se podría narrar en off",
      "mediaType": "image|reel|generated",
      "mediaUrl": "URL del medio disponible o null si es generado",
      "mediaDescription": "Descripción de qué mostrar si no hay medio disponible",
      "transition": "fade|zoom|slide|cut"
    }
  ],
  "caption": "Texto para el caption del Reel con emojis y hashtags",
  "hashtags": ["planazosbcn", "barcelona", "...más hashtags relevantes"]
}

REGLAS PARA ASIGNAR MEDIOS:
- Distribuye las imágenes y reels disponibles entre los segmentos
- Si hay reels de Instagram, úsalos como clips de vídeo (son lo más atractivo)
- Alterna entre imágenes y reels para dar variedad
- Si no hay suficientes medios, pon mediaType: "generated" y describe qué imagen generar
- El primer segmento SIEMPRE debe tener la mejor imagen/reel disponible
- Cada segmento dura exactamente 3 segundos
`;

    const planSummary = {
      title: plan.title,
      description: plan.description,
      excerpt: plan.excerpt,
      category: plan.category,
      category_label: plan.category_label,
      zone: plan.zone,
      price: plan.price,
      venue: plan.venue,
      date: plan.date,
      time_start: plan.time_start,
      time_end: plan.time_end,
      type: plan.type,
    };

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
          { role: 'user', content: `Genera un guion viral para este plan:\n${JSON.stringify(planSummary, null, 2)}` },
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ error: 'Error generando el guion con IA' }, { status: response.status });
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(resultJson);
  } catch (error) {
    console.error('Error generating reel script:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
