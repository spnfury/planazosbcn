import Link from 'next/link';
import { supabase } from '@/lib/supabase';

// Force dynamic rendering so admin changes appear instantly
export const dynamic = 'force-dynamic';


export const metadata = {
  title: 'Restaurantes | PlanazosBCN',
  description: 'Descubre los mejores restaurantes y menús en Barcelona.',
};

export default async function RestaurantesPage() {
// ... earlier in the file ...
  const { data: restaurants, error } = await supabase
    .from('restaurants')
    .select('id, nombre, direccion, tipo_comida, logo_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching restaurants:', error);
  }

  return (
    <div style={{ padding: '10rem 1rem 4rem', maxWidth: '1200px', margin: '0 auto' }}>
      <style>{`
        .restaurant-card {
           background: #1a1a1a;
           border-radius: 24px;
           overflow: hidden;
           transition: transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease;
           border: 1px solid #333;
           height: 100%;
           display: flex;
           flex-direction: column;
         }
         .restaurant-card:hover {
           transform: translateY(-8px);
           border-color: #bcfe2f;
           box-shadow: 0 20px 40px rgba(188, 254, 47, 0.15);
         }
      `}</style>
      <div className="section-header" style={{ textAlign: 'center', marginBottom: '4rem' }}>
        <span className="section-header__label" style={{ color: '#e63946' }}>Para comérselo</span>
        <h1 className="section-header__title" style={{ fontSize: '3rem', marginTop: '1rem', color: '#111' }}>Gastro <span style={{color: '#bcfe2f', textShadow: '0 2px 10px rgba(0,0,0,0.1)'}}>Planazos</span></h1>
        <p className="section-header__subtitle" style={{ fontSize: '1.2rem', color: '#555', maxWidth: '600px', margin: '1rem auto 0' }}>
          Reserva mesa en los restaurantes más top de Barcelona con menús exclusivos seleccionados por nuestra comunidad.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem' }}>
        {restaurants?.map(rest => (
          <Link href={`/restaurantes/${rest.id}`} key={rest.id} style={{ display: 'block', textDecoration: 'none' }}>
            <div className="restaurant-card">
              <div style={{ height: '220px', background: 'linear-gradient(145deg, #2a2a2a, #161616)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                 {rest.logo_url ? (
                    <img src={rest.logo_url} alt={rest.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, position: 'absolute' }} />
                 ) : (
                    <span style={{ fontSize: '5rem', filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.5))' }}>🍽️</span>
                 )}
                 <div style={{position: 'absolute', top: '1.5rem', right: '1.5rem', background: '#000', color: '#bcfe2f', padding: '0.5rem 1rem', borderRadius: '30px', fontSize: '0.85rem', fontWeight: 'bold', zIndex: 2}}>
                    {rest.tipo_comida || 'Restaurante'}
                 </div>
                 {rest.logo_url && (
                   <div style={{position: 'absolute', bottom: '-2px', left: '2rem', width: '80px', height: '80px', borderRadius: '50%', overflow: 'hidden', border: '4px solid #1a1a1a', background: '#1a1a1a', zIndex: 2}}>
                     <img src={rest.logo_url} alt={`${rest.nombre} Logo`} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
                   </div>
                 )}
              </div>
              <div style={{ padding: rest.logo_url ? '1.5rem 2rem 2rem' : '2rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ fontSize: '1.6rem', color: '#fff', marginBottom: '0.5rem', margin: 0, marginTop: rest.logo_url ? '0.5rem' : '0' }}>{rest.nombre}</h3>
                <p style={{ color: '#aaa', fontSize: '1rem', marginBottom: '2rem', flex: 1 }}>{rest.direccion || 'Barcelona'}</p>
                <div style={{ color: '#bcfe2f', fontSize: '1.1rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  Seleccionar menú <span style={{fontSize: '1.5rem'}}>→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
        {(!restaurants || restaurants.length === 0) && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '4rem', color: '#555', background: '#f9f9f9', borderRadius: '24px', border: '1px solid #eee' }}>
             Próximamente añadiremos los mejores restaurantes de la ciudad...
          </div>
        )}
      </div>
    </div>
  );
}
