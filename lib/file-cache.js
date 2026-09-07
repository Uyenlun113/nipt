import fs from 'fs';
import path from 'path';

const fileCache = new Map();

/**
 * Reads and caches a file buffer in RAM, checking mtime for automatic cache invalidation when modified.
 * @param {string} filePath Absolute or relative path to file
 * @returns {Buffer}
 */
export function getCachedFileBuffer(filePath) {
  const normalizedPath = path.resolve(filePath);

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }

  const stat = fs.statSync(normalizedPath);
  const cached = fileCache.get(normalizedPath);

  if (cached && cached.mtime === stat.mtimeMs) {
    return cached.buffer;
  }

  const buffer = fs.readFileSync(normalizedPath);
  fileCache.set(normalizedPath, { buffer, mtime: stat.mtimeMs });
  return buffer;
}

/**
 * Clears file cache completely.
 */
export function clearFileCache() {
  fileCache.clear();
}

/**
 * Returns cached font bytes for Arial and Arial Bold.
 */
export function getCachedFontBytes() {
  const fontPath = path.join(process.cwd(), 'fonts', 'arial.ttf');
  const fontBoldPath = path.join(process.cwd(), 'fonts', 'arialbd.ttf');

  return {
    fontBytes: getCachedFileBuffer(fontPath),
    fontBoldBytes: getCachedFileBuffer(fontBoldPath),
  };
}

/**
 * Returns cached PDF template buffer.
 * @param {string} templateFileName
 * @param {string} fallbackFileName
 */
export function getCachedPdfTemplate(templateFileName, fallbackFileName = 'GeneT_Eco.pdf') {
  const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
  let templatePath = path.join(phoiDir, templateFileName);
  if (!fs.existsSync(templatePath)) {
    templatePath = path.join(phoiDir, fallbackFileName);
  }
  return getCachedFileBuffer(templatePath);
}

/**
 * Returns cached MST company stamp image buffer.
 */
export function getCachedMstStampBytes() {
  const stampPath = path.join(process.cwd(), 'MST GT.png');
  return getCachedFileBuffer(stampPath);
}

/**
 * Returns cached director signature image buffer based on directorName.
 * If name contains Huệ / Hue, returns chu_ki_hue.png
 * If name contains Phong, returns chu_ki_phong.png
 */
export function getCachedDirectorSignatureBytes(directorName) {
  if (!directorName) return null;
  const nameLower = String(directorName).toLowerCase();

  let fileName = null;
  if (nameLower.includes('huệ') || nameLower.includes('hue')) {
    fileName = 'chu_ki_hue.png';
  } else if (nameLower.includes('phong')) {
    fileName = 'chu_ki_phong.png';
  }

  if (!fileName) return null;
  const sigPath = path.join(process.cwd(), 'public', fileName);
  if (fs.existsSync(sigPath)) {
    return getCachedFileBuffer(sigPath);
  }
  return null;
}

/**
 * Returns cached checker (kiểm soát kết quả) signature image buffer.
 */
export function getCachedCheckerSignatureBytes() {
  const sigPath = path.join(process.cwd(), 'public', 'kiem_soat_ket_qua.png');
  if (fs.existsSync(sigPath)) {
    return getCachedFileBuffer(sigPath);
  }
  return null;
}

