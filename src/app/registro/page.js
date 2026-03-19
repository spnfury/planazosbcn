'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './registro.module.css';

export default function RegistroPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (ev) => setAvatarPreview(ev.target.result);
    reader.readAsDataURL(file);

    // Upload
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/upload-avatar', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Error al subir la foto');
      }
      const data = await res.json();
      setAvatarUrl(data.url);
    } catch (err) {
      console.error('Avatar upload error:', err);
      setError(`No se pudo subir la foto. Asegúrate de usar JPG/PNG y que no sea muy pesada.`);
      setAvatarPreview('');
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);

    try {
      // Create user via server-side admin API (bypasses email confirmation)
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          fullName,
          phone: phone || undefined,
          avatarUrl: avatarUrl || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.error || 'Error al crear la cuenta. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      // Auto-login after successful registration
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Account was created but auto-login failed — redirect to login
        setSuccess('¡Cuenta creada! Inicia sesión con tus credenciales.');
        setLoading(false);
        return;
      }

      router.push('/cuenta');
    } catch (err) {
      console.error('Register error:', err);
      setError('Error inesperado. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <img src="/logo-planazosbcn.png" alt="PlanazosBCN" className={styles.authIcon} />
          <h1 className={styles.authTitle}>Crear cuenta</h1>
          <p className={styles.authSubtitle}>
            Únete a PlanazosBCN y gestiona tus reservas y entradas
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleRegister}>
          {error && <div className={styles.authError}>{error}</div>}
          {success && <div className={styles.authSuccess}>{success}</div>}

          {/* Avatar Upload */}
          <div className={styles.avatarSection}>
            <button
              type="button"
              className={styles.avatarUploadBtn}
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingAvatar}
            >
              {avatarPreview ? (
                <img src={avatarPreview} alt="Tu foto" className={styles.avatarPreviewImg} />
              ) : (
                <div className={styles.avatarPlaceholder}>
                  <span className={styles.avatarPlaceholderIcon}>📷</span>
                  <span className={styles.avatarPlaceholderText}>Subir foto</span>
                </div>
              )}
              {uploadingAvatar && <div className={styles.avatarSpinner} />}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg, image/png, image/webp"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
              id="avatar-input"
            />
            <span className={styles.avatarHint}>Opcional · Toca para añadir tu foto</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="register-name">Nombre completo</label>
            <input
              type="text"
              id="register-name"
              className={styles.formInput}
              placeholder="Tu nombre"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="register-phone">Teléfono</label>
            <input
              type="tel"
              id="register-phone"
              className={styles.formInput}
              placeholder="+34 612 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="register-email">Email</label>
            <input
              type="email"
              id="register-email"
              className={styles.formInput}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="register-password">Contraseña</label>
            <input
              type="password"
              id="register-password"
              className={styles.formInput}
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="register-confirm">Confirmar contraseña</label>
            <input
              type="password"
              id="register-confirm"
              className={styles.formInput}
              placeholder="Repite tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading || success || uploadingAvatar}
            id="register-submit"
          >
            {loading ? 'Creando cuenta...' : 'Crear cuenta'}
          </button>
        </form>

        <p className={styles.authFooter}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
