export function extractCfDnaFromText(text) {
  if (!text) return '';

  // 1. Direct Global Regex Match across entire text
  // Matches "cfDNA(%): 8.84", "cfDNA (%): 8,84", "Hàm lượng cfDNA (%): 10.47"
  const cfDnaRegex = /(?:cfDNA|cDNA|CDNA|Hàm\s*lượng\s*cfDNA|Hàm\s*lượng)\s*(?:\([^)]*\))?\s*:?\s*([0-9]{1,2}[.,][0-9]{1,2})/gi;
  let match;
  while ((match = cfDnaRegex.exec(text)) !== null) {
    const rawNum = match[1].replace(',', '.');
    const num = parseFloat(rawNum);
    if (num >= 0.5 && num <= 40) {
      return num.toString();
    }
  }

  // 2. Line-by-line inspection (handles when cfDNA label and value are on adjacent lines in PDF text stream)
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (/(?:cfDNA|cDNA|CDNA|Hàm\s*lượng\s*cfDNA|Hàm\s*lượng)/i.test(line)) {
      if (/Library|Prep|Isolation|Kit|Reaction|DNBSEQ|MGISP/i.test(line)) {
        continue;
      }

      for (let offset = 0; offset <= 2 && (i + offset) < lines.length; offset++) {
        const targetLine = lines[i + offset];
        const decMatch = targetLine.match(/([0-9]{1,2}[.,][0-9]{1,2})/);
        if (decMatch) {
          const val = parseFloat(decMatch[1].replace(',', '.'));
          if (val >= 0.5 && val <= 40) {
            return val.toString();
          }
        }
      }
    }
  }

  // 3. Fallback: Search within the 'Kết quả' / 'QC: Passed' table block
  const ketQuaIndex = text.search(/Kết\s*quả\s*:/i);
  if (ketQuaIndex !== -1) {
    const tableSnippet = text.slice(ketQuaIndex, ketQuaIndex + 350);
    const decMatches = tableSnippet.matchAll(/([0-9]{1,2}[.,][0-9]{1,2})/g);
    for (const m of decMatches) {
      const val = parseFloat(m[1].replace(',', '.'));
      if (val >= 0.5 && val <= 40) {
        return val.toString();
      }
    }
  }

  // 4. Fallback for 3-4 digit OCR integers (e.g. 884 or 1047 without decimal point)
  const intRegex = /(?:cfDNA|cDNA|CDNA|Hàm\s*lượng\s*cfDNA)[^0-9]*([0-9]{3,4})/gi;
  while ((match = intRegex.exec(text)) !== null) {
    const rawInt = parseInt(match[1], 10);
    if (rawInt >= 200 && rawInt <= 4000) {
      return (rawInt / 100).toFixed(2);
    }
  }

  return '';
}
