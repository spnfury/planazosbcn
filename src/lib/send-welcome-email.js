import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

/**
 * Send a premium welcome email to a newly registered user.
 * @param {{ email: string, fullName?: string }} opts
 */
export async function sendWelcomeEmail({ email, fullName }) {
  if (!resend) {
    console.log('[sendWelcomeEmail] Skipped — RESEND_API_KEY not set');
    return;
  }

  const firstName = fullName ? fullName.split(' ')[0] : '';
  const greeting = firstName ? `¡Hola ${firstName}!` : '¡Hola!';
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://planazosbcn.com';

  try {
    await resend.emails.send({
      from: 'PlanazosBCN <hola@planazosbcn.com>',
      to: [email],
      subject: '🎉 ¡Bienvenid@ a PlanazosBCN! Tu aventura empieza aquí',
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Bienvenid@ a PlanazosBCN</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #0a0a0a;">
    <tr>
      <td align="center" style="padding: 40px 16px;">
        <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%;">
          
          <!-- LOGO -->
          <tr>
            <td align="center" style="padding-bottom: 32px;">
              <img src="${baseUrl}/logo-planazosbcn.png" alt="PlanazosBCN" height="50" style="height: 50px; width: auto; filter: brightness(0) invert(1);" />
            </td>
          </tr>

          <!-- HERO SECTION -->
          <tr>
            <td style="background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); border-radius: 20px 20px 0 0; padding: 48px 40px 32px; text-align: center;">
              <div style="font-size: 48px; margin-bottom: 16px;">🎉</div>
              <h1 style="margin: 0 0 8px; font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                ${greeting}
              </h1>
              <p style="margin: 0; font-size: 18px; color: #e94560; font-weight: 600;">
                ¡Bienvenid@ a PlanazosBCN!
              </p>
            </td>
          </tr>

          <!-- BODY -->
          <tr>
            <td style="background-color: #111827; padding: 32px 40px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.7; color: #d1d5db;">
                Ya formas parte de la comunidad que descubre los mejores planes de Barcelona. 
                Estamos encantados de tenerte aquí. 🙌
              </p>
              <p style="margin: 0 0 28px; font-size: 16px; line-height: 1.7; color: #d1d5db;">
                Desde restaurantes secretos hasta eventos únicos, hemos seleccionado lo mejor de la ciudad para que no te pierdas nada.
              </p>

              <!-- FEATURE CARDS -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 16px 20px; background: linear-gradient(135deg, rgba(233, 69, 96, 0.15), rgba(233, 69, 96, 0.05)); border-radius: 12px; border-left: 4px solid #e94560; margin-bottom: 12px;">
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">🔍 Descubre Planes</p>
                    <p style="margin: 0; font-size: 14px; color: #9ca3af;">Explora gastronomía, cultura, ocio nocturno, actividades al aire libre y mucho más.</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px 20px; background: linear-gradient(135deg, rgba(52, 211, 153, 0.15), rgba(52, 211, 153, 0.05)); border-radius: 12px; border-left: 4px solid #34d399;">
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">🎟️ Reserva al Instante</p>
                    <p style="margin: 0; font-size: 14px; color: #9ca3af;">Compra tus entradas fácilmente y recibe tu confirmación con QR al momento.</p>
                  </td>
                </tr>
                <tr><td style="height: 12px;"></td></tr>
                <tr>
                  <td style="padding: 16px 20px; background: linear-gradient(135deg, rgba(96, 165, 250, 0.15), rgba(96, 165, 250, 0.05)); border-radius: 12px; border-left: 4px solid #60a5fa;">
                    <p style="margin: 0 0 4px; font-size: 15px; font-weight: 700; color: #ffffff;">⭐ Opiniones Reales</p>
                    <p style="margin: 0; font-size: 14px; color: #9ca3af;">Lee reseñas de la comunidad y comparte tu experiencia con otros exploradores.</p>
                  </td>
                </tr>
              </table>

              <!-- CTA BUTTON -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center">
                    <a href="${baseUrl}/planes" target="_blank" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #e94560, #c23152); color: #ffffff; font-size: 16px; font-weight: 700; text-decoration: none; border-radius: 12px; letter-spacing: 0.3px;">
                      Explorar Planes →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td style="background-color: #0d1117; border-radius: 0 0 20px 20px; padding: 28px 40px; text-align: center; border-top: 1px solid #1f2937;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #6b7280;">
                ¿Tienes alguna duda? Escríbenos a 
                <a href="mailto:hola@planazosbcn.com" style="color: #e94560; text-decoration: none;">hola@planazosbcn.com</a>
              </p>
              <p style="margin: 0 0 16px; font-size: 13px; color: #6b7280;">
                Síguenos en 
                <a href="https://www.instagram.com/planazosbcn" style="color: #e94560; text-decoration: none;">Instagram</a>
              </p>
              <p style="margin: 0; font-size: 11px; color: #4b5563;">
                © ${new Date().getFullYear()} PlanazosBCN — Barcelona, España
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
      `,
    });
    console.log(`✉️ Welcome email sent to ${email}`);
  } catch (err) {
    console.error('Failed to send welcome email:', err);
  }
}
