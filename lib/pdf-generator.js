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
  const pkgType = (sampleData.packageType || '').toUpperCase();
  const isSingle20GA = pkgType === '20GA' || (pkgType.includes('20GA') && !pkgType.includes('+'));

  const activeConclusion = isSingle20GA
    ? (sampleData.conclusion !== undefined && sampleData.conclusion !== null && sampleData.conclusion !== '' ? sampleData.conclusion : (sampleData.conclusion20GA || 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.'))
    : (sampleData.conclusion20GA !== undefined && sampleData.conclusion20GA !== null && sampleData.conclusion20GA !== '' ? sampleData.conclusion20GA : (sampleData.conclusion || 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.'));

  const sample20GA = {
    ...sampleData,
    results: (sampleData.results20GA && Object.keys(sampleData.results20GA).length > 0)
      ? sampleData.results20GA
      : ((sampleData.results && Object.keys(sampleData.results).length > 0)
          ? sampleData.results
          : package20gaHandler.getDefaultResults()),
    conclusion: activeConclusion,
    conclusion20GA: activeConclusion,
  };
  return await package20gaHandler.generatePdf(sample20GA);
}

export async function generateSupplementaryPdf(rawSampleData) {
  const sampleData = toPlainObject(rawSampleData);
  return await generateStandaloneSupplementaryReport(sampleData);
}

