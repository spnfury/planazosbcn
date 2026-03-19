'use client';

import { useEffect, useState, useCallback } from 'react';
import styles from '../admin.module.css';

const ACTION_LABELS = {
  'plan.created': { label: 'Plan creado', icon: '📋', color: '#10B981' },
  'plan.updated': { label: 'Plan editado', icon: '✏️', color: '#3B82F6' },
  'plan.deleted': { label: 'Plan eliminado', icon: '🗑️', color: '#EF4444' },
  'plan.image_uploaded': { label: 'Imagen subida', icon: '🖼️', color: '#8B5CF6' },
  'plan.image_upload_error': { label: 'Error imagen', icon: '❌', color: '#EF4444' },
  'user.registered': { label: 'Usuario registrado', icon: '👤', color: '#10B981' },
  'user.register_error': { label: 'Error registro', icon: '❌', color: '#EF4444' },
  'avatar.uploaded': { label: 'Avatar subido', icon: '📷', color: '#8B5CF6' },
  'avatar.upload_error': { label: 'Error avatar', icon: '❌', color: '#EF4444' },
  'reservation.created': { label: 'Reserva creada', icon: '🎟️', color: '#F59E0B' },
  'payment.completed': { label: 'Pago completado', icon: '💳', color: '#10B981' },
  'payment.failed': { label: 'Pago fallido', icon: '❌', color: '#EF4444' },
  'review.created': { label: 'Reseña creada', icon: '⭐', color: '#F59E0B' },
  'review.status_changed': { label: 'Reseña moderada', icon: '👁️', color: '#3B82F6' },
  'review.deleted': { label: 'Reseña borrada', icon: '🗑️', color: '#EF4444' },
  'contact.submitted': { label: 'Contacto enviado', icon: '✉️', color: '#3B82F6' },
};

const ENTITY_FILTERS = ['plan', 'user', 'reservation', 'review', 'contact'];

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  // Filters
  const [filterEntity, setFilterEntity] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [search, setSearch] = useState('');

  const loadLogs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '50' });
      if (filterEntity) params.set('entityType', filterEntity);
      if (filterStatus) params.set('status', filterStatus);
      if (search) params.set('search', search);

      const res = await fetch(`/api/admin/logs?${params}`);
      if (!res.ok) throw new Error('Error cargando logs');
      const data = await res.json();
      setLogs(data.logs);
      setTotalPages(data.totalPages);
      setTotal(data.total);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [page, filterEntity, filterStatus, search]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  function getActionInfo(action) {
    return ACTION_LABELS[action] || { label: action, icon: '📌', color: '#6B7280' };
  }

  function formatDate(ts) {
    return new Date(ts).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  }

  function renderDetails(details) {
    if (!details || Object.keys(details).length === 0) return null;

    // If it has a "changes" key, render as a diff table
    if (details.changes) {
      return (
        <div style={{ marginTop: '0.5rem' }}>
          <strong style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
            Campos cambiados:
          </strong>
          <table style={{ width: '100%', marginTop: '0.25rem', fontSize: '0.8rem' }}>
            <thead>
              <tr style={{ color: 'rgba(255,255,255,0.5)' }}>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Campo</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Antes</th>
                <th style={{ textAlign: 'left', padding: '4px 8px' }}>Después</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(details.changes).map(([field, { old: oldVal, new: newVal }]) => (
                <tr key={field}>
                  <td style={{ padding: '4px 8px', color: '#A78BFA', fontWeight: 600 }}>{field}</td>
                  <td style={{ padding: '4px 8px', color: '#EF4444', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {oldVal !== null && oldVal !== undefined ? String(oldVal) : '—'}
                  </td>
                  <td style={{ padding: '4px 8px', color: '#10B981', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {newVal !== null && newVal !== undefined ? String(newVal) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    // Otherwise, render as JSON
    return (
      <pre style={{
        marginTop: '0.5rem',
        padding: '0.5rem',
        background: 'rgba(0,0,0,0.3)',
        borderRadius: '6px',
        fontSize: '0.75rem',
        color: 'rgba(255,255,255,0.7)',
        overflowX: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}>
        {JSON.stringify(details, null, 2)}
      </pre>
    );
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Activity Logs</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${total} registros en total`}
          </p>
        </div>
        <button
          className={styles.actionBtn}
          onClick={() => { setPage(1); loadLogs(); }}
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <input
          type="text"
          className={styles.formInput}
          placeholder="🔍 Buscar por email o acción..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          style={{ maxWidth: '280px', width: '100%' }}
        />
        <select
          className={styles.formSelect}
          value={filterEntity}
          onChange={(e) => { setFilterEntity(e.target.value); setPage(1); }}
          style={{ maxWidth: '160px' }}
        >
          <option value="">Todas las entidades</option>
          {ENTITY_FILTERS.map((e) => (
            <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
          ))}
        </select>
        <select
          className={styles.formSelect}
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          style={{ maxWidth: '140px' }}
        >
          <option value="">Todos los estados</option>
          <option value="success">✅ Success</option>
          <option value="error">❌ Error</option>
        </select>
      </div>

      {error && (
        <div className={styles.loginError} style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando logs...</p>
      ) : logs.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📝</div>
          <h3 className={styles.emptyTitle}>
            {search || filterEntity || filterStatus ? 'Sin resultados' : 'No hay logs'}
          </h3>
          <p className={styles.emptyDesc}>
            {search || filterEntity || filterStatus
              ? 'No se encontraron logs con estos filtros'
              : 'Los logs de actividad aparecerán aquí automáticamente'}
          </p>
        </div>
      ) : (
        <>
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Fecha</th>
                <th>Acción</th>
                <th>Entidad</th>
                <th>Usuario</th>
                <th>Estado</th>
                <th>Detalle</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {logs.map((log) => {
                const info = getActionInfo(log.action);
                const hasDetails = log.details && Object.keys(log.details).length > 0;
                const isExpanded = expandedId === log.id;

                return (
                  <tr key={log.id}>
                    <td data-label="Fecha" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {formatDate(log.created_at)}
                    </td>
                    <td data-label="Acción">
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '100px',
                        background: `${info.color}18`,
                        color: info.color,
                        fontSize: '0.8rem',
                        fontWeight: 600,
                      }}>
                        {info.icon} {info.label}
                      </span>
                    </td>
                    <td data-label="Entidad" style={{ fontSize: '0.85rem' }}>
                      {log.entity_type && (
                        <span style={{ color: 'rgba(255,255,255,0.5)' }}>
                          {log.entity_type}
                          {log.entity_id ? ` #${log.entity_id}` : ''}
                        </span>
                      )}
                    </td>
                    <td data-label="Usuario" style={{ fontSize: '0.85rem' }}>
                      {log.user_email || (
                        <span style={{ color: 'rgba(255,255,255,0.3)' }}>Sistema</span>
                      )}
                    </td>
                    <td data-label="Estado">
                      <span
                        className={`${styles.badge} ${
                          log.status === 'success' ? styles.badgePaid : styles.badgeCancelled
                        }`}
                      >
                        {log.status === 'success' ? '✅' : '❌'}
                      </span>
                    </td>
                    <td data-label="Detalle">
                      {hasDetails ? (
                        <div>
                          <button
                            className={styles.actionBtn}
                            onClick={() => setExpandedId(isExpanded ? null : log.id)}
                            style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem' }}
                          >
                            {isExpanded ? '▲ Cerrar' : '▼ Ver'}
                          </button>
                          {isExpanded && renderDetails(log.details)}
                        </div>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                className={styles.actionBtn}
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page <= 1}
              >
                ← Anterior
              </button>
              <span style={{ color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', fontSize: '0.85rem' }}>
                Página {page} de {totalPages}
              </span>
              <button
                className={styles.actionBtn}
                onClick={() => setPage(Math.min(totalPages, page + 1))}
                disabled={page >= totalPages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}
