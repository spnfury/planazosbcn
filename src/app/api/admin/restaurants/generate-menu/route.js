import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    const { dishes, rules, price, menuType } = await req.json();

    if (!dishes || dishes.length === 0) {
      return NextResponse.json({ error: 'dishes array is required' }, { status: 400 });
    }

    // Convert dishes to a readable format for the prompt
    const dishesList = dishes.map(d => `- ${d.nombre} (${d.precio ? d.precio + '€' : 'Sin precio'}) [${d.categoria}]`).join('\n');

    const prompt = `
Eres un asistente experto en gastronomía y gestión de restaurantes.
A continuación tienes una lista estructurada de platos reales extraídos de la base de datos de un restaurante:

<PLATOS_DISPONIBLES>
${dishesList}
</PLATOS_DISPONIBLES>

Necesitamos que diseñes un menú de restaurante basado EXACTAMENTE en la carta anterior.
Aquí están las reglas y requerimientos para este menú:
- Tipo de menú / Nombre: ${menuType}
- Precio objetivo sugerido: ${price ? price + '€' : 'No especificado'}
- Reglas adicionales: ${rules}

El menú debe cumplir con lo siguiente:
- Platos reales extraídos de la carta.
- Si las reglas dicen "incluir buen vino", busca y sugiere un buen vino de la carta o indica que se debe incluir.
- Si dicen "Carne o pescado a escoger", asegúrate de dar opciones en los segundos.
- Si el precio o reglas exigen un orden (ej. tener un primero si es de 35€, o un segundo si es de 40€), respétalo.

Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido. Debe seguir ESTRICTAMENTE esta estructura:
{
  "nombre": "${menuType}",
  "precio": ${price || 0},
  "incluye_vino": true,
  "contenido_estructurado": [
    {
      "course": "Primero (o Pica Pica, Segundo, Postre, Bebida)",
      "options": ["Nombre del plato limpio", "Otro plato"] // IMPORTANTE: Solo texto plano simple con el nombre limpio. NUNCA incluyas el precio individual del plato aquí.
    }
  ]
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // using a fast standard model, can be upgraded to 70b
      response_format: { type: 'json_object' },
    });

    const resultText = chatCompletion.choices[0]?.message?.content || '{}';
    const jsonResult = JSON.parse(resultText);

    return NextResponse.json({ success: true, menu: jsonResult, prompt_usado: prompt });
  } catch (error) {
    console.error('Error generating menu with Groq:', error);
    return NextResponse.json({ error: 'Failed to generate menu', details: error.message }, { status: 500 });
  }
}
