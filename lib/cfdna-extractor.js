export function extractCfDnaFromText(text) {
  if (!text) return '';

  // 1. Priority 1: Direct exact match for "cfDNA(%): 13.87" or "cfDNA (%): 13,87" or "Fetal fraction: 13.87%"
  const priorityRegex = /(?:cfDNA|cDNA|ctDNA|cf0NA|cfONA|Fetal\s*fraction|Fetal\s*cfDNA|Fetal\s*Fraction|FF)\s*(?:\([^)]*\)|%|percent|tự\s*do)?\s*[:=]?\s*(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,3})\s*%?/gi;

  let match;
  while ((match = priorityRegex.exec(text)) !== null) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 2. Priority 2: "Hàm lượng cfDNA" or "Nồng độ cfDNA" or "Tỷ lệ cfDNA"
  const hamLuongRegex = /(?:Hàm\s*lượng\s*cfDNA|Nồng\s*độ\s*cfDNA|Tỷ\s*lệ\s*cfDNA)\s*(?:\([^)]*\)|%|percent)?\s*[:=]?\s*(?<![-0-9.])([0-9]{1,2}(?:\s*[.,]\s*[0-9]{1,3})?)\s*%?/gi;
  while ((match = hamLuongRegex.exec(text)) !== null) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 3. Priority 3: Match float percentage near cfDNA / Fetal keyword within 100 chars
  const cfDnaNearRegex = /(?:cfDNA|cDNA|ctDNA|cf0NA|cfONA|Fetal|FF)[\s\S]{0,100}?(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,3})\s*%?/gi;
  while ((match = cfDnaNearRegex.exec(text)) !== null) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 4. OCR Misrecognition Fixer for Scanned Image PDFs
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

  // 5. Line-by-line inspection looking ONLY for floats with decimals near cfDNA
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

