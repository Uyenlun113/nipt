export function extractCfDnaFromText(text) {
  if (!text) return '';

  const lines = text.split('\n');

  // 1. First pass: look specifically for cfDNA / cDNA / CDNA lines
  for (const line of lines) {
    if (/(?:cfDNA|cDNA|CDNA|Hàm\s*lượng\s*cfDNA)/i.test(line)) {
      // Exclude generic kit / equipment names
      if (/Library|Prep|Isolation|Kit|Reaction|DNBSEQ|MGISP/i.test(line)) {
        continue;
      }

      // Match decimal numbers like 10.47 or 10,47
      const decMatch = line.match(/([0-9]{1,2}[.,][0-9]{1,2})/);
      if (decMatch) {
        const val = parseFloat(decMatch[1].replace(',', '.'));
        if (val > 0 && val <= 40) {
          return val.toString();
        }
      }

      // Match 3 or 4 digits without decimal point (e.g. 1047 from OCR reading 10.47)
      const intMatch = line.match(/([0-9]{3,4})/);
      if (intMatch) {
        const rawInt = parseInt(intMatch[1], 10);
        if (rawInt >= 200 && rawInt <= 4500) {
          return (rawInt / 100).toFixed(2);
        }
      }
    }
  }

  // 2. Second pass: match cfDNA(%): 10.47 or CDNA): 1047 anywhere in full text
  const match = text.match(/(?:cfDNA|cDNA|CDNA)[^0-9\n]*([0-9]{1,2}[.,][0-9]{1,2}|[0-9]{3,4})/i);
  if (match) {
    const rawVal = match[1].replace(',', '.');
    const num = parseFloat(rawVal);
    if (num > 0 && num <= 40) {
      return num.toString();
    }
    if (num >= 200 && num <= 4500) {
      return (num / 100).toFixed(2);
    }
  }

  return '';
}
