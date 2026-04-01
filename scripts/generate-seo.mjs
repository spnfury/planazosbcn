import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

if (!process.env.GROQ_API_KEY) {
  console.error("❌ Error: GROQ_API_KEY no encontrada en .env.local");
  process.exit(1);
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function extractItems() {
  // We use regex to extract items because Node.js without Next.js compiler 
  // might struggle with JSX or custom path aliases inside planConstants.js
  const constantsPath = path.join(__dirname, '..', 'src', 'data', 'planConstants.js');
  const code = fs.readFileSync(constantsPath, 'utf8');
  
  // Quick and dirty manual parse for MVP script
  const etiquetasMatch = code.match(/export const ETIQUETAS = \[([\s\S]*?)\];/);
  let tags = [];
  if (etiquetasMatch) {
    const arrContent = etiquetasMatch[1];
    const regex = /id:\s*'([^']+)',\s*label:\s*'([^']+)'/g;
    let match;
    while ((match = regex.exec(arrContent)) !== null) {
      tags.push({ id: match[1], label: match[2] });
    }
  }
  return tags;
}

const PROMPT_TEMPLATE = (tagLabel) => `
Eres un experto en SEO especializado en ocio y turismo en Barcelona.
Tu objetivo es generar fragmentos de texto SEO únicos, frescos y atractivos ("tipo influencer" pero informativos) para la categoría o hashtag "${tagLabel}".

Devuelve EXACTAMENTE UN JSON (sin markdown adicional, solo el objeto JSON) con la siguiente estructura:
{
  "description": "Meta description corta de max 150 caracteres para la página.",
  "heroSubtitle": "Subtítulo de una sola línea muy llamativo.",
  "heroDescription": "Descripción de unas 2-3 líneas para la cabecera, explicando qué puede encontrar el usuario.",
  "seoText": "Contenido SEO rico en formato HTML (usa <h2>, <h3>, <p>, <ul>). Habla sobre por qué Barcelona es genial para '${tagLabel}', zonas recomendadas y consejos. Unas 200 palabras."
}
`;

async function main() {
  console.log('Iniciando generador de contenido SEO con Groq...');
  
  const tags = await extractItems();
  console.log(`Se han encontrado ${tags.length} etiquetas.`);
  
  const seoFilePath = path.join(__dirname, '..', 'src', 'data', 'seoContent.json');
  let seoData = { tags: {}, categories: {} };
  
  if (fs.existsSync(seoFilePath)) {
    try {
      seoData = JSON.parse(fs.readFileSync(seoFilePath, 'utf8'));
    } catch {
      // ignore
    }
  }

  // Generate for all remaining tags
  const tagsToProcess = tags.filter(t => !seoData.tags[t.id]);
  
  if (tagsToProcess.length === 0) {
    console.log('✅ Todas las etiquetas ya tienen contenido SEO generado o has alcanzado el límite de prueba.');
    return;
  }

  for (const tag of tagsToProcess) {
    console.log(`🤖 Generando contenido para #${tag.id} (${tag.label}) ...`);
    
    try {
      const completion = await groq.chat.completions.create({
        messages: [
          { role: 'system', content: 'You are a helpful SEO assistant.' },
          { role: 'user', content: PROMPT_TEMPLATE(tag.label) }
        ],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.7,
        response_format: { type: 'json_object' }
      });
      
      const resJSON = JSON.parse(completion.choices[0]?.message?.content);
      
      seoData.tags[tag.id] = {
        description: resJSON.description,
        heroSubtitle: resJSON.heroSubtitle,
        heroDescription: resJSON.heroDescription,
        seoText: resJSON.seoText
      };
      
      console.log(`✅ Contenido de #${tag.id} generado exitosamente.`);
      
    } catch (err) {
      console.error(`❌ Error con ${tag.id}:`, err.message);
    }
    
    // Quick delay to respect rate limits
    await new Promise(r => setTimeout(r, 1000));
  }

  fs.writeFileSync(seoFilePath, JSON.stringify(seoData, null, 2));
  console.log('🎉 Archivo seoContent.json actualizado exitosamente!');
}

main().catch(console.error);
