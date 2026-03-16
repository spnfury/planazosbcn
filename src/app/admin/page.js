'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import styles from './admin.module.css';

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalPlans: 0,
    totalEvents: 0,
    totalReservations: 0,
    totalRevenue: 0,
  });
  const [recentReservations, setRecentReservations] = useState([]);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    // Plans count
    const { count: totalPlans } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true });

    const { count: totalEvents } = await supabase
      .from('plans')
      .select('*', { count: 'exact', head: true })
      .eq('type', 'evento');

    // Paid reservations
    const { data: reservations } = await supabase
      .from('reservations')
      .select('*')
      .eq('status', 'paid');

    const totalReservations = reservations?.length || 0;
    const totalRevenue = reservations?.reduce((sum, r) => sum + (r.total_amount || 0), 0) || 0;

    setStats({
      totalPlans: totalPlans || 0,
      totalEvents: totalEvents || 0,
      totalReservations,
      totalRevenue,
    });

    // Recent reservations
    const { data: recent } = await supabase
      .from('reservations')
      .select('*, plans(title)')
      .order('created_at', { ascending: false })
      .limit(5);

    setRecentReservations(recent || []);
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Dashboard</h1>
          <p className={styles.pageSubtitle}>Resumen general de PlanazosBCN</p>
        </div>
      </div>

      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Total planes</div>
          <div className={styles.statValue}>{stats.totalPlans}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Eventos</div>
          <div className={styles.statValue}>{stats.totalEvents}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Reservas pagadas</div>
          <div className={styles.statValue}>{stats.totalReservations}</div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statLabel}>Ingresos totales</div>
          <div className={styles.statValue}>{(stats.totalRevenue / 100).toFixed(0)}€</div>
        </div>
      </div>

      {/* Recent Reservations */}
      {recentReservations.length > 0 && (
        <>
          <h2 style={{ color: '#fff', fontFamily: 'var(--font-display)', fontSize: '1.1rem', fontWeight: 700, marginBottom: '1rem' }}>
            Últimas reservas
          </h2>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Plan</th>
                <th>Email</th>
                <th>Cantidad</th>
                <th>Total</th>
                <th>Estado</th>
                <th>Fecha</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {recentReservations.map((r) => (
                <tr key={r.id}>
                  <td style={{ fontWeight: 600, color: '#fff' }}>
                    {r.plans?.title || `Plan #${r.plan_id}`}
                  </td>
                  <td>{r.customer_email}</td>
                  <td>{r.quantity}</td>
                  <td>{(r.total_amount / 100).toFixed(2)}€</td>
                  <td>
                    <span className={`${styles.badge} ${
                      r.status === 'paid' ? styles.badgePaid
                      : r.status === 'pending' ? styles.badgePending
                      : styles.badgeCancelled
                    }`}>
                      {r.status === 'paid' ? 'Pagado' : r.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </td>
                  <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                    {new Date(r.created_at).toLocaleDateString('es-ES')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </>
  );
}
