// Promo Kit — copys, directorios y configuración para promoción del grupo
// de WhatsApp en directorios externos. Edita libremente aquí.

export const DIRECTORIES = [
  { id: 'whatsgrouplinks', label: 'whatsgrouplinks.com', url: 'https://whatsgrouplinks.com', tier: 'top', kind: 'directory' },
  { id: 'groupslor', label: 'groupslor.com', url: 'https://groupslor.com', tier: 'top', kind: 'directory' },
  { id: 'whatsgrouplink', label: 'whatsgrouplink.com', url: 'https://whatsgrouplink.com', tier: 'top', kind: 'directory' },
  { id: 'chatlinks', label: 'chatlinks.app', url: 'https://chatlinks.app', tier: 'top', kind: 'directory' },
  { id: 'grouplinks', label: 'grouplinks.app', url: 'https://grouplinks.app', tier: 'top', kind: 'directory' },
  { id: 'whatsapp-group-links', label: 'whatsapp-group-links.com', url: 'https://whatsapp-group-links.com', tier: 'mid', kind: 'directory' },
  { id: 'grupo-whatsapp', label: 'grupo-whatsapp.com', url: 'https://grupo-whatsapp.com', tier: 'mid', kind: 'directory' },
  { id: 'invitacionalgrupo', label: 'invitacionalgrupo.com', url: 'https://invitacionalgrupo.com', tier: 'mid', kind: 'directory', country: 'ES' },
  { id: 'comuniza', label: 'comuniza.es', url: 'https://comuniza.es', tier: 'mid', kind: 'directory', country: 'ES' },
  { id: 'gruposdewhatsapp', label: 'gruposdewhatsapp.online', url: 'https://gruposdewhatsapp.online', tier: 'mid', kind: 'directory' },

  { id: 'reddit-barcelona', label: 'r/Barcelona', url: 'https://reddit.com/r/Barcelona', tier: 'top', kind: 'reddit' },
  { id: 'reddit-spain', label: 'r/Spain', url: 'https://reddit.com/r/Spain', tier: 'mid', kind: 'reddit' },
  { id: 'reddit-erasmus', label: 'r/Erasmus', url: 'https://reddit.com/r/Erasmus', tier: 'mid', kind: 'reddit' },
  { id: 'reddit-expats', label: 'r/expats', url: 'https://reddit.com/r/expats', tier: 'mid', kind: 'reddit' },
  { id: 'reddit-wa-groups', label: 'r/WhatsAppGroups', url: 'https://reddit.com/r/WhatsAppGroups', tier: 'mid', kind: 'reddit' },

  { id: 'fb-erasmus-bcn', label: 'FB · Erasmus Barcelona', url: 'https://facebook.com/search/groups?q=erasmus%20barcelona', tier: 'top', kind: 'facebook' },
  { id: 'fb-vivir-bcn', label: 'FB · Vivir en Barcelona', url: 'https://facebook.com/search/groups?q=vivir%20en%20barcelona', tier: 'top', kind: 'facebook' },
  { id: 'fb-eventos-bcn', label: 'FB · Eventos y planes Barcelona', url: 'https://facebook.com/search/groups?q=eventos%20barcelona', tier: 'top', kind: 'facebook' },
  { id: 'fb-spaniards-bcn', label: 'FB · Spaniards in Barcelona', url: 'https://facebook.com/search/groups?q=spaniards%20barcelona', tier: 'mid', kind: 'facebook' },
  { id: 'fb-jovenes-bcn', label: 'FB · Jóvenes Barcelona', url: 'https://facebook.com/search/groups?q=jovenes%20barcelona', tier: 'mid', kind: 'facebook' },

  { id: 'telegram-bcn', label: 'Telegram · canales BCN', url: 'https://t.me/s/planesbarcelona', tier: 'mid', kind: 'telegram' },
];

export const COPY_SHORT =
  '¡Únete al grupo oficial de PlanazosBCN! Los mejores planes, eventos y descuentos secretos de Barcelona cada semana.';

export const COPY_MID =
  `🌆 Grupo oficial de PlanazosBCN

Los mejores planes, eventos y descuentos secretos de Barcelona cada semana.

🔥 Planes exclusivos antes que nadie
🤫 Descuentos solo para miembros
🎟️ Sorteos de entradas

Web: https://planazosbcn.com`;

export const COPY_LONG =
  `🌆 ¿Vives en Barcelona o vienes de visita?

Únete al grupo oficial de PlanazosBCN, la guía de los mejores planes de la ciudad:

🔥 Planes exclusivos antes que nadie
🤫 Descuentos secretos solo para miembros
🎟️ Sorteos de entradas y experiencias
🍽️ Gastronomía, ocio, naturaleza, cultura
📍 Recomendaciones reales, no publi

Web: https://planazosbcn.com

¡Te esperamos!`;

export const COPY_REDDIT =
  `**Monté una guía de planes en Barcelona y un grupo de WhatsApp donde compartimos los mejores eventos cada semana**

Hola gente! Llevo unos meses con PlanazosBCN (planazosbcn.com), una web donde recojo los mejores planes de la ciudad — desde restaurantes secretos hasta eventos del finde, naturaleza cerca de BCN, descuentos, etc.

Para no estar revisando la web, hicimos un grupo de WhatsApp donde mando 2-3 planes top a la semana. Si os interesa: [link]

¿Algún plan favorito vuestro que recomendéis añadir? Acepto feedback.`;

export const TITLE = 'Planazos BCN — Planes y eventos en Barcelona';

export const TAGS =
  'barcelona, planes barcelona, eventos barcelona, qué hacer barcelona, ocio barcelona, gastronomía barcelona, planazos, bcn';

export const BANNERS = [
  { label: 'Logo cuadrado', url: '/logo-planazosbcn.png' },
  { label: 'Hero principal', url: '/hero-planazosbcn.jpg' },
  { label: 'Icon 192', url: '/icon-192.png' },
  { label: 'Icon 512', url: '/icon-512.png' },
];

export function buildWaLink(source, { medium = 'directory', campaign = 'launch' } = {}) {
  const base = 'https://planazosbcn.com/wa';
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    utm_campaign: campaign,
  });
  return `${base}?${params.toString()}`;
}
