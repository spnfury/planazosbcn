import Link from "next/link";
import PlanCard from "@/components/PlanCard/PlanCard";
import Newsletter from "@/components/Newsletter/Newsletter";
import { CATEGORIES } from "@/data/plans";
import { supabase } from "@/lib/supabase";
import { isPastEvent } from "@/lib/formatDate";
import { filterIncompletePlans } from "@/lib/filterIncompletePlans";
import styles from "./page.module.css";

// ISR: regenerate every 60 seconds so admin changes appear quickly
// while keeping pages statically cached for fast loads (critical for SEO)
export const revalidate = 60;

// Helper function to map snake_case from DB to camelCase for PlanCard
const mapPlanData = (plan) => ({
  ...plan,
  categoryLabel: plan.category_label,
  posterImage: plan.poster_image,
  timeStart: plan.time_start,
  timeEnd: plan.time_end,
  ageRestriction: plan.age_restriction,
});

export default async function Home() {
  // Fetch all active plans from Supabase
  const { data: plansData, error } = await supabase
    .from("plans")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching plans:", error);
  }

  const mappedPlans = (plansData || [])
    .map(mapPlanData)
    .filter((plan) => !isPastEvent(plan.date));
  const allPlans = await filterIncompletePlans(mappedPlans);

  // Build dynamic counts per category from actual Supabase data
  const categoryCounts = {};
  allPlans.forEach((p) => {
    const cat = p.category;
    categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
  });

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
              <img
                src="/logo-planazosbcn.png"
                alt=""
                className={styles.heroBadgeIcon}
              />
              Tu guía de planes en Barcelona
            </span>
            <h1 className={styles.heroTitle}>
              Descubre los mejores
              <br />
              <span className={styles.heroHighlight}>planazos</span> de
              Barcelona
            </h1>
            <p className={styles.heroSubtitle}>
              Gastronomía, naturaleza, cultura, ocio nocturno y mucho más.
              Planes seleccionados por nuestra comunidad para ti.
            </p>
            <div className={styles.heroActions}>
              <Link
                href="/planes"
                className="btn btn--primary btn--large"
                id="hero-cta-plans"
              >
                Explorar planes →
              </Link>
              <Link
                href="/#categorias"
                className="btn btn--secondary btn--large"
                id="hero-cta-categories"
              >
                Ver categorías
              </Link>
            </div>
          </div>

          {/* Hero Banner Image */}
          <div className={styles.heroBanner}>
            <img
              src="/hero-planazosbcn.jpg"
              alt="Los mejores planazos en Barcelona"
              className={styles.heroBannerImg}
            />
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

          <div
            className={`${styles.planGrid} ${styles.planGridFull} stagger-children`}
          >
            {allPlans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>

          <div className={styles.allPlansAction}>
            <Link
              href="/planes"
              className="btn btn--primary btn--large"
              id="view-all-plans"
            >
              Ver todos los planes →
            </Link>
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
              Elige la categoría que más te apetezca y encuentra tu próximo
              planazo
            </p>
          </div>

          <div className={`${styles.categoryGrid} stagger-children`}>
            {CATEGORIES.filter((cat) => categoryCounts[cat.id] > 0).map(
              (cat) => (
                <Link
                  key={cat.id}
                  href={`/planes/categoria/${cat.slug}`}
                  className={styles.categoryCard}
                  id={`category-${cat.id}`}
                >
                  <span className={styles.categoryEmoji}>{cat.emoji}</span>
                  <h3 className={styles.categoryName}>{cat.label}</h3>
                  <p className={styles.categoryDesc}>{cat.description}</p>
                  <span className={styles.categoryCount}>
                    {categoryCounts[cat.id] || 0} planes →
                  </span>
                </Link>
              ),
            )}
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

      {/* COMMUNITY */}
      <section className={`section ${styles.communitySection}`} id="comunidad">
        <div className="container">
          <div className="section-header">
            <span className="section-header__label">Comunidad</span>
            <h2 className="section-header__title">
              Más que planes, experiencias compartidas
            </h2>
            <p className="section-header__subtitle">
              Conecta con gente que comparte tus mismos gustos. Chatea, queda y
              haz amigos
            </p>
          </div>

          <div className={`${styles.communityGrid} stagger-children`}>
            <div className={styles.communityCard}>
              <span className={styles.communityCardIcon}>👥</span>
              <h3 className={styles.communityCardTitle}>Conoce gente nueva</h3>
              <p className={styles.communityCardDesc}>
                Ve quién se ha apuntado a cada plan. Descubre personas con tus
                mismos intereses y haz nuevos amigos
              </p>
            </div>
            <div
              className={`${styles.communityCard} ${styles.communityCardHighlight}`}
            >
              <span className={styles.communityCardIcon}>💬</span>
              <h3 className={styles.communityCardTitle}>Chat grupal</h3>
              <p className={styles.communityCardDesc}>
                Cada plan tiene su propio chat. Coordínate, haz preguntas y
                socializa con los demás asistentes antes del evento
              </p>
            </div>
            <div className={styles.communityCard}>
              <span className={styles.communityCardIcon}>🌟</span>
              <h3 className={styles.communityCardTitle}>
                Comparte experiencias
              </h3>
              <p className={styles.communityCardDesc}>
                Deja reseñas, comparte fotos y recomienda tus planes favoritos a
                la comunidad
              </p>
            </div>
          </div>

          <div className={styles.communityAction}>
            <Link
              href="/registro"
              className="btn btn--primary btn--large"
              id="cta-community"
            >
              Únete a la comunidad →
            </Link>
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
              <h2 className={styles.collaborateTitle}>
                ¿Tienes un local o experiencia en Barcelona?
              </h2>
              <p className={styles.collaborateDesc}>
                Llega a miles de personas que buscan los mejores planes de la
                ciudad. Únete a PlanazosBCN y haz crecer tu negocio.
              </p>
              <Link
                href="/contacto"
                className="btn btn--primary btn--large"
                id="cta-collaborate"
              >
                Quiero colaborar →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
