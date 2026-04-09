'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import styles from './eventos.module.css';
import adminStyles from '../admin.module.css';

const STEPS = [
  { id: 1, label: '📸 Imagen', short: 'Imagen' },
  { id: 2, label: '🤖 Análisis IA', short: 'Análisis' },
  { id: 3, label: '✏️ Revisar', short: 'Revisar' },
  { id: 4, label: '🚀 Publicar', short: 'Publicar' },
];

export default function EventosRapidosPage() {
  const router = useRouter();
  const [supabase] = useState(() => createClient());
  const fileInputRef = useRef(null);

  // State
  const [currentStep, setCurrentStep] = useState(1);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [eventData, setEventData] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedPlanId, setSavedPlanId] = useState(null);

  // Social content
  const [socialContent, setSocialContent] = useState(null);
  const [generatingSocial, setGeneratingSocial] = useState(false);
  const [activeSocialTab, setActiveSocialTab] = useState('instagram');
  const [copied, setCopied] = useState('');

  // Publishing states
  const [publishStatus, setPublishStatus] = useState({});

  // Recent events
  const [recentEvents, setRecentEvents] = useState([]);

  // Drag and drop
  const [isDragging, setIsDragging] = useState(false);

  // Load recent events on mount
  useEffect(() => {
    loadRecentEvents();
  }, []);

  async function loadRecentEvents() {
    const { data } = await supabase
      .from('plans')
      .select('id, title, image, date, venue, slug, created_at')
      .eq('type', 'evento')
      .order('created_at', { ascending: false })
      .limit(6);

    if (data) setRecentEvents(data);
  }

  // ---- Step 1: Image handling ----
  function handleImageSelect(file) {
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setError('');
    setEventData(null);
    setSocialContent(null);
    setSavedPlanId(null);
    setSuccess('');
    // Auto-advance to analyze
    analyzeImage(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    if (file) handleImageSelect(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      handleImageSelect(file);
    }
  }

  function handleDragOver(e) {
    e.preventDefault();
    setIsDragging(true);
  }

  function handleDragLeave(e) {
    e.preventDefault();
    setIsDragging(false);
  }

  // Handle paste from clipboard
  useEffect(() => {
    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) handleImageSelect(file);
          break;
        }
      }
    }
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, []);

  // ---- Step 2: AI Analysis ----
  async function analyzeImage(file) {
    setCurrentStep(2);
    setAnalyzing(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No estás autenticado');

      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/admin/analyze-event-image', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error analizando imagen');

      setEventData(data);
      setCurrentStep(3);
    } catch (err) {
      setError(err.message);
      setCurrentStep(1);
    } finally {
      setAnalyzing(false);
    }
  }

  // ---- Step 3: Edit event data ----
  function updateEventField(field, value) {
    setEventData(prev => ({ ...prev, [field]: value }));
    // Auto-update slug when title changes
    if (field === 'title') {
      setEventData(prev => ({
        ...prev,
        [field]: value,
        slug: value
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, ''),
      }));
    }
  }

  // ---- Step 4: Save and Publish ----
  async function handleSaveEvent() {
    if (!eventData?.title) {
      setError('El evento necesita al menos un título');
      return;
    }
    setSaving(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) throw new Error('No estás autenticado');

      const payload = {
        type: 'evento',
        title: eventData.title,
        slug: eventData.slug,
        excerpt: eventData.excerpt || '',
        description: eventData.description || '',
        image: eventData.image || '',
        category: eventData.category || 'cultura',
        category_label: getCategoryLabel(eventData.category || 'cultura'),
        zone: eventData.zone || '',
        date: eventData.date || '',
        price: eventData.price || 'Gratis',
        precio_reserva: 0,
        shipping_cost: 0,
        venue: eventData.venue || '',
        address: eventData.address || '',
        time_start: eventData.time_start || '',
        time_end: eventData.time_end || '',
        capacity: 100,
        spots_taken: 0,
        featured: false,
        sponsored: false,
        published: true,
        age_restriction: eventData.age_restriction || 'Todas las edades',
        tags: [],
        tickets: [],
        guestLists: [],
        schedule: [],
        reels: [],
      };

      const res = await fetch('/api/admin/plans', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error al guardar');

      setSavedPlanId(result.id);
      setSuccess('✅ ¡Evento guardado exitosamente en PlanazosBCN!');
      setCurrentStep(4);
      loadRecentEvents();

      // Auto-generate social content
      handleGenerateSocial();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateSocial() {
    setGeneratingSocial(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/generate-social-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ event: eventData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error generando contenido');

      setSocialContent(data);
    } catch (err) {
      console.error('Error generating social content:', err);
    } finally {
      setGeneratingSocial(false);
    }
  }

  async function handlePublishTelegram() {
    setPublishStatus(prev => ({ ...prev, telegram: 'publishing' }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      // Build WhatsApp-style message
      const message = socialContent?.whatsapp || `🎉 ${eventData.title}\n📅 ${eventData.date}\n📍 ${eventData.venue}`;

      const res = await fetch('/api/admin/publish-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          imageUrl: eventData.image,
          caption: message,
          type: 'image',
          telegram: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.results?.telegram?.status === 'error') {
        throw new Error(data.results.telegram.error);
      }

      setPublishStatus(prev => ({ ...prev, telegram: 'success' }));
    } catch (err) {
      setPublishStatus(prev => ({ ...prev, telegram: 'error' }));
      setError(`Telegram: ${err.message}`);
    }
  }

  async function handlePublishWhatsApp() {
    setPublishStatus(prev => ({ ...prev, whatsapp: 'publishing' }));
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const message = socialContent?.whatsapp || `🎉 ${eventData.title}`;

      const res = await fetch('/api/admin/publish-social', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          imageUrl: eventData.image,
          caption: message,
          type: 'image',
          whatsapp: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      if (data.results?.whatsapp?.status === 'error') {
        throw new Error(data.results.whatsapp.error);
      }
      if (data.results?.whatsapp?.status === 'skipped') {
        throw new Error(data.results.whatsapp.note || 'WhatsApp no configurado');
      }

      setPublishStatus(prev => ({ ...prev, whatsapp: 'success' }));
    } catch (err) {
      setPublishStatus(prev => ({ ...prev, whatsapp: 'error' }));
      setError(`WhatsApp: ${err.message}`);
    }
  }

  function handleCopy(text, platform) {
    navigator.clipboard.writeText(text);
    setCopied(platform);
    setTimeout(() => setCopied(''), 2000);
  }

  function resetFlow() {
    setCurrentStep(1);
    setImageFile(null);
    setImagePreview(null);
    setEventData(null);
    setSocialContent(null);
    setError('');
    setSuccess('');
    setSavedPlanId(null);
    setPublishStatus({});
  }

  function getCategoryLabel(id) {
    const map = {
      gastro: 'Gastronomía', naturaleza: 'Naturaleza', cultura: 'Cultura',
      rutas: 'Rutas', nocturno: 'Nocturno', servicios: 'Servicios', bienestar: 'Bienestar',
    };
    return map[id] || id;
  }

  function getSocialText() {
    if (!socialContent) return '';
    if (activeSocialTab === 'instagram') {
      const caption = socialContent.instagram?.caption || '';
      const tags = socialContent.instagram?.hashtags?.map(h => `#${h}`).join(' ') || '';
      return `${caption}\n\n${tags}`;
    }
    if (activeSocialTab === 'tiktok') {
      const caption = socialContent.tiktok?.caption || '';
      const tags = socialContent.tiktok?.hashtags?.map(h => `#${h}`).join(' ') || '';
      return `${caption}\n\n${tags}`;
    }
    return socialContent.whatsapp || '';
  }

  return (
    <>
      <div className={adminStyles.pageHeader}>
        <div>
          <h1 className={adminStyles.pageTitle}>🎉 Eventos Rápidos</h1>
          <p className={adminStyles.pageSubtitle}>
            Sube la imagen de un evento → La IA extrae los datos → Publícalo en todas partes
          </p>
        </div>
        {currentStep > 1 && (
          <button className={adminStyles.btnPrimary} onClick={resetFlow}>
            ＋ Nuevo evento
          </button>
        )}
      </div>

      {/* Stepper */}
      <div className={styles.stepper}>
        {STEPS.map((step) => (
          <div
            key={step.id}
            className={`${styles.step} ${
              currentStep === step.id ? styles.stepActive : ''
            } ${currentStep > step.id ? styles.stepDone : ''}`}
          >
            <span className={styles.stepNumber}>
              {currentStep > step.id ? '✓' : step.id}
            </span>
            {step.label}
          </div>
        ))}
      </div>

      {/* Error / Success banners */}
      {error && <div className={styles.errorBanner}>❌ {error}</div>}
      {success && <div className={styles.successBanner}>{success}</div>}

      {/* Step 1: Upload Image */}
      {currentStep === 1 && (
        <div
          className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
        >
          <span className={styles.dropIcon}>📸</span>
          <h3 className={styles.dropTitle}>
            Arrastra la imagen del evento aquí
          </h3>
          <p className={styles.dropSubtitle}>
            O pégala con Ctrl+V / ⌘+V • También puedes hacer clic para seleccionar
          </p>
          <div className={styles.dropBtnRow}>
            <button
              type="button"
              className={styles.dropBtn}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current.removeAttribute('capture');
                fileInputRef.current.click();
              }}
            >
              🖼️ Galería
            </button>
            <button
              type="button"
              className={styles.dropBtn}
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current.setAttribute('capture', 'environment');
                fileInputRef.current.click();
              }}
            >
              📷 Cámara
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileInput}
            style={{ display: 'none' }}
            id="event-image-input"
          />
        </div>
      )}

      {/* Step 2: Analyzing */}
      {currentStep === 2 && analyzing && (
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <span className={styles.sectionIcon}>🤖</span>
            <h3 className={styles.sectionTitle}>Analizando imagen con IA...</h3>
            <span className={`${styles.sectionBadge} ${styles.badgeAnalyzing}`}>
              Procesando
            </span>
          </div>
          {imagePreview && (
            <div className={styles.imagePreviewLarge}>
              <img src={imagePreview} alt="Evento" className={styles.imagePreviewImg} />
            </div>
          )}
          <div className={styles.analyzeLoader}>
            <div className={styles.spinner} />
            <p className={styles.analyzeText}>
              ✨ La IA está leyendo el flyer y extrayendo los datos del evento...
            </p>
          </div>
        </div>
      )}

      {/* Step 3: Review & Edit */}
      {currentStep === 3 && eventData && (
        <>
          {/* Image Preview */}
          {(imagePreview || eventData.image) && (
            <div className={styles.section}>
              <div className={styles.imagePreviewLarge}>
                <img
                  src={eventData.image || imagePreview}
                  alt="Evento"
                  className={styles.imagePreviewImg}
                />
                <div className={styles.imagePreviewOverlay}>
                  <button
                    type="button"
                    className={styles.imagePreviewAction}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📷 Cambiar
                  </button>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {/* Event Details Form */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📝</span>
              <h3 className={styles.sectionTitle}>Datos del evento</h3>
              <span className={`${styles.sectionBadge} ${styles.badgeSuccess}`}>
                Extraído por IA
              </span>
            </div>

            <div className={styles.formGrid}>
              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Título</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.title || ''}
                  onChange={(e) => updateEventField('title', e.target.value)}
                  id="event-title"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Slug (URL)</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.slug || ''}
                  onChange={(e) => updateEventField('slug', e.target.value)}
                  id="event-slug"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>📅 Fecha</label>
                <input
                  type="date"
                  className={styles.formInput}
                  value={eventData.date || ''}
                  onChange={(e) => updateEventField('date', e.target.value)}
                  id="event-date"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>💰 Precio</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.price || ''}
                  onChange={(e) => updateEventField('price', e.target.value)}
                  id="event-price"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>🕐 Hora inicio</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={eventData.time_start || ''}
                  onChange={(e) => updateEventField('time_start', e.target.value)}
                  id="event-time-start"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>🕐 Hora fin</label>
                <input
                  type="time"
                  className={styles.formInput}
                  value={eventData.time_end || ''}
                  onChange={(e) => updateEventField('time_end', e.target.value)}
                  id="event-time-end"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>🎉 Venue / Local</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.venue || ''}
                  onChange={(e) => updateEventField('venue', e.target.value)}
                  id="event-venue"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>📍 Zona</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.zone || ''}
                  onChange={(e) => updateEventField('zone', e.target.value)}
                  id="event-zone"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>📍 Dirección</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.address || ''}
                  onChange={(e) => updateEventField('address', e.target.value)}
                  id="event-address"
                />
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Categoría</label>
                <select
                  className={styles.formSelect}
                  value={eventData.category || 'cultura'}
                  onChange={(e) => updateEventField('category', e.target.value)}
                  id="event-category"
                >
                  <option value="gastro">🍽️ Gastronomía</option>
                  <option value="naturaleza">🌿 Naturaleza</option>
                  <option value="cultura">🎭 Cultura</option>
                  <option value="rutas">🗺️ Rutas</option>
                  <option value="nocturno">🌙 Nocturno</option>
                  <option value="servicios">🛠️ Servicios</option>
                  <option value="bienestar">🧘 Bienestar</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Edad</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.age_restriction || ''}
                  onChange={(e) => updateEventField('age_restriction', e.target.value)}
                  id="event-age"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Resumen corto</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={eventData.excerpt || ''}
                  onChange={(e) => updateEventField('excerpt', e.target.value)}
                  id="event-excerpt"
                />
              </div>

              <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                <label className={styles.formLabel}>Descripción completa</label>
                <textarea
                  className={styles.formTextarea}
                  value={eventData.description || ''}
                  onChange={(e) => updateEventField('description', e.target.value)}
                  rows={5}
                  id="event-description"
                />
              </div>

              {eventData.url && (
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label className={styles.formLabel}>🔗 URL de registro</label>
                  <input
                    type="url"
                    className={styles.formInput}
                    value={eventData.url || ''}
                    onChange={(e) => updateEventField('url', e.target.value)}
                    id="event-url"
                  />
                </div>
              )}

              {eventData.organizer && (
                <div className={`${styles.formGroup} ${styles.formGridFull}`}>
                  <label className={styles.formLabel}>👤 Organizador</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={eventData.organizer || ''}
                    onChange={(e) => updateEventField('organizer', e.target.value)}
                    id="event-organizer"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className={styles.actionsRow}>
            <button
              className={`${styles.actionBtnLg} ${styles.btnSave}`}
              onClick={handleSaveEvent}
              disabled={saving}
              id="save-event"
            >
              {saving ? '⏳ Guardando...' : '✅ Guardar evento en PlanazosBCN'}
            </button>
          </div>
        </>
      )}

      {/* Step 4: Publish */}
      {currentStep === 4 && (
        <>
          {/* Social Content */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>📱</span>
              <h3 className={styles.sectionTitle}>Contenido para redes sociales</h3>
              {generatingSocial && (
                <span className={`${styles.sectionBadge} ${styles.badgeAnalyzing}`}>
                  Generando...
                </span>
              )}
            </div>

            {generatingSocial ? (
              <div className={styles.analyzeLoader}>
                <div className={styles.spinner} />
                <p className={styles.analyzeText}>
                  ✨ Generando captions para Instagram, TikTok y WhatsApp...
                </p>
              </div>
            ) : socialContent ? (
              <>
                {/* Social Tabs */}
                <div className={styles.socialTabs}>
                  <button
                    className={`${styles.socialTab} ${styles.socialTabIg} ${activeSocialTab === 'instagram' ? styles.socialTabActive : ''}`}
                    onClick={() => setActiveSocialTab('instagram')}
                  >
                    📸 Instagram
                  </button>
                  <button
                    className={`${styles.socialTab} ${styles.socialTabTt} ${activeSocialTab === 'tiktok' ? styles.socialTabActive : ''}`}
                    onClick={() => setActiveSocialTab('tiktok')}
                  >
                    🎵 TikTok
                  </button>
                  <button
                    className={`${styles.socialTab} ${styles.socialTabWa} ${activeSocialTab === 'whatsapp' ? styles.socialTabActive : ''}`}
                    onClick={() => setActiveSocialTab('whatsapp')}
                  >
                    💬 WhatsApp
                  </button>
                </div>

                {/* Social Content Display */}
                <div className={styles.socialContent}>
                  <div className={styles.socialText}>
                    {getSocialText()}
                  </div>
                  <div className={styles.socialActions}>
                    <button
                      className={`${styles.copyBtn} ${copied === activeSocialTab ? styles.copiedBtn : ''}`}
                      onClick={() => handleCopy(getSocialText(), activeSocialTab)}
                    >
                      {copied === activeSocialTab ? '✅ Copiado' : '📋 Copiar texto'}
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <button
                className={`${styles.actionBtnLg} ${styles.btnGenerate}`}
                onClick={handleGenerateSocial}
                style={{ marginTop: '0.5rem' }}
              >
                ✨ Generar contenido para redes
              </button>
            )}
          </div>

          {/* Publish Actions */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <span className={styles.sectionIcon}>🚀</span>
              <h3 className={styles.sectionTitle}>Publicar directamente</h3>
            </div>

            <div className={styles.actionsRow}>
              <button
                className={`${styles.actionBtnLg} ${styles.btnTelegram}`}
                onClick={handlePublishTelegram}
                disabled={publishStatus.telegram === 'publishing'}
                id="publish-telegram"
              >
                {publishStatus.telegram === 'publishing' ? '⏳ Enviando...' :
                 publishStatus.telegram === 'success' ? '✅ Enviado' :
                 '📱 Enviar por Telegram'}
              </button>

              <button
                className={`${styles.actionBtnLg} ${styles.btnWhatsapp}`}
                onClick={handlePublishWhatsApp}
                disabled={publishStatus.whatsapp === 'publishing'}
                id="publish-whatsapp"
              >
                {publishStatus.whatsapp === 'publishing' ? '⏳ Enviando...' :
                 publishStatus.whatsapp === 'success' ? '✅ Enviado' :
                 '💬 Enviar por WhatsApp'}
              </button>
            </div>

            {/* Status badges */}
            <div className={styles.statusRow}>
              {publishStatus.telegram === 'success' && (
                <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                  ✅ Telegram enviado
                </span>
              )}
              {publishStatus.telegram === 'error' && (
                <span className={`${styles.statusBadge} ${styles.statusError}`}>
                  ❌ Error en Telegram
                </span>
              )}
              {publishStatus.whatsapp === 'success' && (
                <span className={`${styles.statusBadge} ${styles.statusSuccess}`}>
                  ✅ WhatsApp enviado
                </span>
              )}
              {publishStatus.whatsapp === 'error' && (
                <span className={`${styles.statusBadge} ${styles.statusError}`}>
                  ❌ WhatsApp no configurado — usa Telegram
                </span>
              )}
            </div>
          </div>

          {/* Link to edit full event */}
          {savedPlanId && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <span className={styles.sectionIcon}>🔗</span>
                <h3 className={styles.sectionTitle}>Evento guardado</h3>
              </div>
              <div className={styles.actionsRow}>
                <Link
                  href={`/admin/planes/${savedPlanId}`}
                  className={`${styles.actionBtnLg} ${styles.btnGenerate}`}
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  ✏️ Editar evento completo
                </Link>
                <Link
                  href={`/planes/${eventData.slug}`}
                  target="_blank"
                  className={`${styles.actionBtnLg} ${styles.btnSave}`}
                  style={{ textDecoration: 'none', textAlign: 'center' }}
                >
                  🌐 Ver en la web
                </Link>
              </div>
            </div>
          )}

          {/* Create another */}
          <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
            <button
              className={`${styles.actionBtnLg} ${styles.btnGenerate}`}
              onClick={resetFlow}
              style={{ maxWidth: '300px' }}
            >
              ＋ Crear otro evento
            </button>
          </div>
        </>
      )}

      {/* Recent Events */}
      {recentEvents.length > 0 && currentStep === 1 && (
        <div style={{ marginTop: '2rem' }}>
          <h3 className={styles.recentTitle}>
            📅 Últimos eventos creados
          </h3>
          <div className={styles.recentGrid}>
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/admin/planes/${event.id}`}
                className={styles.recentCard}
              >
                {event.image && (
                  <img
                    src={event.image}
                    alt={event.title}
                    className={styles.recentCardImage}
                  />
                )}
                <div className={styles.recentCardBody}>
                  <div className={styles.recentCardTitle}>{event.title}</div>
                  <div className={styles.recentCardMeta}>
                    {event.date && `📅 ${new Date(event.date).toLocaleDateString('es-ES')}`}
                    {event.venue && ` • 📍 ${event.venue}`}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
