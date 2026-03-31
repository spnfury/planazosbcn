'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function AdminPlanesPage() {
  const [supabase] = useState(() => createClient());
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    const { data, error } = await supabase
      .from('plans')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setPlans(data || []);
    setLoading(false);
  }

  async function togglePublished(plan) {
    const newVal = !plan.published;
    await supabase.from('plans').update({ published: newVal }).eq('id', plan.id);
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, published: newVal } : p))
    );
  }

  async function deletePlan(plan) {
    if (!confirm(`¿Eliminar "${plan.title}" permanentemente? Esta acción no se puede deshacer.`)) return;

    // Delete related data first (cascade should handle it, but be explicit)
    await supabase.from('plan_tags').delete().eq('plan_id', plan.id);
    await supabase.from('plan_tickets').delete().eq('plan_id', plan.id);
    await supabase.from('plan_guest_lists').delete().eq('plan_id', plan.id);
    await supabase.from('plan_schedule').delete().eq('plan_id', plan.id);

    const { error } = await supabase.from('plans').delete().eq('id', plan.id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }

    setPlans((prev) => prev.filter((p) => p.id !== plan.id));
  }

  function getCapacityColor(pct) {
    if (pct >= 80) return styles.capacityBarFillRed;
    if (pct >= 50) return styles.capacityBarFillOrange;
    return styles.capacityBarFillGreen;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Planes</h1>
          <p className={styles.pageSubtitle}>Gestiona todos los planes y eventos</p>
        </div>
        <Link href="/admin/planes/nuevo" className={styles.btnPrimary} id="nuevo-plan">
          ＋ Nuevo plan
        </Link>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      ) : plans.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📋</div>
          <h3 className={styles.emptyTitle}>No hay planes todavía</h3>
          <p className={styles.emptyDesc}>Crea tu primer plan o evento</p>
          <Link href="/admin/planes/nuevo" className={styles.btnPrimary}>
            ＋ Crear plan
          </Link>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Plan</th>
              <th>Tipo</th>
              <th>Categoría</th>
              <th>Precio</th>
              <th>Aforo</th>
              <th>Alojamiento</th>
              <th>Publicado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {plans.map((plan) => {
              const pct = plan.capacity > 0
                ? Math.round((plan.spots_taken / plan.capacity) * 100)
                : 0;

              return (
                <tr key={plan.id}>
                  <td data-label="Plan">
                    <div className={styles.planRow}>
                      {plan.image && (
                        <img
                          src={plan.image}
                          alt=""
                          className={styles.planThumb}
                        />
                      )}
                      <div>
                        <Link href={`/planes/${plan.slug}`} target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>
                          <span className={styles.planTitle} style={{ cursor: 'pointer' }}>{plan.title}</span>
                        </Link>
                        <Link href={`/planes/${plan.slug}`} target="_blank" style={{ textDecoration: 'none' }}>
                          <span className={styles.planSlug} style={{ cursor: 'pointer' }}>/{plan.slug} ↗</span>
                        </Link>
                      </div>
                    </div>
                  </td>
                  <td data-label="Tipo">
                    <span className={`${styles.badge} ${plan.type === 'evento' ? styles.badgeEvento : styles.badgePlan}`}>
                      {plan.type === 'evento' ? '🎉 Evento' : '📍 Plan'}
                    </span>
                  </td>
                  <td data-label="Categoría">{plan.category_label || plan.category}</td>
                  <td data-label="Precio" style={{ fontWeight: 600 }}>
                    {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€`}
                  </td>
                  <td data-label="Aforo">
                    <div className={styles.capacityBar}>
                      <div className={styles.capacityBarTrack}>
                        <div
                          className={`${styles.capacityBarFill} ${getCapacityColor(pct)}`}
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <span className={styles.capacityText}>
                        {plan.spots_taken}/{plan.capacity} ({pct}%)
                      </span>
                    </div>
                  </td>
                  <td data-label="Alojamiento">
                    {plan.alojamiento_hotel ? (
                      <span style={{ color: '#bcfe2f' }}>🏨 Sí</span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                    )}
                  </td>
                  <td data-label="Publicado">
                    <button
                      className={`${styles.toggle} ${plan.published ? styles.toggleActive : ''}`}
                      onClick={() => togglePublished(plan)}
                      id={`toggle-${plan.id}`}
                    >
                      <span className={styles.toggleDot} />
                    </button>
                  </td>
                  <td data-label="Acciones">
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/planes/${plan.id}`}
                        className={styles.actionBtn}
                      >
                        ✏️ Editar
                      </Link>
                      <Link
                        href={`/admin/generador-reels?id=${plan.id}`}
                        className={styles.actionBtn}
                        style={{background: 'rgba(168, 85, 247, 0.2)', color: '#d8b4fe'}}
                      >
                        🎬 Reel
                      </Link>
                      <button
                        className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                        onClick={() => deletePlan(plan)}
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </>
  );
}
