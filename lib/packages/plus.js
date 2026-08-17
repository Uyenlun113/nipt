import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParse from 'pdf-parse';
import { extractGbsResultFromText } from '../gbs-extractor.js';

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const parts = dateStr.split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return dateStr;
}

const MICRO_LIST = [
  // Page 2 (8 items)
  { name: "Chromosome 2q duplication", pageIdx: 1, y: 252.6, ref: "< 5 %" },
  { name: "Chromosome 2q24 deletion syndrome", pageIdx: 1, y: 230.5, ref: "< 5 %" },
  { name: "Split - hand/foot malformation 5", pageIdx: 1, y: 208.4, ref: "< 5 %" },
  { name: "Chromosome 2q35 duplication syndrome", pageIdx: 1, y: 181.0, ref: "< 5 %" },
  { name: "Holoprosencephaly 6", pageIdx: 1, y: 153.9, ref: "< 5 %" },
  { name: "Distal duplication of chromosome 3p", pageIdx: 1, y: 131.6, ref: "< 5 %" },
  { name: "Chromosome 3q duplication", pageIdx: 1, y: 109.5, ref: "< 5 %" },
  { name: "Dandy - Walker syndrome", pageIdx: 1, y: 87.4, ref: "< 5 %" },

  // Page 3 (31 items)
  { name: "Chromosome 4p duplication", pageIdx: 2, y: 761.3, ref: "< 5 %" },
  { name: "Distal deletion of chromosome 4q", pageIdx: 2, y: 739.2, ref: "< 5 %" },
  { name: "Distal duplication of chromosome 4q", pageIdx: 2, y: 717.1, ref: "< 5 %" },
  { name: "Chromosome 4q21 deletion syndrome", pageIdx: 2, y: 695.0, ref: "< 5 %" },
  { name: "Chromosome 5p duplication", pageIdx: 2, y: 672.9, ref: "< 5 %" },
  { name: "Chromosome 5p13 duplication", pageIdx: 2, y: 650.8, ref: "< 5 %" },
  { name: "Chromosome 5q14.3 deletion syndrome", pageIdx: 2, y: 628.8, ref: "< 5 %" },
  { name: "Chromosome 5q23 deletion syndrome", pageIdx: 2, y: 606.4, ref: "< 5 %" },
  { name: "Chromosome 6p deletion", pageIdx: 2, y: 584.3, ref: "< 5 %" },
  { name: "Chromosome 7q deletion", pageIdx: 2, y: 562.3, ref: "< 5 %" },
  { name: "Chromosome 7q31 deletion syndrome", pageIdx: 2, y: 540.2, ref: "< 5 %" },
  { name: "Chromosome 8p duplication", pageIdx: 2, y: 518.1, ref: "< 5 %" },
  { name: "Chromosome 8q duplication", pageIdx: 2, y: 496.0, ref: "< 5 %" },
  { name: "Chromosome 9p duplication", pageIdx: 2, y: 473.9, ref: "< 5 %" },
  { name: "Chromosome 9p deletion syndrome", pageIdx: 2, y: 451.8, ref: "< 5 %" },
  { name: "Chromosome 10p duplication", pageIdx: 2, y: 429.7, ref: "< 5 %" },
  { name: "Chromosome 10q22.3 - q23.3 duplication syndrome", pageIdx: 2, y: 402.4, ref: "< 5 %" },
  { name: "Chromosome 10q26 deletion syndrome", pageIdx: 2, y: 375.2, ref: "< 5 %" },
  { name: "WAGRO syndrome", pageIdx: 2, y: 353.1, ref: "< 5 %" },
  { name: "Jacobsen syndrome", pageIdx: 2, y: 330.8, ref: "< 5 %" },
  { name: "Chromosome 12p duplication", pageIdx: 2, y: 308.7, ref: "< 5 %" },
  { name: "Chromosome 13q14 deletion", pageIdx: 2, y: 286.7, ref: "< 5 %" },
  { name: "Chromosome 14q duplication", pageIdx: 2, y: 264.6, ref: "< 5 %" },
  { name: "Proximal deletion of chromosome 14q", pageIdx: 2, y: 242.5, ref: "< 5 %" },
  { name: "Chromosome 14q32 duplication", pageIdx: 2, y: 220.4, ref: "< 5 %" },
  { name: "Chromosome 15q25 deletion syndrome", pageIdx: 2, y: 198.3, ref: "< 5 %" },
  { name: "Distal deletion of chromosome 15q", pageIdx: 2, y: 176.2, ref: "< 5 %" },
  { name: "Levy - Shanske syndrome", pageIdx: 2, y: 154.1, ref: "< 5 %" },
  { name: "Chromosome 16p deletion syndrome", pageIdx: 2, y: 132.1, ref: "< 5 %" },
  { name: "Proximal duplication of chromosome 16q", pageIdx: 2, y: 104.7, ref: "< 5 %" },
  { name: "Chromosome 17p duplication", pageIdx: 2, y: 77.3, ref: "< 5 %" },

  // Page 4 (27 items)
  { name: "Chromosome 18p deletion syndrome", pageIdx: 3, y: 761.3, ref: "< 5 %" },
  { name: "Chromosome 18q deletion syndrome", pageIdx: 3, y: 739.2, ref: "< 5 %" },
  { name: "Chromosome 20p duplication", pageIdx: 3, y: 717.1, ref: "< 5 %" },
  { name: "Cat - Eye syndrome", pageIdx: 3, y: 695.0, ref: "< 5 %" },
  { name: "Chromosome 1p36 deletion syndrome", pageIdx: 3, y: 672.9, ref: "< 7 %" },
  { name: "Cri - du - chat syndrome", pageIdx: 3, y: 650.8, ref: "< 7 %" },
  { name: "DiGeorge syndrome 2", pageIdx: 3, y: 628.8, ref: "< 7 %" },
  { name: "Chromosome 1p31 duplication syndrome", pageIdx: 3, y: 580.5, ref: "< 7 %" },
  { name: "Chromosome 1p21.3 deletion syndrome", pageIdx: 3, y: 553.1, ref: "< 7 %" },
  { name: "Chromosome 2p16.1 - p15 deletion syndrome", pageIdx: 3, y: 525.7, ref: "< 7 %" },
  { name: "Chromosome 2q31.1 duplication syndrome", pageIdx: 3, y: 493.3, ref: "< 7 %" },
  { name: "Chromosome 2q33.1 deletion syndrome", pageIdx: 3, y: 466.2, ref: "< 7 %" },
  { name: "Chromosome 3q13.31 deletion syndrome", pageIdx: 3, y: 443.9, ref: "< 7 %" },
  { name: "Chromosome 3q29 duplication syndrome", pageIdx: 3, y: 416.8, ref: "< 7 %" },
  { name: "Chromosome 3q29 deletion syndrome", pageIdx: 3, y: 389.4, ref: "< 7 %" },
  { name: "Wolf - Hirschhorn syndrome", pageIdx: 3, y: 367.3, ref: "< 7 %" },
  { name: "Chromosome 4q32.1 - q32.2 triplication syndrome", pageIdx: 3, y: 339.9, ref: "< 7 %" },
  { name: "Chromosome 5q12 deletion syndrome", pageIdx: 3, y: 312.8, ref: "< 7 %" },
  { name: "CHDM", pageIdx: 3, y: 290.7, ref: "< 7 %" },
  { name: "Chromosome 7q11.23 deletion syndrome", pageIdx: 3, y: 268.7, ref: "< 7 %" },
  { name: "Chromosome 7q11.23 duplication syndrome", pageIdx: 3, y: 241.3, ref: "< 7 %" },
  { name: "Chromosome 8p23.1 deletion syndrome", pageIdx: 3, y: 213.9, ref: "< 7 %" },
  { name: "Chromosome 8p23.1 duplication syndrome", pageIdx: 3, y: 186.8, ref: "< 7 %" },
  { name: "Chromosome 8q22.1 duplication syndrome", pageIdx: 3, y: 154.4, ref: "< 7 %" },
  { name: "Chromosome 8q22.1 deletion syndrome", pageIdx: 3, y: 127.0, ref: "< 7 %" },
  { name: "Langer - Giedion syndrome", pageIdx: 3, y: 104.9, ref: "< 7 %" },
  { name: "Chromosome 8q24.3 deletion syndrome", pageIdx: 3, y: 82.8, ref: "< 7 %" },

  // Page 5 (28 items)
  { name: "WAGR syndrome", pageIdx: 4, y: 761.3, ref: "< 7 %" },
  { name: "Potocki - Shaffer syndrome", pageIdx: 4, y: 739.2, ref: "< 7 %" },
  { name: "Chromosome 11q22.2 - q22.3 deletion syndrome", pageIdx: 4, y: 711.8, ref: "< 7 %" },
  { name: "Chromosome 12p12.1 deletion syndrome", pageIdx: 4, y: 684.7, ref: "< 7 %" },
  { name: "Chromosome 12q14 microdeletion syndrome", pageIdx: 4, y: 658.0, ref: "< 7 %" },
  { name: "Distal deletion of chromosome", pageIdx: 4, y: 631.2, ref: "< 7 %" },
  { name: "Frias syndrome", pageIdx: 4, y: 609.1, ref: "< 7 %" },
  { name: "Prader - Willi syndrome", pageIdx: 4, y: 587.0, ref: "< 7 %" },
  { name: "Angelman syndrome", pageIdx: 4, y: 564.9, ref: "< 7 %" },
  { name: "Chromosome 15q24 deletion syndrome", pageIdx: 4, y: 542.8, ref: "< 7 %" },
  { name: "Chromosome 15q14 deletion syndrome", pageIdx: 4, y: 520.7, ref: "< 7 %" },
  { name: "HCD", pageIdx: 4, y: 498.6, ref: "< 7 %" },
  { name: "Chromosome 16p13.3 deletion syndrome", pageIdx: 4, y: 476.5, ref: "< 7 %" },
  { name: "Chromosome 16p12.2 - p11.2 microduplication syndrome", pageIdx: 4, y: 449.2, ref: "< 7 %" },
  { name: "Chromosome 16p12.2 - p11.2 deletion syndrome", pageIdx: 4, y: 416.8, ref: "< 7 %" },
  { name: "Chromosome 16q22 deletion syndrome", pageIdx: 4, y: 389.4, ref: "< 7 %" },
  { name: "Chromosome 17p13.3 deletion syndrome", pageIdx: 4, y: 367.3, ref: "< 7 %" },
  { name: "Chromosome 17p13.3 duplication syndrome", pageIdx: 4, y: 340.2, ref: "< 7 %" },
  { name: "Smith - Magenis syndrome", pageIdx: 4, y: 312.8, ref: "< 7 %" },
  { name: "Potocki - Lupski syndrome", pageIdx: 4, y: 290.7, ref: "< 7 %" },
  { name: "Chromosome 17q12 deletion syndrome", pageIdx: 4, y: 268.7, ref: "< 7 %" },
  { name: "Chromosome 17q12 duplication syndrome", pageIdx: 4, y: 241.3, ref: "< 7 %" },
  { name: "Chromosome 17q21.31 duplication syndrome", pageIdx: 4, y: 208.9, ref: "< 7 %" },
  { name: "Chromosome 17q23.1 - q23.2 deletion syndrome", pageIdx: 4, y: 176.5, ref: "< 7 %" },
  { name: "Yuan - Harel - Lupski syndrome", pageIdx: 4, y: 149.1, ref: "< 7 %" },
  { name: "Chromosome 19q13.11 deletion syndrome", pageIdx: 4, y: 122.0, ref: "< 7 %" },
  { name: "Holoprosencephaly 1", pageIdx: 4, y: 94.6, ref: "< 7 %" },
  { name: "DiGeorge syndrome", pageIdx: 4, y: 72.5, ref: "< 7 %" },

  // Page 6 (8 items)
  { name: "Chromosome 22q11.2 duplication syndrome", pageIdx: 5, y: 756.0, ref: "< 7 %" },
  { name: "Chromosome 22q11.2 deletion syndrome", pageIdx: 5, y: 728.9, ref: "< 7 %" },
  { name: "Chromosome Xq27.3 - q28 duplication syndrome", pageIdx: 5, y: 701.5, ref: "< 7 %" },
  { name: "Chromosome Xq28 duplication syndrome", pageIdx: 5, y: 669.1, ref: "< 7 %" },
  { name: "Chromosome Xp21 deletion syndrome", pageIdx: 5, y: 641.7, ref: "< 7 %" },
  { name: "Chromosome Xp11.3 deletion syndrome", pageIdx: 5, y: 619.6, ref: "< 7 %" },
  { name: "Chromosome Xq21 deletion syndrome", pageIdx: 5, y: 597.5, ref: "< 7 %" },
  { name: "Chromosome Xq28 deletion syndrome", pageIdx: 5, y: 575.7, ref: "< 7 %" },
];

export const genetPlusPackageHandler = {
  id: 'GeneT Plus',
  name: 'GeneT Plus',
  templateFileName: 'KQ_NIPT_GENET Plus k mở rộng.pdf',

  // 1. Default Results (23 Trisomies + 4 Sex Chromosomes + 102 Microdeletions)
  getDefaultResults() {
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
      microdeletions: MICRO_LIST.map(m => ({
        name: m.name,
        ref: m.ref,
        value: '',
        risk: 'Nguy cơ thấp',
        result: 'Không phát hiện'
      }))
    };
  },

  // 2. Parse uploaded result PDF for GeneT Plus (Plus 122.pdf / NIPT Plus.pdf)
  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const text = parsed.text || '';

    // Extract cfDNA percentage
    let cfDNA = '';
    const cfDnaMatch = text.match(/cfDNA(?:\s*\([^)]*\))?[:\s]+([0-9]+[.,][0-9]+)/i) ||
                       text.match(/([0-9]+[.,][0-9]+)%\s*cfDNA/i) ||
                       text.match(/Hàm lượng cfDNA[:\s]+([0-9]+[.,][0-9]+)/i);
    if (cfDnaMatch) {
      cfDNA = cfDnaMatch[1].replace(',', '.');
    }
    if (!cfDNA) cfDNA = '';

    const results = this.getDefaultResults();

    const extractTrisomy = (pattern) => {
      const regex = new RegExp('(?:^|\\n).*?' + pattern + '[^\\n]+', 'gi');
      const matches = text.match(regex) || [];
      
      let line = '';
      for (const m of matches) {
        if (/Z-score|Nguy\s*cơ|-3\s*</i.test(m)) {
          line = m;
          break;
        }
      }
      if (!line && matches.length > 0) line = matches[matches.length - 1];
      if (!line) return null;

      let risk = 'Nguy cơ thấp';
      if (/nguy\s*cơ\s*cao/i.test(line)) {
        risk = 'Nguy cơ cao';
      } else if (/nguy\s*cơ\s*thấp/i.test(line)) {
        risk = 'Nguy cơ thấp';
      }

      let value = '';
      const zScoreIdx = line.search(/Z-score\s*<\s*3/i);
      if (zScoreIdx !== -1) {
        const afterRef = line.slice(zScoreIdx).replace(/Z-score\s*<\s*3/i, '');
        const numMatch = afterRef.match(/(-?[0-9]+[.,][0-9]+)/);
        if (numMatch) {
          value = numMatch[1].replace(',', '.');
        }
      } else {
        const allNums = line.match(/-?[0-9]+[.,][0-9]+/g);
        if (allNums && allNums.length > 0) {
          value = allNums[allNums.length - 1].replace(',', '.');
        }
      }

      return { value, risk };
    };

    // Extract T21, T18, T13
    const t21 = extractTrisomy('(?:Trisomy 21|HC Down)');
    if (t21) {
      results.t21.value = t21.value;
      results.t21.risk = t21.risk;
    }

    const t18 = extractTrisomy('(?:Trisomy 18|HC Edwards)');
    if (t18) {
      results.t18.value = t18.value;
      results.t18.risk = t18.risk;
    }

    const t13 = extractTrisomy('(?:Trisomy 13|HC Patau)');
    if (t13) {
      results.t13.value = t13.value;
      results.t13.risk = t13.risk;
    }

    // Extract Sex Chromosomes
    const turner = extractTrisomy('(?:Turner|45,\\s*XO|XO)');
    if (turner) {
      results.turner.value = turner.value;
      results.turner.risk = turner.risk;
    }

    const klinefelter = extractTrisomy('(?:Klinefelter|47,\\s*XXY|XXY)');
    if (klinefelter) {
      results.klinefelter.value = klinefelter.value;
      results.klinefelter.risk = klinefelter.risk;
    }

    const jacobs = extractTrisomy('(?:Jacobs|47,\\s*XYY|XYY)');
    if (jacobs) {
      results.jacobs.value = jacobs.value;
      results.jacobs.risk = jacobs.risk;
    }

    const tripleX = extractTrisomy('(?:siêu nữ|Triple X|47,\\s*XXX|XXX)');
    if (tripleX) {
      results.tripleX.value = tripleX.value;
      results.tripleX.risk = tripleX.risk;
    }

    // Extract 19 other Trisomies
    const otherKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22];
    for (const num of otherKeys) {
      const extracted = extractTrisomy(`Trisomy\\s*${num}\\b`);
      if (extracted && results.otherTrisomies[`t${num}`]) {
        results.otherTrisomies[`t${num}`].value = extracted.value;
        results.otherTrisomies[`t${num}`].risk = extracted.risk;
      }
    }

    // Extract Microdeletions/Duplications
    const microdeletions = [];
    const microRegex = /([A-Za-z0-9\s.,\-\/]+?)\s*<\s*([0-9]+)\s*%\s*([0-9]+[.,][0-9]+)%\s*(Nguy cơ [^\n]+?)\s*(Không phát hiện|Phát hiện[^\n]*)/gi;
    let match;
    while ((match = microRegex.exec(text)) !== null) {
      let name = match[1].replace(/Họ\s*tên:|Mã\s*số\s*XN:|Khoảng\s*giá\s*trị|tham\s*chiếu|Giá\s*trị|phân\s*tích|Nguy\s*cơ|Kết\s*quả/gi, '').replace(/\s+/g, ' ').trim();
      if (name && name.length > 2 && !name.includes('Trisomy') && !name.includes('Lệch bội')) {
        microdeletions.push({
          name: name,
          ref: `< ${match[2]}%`,
          value: `${match[3].replace(',', '.')}%`,
          risk: match[4].trim(),
          result: match[5].trim()
        });
      }
    }
    if (microdeletions.length > 0) {
      results.microdeletions = microdeletions;
    }

    // Extract "Phiên giải kết quả:"
    let conclusion = '';
    const pgIndex = text.indexOf('Phiên giải kết quả:');
    if (pgIndex !== -1) {
      let rawPg = text.slice(pgIndex + 'Phiên giải kết quả:'.length, pgIndex + 1500);
      const stopIndex = rawPg.search(/Họ\s*tên:|Mã\s*số\s*XN:|Lưu\s*ý:|Khuyến\s*cáo:|Người\s*XN:|Trang\s+[0-9]+|1\)|2\)|Chữ\s*ký:|GIÁM\s*ĐỐC/i);
      if (stopIndex !== -1) {
        rawPg = rawPg.slice(0, stopIndex);
      }
      conclusion = rawPg.replace(/\s+/g, ' ').trim();
    }

    if (!conclusion) {
      conclusion = 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra. Mất đoạn, lặp đoạn xảy ra do mất hoặc thêm vật chất di truyền ở trên một nhiễm sắc thể. Các bất thường này có thể gây ra các khuyết tật bẩm sinh. Kết quả xét nghiệm “Không phát hiện” phản ánh không phát hiện các bất thường vi mất, lặp đoạn nằm trong khả năng bao phủ của xét nghiệm.';
    }

    // Extract GBS result from recommendation line 2)
    const gbsResult = extractGbsResultFromText(text);

    return { cfDNA, results, conclusion, gbsResult };
  },

  // 3. Generate populated GeneTrust Plus PDF template
  async generatePdf(sampleData) {
    const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
    let templatePath = path.join(phoiDir, this.templateFileName);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(phoiDir, 'KQ_NIPT_GENET Plus k mở rộng.pdf');
    }
    const pdfBuffer = fs.readFileSync(templatePath);

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdfDoc.registerFontkit(fontkit);

    let font, fontBold;
    try {
      const fontBytes = fs.readFileSync(path.join(process.cwd(), 'fonts', 'arial.ttf'));
      const fontBoldBytes = fs.readFileSync(path.join(process.cwd(), 'fonts', 'arialbd.ttf'));
      font = await pdfDoc.embedFont(fontBytes);
      fontBold = await pdfDoc.embedFont(fontBoldBytes);
    } catch (e) {
      const StandardFonts = (await import('pdf-lib')).StandardFonts;
      font = await pdfDoc.embedFont(StandardFonts.Helvetica);
      fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    }

    const pages = pdfDoc.getPages();
    const page1 = pages[0];
    const page2 = pages.length > 1 ? pages[1] : null;

    const textColor = rgb(0.05, 0.15, 0.35);
    const darkColor = rgb(0.1, 0.1, 0.1);
    const alertColor = rgb(0.85, 0.1, 0.1);

    const formattedDob = formatDateVN(sampleData.dob);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate);

    const drawRightTextOnPage = (targetPage, text, rightX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      targetPage.drawText(str, { x: rightX - textWidth, y, size, font: selectedFont, color });
    };

    const drawCenterTextOnPage = (targetPage, text, centerX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      targetPage.drawText(str, { x: centerX - (textWidth / 2), y, size, font: selectedFont, color });
    };

    const RIGHT_COL1_X = 235;
    const RIGHT_COL2_X = 390;
    const RIGHT_COL3_X = 545;
    const TABLE_VAL_CENTER_X = 322.0;
    const TABLE_RISK_CENTER_X = 468.0;

    // --- PAGE 1 OVERLAY ---
    drawRightTextOnPage(page1, sampleData.fullName || '', RIGHT_COL1_X, 699.3, fontBold, 9.5, textColor);
    drawRightTextOnPage(page1, formattedDob, RIGHT_COL2_X, 699.3, font, 9.5, darkColor);
    drawRightTextOnPage(page1, sampleData.idCard || '', RIGHT_COL3_X, 699.3, font, 9.5, darkColor);

    drawRightTextOnPage(page1, sampleData.phone || '', RIGHT_COL1_X, 681.8, font, 9.5, darkColor);
    drawRightTextOnPage(page1, sampleData.gestationalAge || '', RIGHT_COL2_X, 681.8, font, 9.5, darkColor);
    drawRightTextOnPage(page1, sampleData.pregnancyType || 'Đơn thai', RIGHT_COL3_X, 681.8, font, 9.5, darkColor);

    page1.drawText(sampleData.address || '', { x: 68, y: 660.9, size: 9.5, font, color: darkColor });

    drawRightTextOnPage(page1, sampleData.agencyCode || '', RIGHT_COL2_X, 625.9, font, 9.5, darkColor);
    drawRightTextOnPage(page1, sampleData.sampleCode || '', RIGHT_COL3_X, 625.9, fontBold, 9.5, textColor);

    drawRightTextOnPage(page1, sampleData.doctorName || '', RIGHT_COL1_X, 608.3, font, 9.5, darkColor);
    const cfDnaVal = sampleData.cfDNA ? `${sampleData.cfDNA}%` : '';
    drawRightTextOnPage(page1, cfDnaVal, RIGHT_COL3_X, 608.3, fontBold, 10, alertColor);

    drawRightTextOnPage(page1, formattedReceivedDate, RIGHT_COL3_X, 591.0, font, 9.5, darkColor);

    const res = sampleData.results || this.getDefaultResults();

    // Section I (T21, T18, T13)
    if (res.t21) {
      drawCenterTextOnPage(page1, res.t21.value || '', TABLE_VAL_CENTER_X, 489.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t21.risk || '', TABLE_RISK_CENTER_X, 489.3, fontBold, 9.5, (res.t21.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t18) {
      drawCenterTextOnPage(page1, res.t18.value || '', TABLE_VAL_CENTER_X, 470.8, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t18.risk || '', TABLE_RISK_CENTER_X, 470.8, fontBold, 9.5, (res.t18.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t13) {
      drawCenterTextOnPage(page1, res.t13.value || '', TABLE_VAL_CENTER_X, 452.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t13.risk || '', TABLE_RISK_CENTER_X, 452.3, fontBold, 9.5, (res.t13.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Section II (4 Sex Chromosomes)
    if (res.turner) {
      drawCenterTextOnPage(page1, res.turner.value || '', TABLE_VAL_CENTER_X, 380.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.turner.risk || '', TABLE_RISK_CENTER_X, 380.3, fontBold, 9.5, (res.turner.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.klinefelter) {
      drawCenterTextOnPage(page1, res.klinefelter.value || '', TABLE_VAL_CENTER_X, 364.2, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.klinefelter.risk || '', TABLE_RISK_CENTER_X, 364.2, fontBold, 9.5, (res.klinefelter.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.jacobs) {
      drawCenterTextOnPage(page1, res.jacobs.value || '', TABLE_VAL_CENTER_X, 348.1, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.jacobs.risk || '', TABLE_RISK_CENTER_X, 348.1, fontBold, 9.5, (res.jacobs.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.tripleX) {
      drawCenterTextOnPage(page1, res.tripleX.value || '', TABLE_VAL_CENTER_X, 332.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.tripleX.risk || '', TABLE_RISK_CENTER_X, 332.3, fontBold, 9.5, (res.tripleX.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Medical Conclusion on Page 1
    const conclusionStr = sampleData.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra. Mất đoạn, lặp đoạn xảy ra do mất hoặc thêm vật chất di truyền ở trên một nhiễm sắc thể. Các bất thường này có thể gây ra các khuyết tật bẩm sinh. Kết quả xét nghiệm “Không phát hiện” phản ánh không phát hiện các bất thường vi mất, lặp đoạn nằm trong khả năng bao phủ của xét nghiệm.';
    page1.drawText(conclusionStr, { x: 92, y: 316.4, size: 8.5, font: fontBold, color: rgb(0.05, 0.25, 0.55), maxWidth: 460, lineHeight: 11.5 });

    // Signature Date Line on Page 1 (Khớp chính xác với 'Ngày ... tháng ... năm ...' tại y = 222.3)
    const dateToUse = formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);
    const dateParts = dateToUse.split('/');
    if (dateParts.length === 3) {
      page1.drawText(dateParts[0], { x: 416, y: 222.3, size: 9, font: fontBold, color: darkColor });
      page1.drawText(dateParts[1], { x: 468, y: 222.3, size: 9, font: fontBold, color: darkColor });
      page1.drawText(dateParts[2], { x: 512, y: 222.3, size: 9, font: fontBold, color: darkColor });
    }

    // --- PAGE 2 OVERLAY ---
    if (page2) {
      // Header on Page 2: HỌ VÀ TÊN (x ~ 100), BARCODE (x ~ 465) tại y = 760.5
      page2.drawText(sampleData.fullName || '', { x: 105, y: 760.5, size: 9.5, font: fontBold, color: textColor });
      page2.drawText(sampleData.sampleCode || '', { x: 465, y: 760.5, size: 9.5, font: fontBold, color: textColor });

      // Page 2 Section III (19 Other Trisomies)
      const otherTrisomiesCoords = {
        t1: 694.3, t2: 675.3, t3: 656.1, t4: 637.2, t5: 618.2, t6: 599.2, t7: 580.3,
        t8: 561.3, t9: 542.1, t10: 523.1, t11: 504.1, t12: 485.2, t14: 466.2, t15: 447.3,
        t16: 428.3, t17: 409.1, t19: 390.1, t20: 371.2, t22: 352.2
      };

      const others = res.otherTrisomies || {};
      for (const [key, yPos] of Object.entries(otherTrisomiesCoords)) {
        const item = others[key];
        if (item) {
          drawCenterTextOnPage(page2, item.value || '0.000', TABLE_VAL_CENTER_X, yPos, fontBold, 9.5, darkColor);
          drawCenterTextOnPage(page2, item.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, yPos, fontBold, 9.5, (item.risk || '').includes('cao') ? alertColor : textColor);
        }
      }
    }

    // Overlay 102 Microdeletions / Duplications across Pages 2, 3, 4, 5, 6
    const microResults = res.microdeletions || [];
    const TABLE_MICRO_VAL_CENTER_X = 348.0;
    const TABLE_MICRO_CENTER_X = 468.0;

    MICRO_LIST.forEach((microItem) => {
      const targetPage = pages[microItem.pageIdx];
      if (!targetPage) return;

      const cleanTemplateName = microItem.name.toLowerCase().replace(/[\s\-_,.]+/g, '');
      const foundMatch = microResults.find(m => {
        if (!m.name) return false;
        const cleanMName = m.name.toLowerCase().replace(/[\s\-_,.]+/g, '');
        return cleanMName.includes(cleanTemplateName) || cleanTemplateName.includes(cleanMName);
      });

      let textToDraw = 'Không phát hiện';
      let valToDraw = '0.00%';
      let isAlert = false;

      if (foundMatch) {
        if (foundMatch.value) {
          const v = String(foundMatch.value).trim();
          valToDraw = v.includes('%') ? v : `${v}%`;
        }
        if (foundMatch.result) {
          textToDraw = foundMatch.result;
        } else if (foundMatch.risk) {
          textToDraw = foundMatch.risk;
        }
        const resTextLower = (foundMatch.result || textToDraw).toLowerCase();
        const riskTextLower = (foundMatch.risk || '').toLowerCase();
        if (
          (resTextLower.includes('phát hiện') && !resTextLower.includes('không phát hiện')) ||
          riskTextLower.includes('cao')
        ) {
          isAlert = true;
        }
      }

      // 1. Draw Giá trị phân tích (%)
      drawCenterTextOnPage(
        targetPage,
        valToDraw,
        TABLE_MICRO_VAL_CENTER_X,
        microItem.y,
        font,
        8.0,
        darkColor
      );

      // 2. Draw Kết quả
      drawCenterTextOnPage(
        targetPage,
        textToDraw,
        TABLE_MICRO_CENTER_X,
        microItem.y,
        fontBold,
        8.0,
        isAlert ? alertColor : textColor
      );
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
};
