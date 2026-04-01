import Link from 'next/link';
import { getEtiqueta } from '@/data/planConstants';
import { formatDate } from '@/lib/formatDate';
import styles from './PlanCard.module.css';

const CATEGORY_EMOJIS = {
  gastro: '🍽️',
  naturaleza: '🌿',
  cultura: '🎭',
  rutas: '🚶',
  nocturno: '🌙',
  servicios: '🛠️',
  bienestar: '💆‍♀️',
};

export default function PlanCard({ plan, featured = false }) {
  const emoji = CATEGORY_EMOJIS[plan.category] || '📍';

  return (
    <article
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
        {plan.precio_reserva > 0 && plan.price !== 'Gratis' ? (
          <span className={styles.price}>
            Reserva {plan.precio_reserva}€
          </span>
        ) : plan.price && (
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

        <h3 className={styles.title}>
          <Link href={`/planes/${plan.slug}`} className={styles.stretchedLink}>
            {plan.title}
          </Link>
        </h3>
        <p className={styles.description}>{plan.excerpt}</p>

        <div className={styles.footer}>
          {plan.date && (
            <span className={styles.date}>
              📅️ {formatDate(plan.date)}
            </span>
          )}
          <span className={styles.cta}>
            Ver más →
          </span>
        </div>

        {plan.etiquetas && plan.etiquetas.length > 0 && (
          <div className={styles.etiquetas}>
            {plan.etiquetas.slice(0, 3).map((etId) => {
              const et = getEtiqueta(etId);
              return (
                <Link href={`/planes/tag/${etId}`} key={etId} className={styles.etiquetaMini}>
                  {et.emoji} {et.label}
                </Link>
              );
            })}
            {plan.etiquetas.length > 3 && (
              <span className={styles.etiquetaMore}>+{plan.etiquetas.length - 3}</span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
