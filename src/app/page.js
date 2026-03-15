import Link from 'next/link';
import PlanCard from '@/components/PlanCard/PlanCard';
import Newsletter from '@/components/Newsletter/Newsletter';
import { PLANS, CATEGORIES, getFeaturedPlans } from '@/data/plans';
import styles from './page.module.css';

export default function Home() {
  const featuredPlans = getFeaturedPlans();

  return (
    <>
      {/* HERO */}
      <section className={styles.hero}>
        <div className={styles.heroBg}>
          <div className={styles.heroGradient} />
          <div className={styles.heroPattern} />
        </div>
        <div className={`container ${styles.heroContent}`}>
          <div className={styles.heroText}>
            <span className={styles.heroBadge}>
              🔥 Tu guía de planes en Barcelona
            </span>
            <h1 className={styles.heroTitle}>
              Descubre los mejores
              <br />
              <span className={styles.heroHighlight}>planazos</span> de Barcelona
            </h1>
            <p className={styles.heroSubtitle}>
              Gastronomía, naturaleza, cultura, ocio nocturno y mucho más.
              Planes seleccionados por nuestra comunidad para ti.
            </p>
            <div className={styles.heroActions}>
              <Link href="/planes" className="btn btn--primary btn--large" id="hero-cta-plans">
                Explorar planes →
              </Link>
              <Link href="/#categorias" className="btn btn--secondary btn--large" id="hero-cta-categories">
                Ver categorías
              </Link>
            </div>
            <div className={styles.heroStats}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>8+</span>
                <span className={styles.statLabel}>Planes activos</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNumber}>6</span>
                <span className={styles.statLabel}>Categorías</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNumber}>BCN</span>
                <span className={styles.statLabel}>Barcelona</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="section" id="categorias">
        <div className="container">
          <div className="section-header">
            <span className="section-header__label">Categorías</span>
            <h2 className="section-header__title">¿Qué tipo de plan buscas?</h2>
            <p className="section-header__subtitle">
              Elige la categoría que más te apetezca y encuentra tu próximo planazo
            </p>
          </div>

          <div className={`${styles.categoryGrid} stagger-children`}>
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.id}
                href={`/planes?category=${cat.id}`}
                className={styles.categoryCard}
                id={`category-${cat.id}`}
              >
                <span className={styles.categoryEmoji}>{cat.emoji}</span>
                <h3 className={styles.categoryName}>{cat.label}</h3>
                <p className={styles.categoryDesc}>{cat.description}</p>
                <span className={styles.categoryCount}>{cat.count} planes →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PLANS */}
      <section className="section section--compact" id="planes">
        <div className="container">
          <div className="section-header">
            <span className="section-header__label">Destacados</span>
            <h2 className="section-header__title">Planes que no te puedes perder</h2>
            <p className="section-header__subtitle">
              Los favoritos de nuestra comunidad esta semana
            </p>
          </div>

          <div className={`${styles.planGrid} stagger-children`}>
            {featuredPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} featured />
            ))}
          </div>
        </div>
      </section>

      {/* ALL PLANS */}
      <section className="section section--compact">
        <div className="container">
          <div className="section-header">
            <span className="section-header__label">Esta semana</span>
            <h2 className="section-header__title">Todos los planes</h2>
            <p className="section-header__subtitle">
              Explora todo lo que Barcelona tiene para ofrecerte
            </p>
          </div>

          <div className={`${styles.planGrid} ${styles.planGridFull} stagger-children`}>
            {PLANS.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className={styles.allPlansAction}>
            <Link href="/planes" className="btn btn--primary btn--large" id="view-all-plans">
              Ver todos los planes →
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className={`section ${styles.howSection}`}>
        <div className="container">
          <div className="section-header">
            <span className="section-header__label">Cómo funciona</span>
            <h2 className="section-header__title">Tan fácil como 1, 2, 3</h2>
          </div>

          <div className={`${styles.howGrid} stagger-children`}>
            <div className={styles.howStep}>
              <span className={styles.howNumber}>1</span>
              <h3 className={styles.howTitle}>Explora</h3>
              <p className={styles.howDesc}>
                Navega por categorías o busca el tipo de plan que te apetece
              </p>
            </div>
            <div className={styles.howStep}>
              <span className={styles.howNumber}>2</span>
              <h3 className={styles.howTitle}>Elige</h3>
              <p className={styles.howDesc}>
                Encuentra el plan perfecto con toda la info que necesitas
              </p>
            </div>
            <div className={styles.howStep}>
              <span className={styles.howNumber}>3</span>
              <h3 className={styles.howTitle}>Disfruta</h3>
              <p className={styles.howDesc}>
                Reserva o simplemente ve. ¡Tu próximo planazo te espera!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* NEWSLETTER */}
      <Newsletter />

      {/* CTA - COLLABORATE */}
      <section className="section">
        <div className="container">
          <div className={styles.collaborateCard}>
            <div className={styles.collaborateContent}>
              <span className={styles.collaborateEmoji}>🤝</span>
              <h2 className={styles.collaborateTitle}>¿Tienes un local o experiencia en Barcelona?</h2>
              <p className={styles.collaborateDesc}>
                Llega a miles de personas que buscan los mejores planes de la ciudad.
                Únete a PlanazosBCN y haz crecer tu negocio.
              </p>
              <Link href="/contacto" className="btn btn--primary btn--large" id="cta-collaborate">
                Quiero colaborar →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
