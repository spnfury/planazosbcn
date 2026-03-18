'use client';

import { useEffect, useState } from 'react';
import styles from '../admin.module.css';

export default function AdminUsuariosPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Error cargando usuarios');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.email || '').toLowerCase().includes(q) ||
      (u.full_name || '').toLowerCase().includes(q)
    );
  });

  function getInitials(name) {
    if (!name) return '?';
    return name
      .split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Usuarios</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${users.length} usuarios registrados`}
          </p>
        </div>
      </div>

      {/* Search */}
      <div style={{ marginBottom: '1.25rem' }}>
        <input
          type="text"
          className={styles.formInput}
          placeholder="🔍 Buscar por nombre o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          id="user-search"
          style={{ maxWidth: '400px', width: '100%' }}
        />
      </div>

      {error && (
        <div className={styles.loginError} style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando usuarios...</p>
      ) : filtered.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>👥</div>
          <h3 className={styles.emptyTitle}>
            {search ? 'Sin resultados' : 'No hay usuarios'}
          </h3>
          <p className={styles.emptyDesc}>
            {search
              ? `No se encontraron usuarios para "${search}"`
              : 'Aún no se ha registrado ningún usuario'}
          </p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Registrado</th>
              <th>Último acceso</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {filtered.map((user) => (
              <tr key={user.id}>
                <td data-label="Usuario">
                  <div className={styles.planRow}>
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt=""
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: '50%',
                          background: 'linear-gradient(135deg, #E85D26, #FF7A45)',
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          flexShrink: 0,
                        }}
                      >
                        {getInitials(user.full_name)}
                      </div>
                    )}
                    <div>
                      <span className={styles.planTitle} style={{ fontSize: '0.9rem' }}>
                        {user.full_name || 'Sin nombre'}
                      </span>
                    </div>
                  </div>
                </td>
                <td data-label="Email" style={{ fontSize: '0.85rem' }}>
                  {user.email}
                </td>
                <td data-label="Registrado" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td data-label="Último acceso" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem' }}>
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Nunca'}
                </td>
                <td data-label="Estado">
                  <span
                    className={`${styles.badge} ${
                      user.email_confirmed_at ? styles.badgePaid : styles.badgePending
                    }`}
                  >
                    {user.email_confirmed_at ? '✓ Verificado' : '⏳ Pendiente'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );
}
