import fs from 'fs';
import path from 'path';

const fileCache = new Map();

/**
 * Reads and caches a file buffer in RAM.
 * @param {string} filePath Absolute or relative path to file
 * @returns {Buffer}
 */
export function getCachedFileBuffer(filePath) {
  const normalizedPath = path.resolve(filePath);
  if (fileCache.has(normalizedPath)) {
    return fileCache.get(normalizedPath);
  }

  if (!fs.existsSync(normalizedPath)) {
    throw new Error(`File not found: ${normalizedPath}`);
  }

  const buffer = fs.readFileSync(normalizedPath);
  fileCache.set(normalizedPath, buffer);
  return buffer;
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

