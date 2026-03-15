'use client';

import { useState } from 'react';
import styles from './Newsletter.module.css';

export default function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    // TODO: Connect to Supabase or email service
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1000);
  };

  return (
    <section className={styles.section} id="newsletter">
      <div className={`container ${styles.inner}`}>
        <div className={styles.content}>
          <span className={styles.emoji}>📬</span>
          <h2 className={styles.title}>No te pierdas ningún planazo</h2>
          <p className={styles.subtitle}>
            Recibe cada semana los mejores planes de Barcelona directamente en tu email. Sin spam, solo planes buenos.
          </p>

          {status === 'success' ? (
            <div className={styles.success}>
              <span className={styles.successIcon}>✅</span>
              <p>¡Genial! Ya estás suscrit@. Prepárate para los mejores planazos.</p>
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit} id="newsletter-form">
              <input
                type="email"
                className={styles.input}
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                id="newsletter-email"
              />
              <button
                type="submit"
                className={`btn btn--primary btn--large ${styles.button}`}
                disabled={status === 'loading'}
                id="newsletter-submit"
              >
                {status === 'loading' ? 'Enviando...' : '¡Me apunto!'}
              </button>
            </form>
          )}

          <p className={styles.privacy}>
            Solo planes. Nada de spam. Te puedes dar de baja cuando quieras.
          </p>
        </div>
      </div>
    </section>
  );
}
