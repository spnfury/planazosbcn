import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'GROQ_API_KEY is not configured' }, { status: 500 });
    }

    const systemPrompt = `
You are a helpful data extraction assistant. The user will provide a natural language description for an event or plan in Barcelona.
Extract the relevant details and map them to the following JSON schema. Do not make up information that is not provided, leave string fields empty or numeric fields as 0 if missing.

Strictly output ONLY valid JSON without any markdown formatting wrappers. 

JSON format:
{
  "type": "plan" | "evento" | "sorpresa",
  "title": "A short and catchy title for the plan",
  "excerpt": "A brief summary",
  "description": "Full description of the plan",
  "category": "One of: gastro, naturaleza, cultura, rutas, nocturno, servicios, bienestar",
  "zone": "Neighborhood or zone, e.g. El Born",
  "date": "YYYY-MM-DD format if date mentioned",
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
}
    `;

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
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
