'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import QRCode from 'qrcode';
import { createClient } from '@/lib/supabase/client';
import styles from '../../../admin.module.css';

export default function PlanQrCodesPage({ params }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [planId, setPlanId] = useState(null);
  const [planTitle, setPlanTitle] = useState('');
  const [planSlug, setPlanSlug] = useState('');
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newLabel, setNewLabel] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Modal state
  const [qrModalCode, setQrModalCode] = useState(null);
  const [qrDataUrl, setQrDataUrl] = useState('');

  useEffect(() => {
    async function load() {
      const { id } = await params;
      setPlanId(id);

      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      // Load plan info
      const planRes = await fetch(`/api/admin/plans/${id}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (planRes.ok) {
        const plan = await planRes.json();
        setPlanTitle(plan.title);
        setPlanSlug(plan.slug);
      }

      // Load QR codes
      await loadQrCodes(id, token);
    }

    load();
  }, [params]);

  async function loadQrCodes(id, tokenOverride) {
    const pid = id || planId;
    let token = tokenOverride;
    if (!token) {
      const { data: { session } } = await supabase.auth.getSession();
      token = session?.access_token;
    }

    const res = await fetch(`/api/admin/qr-codes?plan_id=${pid}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (res.ok) {
      const data = await res.json();
      setQrCodes(data);
    }
    setLoading(false);
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!newLabel.trim()) return;
    setCreating(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/qr-codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan_id: Number(planId), label: newLabel.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Error al crear QR');
      }

      setNewLabel('');
      await loadQrCodes();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(qr) {
    if (!confirm(`¿Eliminar el QR "${qr.label}"? Se perderán todas las estadísticas de escaneo.`)) return;

    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

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
          <Link href={`/admin/planes/${planId}`} className={styles.backLinkStyle}>
            ← Volver al plan
          </Link>
          <h1 className={styles.pageTitle} style={{ marginTop: '0.5rem' }}>
            📱 QR Codes
          </h1>
          <p className={styles.pageSubtitle}>{planTitle}</p>
        </div>
      </div>

      {error && <div className={styles.loginError} style={{ marginBottom: '1rem' }}>{error}</div>}

      {/* Stats summary */}
      {!loading && qrCodes.length > 0 && (
        <div className={styles.statsGrid} style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          <div className={styles.statCard}>
            <div className={styles.statLabel}>QR Codes</div>
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

      {/* Create new QR */}
      <div className={styles.formSection}>
        <h3 className={styles.formSectionTitle}>＋ Crear nuevo QR Code</h3>
        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', marginBottom: '1rem' }}>
          Cada QR tiene una etiqueta para identificar de dónde viene el tráfico (ej: &quot;Mesas del restaurante&quot;, &quot;Flyer puerta&quot;, &quot;Story Instagram&quot;)
        </p>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end' }}>
          <div className={styles.formGroup} style={{ flex: 1 }}>
            <label className={styles.formLabel}>Etiqueta</label>
            <input
              type="text"
              className={styles.formInput}
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Ej: Mesas restaurante, Flyer exterior, Story IG..."
              id="qr-label"
              required
            />
          </div>
          <button type="submit" className={styles.btnPrimary} disabled={creating} id="qr-create">
            {creating ? 'Creando...' : '＋ Crear QR'}
          </button>
        </form>
      </div>

      {/* QR codes list */}
      {loading ? (
        <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>
      ) : qrCodes.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>📱</div>
          <h3 className={styles.emptyTitle}>No hay QR codes</h3>
          <p className={styles.emptyDesc}>Crea tu primer QR code para empezar a trackear tráfico</p>
        </div>
      ) : (
        <>
          {/* Comparative bar chart */}
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

          {/* Table */}
          <table className={styles.table}>
            <thead className={styles.tableHead}>
              <tr>
                <th>Etiqueta</th>
                <th>URL Corta</th>
                <th>Scans</th>
                <th>Último Scan</th>
                <th>Creado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody className={styles.tableBody}>
              {qrCodes.map((qr) => (
                <tr key={qr.id}>
                  <td data-label="Etiqueta">
                    <span style={{ fontWeight: 600, color: '#fff' }}>{qr.label}</span>
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
                    <span className={styles.qrScanBadge}>
                      {qr.scan_count} scans
                    </span>
                  </td>
                  <td data-label="Último Scan">
                    {qr.last_scan ? (
                      <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}>
                        {new Date(qr.last_scan).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    ) : (
                      <span style={{ color: 'rgba(255,255,255,0.3)' }}>—</span>
                    )}
                  </td>
                  <td data-label="Creado">
                    <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                      {new Date(qr.created_at).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </span>
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
        </>
      )}

      {/* QR Modal */}
      {qrModalCode && (
        <div className={styles.modalOverlay} onClick={() => setQrModalCode(null)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.modalTitle}>📱 {qrModalCode.label}</h3>
            <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginBottom: '1.5rem' }}>
              {planTitle}
            </p>
            {qrDataUrl && (
              <div className={styles.modalQrContainer}>
                <img src={qrDataUrl} alt={`QR: ${qrModalCode.label}`} />
              </div>
            )}
            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', marginBottom: '0.5rem', wordBreak: 'break-all' }}>
              {getQrUrl(qrModalCode.code)}
            </p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', marginBottom: '1.5rem' }}>
              → redirige a /planes/{planSlug}
            </p>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <a
                href={qrDataUrl}
                download={`QR-${planSlug}-${qrModalCode.label.replace(/\s+/g, '-')}.png`}
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
