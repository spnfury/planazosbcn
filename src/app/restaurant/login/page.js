'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../restaurant.module.css';

export default function RestaurantLoginPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 1. Sign in with Supabase Auth
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // 2. Check if user is a restaurant user
      const res = await fetch('/api/restaurant/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: data.user.id }),
      });

      const authData = await res.json();

      if (!res.ok || !authData.isRestaurant) {
        setError('No tienes permisos de comercio');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      // 3. Store restaurant user info in sessionStorage for quick access
      sessionStorage.setItem('restaurant_user', JSON.stringify(authData.user));

      router.push('/restaurant');
    } catch (err) {
      console.error('Login error:', err);
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <img
            src="/logo-planazosbcn.png"
            alt="PlanazosBCN"
            className={styles.loginLogo}
          />
        </div>
        <h1 className={styles.loginTitle}>PlanazosBCN</h1>
        <p className={styles.loginSubtitle}>Portal de Comercios</p>

        <form className={styles.loginForm} onSubmit={handleLogin}>
          {error && <div className={styles.loginError}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              className={styles.formInput}
              placeholder="tu@restaurante.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="restaurant-login-email"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Contraseña</label>
            <input
              type="password"
              className={styles.formInput}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              id="restaurant-login-password"
            />
          </div>

          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading}
            id="restaurant-login-submit"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
