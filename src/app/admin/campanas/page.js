import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import styles from './page.module.css';

export const metadata = {
  title: 'Campañas de Outreach | Planazos BCN',
};

export default async function CampanasPage() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  // Fetch campaigns
  const { data: campaigns, error } = await supabase
    .from('outreach_campaigns')
    .select(`
      *,
      leads:outreach_leads ( status )
    `)
    .order('created_at', { ascending: false });

  if (error) {
    if(error.code === '42P01') {
      // Table doesn't exist yet
      return (
        <div className={styles.page}>
          <div className={styles.emptyState}>
            <div className={styles.emptyStateIcon}>🚨</div>
            <h3>Falta configurar la Base de Datos</h3>
            <p>La tabla de campañas no existe. Por favor ejecuta el script SQL en Supabase Studio.</p>
            <div className={styles.codeBlock}>
              cat scripts/outreach/schema.sql
            </div>
          </div>
        </div>
      );
    }
    console.error(error);
  }

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          🚀 Campañas de Outreach (DMs)
        </h1>
        <p className={styles.subtitle}>
          Controla a cuántos usuarios de Instagram/TikTok les has enviado mensajes para reservar mesa VIP.
        </p>
      </div>

      {!campaigns || campaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyStateIcon}>👻</div>
          <h3>Aún no tienes campañas</h3>
          <p>Ejecuta tu scraper local de Puppeteer para rellenar esta lista de seguidores automáticamente.</p>
          <div className={styles.codeBlock}>
            node scripts/outreach/scraper.js
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          {campaigns.map((camp) => {
            const total = camp.leads.length;
            const pending = camp.leads.filter(l => l.status === 'pending').length;
            const sent = camp.leads.filter(l => l.status === 'sent').length;

            return (
              <div key={camp.id} className={styles.card}>
                <div className={styles.cardTop}>
                  <h3>{camp.name}</h3>
                  <span className={`${styles.badge} ${styles['badge_' + camp.platform]}`}>
                    {camp.platform}
                  </span>
                </div>
                
                <div className={styles.stats}>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Pendientes</span>
                    <span className={`${styles.statValue} ${styles.pending}`}>{pending}</span>
                  </div>
                  <div className={styles.statItem}>
                    <span className={styles.statLabel}>Enviados (DMs)</span>
                    <span className={`${styles.statValue} ${styles.sent}`}>{sent}</span>
                  </div>
                </div>

                <div className={styles.progressLabel}>
                  Progreso total de extracción: {total} usuarios guardados
                </div>
                
                {pending > 0 && (
                  <div style={{ marginTop: '1rem', fontSize: '0.85rem', color: '#10B981', background: 'rgba(16,185,129,0.1)', padding: '0.5rem', borderRadius: '6px' }}>
                    💡 Tienes leads pendientes. Ejecuta <code>node scripts/outreach/sender.js</code> localmente para enviarlos de forma natural.
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
