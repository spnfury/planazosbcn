'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './login.module.css';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      router.push('/cuenta');
    } catch (err) {
      setError('Error al iniciar sesión. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <span className={styles.authIcon}>👋</span>
          <h1 className={styles.authTitle}>¡Hola de nuevo!</h1>
          <p className={styles.authSubtitle}>
            Inicia sesión para ver tus reservas y entradas
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleLogin}>
          {error && <div className={styles.authError}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="login-email">Email</label>
            <input
              type="email"
              id="login-email"
              className={styles.formInput}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="login-password">Contraseña</label>
            <input
              type="password"
              id="login-password"
              className={styles.formInput}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>

        <p className={styles.authFooter}>
          ¿No tienes cuenta?{' '}
          <Link href="/registro">Crear cuenta gratis</Link>
        </p>
      </div>
    </div>
  );
}
