"use client";

import { useState, useEffect } from 'react';
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

  const planId = searchParams?.id;

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
          images: plan?.images?.length ? plan.images : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop'],
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
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Cabecera */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/restaurantes" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Video className="w-8 h-8 text-blue-600" />
              Generador de Reels con IA
            </h1>
            <p className="text-gray-500 mt-1">Crea vídeos verticales espectaculares a partir de tus planes automáticamente.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Columna Izquierda: Configuración */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Wand2 className="w-5 h-5 text-purple-500" /> Contenido del Reel
                </h2>
              </div>
              
              {!plan ? (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                  No se ha seleccionado ningún plan. Vuelve al panel e inicia el generador desde un planazo específico.
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Título Principal</label>
                    <input 
                      type="text" 
                      value={plan.title || ''} 
                      onChange={(e) => setPlan({...plan, title: e.target.value})}
                      className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-900 shadow-sm"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Precio Mostrado</label>
                    <input 
                      type="text" 
                      value={plan.price || ''} 
                      onChange={(e) => setPlan({...plan, price: e.target.value})}
                      className="w-full border-gray-300 rounded-lg p-3 bg-gray-50 border focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-900 shadow-sm"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider">Ganchos (Textos Animados)</label>
                       <button 
                         onClick={handleGenerateHooks}
                         disabled={generatingHooks}
                         className="flex items-center gap-1 text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md font-bold transition-colors disabled:opacity-50"
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
                        className="w-full text-sm border-gray-300 rounded-lg p-2.5 mb-2 bg-gray-50 border focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-medium text-gray-900 shadow-sm"
                      />
                    ))}
                    <button 
                      onClick={() => setHooks([...hooks, "Nuevo gancho..."])}
                      className="text-sm text-purple-600 font-semibold hover:text-purple-800 transition-colors mt-1"
                    >
                      + Añadir texto
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-6 rounded-2xl shadow-lg border border-indigo-400 text-white">
               <h3 className="font-bold text-lg mb-2">Exportar Vídeo</h3>
               <p className="text-white/80 text-sm mb-4">Pulsa para renderizar el vídeo final MP4. Tarda unos 15-30 segundos según la longitud.</p>
               
               <div className="flex flex-col gap-2 mb-4 bg-white/10 p-3 rounded-lg border border-white/20">
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" checked={autoPublishIg} onChange={e => setAutoPublishIg(e.target.checked)} className="rounded text-indigo-500 bg-white/20 border-white/30" />
                   <span className="text-sm font-medium">Auto-publicar en Instagram Reels</span>
                 </label>
                 <label className="flex items-center gap-2 cursor-pointer">
                   <input type="checkbox" checked={autoPublishTt} onChange={e => setAutoPublishTt(e.target.checked)} className="rounded text-indigo-500 bg-white/20 border-white/30" />
                   <span className="text-sm font-medium">Auto-publicar en TikTok</span>
                 </label>
               </div>

               {renderError && (
                 <div className="mb-4 bg-red-500/20 border border-red-500/50 p-2 rounded text-xs text-red-100">
                   Error: {renderError}
                 </div>
               )}

               {publishStatus === 'publishing' && (
                 <div className="mb-4 bg-yellow-500/20 border border-yellow-500/50 p-2 rounded text-xs text-yellow-100 flex items-center gap-2">
                   <Loader2 className="w-3 h-3 animate-spin" /> Conectando con Meta/TikTok API...
                 </div>
               )}

               {publishStatus === 'success' && (
                 <div className="mb-4 bg-green-500/20 border border-green-500/50 p-2 rounded text-xs text-green-100">
                   ¡Petición enviada a las redes con éxito! (Nota: tardarán unos minutos en procesar y colgar el vídeo en tu feed).
                 </div>
               )}

               {renderUrl ? (
                 <a 
                   href={renderUrl}
                   target="_blank"
                   rel="noopener noreferrer"
                   className="w-full flex items-center justify-center gap-2 bg-green-500 hover:bg-green-400 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-md mt-4"
                 >
                   <Download className="w-5 h-5" /> 
                   Descargar MP4
                 </a>
               ) : (
                 <button 
                   disabled={!plan || rendering} 
                   onClick={handleRenderReel}
                   className="w-full flex items-center justify-center gap-2 bg-white text-indigo-700 hover:bg-gray-100 font-bold py-3 px-4 rounded-xl transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                 >
                   {rendering ? <Loader2 className="w-5 h-5 animate-spin" /> : <Video className="w-5 h-5" />}
                   {rendering ? 'Renderizando...' : 'Renderizar MP4'}
                 </button>
               )}
            </div>
          </div>

          {/* Columna Derecha: Previsualización de Remotion */}
          <div className="lg:col-span-2 flex justify-center items-center bg-gray-900 rounded-3xl p-8 shadow-inner overflow-hidden relative min-h-[600px]">
            <div className="absolute top-4 left-6 z-10">
              <span className="bg-red-500/80 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold font-mono tracking-widest animate-pulse border border-red-400">
                PREVIEW EN DIRECTO
              </span>
            </div>
            
            {loading ? (
              <div className="text-white flex flex-col items-center">
                <Video className="w-12 h-12 text-gray-700 animate-bounce mb-4" />
                <p>Cargando datos del plan...</p>
              </div>
            ) : (
              <div className="rounded-[40px] overflow-hidden shadow-2xl ring-8 ring-gray-800 bg-black" style={{ width: '320px', height: '568px' }}>
                 <Player
                   component={PlanazoReel}
                   inputProps={{
                     title: plan?.title || "Plan Extremo Editando",
                     price: plan?.price || "GRATIS",
                     zone: plan?.zone || "Barcelona",
                     images: plan?.images?.length ? plan.images : ['https://images.unsplash.com/photo-1514933651103-005eec06c04b?q=80&w=1974&auto=format&fit=crop'],
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
    </div>
  );
}
