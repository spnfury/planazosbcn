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

    const { data: adminUser, error: queryError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single();

    if (!adminUser || queryError) {
      return NextResponse.json({ error: 'Permisos insuficientes (No en admin_users)' }, { status: 403 });
    }

    const body = await req.json();
    const { videoUrl, caption, telegram } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'Falta la URL del vídeo a publicar' }, { status: 400 });
    }

    let results = {
      telegram: { status: 'skipped' }
    };

    // PUBLICACIÓN VIA TELEGRAM BOT
    if (telegram) {
      const botToken = process.env.TELEGRAM_BOT_TOKEN;
      const chatId = process.env.TELEGRAM_CHAT_ID;

      if (!botToken || !chatId) {
        results.telegram = { 
          status: 'error', 
          error: 'Faltan credenciales del Bot de Telegram (TELEGRAM_BOT_TOKEN o TELEGRAM_CHAT_ID) en el entorno.' 
        };
      } else {
        try {
          console.log("Enviando Reel generado al teléfono vía Telegram...");
          const telegramCmd = await fetch(`https://api.telegram.org/bot${botToken}/sendVideo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: chatId,
              video: videoUrl,
              caption: caption,
              supports_streaming: true
            })
          });
          
          const tgData = await telegramCmd.json();
          if (!tgData.ok) {
            throw new Error(tgData.description || 'Error desconocido de Telegram');
          }

          results.telegram = { status: 'success', message_id: tgData.result.message_id };
        } catch (tgErr) {
          console.error("Error enviando por Telegram:", tgErr);
          results.telegram = { status: 'error', error: tgErr.message };
        }
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (err) {
    console.error('API Error /publish-social:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
