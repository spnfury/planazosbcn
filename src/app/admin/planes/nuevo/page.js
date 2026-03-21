'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/ImageUploader';
import { AGE_GROUPS, ETIQUETAS } from '@/data/planConstants';
import styles from '../../admin.module.css';

const CATEGORIES = [
  { id: 'gastro', label: 'Gastronomía' },
  { id: 'naturaleza', label: 'Naturaleza' },
  { id: 'cultura', label: 'Cultura' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'nocturno', label: 'Nocturno' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'bienestar', label: 'Bienestar' },
];

const EMPTY_TICKET = { name: '', price: '', description: '', capacity: 0, spots_taken: 0, sold_out: false };
const EMPTY_GUEST = { name: '', time_range: '', price: 'Gratis', description: '', sold_out: false };
const EMPTY_SCHEDULE = { time: '', description: '' };

export default function NuevoPlanPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
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
    precio_reserva: '',
    shipping_cost: '',
    venue: '',
    address: '',
    time_start: '',
    time_end: '',
    capacity: '50',
    spots_taken: '0',
    featured: false,
    sponsored: false,
    published: true,
    age_restriction: '',
    age_groups: [],
    etiquetas: [],
    collaborator_id: '',
  });

  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tickets, setTickets] = useState([]);
  const [guestLists, setGuestLists] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [reels, setReels] = useState([]);
  const [collaborators, setCollaborators] = useState([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // Fetch collaborators
  useEffect(() => {
    async function fetchCollaborators() {
      try {
        const res = await fetch('/api/admin/collaborators');
        if (res.ok) {
          const data = await res.json();
          setCollaborators(data);
        }
      } catch (err) {
        console.error('Error fetching collaborators:', err);
      }
    }
    fetchCollaborators();
  }, []);

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

  async function handleAiGenerate() {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    setError('');
    
    try {
      const res = await fetch('/api/admin/generate-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generating plan');
      
      if (data.type) updateForm('type', data.type);
      if (data.title) updateForm('title', data.title);
      if (data.excerpt) updateForm('excerpt', data.excerpt);
      if (data.description) updateForm('description', data.description);
      if (data.category) updateForm('category', data.category);
      if (data.zone) updateForm('zone', data.zone);
      if (data.date) updateForm('date', data.date);
      if (data.price !== undefined) updateForm('price', data.price);
      if (data.precio_reserva !== undefined) updateForm('precio_reserva', data.precio_reserva);
      if (data.shipping_cost !== undefined) updateForm('shipping_cost', data.shipping_cost);
      if (data.capacity !== undefined) updateForm('capacity', data.capacity);
      if (data.venue) updateForm('venue', data.venue);
      if (data.address) updateForm('address', data.address);
      if (data.time_start) updateForm('time_start', data.time_start);
      if (data.time_end) updateForm('time_end', data.time_end);
      if (data.age_restriction) updateForm('age_restriction', data.age_restriction);
      
      if (Array.isArray(data.age_groups)) updateForm('age_groups', data.age_groups);
      if (Array.isArray(data.etiquetas)) updateForm('etiquetas', data.etiquetas);
      
      if (Array.isArray(data.tickets)) setTickets(data.tickets.map(t => ({ ...EMPTY_TICKET, ...t })));
      if (Array.isArray(data.schedule)) setSchedule(data.schedule.map(s => ({ ...EMPTY_SCHEDULE, ...s })));
      
      setAiPrompt('');
    } catch (err) {
      setError(err.message);
    } finally {
      setAiLoading(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      // Convert numeric strings to numbers for DB
      const payload = {
        ...form,
        precio_reserva: Number(form.precio_reserva) || 0,
        shipping_cost: Number(form.shipping_cost) || 0,
        capacity: Number(form.capacity) || 0,
        spots_taken: Number(form.spots_taken) || 0,
      };

      if (!payload.collaborator_id) {
        delete payload.collaborator_id;
      }

      // Insert plan
      const { data: plan, error: planError } = await supabase
        .from('plans')
        .insert(payload)
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

      if (reels.length > 0) {
        await supabase.from('plan_reels').insert(
          reels.map((url, i) => ({ plan_id: plan.id, url, sort_order: i }))
        );
      }

      router.push('/admin/planes');

      // Log plan creation (fire and forget)
      fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'plan.created', details: { planId: plan.id, title: form.title, category: form.category, type: form.type } }) }).catch(() => {});
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
        {/* IA Assistant */}
        <div className={styles.formSection} style={{ border: '2px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.05)' }}>
          <h3 className={styles.formSectionTitle} style={{ color: '#A78BFA' }}>✨ Asistente Mágico</h3>
          <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.85rem', marginBottom: '1rem' }}>
            Describe el plan en lenguaje natural y el asistente creará e inventará una ficha detallada rellenando todos los campos requeridos por ti.
          </p>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
            <textarea
              className={styles.formInput}
              style={{ flex: 1, minHeight: '80px', resize: 'vertical' }}
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              placeholder="Ej: Haz un plan para cenar en Barcelona mañana en el barrio de Gràcia. Precio 25 euros, vegano y romantico..."
              id="form-ai-prompt"
            />
            <button
              type="button"
              onClick={handleAiGenerate}
              disabled={aiLoading}
              className={styles.btnPrimary}
              style={{ padding: '0.75rem 1.5rem', background: 'linear-gradient(to right, #8B5CF6, #EC4899)', border: 'none', height: 'fit-content' }}
            >
              {aiLoading ? 'Generando...' : 'Autocompletar'}
            </button>
          </div>
        </div>

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
                <option value="sorpresa">Sorpresa/Regalo</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Colaborador / Restaurante</label>
              <select
                className={styles.formSelect}
                value={form.collaborator_id}
                onChange={(e) => updateForm('collaborator_id', e.target.value)}
              >
                <option value="">Sin colaborador (Solo Admin)</option>
                {collaborators.map((c) => (
                  <option key={c.id} value={c.id}>{c.company_name || c.email}</option>
                ))}
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
                type="date"
                className={styles.formInput}
                value={form.date}
                onChange={(e) => updateForm('date', e.target.value)}
                placeholder="Sáb 22 Mar"
                id="form-date"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio (€ o &quot;Gratis&quot;)</label>
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
              <label className={styles.formLabel}>Precio Pre-reserva (€)</label>
              <input
                type="number"
                step="0.01"
                className={styles.formInput}
                value={form.precio_reserva}
                onChange={(e) => updateForm('precio_reserva', e.target.value)}
                min="0"
                placeholder="10"
                id="form-precio-reserva"
              />
            </div>
            {form.type === 'sorpresa' && (
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Coste de Envío (€)</label>
                <input
                  type="number"
                  step="0.01"
                  className={styles.formInput}
                  value={form.shipping_cost}
                  onChange={(e) => updateForm('shipping_cost', e.target.value)}
                  min="0"
                  placeholder="5.99"
                  id="form-shipping-cost"
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Aforo (capacidad máxima)</label>
              <input
                type="number"
                className={styles.formInput}
                value={form.capacity}
                onChange={(e) => updateForm('capacity', e.target.value)}
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

        {/* Age groups */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>👥 Clasificación por edades</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Selecciona uno o varios rangos de edad</p>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
            {AGE_GROUPS.map((ag) => {
              const selected = form.age_groups.includes(ag.id);
              return (
                <button
                  key={ag.id}
                  type="button"
                  onClick={() => {
                    updateForm('age_groups', selected
                      ? form.age_groups.filter((g) => g !== ag.id)
                      : [...form.age_groups, ag.id]
                    );
                  }}
                  style={{
                    padding: '0.5rem 1rem',
                    borderRadius: '100px',
                    border: selected ? '2px solid #8B5CF6' : '2px solid rgba(255,255,255,0.1)',
                    background: selected ? 'rgba(139,92,246,0.15)' : 'rgba(255,255,255,0.03)',
                    color: selected ? '#A78BFA' : 'rgba(255,255,255,0.5)',
                    cursor: 'pointer',
                    fontSize: '0.85rem',
                    transition: 'all 0.2s',
                  }}
                >
                  {ag.emoji} {ag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Etiquetas */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>🏷️ Etiquetas</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Selecciona las etiquetas que describen este plan</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '0.5rem' }}>
            {ETIQUETAS.map((et) => {
              const selected = form.etiquetas.includes(et.id);
              return (
                <button
                  key={et.id}
                  type="button"
                  onClick={() => {
                    updateForm('etiquetas', selected
                      ? form.etiquetas.filter((e) => e !== et.id)
                      : [...form.etiquetas, et.id]
                    );
                  }}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '8px',
                    border: selected ? '2px solid #F59E0B' : '2px solid rgba(255,255,255,0.08)',
                    background: selected ? 'rgba(245,158,11,0.12)' : 'rgba(255,255,255,0.03)',
                    color: selected ? '#FCD34D' : 'rgba(255,255,255,0.45)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{et.emoji}</span> {et.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Instagram Reels */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📸 Instagram Reels</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>Añade hasta 12 URLs de reels de Instagram para promocionar este plan</p>
          {reels.map((url, i) => (
            <div key={i} className={styles.listItem} style={{ marginBottom: '0.5rem' }}>
              <div className={styles.listItemFields} style={{ flex: 1 }}>
                <input
                  type="url"
                  className={styles.formInput}
                  placeholder="https://www.instagram.com/reel/XXXXX/"
                  value={url}
                  onChange={(e) => {
                    const copy = [...reels];
                    copy[i] = e.target.value;
                    setReels(copy);
                  }}
                />
              </div>
              <button
                type="button"
                className={styles.removeBtn}
                onClick={() => setReels(reels.filter((_, j) => j !== i))}
              >✕</button>
            </div>
          ))}
          {reels.length < 12 && (
            <button
              type="button"
              className={styles.addBtn}
              onClick={() => setReels([...reels, ''])}
            >＋ Añadir reel</button>
          )}
          {reels.length >= 12 && (
            <p style={{ color: 'rgba(245,158,11,0.7)', fontSize: '0.8rem', marginTop: '0.5rem' }}>Máximo de 12 reels alcanzado</p>
          )}
        </div>

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
