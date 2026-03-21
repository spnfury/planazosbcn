import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

const ADMIN_EMAILS = ['emaciasdayrit@icloud.com', 'thevega82@gmail.com', 'emacday@planazosbcn.com'];

/**
 * Send a notification email to all admin addresses.
 * @param {object} opts
 * @param {string} opts.subject - Email subject
 * @param {string} opts.html - Email body HTML
 */
export async function notifyAdmins({ subject, html }) {
  if (!resend) {
    console.log('[notifyAdmins] Skipped — RESEND_API_KEY not set');
    return;
  }

  try {
    await resend.emails.send({
      from: 'PlanazosBCN Notificaciones <notificaciones@planazosbcn.com>',
      to: ADMIN_EMAILS,
      subject,
      html,
    });
    console.log(`📧 Admin notification sent: ${subject}`);
  } catch (err) {
    console.error('Failed to send admin notification:', err);
  }
}

export { ADMIN_EMAILS };
