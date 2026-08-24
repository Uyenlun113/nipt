/**
 * Utility functions for Barcode / Sample Code standardization
 */

/**
 * Returns package prefix mapping
 * @param {string} packageType 
 * @returns {string}
 */
export function getPackagePrefix(packageType = '') {
  const pkg = (packageType || '').toLowerCase();
  if (pkg.includes('20ga') || pkg.includes('20')) return '20GA';
  if (pkg.includes('eco')) return 'ECO';
  if (pkg.includes('4') || pkg.includes('genni')) return 'GT4';
  if (pkg.includes('7')) return 'GT7';
  if (pkg.includes('23')) return 'GT23';
  if (pkg.includes('plus')) return 'PLUS';
  if (pkg.includes('twin')) return 'TWIN';
  return 'GT7';
}

/**
 * Generates the next sequential Barcode for a given package based on existing codes list.
 * Format: [PREFIX]-[6 DIGITS] starting from 000001 (e.g., GT7-000001, GT7-000002)
 * @param {string} packageType 
 * @param {Array<string>} existingCodes 
 * @returns {string}
 */
export function generateNextSequentialBarcode(packageType = 'GeneT 7', existingCodes = []) {
  const prefix = getPackagePrefix(packageType);
  const regex = new RegExp(`^${prefix}-(\\d+)$`, 'i');

  let maxNum = 0;
  if (Array.isArray(existingCodes)) {
    existingCodes.forEach((code) => {
      if (!code) return;
      const match = String(code).trim().match(regex);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    });
  }

  let nextNum = maxNum + 1;
  const existingSet = new Set((existingCodes || []).map((c) => String(c).trim().toUpperCase()));

  let candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
  while (existingSet.has(candidate)) {
    nextNum += 1;
    candidate = `${prefix}-${String(nextNum).padStart(6, '0')}`;
  }

  return candidate;
}

/**
 * Legacy/Fallback barcode generator
 */
export function generateBarcodeByPackage(packageType = 'GeneT 7') {
  const prefix = getPackagePrefix(packageType);
  return `${prefix}-000001`;
}

/**
 * Cleans and formats raw Barcode input:
 * - Uppercases text
 * - Removes illegal special characters
 * - Replaces spaces/underscores with hyphens
 * @param {string} rawCode 
 * @returns {string}
 */
export function cleanAndFormatBarcode(rawCode = '') {
  if (!rawCode) return '';
  let cleaned = rawCode.trim().toUpperCase();
  // Replace spaces or multiple hyphens/underscores with single hyphen
  cleaned = cleaned.replace(/[\s_]+/g, '-');
  // Remove any character that isn't uppercase alphanumeric or hyphen
  cleaned = cleaned.replace(/[^A-Z0-9-]/g, '');
  return cleaned;
}
