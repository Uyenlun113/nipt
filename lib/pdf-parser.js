import { getPackageHandler } from './package-registry.js';
import pdfParse from 'pdf-parse';
import { extractTextWithOcrIfNeeded } from './ocr-helper.js';
import { genetPlusPackageHandler } from './packages/plus.js';
import { genet23PackageHandler } from './packages/genet23.js';
import { genet7PackageHandler } from './packages/genet7.js';
import { genet4PackageHandler } from './packages/genet4.js';
import { ecoPackageHandler } from './packages/eco.js';
import { twinsPackageHandler } from './packages/twins.js';

export function extractAdminInfoFromText(text) {
  // Phần thông tin hành chính được nhập tay trên giao diện, không tự động trích xuất từ PDF
  return {};
}

export async function extractNiptPdfData(pdfBuffer, packageType = 'GeneT Eco') {
  let handler = getPackageHandler(packageType);

  try {
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text || '';
    const text = await extractTextWithOcrIfNeeded(pdfBuffer, rawText);

    // Auto-detect package type from PDF content
    if (/Plus|122\s*hội\s*chứng|19\s*Lệch\s*bội|vi\s*mất|lặp\s*đoạn/i.test(text)) {
      handler = genetPlusPackageHandler;
    } else if (/23\s*cặp|GeneT\s*23|23\s*Lệch\s*bội|NIPTTOTAL|NIPT\s*TOTAL|Lệch\s*bội\s*NST\s*khác/i.test(text)) {
      if (packageType.toLowerCase().includes('plus')) {
        handler = genetPlusPackageHandler;
      } else {
        handler = genet23PackageHandler;
      }
    } else if (/Twins|Song\s*thai/i.test(text)) {
      handler = twinsPackageHandler;
    } else if (/7\s*cặp|GeneT\s*7/i.test(text)) {
      handler = genet7PackageHandler;
    } else if (/4\s*cặp|GeneT\s*4|GENNI\s*4/i.test(text)) {
      handler = genet4PackageHandler;
    }
  } catch (err) {
    console.warn('PDF content auto-detection warning:', err?.message);
  }

  const result = await handler.parsePdf(pdfBuffer);
  return result;
}
