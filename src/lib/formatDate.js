/**
 * Centralized date parsing and formatting for PlanazosBCN
 */
const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

const MONTH_MAP = {
  'ene': 0, 'enero': 0,
  'feb': 1, 'febrero': 1,
  'mar': 2, 'marzo': 2,
  'abr': 3, 'abril': 3,
  'may': 4, 'mayo': 4,
  'jun': 5, 'junio': 5,
  'jul': 6, 'julio': 6,
  'ago': 7, 'agosto': 7,
  'sep': 8, 'sept': 8, 'septiembre': 8,
  'oct': 9, 'octubre': 9,
  'nov': 10, 'noviembre': 10,
  'dic': 11, 'diciembre': 11,
};

export function parsePlanDate(dateStr) {
  if (!dateStr) return null;

  // Try ISO format first: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('T')[0].split('-').map(Number);
    return new Date(y, m - 1, d);
  }
  
  // Try d/m/yy or d/m/yyyy
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/').map(Number);
    const fullYear = y < 100 ? 2000 + y : y;
    return new Date(fullYear, m - 1, d);
  }

  // Fallback to Spanish text
  const clean = String(dateStr).replace(/[.,]/g, '').toLowerCase().trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  let day = null, month = null, year = null;

  for (const part of parts) {
    const num = parseInt(part, 10);
    if (!isNaN(num)) {
      if (num > 31) {
        year = num;
      } else if (day === null) {
        day = num;
      } else {
        year = num > 100 ? num : 2000 + num;
      }
    } else if (MONTH_MAP[part] !== undefined) {
      month = MONTH_MAP[part];
    }
  }

  if (day !== null && month !== null) {
    if (year === null) year = new Date().getFullYear();
    return new Date(year, month, day);
  }
  
  return null;
}

export function isPastEvent(dateStr) {
  if (!dateStr) return false; // Don't hide if date is missing
  const date = parsePlanDate(dateStr);
  if (!date) return false;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date < today;
}

export function formatDate(dateStr) {
  if (!dateStr) return '';

  const date = parsePlanDate(dateStr);

  if (!date || isNaN(date.getTime())) {
    return dateStr; // Return original if unparseable
  }

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
