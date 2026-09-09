import { getPackageHandler } from './package-registry.js';
import { package20gaHandler } from './packages/20ga.js';
import { generateStandaloneSupplementaryReport } from './supplementary-report.js';

function toPlainObject(sampleData) {
  if (!sampleData) return {};
  if (typeof sampleData.toObject === 'function') {
    return sampleData.toObject();
  }
  if (sampleData._doc) {
    return { ...sampleData._doc };
  }
  return { ...sampleData };
}

export async function generateGeneTrustPdf(rawSampleData) {
  const sampleData = toPlainObject(rawSampleData);
  const handler = getPackageHandler(sampleData.packageType);
  // Return main NIPT PDF result directly (without merging supplementary report)
  return await handler.generatePdf(sampleData);
}

export async function generate20GAPdf(rawSampleData) {
  const sampleData = toPlainObject(rawSampleData);
  const sample20GA = {
    ...sampleData,
    results: (sampleData.results20GA && Object.keys(sampleData.results20GA).length > 0)
      ? sampleData.results20GA
      : ((sampleData.results && Object.keys(sampleData.results).length > 0 && (sampleData.packageType || '').toLowerCase().includes('20ga') && !sampleData.packageType.includes('+'))
          ? sampleData.results
          : package20gaHandler.getDefaultResults()),
    conclusion: sampleData.conclusion20GA || (sampleData.packageType === '20GA' ? sampleData.conclusion : 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.'),
  };
  return await package20gaHandler.generatePdf(sample20GA);
}

export async function generateSupplementaryPdf(rawSampleData) {
  const sampleData = toPlainObject(rawSampleData);
  return await generateStandaloneSupplementaryReport(sampleData);
}

