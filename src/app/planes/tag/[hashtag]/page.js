import Link from "next/link";
import { notFound } from "next/navigation";
import PlanCard from "@/components/PlanCard/PlanCard";
import { ETIQUETAS, getEtiqueta } from "@/data/planConstants";
import { supabase } from "@/lib/supabase";
import { filterIncompletePlans } from "@/lib/filterIncompletePlans";
import styles from "./page.module.css";
import fs from "fs";
import path from "path";

// ISR: regenerate every 10 minutes
export const revalidate = 600;

const mapPlanData = (plan) => ({
  ...plan,
  categoryLabel: plan.category_label,
  posterImage: plan.poster_image,
  timeStart: plan.time_start,
  timeEnd: plan.time_end,
  ageRestriction: plan.age_restriction,
});

export async function generateStaticParams() {
  return ETIQUETAS.map((tag) => ({ hashtag: tag.id }));
}

export async function generateMetadata({ params }) {
  const { hashtag } = await params;
  const tag = getEtiqueta(hashtag);
  if (!tag) return {};

  const title = `Mejores planes de ${tag.label} en Barcelona — PlanazosBCN`;
  const description = `Descubre los mejores planes y eventos etiquetados como ${tag.label} en Barcelona.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://planazosbcn.com/planes/tag/${tag.id}`,
      siteName: "PlanazosBCN",
      locale: "es_ES",
      type: "website",
    },
    alternates: {
      canonical: `https://planazosbcn.com/planes/tag/${tag.id}`,
    },
  };
}

export default async function TagPage({ params }) {
  const { hashtag } = await params;
  const tagInfo = getEtiqueta(hashtag);
  if (!tagInfo || tagInfo.id !== hashtag) notFound();

  // Load SEO content if available
  let seoData = null;
  try {
    const seoFilePath = path.join(
      process.cwd(),
      "src",
      "data",
      "seoContent.json",
    );
    const seoContentFile = fs.readFileSync(seoFilePath, "utf8");
    const parsed = JSON.parse(seoContentFile);
    if (parsed && parsed.tags && parsed.tags[hashtag]) {
      seoData = parsed.tags[hashtag];
    }
  } catch (err) {
    console.error("Error loading seo content", err.message);
  }

  // Fetch all plans to filter by JSONB array (most reliable approach for various postgres array configurations)
  // or use contains if properly configured. We fallback to JS filter for safety in MVP if array structure varies.
  const { data: plansData, error } = await supabase
    .from("plans")
    .select("*")
    .eq("published", true)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching plans for tag:", error);
  }

  let plans = (plansData || []).map(mapPlanData);
  plans = plans.filter(
    (p) =>
      p.etiquetas &&
      Array.isArray(p.etiquetas) &&
      p.etiquetas.includes(hashtag),
  );
  plans = await filterIncompletePlans(plans);

  // JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: `Planes de ${tagInfo.label} en Barcelona`,
    description:
      seoData?.description ||
      `Los mejores planes de ${tagInfo.label} de la ciudad condal.`,
    url: `https://planazosbcn.com/planes/tag/${tagInfo.id}`,
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
                <Link href="/" className={styles.crumb}>
                  Inicio
                </Link>
                <span className={styles.crumbSep} aria-hidden="true">
                  ›
                </span>
              </li>
              <li>
                <Link href="/planes" className={styles.crumb}>
                  Planes
                </Link>
                <span className={styles.crumbSep} aria-hidden="true">
                  ›
                </span>
              </li>
              <li>
                <span className={styles.crumbActive} aria-current="page">
                  #{tagInfo.label}
                </span>
              </li>
            </ol>
          </div>
        </nav>

        {/* Hero Section */}
        <section className={styles.hero}>
          <div className="container">
            <div className={styles.heroEmoji}>{tagInfo.emoji}</div>
            <h1 className={styles.heroTitle}>
              Planes de {tagInfo.label} en Barcelona
            </h1>
            <h2 className={styles.heroSubtitle}>
              {seoData?.heroSubtitle ||
                `Todo lo relacionado con ${tagInfo.label}`}
            </h2>
            <p className={styles.heroDescription}>
              {seoData?.heroDescription ||
                `Explora nuestra selección de planes etiquetados como ${tagInfo.label}.`}
            </p>
          </div>
        </section>

        {/* Plans Grid */}
        <section className="section section--compact">
          <div className="container">
            <p className={styles.resultCount}>
              {plans.length}{" "}
              {plans.length === 1 ? "plan encontrado" : "planes encontrados"}{" "}
              con #{hashtag}
            </p>

            {plans.length > 0 ? (
              <div className={`${styles.grid} stagger-children`}>
                {plans.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} />
                ))}
              </div>
            ) : (
              <div className={styles.empty}>
                <span className={styles.emptyEmoji}>👀</span>
                <h3 className={styles.emptyTitle}>
                  Aún no hay planes con esta etiqueta
                </h3>
                <p className={styles.emptyDesc}>
                  Vuelve pronto, siempre estamos añadiendo planes nuevos.
                </p>
                <Link href="/planes" className="btn btn--primary">
                  Ver todos los planes
                </Link>
              </div>
            )}
          </div>
        </section>

        {/* Dynamic SEO Content Blocks */}
        {seoData && seoData.seoText && (
          <section className={styles.seoContent}>
            <div className="container">
              <div
                className={styles.seoContentInner}
                dangerouslySetInnerHTML={{ __html: seoData.seoText }}
              />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
