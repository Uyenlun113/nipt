export function extractCfDnaFromText(text) {
  if (!text) return '';

  // 1. Direct exact regex for "cfDNA(%): 8.84" or "cfDNA (%): 8,84" or "Hàm lượng cfDNA: 10.47"
  const directRegex = /(?:cfDNA|cDNA|CDNA|ctDNA|cf0NA|cfONA|Hàm\s*lượng\s*cfDNA|Hàm\s*lượng)\s*(?:\([^)]*\)|%|percent)?\s*:?\s*(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,2})(?![0-9])/gi;

  let match;
  while ((match = directRegex.exec(text)) !== null) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 2. Match "cfDNA" followed within 80 chars by a positive 2-decimal number
  const cfDnaNearRegex = /(?:cfDNA|cDNA|CDNA|ctDNA|cf0NA|cfONA|Hàm\s*lượng\s*cfDNA)[\s\S]{0,80}?(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,2})(?![0-9])/gi;
  while ((match = cfDnaNearRegex.exec(text)) !== null) {
    const rawNum = match[1].replace(/\s+/g, '').replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 3. OCR Misrecognition Fixer for Scanned Image PDFs
  // Handles Tesseract OCR reading "cfDNA(%): 8.84" as "CDNA): S04" or "cfDNA: S.84" or "cfDNA: S04"
  const ocrPattern = /(?:cfDNA|cDNA|CDNA|ctDNA|cf0NA|cfONA|Hàm\s*lượng\s*cfDNA)[^0-9\n]{0,20}([S$sB0-9][.,\s]*[0-9OoS$s][.,\s]*[0-9])/gi;
  let ocrMatch;
  while ((ocrMatch = ocrPattern.exec(text)) !== null) {
    let rawStr = ocrMatch[1].toUpperCase()
      .replace(/S|\$/g, '8')
      .replace(/B/g, '8')
      .replace(/O/g, '0')
      .replace(/I|L/g, '1')
      .replace(/Z/g, '2')
      .replace(/\s+/g, '');

    const dec = rawStr.match(/([0-9]{1,2}[.,][0-9]{1,2})/);
    if (dec) {
      const val = parseFloat(dec[1].replace(',', '.'));
      if (val >= 0.5 && val <= 40) {
        return val.toString();
      }
    }

    const numOnly = rawStr.replace(/[^0-9]/g, '');
    if (numOnly.length === 3 || numOnly.length === 4) {
      const rawInt = parseInt(numOnly, 10);
      if (rawInt >= 200 && rawInt <= 4000) {
        return (rawInt / 100).toFixed(2);
      }
    }
  }

  // 4. Line-by-line inspection
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/(?:cfDNA|cDNA|CDNA|ctDNA|cf0NA|cfONA|Hàm\s*lượng\s*cfDNA)/i.test(line)) {
      if (/Library|Prep|Isolation|Kit|Reaction|DNBSEQ|MGISP/i.test(line)) {
        continue;
      }

      for (let offset = 0; offset <= 3 && (i + offset) < lines.length; offset++) {
        const targetLine = lines[i + offset];
        const decMatches = targetLine.matchAll(/(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,2})(?![0-9])/g);
        for (const decMatch of decMatches) {
          const val = parseFloat(decMatch[1].replace(/\s+/g, '').replace(',', '.'));
          if (val >= 0.5 && val <= 40) {
            return val.toString();
          }
        }
      }
    }
  }

  // 5. Fallback: Search within the 'Kết quả' / 'QC: Passed' table block
  const ketQuaIndex = text.search(/Kết\s*quả/i);
  if (ketQuaIndex !== -1) {
    const tableSnippet = text.slice(ketQuaIndex, ketQuaIndex + 300);
    const decMatches = tableSnippet.matchAll(/(?<![-0-9.])([0-9]{1,2}\s*[.,]\s*[0-9]{1,2})(?![0-9])/g);
    for (const m of decMatches) {
      const val = parseFloat(m[1].replace(/\s+/g, '').replace(',', '.'));
      if (val >= 0.5 && val <= 40) {
        return val.toString();
      }
    }
  }

  return '';
}
