'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from './registro.module.css';

export default function RegistroPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          setError('Este email ya está registrado. ¿Quieres iniciar sesión?');
        } else {
          setError('Error al crear la cuenta. Inténtalo de nuevo.');
        }
        setLoading(false);
        return;
      }

      // If email confirmation is required
      if (data.user && !data.session) {
        setSuccess('¡Cuenta creada! Revisa tu email para confirmar tu cuenta.');
        setLoading(false);
        return;
      }

      // Auto-login successful
      router.push('/cuenta');
    } catch (err) {
      setError('Error inesperado. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <span className={styles.authIcon}>🔥</span>
          <h1 className={styles.authTitle}>Crear cuenta</h1>
          <p className={styles.authSubtitle}>
            Únete a PlanazosBCN y gestiona tus reservas y entradas
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleRegister}>
          {error && <div className={styles.authError}>{error}</div>}
          {success && <div className={styles.authSuccess}>{success}</div>}

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
            disabled={loading || success}
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
