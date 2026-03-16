'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import styles from '../admin.module.css';

export default function AdminPlanesPage() {
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
    if (!confirm(`¿Eliminar "${plan.title}"? Se despublicará y no será visible.`)) return;
    await supabase.from('plans').update({ published: false }).eq('id', plan.id);
    setPlans((prev) =>
      prev.map((p) => (p.id === plan.id ? { ...p, published: false } : p))
    );
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
                  <td>
                    <div className={styles.planRow}>
                      {plan.image && (
                        <img
                          src={plan.image}
                          alt=""
                          className={styles.planThumb}
                        />
                      )}
                      <div>
                        <span className={styles.planTitle}>{plan.title}</span>
                        <span className={styles.planSlug}>/{plan.slug}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={`${styles.badge} ${plan.type === 'evento' ? styles.badgeEvento : styles.badgePlan}`}>
                      {plan.type === 'evento' ? '🎉 Evento' : '📍 Plan'}
                    </span>
                  </td>
                  <td>{plan.category_label || plan.category}</td>
                  <td style={{ fontWeight: 600 }}>
                    {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€`}
                  </td>
                  <td>
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
                  <td>
                    <button
                      className={`${styles.toggle} ${plan.published ? styles.toggleActive : ''}`}
                      onClick={() => togglePublished(plan)}
                      id={`toggle-${plan.id}`}
                    >
                      <span className={styles.toggleDot} />
                    </button>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <Link
                        href={`/admin/planes/${plan.id}`}
                        className={styles.actionBtn}
                      >
                        ✏️ Editar
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
