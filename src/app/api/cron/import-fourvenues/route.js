import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  // 1. Verify Vercel Cron Secret (only enforce in production to allow local testing)
  const authHeader = request.headers.get('authorization');
  if (
    process.env.NODE_ENV === 'production' &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    console.warn('Unauthorized cron invocation attempt');
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // 2. Setup FourVenues API Credentials
  const apiKey = process.env.FOURVENUES_API_KEY;
  if (!apiKey) {
     return NextResponse.json({ error: 'FOURVENUES_API_KEY no está configurado en las variables de entorno' }, { status: 500 });
  }

  try {
    // 3. Fetch events from FourVenues
    // Petición GET a la API de integraciones para obtener los eventos
    const response = await fetch('https://api.fourvenues.com/v1/integrations/events', {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'x-api-key': apiKey, // Dependiendo de la API, puede ser x-api-key o api-key
        // Si hay mas credenciales necesarias se añaden aquí, ej:
        // 'integration-id': process.env.FOURVENUES_INTEGRATION_ID || '',
      }
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('FourVenues API Error:', response.status, errText);
      return NextResponse.json({ error: 'Fallo al obtener datos de la API de FourVenues', details: errText }, { status: response.status });
    }

    const data = await response.json();
    const events = data.data || []; // Se asume formato JSON estandar con objeto "data"
    
    let importedCount = 0;
    let updatedCount = 0;
    const errors = [];

    // 4. Procesar cada evento y guardarlo en Supabase
    for (const event of events) {
      try {
        // Usamos el ID del evento de FourVenues para crear un slug único asegurando que no insertamos duplicados
        const eventId = event.id || Math.random().toString(36).substring(7);
        const uniqueSlug = `fourvenues-${eventId}`;

        // Mapeamos los datos de la API a nuestro esquema "plans"
        const planData = {
          slug: uniqueSlug,
          type: 'evento',
          title: event.name || 'Evento importado',
          description: event.description || '',
          image: event.image?.original?.url || '',
          poster_image: event.image?.original?.url || '',
          category: 'fiesta', // Categoría por defecto
          category_label: 'Sala / Fiesta',
          date: event.start_at ? new Date(event.start_at).toISOString().split('T')[0] : '', // Toma solo YYYY-MM-DD
          time_start: event.start_at ? new Date(event.start_at).toISOString().substring(11, 16) : '', // Toma solo HH:MM
          time_end: event.end_at ? new Date(event.end_at).toISOString().substring(11, 16) : '',
          capacity: event.capacity || 0,
          published: true, // Auto-publicar (se puede cambiar a false si quieres revisión manual)
          venue: event.venue?.name || 'Elizabeth Macias',
        };

        // Extraer link si existe en el payload
        if (event.link) {
          // Podemos guardar el link en description temporalmente o donde convenga, 
          // dependiendo si hay campo link en BBDD (no lo hay en schema explícitamente, pero es bueno tener constancia)
          planData.description = `${planData.description}\n\nEnlace original: ${event.link}`;
        }

        // Comprobamos si el evento ya existe
        const { data: existingPlan } = await supabaseAdmin
          .from('plans')
          .select('id')
          .eq('slug', uniqueSlug)
          .single();

        if (existingPlan) {
          // Actualizar datos del evento existente
          const { error: updateError } = await supabaseAdmin
            .from('plans')
            .update(planData)
            .eq('id', existingPlan.id);
            
          if (updateError) throw updateError;
          updatedCount++;
        } else {
          // Insertar como plan nuevo
          const { error: insertError } = await supabaseAdmin
            .from('plans')
            .insert([planData]);
            
          if (insertError) throw insertError;
          importedCount++;
        }

      } catch (err) {
        console.error(`Error procesando evento ${event.id}:`, err);
        errors.push({ id: event.id, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      mensaje: `Importación completada con éxito.`,
      importados: importedCount, 
      actualizados: updatedCount,
      errores: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('Error fatal detectado en el cron:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
