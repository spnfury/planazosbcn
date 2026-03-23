'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../../../admin.module.css';

export default function EditarRestaurantePage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id;
  
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    tipo_comida: '',
    instagram_url: '',
    logo_url: '',
    reels: []
  });

  const [pdfFile, setPdfFile] = useState(null);
  const [existingPdf, setExistingPdf] = useState(null);
  
  const [importingIg, setImportingIg] = useState(false);
  const [igError, setIgError] = useState(null);
  const [newReelUrl, setNewReelUrl] = useState('');

  useEffect(() => {
    if (id) loadRestaurant();
  }, [id]);

  async function loadRestaurant() {
    setFetching(true);
    try {
      const { data, error } = await supabase
        .from('restaurants')
        .select('*')
        .eq('id', id)
        .single();
        
      if (error) throw error;
      if (data) {
        setFormData({
          nombre: data.nombre || '',
          direccion: data.direccion || '',
          tipo_comida: data.tipo_comida || '',
          instagram_url: data.instagram_url || '',
          logo_url: data.logo_url || '',
          reels: Array.isArray(data.reels) ? data.reels : []
        });
        setExistingPdf(data.pdf_url);
      }
    } catch (err) {
      console.error(err);
      setError('Error al cargar restaurante: ' + err.message);
    } finally {
      setFetching(false);
    }
  }

  // Listen for AI Assistant fill_form events
  useEffect(() => {
    function handleFillForm(e) {
      const data = e.detail;
      if (data) {
        setFormData((prev) => ({
          ...prev,
          ...(data.nombre !== undefined && { nombre: data.nombre }),
          ...(data.direccion !== undefined && { direccion: data.direccion }),
          ...(data.tipo_comida !== undefined && { tipo_comida: data.tipo_comida }),
          ...(data.instagram_url !== undefined && { instagram_url: data.instagram_url }),
        }));
      }
    }
    window.addEventListener('assistant:fill_form', handleFillForm);
    return () => window.removeEventListener('assistant:fill_form', handleFillForm);
  }, []);

  async function handleImportInstagram() {
    if (!formData.instagram_url) return;
    setImportingIg(true);
    setIgError(null);
    try {
      const res = await fetch('/api/admin/restaurants/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: formData.instagram_url })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al importar datos');
      
      setFormData(prev => ({
        ...prev,
        nombre: prev.nombre || data.name || '',
        logo_url: data.logoUrl || prev.logo_url || ''
      }));
    } catch (err) {
      setIgError(err.message);
    } finally {
      setImportingIg(false);
    }
  }

  function handleAddReel() {
    if (!newReelUrl.trim()) return;
    setFormData(prev => ({
      ...prev,
      reels: [...(prev.reels || []), newReelUrl.trim()]
    }));
    setNewReelUrl('');
  }

  function handleRemoveReel(index) {
    setFormData(prev => ({
      ...prev,
      reels: prev.reels.filter((_, i) => i !== index)
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    
    // Yield to the main thread so the browser can paint the button click state (fixes INP issue)
    await new Promise(resolve => setTimeout(resolve, 0));

    setLoading(true);
    setError(null);

    try {
      let pdf_url = existingPdf;

      // Upload PDF via server-side API (bypasses storage RLS)
      if (pdfFile) {
        const uploadForm = new FormData();
        uploadForm.append('file', pdfFile);

        const uploadRes = await fetch('/api/admin/restaurants/upload-pdf', {
          method: 'POST',
          body: uploadForm,
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Error al subir el PDF');
        
        pdf_url = uploadData.url;
      }

      const { error: updateError } = await supabase
        .from('restaurants')
        .update({
          ...formData,
          pdf_url
        })
        .eq('id', id);

      if (updateError) throw updateError;

      router.push(`/admin/restaurantes`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetching) {
    return (
      <div style={{ color: 'rgba(255,255,255,0.5)', padding: '2rem' }}>
        Cargando datos del restaurante...
      </div>
    );
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/restaurantes" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Volver a Restaurantes
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: '0.5rem' }}>Editar Restaurante</h1>
          <p className={styles.pageSubtitle}>Modifica los datos y la integración de Instagram</p>
        </div>
      </div>

      {error && <div className={styles.loginError} style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>🍽️ Información del restaurante</h3>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Nombre del Restaurante *</label>
              <input
                type="text"
                required
                className={styles.formInput}
                value={formData.nombre}
                onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                placeholder="Ej. Restaurante Bella Napoli"
                id="form-nombre"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Dirección</label>
              <input
                type="text"
                className={styles.formInput}
                value={formData.direccion}
                onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                placeholder="Calle, número, ciudad"
                id="form-direccion"
              />
            </div>

            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Tipo de Comida</label>
              <input
                type="text"
                className={styles.formInput}
                value={formData.tipo_comida}
                onChange={(e) => setFormData({ ...formData, tipo_comida: e.target.value })}
                placeholder="Ej. Italiana, Mediterránea"
                id="form-tipo-comida"
              />
            </div>
          </div>
        </div>

        {/* Instagram Import Section */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📱 Importar desde Instagram</h3>
          <div className={styles.formGrid}>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>URL del Perfil de Instagram</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="url"
                  className={styles.formInput}
                  value={formData.instagram_url}
                  onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                  placeholder="Ej. https://www.instagram.com/chicobar_bcn/"
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleImportInstagram}
                  disabled={importingIg || !formData.instagram_url}
                  className={styles.btnPrimary}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {importingIg ? 'Importando...' : 'Obtener Logo y Nombre'}
                </button>
              </div>
              {igError && <div style={{ color: '#EF4444', fontSize: '0.85rem', marginTop: '0.5rem' }}>{igError}</div>}
            </div>

            {formData.logo_url && (
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Logo Importado</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(255,255,255,0.02)', padding: '1rem', borderRadius: '8px' }}>
                  <img src={formData.logo_url} alt="Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <span style={{ fontSize: '0.9rem', color: '#A78BFA' }}>✓ Logo obtenido correctamente</span>
                    <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', wordBreak: 'break-all' }}>{formData.logo_url}</div>
                  </div>
                </div>
              </div>
            )}

            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Reels Virales Destacados (URLs)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="url"
                  className={styles.formInput}
                  value={newReelUrl}
                  onChange={(e) => setNewReelUrl(e.target.value)}
                  placeholder="Ej. https://www.instagram.com/reel/C-5Txy..."
                  style={{ flex: 1 }}
                />
                <button
                  type="button"
                  onClick={handleAddReel}
                  className={styles.actionBtn}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  Añadir Reel
                </button>
              </div>
              
              {formData.reels && formData.reels.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {formData.reels.map((url, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '0.5rem 1rem', borderRadius: '6px' }}>
                      <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>
                        {url}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveReel(i)}
                        style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '1rem' }}
                        title="Eliminar Reel"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PDF Upload */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📄 Carta en PDF</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Subir/Sustituir carta (Opcional)</label>
            {existingPdf && !pdfFile && (
              <div style={{ marginBottom: '1rem', padding: '1rem', background: 'rgba(188,254,47,0.1)', borderRadius: '8px' }}>
                <span style={{ color: '#bcfe2f' }}>✓ Ya hay un PDF adjunto. Si subes otro, se reemplazará.</span>
                <br/>
                <a href={existingPdf} target="_blank" rel="noreferrer" style={{ fontSize: '0.8rem', color: '#fff', textDecoration: 'underline', marginTop: '0.5rem', display: 'inline-block' }}>Ver PDF actual</a>
              </div>
            )}
            <div style={{
              border: '2px dashed rgba(255,255,255,0.12)',
              borderRadius: '12px',
              padding: '1.5rem',
              textAlign: 'center',
              background: 'rgba(255,255,255,0.02)',
              transition: 'all 180ms',
              cursor: 'pointer',
              position: 'relative',
            }}>
              <input
                type="file"
                accept="application/pdf"
                onChange={(e) => setPdfFile(e.target.files[0])}
                style={{
                  position: 'absolute',
                  inset: 0,
                  opacity: 0,
                  cursor: 'pointer',
                }}
                id="form-pdf"
              />
              {pdfFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <span style={{ fontSize: '1.5rem' }}>📎</span>
                  <span style={{ color: '#A78BFA', fontWeight: 600 }}>{pdfFile.name}</span>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                    style={{
                      background: 'rgba(239,68,68,0.1)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      color: '#EF4444',
                      borderRadius: '6px',
                      padding: '0.2rem 0.5rem',
                      cursor: 'pointer',
                      fontSize: '0.75rem',
                      marginLeft: '0.5rem',
                    }}
                  >✕ Eliminar</button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📄</div>
                  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', fontWeight: 500 }}>
                    Haz clic o arrastra un PDF aquí
                  </div>
                  <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                    Sube la carta para usarla luego con el configurador de menús
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => router.push('/admin/restaurantes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={loading}
            id="form-submit"
          >
            {loading ? 'Guardando...' : '✓ Guardar Cambios'}
          </button>
        </div>
      </form>
    </>
  );
}
