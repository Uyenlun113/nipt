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

/**
 * Formats date string into YYYY-MM-DD for HTML input[type="date"].
 * Handles ISO strings, YYYY-MM-DD, DD/MM/YYYY, DD-MM-YYYY.
 */
export function formatDateForInput(dateStr) {
  if (!dateStr) return '';
  const str = String(dateStr).trim().split('T')[0];

  // Match YYYY-MM-DD or YYYY/MM/DD
  let match = str.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
  if (match) {
    const yyyy = match[1];
    const mm = match[2].padStart(2, '0');
    const dd = match[3].padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Match DD-MM-YYYY or DD/MM/YYYY
  match = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
  if (match) {
    const dd = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    const yyyy = match[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  return str;
}

/**
 * Formats report date and time string.
 * - If completed: returns actual completion date/time & isCompleted: true
 * - If pending: expected return date is 5 days after creation date.
 * - If pending and on/after Day 4 since creation: marks isWarning = true
 */
export function formatReportDateTime(sample) {
  const isCompleted = sample?.status === 'completed';
  const createdDateRaw = sample?.createdAt || sample?.receivedDate;

  let createdDate = new Date();
  if (createdDateRaw) {
    const parsed = new Date(createdDateRaw);
    if (!isNaN(parsed.getTime())) {
      createdDate = parsed;
    }
  }

  // Expected return date = Created Date + 5 days
  const expectedDate = new Date(createdDate.getTime() + 5 * 24 * 60 * 60 * 1000);
  const expDay = String(expectedDate.getDate()).padStart(2, '0');
  const expMonth = String(expectedDate.getMonth() + 1).padStart(2, '0');
  const expYear = expectedDate.getFullYear();
  const expectedDateFormatted = `${expDay}/${expMonth}/${expYear}`;

  let dateTimeStr = '';
  let isWarning = false;
  let daysElapsed = 0;

  // Calculate elapsed calendar days from creation to today
  const now = new Date();
  const createdStart = new Date(createdDate.getFullYear(), createdDate.getMonth(), createdDate.getDate()).getTime();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  daysElapsed = Math.max(1, Math.floor((todayStart - createdStart) / (1000 * 60 * 60 * 24)) + 1);

  if (isCompleted) {
    const sourceDate = sample?.updatedAt || sample?.reportDate || sample?.createdAt || sample?.receivedDate;
    if (sourceDate) {
      try {
        const d = new Date(sourceDate);
        if (!isNaN(d.getTime())) {
          const hours = String(d.getHours()).padStart(2, '0');
          const mins = String(d.getMinutes()).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          dateTimeStr = `${hours}:${mins} ${day}/${month}/${year}`;
        }
      } catch (e) {}
    }
    if (!dateTimeStr && sample?.reportDate) {
      dateTimeStr = formatDateVN(sample.reportDate);
    }
    if (!dateTimeStr) {
      dateTimeStr = expectedDateFormatted;
    }
  } else {
    // Pending: Expected return date is 5 days after creation
    const hours = String(createdDate.getHours()).padStart(2, '0');
    const mins = String(createdDate.getMinutes()).padStart(2, '0');
    dateTimeStr = `${hours}:${mins} ${expectedDateFormatted}`;

    // Red warning if on Day 4 or later without result
    if (daysElapsed >= 4) {
      isWarning = true;
    }
  }

  return {
    dateTimeStr,
    expectedDateFormatted,
    isCompleted,
    isWarning,
    daysElapsed
  };
}

/**
 * Formats created date string into D/M/YYYY (e.g. 16/9/2026)
 */
export function formatCreatedDate(dateStr) {
  if (!dateStr) return '-';
  try {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      const day = d.getDate();
      const month = d.getMonth() + 1;
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (e) {}

  const cleanStr = String(dateStr).trim().split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const year = parts[0];
    return `${day}/${month}/${year}`;
  }
  return dateStr;
}

