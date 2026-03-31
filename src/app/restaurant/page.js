'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './restaurant.module.css';

export default function RestaurantDashboard() {
  const [supabase] = useState(() => createClient());
  const [restaurantUser, setRestaurantUser] = useState(null);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [recentValidations, setRecentValidations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get restaurant user from sessionStorage
    const cached = sessionStorage.getItem('restaurant_user');
    if (cached) {
      try {
        setRestaurantUser(JSON.parse(cached));
      } catch { /* ignore */ }
    }

    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const res = await fetch('/api/restaurant/reservations', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
        setRecentValidations(data.reservations.slice(0, 5));
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
    }
    setLoading(false);
  }

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 20) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  };

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>
            {greeting()} 👋
          </h1>
          <p className={styles.pageSubtitle}>
            {restaurantUser?.restaurants?.nombre || restaurantUser?.name || 'Tu restaurante'}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{loading ? '–' : stats.today}</div>
          <div className={styles.statLabel}>Validados hoy</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statValue}>{loading ? '–' : stats.total}</div>
          <div className={styles.statLabel}>Total validados</div>
        </div>
      </div>

      {/* Quick action */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(232, 93, 38, 0.15), rgba(255, 122, 69, 0.1))',
        border: '1px solid rgba(232, 93, 38, 0.2)',
        borderRadius: '16px',
        padding: '1.5rem',
        textAlign: 'center',
        marginBottom: '1.5rem',
      }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📱</div>
        <h3 style={{ color: '#fff', margin: '0 0 0.5rem', fontSize: '1.1rem', fontWeight: 700 }}>
          Escanear entrada
        </h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', margin: '0 0 1rem', fontSize: '0.85rem' }}>
          Escanea el código QR de la entrada del cliente para validarla
        </p>
        <a
          href="/restaurant/scanner"
          style={{
            display: 'inline-block',
            background: 'linear-gradient(135deg, #E85D26, #FF7A45)',
            color: '#fff',
            padding: '0.7rem 2rem',
            borderRadius: '12px',
            fontWeight: 700,
            fontSize: '0.95rem',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
          id="go-to-scanner"
        >
          Abrir Scanner
        </a>
      </div>

      {/* Recent Validations */}
      <div>
        <h2 className={styles.historyTitle}>📋 Últimas validaciones</h2>

        {loading ? (
          <div className={styles.loadingState}>
            <div className={styles.spinner} />
            <span>Cargando...</span>
          </div>
        ) : recentValidations.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>🎟️</div>
            <h3 className={styles.emptyTitle}>No hay validaciones todavía</h3>
            <p className={styles.emptyDesc}>Escanea un código QR para empezar</p>
          </div>
        ) : (
          <div className={styles.historyList}>
            {recentValidations.map((item) => (
              <div key={item.id} className={styles.historyItem}>
                <span className={styles.historyItemIcon}>✅</span>
                <div className={styles.historyItemInfo}>
                  <div className={styles.historyItemPlan}>
                    {item.plans?.title || `Plan #${item.plan_id}`}
                  </div>
                  <div className={styles.historyItemEmail}>
                    {item.customer_email}
                    {item.localizador && ` · ${item.localizador}`}
                  </div>
                </div>
                <div className={styles.historyItemTime}>
                  <div>
                    {new Date(item.validated_at).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </div>
                  <div className={styles.historyItemQty}>
                    {new Date(item.validated_at).toLocaleTimeString('es-ES', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                    {' · '}{item.quantity}x
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
