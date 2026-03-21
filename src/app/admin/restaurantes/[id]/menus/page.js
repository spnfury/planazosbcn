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
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // AI Configurator State
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isExtractingDishes, setIsExtractingDishes] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showManualUpload, setShowManualUpload] = useState(false);
  
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

    // Load existing dishes
    const { data: dishesData } = await supabase
      .from('restaurant_dishes')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('categoria', { ascending: true });

    if (dishesData) setDishes(dishesData);
    
    setLoading(false);
  }

  // Extract structured dishes from raw text
  async function handleExtractDishes(text) {
    setIsExtractingDishes(true);
    try {
      const res = await fetch('/api/admin/restaurants/extract-dishes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pdfText: text, restaurantId }),
      });
      const data = await res.json();
      
      if (data.success) {
        setDishes(data.platos);
        alert(`¡Éxito! Se han extraído y guardado ${data.count} platos/bebidas de la carta.`);
        loadData(); // reload specifically to get them from DB with IDs
      } else {
        alert('Error extrayendo platos: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al extraer platos.');
    } finally {
      setIsExtractingDishes(false);
    }
  }

  // Extract text from the restaurant's existing PDF URL
  async function handleExtractFromUrl() {
    if (!restaurant?.pdf_url) return;
    
    setIsExtracting(true);
    try {
      // Fetch the PDF from the stored URL
      const pdfResponse = await fetch(restaurant.pdf_url);
      if (!pdfResponse.ok) throw new Error('No se pudo descargar el PDF');
      const pdfBlob = await pdfResponse.blob();
      
      const formData = new FormData();
      formData.append('file', pdfBlob, 'carta.pdf');
      formData.append('extractTextOnly', 'true');

      const res = await fetch('/api/admin/restaurants/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.text.trim().length < 50) {
           // Fallback a OCR si es un PDF escaneado (basado en imagen)
           try {
             const ocrRes = await fetch('/api/admin/restaurants/ocr-pdf', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ pdfUrl: restaurant.pdf_url })
             });
             const ocrData = await ocrRes.json();
             if (ocrData.success) {
                setPdfText(ocrData.text);
                await handleExtractDishes(ocrData.text);
             } else {
                alert('Aviso: Es una imagen y el OCR libre falló: ' + ocrData.error);
             }
           } catch(e) {
             alert('Aviso: Falló el procesador OCR.');
           }
           return;
        }
        setPdfText(data.text);
        await handleExtractDishes(data.text);
      } else {
        alert('Error: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('Error extrayendo texto del PDF: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  }

  // Extract text from a manually uploaded PDF file
  async function handleExtractFromFile(e) {
    if (e) e.preventDefault();
    if (!pdfFile) return alert('Selecciona un PDF primero');
    
    setIsExtracting(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('extractTextOnly', 'true');

      const res = await fetch('/api/admin/restaurants/upload-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      
      if (data.success) {
        if (data.text.trim().length < 50) {
           alert('Aviso: El texto extraído es muy corto (PDF de imagen). Para utilizar el lector OCR automático, por favor sube este PDF en la ficha del restaurante primero y usa el botón "Leer Carta".');
           setPdfText(data.text); // Still show what little we got
           return;
        }
        setPdfText(data.text);
        await handleExtractDishes(data.text);
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

  // Generate menu with AI using structured dishes
  async function handleGenerateMenu(e) {
    e.preventDefault();
    if (dishes.length === 0) {
      return alert('Primero extrae los platos de la carta.');
    }
    
    setIsGenerating(true);
    setGeneratedMenu(null);
    try {
      const res = await fetch('/api/admin/restaurants/generate-menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dishes, // send structured dishes instead of raw PDF text
          menuType,
          price,
          rules,
        }),
      });
      const data = await res.json();
      
      if (data.success) {
        setGeneratedMenu({ 
          ...data.menu, 
          nombre: data.menu.nombre || menuType, 
          precio: data.menu.precio || price,
          prompt_usado: data.prompt_usado 
        });
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

  // Save the generated menu to the database
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
      loadData();
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
          <Link href="/admin/restaurantes" className={styles.backLinkStyle}>
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

          {/* Step 1: PDF Source */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>1. Carta del Restaurante (PDF)</label>
            
            {restaurant.pdf_url ? (
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#ddd' }}>Carta ya subida</p>
                    <a href={restaurant.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#bcfe2f', textDecoration: 'underline' }}>
                      Ver PDF ↗
                    </a>
                  </div>
                  <button 
                    type="button" 
                    className={styles.btnPrimary}
                    onClick={handleExtractFromUrl}
                    disabled={isExtracting}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    {isExtracting ? 'Extrayendo...' : '📖 Leer Carta'}
                  </button>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowManualUpload(!showManualUpload)}
                  style={{ background: 'none', border: 'none', color: '#666', fontSize: '0.75rem', cursor: 'pointer', marginTop: '0.5rem', textDecoration: 'underline' }}
                >
                  {showManualUpload ? 'Ocultar' : '¿Usar otro PDF diferente?'}
                </button>

                {showManualUpload && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="application/pdf" 
                      className={styles.formInput} 
                      onChange={(e) => setPdfFile(e.target.files[0])}
                      style={{ flex: 1 }}
                    />
                    <button 
                      type="button" 
                      className={styles.btnSecondaryStyle}
                      onClick={handleExtractFromFile}
                      disabled={!pdfFile || isExtracting}
                    >
                      {isExtracting ? 'Extrayendo...' : 'Extraer Texto'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div>
                <p style={{ color: '#ff9944', fontSize: '0.8rem', marginBottom: '0.5rem' }}>⚠️ No hay carta PDF subida para este restaurante. Sube una aquí:</p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    className={styles.formInput} 
                    onChange={(e) => setPdfFile(e.target.files[0])}
                    style={{ flex: 1 }}
                  />
                  <button 
                    type="button" 
                    className={styles.btnSecondaryStyle}
                    onClick={handleExtractFromFile}
                    disabled={!pdfFile || isExtracting}
                  >
                    {isExtracting ? 'Extrayendo...' : 'Extraer Texto'}
                  </button>
                </div>
              </div>
            )}

            {isExtractingDishes && <p style={{color: '#ffcc00', fontSize: '0.8rem', marginTop: '0.5rem'}}>⏳ Analizando platos con IA... esto puede tardar unos segundos.</p>}
            
            {dishes.length > 0 && (
              <div style={{ marginTop: '1rem', padding: '1rem', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem'}}>
                  <h3 style={{ margin: 0, fontSize: '0.95rem', color: '#bcfe2f' }}>✓ {dishes.length} Platos/Bebidas en Base de Datos</h3>
                  {pdfText && (
                    <button onClick={() => handleExtractDishes(pdfText)} className={styles.btnSecondary} style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem'}}>
                      Re-extraer Platos
                    </button>
                  )}
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem', color: '#aaa', paddingRight: '0.5rem' }}>
                  {dishes.slice(0, 10).map((d, i) => (
                    <div key={i} style={{ borderBottom: '1px dashed #444', padding: '0.25rem 0', display: 'flex', justifyContent: 'space-between' }}>
                      <span>{d.nombre}</span>
                      <span>{d.precio ? d.precio + '€' : ''}</span>
                    </div>
                  ))}
                  {dishes.length > 10 && <div style={{textAlign: 'center', padding: '0.5rem', fontStyle: 'italic'}}>... y {dishes.length - 10} más.</div>}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleGenerateMenu}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Tipo / Nombre Menú</label>
                <input 
                  type="text" 
                  className={styles.formInput} 
                  value={menuType}
                  onChange={(e) => setMenuType(e.target.value)}
                  placeholder="Ej. Menú Premium"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Precio Orientativo (€)</label>
                <input 
                  type="number" 
                  className={styles.formInput} 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="Ej. 35"
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Instrucciones / Reglas (Lenguaje Natural)</label>
              <textarea 
                className={styles.formTextarea} 
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
              disabled={isGenerating || dishes.length === 0}
            >
              {isGenerating ? 'Generando menú...' : '🪄 Generar Menú'}
            </button>
          </form>

          {/* Generated AI Output - Editable */}
          {generatedMenu && (
            <div style={{ marginTop: '2rem', padding: '1rem', background: '#222', borderRadius: '8px', border: '1px solid #bcfe2f' }}>
              <h3 style={{ color: '#bcfe2f', marginBottom: '1rem', fontSize: '1.1rem' }}>Vista Previa (Edita antes de guardar)</h3>
              
              <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{flex: 2}}>
                  <label className={styles.formLabel}>Nombre del Menú</label>
                  <input type="text" className={styles.formInput} value={generatedMenu.nombre} onChange={e => setGeneratedMenu({...generatedMenu, nombre: e.target.value})} />
                </div>
                <div style={{flex: 1}}>
                  <label className={styles.formLabel}>Precio (€)</label>
                  <input type="number" className={styles.formInput} value={generatedMenu.precio} onChange={e => setGeneratedMenu({...generatedMenu, precio: e.target.value})} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#ffcc00' }}>
                  <input type="checkbox" checked={generatedMenu.incluye_vino} onChange={e => setGeneratedMenu({...generatedMenu, incluye_vino: e.target.checked})} />
                  🍷 Incluye sugerencia de vino
                </label>
              </div>

              <div style={{ marginTop: '1rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>
                {generatedMenu.contenido_estructurado?.map((course, idx) => {
                   const courseTitle = course.course || course.nombre || 'Sección';
                   const options = course.options || course.platos || [];
                   return (
                    <div key={idx} style={{ marginBottom: '1rem', padding: '1rem', background: '#2a2a2a', borderRadius: '6px' }}>
                      <input 
                         type="text"
                         style={{ background: 'transparent', border: 'none', borderBottom: '1px solid #555', color: '#bcfe2f', fontSize: '1rem', fontWeight: 'bold', width: '100%', marginBottom: '0.75rem', outline: 'none' }}
                         value={courseTitle}
                         onChange={e => {
                           const newContent = [...generatedMenu.contenido_estructurado];
                           if(newContent[idx].course !== undefined) newContent[idx].course = e.target.value;
                           else newContent[idx].nombre = e.target.value;
                           setGeneratedMenu({...generatedMenu, contenido_estructurado: newContent});
                         }}
                      />
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {options.map((opt, i) => {
                           const val = typeof opt === 'string' ? opt : opt.plato || opt.nombre || opt.name || (typeof opt === 'object' ? Object.values(opt)[0] : JSON.stringify(opt));
                           return (
                             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <span style={{color: '#666'}}>•</span>
                               <input 
                                 type="text"
                                 className={styles.formInput}
                                 style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', flex: 1 }}
                                 value={val}
                                 onChange={e => {
                                   const newContent = [...generatedMenu.contenido_estructurado];
                                   const optionsKey = newContent[idx].options ? 'options' : 'platos';
                                   
                                   // Keep it as a simple string to avoid restoring the object mess
                                   newContent[idx][optionsKey][i] = e.target.value;
                                   
                                   setGeneratedMenu({...generatedMenu, contenido_estructurado: newContent});
                                 }}
                               />
                               <button 
                                 type="button" 
                                 onClick={() => {
                                    const newContent = [...generatedMenu.contenido_estructurado];
                                    const optionsKey = newContent[idx].options ? 'options' : 'platos';
                                    newContent[idx][optionsKey].splice(i, 1);
                                    setGeneratedMenu({...generatedMenu, contenido_estructurado: newContent});
                                 }} 
                                 style={{ background: 'transparent', border: 'none', color: '#ff4444', cursor: 'pointer', fontSize: '1.2rem' }}
                               >
                                 ×
                               </button>
                             </div>
                           );
                        })}
                        <button 
                           type="button" 
                           onClick={() => {
                              const newContent = [...generatedMenu.contenido_estructurado];
                              const optionsKey = newContent[idx].options ? 'options' : 'platos';
                              if(!newContent[idx][optionsKey]) newContent[idx][optionsKey] = [];
                              newContent[idx][optionsKey].push('Nuevo patato');
                              setGeneratedMenu({...generatedMenu, contenido_estructurado: newContent});
                           }} 
                           style={{ background: '#333', border: '1px dashed #555', color: '#aaa', padding: '0.25rem', borderRadius: '4px', cursor: 'pointer', marginTop: '0.5rem', fontSize: '0.85rem' }}
                        >
                           + Añadir Plato
                        </button>
                      </div>
                    </div>
                  );
                })}
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
                      <strong style={{ fontSize: '0.85rem', color: '#aaa' }}>{course.course || course.nombre}</strong>
                      <div style={{ color: '#ccc', fontSize: '0.9rem' }}>
                         {(course.options || course.platos)?.map(opt => typeof opt === 'string' ? opt : opt.plato || opt.nombre || opt.name || (typeof opt === 'object' ? Object.values(opt)[0] : JSON.stringify(opt))).join(' / ')}
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
