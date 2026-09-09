import { ecoPackageHandler } from './packages/eco.js';
import { genet4PackageHandler } from './packages/genet4.js';
import { genet7PackageHandler } from './packages/genet7.js';
import { genet23PackageHandler } from './packages/genet23.js';
import { genetPlusPackageHandler } from './packages/plus.js';
import { twinsPackageHandler } from './packages/twins.js';
import { package20gaHandler } from './packages/20ga.js';

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
  // Combo Packages (NIPT + 20GA)
  'GeneT 7 + 20GA': genet7PackageHandler,
  'GeneT 23 + 20GA': genet23PackageHandler,
  'GeneT Plus + 20GA': genetPlusPackageHandler,
  'GeneT Twins + 20GA': twinsPackageHandler,
};

export function getPackageHandler(packageType) {
  if (!packageType) return ecoPackageHandler;
  const handler = registry[packageType];
  if (handler) return handler;

  // Fallback fuzzy match
  const key = Object.keys(registry).find(k => k.toLowerCase().includes(packageType.toLowerCase()));
  return registry[key] || ecoPackageHandler;
}
