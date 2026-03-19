'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '../admin.module.css';

export default function AdminResenasPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadReviews();
  }, []);

  async function loadReviews() {
    try {
      const res = await fetch('/api/admin/reviews');
      if (!res.ok) throw new Error('Error cargando reseñas');
      const data = await res.json();
      setReviews(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(id, currentStatus) {
    const newStatus = currentStatus === 'public' ? 'hidden' : 'public';
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      
      if (!res.ok) throw new Error('Error al actualizar');
      
      setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
    } catch (err) {
      alert(err.message);
    }
  }

  async function deleteReview(id) {
    if (!confirm('¿Seguro que quieres borrar esta reseña de forma permanente?')) return;
    
    try {
      const res = await fetch(`/api/admin/reviews?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al borrar');
      
      setReviews(reviews.filter(r => r.id !== id));
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = reviews.filter((r) => {
    const q = search.toLowerCase();
    return (
      (r.comment || '').toLowerCase().includes(q) ||
      (r.profiles?.full_name || '').toLowerCase().includes(q) ||
      (r.plans?.title || '').toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Reseñas</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${reviews.length} valoraciones en total`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          className={styles.formInput}
          placeholder="🔍 Buscar por comentario, usuario o plan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ maxWidth: '400px', width: '100%' }}
        />
      </div>

      {error && (
        <div className={styles.loginError} style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando reseñas...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>⭐</div>
          <h3 className={styles.emptyTitle}>
            {search ? 'Sin resultados' : 'No hay reseñas'}
          </h3>
          <p className={styles.emptyDesc}>
            {search
              ? `No se encontraron reseñas para "${search}"`
              : 'Aún no han dejado ninguna valoración en los planes'}
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Fechas</th>
              <th>Plan</th>
              <th>Usuario & Valoración</th>
              <th>Comentario</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filtered.map((review) => (
              <tr key={review.id} style={{ opacity: review.status === 'hidden' ? 0.6 : 1 }}>
                <td data-label="Fecha" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  {new Date(review.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td data-label="Plan">
                  {review.plans ? (
                    <Link href={`/admin/planes/${review.plans.slug}`} style={{ color: '#E85D26', textDecoration: 'none', fontWeight: 600 }}>
                      {review.plans.title}
                    </Link>
                  ) : (
                    <span style={{ color: 'gray' }}>Plan eliminado</span>
                  )}
                </td>
                <td data-label="Usuario">
                  <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                    {review.profiles?.full_name || 'Anónimo'}
                  </div>
                  <div style={{ color: '#fbbf24', fontSize: '1.1rem', letterSpacing: '2px' }}>
                    {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                  </div>
                </td>
                <td data-label="Comentario">
                  <div style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', maxWidth: '300px', whiteSpace: 'pre-wrap' }}>
                    {review.comment || <i>Sin comentario</i>}
                  </div>
                </td>
                <td data-label="Estado">
                  <span
                    className={`${styles.badge} ${
                      review.status === 'public' ? styles.badgePaid : styles.badgeCancelled
                    }`}
                  >
                    {review.status === 'public' ? 'Pública' : 'Oculta'}
                  </span>
                </td>
                <td data-label="Acciones">
                  <div className={styles.actionButtons}>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnSecondary}`}
                      onClick={() => toggleStatus(review.id, review.status)}
                      title={review.status === 'public' ? 'Ocultar' : 'Publicar'}
                    >
                      {review.status === 'public' ? '👁️' : '🙈'}
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => deleteReview(review.id)}
                      title="Borrar"
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
