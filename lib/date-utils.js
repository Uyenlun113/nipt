/**
 /**
 * Formats date string into DD/MM/YYYY.
 * Handles ISO strings (2026-08-20T...), YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY
 * and zero-pads day and month numbers.
 */
export function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim().split('T')[0];

  // Match YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const yyyy = match[1];
    const mm = match[2].padStart(2, '0');
    const dd = match[3].padStart(2, '0');
    return `${dd}/${mm}/${yyyy}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const dd = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    const yyyy = match[3];
    return `${dd}/${mm}/${yyyy}`;
  }

  return str;
}
