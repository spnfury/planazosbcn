'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../../admin.module.css';

export default function NuevoRestaurantePage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    nombre: '',
    direccion: '',
    tipo_comida: ''
  });

  const [pdfFile, setPdfFile] = useState(null);

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
        }));
      }
    }
    window.addEventListener('assistant:fill_form', handleFillForm);
    return () => window.removeEventListener('assistant:fill_form', handleFillForm);
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      let pdf_url = null;

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

      const { data, error: insertError } = await supabase
        .from('restaurants')
        .insert([{
          ...formData,
          pdf_url
        }])
        .select()
        .single();

      if (insertError) throw insertError;

      router.push(`/admin/restaurantes/${data.id}/menus`);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <Link href="/admin/restaurantes" style={{ color: 'rgba(255,255,255,0.4)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
            ← Volver a Restaurantes
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: '0.5rem' }}>Nuevo Restaurante</h1>
          <p className={styles.pageSubtitle}>Añade un nuevo restaurante para configurar menús</p>
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

        {/* PDF Upload */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📄 Carta en PDF</h3>
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Subir carta (Opcional)</label>
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
            {loading ? 'Guardando...' : '✓ Crear Restaurante'}
          </button>
        </div>
      </form>
    </>
  );
}
