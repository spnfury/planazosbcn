import { NextResponse } from 'next/server';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'placeholder',
});

export async function POST(req) {
  try {
    const { dishes, rules, price, menuType } = await req.json();

    if (!dishes || dishes.length === 0) {
      return NextResponse.json({ error: 'dishes array is required' }, { status: 400 });
    }

    // Build a price lookup map for post-processing validation
    const priceLookup = {};
    dishes.forEach(d => {
      if (d.nombre && d.precio) {
        priceLookup[d.nombre.toLowerCase().trim()] = d.precio;
      }
    });

    // Convert dishes to a readable format for the prompt
    const dishesList = dishes.map(d => `- ${d.nombre} → PRECIO REAL: ${d.precio ? d.precio + '€' : 'Sin precio'} [${d.categoria}]`).join('\n');

    const prompt = `
Eres un asistente experto en gastronomía y gestión de restaurantes. TODA tu respuesta debe estar EXCLUSIVAMENTE en ESPAÑOL. NUNCA uses inglés.

A continuación tienes la lista COMPLETA de platos reales extraídos de la carta del restaurante, CON SUS PRECIOS REALES:

<PLATOS_DISPONIBLES>
${dishesList}
</PLATOS_DISPONIBLES>

Diseña un menú de restaurante seleccionando platos EXCLUSIVAMENTE de la lista anterior.
- Tipo de menú / Nombre: ${menuType}
- Precio objetivo sugerido para el menú completo: ${price ? price + '€' : 'No especificado'}
- Reglas adicionales: ${rules}

REGLAS CRÍTICAS QUE DEBES CUMPLIR SIN EXCEPCIÓN:

1. **SOLO PLATOS DE LA CARTA**: Cada plato que incluyas en el menú DEBE existir LITERALMENTE en la lista <PLATOS_DISPONIBLES>. Copia el nombre TAL CUAL aparece arriba. NUNCA inventes platos nuevos.

2. **PROHIBIDO INVENTAR NOMBRES GENÉRICOS**: NUNCA uses nombres genéricos como "Opción de Carnes", "Opción de Pescados", "Plato del día", "A elegir", etc. Si las reglas dicen "carne o pescado a escoger", pon platos CONCRETOS de la carta como opciones (ej: "Txuletón de Burgos madurado 1Kg." y "Tronco merluza a la donostiarra").

3. **CATEGORÍAS ORIGINALES**: Respeta la categoría original de cada plato (indicada entre corchetes). Nunca pongas un plato en una sección que no corresponda a su categoría.

4. **TODO EN ESPAÑOL**: Absolutamente todo el contenido debe estar en español. Nunca uses palabras en inglés como "Suggestion", "wine", "option", etc.

5. **VINO**: Si se pide incluir vino, busca un vino CONCRETO de la lista de platos/bebidas. Si no hay vinos en la carta, indica "Vino de la casa" o "Sugerencia del sumiller". Siempre en español.

6. **NOMBRES DE SECCIÓN (course)**: Usa los nombres de categoría tal como aparecen en la carta original entre corchetes. No inventes secciones nuevas.

7. **PRECIO**: El precio del menú (campo "precio") debe ser EL PRECIO OBJETIVO indicado arriba (${price || 'el que corresponda'}), NO la suma de los precios individuales. NUNCA incluyas precios individuales de cada plato.

Devuelve la respuesta EXCLUSIVAMENTE en formato JSON válido con esta estructura:
{
  "nombre": "${menuType}",
  "precio": ${price || 0},
  "incluye_vino": true,
  "contenido_estructurado": [
    {
      "course": "Nombre de la sección de la carta (usar la categoría original entre corchetes)",
      "options": ["Nombre EXACTO del plato 1", "Nombre EXACTO del plato 2"]
    }
  ]
}

RECUERDA: Solo platos que existan en la lista. Todo en español. Sin nombres genéricos inventados.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.3-70b-versatile',
      response_format: { type: 'json_object' },
    });

    const resultText = chatCompletion.choices[0]?.message?.content || '{}';
    const jsonResult = JSON.parse(resultText);

    // Post-processing: calculate actual dish costs for transparency
    let costoRealPlatos = 0;
    const platosUsados = [];

    if (jsonResult.contenido_estructurado) {
      for (const course of jsonResult.contenido_estructurado) {
        const options = course.options || course.platos || [];
        for (const opt of options) {
          const nombre = typeof opt === 'string' ? opt : (opt.plato || opt.nombre || opt.name || '');
          const key = nombre.toLowerCase().trim();
          const precioReal = priceLookup[key];
          if (precioReal) {
            costoRealPlatos += precioReal;
            platosUsados.push({ nombre, precioReal });
          } else {
            // Try fuzzy match (contains)
            const fuzzyMatch = Object.entries(priceLookup).find(([k]) => k.includes(key) || key.includes(k));
            if (fuzzyMatch) {
              costoRealPlatos += fuzzyMatch[1];
              platosUsados.push({ nombre, precioReal: fuzzyMatch[1] });
            } else {
              platosUsados.push({ nombre, precioReal: null });
            }
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      menu: jsonResult,
      prompt_usado: prompt,
      precio_real_platos: Math.round(costoRealPlatos * 100) / 100,
      detalle_platos: platosUsados,
    });
  } catch (error) {
    console.error('Error generating menu with Groq:', error);
    return NextResponse.json({ error: 'Failed to generate menu', details: error.message }, { status: 500 });
  }
}
