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

  // Dish Manager State
  const [showDishManager, setShowDishManager] = useState(false);
  const [editingDishId, setEditingDishId] = useState(null);
  const [editingDishData, setEditingDishData] = useState({});
  const [newDish, setNewDish] = useState({ nombre: '', categoria: '', precio: '' });
  const [savingDish, setSavingDish] = useState(false);

  // Helper: calculate real cost from the generated menu by matching dishes
  function calculateMenuRealCost(menu) {
    if (!menu?.contenido_estructurado) return { total: 0, totalCon10: 0, detalle: [] };
    let total = 0;
    const detalle = [];
    const priceLookup = {};
    dishes.forEach(d => {
      if (d.nombre && d.precio) {
        priceLookup[d.nombre.toLowerCase().trim()] = d.precio;
      }
    });
    for (const course of menu.contenido_estructurado) {
      const options = course.options || course.platos || [];
      for (const opt of options) {
        const nombre = typeof opt === 'string' ? opt : (opt.plato || opt.nombre || opt.name || '');
        if (!nombre.trim()) continue;
        const key = nombre.toLowerCase().trim();
        let precioReal = priceLookup[key] || null;
        if (!precioReal) {
          const fuzzy = Object.entries(priceLookup).find(([k]) => k.includes(key) || key.includes(k));
          if (fuzzy) precioReal = fuzzy[1];
        }
        if (precioReal) total += precioReal;
        detalle.push({ nombre, precioReal });
      }
    }
    return { total: Math.round(total * 100) / 100, totalCon10: Math.round(total * 0.9 * 100) / 100, detalle };
  }

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

  // === DISH MANAGER CRUD ===

  function startEditDish(dish) {
    setEditingDishId(dish.id);
    setEditingDishData({ nombre: dish.nombre, categoria: dish.categoria, precio: dish.precio || '', descripcion: dish.descripcion || '' });
  }

  function cancelEditDish() {
    setEditingDishId(null);
    setEditingDishData({});
  }

  async function saveEditDish(dishId) {
    setSavingDish(true);
    try {
      const { error } = await supabase
        .from('restaurant_dishes')
        .update({
          nombre: editingDishData.nombre,
          categoria: editingDishData.categoria,
          precio: editingDishData.precio ? parseFloat(editingDishData.precio) : null,
          descripcion: editingDishData.descripcion || null,
        })
        .eq('id', dishId);
      if (error) throw error;
      setEditingDishId(null);
      setEditingDishData({});
      loadData();
    } catch (err) {
      alert('Error guardando plato: ' + err.message);
    } finally {
      setSavingDish(false);
    }
  }

  async function deleteDish(dishId) {
    if (!confirm('¿Eliminar este plato?')) return;
    const { error } = await supabase.from('restaurant_dishes').delete().eq('id', dishId);
    if (error) alert('Error: ' + error.message);
    else loadData();
  }

  async function addNewDish() {
    if (!newDish.nombre.trim()) return alert('Escribe un nombre para el plato.');
    if (!newDish.categoria.trim()) return alert('Escribe una categoría.');
    setSavingDish(true);
    try {
      const { error } = await supabase.from('restaurant_dishes').insert([{
        restaurant_id: restaurantId,
        nombre: newDish.nombre.trim(),
        categoria: newDish.categoria.trim(),
        precio: newDish.precio ? parseFloat(newDish.precio) : null,
        alergenos: [],
        es_apto_menu: true,
        is_active: true,
      }]);
      if (error) throw error;
      setNewDish({ nombre: '', categoria: '', precio: '' });
      loadData();
    } catch (err) {
      alert('Error añadiendo plato: ' + err.message);
    } finally {
      setSavingDish(false);
    }
  }

  // Group dishes by category
  function getDishesByCategory() {
    const groups = {};
    dishes.forEach(d => {
      const cat = d.categoria || 'Sin clasificar';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(d);
    });
    return groups;
  }

  // Extract text from the restaurant's existing PDF URL
  async function handleExtractFromUrl() {
    if (!restaurant?.pdf_url) return;
    
    setIsExtracting(true);
    try {
      // Check if stored file is an image (by URL extension)
      const fileUrl = restaurant.pdf_url;
      const urlExt = fileUrl.split('.').pop()?.split('?')[0]?.toLowerCase();
      const isImage = ['png', 'jpg', 'jpeg', 'webp', 'heic'].includes(urlExt);

      if (isImage) {
        // Use OCR directly for images
        const ocrRes = await fetch('/api/admin/restaurants/ocr-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfUrl: fileUrl })
        });
        const ocrData = await ocrRes.json();
        if (ocrData.success && ocrData.text?.trim().length > 10) {
          setPdfText(ocrData.text);
          await handleExtractDishes(ocrData.text);
        } else {
          alert('No se pudo extraer texto de la imagen. ' + (ocrData.error || ''));
        }
        return;
      }

      // Fetch the PDF from the stored URL
      const pdfResponse = await fetch(fileUrl);
      if (!pdfResponse.ok) throw new Error('No se pudo descargar el archivo');
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
      alert('Error extrayendo texto: ' + err.message);
    } finally {
      setIsExtracting(false);
    }
  }

  // Extract text from a manually uploaded PDF file
  async function handleExtractFromFile(e) {
    if (e) e.preventDefault();
    if (!pdfFile) return alert('Selecciona un archivo primero');
    
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
      alert('Error extrayendo texto del archivo');
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
          prompt_usado: data.prompt_usado,
          precio_real_platos: data.precio_real_platos,
          detalle_platos: data.detalle_platos,
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
            <label className={styles.formLabel}>1. Carta del Restaurante (PDF / Imagen)</label>
            
            {restaurant.pdf_url ? (
              <div>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', padding: '0.75rem', background: '#222', borderRadius: '8px', border: '1px solid #333' }}>
                  <span style={{ fontSize: '1.5rem' }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: '#ddd' }}>Archivo ya subido</p>
                    <a href={restaurant.pdf_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.75rem', color: '#bcfe2f', textDecoration: 'underline' }}>
                      Ver archivo ↗
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
                  {showManualUpload ? 'Ocultar' : '¿Usar otro archivo diferente?'}
                </button>

                {showManualUpload && (
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <input 
                      type="file" 
                      accept="application/pdf,image/png,image/jpeg,image/webp,image/heic" 
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
                <p style={{ color: '#ff9944', fontSize: '0.8rem', marginBottom: '0.5rem' }}>⚠️ No hay carta subida para este restaurante. Sube una aquí (PDF o imagen):</p>
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                  <input 
                    type="file" 
                    accept="application/pdf,image/png,image/jpeg,image/webp,image/heic" 
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
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {pdfText && (
                      <button onClick={() => handleExtractDishes(pdfText)} className={styles.actionBtn} style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem'}}>
                        🔄 Re-extraer
                      </button>
                    )}
                    <button onClick={() => setShowDishManager(!showDishManager)} className={styles.actionBtn} style={{padding: '0.2rem 0.5rem', fontSize: '0.7rem', color: showDishManager ? '#bcfe2f' : undefined}}>
                      {showDishManager ? '✕ Cerrar Gestor' : '✏️ Gestionar Platos'}
                    </button>
                  </div>
                </div>

                {!showDishManager ? (
                  /* Compact preview */
                  <div style={{ maxHeight: '150px', overflowY: 'auto', fontSize: '0.8rem', color: '#aaa', paddingRight: '0.5rem' }}>
                    {dishes.slice(0, 10).map((d, i) => (
                      <div key={d.id || i} style={{ borderBottom: '1px dashed #444', padding: '0.25rem 0', display: 'flex', justifyContent: 'space-between' }}>
                        <span>{d.nombre}</span>
                        <span style={{ color: '#666', fontSize: '0.75rem' }}>{d.categoria}{d.precio ? ` · ${d.precio}€` : ''}</span>
                      </div>
                    ))}
                    {dishes.length > 10 && <div style={{textAlign: 'center', padding: '0.5rem', fontStyle: 'italic'}}>... y {dishes.length - 10} más. Pulsa "Gestionar Platos" para ver todos.</div>}
                  </div>
                ) : (
                  /* Full Dish Manager */
                  <div style={{ marginTop: '0.5rem' }}>
                    {Object.entries(getDishesByCategory()).map(([cat, catDishes]) => (
                      <div key={cat} style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', padding: '0.3rem 0.5rem', background: 'rgba(188,254,47,0.08)', borderRadius: '4px' }}>
                          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#bcfe2f' }}>{cat}</span>
                          <span style={{ fontSize: '0.7rem', color: '#666' }}>({catDishes.length})</span>
                        </div>

                        {catDishes.map(dish => (
                          <div key={dish.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 0.5rem', borderBottom: '1px solid #333', fontSize: '0.85rem' }}>
                            {editingDishId === dish.id ? (
                              /* Editing mode */
                              <>
                                <input
                                  type="text"
                                  value={editingDishData.nombre}
                                  onChange={e => setEditingDishData({...editingDishData, nombre: e.target.value})}
                                  className={styles.formInput}
                                  style={{ flex: 2, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                                  placeholder="Nombre del plato"
                                />
                                <input
                                  type="text"
                                  value={editingDishData.categoria}
                                  onChange={e => setEditingDishData({...editingDishData, categoria: e.target.value})}
                                  className={styles.formInput}
                                  style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                                  placeholder="Categoría"
                                />
                                <input
                                  type="number"
                                  value={editingDishData.precio}
                                  onChange={e => setEditingDishData({...editingDishData, precio: e.target.value})}
                                  className={styles.formInput}
                                  style={{ width: '60px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                                  placeholder="€"
                                />
                                <button onClick={() => saveEditDish(dish.id)} disabled={savingDish} style={{ background: 'none', border: 'none', color: '#22C55E', cursor: 'pointer', fontSize: '1rem' }} title="Guardar">✓</button>
                                <button onClick={cancelEditDish} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '1rem' }} title="Cancelar">✕</button>
                              </>
                            ) : (
                              /* View mode */
                              <>
                                <span style={{ flex: 1, color: '#ddd' }}>{dish.nombre}</span>
                                <span style={{ color: '#888', fontSize: '0.75rem', minWidth: '50px', textAlign: 'right' }}>{dish.precio ? dish.precio + '€' : ''}</span>
                                <button onClick={() => startEditDish(dish)} style={{ background: 'none', border: 'none', color: '#A78BFA', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.3rem' }} title="Editar">✏️</button>
                                <button onClick={() => deleteDish(dish.id)} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.85rem', padding: '0.1rem 0.3rem' }} title="Eliminar">🗑️</button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    ))}

                    {/* Add new dish */}
                    <div style={{ marginTop: '1rem', padding: '0.75rem', background: '#2a2a2a', borderRadius: '6px', border: '1px dashed #444' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#aaa', marginBottom: '0.5rem' }}>➕ Añadir plato manualmente</div>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          value={newDish.nombre}
                          onChange={e => setNewDish({...newDish, nombre: e.target.value})}
                          className={styles.formInput}
                          style={{ flex: 2, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          placeholder="Nombre del plato"
                        />
                        <input
                          type="text"
                          value={newDish.categoria}
                          onChange={e => setNewDish({...newDish, categoria: e.target.value})}
                          className={styles.formInput}
                          style={{ flex: 1, padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          placeholder="Categoría (ej: Pica-Pica)"
                        />
                        <input
                          type="number"
                          value={newDish.precio}
                          onChange={e => setNewDish({...newDish, precio: e.target.value})}
                          className={styles.formInput}
                          style={{ width: '60px', padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          placeholder="€"
                        />
                        <button onClick={addNewDish} disabled={savingDish} className={styles.btnPrimary} style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}>
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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

              {/* Live Cost Panel — recalculates on dish add/remove */}
              {(() => {
                const cost = calculateMenuRealCost(generatedMenu);
                const precioVenta = Number(generatedMenu.precio) || 0;
                const margen = precioVenta > 0 ? Math.round((1 - cost.totalCon10 / precioVenta) * 100) : 0;
                return cost.detalle.length > 0 ? (
                  <div style={{ padding: '1rem', borderRadius: '10px', marginBottom: '1rem', background: 'linear-gradient(135deg, rgba(188,254,47,0.08), rgba(0,0,0,0.3))', border: '1px solid rgba(188,254,47,0.25)' }}>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '0.75rem', color: '#bcfe2f' }}>💰 Análisis de Coste del Menú</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem' }}>Precio de venta menú</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#bcfe2f' }}>{precioVenta}€</div>
                      </div>
                      <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem' }}>Coste real individual</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#ff9944' }}>{cost.total}€</div>
                      </div>
                      <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem' }}>Coste individual -10%</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#66ccff' }}>{cost.totalCon10}€</div>
                      </div>
                      <div style={{ padding: '0.6rem', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', textAlign: 'center' }}>
                        <div style={{ fontSize: '0.7rem', color: '#888', marginBottom: '0.2rem' }}>Tu margen</div>
                        <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: margen >= 0 ? '#22C55E' : '#EF4444' }}>{margen}%</div>
                      </div>
                    </div>
                    <details style={{ fontSize: '0.75rem', color: '#999' }}>
                      <summary style={{ cursor: 'pointer', color: '#aaa' }}>Ver desglose por plato</summary>
                      <div style={{ marginTop: '0.4rem' }}>
                        {cost.detalle.map((p, i) => (
                          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #333', padding: '0.2rem 0' }}>
                            <span>{p.nombre}</span>
                            <span>{p.precioReal ? p.precioReal + '€' : '❓ Sin precio'}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', fontWeight: 'bold', borderTop: '1px solid #555', marginTop: '0.3rem', color: '#ddd' }}>
                          <span>TOTAL</span>
                          <span>{cost.total}€</span>
                        </div>
                      </div>
                    </details>
                  </div>
                ) : null;
              })()}              <div style={{ marginTop: '1rem', borderTop: '1px solid #444', paddingTop: '1rem' }}>
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
                           // Find matching dish for price display
                           const matchedDish = dishes.find(d => d.nombre.toLowerCase().trim() === val.toLowerCase().trim())
                             || dishes.find(d => d.nombre.toLowerCase().includes(val.toLowerCase()) || val.toLowerCase().includes(d.nombre.toLowerCase()));
                           return (
                             <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                               <span style={{color: '#666'}}>•</span>
                               <select
                                 className={styles.formInput}
                                 style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem', flex: 1, cursor: 'pointer' }}
                                 value={val}
                                 onChange={e => {
                                   const newContent = [...generatedMenu.contenido_estructurado];
                                   const optionsKey = newContent[idx].options ? 'options' : 'platos';
                                   newContent[idx][optionsKey][i] = e.target.value;
                                   setGeneratedMenu({...generatedMenu, contenido_estructurado: newContent});
                                 }}
                               >
                                 <option value="">— Seleccionar plato —</option>
                                 {Object.entries(getDishesByCategory()).map(([cat, catDishes]) => (
                                   <optgroup key={cat} label={cat}>
                                     {catDishes.map(d => (
                                       <option key={d.id} value={d.nombre}>
                                         {d.nombre}{d.precio ? ` (${d.precio}€)` : ''}
                                       </option>
                                     ))}
                                   </optgroup>
                                 ))}
                               </select>
                               {matchedDish?.precio && (
                                 <span style={{ fontSize: '0.75rem', color: '#ff9944', minWidth: '45px', textAlign: 'right' }}>{matchedDish.precio}€</span>
                               )}
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
                              newContent[idx][optionsKey].push('');
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
