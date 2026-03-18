'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function AdminReservasPage() {
  const [supabase] = useState(() => createClient());
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadReservations();
  }, []);

  async function loadReservations() {
    const { data, error } = await supabase
      .from('reservations')
      .select('*, plans(title, slug)')
      .order('created_at', { ascending: false });

    if (!error) setReservations(data || []);
    setLoading(false);
  }

  const filtered = filter === 'all'
    ? reservations
    : reservations.filter((r) => r.status === filter);

  const totalRevenue = reservations
    .filter((r) => r.status === 'paid')
    .reduce((sum, r) => sum + (r.total_amount || 0), 0);

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reservas</h1>
          <p className={styles.pageSubtitle}>
            {reservations.length} reservas · {(totalRevenue / 100).toFixed(2)}€ ingresos totales
          </p>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['all', 'paid', 'pending', 'cancelled'].map((f) => (
          <button
            key={f}
            className={`${styles.actionBtn} ${filter === f ? styles.navItemActive : ''}`}
            onClick={() => setFilter(f)}
            style={filter === f ? { borderColor: 'var(--color-primary)', color: 'var(--color-primary)' } : {}}
          >
            {f === 'all' ? 'Todas' : f === 'paid' ? 'Pagadas' : f === 'pending' ? 'Pendientes' : 'Canceladas'}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🎟️</div>
          <h3 className={styles.emptyTitle}>No hay reservas</h3>
          <p className={styles.emptyDesc}>Las reservas aparecerán aquí cuando los clientes compren entradas</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>ID</th>
              <th>Plan</th>
              <th>Email</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td data-label="ID" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>#{r.id}</td>
                <td data-label="Plan" style={{ fontWeight: 600, color: '#fff' }}>{r.plans?.title || `Plan #${r.plan_id}`}</td>
                <td data-label="Email">{r.customer_email}</td>
                <td data-label="Cantidad">{r.quantity}</td>
                <td data-label="Total" style={{ fontWeight: 600 }}>
                  {r.total_amount === 0 ? 'Gratis' : `${(r.total_amount / 100).toFixed(2)}€`}
                </td>
                <td data-label="Estado">
                  <span className={`${styles.badge} ${
                    r.status === 'paid' ? styles.badgePaid
                    : r.status === 'pending' ? styles.badgePending
                    : styles.badgeCancelled
                  }`}>
                    {r.status === 'paid' ? '✓ Pagado' : r.status === 'pending' ? '⏳ Pendiente' : '✕ Cancelado'}
                  </span>
                </td>
                <td data-label="Fecha" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  {new Date(r.created_at).toLocaleString('es-ES', {
                    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
