"use client";

import { useState, useEffect, use } from 'react';
import { Player } from '@remotion/player';
import { PlanazoReel } from '@/remotion/PlanazoReel';
import { createClient } from '@/lib/supabase/client';
import { ArrowLeft, Wand2, Download, Video, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function GeneradorReelsPage({ searchParams }) {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generatingHooks, setGeneratingHooks] = useState(false);
  const [rendering, setRendering] = useState(false);
  const [renderUrl, setRenderUrl] = useState(null);
  const [renderError, setRenderError] = useState(null);
  const [autoPublishIg, setAutoPublishIg] = useState(false);
  const [autoPublishTt, setAutoPublishTt] = useState(false);
  const [publishStatus, setPublishStatus] = useState(null);

  const [hooks, setHooks] = useState([
    "¿Buscando un planazo único?",
    "Aquí tienes la mejor opción",
    "¡Guarda este vídeo!"
  ]);

  const unwrappedParams = use(searchParams);
  const planId = unwrappedParams?.id;

  useEffect(() => {
    async function fetchPlan() {
      if (!planId) {
        setLoading(false);
        return;
      }

      setLoading(true);
      const supabase = createClient();
      
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .eq('id', planId)
        .single();
      
      if (data) {
        setPlan(data);
        setHooks([
          "¿Un planazo en " + (data.zone || 'Barcelona') + "?",
          data.title || "Sitio increíble",
          data.price && data.price !== "Gratis" ? `Por solo ${data.price}...` : "¡Y es totalmente GRATIS!",
          "Guárdalo o te arrepentirás 👇"
        ]);
      }
      setLoading(false);
    }
    fetchPlan();
  }, [planId]);

  async function handleGenerateHooks() {
    if (!plan) return;
    setGeneratingHooks(true);
    try {
      const res = await fetch('/api/admin/generate-hooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan.title,
          description: plan.description,
          price: plan.price,
          zone: plan.zone,
          category: plan.category
        })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (data.hooks) setHooks(data.hooks);
    } catch (err) {
      alert("Error generando ganchos: " + err.message);
    } finally {
      setGeneratingHooks(false);
    }
  }

  async function handleRenderReel() {
    setRendering(true);
    setRenderError(null);
    setRenderUrl(null);
    setPublishStatus(null);
    try {
      const res = await fetch('/api/admin/render-reel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: plan?.title || "Plan Extremo Editando",
          price: plan?.price || "GRATIS",
          zone: plan?.zone || "Barcelona",
          images: plan?.image ? [plan.image] : ['https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1974&auto=format&fit=crop'],
          hooks: hooks.filter(h => h.trim() !== '')
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Error al renderizar');
      
      setRenderUrl(data.url);

      if (autoPublishIg || autoPublishTt) {
        setPublishStatus('publishing');
        const pubRes = await fetch('/api/admin/publish-social', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
             videoUrl: data.url,
             caption: `${plan?.title} - ${plan?.description?.slice(0,90)}... #planesbcn #planesenbarcelona`,
             instagram: autoPublishIg,
             tiktok: autoPublishTt
           })
        });
        const pubData = await pubRes.json();
        if (!pubRes.ok) throw new Error(pubData.error || 'Error al interactuar con las APIs sociales');
        
        // Verifica si hubo un grace error (falta de tokens que el backend devuelve como success: true pero error interno)
        if (pubData.results?.instagram?.status === 'error' || pubData.results?.tiktok?.status === 'error') {
            throw new Error(pubData.results?.instagram?.error || pubData.results?.tiktok?.error || 'Error interno en tokens de redes sociales');
        }
        
        setPublishStatus('success');
      }
    } catch (err) {
      setRenderError(err.message);
      if (publishStatus === 'publishing') {
         setPublishStatus('error');
      }
    } finally {
      setRendering(false);
    }
  }

  return (
    <div style={{ padding: '0 2rem 5rem', color: '#fff' }}>
      
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem', marginTop: '1rem' }}>
        <Link href="/admin/restaurantes" style={{ padding: '0.5rem', background: 'rgba(255,255,255,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0 0 0.2rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Video className="w-6 h-6" style={{ color: '#bcfe2f' }} />
            Generador de Reels con IA
          </h1>
          <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem' }}>Crea vídeos verticales espectaculares a partir de tus planes automáticamente.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 1fr) 2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Columna Izquierda: Configuración */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ background: '#161625', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 1.5rem 0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wand2 className="w-5 h-5" style={{ color: '#d8b4fe' }} /> Contenido del Reel
            </h2>
            
            {!plan ? (
              <div style={{ padding: '1rem', background: 'rgba(255,193,7,0.1)', color: '#ffc107', borderRadius: '8px', fontSize: '0.85rem' }}>
                Cargando datos del plan... O no se seleccionó ninguno.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Título Principal</label>
                  <input 
                    type="text" 
                    value={plan.title || ''} 
                    onChange={(e) => setPlan({...plan, title: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>
                
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Precio Mostrado</label>
                  <input 
                    type="text" 
                    value={plan.price || ''} 
                    onChange={(e) => setPlan({...plan, price: e.target.value})}
                    style={{ width: '100%', padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.9rem' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                     <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>Ganchos Animados</label>
                     <button 
                       onClick={handleGenerateHooks}
                       disabled={generatingHooks}
                       style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', fontSize: '0.75rem', padding: '0.3rem 0.6rem', background: 'rgba(168,85,247,0.2)', color: '#d8b4fe', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                     >
                       {generatingHooks ? <Loader2 className="w-3 h-3 animate-spin"/> : <Wand2 className="w-3 h-3"/>}
                       Magic IA
                     </button>
                  </div>
                  {hooks.map((hook, i) => (
                    <input 
                      key={i}
                      type="text" 
                      value={hook} 
                      onChange={(e) => {
                        const newHooks = [...hooks];
                        newHooks[i] = e.target.value;
                        setHooks(newHooks);
                      }}
                      style={{ width: '100%', padding: '0.6rem 0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '0.85rem', marginBottom: '0.4rem' }}
                    />
                  ))}
                  <button 
                    onClick={() => setHooks([...hooks, "Nuevo gancho..."])}
                    style={{ fontSize: '0.8rem', color: '#d8b4fe', background: 'none', border: 'none', cursor: 'pointer', padding: 0, marginTop: '0.2rem', fontWeight: '600' }}
                  >
                    + Añadir texto
                  </button>
                </div>
              </div>
            )}
          </div>

          <div style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%)', padding: '1.5rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
             <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold', margin: '0 0 0.5rem 0' }}>Exportar Vídeo</h3>
             <p style={{ fontSize: '0.85rem', opacity: 0.8, margin: '0 0 1rem 0' }}>Pulsa para renderizar el vídeo final MP4. Tarda unos 15-30 segundos según la longitud.</p>
             
             <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', background: 'rgba(255,255,255,0.1)', padding: '0.8rem', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)', marginBottom: '1rem' }}>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                 <input type="checkbox" checked={autoPublishIg} onChange={e => setAutoPublishIg(e.target.checked)} />
                 Auto-publicar en Instagram Reels
               </label>
               <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem' }}>
                 <input type="checkbox" checked={autoPublishTt} onChange={e => setAutoPublishTt(e.target.checked)} />
                 Auto-publicar en TikTok
               </label>
             </div>

             {renderError && (
               <div style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#fca5a5', marginBottom: '1rem' }}>
                 Error: {renderError}
               </div>
             )}

             {publishStatus === 'publishing' && (
               <div style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.5)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#fde047', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                 <Loader2 className="w-3 h-3 animate-spin" /> Conectando con Meta/TikTok...
               </div>
             )}

             {publishStatus === 'success' && (
               <div style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.5)', padding: '0.5rem', borderRadius: '6px', fontSize: '0.8rem', color: '#86efac', marginBottom: '1rem' }}>
                 ¡Petición enviada (espera unos min)!
               </div>
             )}

             {renderUrl ? (
               <a 
                 href={renderUrl}
                 target="_blank"
                 rel="noopener noreferrer"
                 download={`planazos-reel-${plan?.slug || 'video'}.mp4`}
                 style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: '#22c55e', color: 'white', fontWeight: 'bold', padding: '1rem', borderRadius: '8px', textDecoration: 'none', transition: '0.2s' }}
               >
                 <Download className="w-5 h-5" /> 
                 Descargar MP4
               </a>
             ) : (
               <button 
                 disabled={!plan || rendering} 
                 onClick={handleRenderReel}
                 style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'white', color: '#4f46e5', fontWeight: 'bold', padding: '1rem', borderRadius: '8px', border: 'none', cursor: (!plan || rendering) ? 'not-allowed' : 'pointer', opacity: (!plan || rendering) ? 0.7 : 1 }}
               >
                 {rendering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                 {rendering ? 'Renderizando...' : 'Renderizar MP4'}
               </button>
             )}
          </div>
        </div>

        {/* Columna Derecha: Previsualización de Remotion */}
        <div style={{ background: '#09090b', borderRadius: '24px', padding: '2rem', display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative', overflow: 'hidden', minHeight: '600px', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
          <div style={{ position: 'absolute', top: '1rem', left: '1.5rem', zIndex: 10 }}>
            <span style={{ background: 'rgba(239,68,68,0.8)', backdropFilter: 'blur(4px)', color: 'white', padding: '0.3rem 0.6rem', borderRadius: '50px', fontSize: '0.65rem', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '0.1em', border: '1px solid rgba(239,68,68,0.5)' }}>
              🔴 LIVE PREVIEW
            </span>
          </div>
          
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'rgba(255,255,255,0.5)' }}>
              <Video className="w-10 h-10 mb-2" style={{ animation: 'bounce 1s infinite' }} />
              <p>Cargando previsualización...</p>
            </div>
          ) : (
            <div style={{ borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', outline: '8px solid #161625', backgroundColor: '#000', width: '320px', height: '568px' }}>
               <Player
                 component={PlanazoReel}
                 inputProps={{
                   title: plan?.title || "Plan Extremo Editando",
                   price: plan?.price || "GRATIS",
                   zone: plan?.zone || "Barcelona",
                   images: plan?.image ? [plan.image] : ['https://images.unsplash.com/photo-1542204165-65bf26472b9b?q=80&w=1974&auto=format&fit=crop'],
                   hooks: hooks.filter(h => h.trim() !== '')
                 }}
                 durationInFrames={450}
                 fps={30}
                 compositionWidth={1080}
                 compositionHeight={1920}
                 style={{
                   width: '320px',
                   height: '568px'
                 }}
                 controls
                 autoPlay
                 loop
               />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
