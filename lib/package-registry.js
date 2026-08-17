import { ecoPackageHandler } from './packages/eco';
import { genet4PackageHandler } from './packages/genet4';
import { genet7PackageHandler } from './packages/genet7';
import { genet23PackageHandler } from './packages/genet23';
import { genetPlusPackageHandler } from './packages/plus';
import { twinsPackageHandler } from './packages/twins';

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
};

export function getPackageHandler(packageType) {
  if (!packageType) return ecoPackageHandler;
  const handler = registry[packageType];
  if (handler) return handler;

  // Fallback fuzzy match
  const key = Object.keys(registry).find(k => k.toLowerCase().includes(packageType.toLowerCase()));
  return registry[key] || ecoPackageHandler;
}
