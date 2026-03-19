import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { logActivity } from '@/lib/log';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export async function POST(request) {
  try {
    const { name, email, business, type, message } = await request.json();

    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Name, email, and message are required' },
        { status: 400 }
      );
    }

    const htmlContent = `
      <h2>Nuevo mensaje de colaboración en PlanazosBCN</h2>
      <p><strong>Nombre:</strong> ${name}</p>
      <p><strong>Email (Contacto):</strong> ${email}</p>
      <p><strong>Tipo de Negocio:</strong> ${type}</p>
      <p><strong>Nombre del Negocio:</strong> ${business || 'No especificado'}</p>
      <p><strong>Mensaje:</strong></p>
      <blockquote style="border-left: 4px solid #ccc; padding-left: 1rem; color: #555;">
        ${message}
      </blockquote>
    `;

    if (!resend) {
      console.error('Resend API key is not configured');
      return NextResponse.json({ error: 'Email service is not configured' }, { status: 500 });
    }

    const { data, error } = await resend.emails.send({
      from: 'PlanazosBCN Contacto <onboarding@resend.dev>', // Using the free tier default onboarding domain. Update to your custom domain later if added to Resend.
      to: ['delivery@resend.dev'], // Send to the default testing email for the free tier without a verified domain. Note: user may want this sent to their own email, but free tier without domain verified only allows 'delivery@resend.dev'. Let's set it to the email they used to sign up for resend when they verify or for now 'delivery@resend.dev' works for testing. Actually, standard practice for devs is to put their own email. But onboarding@resend.dev only allows sending to the email registered with Resend. I will use a placeholder or let them know. We can use delivery@resend.dev for testing.
      subject: `Nueva colaboración: ${business ? business : name} (${type})`,
      replyTo: email,
      html: htmlContent,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await logActivity({ action: 'contact.submitted', entityType: 'contact', details: { name, email, business, type } });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Error processing contact request' },
      { status: 500 }
    );
  }
}
