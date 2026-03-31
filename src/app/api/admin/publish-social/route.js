import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req) {
  try {
    const supabase = await createClient();
    
    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Permisos insuficientes' }, { status: 403 });
    }

    const body = await req.json();
    const { videoUrl, caption, instagram, tiktok } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falta la URL del vídeo a publicar' }, { status: 400 });
    }

    let results = {
      instagram: { status: 'skipped' },
      tiktok: { status: 'skipped' }
    };

    // 1. PUBLICACIÓN EN INSTAGRAM REELS (Meta Graph API)
    if (instagram) {
      const igAccountId = process.env.IG_ACCOUNT_ID;
      const igAccessToken = process.env.IG_ACCESS_TOKEN;

      if (!igAccountId || !igAccessToken) {
        results.instagram = { 
          status: 'error', 
          error: 'Faltan credenciales de Meta Graph API (IG_ACCOUNT_ID, IG_ACCESS_TOKEN) en el entorno.' 
        };
      } else {
        try {
          // Fase 1: Crear Contenedor de Reel
          console.log("Iniciando subida a IG (Fase 1)...");
          const createCmd = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media?media_type=REELS&video_url=${encodeURIComponent(videoUrl)}&caption=${encodeURIComponent(caption)}&access_token=${igAccessToken}`, {
            method: 'POST'
          });
          
          const createData = await createCmd.json();
          if (createData.error) throw new Error(createData.error.message);
          
          const containerId = createData.id;
          
          // Fase 2: Publicar y confirmar (Requeriría Webhooks o Polling, simplificamos con delay de 10s para este ejemplo y no bloquear a Vercel más de lo necesario).
          // NOTA: En un entorno de producción masivo, esto debe ir en un sistema de colas (AWS SQS, Upstash, o Meta Webhooks).
          console.log(`Contenedor IG creado (${containerId}). Esperando procesamiento...`);
          await new Promise(resolve => setTimeout(resolve, 15000));
          
          const publishCmd = await fetch(`https://graph.facebook.com/v19.0/${igAccountId}/media_publish?creation_id=${containerId}&access_token=${igAccessToken}`, {
            method: 'POST'
          });
          
          const publishData = await publishCmd.json();
          if (publishData.error) throw new Error(publishData.error.message);

          results.instagram = { status: 'success', id: publishData.id };
        } catch (igErr) {
          console.error("Error publicando en Instagram:", igErr);
          results.instagram = { status: 'error', error: igErr.message };
        }
      }
    }

    // 2. PUBLICACIÓN EN TIKTOK DIRECT POST API
    if (tiktok) {
      const tiktokAccessToken = process.env.TIKTOK_ACCESS_TOKEN;

      if (!tiktokAccessToken) {
        results.tiktok = { 
          status: 'error', 
          error: 'Faltan credenciales de TikTok Developer (TIKTOK_ACCESS_TOKEN) en el entorno.' 
        };
      } else {
        try {
          // API v2 Content Posting: Inicializamos el "pull" desde una URL pública
          // Nota de la API de TikTok (Requiere scope video.publish)
          const ttCmd = await fetch(`https://open.tiktokapis.com/v2/post/publish/video/init/`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${tiktokAccessToken}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              post_info: {
                title: caption,
                privacy_level: 'PUBLIC_TO_EVERYONE',
                disable_comment: false
              },
              source_info: {
                source: 'PULL_FROM_URL',
                video_url: videoUrl
              }
            })
          });

          const ttData = await ttCmd.json();
          if (ttData.error) throw new Error(ttData.error.message || 'Error en API de TikTok');
          
          results.tiktok = { status: 'success', publish_id: ttData.data.publish_id };
        } catch (ttErr) {
          console.error("Error publicando en TikTok:", ttErr);
          results.tiktok = { status: 'error', error: ttErr.message };
        }
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (err) {
    console.error('API Error /publish-social:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
