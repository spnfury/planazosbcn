import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import InstagramReels from '@/components/InstagramReels/InstagramReels';

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await supabase.from('restaurants').select('nombre').eq('id', id).single();
  return {
    title: `${data?.nombre || 'Restaurante'} | PlanazosBCN`,
  };
}

export default async function DetalleRestaurante({ params }) {
  const { id } = await params;
  const { data: restaurant, error: restError } = await supabase
    .from('restaurants')
    .select('*')
    .eq('id', id)
    .single();

  if (restError || !restaurant) {
    notFound();
  }

  // Fetch active menus
  const { data: menus } = await supabase
    .from('restaurant_menus')
    .select('*')
    .eq('restaurant_id', restaurant.id)
    .eq('is_active', true)
    .order('created_at', { ascending: true });

  return (
    <div style={{ padding: '8rem 1rem 4rem', maxWidth: '1000px', margin: '0 auto', color: '#111' }}>
      <style>{`
        .menu-reserve-btn {
          display: inline-block;
          background: #bcfe2f;
          color: #000;
          padding: 1.2rem 4rem;
          border-radius: 50px;
          font-size: 1.3rem;
          font-weight: 800;
          text-decoration: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: 0 10px 30px rgba(188, 254, 47, 0.4);
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .menu-reserve-btn:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 15px 40px rgba(188, 254, 47, 0.6);
        }
        .reel-card {
          background: #fafafa;
          border-radius: 16px;
          padding: 1.5rem;
          border: 1px solid #eaeaea;
          text-align: center;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .reel-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0,0,0,0.05);
        }
      `}</style>
      <Link href="/restaurantes" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem', color: '#e63946', textDecoration: 'none', fontWeight: 'bold', fontSize: '1.1rem' }}>
        <span>←</span> Volver a Gastro Planazos
      </Link>
      
      <div style={{ textAlign: 'center', marginBottom: '5rem', position: 'relative' }}>
        {restaurant.logo_url && (
            <div style={{ width: '120px', height: '120px', margin: '0 auto 1.5rem', borderRadius: '50%', overflow: 'hidden', border: '5px solid #fff', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}>
               <img src={restaurant.logo_url} alt={`${restaurant.nombre} Logo`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
        )}
        <span style={{ display: 'inline-block', background: 'rgba(230, 57, 70, 0.1)', color: '#e63946', padding: '0.6rem 1.5rem', borderRadius: '40px', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '1.5rem', border: '1px solid rgba(230, 57, 70, 0.2)' }}>
          {restaurant.tipo_comida || 'Restaurante Exclusivo'}
        </span>
        <h1 style={{ fontSize: '4.5rem', marginBottom: '1rem', letterSpacing: '-2px', fontWeight: '900', color: '#111' }}>{restaurant.nombre}</h1>
        <p style={{ fontSize: '1.2rem', color: '#555', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
          📍 {restaurant.direccion || 'Barcelona'}
        </p>
      </div>

      <div style={{ position: 'relative' }}>
         <div style={{ position: 'absolute', top: '-2rem', left: '50%', transform: 'translateX(-50%)', background: '#fff', padding: '0 2rem', zIndex: 1, color: '#888', letterSpacing: '2px', textTransform: 'uppercase', fontSize: '0.9rem', fontWeight: 'bold' }}>
           Nuestra Carta de Menús
         </div>
         <hr style={{ border: 'none', borderTop: '1px dashed #ccc', marginBottom: '4rem' }} />
      </div>

      {(!menus || menus.length === 0) ? (
        <p style={{ color: '#666', textAlign: 'center', padding: '5rem', background: '#f9f9f9', borderRadius: '24px', border: '1px solid #eee' }}>
          Consultando cartas... No hay menús disponibles por el momento.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4rem' }}>
          {menus.map((menu) => (
            <div key={menu.id} style={{ 
              background: '#fff', 
              borderRadius: '32px', 
              border: '1px solid #eaeaea',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.06)',
              position: 'relative'
            }}>
               <div style={{ 
                 background: '#fafafa', 
                 padding: '3rem', 
                 borderBottom: '1px solid #eaeaea', 
                 display: 'flex', 
                 justifyContent: 'space-between', 
                 alignItems: 'center', 
                 flexWrap: 'wrap', 
                 gap: '2rem' 
               }}>
                 <div>
                   <h3 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0', color: '#111', letterSpacing: '-1px', fontWeight: '900' }}>{menu.nombre}</h3>
                   {menu.incluye_vino && (
                     <span style={{ fontSize: '1rem', color: '#d4af37', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(212, 175, 55, 0.1)', padding: '0.4rem 1rem', borderRadius: '20px', fontWeight: 'bold' }}>
                       🍷 Maridaje sugerido incluido
                     </span>
                   )}
                 </div>
                 <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                   <div style={{ fontSize: '4rem', fontWeight: '900', lineHeight: 1, color: '#e63946' }}>{menu.precio}€</div>
                   <div style={{ fontSize: '1rem', color: '#666', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '0.5rem', fontWeight: 'bold' }}>Precio por persona</div>
                 </div>
               </div>

               <div style={{ padding: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '3rem' }}>
                 {menu.contenido_estructurado?.map((course, idx) => (
                   <div key={idx}>
                     <h4 style={{ 
                       fontSize: '1.2rem', 
                       color: '#111', 
                       marginBottom: '1.5rem', 
                       textTransform: 'uppercase', 
                       letterSpacing: '2px', 
                       borderBottom: '2px solid #e63946', 
                       display: 'inline-block', 
                       paddingBottom: '0.5rem',
                       fontWeight: '800'
                     }}>
                       {course.course || course.nombre}
                     </h4>
                     <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: '#444', fontSize: '1.1rem', lineHeight: 1.8 }}>
                        {(course.options || course.platos)?.map((opt, i) => {
                          const val = typeof opt === 'string' ? opt : opt.plato || opt.nombre || opt.name || (typeof opt === 'object' ? Object.values(opt)[0] : JSON.stringify(opt));
                          return (
                            <li key={i} style={{ marginBottom: '0.8rem', position: 'relative', paddingLeft: '1.5rem' }}>
                              <span style={{ position: 'absolute', left: 0, color: '#e63946', fontWeight: 'bold' }}>•</span>
                              <span style={{ color: '#333' }}>{val}</span>
                            </li>
                          );
                        })}
                     </ul>
                   </div>
                 ))}
               </div>

               <div style={{ padding: '2.5rem', background: '#fafafa', borderTop: '1px solid #eaeaea', textAlign: 'center' }}>
                  <Link href={`/restaurantes/${restaurant.id}/reservar?menu=${menu.id}`} className="menu-reserve-btn">
                    Reservar Mesa con este Menú
                  </Link>
               </div>
            </div>
          ))}
        </div>
      )}

      {/* Instagram Reels Section */}
      {restaurant.reels && restaurant.reels.length > 0 && (
        <div style={{ marginTop: '5rem', background: '#fff', borderRadius: '32px', border: '1px solid #eaeaea', overflow: 'hidden', padding: '3rem' }}>
          <InstagramReels reels={restaurant.reels.map((url) => ({ url }))} />
        </div>
      )}
    </div>
  );
}
