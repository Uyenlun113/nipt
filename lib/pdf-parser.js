import { getPackageHandler } from './package-registry';

export async function extractNiptPdfData(pdfBuffer, packageType = 'GeneT Eco') {
  const handler = getPackageHandler(packageType);
  return await handler.parsePdf(pdfBuffer);
}
