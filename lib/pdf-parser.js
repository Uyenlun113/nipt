import { getPackageHandler } from './package-registry.js';

export function extractAdminInfoFromText(text) {
  // Phần thông tin hành chính được nhập tay trên giao diện, không tự động trích xuất từ PDF
  return {};
}

export async function extractNiptPdfData(pdfBuffer, packageType = 'GeneT Eco') {
  const handler = getPackageHandler(packageType);
  const result = await handler.parsePdf(pdfBuffer);
  return result;
}

