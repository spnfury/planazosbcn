/**
 * Formats a date string into a readable Spanish format: "18 abr 2026"
 * Supports ISO (YYYY-MM-DD) and d/m/yy or d/m/yyyy formats.
 * Returns the original string if it cannot be parsed.
 */
const MONTHS = [
  'ene', 'feb', 'mar', 'abr', 'may', 'jun',
  'jul', 'ago', 'sep', 'oct', 'nov', 'dic',
];

export function formatDate(dateStr) {
  if (!dateStr) return '';

  let date;

  // Try ISO format first: YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    date = new Date(y, m - 1, d);
  }
  // Try d/m/yy or d/m/yyyy
  else if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(dateStr)) {
    const [d, m, y] = dateStr.split('/').map(Number);
    const fullYear = y < 100 ? 2000 + y : y;
    date = new Date(fullYear, m - 1, d);
  }

  if (!date || isNaN(date.getTime())) {
    return dateStr; // Return original if unparseable
  }

  const day = date.getDate();
  const month = MONTHS[date.getMonth()];
  const year = date.getFullYear();

  return `${day} ${month} ${year}`;
}
