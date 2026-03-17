'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import ImageUploader from '@/components/ImageUploader';
import styles from '../../admin.module.css';

const CATEGORIES = [
  { id: 'gastro', label: 'Gastronomía' },
  { id: 'naturaleza', label: 'Naturaleza' },
  { id: 'ocio', label: 'Ocio & Fiesta' },
  { id: 'cultura', label: 'Cultura' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'nocturno', label: 'Nocturno' },
];

const EMPTY_TICKET = { name: '', price: '', description: '', capacity: 0, spots_taken: 0, sold_out: false };
const EMPTY_GUEST = { name: '', time_range: '', price: 'Gratis', description: '', sold_out: false };
const EMPTY_SCHEDULE = { time: '', description: '' };

export default function NuevoPlanPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    type: 'plan',
    title: '',
    slug: '',
    excerpt: '',
    description: '',
    image: '',
    poster_image: '',
    category: 'gastro',
    category_label: 'Gastronomía',
    zone: '',
    date: '',
    price: '',
    venue: '',
    address: '',
    time_start: '',
    time_end: '',
    capacity: 50,
    spots_taken: 0,
    featured: false,
    sponsored: false,
    published: true,
    age_restriction: '',
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tickets, setTickets] = useState([]);
  const [guestLists, setGuestLists] = useState([]);
  const [schedule, setSchedule] = useState([]);

  function updateForm(field, value) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug
      if (field === 'title') {
        updated.slug = value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
      }
      // Sync category label
      if (field === 'category') {
        const cat = CATEGORIES.find((c) => c.id === value);
        updated.category_label = cat?.label || value;
      }
      return updated;
    });
  }

  function addTag() {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Insert plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert(form)
        .select()
        .single();

      if (planError) throw planError;

      // Insert related data
      if (tags.length > 0) {
        await supabase.from('plan_tags').insert(
          tags.map((tag) => ({ plan_id: plan.id, tag }))
        );
      }

      if (tickets.length > 0) {
        await supabase.from('plan_tickets').insert(
          tickets.map((t, i) => ({ ...t, plan_id: plan.id, sort_order: i }))
        );
      }

      if (guestLists.length > 0) {
        await supabase.from('plan_guest_lists').insert(
          guestLists.map((g, i) => ({ ...g, plan_id: plan.id, sort_order: i }))
        );
      }

      if (schedule.length > 0) {
        await supabase.from('plan_schedule').insert(
          schedule.map((s, i) => ({ ...s, plan_id: plan.id, sort_order: i }))
        );
      }

      router.push('/admin/planes');
    } catch (err) {
      setError(err.message || 'Error al guardar');
      setSaving(false);
    }
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Nuevo plan</h1>
          <p className={styles.pageSubtitle}>Crea un nuevo plan o evento</p>
        </div>
      </div>

      {error && <div className={styles.loginError} style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📝 Información básica</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo</label>
              <select
                className={styles.formSelect}
                value={form.type}
                onChange={(e) => updateForm('type', e.target.value)}
              >
                <option value="plan">Plan</option>
                <option value="evento">Evento</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Categoría</label>
              <select
                className={styles.formSelect}
                value={form.category}
                onChange={(e) => updateForm('category', e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>{c.label}</option>
                ))}
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Título</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.title}
                onChange={(e) => updateForm('title', e.target.value)}
                placeholder="Ruta de Tapas por El Born"
                required
                id="form-title"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Slug (URL)</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.slug}
                onChange={(e) => updateForm('slug', e.target.value)}
                placeholder="ruta-tapas-born"
                required
                id="form-slug"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Resumen corto</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.excerpt}
                onChange={(e) => updateForm('excerpt', e.target.value)}
                placeholder="Descripción breve para las tarjetas"
                id="form-excerpt"
              />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Descripción completa</label>
              <textarea
                className={styles.formInput}
                style={{ minHeight: '120px', resize: 'vertical' }}
                value={form.description}
                onChange={(e) => updateForm('description', e.target.value)}
                placeholder="Descripción detallada del plan o evento..."
                id="form-description"
              />
            </div>
          </div>
        </div>

        {/* Media */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>🖼️ Imágenes</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGridFull}>
              <ImageUploader
                value={form.image}
                onChange={(url) => updateForm('image', url)}
                label="Imagen principal"
                id="form-image"
              />
            </div>
            {form.type === 'evento' && (
              <div className={styles.formGridFull}>
                <ImageUploader
                  value={form.poster_image}
                  onChange={(url) => updateForm('poster_image', url)}
                  label="Poster vertical"
                  id="form-poster"
                />
              </div>
            )}
          </div>
        </div>

        {/* Details */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📍 Detalles</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Zona</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.zone}
                onChange={(e) => updateForm('zone', e.target.value)}
                placeholder="El Born"
                id="form-zone"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fecha</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.date}
                onChange={(e) => updateForm('date', e.target.value)}
                placeholder="Sáb 22 Mar"
                id="form-date"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio (€ o "Gratis")</label>
              <input
                type="text"
                className={styles.formInput}
                value={form.price}
                onChange={(e) => updateForm('price', e.target.value)}
                placeholder="25"
                id="form-price"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Aforo (capacidad máxima)</label>
              <input
                type="number"
                className={styles.formInput}
                value={form.capacity}
                onChange={(e) => updateForm('capacity', Number(e.target.value))}
                min="0"
                id="form-capacity"
              />
            </div>
            {form.type === 'evento' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Venue / Local</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.venue}
                    onChange={(e) => updateForm('venue', e.target.value)}
                    placeholder="Luz de Gas"
                    id="form-venue"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Dirección</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.address}
                    onChange={(e) => updateForm('address', e.target.value)}
                    placeholder="C/ de Muntaner, 246..."
                    id="form-address"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hora inicio</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={form.time_start}
                    onChange={(e) => updateForm('time_start', e.target.value)}
                    id="form-time-start"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hora fin</label>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={form.time_end}
                    onChange={(e) => updateForm('time_end', e.target.value)}
                    id="form-time-end"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Restricción de edad</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={form.age_restriction}
                    onChange={(e) => updateForm('age_restriction', e.target.value)}
                    placeholder="+18 años"
                    id="form-age"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags (for events) */}
        {form.type === 'evento' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🏷️ Tags</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {tags.map((tag, i) => (
                <span key={i} style={{
                  padding: '0.3rem 0.75rem',
                  background: 'rgba(139,92,246,0.12)',
                  borderRadius: '100px',
                  color: '#A78BFA',
                  fontSize: '0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}>
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((_, j) => j !== i))}
                    style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem' }}
                  >×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input
                type="text"
                className={styles.formInput}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}}
                placeholder="Añadir tag..."
                style={{ flex: 1 }}
                id="form-tag-input"
              />
              <button type="button" className={styles.addBtn} onClick={addTag}>＋ Añadir</button>
            </div>
          </div>
        )}

        {/* Tickets (for events) */}
        {form.type === 'evento' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🎟️ Entradas</h3>
            {tickets.map((ticket, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemFields}>
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Nombre de la entrada"
                    value={ticket.name}
                    onChange={(e) => {
                      const copy = [...tickets];
                      copy[i] = { ...copy[i], name: e.target.value };
                      setTickets(copy);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Precio (€)"
                    value={ticket.price}
                    onChange={(e) => {
                      const copy = [...tickets];
                      copy[i] = { ...copy[i], price: e.target.value };
                      setTickets(copy);
                    }}
                  />
                  <input
                    type="number"
                    className={styles.formInput}
                    placeholder="Capacidad"
                    value={ticket.capacity}
                    onChange={(e) => {
                      const copy = [...tickets];
                      copy[i] = { ...copy[i], capacity: Number(e.target.value) };
                      setTickets(copy);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Descripción"
                    value={ticket.description}
                    onChange={(e) => {
                      const copy = [...tickets];
                      copy[i] = { ...copy[i], description: e.target.value };
                      setTickets(copy);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setTickets(tickets.filter((_, j) => j !== i))}
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setTickets([...tickets, { ...EMPTY_TICKET }])}
            >＋ Añadir entrada</button>
          </div>
        )}

        {/* Schedule (for events) */}
        {form.type === 'evento' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🕐 Horario</h3>
            {schedule.map((item, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemFields}>
                  <input
                    type="time"
                    className={styles.formInput}
                    value={item.time}
                    onChange={(e) => {
                      const copy = [...schedule];
                      copy[i] = { ...copy[i], time: e.target.value };
                      setSchedule(copy);
                    }}
                  />
                  <input
                    type="text"
                    className={styles.formInput}
                    placeholder="Descripción"
                    value={item.description}
                    onChange={(e) => {
                      const copy = [...schedule];
                      copy[i] = { ...copy[i], description: e.target.value };
                      setSchedule(copy);
                    }}
                  />
                </div>
                <button
                  type="button"
                  className={styles.removeBtn}
                  onClick={() => setSchedule(schedule.filter((_, j) => j !== i))}
                >✕</button>
              </div>
            ))}
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setSchedule([...schedule, { ...EMPTY_SCHEDULE }])}
            >＋ Añadir horario</button>
          </div>
        )}

        {/* Options */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>⚙️ Opciones</h3>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.featured}
                onChange={(e) => updateForm('featured', e.target.checked)}
              /> Destacado
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.sponsored}
                onChange={(e) => updateForm('sponsored', e.target.checked)}
              /> Patrocinado
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={form.published}
                onChange={(e) => updateForm('published', e.target.checked)}
              /> Publicado
            </label>
          </div>
        </div>

        {/* Submit */}
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            className={styles.actionBtn}
            onClick={() => router.push('/admin/planes')}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.btnPrimary}
            disabled={saving}
            id="form-submit"
          >
            {saving ? 'Guardando...' : '✓ Crear plan'}
          </button>
        </div>
      </form>
    </>
  );
}
