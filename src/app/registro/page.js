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
  const [googleLoading, setGoogleLoading] = useState(false);

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

        <div className={styles.divider}>o</div>

        <button
          type="button"
          className={styles.googleBtn}
          disabled={googleLoading || loading}
          onClick={async () => {
            setGoogleLoading(true);
            setError('');
            const { error: oauthError } = await supabase.auth.signInWithOAuth({
              provider: 'google',
              options: {
                redirectTo: `${window.location.origin}/auth/callback`,
              },
            });
            if (oauthError) {
              setError('Error al conectar con Google. Inténtalo de nuevo.');
              setGoogleLoading(false);
            }
          }}
          id="register-google"
        >
          <svg className={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          {googleLoading ? 'Conectando...' : 'Continuar con Google'}
        </button>

        <p className={styles.authFooter}>
          ¿Ya tienes cuenta?{' '}
          <Link href="/login">Iniciar sesión</Link>
        </p>
      </div>
    </div>
  );
}
