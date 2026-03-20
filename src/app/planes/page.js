'use client';

import { useState, useMemo, useEffect } from 'react';
import PlanCard from '@/components/PlanCard/PlanCard';
import { CATEGORIES } from '@/data/plans';
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

// Days of the week for the filter (estilo YouBarcelona)
const DAYS = [
  { id: 'all', label: 'Todos', emoji: '📅' },
  { id: 'lunes', label: 'Lunes', emoji: 'L' },
  { id: 'martes', label: 'Martes', emoji: 'M' },
  { id: 'miercoles', label: 'Miércoles', emoji: 'X' },
  { id: 'jueves', label: 'Jueves', emoji: 'J' },
  { id: 'viernes', label: 'Viernes', emoji: 'V' },
  { id: 'sabado', label: 'Sábado', emoji: 'S' },
  { id: 'domingo', label: 'Domingo', emoji: 'D' },
];

// Time slot filter (Tardeo / Nocturno)
const TIME_SLOTS = [
  { id: 'all', label: 'Todos', emoji: '🕐' },
  { id: 'tardeo', label: 'Tardeo', emoji: '☀️' },
  { id: 'nocturno', label: 'Nocturno', emoji: '🌙' },
];

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

// Map Spanish day abbreviations
const DAY_MAP = {
  0: 'domingo', 1: 'lunes', 2: 'martes', 3: 'miercoles',
  4: 'jueves', 5: 'viernes', 6: 'sabado',
};

/**
 * Parse a Spanish text date like "SÁB. 28 MARZO 2026" or "Sáb 22 Mar" into a JS Date.
 * Returns null if parsing fails.
 */
function parseSpanishDate(dateStr) {
  if (!dateStr) return null;
  const clean = dateStr.replace(/[.,]/g, '').toLowerCase().trim();
  // Try to extract day (number), month, year
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
 * Determines if a plan is "tardeo" based on its time_start, etiquetas, or category.
 * A tardeo is generally between 14:00 and 20:00.
 */
function getTimeSlot(plan) {
  // Check etiquetas first
  if (plan.etiquetas && Array.isArray(plan.etiquetas)) {
    if (plan.etiquetas.includes('tardeo')) return 'tardeo';
    if (plan.etiquetas.includes('nocturno')) return 'nocturno';
  }

  // Check time_start
  if (plan.time_start) {
    const hour = parseInt(plan.time_start.split(':')[0], 10);
    if (hour >= 14 && hour < 21) return 'tardeo';
    if (hour >= 21 || hour < 6) return 'nocturno';
  }

  // Check category
  if (plan.category === 'nocturno') return 'nocturno';

  return null; // Not time-classified
}

export default function PlanesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeDay, setActiveDay] = useState('all');
  const [activeTimeSlot, setActiveTimeSlot] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [plans, setPlans] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchPlans() {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .order('date', { ascending: true });
        
      if (error) {
        console.error('Error fetching plans:', error);
      } else {
        setPlans((data || []).map(mapPlanData));
      }
      setIsLoading(false);
    }
    
    fetchPlans();
  }, []);

  const filteredPlans = useMemo(() => {
    let result = plans;

    // Filter by category
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }

    // Filter by day of week
    if (activeDay !== 'all') {
      result = result.filter((p) => {
        const parsed = parseSpanishDate(p.date);
        if (!parsed) return false;
        return DAY_MAP[parsed.getDay()] === activeDay;
      });
    }

    // Filter by time slot (tardeo / nocturno)
    if (activeTimeSlot !== 'all') {
      result = result.filter((p) => getTimeSlot(p) === activeTimeSlot);
    }

    // Search text filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.zone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, activeDay, activeTimeSlot, searchQuery, plans]);

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

      {/* Filters */}
      <section className={styles.filters}>
        <div className="container">
          {/* Category filters */}
          <div className={styles.filterBar}>
            <div className={styles.categories}>
              <button
                className={`${styles.categoryBtn} ${activeCategory === 'all' ? styles.categoryActive : ''}`}
                onClick={() => setActiveCategory('all')}
                id="filter-all"
              >
                Todos
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryActive : ''}`}
                  onClick={() => setActiveCategory(cat.id)}
                  id={`filter-${cat.id}`}
                >
                  {cat.emoji} {cat.label}
                </button>
              ))}
            </div>

            <div className={styles.searchWrap}>
              <svg className={styles.searchIcon} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar planes, zonas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="search-plans"
              />
            </div>
          </div>

          {/* Day of week + Time slot filters */}
          <div className={styles.filterRow}>
            {/* Day of week filter */}
            <div className={styles.dayFilter}>
              <span className={styles.filterLabel}>📅 Día:</span>
              <div className={styles.dayBtns}>
                {DAYS.map((day) => (
                  <button
                    key={day.id}
                    className={`${styles.dayBtn} ${activeDay === day.id ? styles.dayBtnActive : ''}`}
                    onClick={() => setActiveDay(day.id)}
                    id={`filter-day-${day.id}`}
                  >
                    {day.id === 'all' ? day.label : day.emoji}
                    <span className={styles.dayLabel}>{day.id !== 'all' ? day.label : ''}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot filter (Tardeo/Nocturno) */}
            <div className={styles.timeSlotFilter}>
              {TIME_SLOTS.map((slot) => (
                <button
                  key={slot.id}
                  className={`${styles.timeSlotBtn} ${activeTimeSlot === slot.id ? styles.timeSlotActive : ''} ${slot.id === 'tardeo' ? styles.timeSlotTardeo : ''} ${slot.id === 'nocturno' ? styles.timeSlotNocturno : ''}`}
                  onClick={() => setActiveTimeSlot(slot.id)}
                  id={`filter-timeslot-${slot.id}`}
                >
                  {slot.emoji} {slot.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Results */}
      <section className="section section--compact">
        <div className="container">
          <p className={styles.resultCount}>
            {filteredPlans.length} {filteredPlans.length === 1 ? 'plan encontrado' : 'planes encontrados'}
          </p>

          {isLoading ? (
            <div className={styles.empty}>
              <p>Cargando planes...</p>
            </div>
          ) : filteredPlans.length > 0 ? (
            <div className={`${styles.grid} stagger-children`}>
              {filteredPlans.map((plan) => (
                <PlanCard key={plan.id} plan={plan} />
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <span className={styles.emptyEmoji}>🔍</span>
              <h3 className={styles.emptyTitle}>No hay planes que coincidan</h3>
              <p className={styles.emptyDesc}>Prueba con otra categoría o busca algo diferente</p>
              <button
                className="btn btn--secondary"
                onClick={() => { setActiveCategory('all'); setActiveDay('all'); setActiveTimeSlot('all'); setSearchQuery(''); }}
                id="reset-filters"
              >
                Ver todos los planes
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
