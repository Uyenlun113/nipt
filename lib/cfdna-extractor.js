export function extractCfDnaFromText(text) {
  if (!text) return '';

  const isConcentrationUnit = (strAfter) => {
    return /^\s*(?:ng\/|ng\b|ug\/|pg\/|pM\b|nM\b|uL\b|µl\b)/i.test(strAfter);
  };

  // 1. Highest Priority: exact match for "cfDNA(%): 13.87" or "cfDNA (%): 13.87" or "Hàm lượng cfDNA (%): 13.87"
  const strictCfDnaPercentRegex = /(?:[c¢©e]?fDNA|cDNA|ctDNA|cf0NA|cfONA|Hàm\s*lượng\s*cfDNA|Nồng\s*độ\s*cfDNA|Tỷ\s*lệ\s*cfDNA)\s*\(\s*%\s*\)\s*[:=]?\s*(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,3})/gi;
  let match;
  while ((match = strictCfDnaPercentRegex.exec(text)) !== null) {
    const strAfter = text.slice(match.index + match[0].length);
    if (isConcentrationUnit(strAfter)) continue;

    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 2. Priority 2: Direct match with percent indicator or explicit keyword: "cfDNA(%): 13.87", "Fetal fraction: 13.87%"
  const priorityRegex = /(?:[c¢©e]?fDNA|cDNA|ctDNA|cf0NA|cfONA|Fetal\s*fraction|Fetal\s*cfDNA|Fetal\s*Fraction|FF)\s*(?:\(%?\)|%|percent|tự\s*do)?\s*[:=]?\s*(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,3})\s*%?/gi;
  while ((match = priorityRegex.exec(text)) !== null) {
    const matchStr = match[0];
    if (/\(\s*ng\//i.test(matchStr) || /\(\s*ug\//i.test(matchStr)) continue;

    const strAfter = text.slice(match.index + match[0].length);
    if (isConcentrationUnit(strAfter)) continue;

    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 3. Priority 3: "Hàm lượng cfDNA" or "Nồng độ cfDNA" or "Tỷ lệ cfDNA"
  const hamLuongRegex = /(?:Hàm\s*lượng\s*(?:[c¢©e]?fDNA|cfDNA)|Nồng\s*độ\s*(?:[c¢©e]?fDNA|cfDNA)|Tỷ\s*lệ\s*(?:[c¢©e]?fDNA|cfDNA))\s*(?:\([^)]*\)|%|percent)?\s*[:=]?\s*(?<![-0-9.])([0-9]{1,2}(?:\s*[.,]\s*[0-9]{1,3})?)\s*%?/gi;
  while ((match = hamLuongRegex.exec(text)) !== null) {
    const matchStr = match[0];
    if (/\(\s*ng\//i.test(matchStr) || /\(\s*ug\//i.test(matchStr)) continue;

    const strAfter = text.slice(match.index + match[0].length);
    if (isConcentrationUnit(strAfter)) continue;

    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 4. Priority 4: Match float percentage near cfDNA / Fetal keyword within 100 chars
  const cfDnaNearRegex = /(?:[c¢©e]?fDNA|cDNA|ctDNA|cf0NA|cfONA|Fetal|FF)[\s\S]{0,100}?(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,3})\s*%?/gi;
  while ((match = cfDnaNearRegex.exec(text)) !== null) {
    const strAfter = text.slice(match.index + match[0].length);
    if (isConcentrationUnit(strAfter)) continue;

    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 5. OCR Misrecognition Fixer for Scanned Image PDFs
  const ocrPattern = /(?:cfDNA|cDNA|ctDNA|cf0NA|cfONA)[^0-9\n]{0,25}([S$sB0-9][.,\s]*[0-9OoS$s][.,\s]*[0-9]{1,3})/gi;
  let ocrMatch;
  while ((ocrMatch = ocrPattern.exec(text)) !== null) {
    let rawStr = ocrMatch[1].toUpperCase()
      .replace(/S|\$/g, '8')
      .replace(/B/g, '8')
      .replace(/O/g, '0')
      .replace(/I|L/g, '1')
      .replace(/Z/g, '2')
      .replace(/\s+/g, '');

    const dec = rawStr.match(/([0-9]{1,2}[.,][0-9]{1,3})/);
    if (dec) {
      const val = parseFloat(dec[1].replace(',', '.'));
      if (val >= 0.5 && val <= 40) {
        return val.toString();
      }
    }
  }

  // 6. Line-by-line inspection looking ONLY for floats with decimals near cfDNA
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/(?:cfDNA|cDNA|ctDNA|cf0NA|cfONA|Fetal|FF)/i.test(line)) {
      if (/Library|Prep|Isolation|Kit|Reaction|DNBSEQ|MGISP/i.test(line)) {
        continue;
      }

      for (let offset = 0; offset <= 4 && (i + offset) < lines.length; offset++) {
        const targetLine = lines[i + offset];
        const decMatches = targetLine.matchAll(/(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,3})(?!\s*<|\s*>|\s*NST|\s*cặp|\s*hội\s*chứng)/g);
        for (const decMatch of decMatches) {
          const rawMatchStr = decMatch[0];
          const matchOffset = targetLine.indexOf(rawMatchStr);
          const afterText = targetLine.slice(matchOffset + rawMatchStr.length);
          if (isConcentrationUnit(afterText)) continue;

          const val = parseFloat(decMatch[1].replace(/\s+/g, '').replace(',', '.'));
          if (val >= 0.5 && val <= 40) {
            return val.toString();
          }
        }
      }
    }
  }

  return '';
}

