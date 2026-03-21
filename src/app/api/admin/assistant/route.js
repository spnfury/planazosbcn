import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Define available actions per page context
function getSystemPrompt(context) {
  const { page, formFields } = context || {};

  let pageDescription = 'el panel de administración de PlanazosBCN';
  let availableActions = '';

  if (page?.includes('/restaurantes/nuevo') || page?.includes('/restaurantes/') && !page?.endsWith('/restaurantes')) {
    pageDescription = 'la página de crear/editar un restaurante';
    availableActions = `
ACCIONES DISPONIBLES:
- fill_form: Rellenar los campos del formulario de restaurante. Los campos son: nombre (nombre del restaurante), direccion (dirección completa), tipo_comida (tipo de cocina). Devuelve un JSON con la clave "formData" que contenga estos campos.
- navigate: Navegar a otra página del admin. Devuelve un JSON con la clave "path" (ej: "/admin/planes/nuevo").
`;
  } else if (page?.includes('/planes/nuevo') || page?.includes('/planes/') && !page?.endsWith('/planes')) {
    pageDescription = 'la página de crear/editar un plan o evento';
    availableActions = `
ACCIONES DISPONIBLES:
- fill_form: Rellenar los campos del formulario de plan. Los campos posibles son: type (plan/evento/sorpresa), title (título), slug (URL amigable, se genera auto del título), excerpt (resumen corto), description (descripción completa), category (gastro/naturaleza/cultura/rutas/nocturno/servicios/bienestar), zone (zona de Barcelona), date (fecha formato "Sáb 22 Mar"), price (precio en €), precio_reserva (precio de pre-reserva €), capacity (aforo), venue (local/venue), address (dirección), time_start (hora inicio HH:MM), time_end (hora fin HH:MM), featured (boolean), sponsored (boolean), published (boolean), age_restriction (ej "+18 años"). Devuelve JSON con "formData".
- navigate: Navegar a otra página. Devuelve JSON con "path".
`;
  } else if (page?.includes('/usuarios')) {
    pageDescription = 'la página de gestión de usuarios';
    availableActions = `
ACCIONES DISPONIBLES:
- navigate: Navegar a otra página del admin. Devuelve JSON con "path".
`;
  } else if (page?.includes('/reservas')) {
    pageDescription = 'la página de gestión de reservas';
    availableActions = `
ACCIONES DISPONIBLES:
- navigate: Navegar a otra página del admin. Devuelve JSON con "path".
`;
  } else {
    availableActions = `
ACCIONES DISPONIBLES:
- navigate: Navegar a cualquier página del admin. Páginas disponibles:
  /admin (Dashboard)
  /admin/planes (Lista de planes)
  /admin/planes/nuevo (Crear nuevo plan)
  /admin/restaurantes (Lista de restaurantes)
  /admin/restaurantes/nuevo (Crear nuevo restaurante)
  /admin/reservas (Reservas)
  /admin/usuarios (Usuarios)
  /admin/resenas (Reseñas)
  /admin/logs (Logs)
  Devuelve JSON con "path".
`;
  }

  return `Eres el asistente IA del panel de administración de PlanazosBCN, una plataforma de planes y eventos en Barcelona.
Actualmente el administrador está en: ${pageDescription}
Página actual: ${page || 'desconocida'}

${availableActions}

INSTRUCCIONES IMPORTANTES:
1. Responde SIEMPRE en español.
2. Sé conciso y directo. Máximo 2-3 frases de respuesta.
3. Si el usuario te pide hacer algo que implica una acción, responde con el JSON apropiado.
4. Tu respuesta DEBE ser un JSON válido con esta estructura exacta:
{
  "reply": "Tu mensaje de respuesta al usuario",
  "action": null | {
    "type": "fill_form" | "navigate",
    "data": { ... datos según el tipo de acción ... }
  }
}
5. Si no hay acción que ejecutar, pon "action": null.
6. Para fill_form, "data" debe tener "formData" con los campos a rellenar.
7. Para navigate, "data" debe tener "path" con la ruta.
8. Cuando rellenes formularios, inventa datos creativos y realistas de Barcelona si el usuario no da todos los detalles.
9. Si el usuario dice algo genérico como "crea un restaurante", usa tu creatividad para inventar un restaurante barcelonés convincente.
10. NUNCA devuelvas markdown ni texto plano. SOLO JSON válido.`;
}

export async function POST(req) {
  try {
    const { messages, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'Messages array is required' }, { status: 400 });
    }

    const systemPrompt = getSystemPrompt(context);

    const groqMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m) => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      })),
    ];

    const chatCompletion = await groq.chat.completions.create({
      messages: groqMessages,
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1024,
    });

    const resultText = chatCompletion.choices[0]?.message?.content || '{}';

    let parsed;
    try {
      parsed = JSON.parse(resultText);
    } catch {
      parsed = { reply: resultText, action: null };
    }

    return NextResponse.json({
      reply: parsed.reply || 'No he podido procesar tu solicitud.',
      action: parsed.action || null,
    });
  } catch (error) {
    console.error('Assistant API error:', error);
    return NextResponse.json(
      { error: 'Error del asistente', details: error.message },
      { status: 500 }
    );
  }
}
