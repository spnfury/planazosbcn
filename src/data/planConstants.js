// Shared constants for plan age groups and etiquetas

export const AGE_GROUPS = [
  { id: 'todos', label: 'Para todos', emoji: '👥' },
  { id: '18-25', label: '18-25 años', emoji: '🧑' },
  { id: '25-30', label: '25-30 años', emoji: '🧑‍💼' },
  { id: '30-40', label: '30-40 años', emoji: '👨‍💼' },
  { id: '40-50', label: '40-50 años', emoji: '🧔' },
  { id: '50-60', label: '50-60 años', emoji: '👴' },
  { id: '60+', label: 'Más de 60', emoji: '🤍' },
];

export const ETIQUETAS = [
  { id: 'lgbtq', label: 'LGBTQ+ Friendly', emoji: '🌈' },
  { id: 'con-ninos', label: 'Con niños', emoji: '👨‍👩‍👧‍👦' },
  { id: 'solo-adultos', label: 'Solo adultos', emoji: '🔞' },
  { id: 'pet-friendly', label: 'Pet Friendly', emoji: '🐕' },
  { id: 'accesible', label: 'Accesible', emoji: '♿' },
  { id: 'liberal', label: 'Liberal', emoji: '🌙' },
  { id: 'parejas', label: 'Parejas', emoji: '💑' },
  { id: 'singles', label: 'Singles', emoji: '👫' },
  { id: 'cumpleanos', label: 'Cumpleaños', emoji: '🎂' },
  { id: 'universitarios', label: 'Universitarios', emoji: '🎓' },
  { id: 'fitness', label: 'Fitness & Deporte', emoji: '🏋️' },
  { id: 'mindfulness', label: 'Mindfulness', emoji: '🧘' },
  { id: 'musica-en-vivo', label: 'Música en vivo', emoji: '🎤' },
  { id: 'dj-electronica', label: 'DJ / Electrónica', emoji: '🎧' },
  { id: 'baile', label: 'Baile', emoji: '💃' },
  { id: 'cata', label: 'Cata / Degustación', emoji: '🍷' },
  { id: 'instagrameable', label: 'Instagrameable', emoji: '📸' },
  { id: 'aire-libre', label: 'Al aire libre', emoji: '🌅' },
  { id: 'indoor', label: 'Indoor', emoji: '🏠' },
  { id: 'escapada', label: 'Escapada / Excursión', emoji: '🚐' },
  { id: 'espectaculo', label: 'Espectáculo', emoji: '🎭' },
  { id: 'taller', label: 'Taller / Workshop', emoji: '🎨' },
  { id: 'afterwork', label: 'Afterwork', emoji: '🍻' },
  { id: 'tardeo', label: 'Tardeo', emoji: '☀️' },
  { id: 'nocturno', label: 'Nocturno', emoji: '🌃' },
  { id: 'fiesta', label: 'Fiesta', emoji: '🎉' },
  { id: 'gastro', label: 'Gastro / Foodie', emoji: '🧑‍🍳' },
  { id: 'spa-relax', label: 'Spa & Relax', emoji: '🧖' },
  { id: 'networking', label: 'Networking', emoji: '💼' },
  { id: 'gaming', label: 'Gaming / Geek', emoji: '🎮' },
  { id: 'internacional', label: 'Internacional', emoji: '🌍' },
  { id: 'local', label: 'Local / Castizo', emoji: '🇪🇸' },
  { id: 'gratis', label: 'Gratis', emoji: '🆓' },
  { id: 'premium', label: 'Premium / VIP', emoji: '💎' },
  { id: 'team-building', label: 'Team Building', emoji: '🤝' },
  { id: 'beach', label: 'Beach / Playa', emoji: '🏖️' },
];

// Helper: get etiqueta info by id
export function getEtiqueta(id) {
  return ETIQUETAS.find((e) => e.id === id) || { id, label: id, emoji: '🏷️' };
}

// Helper: get age group info by id
export function getAgeGroup(id) {
  return AGE_GROUPS.find((a) => a.id === id) || { id, label: id, emoji: '👥' };
}
