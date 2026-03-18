const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://hepwciepmhojfahycito.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlcHdjaWVwbWhvamZhaHljaXRvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MzY3MDk4OSwiZXhwIjoyMDg5MjQ2OTg5fQ.fbGg2DLWowcjceCqnW0Ap91sqjJ5BTZmb7k4TutJB6Y'
);

async function main() {
  const plan = {
    slug: 'luz-de-gas-vip',
    type: 'plan',
    title: 'Entrada VIP Luz de Gas',
    excerpt: 'Asegura tu entrada en Luz de Gas. Paga 2€ ahora y el resto en puerta.',
    description: '<p>Disfruta de una de las salas más míticas de Barcelona. <strong>Instrucciones:</strong> Al llegar a la puerta, muestra tu entrada digital de Planazos BCN desde el móvil. Solo tendrás que pagar 13€ en la taquilla, ya que los 2€ de gastos de gestión ya están pagados.</p><ul><li>Entrada sin colas preferente</li><li>Acceso garantizado hasta la 1:30h</li><li>Obligatorio buena presencia</li></ul>',
    image: 'https://images.unsplash.com/photo-1566737236500-c8ac43014a67?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
    poster_image: 'https://images.unsplash.com/photo-1545128485-c400e7702796?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    category: 'noche',
    category_label: 'Fiesta',
    zone: 'Eixample / Sant Gervasi',
    date: 'Todos los Fines de Semana',
    price: '15 €',
    precio_reserva: 2,
    venue: 'Luz de Gas',
    address: 'Carrer de Muntaner, 246, 08021 Barcelona',
    time_start: '23:30',
    time_end: '06:00',
    published: true,
    capacity: 200,
  };

  const { data, error } = await supabase
    .from('plans')
    .insert([plan])
    .select();

  if (error) {
    console.error('Error insertando el plan:', error);
  } else {
    console.log('✅ Plan Luz de Gas creado con éxito:', data[0].slug);
    console.log(`- Precio puerta: ${data[0].price}`);
    console.log(`- Precio pre-reserva (online): ${data[0].precio_reserva}€`);
  }
}

main().catch(console.error);
