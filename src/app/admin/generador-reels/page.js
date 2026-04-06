'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import MediaUploaderButton from '@/components/MediaUploaderButton';
import styles from './generador-reels.module.css';

export default function GeneradorReelsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get('id');

  const [supabase] = useState(() => createClient());
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [script, setScript] = useState(null);
  const [currentSegment, setCurrentSegment] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [editingSegment, setEditingSegment] = useState(null);
  const [rendering, setRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [sendTelegram, setSendTelegram] = useState(true);
  const [publishStatus, setPublishStatus] = useState(null);

  const [hooks, setHooks] = useState([
    "¿Buscando un planazo único?",
    "Aquí tienes la mejor opción",
    "¡Guarda este vídeo!"
  ]);

  const [publishingIg, setPublishingIg] = useState(false);
  const [publishingTiktok, setPublishingTiktok] = useState(false);
  const intervalRef = useRef(null);
  const previewRef = useRef(null);

  // Load plan data
  useEffect(() => {
    async function loadPlan() {
      if (!planId) {
        setLoading(false);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        const token = session?.access_token;

        const res = await fetch(`/api/admin/plans/${planId}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) throw new Error('No se pudo cargar el plan');
        const data = await res.json();
        setPlan(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, [planId, supabase]);

  // Auto-generate script on plan load
  useEffect(() => {
    if (plan && !script && !generating) {
      handleGenerateScript();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  async function handleGenerateScript() {
    if (!plan) return;
    setGenerating(true);
    setError('');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/admin/generate-reel-script', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
      });

      if (!res.ok) throw new Error('Error generando guion');
      const data = await res.json();
      setScript(data);
      setCurrentSegment(0);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  // Preview playback
  const playPreview = useCallback(() => {
    if (!script?.segments?.length) return;
    setIsPlaying(true);
    setCurrentSegment(0);
    let idx = 0;

    if (intervalRef.current) clearInterval(intervalRef.current);

    intervalRef.current = setInterval(() => {
      idx++;
      if (idx >= script.segments.length) {
        clearInterval(intervalRef.current);
        setIsPlaying(false);
        setCurrentSegment(0);
        return;
      }
      setCurrentSegment(idx);
    }, 3000);
  }, [script]);

  const stopPreview = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setIsPlaying(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  function updateSegment(index, field, value) {
    setScript(prev => {
      const segments = [...prev.segments];
      segments[index] = { ...segments[index], [field]: value };
      return { ...prev, segments };
    });
  }

  function getSegmentMedia(segment) {
    if (segment.mediaUrl && segment.mediaType === 'image') return segment.mediaUrl;
    if (plan?.image) return plan.image;
    return null;
  }

  async function handleRenderVideo() {
    setRendering(true);
    setError('');
    setRenderUrl(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const images = script.segments
        .map((seg) => getSegmentMedia(seg) || plan.image)
        .filter(Boolean);
        
      const hooks = [script.hook, ...script.segments.map((s) => s.overlayText)].filter(Boolean);

      const inputProps = {
        title: plan.title,
        price: plan.price || 'Planazo',
        zone: plan.zone || 'Barcelona',
        images: images.length > 0 ? images : [plan.image || ''],
        hooks: hooks.length > 0 ? hooks : ['Planazo Increíble'],
      };

      const res = await fetch('/api/admin/render-reel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(inputProps),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error renderizando video MP4');
      
      if (data.url) {
        setRenderUrl(data.url);
        
        if (sendTelegram) {
          setPublishStatus('publishing');
          const pubRes = await fetch('/api/admin/publish-social', {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify({
               videoUrl: data.url,
               caption: `${plan?.title} - ${plan?.description?.slice(0,90)}... #planesbcn #planesenbarcelona`,
               telegram: sendTelegram
             })
          });
          const pubData = await pubRes.json();
          if (!pubRes.ok) throw new Error(pubData.error || 'Error al interactuar con el Bot de Telegram');
          
          // Verifica si hubo un grace error
          if (pubData.results?.telegram?.status === 'error') {
              throw new Error(pubData.results?.telegram?.error || 'Error interno en tokens de Telegram');
          }
          
          setPublishStatus('success');
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setRendering(false);
    }
  }

  async function handlePublishIg() {
    if (!renderUrl) return;
    setPublishingIg(true);
    try {
      const res = await fetch('/api/social/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: renderUrl,
          caption: script?.caption || plan?.title || '',
          coverUrl: plan?.image || ''
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error publicando en Instagram');
      alert('✅ Publicado correctamente en Instagram!');
    } catch (err) {
      alert(`❌ Error en Instagram: ${err.message}`);
    } finally {
      setPublishingIg(false);
    }
  }

  async function handlePublishTiktok() {
    if (!renderUrl) return;
    setPublishingTiktok(true);
    try {
      const res = await fetch('/api/social/tiktok', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl: renderUrl,
          caption: script?.caption || plan?.title || ''
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error publicando en TikTok');
      alert('✅ Publicado correctamente en TikTok!');
    } catch (err) {
      alert(`❌ Error en TikTok: ${err.message}`);
    } finally {
      setPublishingTiktok(false);
    }
  }

  function getInstagramEmbedUrl(url) {
    if (!url) return null;
    const match = url.match(/instagram\.com\/(reel|p)\/([^/?]+)/);
    if (match) return `https://www.instagram.com/${match[1]}/${match[2]}/embed`;
    return url;
  }

  if (loading) {
    return (
      <div className={styles.loadingPage}>
        <div className={styles.spinner} />
        <p>Cargando plan...</p>
      </div>
    );
  }

  if (!planId || !plan) {
    return (
      <div className={styles.emptyState}>
        <span className={styles.emptyIcon}>🎬</span>
        <h2>No se seleccionó ningún plan</h2>
        <p>Vuelve a la lista de planes y selecciona uno para generar un Reel.</p>
        <Link href="/admin/planes" className={styles.backBtn}>
          ← Volver a planes
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Header */}
      <div className={styles.header}>
        <Link href="/admin/planes" className={styles.backLink}>
          <span className={styles.backArrow}>←</span>
        </Link>
        <div>
          <h1 className={styles.title}>
            <span className={styles.titleIcon}>🎬</span>
            Generador de Reels con IA
          </h1>
          <p className={styles.subtitle}>
            Crea vídeos verticales espectaculares a partir de tus planes automáticamente.
          </p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>{error}</div>}

      <div className={styles.layout}>
        {/* Left: Script & Controls */}
        <div className={styles.leftPanel}>
          {/* Plan Summary */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>📋</span>
              <h3>Plan seleccionado</h3>
            </div>
            <div className={styles.planSummary}>
              {plan.image && (
                <img src={plan.image} alt={plan.title} className={styles.planThumb} />
              )}
              <div className={styles.planInfo}>
                <h4>{plan.title}</h4>
                <p>{plan.excerpt || plan.description?.slice(0, 120) + '...'}</p>
                <div className={styles.planMeta}>
                  {plan.zone && <span>📍 {plan.zone}</span>}
                  {plan.price && <span>💰 {plan.price === 'Gratis' ? 'Gratis' : `${plan.price}€`}</span>}
                </div>
              </div>
            </div>
            {plan.plan_reels?.length > 0 && (
              <div className={styles.reelsAvailable}>
                <span className={styles.reelsBadge}>
                  📸 {plan.plan_reels.length} reel{plan.plan_reels.length > 1 ? 's' : ''} disponible{plan.plan_reels.length > 1 ? 's' : ''}
                </span>
              </div>
            )}
          </div>

          {/* Script Content */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardIcon}>✍️</span>
              <h3>Contenido del Reel</h3>
              <button
                onClick={handleGenerateScript}
                disabled={generating}
                className={styles.regenerateBtn}
              >
                {generating ? '⏳ Generando...' : '🔄 Regenerar'}
              </button>
            </div>

            {generating ? (
              <div className={styles.generatingState}>
                <div className={styles.aiSpinner} />
                <p className={styles.generatingText}>
                  ✨ La IA está escribiendo un guion viral...
                </p>
                <p className={styles.generatingSub}>
                  Creando hook, timeline visual y textos impactantes
                </p>
              </div>
            ) : script ? (
              <div className={styles.scriptContent}>
                {/* Hook */}
                <div className={styles.hookSection}>
                  <label className={styles.fieldLabel}>
                    🪝 Hook (primeros 2 segundos)
                  </label>
                  <input
                    type="text"
                    className={styles.hookInput}
                    value={script.hook}
                    onChange={(e) => setScript(s => ({ ...s, hook: e.target.value }))}
                  />
                </div>

                {/* Music */}
                <div className={styles.musicSection}>
                  <label className={styles.fieldLabel}>🎵 Estilo de música</label>
                  <input
                    type="text"
                    className={styles.musicInput}
                    value={script.musicStyle}
                    onChange={(e) => setScript(s => ({ ...s, musicStyle: e.target.value }))}
                  />
                </div>

                {/* Timeline */}
                <div className={styles.timelineSection}>
                  <label className={styles.fieldLabel}>
                    🎞️ Timeline ({script.segments?.length || 0} segmentos × 3s = {(script.segments?.length || 0) * 3}s)
                  </label>

                  <div className={styles.timeline}>
                    {script.segments?.map((seg, i) => (
                      <div
                        key={i}
                        className={`${styles.timelineItem} ${currentSegment === i ? styles.timelineItemActive : ''} ${editingSegment === i ? styles.timelineItemEditing : ''}`}
                        onClick={() => {
                          setCurrentSegment(i);
                          setEditingSegment(editingSegment === i ? null : i);
                        }}
                      >
                        <div className={styles.timelineIndicator}>
                          <span className={styles.timelineDot} />
                          <span className={styles.timelineTime}>
                            {seg.startTime}s - {seg.endTime}s
                          </span>
                          <span className={`${styles.mediaBadge} ${styles[`mediaBadge_${seg.mediaType}`]}`}>
                            {seg.mediaType === 'image' ? '🖼️' : seg.mediaType === 'reel' ? '🎥' : '🎨'}
                          </span>
                        </div>

                        <div className={styles.timelineContent}>
                          <p className={styles.segmentOverlay}>
                            &ldquo;{seg.overlayText}&rdquo;
                          </p>
                          {seg.narration && (
                            <p className={styles.segmentNarration}>
                              🗣️ {seg.narration}
                            </p>
                          )}
                        </div>

                        <span className={styles.transitionBadge}>
                          {seg.transition}
                        </span>

                        {editingSegment === i && (
                          <div className={styles.segmentEditor} onClick={(e) => e.stopPropagation()}>
                            <div className={styles.editorField}>
                              <label>Texto superpuesto</label>
                              <input
                                type="text"
                                value={seg.overlayText}
                                onChange={(e) => updateSegment(i, 'overlayText', e.target.value)}
                              />
                            </div>
                            <div className={styles.editorField}>
                              <label>Narración</label>
                              <input
                                type="text"
                                value={seg.narration || ''}
                                onChange={(e) => updateSegment(i, 'narration', e.target.value)}
                              />
                            </div>
                            <div className={styles.editorField}>
                              <label>URL del medio</label>
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <input
                                  type="url"
                                  value={seg.mediaUrl || ''}
                                  onChange={(e) => updateSegment(i, 'mediaUrl', e.target.value)}
                                  placeholder="https://..."
                                  style={{ flex: 1 }}
                                />
                                <MediaUploaderButton
                                  className={styles.actionBtn}
                                  text="📤 Subir"
                                  onUpload={(url) => updateSegment(i, 'mediaUrl', url)}
                                  onError={(err) => alert(err)}
                                />
                              </div>
                            </div>
                            <div className={styles.editorRow}>
                              <div className={styles.editorField}>
                                <label>Tipo</label>
                                <select
                                  value={seg.mediaType}
                                  onChange={(e) => updateSegment(i, 'mediaType', e.target.value)}
                                >
                                  <option value="image">🖼️ Imagen</option>
                                  <option value="reel">🎥 Reel</option>
                                  <option value="generated">🎨 Generar</option>
                                </select>
                              </div>
                              <div className={styles.editorField}>
                                <label>Transición</label>
                                <select
                                  value={seg.transition}
                                  onChange={(e) => updateSegment(i, 'transition', e.target.value)}
                                >
                                  <option value="cut">Cut</option>
                                  <option value="fade">Fade</option>
                                  <option value="zoom">Zoom</option>
                                  <option value="slide">Slide</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Caption & Hashtags */}
                <div className={styles.captionSection}>
                  <label className={styles.fieldLabel}>📝 Caption para el post</label>
                  <textarea
                    className={styles.captionInput}
                    value={script.caption || ''}
                    onChange={(e) => setScript(s => ({ ...s, caption: e.target.value }))}
                    rows={4}
                  />
                </div>

                {script.hashtags?.length > 0 && (
                  <div className={styles.hashtagsSection}>
                    <label className={styles.fieldLabel}># Hashtags</label>
                    <div className={styles.hashtagsList}>
                      {script.hashtags.map((h, i) => (
                        <span key={i} className={styles.hashtagChip}>
                          #{h}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className={styles.emptyScript}>
                <p>Cargando datos del plan... O no se seleccionó ninguno.</p>
              </div>
            )}
          </div>

          {/* Export */}
          {script && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.cardIcon}>📤</span>
                <h3>Exportar Vídeo</h3>
              </div>
              <p className={styles.exportDesc}>
                Pulsa para renderizar el vídeo final MP4. Tarda unos 60 segundos según la complejidad.
              </p>
              <div className={styles.exportOptions}>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" checked={sendTelegram} onChange={e => setSendTelegram(e.target.checked)} />
                  📱 Enviar al móvil por Bot de Telegram automáticamente
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" disabled={true} />
                  Auto-publicar en Instagram Reels (Mejor publicarlo manual abajo)
                </label>
                <label className={styles.checkboxLabel}>
                  <input type="checkbox" disabled={true} />
                  Auto-publicar en TikTok (Mejor publicarlo manual abajo)
                </label>
              </div>
              <button 
                className={styles.renderBtn} 
                disabled={rendering} 
                onClick={handleRenderVideo}
              >
                <span>🎬</span> {rendering ? 'Renderizando (~60s)...' : 'Renderizar MP4'}
              </button>

              {renderError && (
                <div style={{ padding: '0.5rem', background: '#fef2f2', color: '#b91c1c', borderRadius: '4px', marginTop: '1rem' }}>
                  Error: {renderError}
                </div>
              )}

              {publishStatus === 'publishing' && (
                <div style={{ padding: '0.5rem', background: '#fffbeb', color: '#b45309', borderRadius: '4px', marginTop: '1rem' }}>
                  ⏳ Enviando Reel a tu Telegram...
                </div>
              )}

              {publishStatus === 'success' && (
                <div style={{ padding: '0.5rem', background: '#ecfdf5', color: '#047857', borderRadius: '4px', marginTop: '1rem' }}>
                  ✅ ¡Reel enviado! Revisa tus mensajes de Telegram.
                </div>
              )}

              {renderUrl && (
                <div className={styles.renderComplete}>
                  <span>✅ Vídeo renderizado con éxito!</span>
                  <a href={`${renderUrl}?download=`} download="planazo-reel.mp4" className={styles.downloadBtn}>
                    ⬇️ Descargar MP4
                  </a>
                  
                  <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                    <button 
                      onClick={handlePublishIg} 
                      disabled={publishingIg}
                      className={styles.renderBtn} 
                      style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)', flex: 1, padding: '10px' }}
                    >
                      {publishingIg ? '⏳ Publicando...' : '📸 Publicar en Instagram'}
                    </button>
                    
                    <button 
                      onClick={handlePublishTiktok} 
                      disabled={publishingTiktok}
                      className={styles.renderBtn} 
                      style={{ background: '#000000', color: 'white', flex: 1, padding: '10px' }}
                    >
                      {publishingTiktok ? '⏳ Publicando...' : '🎵 Publicar en TikTok'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Live Preview */}
        <div className={styles.rightPanel}>
          <div className={styles.previewContainer} ref={previewRef}>
            <div className={styles.previewBadge}>
              <span className={styles.previewDot} />
              LIVE PREVIEW
            </div>

            <div className={styles.phoneFrame}>
              <div className={styles.phoneScreen}>
                {script?.segments?.length > 0 ? (
                  <>
                    {/* Background Media */}
                    <div
                      className={`${styles.previewMedia} ${styles[`transition_${script.segments[currentSegment]?.transition}`]}`}
                      key={`seg-${currentSegment}`}
                    >
                      {script.segments[currentSegment]?.mediaType === 'reel' && (script.segments[currentSegment]?.mediaUrl || plan?.plan_reels?.[0]?.url) ? (
                        <div className={styles.reelEmbed}>
                          {(() => {
                            const url = script.segments[currentSegment]?.mediaUrl || plan?.plan_reels?.[0]?.url;
                            const embedUrl = getInstagramEmbedUrl(url);
                            if (url.includes('.mp4')) {
                              return (
                                <video 
                                  src={url} 
                                  className={styles.previewImage} 
                                  autoPlay 
                                  muted 
                                  loop 
                                  playsInline
                                  style={{ objectFit: 'cover' }}
                                />
                              );
                            } else if (embedUrl !== url) {
                              return (
                                <iframe
                                  src={embedUrl}
                                  className={styles.previewImage}
                                  frameBorder="0"
                                  scrolling="no"
                                  allowTransparency="true"
                                  style={{ width: '100%', height: '100%', border: 'none' }}
                                ></iframe>
                              );
                            } else {
                              return (
                                <>
                                  <img
                                    src={plan.image || '/logo-planazosbcn.png'}
                                    alt="Reel preview"
                                    className={styles.previewImage}
                                  />
                                  <div className={styles.reelPlayOverlay}>
                                    <span>▶</span>
                                    <small>Reel de Instagram</small>
                                  </div>
                                </>
                              );
                            }
                          })()}
                        </div>
                      ) : (
                        <img
                          src={getSegmentMedia(script.segments[currentSegment]) || '/logo-planazosbcn.png'}
                          alt={`Segment ${currentSegment + 1}`}
                          className={styles.previewImage}
                        />
                      )}

                      {/* Generated media placeholder */}
                      {script.segments[currentSegment]?.mediaType === 'generated' && !script.segments[currentSegment]?.mediaUrl && (
                        <div className={styles.generatedOverlay}>
                          <span>🎨</span>
                          <small>{script.segments[currentSegment]?.mediaDescription || 'Imagen a generar'}</small>
                        </div>
                      )}
                    </div>

                    {/* Dark gradient overlay */}
                    <div className={styles.previewGradient} />

                    {/* Safe zone guidelines (TikTok & IG rules) */}
                    <div className={styles.safeZoneGuidelines}></div>

                    {/* Overlay Text */}
                    <div className={styles.previewOverlay}>
                      <p className={styles.overlayTextDisplay} key={`text-${currentSegment}`}>
                        {currentSegment === 0 && script.hook
                          ? script.hook
                          : script.segments[currentSegment]?.overlayText}
                      </p>
                    </div>

                    {/* Bottom Info */}
                    <div className={styles.previewBottom}>
                      <div className={styles.previewPlanInfo}>
                        {plan.price && (
                          <span className={styles.previewPrice}>
                            {plan.price === 'Gratis' ? 'GRATIS' : `${plan.price}€`}
                          </span>
                        )}
                        <h4 className={styles.previewPlanTitle}>{plan.title}</h4>
                        {plan.zone && <p className={styles.previewPlanZone}>📍 {plan.zone}</p>}
                      </div>
                    </div>

                    {/* Timeline indicator */}
                    <div className={styles.previewTimeline}>
                      {script.segments.map((_, i) => (
                        <div
                          key={i}
                          className={`${styles.timelineTick} ${i === currentSegment ? styles.timelineTickActive : ''} ${i < currentSegment ? styles.timelineTickDone : ''}`}
                          onClick={() => {
                            setCurrentSegment(i);
                            stopPreview();
                          }}
                        />
                      ))}
                    </div>
                  </>
                ) : plan ? (
                  <div className={styles.previewEmpty}>
                    <img src={plan.image || '/logo-planazosbcn.png'} alt={plan.title} className={styles.previewImage} />
                    <div className={styles.previewGradient} />
                    <div className={styles.previewOverlay}>
                      <p className={styles.previewHint}>
                        {generating ? '✨ Generando guion...' : '¿BUSCANDO UN PLANAZO ÚNICO?'}
                      </p>
                    </div>
                    <div className={styles.previewBottom}>
                      <div className={styles.previewPlanInfo}>
                        {plan.price && (
                          <span className={styles.previewPrice}>
                            {plan.price === 'Gratis' ? 'GRATIS' : `${plan.price}€`}
                          </span>
                        )}
                        <h4 className={styles.previewPlanTitle}>{plan.title}</h4>
                        {plan.zone && <p className={styles.previewPlanZone}>📍 {plan.zone}</p>}
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Playback Controls */}
            {script?.segments?.length > 0 && (
              <div className={styles.playbackControls}>
                <button
                  className={styles.playBtn}
                  onClick={isPlaying ? stopPreview : playPreview}
                >
                  {isPlaying ? '⏹ Parar' : '▶ Reproducir'}
                </button>
                <span className={styles.segmentIndicator}>
                  {currentSegment + 1} / {script.segments.length}
                </span>
                <div className={styles.navBtns}>
                  <button
                    className={styles.navBtn}
                    disabled={currentSegment === 0}
                    onClick={() => {
                      stopPreview();
                      setCurrentSegment(Math.max(0, currentSegment - 1));
                    }}
                  >
                    ◀
                  </button>
                  <button
                    className={styles.navBtn}
                    disabled={currentSegment === script.segments.length - 1}
                    onClick={() => {
                      stopPreview();
                      setCurrentSegment(Math.min(script.segments.length - 1, currentSegment + 1));
                    }}
                  >
                    ▶
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
