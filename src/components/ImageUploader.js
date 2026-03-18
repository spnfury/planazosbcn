'use client';

import { useState, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import styles from '@/app/admin/admin.module.css';

/**
 * ImageUploader — Upload images from camera, gallery, or paste a URL.
 * Uploads via /api/admin/upload (server-side, bypasses storage RLS).
 *
 * Props:
 *   value: string (current image URL)
 *   onChange: (url: string) => void
 *   label: string (e.g. "Imagen principal")
 *   id: string (for accessibility)
 */
export default function ImageUploader({ value, onChange, label, id }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState(value ? 'preview' : 'empty'); // empty | preview | url
  const fileInputRef = useRef(null);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError('');
    setUploading(true);

    try {
      // Get current session token for auth
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No has iniciado sesión');

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al subir imagen');

      onChange(result.url);
      setMode('preview');
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'Error al subir imagen');
    } finally {
      setUploading(false);
      // Reset input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleRemove() {
    onChange('');
    setMode('empty');
    setError('');
  }

  function handleUrlMode() {
    setMode('url');
  }

  function handleUrlSubmit(url) {
    if (url.trim()) {
      onChange(url.trim());
      setMode('preview');
    }
  }

  // Preview with image
  if (mode === 'preview' && value) {
    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{label}</label>
        <div className={styles.imagePreview}>
          <img src={value} alt={label} className={styles.imagePreviewImg} />
          <div className={styles.imagePreviewActions}>
            <button
              type="button"
              className={styles.imagePreviewBtn}
              onClick={() => fileInputRef.current?.click()}
            >
              📷 Cambiar
            </button>
            <button
              type="button"
              className={`${styles.imagePreviewBtn} ${styles.imagePreviewBtnDanger}`}
              onClick={handleRemove}
            >
              ✕ Quitar
            </button>
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id={`${id}-file`}
        />
        {uploading && <div className={styles.uploadingBar}><div className={styles.uploadingBarFill} /></div>}
        {error && <p className={styles.uploadError}>{error}</p>}
      </div>
    );
  }

  // URL input mode
  if (mode === 'url') {
    return (
      <div className={styles.formGroup}>
        <label className={styles.formLabel}>{label}</label>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="url"
            className={styles.formInput}
            placeholder="https://..."
            defaultValue={value}
            onBlur={(e) => handleUrlSubmit(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleUrlSubmit(e.target.value);
              }
            }}
            autoFocus
            id={`${id}-url`}
            style={{ flex: 1 }}
          />
        </div>
        <button
          type="button"
          className={styles.imageUploadLink}
          onClick={() => setMode('empty')}
        >
          ← Volver
        </button>
      </div>
    );
  }

  // Empty state — upload buttons
  return (
    <div className={styles.formGroup}>
      <label className={styles.formLabel}>{label}</label>
      <div className={styles.imageUploadZone}>
        {/* Camera button — uses capture attribute for mobile */}
        <button
          type="button"
          className={styles.imageUploadBtn}
          onClick={() => {
            fileInputRef.current.setAttribute('capture', 'environment');
            fileInputRef.current.click();
          }}
        >
          <span className={styles.imageUploadIcon}>📸</span>
          <span>Cámara</span>
        </button>

        {/* Gallery button — no capture = opens gallery */}
        <button
          type="button"
          className={styles.imageUploadBtn}
          onClick={() => {
            fileInputRef.current.removeAttribute('capture');
            fileInputRef.current.click();
          }}
        >
          <span className={styles.imageUploadIcon}>🖼️</span>
          <span>Galería</span>
        </button>

        {/* URL option */}
        <button
          type="button"
          className={styles.imageUploadBtn}
          onClick={handleUrlMode}
        >
          <span className={styles.imageUploadIcon}>🔗</span>
          <span>URL</span>
        </button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
        id={`${id}-file`}
      />

      {uploading && (
        <div className={styles.uploadingBar}>
          <div className={styles.uploadingBarFill} />
        </div>
      )}
      {error && <p className={styles.uploadError}>{error}</p>}
    </div>
  );
}
