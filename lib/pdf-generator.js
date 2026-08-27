import { getPackageHandler } from './package-registry.js';
import { generateStandaloneSupplementaryReport } from './supplementary-report.js';

export async function generateGeneTrustPdf(sampleData) {
  const handler = getPackageHandler(sampleData.packageType);
  // Return main NIPT PDF result directly (without merging supplementary report)
  return await handler.generatePdf(sampleData);
}

export async function generateSupplementaryPdf(sampleData) {
  return await generateStandaloneSupplementaryReport(sampleData);
}
