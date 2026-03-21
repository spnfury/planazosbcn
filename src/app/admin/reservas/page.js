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

  async function handleCancel(id) {
    if (!confirm('¿Estás seguro de que deseas cancelar esta reserva y reembolsar el pago en Stripe (si aplica)?')) {
      return;
    }
    
    try {
      const res = await fetch('/api/admin/reservas/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reservationId: id }),
      });
      
      const data = await res.json();
      
      if (data.success) {
        alert('Reserva cancelada y reembolso procesado exitosamente.');
        loadReservations(); // Reload to get fresh data
      } else {
        alert(data.error || 'Error al cancelar la reserva');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conectividad al intentar cancelar');
    }
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
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filtered.map((r) => (
              <tr key={r.id}>
                <td data-label="ID" style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>
                  <div>#{r.id}</div>
                  {r.stripe_payment_intent && (
                    <div style={{ fontSize: '0.65rem', marginTop: '4px', opacity: 0.7 }} title="Stripe Payment ID">
                      {r.stripe_payment_intent}
                    </div>
                  )}
                </td>
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
                <td data-label="Acciones">
                  {r.status !== 'cancelled' && (
                    <button
                      onClick={() => handleCancel(r.id)}
                      style={{
                        background: 'rgba(220, 38, 38, 0.2)',
                        color: '#ef4444',
                        border: '1px solid rgba(220, 38, 38, 0.4)',
                        padding: '4px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        transition: 'all 0.2s',
                        fontWeight: '600'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.4)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(220, 38, 38, 0.2)'; e.currentTarget.style.color = '#ef4444'; }}
                    >
                      Cancelar
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
