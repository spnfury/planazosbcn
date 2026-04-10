'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './admin.module.css';

// ─── SVG Area Chart Component ───────────────────────────────────
function AreaChart({ data, color = '#3B82F6', gradientId = 'areaGrad' }) {
  if (!data || data.length === 0) return null;

  const maxVal = Math.max(...data.map((d) => d.scans), 1);
  const w = 600;
  const h = 180;
  const padX = 0;
  const padY = 10;
  const chartW = w - padX * 2;
  const chartH = h - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + (i / (data.length - 1)) * chartW,
    y: padY + chartH - (d.scans / maxVal) * chartH,
  }));

  const linePath = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${h} L ${points[0].x} ${h} Z`;

  // Y-axis labels
  const ySteps = [0, Math.round(maxVal / 2), maxVal];

  return (
    <div className={styles.areaChartWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.3" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ySteps.map((val, i) => {
          const y = padY + chartH - (val / maxVal) * chartH;
          return (
            <line
              key={i}
              x1={padX}
              y1={y}
              x2={w - padX}
              y2={y}
              stroke="rgba(255,255,255,0.06)"
              strokeDasharray="4,4"
            />
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill={`url(#${gradientId})`} />

        {/* Line */}
        <path d={linePath} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots on non-zero */}
        {points.map((p, i) =>
          data[i].scans > 0 ? (
            <circle key={i} cx={p.x} cy={p.y} r="3" fill={color} stroke="#161625" strokeWidth="1.5" />
          ) : null
        )}
      </svg>

      {/* X-axis labels below */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.25rem', padding: '0 0.25rem' }}>
        {data.filter((_, i) => i % 5 === 0 || i === data.length - 1).map((d, i) => (
          <span key={i} style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.25)', fontWeight: 600 }}>
            {new Date(d.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Horizontal Bar Chart Row ───────────────────────────────────
function HBarChart({ items, colorClass = 'Blue' }) {
  if (!items || items.length === 0) return null;

  const maxVal = Math.max(...items.map((i) => i.value), 1);

  return (
    <div>
      {items.map((item, idx) => {
        const pct = (item.value / maxVal) * 100;
        return (
          <div key={idx} className={styles.hBarRow}>
            <span className={styles.hBarRank}>{idx + 1}</span>
            <span className={styles.hBarLabel} title={item.label}>{item.label}</span>
            <div className={styles.hBarTrack}>
              <div
                className={`${styles.hBarFill} ${styles[`hBarFill${colorClass}`]}`}
                style={{ width: `${Math.max(pct, 2)}%` }}
              />
            </div>
            <span className={`${styles.hBarValue} ${styles[`hBarValue${colorClass}`]}`}>
              {item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main Dashboard ─────────────────────────────────────────────
export default function AdminDashboard() {
  const [supabase] = useState(() => createClient());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  async function loadDashboard() {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/dashboard-stats', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Cargando estadísticas...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={styles.emptyState}>
        <div className={styles.emptyIcon}>⚠️</div>
        <h3 className={styles.emptyTitle}>Error al cargar datos</h3>
        <p className={styles.emptyDesc}>No se pudieron cargar las estadísticas. Intenta recargar la página.</p>
      </div>
    );
  }

  const { counts, topPlansByScans, topQrCodes, dailyScans, recentReservations } = data;
  const totalScansLast30 = dailyScans.reduce((sum, d) => sum + d.scans, 0);

  return (
    <>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📊 Estadísticas</h1>
          <p className={styles.pageSubtitle}>Resumen general de PlanazosBCN</p>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconBlue}`}>📋</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>Total planes</div>
            <div className={styles.statValue}>{counts.totalPlans}</div>
          </div>
        </div>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconPurple}`}>🎉</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>Eventos</div>
            <div className={styles.statValue}>{counts.totalEvents}</div>
          </div>
        </div>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconGreen}`}>🎟️</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>Reservas pagadas</div>
            <div className={styles.statValue}>{counts.totalReservations}</div>
          </div>
        </div>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconOrange}`}>💰</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>Ingresos totales</div>
            <div className={styles.statValue}>{(counts.totalRevenue / 100).toFixed(0)}€</div>
          </div>
        </div>
      </div>

      {/* ── Extra mini stats: QR & Users ── */}
      <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconBlue}`}>📱</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>QR Codes creados</div>
            <div className={styles.statValue}>{counts.totalQrCodes}</div>
          </div>
        </div>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconPurple}`}>👁️</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>Scans totales</div>
            <div className={styles.statValue}>{counts.totalScans}</div>
          </div>
        </div>
        <div className={styles.statCardEnhanced}>
          <div className={`${styles.statCardIcon} ${styles.statCardIconGreen}`}>👥</div>
          <div className={styles.statCardBody}>
            <div className={styles.statLabel}>Usuarios registrados</div>
            <div className={styles.statValue}>{counts.totalUsers}</div>
          </div>
        </div>
      </div>

      {/* ── Charts ── */}
      <div className={styles.chartsGrid}>
        {/* Activity: last 30 days */}
        <div className={`${styles.chartCard} ${styles.chartCardFull}`}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartTitle}>📅 Actividad QR — Últimos 30 días</div>
              <div className={styles.chartSubtitle}>
                {totalScansLast30} scans en los últimos 30 días
              </div>
            </div>
          </div>
          {totalScansLast30 > 0 ? (
            <AreaChart data={dailyScans} color="#60A5FA" gradientId="activityGrad" />
          ) : (
            <div className={styles.chartEmpty}>
              <div className={styles.chartEmptyIcon}>📉</div>
              <div className={styles.chartEmptyText}>Aún no hay datos de scans en los últimos 30 días</div>
            </div>
          )}
        </div>

        {/* Top plans by scans */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartTitle}>🏆 Planes más visitados</div>
              <div className={styles.chartSubtitle}>Por scans de QR totales</div>
            </div>
          </div>
          {topPlansByScans.length > 0 ? (
            <HBarChart
              items={topPlansByScans.map((p) => ({ label: p.title, value: p.scans }))}
              colorClass="Blue"
            />
          ) : (
            <div className={styles.chartEmpty}>
              <div className={styles.chartEmptyIcon}>📋</div>
              <div className={styles.chartEmptyText}>No hay datos de QR scans aún</div>
            </div>
          )}
        </div>

        {/* Top QR codes ranking */}
        <div className={styles.chartCard}>
          <div className={styles.chartHeader}>
            <div>
              <div className={styles.chartTitle}>📱 Top QR Codes</div>
              <div className={styles.chartSubtitle}>Ranking por número de scans</div>
            </div>
          </div>
          {topQrCodes.length > 0 ? (
            <div className={styles.topQrList}>
              {topQrCodes.map((qr, idx) => (
                <div key={qr.id} className={styles.topQrItem}>
                  <div
                    className={`${styles.topQrRank} ${
                      idx === 0 ? styles.topQrRank1
                      : idx === 1 ? styles.topQrRank2
                      : idx === 2 ? styles.topQrRank3
                      : styles.topQrRankOther
                    }`}
                  >
                    {idx + 1}
                  </div>
                  <div className={styles.topQrInfo}>
                    <div className={styles.topQrLabel}>{qr.label}</div>
                    <div className={styles.topQrPlan}>{qr.plan_title}</div>
                  </div>
                  <div className={styles.topQrScans}>
                    {qr.scans}
                    <span className={styles.topQrScansUnit}>scans</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.chartEmpty}>
              <div className={styles.chartEmptyIcon}>📱</div>
              <div className={styles.chartEmptyText}>No hay QR codes creados aún</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Reservations ── */}
      {recentReservations.length > 0 && (
        <>
          <h2 className={styles.dashSectionTitle}>🎟️ Últimas reservas</h2>
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
                  <td data-label="Plan" style={{ fontWeight: 600, color: '#fff' }}>
                    {r.plans?.title || `Plan #${r.plan_id}`}
                  </td>
                  <td data-label="Email">{r.customer_email}</td>
                  <td data-label="Cantidad">{r.quantity}</td>
                  <td data-label="Total">{(r.total_amount / 100).toFixed(2)}€</td>
                  <td data-label="Estado">
                    <span className={`${styles.badge} ${
                      r.status === 'paid' ? styles.badgePaid
                      : r.status === 'pending' ? styles.badgePending
                      : styles.badgeCancelled
                    }`}>
                      {r.status === 'paid' ? 'Pagado' : r.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                    </span>
                  </td>
                  <td data-label="Fecha" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
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
