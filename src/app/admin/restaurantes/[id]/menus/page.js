'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../../../admin.module.css';

export default function RestaurantMenusPage() {
  const router = useRouter();
  const params = useParams();
  const restaurantId = params.id;
  const [supabase] = useState(() => createClient());
  
  const [restaurant, setRestaurant] = useState(null);
  const [menus, setMenus] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Configurator State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [menuType, setMenuType] = useState('Menú Diario');
  const [price, setPrice] = useState('35');
  const [rules, setRules] = useState('Incluir buen vino. Carne o pescado a escoger.');
  const [generatedMenu, setGeneratedMenu] = useState(null);

  useEffect(() => {
    loadData();
  }, [restaurantId]);

  async function loadData() {
    // Load restaurant
    const { data: restData } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();
      
    if (restData) {
      setRestaurant(restData);
    }

    // Load existing menus
    const { data: menusData } = await supabase
      .from('restaurant_menus')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (menusData) setMenus(menusData);
    
    setLoading(false);
  }

  // 1. Extract text from PDF
  async function handleExtractText(e) {
    if (e) e.preventDefault();
    if (!pdfFile) return alert('Selecciona un PDF primero');
    
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);

      const res = await fetch('/api/admin/restaurants/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        setPdfText(data.text);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error extrayendo texto del PDF');
    } finally {
      setIsExtracting(false);
    }
  }

  // 2. Generate menu with AI
  async function handleGenerateMenu(e) {
    e.preventDefault();
    if (!pdfText) {
      return alert('Primero extrae el texto del PDF subiendo un archivo.');
    }
    
    setIsGenerating(true);
    setGeneratedMenu(null);
    try {
      const res = await fetch('/api/admin/restaurants/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pdfText,
          menuType,
          price,
          rules,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setGeneratedMenu({ ...data.menu, prompt_usado: data.prompt_usado });
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error generando menú');
    } finally {
      setIsGenerating(false);
    }
  }

  // 3. Save the generated menu to the database
  async function saveGeneratedMenu() {
    if (!generatedMenu) return;
    
    const { error } = await supabase.from('restaurant_menus').insert([{
      restaurant_id: restaurantId,
      nombre: generatedMenu.nombre,
      precio: generatedMenu.precio,
      incluye_vino: generatedMenu.incluye_vino,
      contenido_estructurado: generatedMenu.contenido_estructurado,
      prompt_usado: generatedMenu.prompt_usado,
    }]);

    if (error) {
      alert('Error guardando menú: ' + error.message);
    } else {
      alert('Menú guardado correctamente');
      setGeneratedMenu(null);
      loadData(); // Reload menus
    }
  }

  async function deleteMenu(menuId) {
    if(!confirm('¿Eliminar este menú?')) return;
    await supabase.from('restaurant_menus').delete().eq('id', menuId);
    loadData();
  }

  if (loading) return <p style={{padding: '2rem'}}>Cargando...</p>;
  if (!restaurant) return <p style={{padding: '2rem'}}>Restaurante no encontrado</p>;

  return (
    <div style={{ padding: '0', maxWidth: '1200px', margin: '0 auto' }}>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/restaurantes" className={styles.backLink}>
            ← Volver
          </Link>
          <h1 className={styles.pageTitle} style={{marginTop: '0.5rem'}}>{restaurant.nombre}</h1>
          <p className={styles.pageSubtitle}>Configurador de Menús Inteligente</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginTop: '2rem' }}>
        
        {/* LEFT COLUMN: IA Configurator */}
        <div style={{ background: '#1a1a1a', padding: '1.5rem', borderRadius: '12px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
            🤖 Generar Menú con IA
          </h2>

          <div className={styles.formGroup}>
            <label className={styles.label}>1. Subir/Elegir Carta (PDF)</label>
            <div style={{display: 'flex', gap: '1rem'}}>
              <input 
                type="file" 
                accept="application/pdf" 
                className={styles.input} 
                onChange={(e) => setPdfFile(e.target.files[0])}
              />
              <button 
                type="button" 
                className={styles.btnSecondary}
                onClick={handleExtractText}
                disabled={!pdfFile || isExtracting}
              >
                {isExtracting ? 'Extrayendo...' : 'Extraer Texto'}
              </button>
            </div>
            {pdfText && <p style={{color: '#bcfe2f', fontSize: '0.8rem', marginTop: '0.5rem'}}>✓ Texto extraído listo ({pdfText.length} caracteres)</p>}
          </div>

          <form onSubmit={handleGenerateMenu}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.label}>Tipo / Nombre Menú</label>
                <input 
                  type="text" 
                  className={styles.input} 
                  value={menuType}
                  onChange={(e) => setMenuType(e.target.value)}
                  placeholder="Ej. Menú Premium"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Precio Orientativo (€)</label>
                <input 
                  type="number" 
                  className={styles.input} 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej. 35"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Instrucciones / Reglas (Lenguaje Natural)</label>
              <textarea 
                className={styles.input} 
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                placeholder="Ej. Tiene que tener un primero, carne o pescado a escoger. Incluir buenos vinos."
                required
              />
            </div>

            <button 
              type="submit" 
              className={styles.btnPrimary} 
              style={{width: '100%', marginTop: '1rem'}}
              disabled={isGenerating || !pdfText}
            >
              {isGenerating ? 'Generando menú...' : '🪄 Generar Menú con Groq'}
            </button>
          </form>

          {/* Generated AI Output */}
          {generatedMenu && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#222', borderRadius: '8px', border: '1px solid #bcfe2f' }}>
              <h3 style={{ color: '#bcfe2f', marginBottom: '1rem' }}>Sugerencia Generada: {generatedMenu.nombre} ({generatedMenu.precio}€)</h3>
              {generatedMenu.incluye_vino && <p style={{fontSize: '0.9rem', color: '#ffcc00'}}>🍷 Incluye sugerencia de vino.</p>}
              
              <div style={{ marginTop: '1rem' }}>
                {generatedMenu.contenido_estructurado?.map((course, idx) => (
                  <div key={idx} style={{ marginBottom: '1rem' }}>
                    <strong style={{ display: 'block', color: '#ddd' }}>{course.course}</strong>
                    <ul style={{ margin: '0.5rem 0 0 1.5rem', color: '#aaa', fontSize: '0.9rem' }}>
                      {course.options?.map((opt, i) => (
                        <li key={i}>{opt}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button onClick={() => setGeneratedMenu(null)} className={styles.btnSecondary} style={{flex: 1}}>Descartar</button>
                <button onClick={saveGeneratedMenu} className={styles.btnPrimary} style={{flex: 1}}>Guardar Menú</button>
              </div>
            </div>
          )}
        </div>


        {/* RIGHT COLUMN: Saved Menus */}
        <div>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', borderBottom: '1px solid #333', paddingBottom: '0.5rem' }}>
            📋 Menús Guardados
          </h2>

          {menus.length === 0 ? (
            <p style={{ color: '#666' }}>No hay menús guardados para este restaurante.</p>
          ) : (
             <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {menus.map(menu => (
                <div key={menu.id} style={{ background: '#1a1a1a', padding: '1rem', borderRadius: '8px', border: '1px solid #333' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem' }}>{menu.nombre}</strong>
                      <span style={{ marginLeft: '1rem', color: '#bcfe2f' }}>{menu.precio}€</span>
                    </div>
                    <button onClick={() => deleteMenu(menu.id)} style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer' }}>🗑️</button>
                  </div>
                  
                  {menu.contenido_estructurado?.map((course, idx) => (
                    <div key={idx} style={{ marginBottom: '0.5rem' }}>
                      <strong style={{ fontSize: '0.85rem', color: '#aaa' }}>{course.course}</strong>
                      <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                         {course.options?.join(' / ')}
                      </div>
                    </div>
                  ))}
                  
                  {menu.incluye_vino && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: '#ffcc00' }}>🍷 Vino incluido</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
