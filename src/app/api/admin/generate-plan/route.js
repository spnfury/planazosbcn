import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt, currentPlanData } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const modificationContext = currentPlanData 
      ? `You are MODIFYING an existing plan. The current state of the plan is provided in the user message. 
      Apply the user's requested changes to this existing plan and return the FULL updated JSON state. Do not change parts of the plan the user didn't mention unless logically required by their change.`
      : `You are CREATING a new plan from a brief description. 
      You must expand their brief description logically into a rich, detailed, and attractive plan for Barcelona. Invent catchy titles, thorough descriptions, and complete tickets/schedule if it's an event.`;

    const today = new Date().toISOString().split('T')[0];

    const systemPrompt = `
You are an expert AI Assistant specialized in Barcelona plans and events.
Today's date is ${today}.
${modificationContext}

IMPORTANT: You MUST fill in ALL fields as completely as possible. Be creative and thorough. Always assign age_groups and etiquetas. Make the plan as detailed as possible.

Extract or expand the details and map them to the following JSON schema. DO expand creatively to make an attractive, complete plan.

Strictly output ONLY valid JSON without any markdown formatting wrappers. 

JSON format:
{
  "type": "plan" | "evento" | "sorpresa",
  "title": "A catchy, attractive title",
  "excerpt": "A brief, highly attractive summary (1-2 sentences)",
  "description": "Full, beautifully written, engaging description (at least 3-4 paragraphs). Use rich language.",
  "category": "One of: gastro, naturaleza, cultura, rutas, nocturno, servicios, bienestar",
  "zone": "Neighborhood or zone in Barcelona, e.g. El Born, Gràcia, Eixample, Barceloneta",
  "date": "YYYY-MM-DD format. Use today (${today}) if the user says 'hoy', calculate from today if they say 'mañana', 'este sábado', etc. Leave empty ONLY if truly unknown.",
  "price": "Number as string, or 'Gratis'",
  "precio_reserva": "Number (deposit/pre-reserve amount, typically 5-15 for paid plans, 0 for free)",
  "shipping_cost": 0,
  "capacity": "Number (reasonable estimate: 20-30 for intimate, 50-100 for medium, 200+ for large events)",
  "venue": "Name of the venue/restaurant/space (invent a realistic Barcelona name if not specified)",
  "address": "Full street address in Barcelona (invent a realistic one if needed)",
  "time_start": "HH:MM format (always provide a reasonable time)",
  "time_end": "HH:MM format (always provide a reasonable end time)",
  "age_restriction": "e.g. '+18 años', 'Todas las edades', '+16 años'",
  "age_groups": ["MUST use ONLY these exact IDs: todos, 18-25, 25-30, 30-40, 40-50, 50-60, 60+. Select ALL that apply based on the plan type. Example: a romantic dinner → ['25-30', '30-40', '40-50']. A family outing → ['todos']. A party → ['18-25', '25-30']."],
  "etiquetas": ["MUST use ONLY these exact IDs (select ALL that apply, at least 3-5): lgbtq, con-ninos, solo-adultos, pet-friendly, accesible, liberal, parejas, singles, cumpleanos, universitarios, fitness, mindfulness, musica-en-vivo, dj-electronica, baile, cata, instagrameable, aire-libre, indoor, escapada, espectaculo, taller, afterwork, tardeo, nocturno, fiesta, gastro, spa-relax, networking, gaming, internacional, local, gratis, premium, team-building, beach"],
  "tickets": [
    { "name": "General", "price": "10", "capacity": 100, "description": "Acceso general" }
  ],
  "schedule": [
    { "time": "20:00", "description": "Apertura de puertas" }
  ]
}

RULES:
- age_groups: ALWAYS include at least one. Choose the most appropriate age ranges for this plan.
- etiquetas: ALWAYS include at least 3. Pick all that genuinely apply.
- description: Write at least 3 paragraphs in Spanish. Be engaging and detailed.
- If the plan is a "plan" type (not evento), still fill venue/address/time fields if applicable.
- tickets and schedule are optional for "plan" type, but mandatory for "evento" type.
    `;

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
          { role: 'user', content: currentPlanData ? `CURRENT PLAN JSON:\n${JSON.stringify(currentPlanData)}\n\nUSER REQUESTED CHANGES:\n${prompt}` : `USER REQUEST:\n${prompt}` },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Groq API Error:', errorText);
      return NextResponse.json({ error: 'Failed to generate plan from AI' }, { status: response.status });
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    return NextResponse.json(resultJson);
  } catch (error) {
    console.error('Error generating plan:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
