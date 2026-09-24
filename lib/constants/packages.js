export const PACKAGE_TYPES = {
  GENET_ECO: 'GeneT Eco',
  GENET_4: 'GeneT 4',
  GENET_7: 'GeneT 7',
  GENET_23: 'GeneT 23',
  GENET_PLUS: 'GeneT Plus',
  GENET_TWINS: 'GeneT Twins',
  GA_20: '20GA',
  THALASSEMIA: 'Thalassemia',

  // Combo Packages (NIPT + 20GA)
  COMBO_GENET_7: 'GeneT 7 + 20GA',
  COMBO_GENET_23: 'GeneT 23 + 20GA',
  COMBO_GENET_PLUS: 'GeneT Plus + 20GA',
  COMBO_GENET_TWINS: 'GeneT Twins + 20GA',
};

export function normalizePackageType(packageType) {
  if (!packageType) return PACKAGE_TYPES.GENET_ECO;

  const raw = String(packageType).trim();
  const lower = raw.toLowerCase().replace(/\s+/g, '');

  // 1. Combo packages
  if (lower.includes('+') || lower.includes('combo')) {
    if (lower.includes('plus')) return PACKAGE_TYPES.COMBO_GENET_PLUS;
    if (lower.includes('23')) return PACKAGE_TYPES.COMBO_GENET_23;
    if (lower.includes('7')) return PACKAGE_TYPES.COMBO_GENET_7;
    if (lower.includes('twin') || lower.includes('songthai')) return PACKAGE_TYPES.COMBO_GENET_TWINS;
    return PACKAGE_TYPES.COMBO_GENET_7;
  }

  // 2. Standalone packages
  if (lower.includes('plus')) return PACKAGE_TYPES.GENET_PLUS;
  if (lower.includes('twin') || lower.includes('songthai')) return PACKAGE_TYPES.GENET_TWINS;
  if (lower.includes('23')) return PACKAGE_TYPES.GENET_23;
  if (lower.includes('7')) return PACKAGE_TYPES.GENET_7;
  if (lower.includes('4') || lower.includes('genni')) return PACKAGE_TYPES.GENET_4;
  if (lower.includes('20ga') || lower.includes('20benh')) return PACKAGE_TYPES.GA_20;
  if (lower.includes('thal')) return PACKAGE_TYPES.THALASSEMIA;
  if (lower.includes('eco')) return PACKAGE_TYPES.GENET_ECO;

  return PACKAGE_TYPES.GENET_7;
}

export function getNiptSubPackageFromCombo(packageType) {
  const norm = normalizePackageType(packageType);
  switch (norm) {
    case PACKAGE_TYPES.COMBO_GENET_PLUS:
      return PACKAGE_TYPES.GENET_PLUS;
    case PACKAGE_TYPES.COMBO_GENET_23:
      return PACKAGE_TYPES.GENET_23;
    case PACKAGE_TYPES.COMBO_GENET_TWINS:
      return PACKAGE_TYPES.GENET_TWINS;
    case PACKAGE_TYPES.COMBO_GENET_7:
    default:
      return PACKAGE_TYPES.GENET_7;
  }
}
