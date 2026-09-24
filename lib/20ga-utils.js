export function sync20GAResultsWithConclusion(results, conclusionStr) {
  if (!results || typeof results !== 'object') return {};
  const updatedResults = { ...results };
  if (!conclusionStr || typeof conclusionStr !== 'string') return updatedResults;

  const conc = conclusionStr.trim();
  const concLower = conc.toLowerCase();

  const isAllNormalConc = (concLower.includes('chưa phát hiện biến thể') || concLower.includes('chưa phát hiện đột biến')) &&
    !concLower.includes('phát hiện đột biến') &&
    !concLower.includes('dị hợp tử') &&
    !concLower.includes('đồng hợp tử');

  // Map of 20 recessive diseases with their genes and aliases:
  const diseaseGeneMap = [
    { key: 'disease_1', genes: ['HBA1', 'HBA2', 'Alpha-Thalassemia', 'Alpha Thalassemia'] },
    { key: 'disease_2', genes: ['HBB', 'Beta-Thalassemia', 'Beta Thalassemia'] },
    { key: 'disease_3', genes: ['G6PD', 'Thiếu men G6PD'] },
    { key: 'disease_4', genes: ['PAH', 'Phenyketon'] },
    { key: 'disease_5', genes: ['GALT', 'galactose'] },
    { key: 'disease_6', genes: ['SLC25A13', 'citrin'] },
    { key: 'disease_7', genes: ['SRD5A2', '5α-reductase', '5a-reductase'] },
    { key: 'disease_8', genes: ['GAA', 'Pompe'] },
    { key: 'disease_9', genes: ['ATP7B', 'Wilson'] },
    { key: 'disease_10', genes: ['CFTR', 'xơ nang'] },
    { key: 'disease_11', genes: ['GLA', 'Fabry'] },
    { key: 'disease_12', genes: ['ETFDH', 'Acyl-CoA'] },
    { key: 'disease_13', genes: ['PKHD1', 'thận đa nang'] },
    { key: 'disease_14', genes: ['CYP21A2', '21-hydroxylase'] },
    { key: 'disease_15', genes: ['ABCC8', 'Cường insulin'] },
    { key: 'disease_16', genes: ['SMN1', 'SMA', 'Teo cơ tủy'] },
    { key: 'disease_17', genes: ['GBA', 'Gaucher'] },
    { key: 'disease_18', genes: ['F8', 'Hemophilia'] },
    { key: 'disease_19', genes: ['TSHB', 'TSH'] },
    { key: 'disease_20', genes: ['CBS', 'homocysteine'] }
  ];

  diseaseGeneMap.forEach(({ key, genes }) => {
    const currentItem = updatedResults[key];
    let currentVal = typeof currentItem === 'object' ? (currentItem?.value || '') : (currentItem || '');
    currentVal = String(currentVal).trim();

    // Clean any existing long prefix like "Phát hiện đột biến dị hợp tử "
    if (currentVal.toLowerCase().includes('phát hiện đột biến')) {
      const cMatchCurrent = currentVal.match(/c\.[0-9]+[A-Za-z0-9_>+*\-\.]+(?:\s*\(p\.[^\)]+\))?/i);
      const isDiHopCur = /dị\s*hợp\s*tử/i.test(currentVal);
      const isDongHopCur = /đồng\s*hợp\s*tử/i.test(currentVal);
      const zygosityCur = isDongHopCur ? 'đồng hợp tử' : (isDiHopCur ? 'dị hợp tử' : '');

      if (cMatchCurrent) {
        currentVal = `${cMatchCurrent[0].trim()}${zygosityCur ? ' ' + zygosityCur : ''}`;
      } else {
        currentVal = currentVal.replace(/^Phát\s*hiện\s*(?:đột\s*biến|biến\s*thể)\s*(?:dị|đồng)?\s*hợp\s*tử\s*/i, '').trim();
      }
    }

    // Check if conclusion mentions any gene or disease alias for this item
    const matchedGene = genes.find(gene => new RegExp('(?:gen\\s*|bệnh\\s*)?' + gene.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&') + '\\b', 'i').test(conc));

    if (matchedGene && !isAllNormalConc) {
      let mutationVal = '';

      // Pattern 1: Match c.123... mutation notation in conclusion text
      const cMatch = conc.match(/c\.[0-9]+[A-Za-z0-9_>+*\-\.]+(?:\s*\(p\.[^\)]+\))?/i);

      // Check zygosity: dị hợp tử vs đồng hợp tử
      const isDiHop = /dị\s*hợp\s*tử/i.test(conc);
      const isDongHop = /đồng\s*hợp\s*tử/i.test(conc);
      const zygosity = isDongHop ? 'đồng hợp tử' : (isDiHop ? 'dị hợp tử' : '');

      if (cMatch) {
        mutationVal = `${cMatch[0].trim()}${zygosity ? ' ' + zygosity : ''}`;
      } else {
        // Pattern 2: Match general mutation descriptions ("Phát hiện đột biến...", "Mang gen...")
        const mGeneral = conc.match(/(?:Phát\s*hiện\s*đột\s*biến|Mang\s*gen|Biến\s*thể)[^\.\n\r,]+/i);
        if (mGeneral) {
          mutationVal = mGeneral[0].replace(/^Phát\s*hiện\s*(?:đột\s*biến|biến\s*thể)\s*/i, '').replace(/^Mang\s*gen\s*/i, '').trim();
          if (zygosity && !mutationVal.toLowerCase().includes('hợp tử')) {
            mutationVal += ` ${zygosity}`;
          }
        }
      }

      // If no new mutation parsed, but currentVal already has a non-default mutation, keep currentVal
      if (!mutationVal && currentVal && !currentVal.toLowerCase().includes('chưa phát hiện')) {
        mutationVal = currentVal;
      }

      if (mutationVal) {
        if (typeof currentItem === 'object' && currentItem !== null) {
          updatedResults[key] = { ...currentItem, value: mutationVal };
        } else {
          updatedResults[key] = mutationVal;
        }
      }
    } else if (isAllNormalConc) {
      // If conclusion explicitly states all normal, reset non-custom mutations
      const defaultNormal = 'Chưa phát hiện đột biến trong vùng được khảo sát';
      if (!currentVal || currentVal.toLowerCase().includes('chưa phát hiện')) {
        if (typeof currentItem === 'object' && currentItem !== null) {
          updatedResults[key] = { ...currentItem, value: defaultNormal };
        } else {
          updatedResults[key] = defaultNormal;
        }
      } else {
        if (typeof currentItem === 'object' && currentItem !== null) {
          updatedResults[key] = { ...currentItem, value: currentVal };
        } else {
          updatedResults[key] = currentVal;
        }
      }
    } else if (currentVal) {
      if (typeof currentItem === 'object' && currentItem !== null) {
        updatedResults[key] = { ...currentItem, value: currentVal };
      } else {
        updatedResults[key] = currentVal;
      }
    }
  });

  return updatedResults;
}
