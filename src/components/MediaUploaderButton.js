'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function MediaUploaderButton({ onUpload, onError, className, text = '📤 Subir' }) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    if (onError) onError('');

    try {
      const supabase = createClient();
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
      if (!res.ok) throw new Error(result.error || 'Error al subir archivo');

      onUpload(result.url);
    } catch (err) {
      console.error('Upload error:', err);
      if (onError) onError(err.message || 'Error al subir archivo');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <>
      <button
        type="button"
        className={className}
        onClick={() => fileInputRef.current?.click()}
        disabled={uploading}
        style={{ whiteSpace: 'nowrap' }}
      >
        {uploading ? '⏳ Subiendo...' : text}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,image/*"
        onChange={handleFileUpload}
        style={{ display: 'none' }}
      />
    </>
  );
}
