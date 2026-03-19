import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const planId = searchParams.get('planId');

    if (!planId) {
      return NextResponse.json({ error: 'planId requerido' }, { status: 400 });
    }

    // Check that user has a paid reservation for this plan
    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .limit(1)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: 'No tienes reserva en este plan' }, { status: 403 });
    }

    // Fetch messages with author profile info
    const { data: messages, error } = await supabaseAdmin
      .from('chat_messages')
      .select(`
        id,
        message,
        created_at,
        user_id,
        profiles:user_id (full_name, avatar_url, show_profile)
      `)
      .eq('plan_id', planId)
      .order('created_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('Chat fetch error:', error);
      return NextResponse.json({ error: 'Error al cargar mensajes' }, { status: 500 });
    }

    // Map messages to include author info
    const mapped = (messages || []).map((m) => ({
      id: m.id,
      message: m.message,
      createdAt: m.created_at,
      userId: m.user_id,
      authorName: m.profiles?.full_name || 'Anónimo',
      authorAvatar: m.profiles?.show_profile !== false ? m.profiles?.avatar_url : null,
      isOwn: m.user_id === user.id,
    }));

    return NextResponse.json({ messages: mapped });
  } catch (err) {
    console.error('Chat GET error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { planId, message } = await request.json();

    if (!planId || !message?.trim()) {
      return NextResponse.json({ error: 'planId y message requeridos' }, { status: 400 });
    }

    if (message.length > 1000) {
      return NextResponse.json({ error: 'Mensaje demasiado largo (máx 1000 caracteres)' }, { status: 400 });
    }

    // Check reservation
    const { data: reservation } = await supabaseAdmin
      .from('reservations')
      .select('id')
      .eq('plan_id', planId)
      .eq('user_id', user.id)
      .eq('status', 'paid')
      .limit(1)
      .single();

    if (!reservation) {
      return NextResponse.json({ error: 'No tienes reserva en este plan' }, { status: 403 });
    }

    // Insert message
    const { data: newMsg, error } = await supabaseAdmin
      .from('chat_messages')
      .insert({
        plan_id: planId,
        user_id: user.id,
        message: message.trim(),
      })
      .select(`
        id,
        message,
        created_at,
        user_id,
        profiles:user_id (full_name, avatar_url, show_profile)
      `)
      .single();

    if (error) {
      console.error('Chat insert error:', error);
      return NextResponse.json({ error: 'Error al enviar mensaje' }, { status: 500 });
    }

    return NextResponse.json({
      message: {
        id: newMsg.id,
        message: newMsg.message,
        createdAt: newMsg.created_at,
        userId: newMsg.user_id,
        authorName: newMsg.profiles?.full_name || 'Anónimo',
        authorAvatar: newMsg.profiles?.show_profile !== false ? newMsg.profiles?.avatar_url : null,
        isOwn: true,
      },
    });
  } catch (err) {
    console.error('Chat POST error:', err);
    return NextResponse.json({ error: 'Error del servidor' }, { status: 500 });
  }
}
