'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from '../../admin.module.css';

export default function AdminRestaurantUsersPage() {
  const [supabase] = useState(() => createClient());
  const [users, setUsers] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [resetPasswordId, setResetPasswordId] = useState(null);
  const [newPassword, setNewPassword] = useState('');

  // Form state
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    restaurant_id: '',
    logo_url: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      // Load restaurant users
      const usersRes = await fetch('/api/admin/restaurant-users');
      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data);
      }

      // Load restaurants for dropdown
      const { data: rests, error: restErr } = await supabase
        .from('restaurants')
        .select('id, nombre')
        .order('nombre');

      if (!restErr) setRestaurants(rests || []);
    } catch (err) {
      console.error('Load error:', err);
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin/restaurant-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Error al crear usuario');
        setSaving(false);
        return;
      }

      setSuccess(`✅ Usuario creado: ${form.email}`);
      setForm({ email: '', password: '', name: '', restaurant_id: '', logo_url: '' });
      setShowForm(false);
      loadData();
    } catch (err) {
      setError('Error de conexión');
    }
    setSaving(false);
  }

  async function handleToggleActive(user) {
    const newActive = !user.active;
    try {
      const res = await fetch(`/api/admin/restaurant-users/${user.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: newActive }),
      });

      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, active: newActive } : u));
        setSuccess(`Usuario ${newActive ? 'activado' : 'desactivado'}`);
      }
    } catch (err) {
      setError('Error al actualizar');
    }
  }

  async function handleDelete(user) {
    if (!confirm(`¿Eliminar el usuario "${user.name}" (${user.email})? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/restaurant-users/${user.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        setSuccess('Usuario eliminado');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al eliminar');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  }

  async function handleResetPassword(userId) {
    if (!newPassword || newPassword.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    try {
      const res = await fetch(`/api/admin/restaurant-users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: newPassword }),
      });

      if (res.ok) {
        setSuccess('Contraseña actualizada');
        setResetPasswordId(null);
        setNewPassword('');
      } else {
        const data = await res.json();
        setError(data.error || 'Error al cambiar contraseña');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  }

  // Auto-dismiss alerts
  useEffect(() => {
    if (success) {
      const t = setTimeout(() => setSuccess(''), 4000);
      return () => clearTimeout(t);
    }
  }, [success]);

  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(''), 6000);
      return () => clearTimeout(t);
    }
  }, [error]);

  function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password: pass }));
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Comercios</h1>
          <p className={styles.pageSubtitle}>
            {loading ? 'Cargando...' : `${users.length} ${users.length === 1 ? 'comercio' : 'comercios'}`}
          </p>
        </div>
        <button
          className={styles.btnPrimary}
          onClick={() => setShowForm(!showForm)}
          id="toggle-create-form"
        >
          {showForm ? '✕ Cerrar' : '＋ Nuevo comercio'}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div className={styles.loginError} style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.15)',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          color: '#22C55E',
          padding: '0.75rem 1rem',
          borderRadius: '10px',
          fontSize: '0.85rem',
          marginBottom: '1rem',
        }}>
          {success}
        </div>
      )}

      {/* Create form */}
      {showForm && (
        <div style={{
          background: 'rgba(255, 255, 255, 0.04)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem',
          marginBottom: '1.5rem',
        }}>
          <h3 style={{ color: '#fff', margin: '0 0 1rem', fontSize: '1rem', fontWeight: 700 }}>
            Crear acceso de comercio
          </h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))' }}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Restaurante *</label>
                <select
                  className={styles.formInput}
                  value={form.restaurant_id}
                  onChange={(e) => setForm(prev => ({ ...prev, restaurant_id: e.target.value }))}
                  required
                  id="form-restaurant"
                  style={{ cursor: 'pointer' }}
                >
                  <option value="">Seleccionar restaurante...</option>
                  {restaurants.map(r => (
                    <option key={r.id} value={r.id}>{r.nombre}</option>
                  ))}
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Nombre del usuario *</label>
                <input
                  type="text"
                  className={styles.formInput}
                  placeholder="Ej: Manager de La Tapería"
                  value={form.name}
                  onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  id="form-name"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Email *</label>
                <input
                  type="email"
                  className={styles.formInput}
                  placeholder="usuario@restaurante.com"
                  value={form.email}
                  onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  required
                  id="form-email"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Contraseña *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Contraseña"
                    value={form.password}
                    onChange={(e) => setForm(prev => ({ ...prev, password: e.target.value }))}
                    required
                    id="form-password"
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    onClick={generatePassword}
                    className={styles.actionBtn}
                    style={{ whiteSpace: 'nowrap', flexShrink: 0 }}
                    title="Generar contraseña aleatoria"
                  >
                    🎲 Generar
                  </button>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>URL del logo (opcional)</label>
                <input
                  type="url"
                  className={styles.formInput}
                  placeholder="https://..."
                  value={form.logo_url}
                  onChange={(e) => setForm(prev => ({ ...prev, logo_url: e.target.value }))}
                  id="form-logo"
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem' }}>
              <button
                type="submit"
                className={styles.btnPrimary}
                disabled={saving}
                id="submit-create"
              >
                {saving ? 'Creando...' : '✓ Crear usuario'}
              </button>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => setShowForm(false)}
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Users list */}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      ) : users.length === 0 && !showForm ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🏪</div>
          <h3 className={styles.emptyTitle}>No hay comercios</h3>
          <p className={styles.emptyDesc}>Crea uno para que el comercio pueda gestionar su negocio</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Usuario</th>
              <th>Email</th>
              <th>Restaurante</th>
              <th>Estado</th>
              <th>Creado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label="Usuario">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {user.logo_url ? (
                      <img
                        src={user.logo_url}
                        alt=""
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '8px',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div style={{
                        width: 32,
                        height: 32,
                        borderRadius: '8px',
                        background: 'linear-gradient(135deg, #E85D26, #FF7A45)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.85rem',
                        flexShrink: 0,
                      }}>
                        🍽️
                      </div>
                    )}
                    <span className={styles.planTitle} style={{ fontSize: '0.9rem' }}>
                      {user.name}
                    </span>
                  </div>
                </td>
                <td data-label="Email" style={{ fontSize: '0.85rem' }}>{user.email}</td>
                <td data-label="Restaurante" style={{ fontWeight: 600, color: '#fff' }}>
                  {user.restaurants?.nombre || '—'}
                </td>
                <td data-label="Estado">
                  <span className={`${styles.badge} ${user.active ? styles.badgePaid : styles.badgeCancelled}`}>
                    {user.active ? '✓ Activo' : '✕ Inactivo'}
                  </span>
                </td>
                <td data-label="Creado" style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>
                  {new Date(user.created_at).toLocaleDateString('es-ES', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
                <td data-label="Acciones">
                  <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => handleToggleActive(user)}
                      style={{
                        background: user.active ? 'rgba(245, 158, 11, 0.2)' : 'rgba(34, 197, 94, 0.2)',
                        color: user.active ? '#F59E0B' : '#22C55E',
                        border: `1px solid ${user.active ? 'rgba(245, 158, 11, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                      }}
                    >
                      {user.active ? '⏸ Desactivar' : '▶ Activar'}
                    </button>
                    <button
                      className={styles.actionBtn}
                      onClick={() => {
                        setResetPasswordId(resetPasswordId === user.id ? null : user.id);
                        setNewPassword('');
                      }}
                      style={{
                        background: 'rgba(59, 130, 246, 0.2)',
                        color: '#3B82F6',
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        fontSize: '0.75rem',
                        padding: '4px 8px',
                      }}
                    >
                      🔑 Contraseña
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleDelete(user)}
                      style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                    >
                      🗑️
                    </button>
                  </div>

                  {/* Inline reset password */}
                  {resetPasswordId === user.id && (
                    <div style={{
                      display: 'flex',
                      gap: '0.4rem',
                      marginTop: '0.5rem',
                      alignItems: 'center',
                    }}>
                      <input
                        type="text"
                        className={styles.formInput}
                        placeholder="Nueva contraseña"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{ flex: 1, fontSize: '0.8rem', padding: '0.4rem 0.7rem' }}
                      />
                      <button
                        className={styles.actionBtn}
                        onClick={() => handleResetPassword(user.id)}
                        style={{
                          background: 'rgba(59, 130, 246, 0.2)',
                          color: '#3B82F6',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                          fontSize: '0.75rem',
                          padding: '4px 8px',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        Guardar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Login URL info */}
      {users.length > 0 && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.08)',
          border: '1px solid rgba(59, 130, 246, 0.15)',
          borderRadius: '12px',
          padding: '1rem',
          marginTop: '1.5rem',
          fontSize: '0.85rem',
          color: 'rgba(255,255,255,0.6)',
        }}>
          <strong style={{ color: '#3B82F6' }}>ℹ️ URL de acceso para comercios:</strong>
          <br />
          <code style={{
            background: 'rgba(0,0,0,0.3)',
            padding: '4px 8px',
            borderRadius: '6px',
            fontSize: '0.8rem',
            display: 'inline-block',
            marginTop: '0.4rem',
            userSelect: 'all',
          }}>
            {typeof window !== 'undefined' ? `${window.location.origin}/restaurant/login` : '/restaurant/login'}
          </code>
          <br />
          <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
            Comparte este enlace con el comercio junto con sus credenciales.
          </span>
        </div>
      )}
    </>
  );
}
