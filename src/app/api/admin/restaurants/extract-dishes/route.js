import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { supabaseAdmin } from '@/lib/supabase-server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req) {
  try {
    const { pdfText, restaurantId } = await req.json();

    if (!pdfText || !restaurantId) {
      return NextResponse.json({ error: 'pdfText and restaurantId are required' }, { status: 400 });
    }

    const prompt = `
Eres un experto analizando cartas de restaurantes.
A continuación tienes el texto bruto extraído de una carta (PDF):

<CARTA>
${pdfText}
</CARTA>

Tu tarea es extraer TODOS los platos y bebidas de esta carta y estructurarlos.

REGLAS CRÍTICAS QUE DEBES SEGUIR AL PIE DE LA LETRA:

1. **CATEGORÍAS LITERALES**: Usa el nombre EXACTO de la sección o título tal como aparece en la <CARTA>. 
   - Si la sección se llama "Pica-Pica", la categoría es "Pica-Pica".
   - Si se llama "Para compartir", la categoría es "Para compartir".
   - Si se llama "Carnes a la brasa", la categoría es "Carnes a la brasa".
   - NUNCA uses nombres genéricos como "Entrantes", "Principales", "Primero", "Segundo", "Bebida" o "Postre" A NO SER que esas palabras exactas aparezcan como título de sección en el texto del PDF.

2. **NO INVENTES PLATOS**: Solo incluye platos que aparezcan EXPLÍCITAMENTE en el texto. Si un plato no está escrito en la <CARTA>, NO lo incluyas.

3. **NO CAMBIES NOMBRES**: Copia el nombre del plato TAL CUAL aparece en la carta. No lo reformules ni resumas.

4. **PRECIOS**: Extrae el precio exacto que aparece junto al plato. Si no hay precio visible, pon null.

5. **SI DUDAS de la categoría**: Usa "Sin clasificar" en vez de inventar una categoría.

Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido con la siguiente estructura:
{
  "platos": [
    {
      "nombre": "Nombre EXACTO del plato tal como aparece en la carta",
      "descripcion": "Descripción si existe en la carta, sino null",
      "precio": 12.50,
      "categoria": "Nombre LITERAL de la sección/título del PDF donde está el plato",
      "alergenos": ["Gluten", "Lácteos"],
      "es_apto_menu": true
    }
  ]
}

RECUERDA: Las categorías deben ser COPIA LITERAL de los títulos de sección del PDF. Los platos deben existir en el texto.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const resultText = chatCompletion.choices[0]?.message?.content || '{}';
    const jsonResult = JSON.parse(resultText);

    if (!jsonResult.platos || !Array.isArray(jsonResult.platos)) {
      throw new Error('El formato devuelto por la IA no contiene el array de platos esperado.');
    }

    // Prepare data directly to Supabase
    const dishesToInsert = jsonResult.platos.map(p => ({
      restaurant_id: restaurantId,
      nombre: p.nombre,
      descripcion: p.descripcion || null,
      precio: p.precio || null,
      categoria: p.categoria || 'Sin clasificar',
      alergenos: p.alergenos || [],
      es_apto_menu: typeof p.es_apto_menu === 'boolean' ? p.es_apto_menu : true,
      is_active: true
    }));

    // Delete existing dishes for this restaurant before re-inserting (avoids duplicates on re-extraction)
    await supabaseAdmin
      .from('restaurant_dishes')
      .delete()
      .eq('restaurant_id', restaurantId);

    // Insert into database using admin privileges
    const { error: insertError } = await supabaseAdmin
      .from('restaurant_dishes')
      .insert(dishesToInsert);

    if (insertError) {
      throw insertError;
    }

    return NextResponse.json({ success: true, count: dishesToInsert.length, platos: dishesToInsert });
  } catch (error) {
    console.error('Error extracting dishes with Groq:', error);
    return NextResponse.json({ error: 'Failed to extract dishes', details: error.message }, { status: 500 });
  }
}
