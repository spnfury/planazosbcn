'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../restaurant.module.css';

export default function RestaurantReservasPage() {
  const [supabase] = useState(() => createClient());
  const [reservations, setReservations] = useState([]);
  const [stats, setStats] = useState({ today: 0, total: 0 });
  const [restaurantName, setRestaurantName] = useState('');
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
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
        setReservations(data.reservations || []);
        setStats(data.stats || { today: 0, total: 0 });
        setRestaurantName(data.restaurant?.nombre || '');
      }
    } catch (err) {
      console.error('Error loading reservations:', err);
    }
    setLoading(false);
  }

  // Filter logic — for now filter by date range
  const today = new Date().toISOString().split('T')[0];

  const filtered = filter === 'all'
    ? reservations
    : filter === 'today'
    ? reservations.filter(r => r.validated_at && r.validated_at.startsWith(today))
    : filter === 'week'
    ? reservations.filter(r => {
        if (!r.validated_at) return false;
        const d = new Date(r.validated_at);
        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return d >= weekAgo;
      })
    : reservations;

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Mis Reservas</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${stats.total} entradas validadas en total`}
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

      {/* Filters */}
      <div className={styles.filterTabs}>
        {[
          { key: 'all', label: 'Todos' },
          { key: 'today', label: 'Hoy' },
          { key: 'week', label: 'Esta semana' },
        ].map((f) => (
          <button
            key={f.key}
            className={`${styles.filterTab} ${filter === f.key ? styles.filterTabActive : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Reservations List */}
      {loading ? (
        <div className={styles.loadingState}>
          <div className={styles.spinner} />
          <span>Cargando reservas...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎟️</div>
          <h3 className={styles.emptyTitle}>
            {filter !== 'all' ? 'Sin resultados' : 'No hay reservas validadas'}
          </h3>
          <p className={styles.emptyDesc}>
            {filter !== 'all'
              ? 'No hay validaciones en este período'
              : 'Las entradas validadas aparecerán aquí'}
          </p>
        </div>
      ) : (
        <div className={styles.reservationsList}>
          {filtered.map((r) => (
            <div key={r.id} className={styles.reservationCard}>
              <div className={styles.reservationHeader}>
                <div className={styles.reservationPlan}>
                  {r.plans?.title || `Plan #${r.plan_id}`}
                </div>
                <div className={styles.reservationBadge}>
                  ✓ Validado
                </div>
              </div>
              <div className={styles.reservationDetails}>
                <div className={styles.reservationDetail}>
                  <div className={styles.reservationDetailLabel}>Cliente</div>
                  <div className={styles.reservationDetailValue}>{r.customer_email}</div>
                </div>
                <div className={styles.reservationDetail}>
                  <div className={styles.reservationDetailLabel}>Cantidad</div>
                  <div className={styles.reservationDetailValue}>
                    {r.quantity} {r.quantity === 1 ? 'entrada' : 'entradas'}
                  </div>
                </div>
                {r.localizador && (
                  <div className={styles.reservationDetail}>
                    <div className={styles.reservationDetailLabel}>Localizador</div>
                    <div className={styles.reservationDetailValue} style={{ fontFamily: 'monospace' }}>
                      {r.localizador}
                    </div>
                  </div>
                )}
                <div className={styles.reservationDetail}>
                  <div className={styles.reservationDetailLabel}>Validado</div>
                  <div className={styles.reservationDetailValue}>
                    {r.validated_at
                      ? new Date(r.validated_at).toLocaleString('es-ES', {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : '—'}
                  </div>
                </div>
                {r.plans?.date && (
                  <div className={styles.reservationDetail}>
                    <div className={styles.reservationDetailLabel}>Fecha evento</div>
                    <div className={styles.reservationDetailValue}>{r.plans.date}</div>
                  </div>
                )}
                {r.plans?.venue && (
                  <div className={styles.reservationDetail}>
                    <div className={styles.reservationDetailLabel}>Lugar</div>
                    <div className={styles.reservationDetailValue}>{r.plans.venue}</div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
