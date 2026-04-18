'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';
import styles from '../admin.module.css';

const TARGET_PRESETS = [
  { label: '🏠 Web principal', url: '/' },
  { label: '🍽️ Restaurantes', url: '/restaurantes' },
  { label: '📋 Planes', url: '/planes' },
  { label: '📱 Contacto', url: '/contacto' },
  { label: '❓ FAQ', url: '/faq' },
];

export default function QrCodesPage() {
  const [supabase] = useState(() => createClient());
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Create form
  const [newLabel, setNewLabel] = useState('');
  const [targetUrl, setTargetUrl] = useState('/');
  const [customUrl, setCustomUrl] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [creating, setCreating] = useState(false);

  // Modal
  const [qrModalCode, setQrModalCode] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    loadQrCodes();
  }, []);

  async function getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token;
  }

  async function loadQrCodes() {
    const token = await getToken();
    const res = await fetch('/api/admin/qr-codes?type=generic', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      setQrCodes(await res.json());
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setError('');

    const finalUrl = isCustom ? customUrl.trim() : targetUrl;

    if (!finalUrl) {
      setError('Debes especificar una URL de destino');
      setCreating(false);
      return;
    }

    try {
      const token = await getToken();
      const res = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          label: newLabel.trim(),
          target_url: finalUrl,
          target_type: 'generic',
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear QR');
      }

      setNewLabel('');
      setCustomUrl('');
      setIsCustom(false);
      setTargetUrl('/');
      await loadQrCodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(qr) {
    if (!confirm(`¿Eliminar el QR "${qr.label}"? Se perderán todas las estadísticas de escaneo.`)) return;

    const token = await getToken();
    const res = await fetch('/api/admin/qr-codes', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ id: qr.id }),
    });

    if (res.ok) {
      setQrCodes((prev) => prev.filter((q) => q.id !== qr.id));
    }
  }

  async function showQrModal(qr) {
    try {
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://planazosbcn.com';
      const fullUrl = `${baseUrl}/qr/${qr.code}`;
      const dataUrl = await QRCode.toDataURL(fullUrl, {
        width: 400,
        margin: 2,
        color: { dark: '#000000', light: '#ffffff' },
      });
      setQrDataUrl(dataUrl);
      setQrModalCode(qr);
    } catch (err) {
      console.error(err);
      alert('Error al generar QR');
    }
  }

  function getQrUrl(code) {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://planazosbcn.com';
    return `${baseUrl}/qr/${code}`;
  }

  function copyToClipboard(text) {
    navigator.clipboard.writeText(text);
  }

  // Stats
  const totalScans = qrCodes.reduce((sum, qr) => sum + qr.scan_count, 0);
  const maxScans = Math.max(...qrCodes.map((qr) => qr.scan_count), 1);

  return (
    <>
      {/* Header */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>🔗 QR Codes Genéricos</h1>
          <p className={styles.pageSubtitle}>
            Crea QR codes que apuntan a cualquier página de tu web, no solo a planes
          </p>
        </div>
      </div>

      {error && <div className={styles.loginError} style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Stats summary */}
      {!loading && qrCodes.length > 0 && (
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>QR Genéricos</div>
            <div className={styles.statValue}>{qrCodes.length}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Scans totales</div>
            <div className={styles.statValue}>{totalScans}</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>Media por QR</div>
            <div className={styles.statValue}>
              {qrCodes.length > 0 ? Math.round(totalScans / qrCodes.length) : 0}
            </div>
          </div>
        </div>
      )}

      {/* Create form */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>＋ Crear nuevo QR genérico</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Elige una página predefinida o introduce una URL personalizada. La etiqueta sirve para identificar
          de dónde viene el tráfico (ej: &quot;Tarjeta de visita&quot;, &quot;Cartel tienda&quot;)
        </p>

        <form onSubmit={handleCreate}>
          <div className={styles.formGrid} style={{ marginBottom: '1rem' }}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Etiqueta</label>
              <input
                type="text"
                className={styles.formInput}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Ej: Cartel restaurante, Flyer BCN, Story IG..."
                id="generic-qr-label"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Destino</label>
              {!isCustom ? (
                <select
                  className={styles.formSelect}
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  id="generic-qr-target"
                >
                  {TARGET_PRESETS.map((p) => (
                    <option key={p.url} value={p.url}>
                      {p.label} ({p.url})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  className={styles.formInput}
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="Ej: /restaurantes/3 o https://..."
                  id="generic-qr-custom-url"
                />
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={styles.btnSecondaryStyle}
              onClick={() => setIsCustom(!isCustom)}
              style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem' }}
            >
              {isCustom ? '📌 Usar predefinido' : '✏️ URL personalizada'}
            </button>

            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={creating}
              id="generic-qr-create"
              style={{ marginLeft: 'auto' }}
            >
              {creating ? 'Creando...' : '＋ Crear QR'}
            </button>
          </div>
        </form>
      </div>

      {/* Comparative bar chart */}
      {!loading && qrCodes.length > 0 && (
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📊 Comparativa de scans</h3>
          <div className={styles.qrChartContainer}>
            {qrCodes.map((qr) => {
              const pct = maxScans > 0 ? (qr.scan_count / maxScans) * 100 : 0;
              return (
                <div key={qr.id} className={styles.qrChartRow}>
                  <span className={styles.qrChartLabel}>{qr.label}</span>
                  <div className={styles.qrChartBarTrack}>
                    <div
                      className={styles.qrChartBarFill}
                      style={{ width: `${Math.max(pct, 2)}%` }}
                    />
                  </div>
                  <span className={styles.qrChartValue}>{qr.scan_count}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* QR codes list */}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      ) : qrCodes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>🔗</div>
          <h3 className={styles.emptyTitle}>No hay QR genéricos</h3>
          <p className={styles.emptyDesc}>Crea tu primer QR genérico para trackear tráfico a cualquier página</p>
        </div>
      ) : (
        <table className={styles.table}>
          <thead className={styles.tableHead}>
            <tr>
              <th>Etiqueta</th>
              <th>Destino</th>
              <th>URL Corta</th>
              <th>Scans</th>
              <th>Último Scan</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody className={styles.tableBody}>
            {qrCodes.map((qr) => (
              <tr key={qr.id}>
                <td data-label="Etiqueta">
                  <span style={{ fontWeight: 600, color: '#fff' }}>{qr.label}</span>
                </td>
                <td data-label="Destino">
                  <code style={{
                    fontSize: '0.8rem',
                    padding: '0.15rem 0.4rem',
                    background: 'rgba(139, 92, 246, 0.1)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '4px',
                    color: '#c4b5fd',
                  }}>
                    {qr.target_url || '/'}
                  </code>
                </td>
                <td data-label="URL Corta">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <code className={styles.qrCodeBadge}>/qr/{qr.code}</code>
                    <button
                      className={styles.qrCopyBtn}
                      onClick={() => copyToClipboard(getQrUrl(qr.code))}
                      title="Copiar URL"
                    >
                      📋
                    </button>
                  </div>
                </td>
                <td data-label="Scans">
                  <span className={styles.qrScanBadge}>{qr.scan_count} scans</span>
                </td>
                <td data-label="Último Scan">
                  {qr.last_scan ? (
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                      {new Date(qr.last_scan).toLocaleDateString('es-ES', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  ) : (
                    <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                  )}
                </td>
                <td data-label="Acciones">
                  <div className={styles.actions}>
                    <button
                      className={styles.actionBtn}
                      onClick={() => showQrModal(qr)}
                      style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#93c5fd' }}
                    >
                      📱 Ver QR
                    </button>
                    <button
                      className={`${styles.actionBtn} ${styles.actionBtnDanger}`}
                      onClick={() => handleDelete(qr)}
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

      {/* QR Modal */}
      {qrModalCode && (
        <div className={styles.modalOverlay} onClick={() => setQrModalCode(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>🔗 {qrModalCode.label}</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.25rem' }}>
              Destino: <strong style={{ color: '#c4b5fd' }}>{qrModalCode.target_url || '/'}</strong>
            </p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>
              {qrModalCode.scan_count} scans registrados
            </p>
            {qrDataUrl && (
              <div className={styles.modalQrContainer}>
                <img src={qrDataUrl} alt={`QR: ${qrModalCode.label}`} />
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem', wordBreak: 'break-all' }}>
              {getQrUrl(qrModalCode.code)}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a
                href={qrDataUrl}
                download={`QR-${qrModalCode.label.replace(/\s+/g, '-')}.png`}
                className={styles.btnPrimary}
              >
                ⬇️ Descargar PNG
              </a>
              <button className={styles.btnSecondaryStyle} onClick={() => setQrModalCode(null)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
