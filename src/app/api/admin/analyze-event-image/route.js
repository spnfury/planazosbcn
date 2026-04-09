import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

// Verify admin auth
async function checkAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (process.env.NODE_ENV === 'development') {
    return { id: 'local-dev-user', email: 'admin@planazosbcn.com' };
  }
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;
  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('*')
    .eq('id', user.id)
    .single();
  return adminUser ? user : null;
}

export async function POST(request) {
  const user = await checkAdmin(request);
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('image');
    if (!file) {
      return NextResponse.json({ error: 'No se envió ninguna imagen' }, { status: 400 });
    }

    // 1. Upload image to Supabase Storage
    const ext = file.name?.split('.').pop() || 'jpg';
    const filename = `events/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin.storage
      .from('plan-images')
      .upload(filename, buffer, {
        contentType: file.type || 'image/jpeg',
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error:', uploadError);
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: urlData } = supabaseAdmin.storage
      .from('plan-images')
      .getPublicUrl(filename);

    const imageUrl = urlData.publicUrl;

    // 2. Convert image to base64 for Groq Vision
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // 3. Send to Groq Vision API
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    const today = new Date().toISOString().split('T')[0];
    const currentYear = new Date().getFullYear();

    const systemPrompt = `Eres un experto en extraer información de flyers e imágenes de eventos.
Analiza la imagen del evento y extrae TODOS los detalles posibles.
La fecha de hoy es ${today}. El año actual es ${currentYear}.

Responde SOLO con JSON válido (sin markdown, sin \`\`\`):
{
  "title": "Nombre del evento",
  "date": "YYYY-MM-DD (infiere el año ${currentYear} si no aparece explícitamente)",
  "time_start": "HH:MM (formato 24h)",
  "time_end": "HH:MM o null si no aparece",
  "venue": "Nombre del local/venue",
  "address": "Dirección completa",
  "price": "Gratis o número (ej: 15). Si dice Free o Gratis, pon 'Gratis'",
  "description": "Descripción detallada del evento basada en lo visible (2-3 párrafos en español, atractiva y enganchante para la comunidad de Barcelona)",
  "excerpt": "Resumen corto y atractivo (1 línea)",
  "organizer": "Nombre del organizador si aparece",
  "url": "URL de registro o más info si aparece, o null",
  "category": "Una de: gastro, naturaleza, cultura, rutas, nocturno, servicios, bienestar (elige la más apropiada)",
  "zone": "Zona/barrio de Barcelona donde es el evento",
  "age_restriction": "+18 años, Todas las edades, etc.",
  "type": "evento"
}

REGLAS:
- Si no encuentras un dato, pon null o un valor razonable
- La descripción SIEMPRE debe ser en español, atractiva y detallada
- Si ves emojis o texto informal, adáptalo a un tono profesional pero cercano
- Infiere la zona de Barcelona a partir de la dirección si es posible
- Si el precio dice "Free" o no aparece precio, pon "Gratis"`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analiza esta imagen de un evento y extrae toda la información. Responde solo con JSON válido.'
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:${mimeType};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq Vision API Error:', errorText);
      return NextResponse.json({ error: 'Error al analizar la imagen con IA' }, { status: groqResponse.status });
    }

    const groqData = await groqResponse.json();
    let rawContent = groqData.choices?.[0]?.message?.content || '{}';
    
    // Clean up potential markdown wrapping
    rawContent = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    let eventData;
    try {
      eventData = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error('Failed to parse Groq response:', rawContent);
      return NextResponse.json({ error: 'La IA no pudo extraer datos válidos de la imagen', rawContent }, { status: 422 });
    }

    // 4. Generate slug from title
    if (eventData.title) {
      eventData.slug = eventData.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    }

    // 5. Return structured data + image URL
    return NextResponse.json({
      ...eventData,
      image: imageUrl,
      type: 'evento',
    });

  } catch (error) {
    console.error('Error in analyze-event-image:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
