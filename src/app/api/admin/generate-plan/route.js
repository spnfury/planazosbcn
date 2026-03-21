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

    const systemPrompt = `
You are an expert AI Assistant specialized in Barcelona plans and events. 
${modificationContext}

Extract or expand the details and map them to the following JSON schema. Do not make up information that is not logically derivable, but DO expand creatively if you are creating a new plan.

Strictly output ONLY valid JSON without any markdown formatting wrappers. 

JSON format:
{
  "type": "plan" | "evento" | "sorpresa",
  "title": "A catchy title for the plan",
  "excerpt": "A brief, highly attractive summary",
  "description": "Full, beautifully written description of the plan or event",
  "category": "One of: gastro, naturaleza, cultura, rutas, nocturno, servicios, bienestar",
  "zone": "Neighborhood or zone, e.g. El Born, Gràcia",
  "date": "YYYY-MM-DD format if clearly indicated, else empty",
  "price": "Number as string, or 'Gratis'",
  "precio_reserva": 0,
  "shipping_cost": 0,
  "capacity": 50,
  "venue": "Name of the local/venue (for events)",
  "address": "Street address",
  "time_start": "HH:MM format",
  "time_end": "HH:MM format",
  "age_restriction": "e.g. +18 años",
  "age_groups": ["array of ids from: kid, teen, young, adult, senior, family"],
  "etiquetas": ["array of ids from: pet_friendly, accessible, musica_directo, vegan, romantico, grupo, exterior, interior, barato, premium"],
  "tickets": [
    { "name": "General", "price": "10", "capacity": 100, "description": "Acceso general" }
  ],
  "schedule": [
    { "time": "20:00", "description": "Apertura de puertas" }
  ]
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
