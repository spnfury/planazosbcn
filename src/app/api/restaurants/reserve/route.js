import { NextResponse } from 'next/server';
import { notifyAdmins } from '@/lib/notify-admins';
import { supabaseAdmin } from '@/lib/supabase-server'; // If we want to read the restaurant/menu name

export async function POST(req) {
  try {
    const { restaurantId, menuId, customerName, customerEmail, customerPhone, date, time, guests, comments } = await req.json();

    if (!restaurantId || !customerName || !customerEmail || !date || !time || !guests) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    // Fetch details for the email
    const { data: restaurant } = await supabaseAdmin.from('restaurants').select('nombre').eq('id', restaurantId).single();
    const { data: menu } = menuId ? await supabaseAdmin.from('restaurant_menus').select('nombre, precio').eq('id', menuId).single() : { data: null };

    const restaurantName = restaurant?.nombre || 'Restaurante Desconocido';
    const menuName = menu ? `${menu.nombre} (${menu.precio}€)` : 'Menú no especificado / A la carta';

    // Prepare HTML Email
    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #bcfe2f; background: #111; padding: 1rem; text-align: center; margin: 0;">📅 Nueva Reserva de Restaurante</h2>
        <div style="padding: 2rem; border: 1px solid #eee;">
          <h3 style="margin-top: 0; font-size: 1.5rem;">${restaurantName}</h3>
          <p><strong>Menú Solicitado:</strong> ${menuName}</p>
          <hr style="border: none; border-top: 1px solid #ccc; margin: 1.5rem 0;" />
          <ul style="list-style: none; padding: 0; margin: 0;">
            <li style="margin-bottom: 0.5rem;">👤 <strong>Nombre:</strong> ${customerName}</li>
            <li style="margin-bottom: 0.5rem;">✉️ <strong>Email:</strong> ${customerEmail}</li>
            <li style="margin-bottom: 0.5rem;">📱 <strong>Teléfono:</strong> ${customerPhone || 'No proporcionado'}</li>
            <li style="margin-bottom: 0.5rem;">👥 <strong>Comensales:</strong> ${guests} personas</li>
            <li style="margin-bottom: 0.5rem;">📆 <strong>Fecha:</strong> ${date}</li>
            <li style="margin-bottom: 0.5rem;">🕒 <strong>Hora:</strong> ${time}</li>
          </ul>
          ${comments ? `
            <div style="margin-top: 1.5rem; padding: 1rem; background: #f9f9f9; border-left: 4px solid #bcfe2f;">
              <strong>Comentarios adicionales:</strong><br />
              ${comments}
            </div>
          ` : ''}
        </div>
      </div>
    `;

    await notifyAdmins({
      subject: `🍽️ Nueva reserva: ${restaurantName} - ${date} ${time}`,
      html: emailHtml,
    });

    return NextResponse.json({ success: true, message: 'Reserva enviada correctamente' });
  } catch (error) {
    console.error('Error procesando reserva de restaurante:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar la reserva' }, { status: 500 });
  }
}
