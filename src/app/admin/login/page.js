'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function AdminLoginPage() {
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
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError('Email o contraseña incorrectos');
        setLoading(false);
        return;
      }

      // Check if user is admin
      const { data: adminUser, error: adminError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (adminError || !adminUser) {
        setError('No tienes permisos de administrador');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch (err) {
      setError('Error al iniciar sesión');
      setLoading(false);
    }
  }

  return (
    <div className={styles.loginPage}>
      <div className={styles.loginCard}>
        <div style={{ textAlign: 'center', marginBottom: '0.5rem' }}>
          <img src="/logo-planazosbcn.png" alt="PlanazosBCN" style={{ height: '70px', width: 'auto', objectFit: 'contain', borderRadius: '12px' }} />
        </div>
        <h1 className={styles.loginTitle}>PlanazosBCN</h1>
        <p className={styles.loginSubtitle}>Panel de Administración</p>

        <form className={styles.loginForm} onSubmit={handleLogin}>
          {error && <div className={styles.loginError}>{error}</div>}

          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Email</label>
            <input
              type="email"
              className={styles.formInput}
              placeholder="admin@planazosbcn.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              id="login-email"
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
              id="login-password"
            />
          </div>

          <button
            type="submit"
            className={styles.loginBtn}
            disabled={loading}
            id="login-submit"
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </div>
  );
}
