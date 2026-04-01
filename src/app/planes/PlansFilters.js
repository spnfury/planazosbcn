'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { CATEGORIES } from '@/data/plans';
import styles from './page.module.css';

// Days of the week for the filter
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

export default function PlansFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCategory = searchParams.get('categoria') || 'all';
  const activeDay = searchParams.get('dia') || 'all';
  const activeTimeSlot = searchParams.get('horario') || 'all';
  const searchQuery = searchParams.get('q') || '';

  const updateFilter = useCallback((key, value) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value === 'all' || !value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const str = params.toString();
    router.push(`/planes${str ? `?${str}` : ''}`, { scroll: false });
  }, [searchParams, router]);

  return (
    <section className={styles.filters}>
      <div className="container">
        {/* Category filters */}
        <div className={styles.filterBar}>
          <div className={styles.categories}>
            <button
              className={`${styles.categoryBtn} ${activeCategory === 'all' ? styles.categoryActive : ''}`}
              onClick={() => updateFilter('categoria', 'all')}
              id="filter-all"
            >
              Todos
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`${styles.categoryBtn} ${activeCategory === cat.id ? styles.categoryActive : ''}`}
                onClick={() => updateFilter('categoria', cat.id)}
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
              defaultValue={searchQuery}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  updateFilter('q', e.target.value);
                }
              }}
              onBlur={(e) => updateFilter('q', e.target.value)}
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
                  onClick={() => updateFilter('dia', day.id)}
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
                onClick={() => updateFilter('horario', slot.id)}
                id={`filter-timeslot-${slot.id}`}
              >
                {slot.emoji} {slot.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
