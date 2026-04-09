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
    const { videoUrl, imageUrl, caption, telegram, whatsapp, type = 'video' } = body;

    const mediaUrl = videoUrl || imageUrl;
    if (!mediaUrl) {
      return NextResponse.json({ error: 'Falta la URL del medio a publicar' }, { status: 400 });
    }

    let results = {
      telegram: { status: 'skipped' },
      whatsapp: { status: 'skipped' },
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
          console.log(`Enviando ${type} al teléfono vía Telegram...`);
          
          // Choose between sendVideo and sendPhoto based on type
          const endpoint = type === 'image' ? 'sendPhoto' : 'sendVideo';
          const mediaField = type === 'image' ? 'photo' : 'video';
          
          const telegramPayload = {
            chat_id: chatId,
            [mediaField]: mediaUrl,
            caption: caption || '',
            parse_mode: 'HTML',
          };

          // Video-specific options
          if (type === 'video') {
            telegramPayload.supports_streaming = true;
          }

          const telegramCmd = await fetch(`https://api.telegram.org/bot${botToken}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(telegramPayload)
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

    // PUBLICACIÓN VIA WHATSAPP BUSINESS API
    if (whatsapp) {
      const waToken = process.env.WHATSAPP_TOKEN;
      const waPhoneId = process.env.WHATSAPP_PHONE_ID;
      const waGroupId = process.env.WHATSAPP_GROUP_ID;

      if (!waToken || !waPhoneId) {
        // Fallback: If no WhatsApp API configured, try Telegram as channel
        results.whatsapp = { 
          status: 'skipped', 
          note: 'WhatsApp Business API no configurada. Usa Telegram como alternativa.' 
        };
      } else {
        try {
          console.log("Enviando evento a WhatsApp Business...");
          
          // Send image with caption via WhatsApp Cloud API
          const waRes = await fetch(`https://graph.facebook.com/v19.0/${waPhoneId}/messages`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${waToken}`,
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: waGroupId,
              type: 'image',
              image: {
                link: mediaUrl,
                caption: caption || '',
              }
            }),
          });

          const waData = await waRes.json();
          if (!waRes.ok) {
            throw new Error(waData.error?.message || JSON.stringify(waData));
          }

          results.whatsapp = { status: 'success', message_id: waData.messages?.[0]?.id };
        } catch (waErr) {
          console.error("Error enviando por WhatsApp:", waErr);
          results.whatsapp = { status: 'error', error: waErr.message };
        }
      }
    }

    return NextResponse.json({ success: true, results });

  } catch (err) {
    console.error('API Error /publish-social:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
