import { ecoPackageHandler } from './packages/eco.js';
import { genet4PackageHandler } from './packages/genet4.js';
import { genet7PackageHandler } from './packages/genet7.js';
import { genet23PackageHandler } from './packages/genet23.js';
import { genetPlusPackageHandler } from './packages/plus.js';
import { twinsPackageHandler } from './packages/twins.js';
import { package20gaHandler } from './packages/20ga.js';
import { thalassemiaPackageHandler } from './packages/thalassemia.js';

const registry = {
  'GeneT Eco': ecoPackageHandler,
  'GeneT 4': genet4PackageHandler,
  'GENNI 4': genet4PackageHandler,
  'GeneT 7': genet7PackageHandler,
  'GeneT 23': genet23PackageHandler,
  'GeneT Plus': genetPlusPackageHandler,
  'NIPT Plus': genetPlusPackageHandler,
  'Plus 122': genetPlusPackageHandler,
  'GeneT Twins': twinsPackageHandler,
  'Twins': twinsPackageHandler,
  'Song thai': twinsPackageHandler,
  '20GA': package20gaHandler,
  'GeneT 20GA': package20gaHandler,
  '20GA - DNA': package20gaHandler,
  '20 Bệnh Gen Lặn': package20gaHandler,
  'Thalassemia': thalassemiaPackageHandler,
  'GeneT Thalassemia': thalassemiaPackageHandler,
  'Sàng lọc Thalassemia': thalassemiaPackageHandler,
  'Sàng lọc người mang gen Thalassemia': thalassemiaPackageHandler,
  'THALASSEMIA': thalassemiaPackageHandler,
  // Combo Packages (NIPT + 20GA)
  'GeneT 7 + 20GA': genet7PackageHandler,
  'GeneT 23 + 20GA': genet23PackageHandler,
  'GeneT Plus + 20GA': genetPlusPackageHandler,
  'GeneT Twins + 20GA': twinsPackageHandler,
};

export function getPackageHandler(packageType) {
  if (!packageType) return ecoPackageHandler;

  // 1. Direct registry lookup
  if (registry[packageType]) return registry[packageType];

  const norm = String(packageType).toLowerCase().replace(/\s+/g, '');

  // 2. Check Plus
  if (norm.includes('plus')) return genetPlusPackageHandler;

  // 3. Check Twins / Song thai
  if (norm.includes('twin') || norm.includes('songthai')) return twinsPackageHandler;

  // 4. Check 23
  if (norm.includes('23')) return genet23PackageHandler;

  // 5. Check 7
  if (norm.includes('7')) return genet7PackageHandler;

  // 6. Check 4
  if (norm.includes('4')) return genet4PackageHandler;

  // 7. Check 20GA
  if (norm.includes('20ga') || norm.includes('20benh')) return package20gaHandler;

  // 8. Check Thalassemia
  if (norm.includes('thal')) return thalassemiaPackageHandler;

  // 9. Check Eco
  if (norm.includes('eco')) return ecoPackageHandler;

  // 10. Fallback fuzzy match
  const key = Object.keys(registry).find(k => {
    const kNorm = k.toLowerCase().replace(/\s+/g, '');
    return kNorm.includes(norm) || norm.includes(kNorm);
  });

  return registry[key] || ecoPackageHandler;
}
