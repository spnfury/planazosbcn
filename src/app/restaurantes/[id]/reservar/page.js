'use client';

import { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function ReservarRestaurantePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const restaurantId = params.id;
  const menuId = searchParams.get('menu');

  const [supabase] = useState(() => createClient());
  const [restaurant, setRestaurant] = useState(null);
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    date: '',
    time: '',
    guests: '2',
    comments: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      // Fetch restaurant
      const { data: restData } = await supabase
        .from('restaurants')
        .select('id, nombre, direccion')
        .eq('id', restaurantId)
        .single();
      
      if (restData) setRestaurant(restData);

      // Fetch menu if provided
      if (menuId) {
        const { data: menuData } = await supabase
          .from('restaurant_menus')
          .select('id, nombre, precio')
          .eq('id', menuId)
          .single();
        if (menuData) setMenu(menuData);
      }
      
      setLoading(false);
    }
    loadData();
  }, [restaurantId, menuId]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      const res = await fetch('/api/restaurants/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          restaurantId,
          menuId,
          customerName: formData.name,
          customerEmail: formData.email,
          customerPhone: formData.phone,
          date: formData.date,
          time: formData.time,
          guests: formData.guests,
          comments: formData.comments,
        }),
      });
      
      const data = await res.json();
      if (data.success) {
        setSuccess(true);
        // We could redirect after 3 seconds or just show the success screen
      } else {
        alert(data.error || 'Error enviando la reserva. Por favor intenta de nuevo.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al enviar la reserva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#e63946', fontWeight: 'bold' }}>
        Cargando detalles de tu reserva...
      </div>
    );
  }

  if (success) {
    return (
      <div style={{ padding: '8rem 1rem 4rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center', color: '#111' }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🎉</div>
        <h1 style={{ fontSize: '3rem', color: '#e63946', marginBottom: '1rem', letterSpacing: '-1px', fontWeight: '900' }}>¡Reserva Solicitada!</h1>
        <p style={{ fontSize: '1.2rem', color: '#555', lineHeight: 1.6, marginBottom: '3rem' }}>
          Hemos enviado los detalles de tu mesa al restaurante <strong>{restaurant?.nombre}</strong>. Pronto recibirás una confirmación en tu correo electrónico.
        </p>
        <Link href={`/restaurantes/${restaurantId}`} style={{ display: 'inline-block', background: '#e63946', color: '#fff', padding: '1rem 2rem', borderRadius: '30px', textDecoration: 'none', fontWeight: 'bold', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='#c1121f'} onMouseOut={e=>e.currentTarget.style.background='#e63946'}>
          Volver a la carta del restaurante
        </Link>
      </div>
    );
  }

  return (
    <div style={{ padding: '8rem 1rem 4rem', maxWidth: '800px', margin: '0 auto', color: '#111' }}>
      <Link href={`/restaurantes/${restaurantId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', color: '#e63946', textDecoration: 'none', fontWeight: 'bold' }}>
        <span>←</span> Atrás
      </Link>

      <div style={{ background: '#fff', borderRadius: '24px', border: '1px solid #eaeaea', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.08)' }}>
        
        {/* Header Summary */}
        <div style={{ background: '#fafafa', padding: '2rem 3rem', borderBottom: '1px solid #eaeaea' }}>
          <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0', color: '#111', fontWeight: '900' }}>Reservar mesa en <span style={{color: '#e63946'}}>{restaurant?.nombre}</span></h1>
          {menu ? (
            <div style={{ color: '#555', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <span>🍽️ Menú Seleccionado: <strong>{menu.nombre}</strong></span>
              <span style={{ color: '#e63946', fontWeight: 'bold' }}>{menu.precio}€ / persona</span>
            </div>
          ) : (
            <p style={{ color: '#555', fontSize: '1.1rem', margin: 0 }}>🍽️ Reserva de mesa general (A la carta)</p>
          )}
        </div>

        {/* Form */}
        <div style={{ padding: '3rem' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Nombre Completo *</label>
                <input 
                  type="text" 
                  name="name" 
                  required 
                  value={formData.name} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e63946'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                  placeholder="Ej. María García"
                />
              </div>
              
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Correo Electrónico *</label>
                <input 
                  type="email" 
                  name="email" 
                  required 
                  value={formData.email} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e63946'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                  placeholder="tucorreo@ejemplo.com"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Teléfono de Contacto</label>
                <input 
                  type="tel" 
                  name="phone" 
                  value={formData.phone} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e63946'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                  placeholder="+34 600..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Número de Comensales *</label>
                <select 
                  name="guests" 
                  value={formData.guests} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none', appearance: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e63946'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                >
                  {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'persona' : 'personas'}</option>
                  ))}
                  <option value="12+">Más de 12 personas (Grupo)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Fecha *</label>
                <input 
                  type="date" 
                  name="date" 
                  required 
                  value={formData.date} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e63946'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Hora preferida *</label>
                <input 
                  type="time" 
                  name="time" 
                  required 
                  value={formData.time} 
                  onChange={handleChange}
                  style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none' }}
                  onFocus={e => e.target.style.borderColor = '#e63946'}
                  onBlur={e => e.target.style.borderColor = '#ccc'}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', color: '#333', fontSize: '0.9rem', fontWeight: 'bold' }}>Comentarios o Peticiones Adicionales</label>
              <textarea 
                name="comments" 
                rows="3" 
                value={formData.comments} 
                onChange={handleChange}
                style={{ width: '100%', padding: '1rem', background: '#fff', border: '1px solid #ccc', borderRadius: '12px', color: '#111', fontSize: '1rem', outline: 'none', resize: 'vertical' }}
                onFocus={e => e.target.style.borderColor = '#e63946'}
                onBlur={e => e.target.style.borderColor = '#ccc'}
                placeholder="Alergias, necesidades especiales, celebración..."
              ></textarea>
            </div>

            <button 
              type="submit" 
              disabled={isSubmitting}
              style={{ 
                marginTop: '1rem',
                background: isSubmitting ? '#ddd' : '#e63946', 
                color: isSubmitting ? '#888' : '#fff', 
                padding: '1.2rem', 
                borderRadius: '50px', 
                fontSize: '1.2rem', 
                fontWeight: '900', 
                border: 'none',
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s, transform 0.2s',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
              onMouseOver={e => !isSubmitting && (e.currentTarget.style.transform = 'translateY(-2px)')}
              onMouseOut={e => !isSubmitting && (e.currentTarget.style.transform = 'translateY(0)')}
            >
              {isSubmitting ? 'Procesando Reserva...' : 'Confirmar Solicitud de Reserva'}
            </button>
            <p style={{ textAlign: 'center', color: '#888', fontSize: '0.85rem', marginTop: '0.5rem' }}>
              Al enviar esta solicitud verificaremos la disponibilidad y te confirmaremos vía email.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
