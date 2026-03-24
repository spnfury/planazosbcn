'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

export default function AdminRestaurantsPage() {
  const [supabase] = useState(() => createClient());
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRestaurants();
  }, []);

  async function loadRestaurants() {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setRestaurants(data || []);
    setLoading(false);
  }

  async function deleteRestaurant(restaurant) {
    if (!confirm(`¿Eliminar "${restaurant.nombre}" permanentemente? Se borrarán también sus menús.`)) return;

    const { error } = await supabase.from('restaurants').delete().eq('id', restaurant.id);
    if (error) {
      alert('Error al eliminar: ' + error.message);
      return;
    }

    setRestaurants((prev) => prev.filter((r) => r.id !== restaurant.id));
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Restaurantes y Menús</h1>
          <p className={styles.pageSubtitle}>Gestiona restaurantes y configura menús con IA</p>
        </div>
        <Link href="/admin/restaurantes/nuevo" className={styles.btnPrimary} id="nuevo-restaurante">
          ＋ Nuevo Restaurante
        </Link>
      </div>

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      ) : restaurants.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🍽️</div>
          <h3 className={styles.emptyTitle}>No hay restaurantes todavía</h3>
          <p className={styles.emptyDesc}>Da de alta tu primer restaurante y configura sus menús.</p>
          <Link href="/admin/restaurantes/nuevo" className={styles.btnPrimary}>
            ＋ Crear restaurante
          </Link>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Nombre</th>
              <th>Dirección</th>
              <th>Tipo Comida</th>
              <th>Documento</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {restaurants.map((rest) => (
              <tr key={rest.id}>
                <td data-label="Nombre">
                  <span className={styles.planTitle}>{rest.nombre}</span>
                </td>
                <td data-label="Dirección">{rest.direccion || '-'}</td>
                <td data-label="Tipo Comida">{rest.tipo_comida || '-'}</td>
                <td data-label="Documento">
                  {rest.pdf_url ? (
                    <a href={rest.pdf_url} target="_blank" rel="noreferrer" style={{color: '#bcfe2f'}}>Ver carta</a>
                  ) : 'Sin carta adjunta'}
                </td>
                <td data-label="Acciones">
                  <div className={styles.actions} style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link
                      href={`/admin/restaurantes/${rest.id}/edit`}
                      className={styles.actionBtn}
                      style={{background: 'rgba(255, 255, 255, 0.1)', color: '#fff'}}
                      title="Editar Restaurante"
                    >
                      ✏️ Editar
                    </Link>
                    <Link
                      href={`/admin/restaurantes/${rest.id}/menus`}
                      className={styles.actionBtn}
                      style={{background: 'rgba(188, 254, 47, 0.2)', color: '#bcfe2f'}}
                    >
                      🤖 Configurar Menús
                    </Link>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => deleteRestaurant(rest)}
                      title="Eliminar restaurante"
                    >
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
