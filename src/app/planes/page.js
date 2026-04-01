import { Suspense } from 'react';
import PlanCard from '@/components/PlanCard/PlanCard';
import PlansFilters from './PlansFilters';
import { supabase } from '@/lib/supabase';
import styles from './page.module.css';

// ISR: regenerate every 60s for fast cached pages (critical for SEO)
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

// Map Spanish month abbreviations to JS month indices
const MONTH_MAP = {
  'ene': 0, 'enero': 0,
  'feb': 1, 'febrero': 1,
  'mar': 2, 'marzo': 2,
  'abr': 3, 'abril': 3,
  'may': 4, 'mayo': 4,
  'jun': 5, 'junio': 5,
  'jul': 6, 'julio': 6,
  'ago': 7, 'agosto': 7,
  'sep': 8, 'sept': 8, 'septiembre': 8,
  'oct': 9, 'octubre': 9,
  'nov': 10, 'noviembre': 10,
  'dic': 11, 'diciembre': 11,
};

// Map JS day index to Spanish day id
const DAY_MAP = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

/**
 * Parse a Spanish text date like "SÁB. 28 MARZO 2026" into a JS Date.
 */
function parseSpanishDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/[.,]/g, '').toLowerCase().trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  let day = null, month = null, year = null;

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      if (num > 31) {
        year = num;
      } else if (day === null) {
        day = num;
      } else {
        year = num > 100 ? num : 2000 + num;
      }
    } else if (MONTH_MAP[part] !== undefined) {
      month = MONTH_MAP[part];
    }
  }

  if (day !== null && month !== null) {
    if (year === null) year = new Date().getFullYear();
    return new Date(year, month, day);
  }
  return null;
}

/**
 * Determines if a plan is "tardeo" or "nocturno" based on its data.
 */
function getTimeSlot(plan) {
  if (plan.etiquetas && Array.isArray(plan.etiquetas)) {
    if (plan.etiquetas.includes('tardeo')) return 'tardeo';
    if (plan.etiquetas.includes('nocturno')) return 'nocturno';
  }
  if (plan.time_start) {
    const hour = parseInt(plan.time_start.split(':')[0], 10);
    if (hour >= 14 && hour < 21) return 'tardeo';
    if (hour >= 21 || hour < 6) return 'nocturno';
  }
  if (plan.category === 'nocturno') return 'nocturno';
  return null;
}

export default async function PlanesPage({ searchParams }) {
  const params = await searchParams;
  const activeCategory = params?.categoria || 'all';
  const activeDay = params?.dia || 'all';
  const activeTimeSlot = params?.horario || 'all';
  const searchQuery = params?.q || '';

  // Fetch all active plans from Supabase (server-side = indexable by Google!)
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching plans:', error);
  }

  let plans = (data || []).map(mapPlanData);

  // Apply filters server-side
  if (activeCategory !== 'all') {
    plans = plans.filter((p) => p.category === activeCategory);
  }

  if (activeDay !== 'all') {
    plans = plans.filter((p) => {
      const parsed = parseSpanishDate(p.date);
      if (!parsed) return false;
      return DAY_MAP[parsed.getDay()] === activeDay;
    });
  }

  if (activeTimeSlot !== 'all') {
    plans = plans.filter((p) => getTimeSlot(p) === activeTimeSlot);
  }

  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    plans = plans.filter(
      (p) =>
        p.title?.toLowerCase().includes(q) ||
        p.excerpt?.toLowerCase().includes(q) ||
        p.zone?.toLowerCase().includes(q)
    );
  }

  const hasActiveFilters = activeCategory !== 'all' || activeDay !== 'all' || activeTimeSlot !== 'all' || searchQuery.trim();

  return (
    <div className={styles.page}>
      {/* Header */}
      <section className={styles.header}>
        <div className="container">
          <h1 className={styles.title}>Todos los planes</h1>
          <p className={styles.subtitle}>
            Explora todo lo que Barcelona tiene para ti
          </p>
        </div>
      </section>

      {/* Filters — Client Component */}
      <Suspense fallback={null}>
        <PlansFilters />
      </Suspense>

      {/* Results — Server Rendered (indexable!) */}
      <section className="section section--compact">
        <div className="container">
          <p className={styles.resultCount}>
            {plans.length} {plans.length === 1 ? 'plan encontrado' : 'planes encontrados'}
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
              <h3 className={styles.emptyTitle}>No hay planes que coincidan</h3>
              <p className={styles.emptyDesc}>Prueba con otra categoría o busca algo diferente</p>
              <a
                href="/planes"
                className="btn btn--secondary"
                id="reset-filters"
              >
                Ver todos los planes
              </a>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
