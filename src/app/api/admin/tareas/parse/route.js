import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

async function verifyAdmin(request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.replace('Bearer ', '');
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabaseUser = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error } = await supabaseUser.auth.getUser();
  if (error || !user) return null;

  const { data: adminUser } = await supabaseAdmin
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single();

  return adminUser ? user : null;
}

export async function POST(request) {
  try {
    const admin = await verifyAdmin(request);
    if (!admin) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { text } = await request.json();

    if (!text || text.trim() === '') {
      return NextResponse.json({ error: 'El texto está vacío' }, { status: 400 });
    }

    // Call Groq API to parse the text into an array of tasks
    const systemPrompt = `
Eres un asistente que extrae tareas pendientes a partir de notas de texto, listas de viñetas (* o -) o mensajes de WhatsApp desestructurados.
Tu objetivo es analizar el texto que provee el usuario, aislar las diferentes "cosas por hacer" o "puntos de acción" (tareas), y devolver un JSON con un array de objetos. Incluso si son solo características o listas de servicios para un cliente, trátalos como tareas pendientes de implementar.

El esquema JSON requerido para cada tarea es:
{
  "title": "Un título conciso y procesable de la tarea (ej. 'Configurar paquete de redes sociales', 'Añadir a Google Maps', 'Intercambio publicidad')",
  "description": "El contexto adicional o cuándo debe hacerse",
  "client_name": "Si se infiere un cliente particular (ej. 'Sushi Samba'), pon su nombre aquí, si no, null",
  "priority": "normal" // Puede ser "baja", "normal", "alta" o "urgente"
}

Retorna ÚNICAMENTE un JSON con la estructura:
{
  "tasks": [...]
}
No añadas ningún texto antes ni después del JSON. Si no encuentras nada, devuelve {"tasks": []}.
`;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiResponse = chatCompletion.choices[0]?.message?.content || '{}';
    let parsedData;
    
    try {
      parsedData = JSON.parse(aiResponse);
    } catch (e) {
      console.error('Error parsing AI JSON:', e, aiResponse);
      return NextResponse.json({ error: 'El formato devuelto por la IA no es válido' }, { status: 500 });
    }

    const tasks = parsedData.tasks || [];

    if (tasks.length === 0) {
      return NextResponse.json({ success: true, count: 0, tasks: [] });
    }

    // Insert all extracted tasks into the database
    const tasksToInsert = tasks.map(t => ({
      title: t.title,
      description: t.description || null,
      client_name: t.client_name || null,
      status: 'pendiente',
      priority: ['baja', 'normal', 'alta', 'urgente'].includes(t.priority) ? t.priority : 'normal',
      created_by: admin.id
    }));

    const { data: insertedTasks, error } = await supabaseAdmin
      .from('pending_tasks')
      .insert(tasksToInsert)
      .select();

    if (error) {
      console.error('Supabase Insert Error:', error);
      throw error;
    }

    // Log the AI import action
    await supabaseAdmin.from('activity_logs').insert({
      action: 'task.imported_ai',
      entity_type: 'task',
      entity_id: insertedTasks[0]?.id || null, // Best effort
      user_id: admin.id,
      user_email: admin.email,
      status: 'success',
      details: { count: insertedTasks.length, raw_text: text.substring(0, 100) + '...' }
    });

    return NextResponse.json({ success: true, count: insertedTasks.length, tasks: insertedTasks });
  } catch (err) {
    console.error('API /api/admin/tareas/parse error:', err);
    return NextResponse.json({ 
      error: `Error interno: ${err.message}` 
    }, { status: 500 });
  }
}
