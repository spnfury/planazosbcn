'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import ImageUploader from '@/components/ImageUploader';
import styles from '../../admin.module.css';

const CATEGORIES = [
  { id: 'gastro', label: 'Gastronomía' },
  { id: 'naturaleza', label: 'Naturaleza' },
  { id: 'ocio', label: 'Ocio & Fiesta' },
  { id: 'cultura', label: 'Cultura' },
  { id: 'rutas', label: 'Rutas' },
  { id: 'nocturno', label: 'Nocturno' },
  { id: 'servicios', label: 'Servicios' },
  { id: 'bienestar', label: 'Bienestar' },
];

export default function EditPlanPage({ params }) {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const [planId, setPlanId] = useState(null);
  const [form, setForm] = useState(null);
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [tickets, setTickets] = useState([]);
  const [guestLists, setGuestLists] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [originalPlan, setOriginalPlan] = useState(null);

  useEffect(() => {
    async function load() {
      const { id } = await params;
      setPlanId(id);

      const { data: plan } = await supabase
        .from('plans')
        .select('*, plan_tags(*), plan_tickets(*), plan_guest_lists(*), plan_schedule(*)')
        .eq('id', id)
        .single();

      if (!plan) {
        router.push('/admin/planes');
        return;
      }

      setForm({
        type: plan.type || 'plan',
        title: plan.title || '',
        slug: plan.slug || '',
        excerpt: plan.excerpt || '',
        description: plan.description || '',
        image: plan.image || '',
        poster_image: plan.poster_image || '',
        category: plan.category || 'gastro',
        category_label: plan.category_label || '',
        zone: plan.zone || '',
        date: plan.date || '',
        price: plan.price || '',
        precio_reserva: plan.precio_reserva != null ? String(plan.precio_reserva) : '',
        shipping_cost: plan.shipping_cost != null ? String(plan.shipping_cost) : '',
        venue: plan.venue || '',
        address: plan.address || '',
        time_start: plan.time_start || '',
        time_end: plan.time_end || '',
        capacity: plan.capacity != null ? String(plan.capacity) : '0',
        spots_taken: plan.spots_taken != null ? String(plan.spots_taken) : '0',
        featured: plan.featured || false,
        sponsored: plan.sponsored || false,
        published: plan.published !== false,
        age_restriction: plan.age_restriction || '',
      });

      setOriginalPlan({ ...plan });

      setTags((plan.plan_tags || []).map((t) => t.tag));
      setTickets((plan.plan_tickets || []).sort((a, b) => a.sort_order - b.sort_order));
      setGuestLists((plan.plan_guest_lists || []).sort((a, b) => a.sort_order - b.sort_order));
      setSchedule((plan.plan_schedule || []).sort((a, b) => a.sort_order - b.sort_order));
      setLoading(false);
    }

    load();
  }, [params, router]);

  function updateForm(field, value) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
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
      // Convert numeric strings to numbers for DB
      const payload = {
        ...form,
        precio_reserva: Number(form.precio_reserva) || 0,
        shipping_cost: Number(form.shipping_cost) || 0,
        capacity: Number(form.capacity) || 0,
        spots_taken: Number(form.spots_taken) || 0,
      };

      // Update plan
      const { error: planError } = await supabase
        .from('plans')
        .update(payload)
        .eq('id', planId);

      if (planError) throw planError;

      // Replace tags
      await supabase.from('plan_tags').delete().eq('plan_id', planId);
      if (tags.length > 0) {
        await supabase.from('plan_tags').insert(
          tags.map((tag) => ({ plan_id: planId, tag }))
        );
      }

      // Replace tickets
      await supabase.from('plan_tickets').delete().eq('plan_id', planId);
      if (tickets.length > 0) {
        await supabase.from('plan_tickets').insert(
          tickets.map((t, i) => ({
            plan_id: planId,
            name: t.name,
            price: t.price,
            description: t.description,
            capacity: t.capacity || 0,
            spots_taken: t.spots_taken || 0,
            sold_out: t.sold_out || false,
            sort_order: i,
          }))
        );
      }

      // Replace guest lists
      await supabase.from('plan_guest_lists').delete().eq('plan_id', planId);
      if (guestLists.length > 0) {
        await supabase.from('plan_guest_lists').insert(
          guestLists.map((g, i) => ({
            plan_id: planId,
            name: g.name,
            time_range: g.time_range,
            price: g.price,
            description: g.description,
            sold_out: g.sold_out || false,
            sort_order: i,
          }))
        );
      }

      // Replace schedule
      await supabase.from('plan_schedule').delete().eq('plan_id', planId);
      if (schedule.length > 0) {
        await supabase.from('plan_schedule').insert(
          schedule.map((s, i) => ({
            plan_id: planId,
            time: s.time,
            description: s.description,
            sort_order: i,
          }))
        );
      }

      router.push('/admin/planes');

      // Log changes (fire and forget)
      if (originalPlan) {
        const trackFields = ['title','slug','excerpt','description','image','poster_image','category','zone','date','price','precio_reserva','shipping_cost','venue','address','time_start','time_end','capacity','spots_taken','featured','sponsored','published','age_restriction','type'];
        const changes = {};
        for (const f of trackFields) {
          if (String(originalPlan[f] ?? '') !== String(payload[f] ?? '')) {
            changes[f] = { old: originalPlan[f] ?? null, new: payload[f] ?? null };
          }
        }
        if (Object.keys(changes).length > 0) {
          fetch('/api/log', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'plan.updated', details: { planId, title: form.title, changes }, status: 'success' }) }).catch(() => {});
        }
      }
    } catch (err) {
      setError(err.message || 'Error al guardar');
      setSaving(false);
    }
  }

  if (loading || !form) {
    return <p style={{ color: 'rgba(255,255,255,0.4)' }}>Cargando...</p>;
  }

  return (
    <>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Editar plan</h1>
          <p className={styles.pageSubtitle}>{form.title}</p>
        </div>
        {form.slug && (
          <Link 
            href={`/planes/${form.slug}`} 
            target="_blank" 
            className={styles.actionBtn}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none' }}
          >
            ↗ Ver en la web
          </Link>
        )}
      </div>

      {error && <div className={styles.loginError} style={{ marginBottom: '1rem' }}>{error}</div>}

      <form onSubmit={handleSubmit}>
        {/* Basic Info */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>📝 Información básica</h3>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Tipo</label>
              <select className={styles.formSelect} value={form.type} onChange={(e) => updateForm('type', e.target.value)}>
                <option value="plan">Plan</option>
                <option value="evento">Evento</option>
                <option value="sorpresa">Sorpresa/Regalo</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Categoría</label>
              <select className={styles.formSelect} value={form.category} onChange={(e) => updateForm('category', e.target.value)}>
                {CATEGORIES.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
              </select>
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Título</label>
              <input type="text" className={styles.formInput} value={form.title} onChange={(e) => updateForm('title', e.target.value)} required id="edit-title" />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Slug</label>
              <input type="text" className={styles.formInput} value={form.slug} onChange={(e) => updateForm('slug', e.target.value)} required id="edit-slug" />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Resumen</label>
              <input type="text" className={styles.formInput} value={form.excerpt} onChange={(e) => updateForm('excerpt', e.target.value)} id="edit-excerpt" />
            </div>
            <div className={`${styles.formGroup} ${styles.formGridFull}`}>
              <label className={styles.formLabel}>Descripción</label>
              <textarea className={styles.formInput} style={{ minHeight: '120px', resize: 'vertical' }} value={form.description} onChange={(e) => updateForm('description', e.target.value)} id="edit-description" />
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
                id="edit-image"
              />
            </div>
            {form.type === 'evento' && (
              <div className={styles.formGridFull}>
                <ImageUploader
                  value={form.poster_image}
                  onChange={(url) => updateForm('poster_image', url)}
                  label="Poster vertical"
                  id="edit-poster"
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
              <input type="text" className={styles.formInput} value={form.zone} onChange={(e) => updateForm('zone', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Fecha</label>
              <input type="text" className={styles.formInput} value={form.date} onChange={(e) => updateForm('date', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio</label>
              <input type="text" className={styles.formInput} value={form.price} onChange={(e) => updateForm('price', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Precio Pre-reserva (€)</label>
              <input type="number" step="0.01" className={styles.formInput} value={form.precio_reserva} onChange={(e) => updateForm('precio_reserva', e.target.value)} min="0" />
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
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Aforo</label>
              <input type="number" className={styles.formInput} value={form.capacity} onChange={(e) => updateForm('capacity', e.target.value)} min="0" />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.formLabel}>Plazas ocupadas</label>
              <input type="number" className={styles.formInput} value={form.spots_taken} onChange={(e) => updateForm('spots_taken', e.target.value)} min="0" />
            </div>
            {form.type === 'evento' && (
              <>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Venue</label>
                  <input type="text" className={styles.formInput} value={form.venue} onChange={(e) => updateForm('venue', e.target.value)} />
                </div>
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label className={styles.formLabel}>Dirección</label>
                  <input type="text" className={styles.formInput} value={form.address} onChange={(e) => updateForm('address', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hora inicio</label>
                  <input type="time" className={styles.formInput} value={form.time_start} onChange={(e) => updateForm('time_start', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Hora fin</label>
                  <input type="time" className={styles.formInput} value={form.time_end} onChange={(e) => updateForm('time_end', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Restricción de edad</label>
                  <input type="text" className={styles.formInput} value={form.age_restriction} onChange={(e) => updateForm('age_restriction', e.target.value)} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Tags */}
        {form.type === 'evento' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🏷️ Tags</h3>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.75rem' }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ padding: '0.3rem 0.75rem', background: 'rgba(139,92,246,0.12)', borderRadius: '100px', color: '#A78BFA', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  {tag}
                  <button type="button" onClick={() => setTags(tags.filter((_, j) => j !== i))} style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer', fontSize: '0.9rem' }}>×</button>
                </span>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input type="text" className={styles.formInput} value={tagInput} onChange={(e) => setTagInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addTag(); }}} placeholder="Añadir tag..." style={{ flex: 1 }} />
              <button type="button" className={styles.addBtn} onClick={addTag}>＋</button>
            </div>
          </div>
        )}

        {/* Tickets */}
        {form.type === 'evento' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🎟️ Entradas</h3>
            {tickets.map((ticket, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemFields}>
                  <input type="text" className={styles.formInput} placeholder="Nombre" value={ticket.name} onChange={(e) => { const c = [...tickets]; c[i] = { ...c[i], name: e.target.value }; setTickets(c); }} />
                  <input type="text" className={styles.formInput} placeholder="Precio" value={ticket.price} onChange={(e) => { const c = [...tickets]; c[i] = { ...c[i], price: e.target.value }; setTickets(c); }} />
                  <input type="number" className={styles.formInput} placeholder="Capacidad" value={ticket.capacity} onChange={(e) => { const c = [...tickets]; c[i] = { ...c[i], capacity: Number(e.target.value) }; setTickets(c); }} />
                  <input type="text" className={styles.formInput} placeholder="Descripción" value={ticket.description || ''} onChange={(e) => { const c = [...tickets]; c[i] = { ...c[i], description: e.target.value }; setTickets(c); }} />
                </div>
                <button type="button" className={styles.removeBtn} onClick={() => setTickets(tickets.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => setTickets([...tickets, { name: '', price: '', description: '', capacity: 0, spots_taken: 0, sold_out: false }])}>＋ Añadir entrada</button>
          </div>
        )}

        {/* Schedule */}
        {form.type === 'evento' && (
          <div className={styles.formSection}>
            <h3 className={styles.formSectionTitle}>🕐 Horario</h3>
            {schedule.map((item, i) => (
              <div key={i} className={styles.listItem}>
                <div className={styles.listItemFields}>
                  <input type="time" className={styles.formInput} value={item.time} onChange={(e) => { const c = [...schedule]; c[i] = { ...c[i], time: e.target.value }; setSchedule(c); }} />
                  <input type="text" className={styles.formInput} placeholder="Descripción" value={item.description} onChange={(e) => { const c = [...schedule]; c[i] = { ...c[i], description: e.target.value }; setSchedule(c); }} />
                </div>
                <button type="button" className={styles.removeBtn} onClick={() => setSchedule(schedule.filter((_, j) => j !== i))}>✕</button>
              </div>
            ))}
            <button type="button" className={styles.addBtn} onClick={() => setSchedule([...schedule, { time: '', description: '' }])}>＋ Añadir horario</button>
          </div>
        )}

        {/* Options */}
        <div className={styles.formSection}>
          <h3 className={styles.formSectionTitle}>⚙️ Opciones</h3>
          <div style={{ display: 'flex', gap: '2rem' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => updateForm('featured', e.target.checked)} /> Destacado
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.sponsored} onChange={(e) => updateForm('sponsored', e.target.checked)} /> Patrocinado
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem', cursor: 'pointer' }}>
              <input type="checkbox" checked={form.published} onChange={(e) => updateForm('published', e.target.checked)} /> Publicado
            </label>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button type="button" className={styles.actionBtn} onClick={() => router.push('/admin/planes')}>Cancelar</button>
          <button type="submit" className={styles.btnPrimary} disabled={saving} id="edit-submit">
            {saving ? 'Guardando...' : '✓ Guardar cambios'}
          </button>
        </div>
      </form>
    </>
  );
}
