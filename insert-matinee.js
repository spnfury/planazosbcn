const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y'
);

async function main() {
  const plan = {
    slug: 'matinee-networking-vip',
    type: 'evento',
    title: 'Mesa VIP Compartida - Matinée',
    excerpt: '¿Ganas de VIP pero no sois suficientes? Compra tu plaza en mesa compartida, conoce gente top y vive el festival desde la zona exclusiva.',
    description: '<p>Disfruta de Matinée Gold Festival en una <strong>Mesa VIP Compartida</strong>. Hemos reservado mesas para que puedas comprar tu asistencia individualmente o en pareja y hacer <strong>Networking</strong> con otros perfiles similares.</p><ul><li>Acceso VIP sin colas.</li><li>Plaza en mesa reservada (botella incluida a compartir).</li><li>Conoce a 5 personas afines en tu mesa.</li><li>Te conectamos por un grupo antes del evento para "romper el hielo".</li></ul><p>¡Solo hay 12 plazas disponibles (2 mesas) así que vuela!</p>',
    image: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    poster_image: 'https://images.unsplash.com/photo-1470229722913-7c090be5f524?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'evento',
    category_label: 'Festival & VIP',
    zone: 'Barcelona',
    date: 'Próximo Evento',
    price: '95', // Precio ejemplo por plaza
    precio_reserva: 0,
    venue: 'Matinée Gold Festival',
    address: 'Barcelona',
    published: true,
    capacity: 12, // 2 mesas de 6
  };

  // 1. Insert Plan
  const { data: planData, error: planError } = await supabase
    .from('plans')
    .upsert([plan], { onConflict: 'slug' })
    .select();

  if (planError) {
    console.error('Error insertando el plan:', planError);
    return;
  }

  const planId = planData[0].id;
  console.log('✅ Plan Matinée creado con éxito:', planId);

  // 2. Insert Tickets
  const tickets = [
    {
      plan_id: planId,
      name: '🎟️ Plaza VIP - Mesa 1 (Networking)',
      description: 'Plaza individual en la Mesa VIP 1. Incluye acceso sin colas, parte proporcional de botella y networking garantizado.',
      price: '95',
      capacity: 6,
      spots_taken: 0,
      sold_out: false,
      sort_order: 1
    },
    {
      plan_id: planId,
      name: '🎟️ Plaza VIP - Mesa 2 (Networking)',
      description: 'Plaza individual en la Mesa VIP 2. Incluye acceso sin colas, parte proporcional de botella y networking garantizado.',
      price: '95',
      capacity: 6,
      spots_taken: 0,
      sold_out: false,
      sort_order: 2
    }
  ];

  const { error: ticketError } = await supabase
    .from('plan_tickets')
    .delete()
    .eq('plan_id', planId)
    .then(() => supabase.from('plan_tickets').insert(tickets));

  if (ticketError) {
    console.error('Error insertando tickets:', ticketError);
  } else {
    console.log('✅ Tickets (Mesa 1 y 2) creados con aforo de 6 cada uno.');
  }

  // 3. Insert Reel
  const reels = [
    {
      plan_id: planId,
      url: 'https://www.instagram.com/reel/C3M8WXXNAo9/', // You can swap this for the actual reel from Matinee
      sort_order: 1
    }
  ];

  const { error: reelError } = await supabase
    .from('plan_reels')
    .delete()
    .eq('plan_id', planId)
    .then(() => supabase.from('plan_reels').insert(reels));

  if (reelError) {
    console.error('Error insertando reel:', reelError);
  } else {
    console.log('✅ Reel de Instagram insertado.');
  }

  console.log(`\n🎉 Todo listo. Puedes verlo en: http://localhost:3000/planes/${plan.slug}`);
}

main().catch(console.error);
