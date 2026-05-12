'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import styles from './referidos.module.css';

function currentMonthKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AdminReferidosPage() {
  const [supabase] = useState(() => createClient());
  const [month, setMonth] = useState(currentMonthKey());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [drawing, setDrawing] = useState(false);
  const [prize, setPrize] = useState('Entrada doble a plan top + cena 50€');
  const [notes, setNotes] = useState('');

  async function load() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch(`/api/admin/referidos?month=${month}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const t = setTimeout(load, 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [month]);

  const draw = async (force = false) => {
    if (drawing) return;
    if (!confirm(force ? '¿Re-sortear este mes? El ganador actual se sobrescribirá.' : '¿Sortear ahora?')) return;

    setDrawing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      const res = await fetch('/api/admin/referidos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ month, prizeDescription: prize, notes, force }),
      });
      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Error');
      } else {
        alert(`🎉 Ganador: ${json.raffle.winner_code}\nTickets totales: ${json.totalTickets}`);
        await load();
      }
    } catch (err) {
      console.error(err);
      alert('Error');
    } finally {
      setDrawing(false);
    }
  };

  // Build last 12 months options
  const monthOptions = [];
  const d = new Date();
  for (let i = 0; i < 12; i++) {
    const m = new Date(d.getFullYear(), d.getMonth() - i, 1);
    monthOptions.push(`${m.getFullYear()}-${String(m.getMonth() + 1).padStart(2, '0')}`);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🎁 Referidos</h1>
          <p className={styles.subtitle}>
            Ranking de usuarios que más amigos han traído. 1 click válido = 1 participación.
          </p>
        </div>
        <select
          className={styles.monthSelect}
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          {monthOptions.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className={styles.loading}>Cargando...</div>
      ) : !data ? (
        <div className={styles.loading}>Error al cargar</div>
      ) : (
        <>
          {/* Stats */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Clicks totales</div>
              <div className={styles.statValue}>{data.totalClicks}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Invitadores únicos</div>
              <div className={styles.statValue}>{data.uniqueReferrers}</div>
            </div>
            <div className={styles.statCard}>
              <div className={styles.statLabel}>Ganador mes</div>
              <div className={styles.statValueSmall}>
                {data.raffle?.winner_code || '—'}
              </div>
            </div>
          </div>

          {/* Raffle action */}
          <div className={styles.raffleCard}>
            <h2 className={styles.cardTitle}>🎟️ Sortear ganador</h2>
            {data.raffle ? (
              <div className={styles.raffleDone}>
                <div className={styles.raffleDoneTitle}>
                  ✓ Ya hay ganador para {data.month}: <strong>{data.raffle.winner_code}</strong>
                </div>
                {data.raffle.prize_description && (
                  <div className={styles.raffleDoneSub}>Premio: {data.raffle.prize_description}</div>
                )}
                {data.raffle.notes && (
                  <div className={styles.raffleDoneSub}>Notas: {data.raffle.notes}</div>
                )}
                <button
                  className={styles.btnDanger}
                  onClick={() => draw(true)}
                  disabled={drawing}
                >
                  Re-sortear
                </button>
              </div>
            ) : (
              <>
                <label className={styles.fieldLabel}>Descripción del premio</label>
                <input
                  className={styles.input}
                  value={prize}
                  onChange={(e) => setPrize(e.target.value)}
                />
                <label className={styles.fieldLabel}>Notas internas (opcional)</label>
                <input
                  className={styles.input}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ej: contactar por email"
                />
                <button
                  className={styles.btnPrimary}
                  onClick={() => draw(false)}
                  disabled={drawing || data.totalClicks === 0}
                >
                  {drawing
                    ? 'Sorteando...'
                    : data.totalClicks === 0
                    ? 'Sin participaciones'
                    : `🎲 Sortear (${data.totalClicks} tickets)`}
                </button>
              </>
            )}
          </div>

          {/* Ranking */}
          <div className={styles.rankingCard}>
            <h2 className={styles.cardTitle}>📊 Ranking del mes</h2>
            {data.ranking.length === 0 ? (
              <div className={styles.emptyState}>Aún no hay invitaciones este mes.</div>
            ) : (
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Código</th>
                    <th>Usuario</th>
                    <th style={{ textAlign: 'right' }}>Clicks</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ranking.map((r, idx) => (
                    <tr key={r.code}>
                      <td>{idx + 1}</td>
                      <td><code>{r.code}</code></td>
                      <td>{r.name || <span className={styles.muted}>(sin nombre)</span>}</td>
                      <td style={{ textAlign: 'right', fontWeight: 700 }}>{r.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
