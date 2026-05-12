'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DIRECTORIES,
  COPY_SHORT,
  COPY_MID,
  COPY_LONG,
  COPY_REDDIT,
  TITLE,
  TAGS,
  BANNERS,
  buildWaLink,
} from '@/data/promoKit';
import AutofillBookmarklet from '@/components/PromoKit/AutofillBookmarklet';
import styles from './promo-kit.module.css';

const STORAGE_KEY = 'planazos_promo_kit_v1';

const KIND_LABEL = {
  directory: 'Directorio',
  reddit: 'Reddit',
  facebook: 'Facebook',
  telegram: 'Telegram',
};

const KIND_COLOR = {
  directory: '#3B82F6',
  reddit: '#FF4500',
  facebook: '#1877F2',
  telegram: '#229ED9',
};

function Sparkline({ series }) {
  if (!series || series.length === 0) return null;
  const max = Math.max(...series.map((d) => d.clicks), 1);
  const w = 420;
  const h = 70;
  const stepX = w / (series.length - 1);
  const points = series.map((d, i) => {
    const x = i * stepX;
    const y = h - (d.clicks / max) * h;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const linePath = `M ${points.join(' L ')}`;
  const areaPath = `${linePath} L ${w},${h} L 0,${h} Z`;
  return (
    <div className={styles.sparkWrap}>
      <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={styles.sparkSvg}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#25D366" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#25D366" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkGrad)" />
        <path d={linePath} fill="none" stroke="#25D366" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className={styles.sparkAxis}>
        <span>{series[0].date.slice(5)}</span>
        <span>{series[series.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}

function RankingBlock({ title, items, color = '#25D366' }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <div className={styles.rankBlock}>
      <h3 className={styles.rankTitle}>{title}</h3>
      {items.length === 0 ? (
        <div className={styles.rankEmpty}>Sin datos aún</div>
      ) : (
        <div>
          {items.map((it, idx) => (
            <div key={idx} className={styles.rankRow}>
              <span className={styles.rankLabel} title={it.label}>{it.label}</span>
              <div className={styles.rankTrack}>
                <div
                  className={styles.rankFill}
                  style={{ width: `${(it.value / max) * 100}%`, background: color }}
                />
              </div>
              <span className={styles.rankValue}>{it.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CopyButton({ value, label = 'Copiar' }) {
  const [done, setDone] = useState(false);
  const handle = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setDone(true);
      setTimeout(() => setDone(false), 1500);
    } catch {}
  };
  return (
    <button className={styles.copyBtn} onClick={handle} type="button">
      {done ? '✓ Copiado' : label}
    </button>
  );
}

export default function PromoKitPage() {
  const [supabase] = useState(() => createClient());
  const [checked, setChecked] = useState({});
  const [campaign, setCampaign] = useState('launch');
  const [filter, setFilter] = useState('all');
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setChecked(JSON.parse(raw));
      } catch {}
    }, 0);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;
        const res = await fetch('/api/admin/wa-stats', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error('stats fetch failed');
        const json = await res.json();
        if (!cancelled) setStats(json);
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) setStatsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [supabase]);

  const persist = (next) => {
    setChecked(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const toggle = (id) => {
    const next = { ...checked };
    if (next[id]) delete next[id];
    else next[id] = new Date().toISOString();
    persist(next);
  };

  const reset = () => {
    if (confirm('¿Borrar todo el progreso del checklist?')) persist({});
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return DIRECTORIES;
    if (filter === 'pending') return DIRECTORIES.filter((d) => !checked[d.id]);
    if (filter === 'done') return DIRECTORIES.filter((d) => !!checked[d.id]);
    return DIRECTORIES.filter((d) => d.kind === filter);
  }, [filter, checked]);

  const doneCount = Object.keys(checked).length;
  const pct = Math.round((doneCount / DIRECTORIES.length) * 100);

  return (
    <div className={styles.page}>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>📣 Promo Kit</h1>
          <p className={styles.pageSubtitle}>
            Todo lo que necesitas para promocionar el grupo de WhatsApp en directorios externos.
          </p>
        </div>
        <div className={styles.progressBox}>
          <div className={styles.progressLabel}>Progreso</div>
          <div className={styles.progressValue}>{doneCount} / {DIRECTORIES.length}</div>
          <div className={styles.progressTrack}>
            <div className={styles.progressFill} style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      {/* ── STATS ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>📈 Clicks al grupo (últimos 30 días)</h2>
        <p className={styles.cardSubtitle}>
          Cada vez que alguien hace clic en un link <code>/wa?utm_source=...</code> se registra aquí.
        </p>

        {statsLoading ? (
          <div className={styles.statsLoading}>Cargando estadísticas...</div>
        ) : stats ? (
          <>
            <div className={styles.statsTopRow}>
              <div className={styles.statBig}>
                <div className={styles.statBigLabel}>Total clicks</div>
                <div className={styles.statBigValue}>{stats.total}</div>
              </div>
              <Sparkline series={stats.series} />
            </div>

            <div className={styles.statsGrid}>
              <RankingBlock title="Top sources" items={stats.bySource.slice(0, 8)} color="#25D366" />
              <RankingBlock title="Top mediums" items={stats.byMedium.slice(0, 8)} color="#3B82F6" />
              <RankingBlock title="Top campañas" items={stats.byCampaign.slice(0, 8)} color="#F59E0B" />
            </div>
          </>
        ) : (
          <div className={styles.statsError}>No se pudieron cargar las estadísticas.</div>
        )}
      </section>

      {/* ── BOOKMARKLET ── */}
      <AutofillBookmarklet />

      {/* ── PLAYWRIGHT SUBMITTER ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>🤖 Submitter automático (Playwright)</h2>
        <p className={styles.cardSubtitle}>
          Script Node que abre cada directorio en Chromium, pre-rellena los campos detectados, y pausa para que resuelvas captcha. Mismo motor que el bookmarklet, pero recorre varios sites en orden.
        </p>
        <pre className={styles.fieldPre} style={{ background: 'rgba(0,0,0,0.4)', padding: '0.85rem', borderRadius: '8px' }}>
{`cd scripts/submit-directories
npm install
npm run install:browsers   # solo primera vez
npm run run:headed         # con UI visible (recomendado)`}
        </pre>
        <p className={styles.cardSubtitle} style={{ marginTop: '0.5rem' }}>
          Más opciones y guía completa en <code>scripts/submit-directories/README.md</code>.
        </p>
      </section>

      {/* ── ESPANSO ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>⌨️ Atajos de texto (Espanso)</h2>
        <p className={styles.cardSubtitle}>
          Instala <a href="https://espanso.org/install/" target="_blank" rel="noopener noreferrer" style={{ color: '#4ADE80' }}>Espanso</a> y
          copia el archivo <code>tools/espanso/planazos.yml</code> a la carpeta de matches
          (<code>espanso path</code> en terminal). Luego en cualquier campo de texto teclea:
        </p>
        <ul className={styles.tipsList} style={{ marginTop: '0.5rem' }}>
          <li><code>:planazos-corta</code> → descripción corta (~150 chars)</li>
          <li><code>:planazos-media</code> → descripción media con emojis</li>
          <li><code>:planazos-larga</code> → descripción larga completa</li>
          <li><code>:planazos-reddit</code> → post Reddit / Facebook</li>
          <li><code>:planazos-tags</code> → tags / keywords</li>
          <li><code>:planazos-link</code> → link al grupo de WhatsApp</li>
          <li><code>:planazos-link-utm</code> → pide source, genera link UTM</li>
          <li><code>:planazos-web</code> → planazosbcn.com</li>
        </ul>
      </section>

      {/* ── COPYS ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>📝 Copys listos</h2>
        <p className={styles.cardSubtitle}>
          Copia y pega en cada directorio. El link de tracking se genera automáticamente al marcar un directorio.
        </p>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Título</span>
            <CopyButton value={TITLE} />
          </div>
          <div className={styles.fieldValue}>{TITLE}</div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Tags / keywords</span>
            <CopyButton value={TAGS} />
          </div>
          <div className={styles.fieldValue}>{TAGS}</div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Descripción corta (~150 chars)</span>
            <CopyButton value={COPY_SHORT} />
          </div>
          <div className={styles.fieldValue}>{COPY_SHORT}</div>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Descripción media</span>
            <CopyButton value={COPY_MID} />
          </div>
          <pre className={styles.fieldPre}>{COPY_MID}</pre>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Descripción larga</span>
            <CopyButton value={COPY_LONG} />
          </div>
          <pre className={styles.fieldPre}>{COPY_LONG}</pre>
        </div>

        <div className={styles.field}>
          <div className={styles.fieldHeader}>
            <span className={styles.fieldLabel}>Post Reddit / Facebook</span>
            <CopyButton value={COPY_REDDIT} />
          </div>
          <pre className={styles.fieldPre}>{COPY_REDDIT}</pre>
        </div>
      </section>

      {/* ── CAMPAIGN PICKER ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>🎯 Campaña activa</h2>
        <p className={styles.cardSubtitle}>
          Se incluye en cada link de tracking como <code>utm_campaign</code>.
        </p>
        <input
          className={styles.input}
          value={campaign}
          onChange={(e) => setCampaign(e.target.value.replace(/[^a-z0-9-_]/gi, '').toLowerCase())}
          placeholder="launch"
        />
      </section>

      {/* ── DIRECTORIES ── */}
      <section className={styles.card}>
        <div className={styles.cardHeader}>
          <h2 className={styles.cardTitle}>📋 Checklist de directorios</h2>
          <button className={styles.resetBtn} onClick={reset} type="button">
            Reset
          </button>
        </div>

        <div className={styles.filterRow}>
          {[
            { id: 'all', label: 'Todos' },
            { id: 'pending', label: 'Pendientes' },
            { id: 'done', label: 'Hechos' },
            { id: 'directory', label: 'Directorios' },
            { id: 'reddit', label: 'Reddit' },
            { id: 'facebook', label: 'Facebook' },
            { id: 'telegram', label: 'Telegram' },
          ].map((f) => (
            <button
              key={f.id}
              type="button"
              className={`${styles.filterBtn} ${filter === f.id ? styles.filterBtnActive : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div className={styles.directoryList}>
          {filtered.map((d) => {
            const link = buildWaLink(d.id, { medium: d.kind, campaign });
            const isChecked = !!checked[d.id];
            return (
              <div key={d.id} className={`${styles.directoryRow} ${isChecked ? styles.directoryRowDone : ''}`}>
                <label className={styles.directoryCheckLabel}>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggle(d.id)}
                    className={styles.directoryCheck}
                  />
                  <span
                    className={styles.directoryKind}
                    style={{ background: KIND_COLOR[d.kind] || '#888' }}
                    title={KIND_LABEL[d.kind]}
                  >
                    {KIND_LABEL[d.kind][0]}
                  </span>
                  <span className={styles.directoryLabel}>{d.label}</span>
                  {d.tier === 'top' && <span className={styles.tierBadge}>top</span>}
                </label>

                <div className={styles.directoryActions}>
                  <a
                    href={d.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.directoryLink}
                  >
                    Abrir ↗
                  </a>
                  <CopyButton value={link} label="Copiar link UTM" />
                </div>

                {isChecked && (
                  <div className={styles.directoryDoneStamp}>
                    ✓ {new Date(checked[d.id]).toLocaleDateString('es-ES')}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ── BANNERS ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>🖼️ Banners y logos</h2>
        <p className={styles.cardSubtitle}>
          Imágenes para usar como avatar / portada en directorios.
        </p>
        <div className={styles.bannerGrid}>
          {BANNERS.map((b) => (
            <a key={b.url} href={b.url} download className={styles.bannerCard}>
              <div className={styles.bannerImgWrap}>
                <img src={b.url} alt={b.label} className={styles.bannerImg} />
              </div>
              <span className={styles.bannerLabel}>{b.label}</span>
              <span className={styles.bannerDownload}>Descargar ↓</span>
            </a>
          ))}
        </div>
      </section>

      {/* ── TIPS ── */}
      <section className={styles.card}>
        <h2 className={styles.cardTitle}>💡 Consejos rápidos</h2>
        <ul className={styles.tipsList}>
          <li>Publica máximo 5-6 directorios al día. Más de 10 mismo día = WhatsApp marca el link como sospechoso.</li>
          <li>Usa <code>Espanso</code> o un text expander: defines un atajo y pegas la descripción en 1 segundo.</li>
          <li>En Reddit no spammees: comenta primero en posts ajenos, publica solo si el subreddit lo permite.</li>
          <li>En Facebook, los grupos de Erasmus / expats convierten mejor que los grupos de &quot;españoles en BCN&quot;.</li>
          <li>Cada 2 semanas revisa qué <code>utm_source</code> trajo más clicks (logs de Vercel o Plausible) y dobla esfuerzo ahí.</li>
        </ul>
      </section>
    </div>
  );
}
