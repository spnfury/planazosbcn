import Link from 'next/link';
import styles from './PlanCard.module.css';

const CATEGORY_EMOJIS = {
  gastro: '🍽️',
  naturaleza: '🌿',
  ocio: '🎉',
  cultura: '🎭',
  rutas: '🚶',
  nocturno: '🌙',
};

export default function PlanCard({ plan, featured = false }) {
  const emoji = CATEGORY_EMOJIS[plan.category] || '📍';

  return (
    <Link
      href={`/planes/${plan.slug}`}
      className={`${styles.card} ${featured ? styles.featured : ''}`}
      id={`plan-${plan.slug}`}
    >
      <div className={styles.imageWrap}>
        <img
          src={plan.image}
          alt={plan.title}
          className={styles.image}
          loading="lazy"
        />
        <div className={styles.overlay} />
        {plan.sponsored && (
          <span className={`badge badge--sponsored ${styles.sponsorBadge}`}>
            Patrocinado
          </span>
        )}
        {plan.featured && (
          <span className={`badge badge--featured ${styles.featuredBadge}`}>
            ⭐ Destacado
          </span>
        )}
        {plan.price && (
          <span className={styles.price}>
            {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€`}
          </span>
        )}
      </div>

      <div className={styles.body}>
        <div className={styles.meta}>
          <span className={`badge badge--category`}>
            {emoji} {plan.categoryLabel}
          </span>
          {plan.zone && (
            <span className={styles.zone}>📍 {plan.zone}</span>
          )}
        </div>

        <h3 className={styles.title}>{plan.title}</h3>
        <p className={styles.description}>{plan.excerpt}</p>

        <div className={styles.footer}>
          {plan.date && (
            <span className={styles.date}>
              🗓️ {plan.date}
            </span>
          )}
          <span className={styles.cta}>
            Ver más →
          </span>
        </div>
      </div>
    </Link>
  );
}
