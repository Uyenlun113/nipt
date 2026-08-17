import { getPackageHandler } from './package-registry';
import { attachSupplementaryReport } from './supplementary-report';

export async function generateGeneTrustPdf(sampleData) {
  const handler = getPackageHandler(sampleData.packageType);
  const mainPdfBuffer = await handler.generatePdf(sampleData);
  return await attachSupplementaryReport(mainPdfBuffer, sampleData);
}

