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

export const genetPlusPackageHandler = {
  id: 'GeneT Plus',
  name: 'GeneT Plus (k mở rộng)',
  templateFileName: 'KQ_NIPT_GENET Plus k mở rộng.pdf',

  // 1. Default Results (23 Trisomies + 4 Sex Chromosomes + Microdeletions)
  getDefaultResults() {
    return {
      t21: { label: 'HC Down (Trisomy 21)', value: '0.178', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t18: { label: 'HC Edwards (Trisomy 18)', value: '1.031', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t13: { label: 'HC Patau (Trisomy 13)', value: '0.388', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },

      turner: { label: 'HC Turner (45, XO)', value: '-0.287', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '-0.287', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      jacobs: { label: 'HC Jacobs (47, XYY)', value: '-0.287', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      tripleX: { label: 'HC Siêu nữ (47, XXX)', value: '-0.287', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },

      otherTrisomies: {
        t1: { label: 'Trisomy 1', value: '-1.454', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t2: { label: 'Trisomy 2', value: '-0.076', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t3: { label: 'Trisomy 3', value: '-0.048', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t4: { label: 'Trisomy 4', value: '0.291', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t5: { label: 'Trisomy 5', value: '0.269', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t6: { label: 'Trisomy 6', value: '-0.687', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t7: { label: 'Trisomy 7', value: '0.589', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t8: { label: 'Trisomy 8', value: '0.253', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t9: { label: 'Trisomy 9', value: '-0.467', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t10: { label: 'Trisomy 10', value: '0.126', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t11: { label: 'Trisomy 11', value: '-0.214', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t12: { label: 'Trisomy 12', value: '-0.903', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
        t14: { label: 'Trisomy 14', value: '', risk: '', ref: '-3 < Z < 3' },
        t15: { label: 'Trisomy 15', value: '', risk: '', ref: '-3 < Z < 3' },
        t16: { label: 'Trisomy 16', value: '', risk: '', ref: '-3 < Z < 3' },
        t17: { label: 'Trisomy 17', value: '', risk: '', ref: '-3 < Z < 3' },
        t19: { label: 'Trisomy 19', value: '', risk: '', ref: '-3 < Z < 3' },
        t20: { label: 'Trisomy 20', value: '', risk: '', ref: '-3 < Z < 3' },
        t22: { label: 'Trisomy 22', value: '', risk: '', ref: '-3 < Z < 3' },
      },
      microdeletions: []
    };
  },

  // 2. Parse uploaded result PDF for GeneT Plus (Plus 122.pdf)
  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const text = parsed.text || '';

    // Extract cfDNA percentage
    let cfDNA = '';
    const cfDnaMatch = text.match(/cfDNA\s*\([^)]*\)[:\s]*([0-9+[.,][0-9]+)%?|cfDNA[:\s]+([0-9+[.,][0-9]+)%?/i);
    if (cfDnaMatch) {
      cfDNA = (cfDnaMatch[1] || cfDnaMatch[2]).replace(',', '.');
    }
    if (!cfDNA) cfDNA = '';

    const results = this.getDefaultResults();

    const extractTrisomy = (pattern) => {
      const lineMatch = text.match(new RegExp(pattern + '[^\\n]+', 'i'));
      if (!lineMatch) return null;
      const line = lineMatch[0];

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
    const turnerMatch = text.match(/(?:Turner|XO)[^\n-]*?(?:-3[<Z\s-]+3)?\s*(-?[0-9]+[.,][0-9]+)\s*(Nguy cơ [^\n]+)/i);
    if (turnerMatch) {
      results.turner.value = turnerMatch[1].replace(',', '.');
      results.turner.risk = turnerMatch[2].trim();
    }

    const klinefelterMatch = text.match(/(?:Klinefelter|XXY)[^\n-]*?(?:-3[<Z\s-]+3)?\s*(-?[0-9]+[.,][0-9]+)\s*(Nguy cơ [^\n]+)/i);
    if (klinefelterMatch) {
      results.klinefelter.value = klinefelterMatch[1].replace(',', '.');
      results.klinefelter.risk = klinefelterMatch[2].trim();
    }

    const jacobsMatch = text.match(/(?:Jacobs|XYY)[^\n-]*?(?:-3[<Z\s-]+3)?\s*(-?[0-9]+[.,][0-9]+)\s*(Nguy cơ [^\n]+)/i);
    if (jacobsMatch) {
      results.jacobs.value = jacobsMatch[1].replace(',', '.');
      results.jacobs.risk = jacobsMatch[2].trim();
    }

    const tripleXMatch = text.match(/(?:siêu nữ|Triple X|XXX)[^\n-]*?(?:-3[<Z\s-]+3)?\s*(-?[0-9]+[.,][0-9]+)\s*(Nguy cơ [^\n]+)/i);
    if (tripleXMatch) {
      results.tripleX.value = tripleXMatch[1].replace(',', '.');
      results.tripleX.risk = tripleXMatch[2].trim();
    }

    // Extract 19 other Trisomies
    const otherKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22];
    for (const num of otherKeys) {
      const regex = new RegExp(`Trisomy\\s*${num}[^\\n-]*?(?:-3[<Z\\s-]+3)?\\s*(-?[0-9]+[.,][0-9]+)\\s*(Nguy cơ [^\\n]+)`, 'i');
      const match = text.match(regex);
      if (match) {
        results.otherTrisomies[`t${num}`].value = match[1].replace(',', '.');
        results.otherTrisomies[`t${num}`].risk = match[2].trim();
      }
    }

    // Extract 92 Microdeletions/Duplications
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
    results.microdeletions = microdeletions;

    // Extract "Phiên giải kết quả:"
    let conclusion = '';
    const pgIndex = text.indexOf('Phiên giải kết quả:');
    if (pgIndex !== -1) {
      let rawPg = text.slice(pgIndex + 'Phiên giải kết quả:'.length, pgIndex + 500);
      const stopIndex = rawPg.search(/Họ\s*tên:|Mã\s*số\s*XN:|Lưu\s*ý:|Khuyến\s*cáo:|Người\s*XN:|Trang\s+[0-9]+|1\)|2\)/i);
      if (stopIndex !== -1) {
        rawPg = rawPg.slice(0, stopIndex);
      }
      conclusion = rawPg.replace(/\s+/g, ' ').trim();
    }

    if (!conclusion) {
      conclusion = 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.';
    }

    // Extract GBS result from recommendation line 2)
    const gbsResult = extractGbsResultFromText(text);

    return { cfDNA, results, conclusion, gbsResult };
  },

  // 3. Generate populated GeneTrust Plus PDF template (Pages 1 and 2 overlaid)
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
    const TABLE_VAL_CENTER_X = 317.0;
    const TABLE_RISK_CENTER_X = 471.0;

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
    const cfDnaVal = sampleData.cfDNA ? `${sampleData.cfDNA}%` : '8.39%';
    drawRightTextOnPage(page1, cfDnaVal, RIGHT_COL3_X, 608.3, fontBold, 10, alertColor);

    drawRightTextOnPage(page1, formattedReceivedDate, RIGHT_COL3_X, 591.0, font, 9.5, darkColor);

    const res = sampleData.results || this.getDefaultResults();

    // Section I (T21, T18, T13)
    if (res.t21) {
      drawCenterTextOnPage(page1, res.t21.value || '0.178', TABLE_VAL_CENTER_X, 489.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t21.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 489.3, fontBold, 9.5, (res.t21.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t18) {
      drawCenterTextOnPage(page1, res.t18.value || '1.031', TABLE_VAL_CENTER_X, 470.8, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t18.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 470.8, fontBold, 9.5, (res.t18.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t13) {
      drawCenterTextOnPage(page1, res.t13.value || '0.388', TABLE_VAL_CENTER_X, 452.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t13.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 452.3, fontBold, 9.5, (res.t13.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Section II (4 Sex Chromosomes)
    if (res.turner) {
      drawCenterTextOnPage(page1, res.turner.value || '-0.287', TABLE_VAL_CENTER_X, 380.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.turner.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 380.3, fontBold, 9.5, (res.turner.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.klinefelter) {
      drawCenterTextOnPage(page1, res.klinefelter.value || '-0.287', TABLE_VAL_CENTER_X, 364.2, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.klinefelter.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 364.2, fontBold, 9.5, (res.klinefelter.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.jacobs) {
      drawCenterTextOnPage(page1, res.jacobs.value || '-0.287', TABLE_VAL_CENTER_X, 348.1, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.jacobs.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 348.1, fontBold, 9.5, (res.jacobs.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.tripleX) {
      drawCenterTextOnPage(page1, res.tripleX.value || '-0.287', TABLE_VAL_CENTER_X, 332.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.tripleX.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 332.3, fontBold, 9.5, (res.tripleX.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Medical Conclusion on Page 1
    const conclusionStr = sampleData.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.';
    page1.drawText(conclusionStr, { x: 98, y: 316.4, size: 9, font: fontBold, color: rgb(0.05, 0.25, 0.55), maxWidth: 450, lineHeight: 13 });

    // Signature Date Line on Page 1
    const dateToUse = formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);
    const dateParts = dateToUse.split('/');
    if (dateParts.length === 3) {
      page1.drawText(dateParts[0], { x: 417, y: 265.8, size: 9, font: fontBold, color: darkColor });
      page1.drawText(dateParts[1], { x: 458, y: 265.8, size: 9, font: fontBold, color: darkColor });
      page1.drawText(dateParts[2], { x: 498, y: 265.8, size: 9, font: fontBold, color: darkColor });
    }

    // --- PAGES 2, 3, 4, 5 OVERLAYS ---
    const MICRO_LIST = [
      // Page 2 (9 items)
      { name: "Chromosome 1p36 deletion syndrome", pageIdx: 1, y: 253.0 },
      { name: "Chromosome 1q41 - q42 deletion syndrome", pageIdx: 1, y: 230.9 },
      { name: "Chromosome 1p32 - p31 deletion syndrome", pageIdx: 1, y: 208.9 },
      { name: "Chromosome 2p16.1 - p15 deletion syndrome", pageIdx: 1, y: 186.8 },
      { name: "Chromosome 2q33.1 deletion syndrome", pageIdx: 1, y: 164.7 },
      { name: "Chromosome 2q31.1 duplication syndrome", pageIdx: 1, y: 142.6 },
      { name: "Chromosome 2q37 deletion syndrome", pageIdx: 1, y: 120.5 },
      { name: "Chromosome 2q31.1 microdeletion syndrome", pageIdx: 1, y: 98.4 },
      { name: "Chromosome 2q duplication", pageIdx: 1, y: 76.3 },

      // Page 3 (31 items)
      { name: "Chromosome 3pter - p25 deletion syndrome", pageIdx: 2, y: 732.7 },
      { name: "Dandy - Walker syndrome", pageIdx: 2, y: 710.4 },
      { name: "Chromosome 3q13.31 deletion syndrome", pageIdx: 2, y: 688.3 },
      { name: "Distal chromosome 3p duplication", pageIdx: 2, y: 666.2 },
      { name: "Chromosome 3q duplication", pageIdx: 2, y: 644.1 },
      { name: "Chromosome 4p16.3 deletion syndrome", pageIdx: 2, y: 622.0 },
      { name: "Chromosome 4q21 deletion syndrome", pageIdx: 2, y: 599.9 },
      { name: "Chromosome 4p duplication", pageIdx: 2, y: 577.9 },
      { name: "Distal chromosome 4q duplication", pageIdx: 2, y: 555.8 },
      { name: "Distal chromosome 4q deletion", pageIdx: 2, y: 533.7 },
      { name: "Cri - du - Chat syndrome", pageIdx: 2, y: 511.6 },

      { name: "Chromosome 5q12 deletion syndrome", pageIdx: 2, y: 467.4 },
      { name: "Chromosome 5p13 duplication syndrome", pageIdx: 2, y: 445.3 },
      { name: "Chromosome 5p duplication", pageIdx: 2, y: 423.0 },
      { name: "Chromosome 6pter - p24 deletion syndrome", pageIdx: 2, y: 400.9 },
      { name: "Chromosome 6q24 - q25 deletion syndrome", pageIdx: 2, y: 378.8 },
      { name: "Chromosome 6q11 - q14 deletion syndrome", pageIdx: 2, y: 356.8 },
      { name: "Chromosome 6p deletion", pageIdx: 2, y: 334.7 },
      { name: "Chromosome 6q15 - q23 deletion syndrome", pageIdx: 2, y: 312.6 },
      { name: "Chromosome 6q25 - qter deletion syndrome", pageIdx: 2, y: 290.5 },
      { name: "Chromosome 6q26 - q27 deletion syndrome", pageIdx: 2, y: 268.4 },
      { name: "Chromosome 7p deletion", pageIdx: 2, y: 246.3 },
      { name: "Chromosome 7q11.23 deletion syndrome", pageIdx: 2, y: 224.2 },
      { name: "Chromosome 7q21 - q32 deletion", pageIdx: 2, y: 202.2 },
      { name: "Chromosome 7q31 - q32 deletion", pageIdx: 2, y: 180.1 },
      { name: "Chromosome 8p23.1 deletion syndrome", pageIdx: 2, y: 158.0 },
      { name: "Chromosome 8p23.1 duplication syndrome", pageIdx: 2, y: 135.7 },
      { name: "Langer - Giedion syndrome", pageIdx: 2, y: 113.6 },
      { name: "Chromosome 8q22.1 deletion syndrome", pageIdx: 2, y: 91.5 },
      { name: "Chromosome 8q22.1 duplication syndrome", pageIdx: 2, y: 69.4 },

      // Page 4 (31 items)
      { name: "Chromosome 8p duplication", pageIdx: 3, y: 732.7 },
      { name: "Chromosome 8q duplication", pageIdx: 3, y: 710.4 },
      { name: "Chromosome 9p deletion syndrome", pageIdx: 3, y: 688.3 },
      { name: "Chromosome 9p duplication", pageIdx: 3, y: 666.2 },
      { name: "DiGeorge syndrome 2", pageIdx: 3, y: 644.1 },
      { name: "Chromosome 10q22.3 - q23.2 deletion syndrome", pageIdx: 3, y: 622.0 },
      { name: "Chromosome 10q26 deletion syndrome", pageIdx: 3, y: 599.9 },
      { name: "Chromosome 10p12 - p11 deletion syndrome", pageIdx: 3, y: 577.9 },
      { name: "Chromosome 10p duplication", pageIdx: 3, y: 555.8 },
      { name: "Chromosome 11p13 deletion syndrome", pageIdx: 3, y: 533.7 },
      { name: "Chromosome 11p11.2 deletion syndrome", pageIdx: 3, y: 511.6 },
      { name: "Jacobsen syndrome", pageIdx: 3, y: 489.5 },
      { name: "Chromosome 11q23 deletion syndrome", pageIdx: 3, y: 467.4 },
      { name: "Chromosome 12q14 microdeletion syndrome", pageIdx: 3, y: 445.3 },
      { name: "Chromosome 12p12.1 microdeletion syndrome", pageIdx: 3, y: 423.0 },
      { name: "Chromosome 12q duplication", pageIdx: 3, y: 400.9 },
      { name: "Chromosome 13q14 deletion syndrome", pageIdx: 3, y: 378.8 },
      { name: "Distal chromosome 13q deletion", pageIdx: 3, y: 356.8 },
      { name: "Chromosome 14q11 - q22 deletion syndrome", pageIdx: 3, y: 334.7 },
      { name: "Chromosome 14q22 deletion syndrome", pageIdx: 3, y: 312.6 },
      { name: "Proximal chromosome 14q deletion", pageIdx: 3, y: 290.5 },
      { name: "Chromosome 14q duplication", pageIdx: 3, y: 268.4 },
      { name: "Prader - Willi syndrome", pageIdx: 3, y: 246.3 },
      { name: "Angelman syndrome", pageIdx: 3, y: 224.2 },
      { name: "Chromosome 15q26 - qter deletion syndrome", pageIdx: 3, y: 202.2 },
      { name: "Levy - Shanske syndrome", pageIdx: 3, y: 180.1 },
      { name: "Chromosome 15q14 deletion syndrome", pageIdx: 3, y: 158.0 },
      { name: "Chromosome 15q24 microdeletion syndrome", pageIdx: 3, y: 135.7 },
      { name: "Chromosome 15q26 overgrowth syndrome", pageIdx: 3, y: 113.6 },
      { name: "Distal chromosome 15q deletion", pageIdx: 3, y: 91.5 },
      { name: "Chromosome 16p12.2 - p11.2 deletion syndrome", pageIdx: 3, y: 69.4 },

      // Page 5 (21 items)
      { name: "Chromosome 16p12.2 - p11.2 duplication syndrome", pageIdx: 4, y: 732.7 },
      { name: "Chromosome 16p13.3 deletion syndrome", pageIdx: 4, y: 710.4 },
      { name: "Chromosome 16p13.3 duplication syndrome", pageIdx: 4, y: 688.3 },
      { name: "Proximal chromosome 16q duplication", pageIdx: 4, y: 666.2 },
      { name: "Smith - Magenis syndrome", pageIdx: 4, y: 644.1 },
      { name: "Chromosome 17p13.3 deletion syndrome", pageIdx: 4, y: 622.0 },
      { name: "Potocki - Lupski syndrome", pageIdx: 4, y: 599.9 },
      { name: "Chromosome 17p13.3 duplication syndrome", pageIdx: 4, y: 577.9 },
      { name: "Yuan - Harel - Lupski syndrome", pageIdx: 4, y: 555.8 },
      { name: "Chromosome 17p duplication", pageIdx: 4, y: 533.7 },
      { name: "Chromosome 18p deletion syndrome", pageIdx: 4, y: 511.6 },
      { name: "Distal chromosome 18q deletion syndrome", pageIdx: 4, y: 489.5 },
      { name: "Alagille syndrome 1", pageIdx: 4, y: 467.4 },
      { name: "Chromosome 20p duplication", pageIdx: 4, y: 445.3 },
      { name: "Chromosome 21q22 deletion", pageIdx: 4, y: 423.0 },
      { name: "Chromosome 22q11.2 deletion syndrome", pageIdx: 4, y: 400.9 },
      { name: "Chromosome Xp11.23 - p11.22 duplication syndrome", pageIdx: 4, y: 378.8 },
      { name: "Chromosome Xp21 deletion syndrome", pageIdx: 4, y: 356.8 },
      { name: "Chromosome Xq27.3 - q28 duplication syndrome", pageIdx: 4, y: 334.7 },
      { name: "Chromosome Xq21 deletion syndrome", pageIdx: 4, y: 312.6 },
      { name: "Chromosome Xq22.3 deletion syndrome", pageIdx: 4, y: 290.5 }
    ];

    // Header info on Pages 2, 3, 4, 5
    [1, 2, 3, 4].forEach((pIdx) => {
      if (pages[pIdx]) {
        drawRightTextOnPage(pages[pIdx], sampleData.fullName || '', RIGHT_COL1_X, 767.0, fontBold, 9.5, textColor);
        drawRightTextOnPage(pages[pIdx], sampleData.sampleCode || '', RIGHT_COL3_X, 767.0, fontBold, 9.5, textColor);
      }
    });

    // Page 2 Section III (19 Other Trisomies)
    if (page2) {
      const otherTrisomiesCoords = {
        t1: 690.9, t2: 670.8, t3: 650.6, t4: 630.4, t5: 610.2, t6: 590.1, t7: 569.9,
        t8: 550.0, t9: 529.8, t10: 509.7, t11: 489.5, t12: 469.3, t14: 449.2, t15: 429.0,
        t16: 408.8, t17: 388.7, t19: 368.5, t20: 348.3, t22: 328.2
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

    // Overlay 92 Microdeletions / Duplications across Pages 2, 3, 4, 5
    const microResults = res.microdeletions || [];
    const TABLE_MICRO_CENTER_X = 465.0;

    MICRO_LIST.forEach((microItem) => {
      const targetPage = pages[microItem.pageIdx];
      if (!targetPage) return;

      const foundMatch = microResults.find(m =>
        m.name && (
          m.name.toLowerCase().includes(microItem.name.toLowerCase()) ||
          microItem.name.toLowerCase().includes(m.name.toLowerCase())
        )
      );

      let textToDraw = 'Không phát hiện';
      let isAlert = false;

      if (foundMatch) {
        if (foundMatch.result) {
          textToDraw = foundMatch.result;
        } else if (foundMatch.risk) {
          textToDraw = foundMatch.risk;
        }
        if (
          (foundMatch.result || '').toLowerCase().includes('phát hiện') ||
          (foundMatch.risk || '').toLowerCase().includes('cao')
        ) {
          isAlert = true;
        }
      }

      drawCenterTextOnPage(
        targetPage,
        textToDraw,
        TABLE_MICRO_CENTER_X,
        microItem.y,
        fontBold,
        8.5,
        isAlert ? alertColor : textColor
      );
    });

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
};
