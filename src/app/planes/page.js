'use client';

import { useState, useMemo } from 'react';
import PlanCard from '@/components/PlanCard/PlanCard';
import { PLANS, CATEGORIES } from '@/data/plans';
import styles from './page.module.css';

export default function PlanesPage() {
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredPlans = useMemo(() => {
    let result = PLANS;
    if (activeCategory !== 'all') {
      result = result.filter((p) => p.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.excerpt.toLowerCase().includes(q) ||
          p.zone?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [activeCategory, searchQuery]);

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
        </div>
      </section>

      {/* Results */}
      <section className="section section--compact">
        <div className="container">
          <p className={styles.resultCount}>
            {filteredPlans.length} {filteredPlans.length === 1 ? 'plan encontrado' : 'planes encontrados'}
          </p>

          {filteredPlans.length > 0 ? (
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
                onClick={() => { setActiveCategory('all'); setSearchQuery(''); }}
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
