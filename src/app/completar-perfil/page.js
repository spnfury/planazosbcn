'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import styles from './completar-perfil.module.css';

export default function CompletarPerfilPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkUser() {
      const { data: { user: currentUser } } = await supabase.auth.getUser();

      if (!currentUser) {
        router.push('/login');
        return;
      }

      // Check if user already has phone
      const { data: profile } = await supabase
        .from('profiles')
        .select('phone')
        .eq('id', currentUser.id)
        .single();

      if (profile?.phone) {
        router.push('/cuenta');
        return;
      }

      setUser(currentUser);
      setChecking(false);
    }

    checkUser();
  }, [router]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!phone.trim()) {
      setError('Por favor, introduce tu número de teléfono');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ phone: phone.trim() })
        .eq('id', user.id);

      if (updateError) {
        console.error('Profile update error:', updateError);
        setError('Error al guardar el teléfono. Inténtalo de nuevo.');
        setLoading(false);
        return;
      }

      router.push('/cuenta');
    } catch (err) {
      console.error('Submit error:', err);
      setError('Error inesperado. Inténtalo de nuevo.');
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <div className={styles.authPage}>
        <div className={styles.authCard}>
          <div className={styles.loadingContainer}>
            <div className={styles.spinner} />
            <p>Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.authPage}>
      <div className={styles.authCard}>
        <div className={styles.authHeader}>
          <span className={styles.authIcon}>📱</span>
          <h1 className={styles.authTitle}>Casi listo</h1>
          <p className={styles.authSubtitle}>
            Necesitamos tu teléfono para completar tu perfil y poder contactarte sobre tus reservas
          </p>
        </div>

        <form className={styles.authForm} onSubmit={handleSubmit}>
          {error && <div className={styles.authError}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel} htmlFor="complete-phone">Teléfono</label>
            <input
              type="tel"
              id="complete-phone"
              className={styles.formInput}
              placeholder="+34 612 345 678"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              autoComplete="tel"
              autoFocus
            />
          </div>

          <button
            type="submit"
            className={styles.submitBtn}
            disabled={loading}
            id="complete-profile-submit"
          >
            {loading ? 'Guardando...' : 'Completar perfil'}
          </button>
        </form>
      </div>
    </div>
  );
}
