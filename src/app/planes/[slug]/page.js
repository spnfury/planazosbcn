import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlanCard from '@/components/PlanCard/PlanCard';
import { PLANS, getPlanBySlug } from '@/data/plans';
import styles from './page.module.css';

export function generateStaticParams() {
  return PLANS.map((plan) => ({ slug: plan.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) return {};

  return {
    title: `${plan.title} — PlanazosBCN`,
    description: plan.excerpt,
    openGraph: {
      title: plan.title,
      description: plan.excerpt,
      images: [plan.image],
    },
  };
}

export default async function PlanDetailPage({ params }) {
  const { slug } = await params;
  const plan = getPlanBySlug(slug);
  if (!plan) notFound();

  const relatedPlans = PLANS.filter(
    (p) => p.category === plan.category && p.id !== plan.id
  ).slice(0, 3);

  return (
    <div className={styles.page}>
      {/* Breadcrumb */}
      <div className={`container ${styles.breadcrumb}`}>
        <Link href="/" className={styles.crumb}>Inicio</Link>
        <span className={styles.crumbSep}>›</span>
        <Link href="/planes" className={styles.crumb}>Planes</Link>
        <span className={styles.crumbSep}>›</span>
        <span className={styles.crumbActive}>{plan.title}</span>
      </div>

      {/* Hero Image */}
      <div className={`container ${styles.heroWrap}`}>
        <div className={styles.hero}>
          <img src={plan.image} alt={plan.title} className={styles.heroImage} />
          <div className={styles.heroOverlay} />
          <div className={styles.heroContent}>
            {plan.sponsored && (
              <span className="badge badge--sponsored">Patrocinado</span>
            )}
            {plan.featured && (
              <span className="badge badge--featured">⭐ Destacado</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className={`container ${styles.content}`}>
        <div className={styles.main}>
          <div className={styles.meta}>
            <span className="badge badge--category">
              {plan.categoryLabel}
            </span>
            {plan.zone && (
              <span className={styles.zone}>📍 {plan.zone}</span>
            )}
          </div>

          <h1 className={styles.title}>{plan.title}</h1>

          <div className={styles.infoCards}>
            {plan.date && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>🗓️</span>
                <div>
                  <span className={styles.infoLabel}>Fecha</span>
                  <span className={styles.infoValue}>{plan.date}</span>
                </div>
              </div>
            )}
            {plan.price && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>💰</span>
                <div>
                  <span className={styles.infoLabel}>Precio</span>
                  <span className={styles.infoValue}>
                    {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€ por persona`}
                  </span>
                </div>
              </div>
            )}
            {plan.zone && (
              <div className={styles.infoCard}>
                <span className={styles.infoIcon}>📍</span>
                <div>
                  <span className={styles.infoLabel}>Zona</span>
                  <span className={styles.infoValue}>{plan.zone}, Barcelona</span>
                </div>
              </div>
            )}
          </div>

          <div className={styles.description}>
            <h2 className={styles.descTitle}>Sobre este plan</h2>
            <p>{plan.description}</p>
          </div>
        </div>

        {/* Sidebar */}
        <aside className={styles.sidebar}>
          <div className={styles.ctaCard}>
            <div className={styles.ctaPrice}>
              {plan.price === 'Gratis' ? (
                <span className={styles.ctaPriceValue}>Gratis</span>
              ) : (
                <>
                  <span className={styles.ctaPriceValue}>{plan.price}€</span>
                  <span className={styles.ctaPriceLabel}>por persona</span>
                </>
              )}
            </div>

            <button className="btn btn--primary btn--large" style={{ width: '100%' }} id="plan-reserve">
              Reservar ahora
            </button>

            <button className="btn btn--secondary btn--large" style={{ width: '100%' }} id="plan-info">
              Más información
            </button>

            <p className={styles.ctaNote}>
              ¿Tienes dudas? Escríbenos por WhatsApp
            </p>
          </div>

          <div className={styles.shareCard}>
            <h4 className={styles.shareTitle}>Comparte este plan</h4>
            <div className={styles.shareButtons}>
              <button className={styles.shareBtn} aria-label="Compartir en WhatsApp" id="share-whatsapp">
                📱 WhatsApp
              </button>
              <button className={styles.shareBtn} aria-label="Copiar enlace" id="share-link">
                🔗 Copiar link
              </button>
            </div>
          </div>
        </aside>
      </div>

      {/* Related */}
      {relatedPlans.length > 0 && (
        <section className="section section--compact">
          <div className="container">
            <div className="section-header">
              <span className="section-header__label">Te puede interesar</span>
              <h2 className="section-header__title">Planes similares</h2>
            </div>
            <div className={styles.relatedGrid}>
              {relatedPlans.map((rp) => (
                <PlanCard key={rp.id} plan={rp} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
