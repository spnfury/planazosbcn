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
Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido con la siguiente estructura:
{
  "platos": [
    {
      "nombre": "Nombre del plato (ej: Croquetas de jamón)",
      "descripcion": "Descripción detallada si existe, sino null",
      "precio": 12.50, // Solo el número, formato decimal. Si no hay precio, null
      "categoria": "Categoría (ej: Entrantes, Principales, Arroces, Postres, Vinos, Bebidas)",
      "alergenos": ["Gluten", "Lácteos"], // Array de strings si se deducen o indican, sino []
      "es_apto_menu": true // true para platos principales/entrantes/postres, false para bebidas/vinos/extras sueltos
    }
  ]
}
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', // Fast, good for JSON extraction
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
