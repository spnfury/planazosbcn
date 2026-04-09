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
    const body = await request.json();
    const { event } = body;

    if (!event?.title) {
      return NextResponse.json({ error: 'Se requiere al menos un título del evento' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY no configurada' }, { status: 500 });
    }

    const today = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const systemPrompt = `Eres un community manager experto en eventos de Barcelona. 
Genera contenido para redes sociales basado en los datos del evento.
Hoy es ${today}.

Responde SOLO con JSON válido (sin markdown):
{
  "instagram": {
    "caption": "Caption completo para Instagram con emojis, saltos de línea, CTA para registrarse/asistir, y hashtags relevantes de Barcelona. Incluye el enlace si existe. Máximo 2200 caracteres. Empieza con un gancho potente. Usa el formato que queda bien en Instagram (con emojis de lista).",
    "hashtags": ["planazosbcn", "barcelona", "eventosbarcelona", "...(al menos 15 hashtags relevantes)"]
  },
  "tiktok": {
    "caption": "Caption corto y viral para TikTok. Máximo 150 caracteres + hashtags. Tono Gen-Z, enganchante.",
    "hashtags": ["barcelona", "planazos", "eventobcn", "...(10 hashtags trending)"]
  },
  "whatsapp": "Mensaje formateado para WhatsApp con emojis. Debe seguir este formato exacto:\\n\\nEVENTOS\\n\\n[Título del evento]\\n[Descripción corta]\\n\\n🕐 Hora: [hora]\\n📅 Fecha: [fecha en español]\\n🎉 Ubicación: [venue]\\n📍 Dirección: [dirección]\\n💰 Precio: [precio o Free]\\n🔗 [URL si existe]\\n\\n¡No te lo pierdas! 🔥"
}

REGLAS:
- El contenido SIEMPRE en español
- Menciona @planazosbcn en Instagram
- Los hashtags NO deben incluir el símbolo # (solo la palabra)
- Adapta el tono: Instagram = profesional pero cercano, TikTok = viral y joven, WhatsApp = informativo y directo
- Si el evento es gratuito, destácalo como "GRATIS" o "FREE"
- Incluye siempre una llamada a la acción`;

    const groqResponse = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: `Genera contenido para redes sociales de este evento:\n\n${JSON.stringify(event, null, 2)}`
          }
        ],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ error: 'Error generando contenido social' }, { status: groqResponse.status });
    }

    const groqData = await groqResponse.json();
    const rawContent = groqData.choices?.[0]?.message?.content || '{}';

    let socialContent;
    try {
      socialContent = JSON.parse(rawContent);
    } catch (parseErr) {
      console.error('Failed to parse social content:', rawContent);
      return NextResponse.json({ error: 'Error al parsear contenido generado' }, { status: 422 });
    }

    return NextResponse.json(socialContent);

  } catch (error) {
    console.error('Error in generate-social-content:', error);
    return NextResponse.json({ error: error.message || 'Error interno' }, { status: 500 });
  }
}
