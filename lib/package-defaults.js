import { MICRO_LIST } from './constants/micro-list.js';
import { PACKAGE_TYPES, normalizePackageType, getNiptSubPackageFromCombo } from './constants/packages.js';

export function getDefaultResultsForPackage(packageType) {
  const norm = normalizePackageType(packageType);
  const subPkg = norm.includes('+') ? getNiptSubPackageFromCombo(norm) : norm;

  if (subPkg === PACKAGE_TYPES.GENET_PLUS) {
    return {
      t21: { label: 'HC Down (Trisomy 21)', value: '', risk: '', ref: '-3 < Z < 3' },
      t18: { label: 'HC Edwards (Trisomy 18)', value: '', risk: '', ref: '-3 < Z < 3' },
      t13: { label: 'HC Patau (Trisomy 13)', value: '', risk: '', ref: '-3 < Z < 3' },

      turner: { label: 'HC Turner (45, XO)', value: '', risk: '', ref: '-3 < Z < 3' },
      klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: '', ref: '-3 < Z < 3' },
      jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: '', ref: '-3 < Z < 3' },
      tripleX: { label: 'HC Siêu nữ (47, XXX)', value: '', risk: '', ref: '-3 < Z < 3' },

      otherTrisomies: {
        t1: { label: 'Trisomy 1', value: '', risk: '', ref: '-3 < Z < 3' },
        t2: { label: 'Trisomy 2', value: '', risk: '', ref: '-3 < Z < 3' },
        t3: { label: 'Trisomy 3', value: '', risk: '', ref: '-3 < Z < 3' },
        t4: { label: 'Trisomy 4', value: '', risk: '', ref: '-3 < Z < 3' },
        t5: { label: 'Trisomy 5', value: '', risk: '', ref: '-3 < Z < 3' },
        t6: { label: 'Trisomy 6', value: '', risk: '', ref: '-3 < Z < 3' },
        t7: { label: 'Trisomy 7', value: '', risk: '', ref: '-3 < Z < 3' },
        t8: { label: 'Trisomy 8', value: '', risk: '', ref: '-3 < Z < 3' },
        t9: { label: 'Trisomy 9', value: '', risk: '', ref: '-3 < Z < 3' },
        t10: { label: 'Trisomy 10', value: '', risk: '', ref: '-3 < Z < 3' },
        t11: { label: 'Trisomy 11', value: '', risk: '', ref: '-3 < Z < 3' },
        t12: { label: 'Trisomy 12', value: '', risk: '', ref: '-3 < Z < 3' },
        t14: { label: 'Trisomy 14', value: '', risk: '', ref: '-3 < Z < 3' },
        t15: { label: 'Trisomy 15', value: '', risk: '', ref: '-3 < Z < 3' },
        t16: { label: 'Trisomy 16', value: '', risk: '', ref: '-3 < Z < 3' },
        t17: { label: 'Trisomy 17', value: '', risk: '', ref: '-3 < Z < 3' },
        t19: { label: 'Trisomy 19', value: '', risk: '', ref: '-3 < Z < 3' },
        t20: { label: 'Trisomy 20', value: '', risk: '', ref: '-3 < Z < 3' },
        t22: { label: 'Trisomy 22', value: '', risk: '', ref: '-3 < Z < 3' },
      },
      microdeletions: MICRO_LIST.map(item => ({
        name: item.name,
        ref: '< 5%',
        value: '0.00%',
        risk: 'Nguy cơ thấp',
        result: 'Không phát hiện'
      }))
    };
  }

  if (subPkg === PACKAGE_TYPES.GENET_23) {
    return {
      t21: { label: 'HC Down (Trisomy 21)', value: '', risk: '', ref: '-3 < Z < 3' },
      t18: { label: 'HC Edwards (Trisomy 18)', value: '', risk: '', ref: '-3 < Z < 3' },
      t13: { label: 'HC Patau (Trisomy 13)', value: '', risk: '', ref: '-3 < Z < 3' },

      turner: { label: 'HC Turner (45, XO)', value: '', risk: '', ref: '-3 < Z < 3' },
      klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: '', ref: '-3 < Z < 3' },
      jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: '', ref: '-3 < Z < 3' },
      tripleX: { label: 'HC Siêu nữ (47, XXX)', value: '', risk: '', ref: '-3 < Z < 3' },

      otherTrisomies: {
        t1: { label: 'Trisomy 1', value: '', risk: '', ref: '-3 < Z < 3' },
        t2: { label: 'Trisomy 2', value: '', risk: '', ref: '-3 < Z < 3' },
        t3: { label: 'Trisomy 3', value: '', risk: '', ref: '-3 < Z < 3' },
        t4: { label: 'Trisomy 4', value: '', risk: '', ref: '-3 < Z < 3' },
        t5: { label: 'Trisomy 5', value: '', risk: '', ref: '-3 < Z < 3' },
        t6: { label: 'Trisomy 6', value: '', risk: '', ref: '-3 < Z < 3' },
        t7: { label: 'Trisomy 7', value: '', risk: '', ref: '-3 < Z < 3' },
        t8: { label: 'Trisomy 8', value: '', risk: '', ref: '-3 < Z < 3' },
        t9: { label: 'Trisomy 9', value: '', risk: '', ref: '-3 < Z < 3' },
        t10: { label: 'Trisomy 10', value: '', risk: '', ref: '-3 < Z < 3' },
        t11: { label: 'Trisomy 11', value: '', risk: '', ref: '-3 < Z < 3' },
        t12: { label: 'Trisomy 12', value: '', risk: '', ref: '-3 < Z < 3' },
        t14: { label: 'Trisomy 14', value: '', risk: '', ref: '-3 < Z < 3' },
        t15: { label: 'Trisomy 15', value: '', risk: '', ref: '-3 < Z < 3' },
        t16: { label: 'Trisomy 16', value: '', risk: '', ref: '-3 < Z < 3' },
        t17: { label: 'Trisomy 17', value: '', risk: '', ref: '-3 < Z < 3' },
        t19: { label: 'Trisomy 19', value: '', risk: '', ref: '-3 < Z < 3' },
        t20: { label: 'Trisomy 20', value: '', risk: '', ref: '-3 < Z < 3' },
        t22: { label: 'Trisomy 22', value: '', risk: '', ref: '-3 < Z < 3' },
      }
    };
  }

  if (subPkg === PACKAGE_TYPES.GENET_TWINS) {
    return {
      t21: { label: 'HC Down (Trisomy 21)', value: '', risk: '', ref: '-3 < Z < 3' },
      t18: { label: 'HC Edwards (Trisomy 18)', value: '', risk: '', ref: '-3 < Z < 3' },
      t13: { label: 'HC Patau (Trisomy 13)', value: '', risk: '', ref: '-3 < Z < 3' }
    };
  }

  // Default GeneT 7 / GeneT 4 / GeneT Eco
  return {
    t21: { label: 'HC Down (Trisomy 21)', value: '', risk: '', ref: '-3 < Z < 3' },
    t18: { label: 'HC Edwards (Trisomy 18)', value: '', risk: '', ref: '-3 < Z < 3' },
    t13: { label: 'HC Patau (Trisomy 13)', value: '', risk: '', ref: '-3 < Z < 3' },

    turner: { label: 'HC Turner (45, XO)', value: '', risk: '', ref: '-3 < Z < 3' },
    klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: '', ref: '-3 < Z < 3' },
    jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: '', ref: '-3 < Z < 3' },
    tripleX: { label: 'HC Siêu nữ (47, XXX)', value: '', risk: '', ref: '-3 < Z < 3' }
  };
}
