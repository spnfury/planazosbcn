import Link from 'next/link';
import { notFound } from 'next/navigation';
import PlanCard from '@/components/PlanCard/PlanCard';
import { CATEGORIES, getCategoryBySlug } from '@/data/plans';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

// Helper function to map snake_case from DB to camelCase for PlanCard
const mapPlanData = (plan) => ({
  ...plan,
  categoryLabel: plan.category_label,
  posterImage: plan.poster_image,
  timeStart: plan.time_start,
  timeEnd: plan.time_end,
  ageRestriction: plan.age_restriction,
});

export async function generateStaticParams() {
  return CATEGORIES.map((cat) => ({ slug: cat.slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) return {};

  return {
    title: category.metaTitle,
    description: category.metaDescription,
    openGraph: {
      title: category.metaTitle,
      description: category.metaDescription,
      url: `https://planazosbcn.com/planes/categoria/${category.slug}`,
      siteName: 'PlanazosBCN',
      locale: 'es_ES',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: category.metaTitle,
      description: category.metaDescription,
    },
    alternates: {
      canonical: `https://planazosbcn.com/planes/categoria/${category.slug}`,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;
  const category = getCategoryBySlug(slug);
  if (!category) notFound();

  // Fetch plans for this category from Supabase
  const { data: plansData, error } = await supabase
    .from('plans')
    .select('*')
    .eq('category', category.id)
    .eq('published', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching plans for category:', error);
  }

  const plans = (plansData || []).map(mapPlanData);

  // JSON-LD Structured Data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.heroTitle,
    description: category.metaDescription,
    url: `https://planazosbcn.com/planes/categoria/${category.slug}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Inicio',
          item: 'https://planazosbcn.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Planes',
          item: 'https://planazosbcn.com/planes',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: category.label,
          item: `https://planazosbcn.com/planes/categoria/${category.slug}`,
        },
      ],
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className={styles.page}>
        {/* Breadcrumbs */}
        <nav className={styles.breadcrumb} aria-label="Breadcrumb">
          <div className="container">
            <ol className={styles.breadcrumbList}>
              <li>
                <Link href="/" className={styles.crumb}>Inicio</Link>
                <span className={styles.crumbSep} aria-hidden="true">›</span>
              </li>
              <li>
                <Link href="/planes" className={styles.crumb}>Planes</Link>
                <span className={styles.crumbSep} aria-hidden="true">›</span>
              </li>
              <li>
                <span className={styles.crumbActive} aria-current="page">{category.label}</span>
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroEmoji}>{category.emoji}</div>
            <h1 className={styles.heroTitle}>{category.heroTitle}</h1>
            <h2 className={styles.heroSubtitle}>{category.heroSubtitle}</h2>
            <p className={styles.heroDescription}>{category.heroDescription}</p>
          </div>
        </section>

        {/* Plans Grid */}
        <section className="section section--compact">
          <div className="container">
            <p className={styles.resultCount}>
              {plans.length} {plans.length === 1 ? 'plan encontrado' : 'planes encontrados'} en {category.label}
            </p>

            {plans.length > 0 ? (
              <div className={`${styles.grid} stagger-children`}>
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyEmoji}>🔍</span>
                <h3 className={styles.emptyTitle}>Aún no hay planes en esta categoría</h3>
                <p className={styles.emptyDesc}>
                  Estamos preparando planes increíbles de {category.label.toLowerCase()} para ti. ¡Vuelve pronto!
                </p>
                <Link href="/planes" className="btn btn--primary" id="category-back-to-plans">
                  Ver todos los planes
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Other Categories */}
        <section className="section">
          <div className="container">
            <div className="section-header">
              <span className="section-header__label">Más categorías</span>
              <h2 className="section-header__title">Explora otros tipos de planes</h2>
            </div>
            <div className={styles.otherCategories}>
              {CATEGORIES.filter((c) => c.slug !== slug).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/planes/categoria/${cat.slug}`}
                  className={styles.otherCategoryCard}
                  id={`other-category-${cat.id}`}
                >
                  <span className={styles.otherCategoryEmoji}>{cat.emoji}</span>
                  <span className={styles.otherCategoryLabel}>{cat.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
