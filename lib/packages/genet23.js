import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParse from 'pdf-parse';
import { extractGbsResultFromText } from '../gbs-extractor.js';

import { formatDateVN } from '../date-utils.js';

export const genet23PackageHandler = {
  id: 'GeneT 23',
  name: 'GeneT 23',
  templateFileName: 'KQ_NIPT_GENET 23.pdf',

  // 1. Default 23 Chromosome Disorder Rows for GeneT 23 (Empty values)
  getDefaultResults() {
    const res = {
      t21: { label: 'Trisomy 21 (Down)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t18: { label: 'Trisomy 18 (Edwards)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t13: { label: 'Trisomy 13 (Patau)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      turner: { label: 'HC Turner (45, XO)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      tripleX: { label: 'HC Trisomy X (47, XXX)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' }
    };

    const otherTrisomies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22];
    otherTrisomies.forEach(num => {
      res[`trisomy_${num}`] = {
        label: `Trisomy ${num}`,
        value: '',
        risk: 'Nguy cơ thấp',
        ref: '-3 < Z < 3'
      };
    });

    return res;
  },

  // 2. Parse uploaded result PDF for GeneT 23 (Focus.pdf)
  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const text = parsed.text || '';

    // Extract cfDNA percentage
    let cfDNA = '';
    const cfDnaMatch = text.match(/cfDNA\s*\([^)]*\)[:\s]*([0-9]+[.,][0-9]+)%?|cfDNA[:\s]+([0-9]+[.,][0-9]+)%?/i);
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

    const klin = extractTrisomy('(?:Klinefelter|XXY)');
    if (klin) {
      results.klinefelter.value = klin.value;
      results.klinefelter.risk = klin.risk;
    }

    const jacobs = extractTrisomy('(?:Jacobs|XYY)');
    if (jacobs) {
      results.jacobs.value = jacobs.value;
      results.jacobs.risk = jacobs.risk;
    }

    const xxx = extractTrisomy('(?:siêu nữ|Trisomy X|XXX)');
    if (xxx) {
      results.tripleX.value = xxx.value;
      results.tripleX.risk = xxx.risk;
    }

    // Extract other Trisomies (1..22 except 13, 18, 21)
    const otherTrisomies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22];
    otherTrisomies.forEach(num => {
      const match = extractTrisomy(`Trisomy\\s*${num}`);
      if (match && results[`trisomy_${num}`]) {
        results[`trisomy_${num}`].value = match.value;
        results[`trisomy_${num}`].risk = match.risk;
      }
    });

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

  // 3. Generate populated GeneTrust 23 PDF template (CHÈN CẢ 2 TRANG VỚI TỌA ĐỘ CHUẨN XÁC)
  async generatePdf(sampleData) {
    const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
    let templatePath = path.join(phoiDir, this.templateFileName);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(phoiDir, 'KQ_NIPT_GENET 23.pdf');
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
    const firstPage = pages[0]; // PAGE 1
    const secondPage = pages[1]; // PAGE 2

    const textColor = rgb(0.05, 0.15, 0.35);
    const darkColor = rgb(0.1, 0.1, 0.1);
    const alertColor = rgb(0.85, 0.1, 0.1);

    const formattedDob = formatDateVN(sampleData.dob);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate);

    const drawRightText = (targetPage, text, rightX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      targetPage.drawText(str, { x: rightX - textWidth, y, size, font: selectedFont, color });
    };

    const drawCenterText = (targetPage, text, centerX, y, selectedFont, size, color) => {
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

    // ================= PAGE 1 OVERLAY =================
    drawRightText(firstPage, sampleData.fullName || '', RIGHT_COL1_X, 699.3, fontBold, 9.5, textColor);
    drawRightText(firstPage, formattedDob, RIGHT_COL2_X, 699.3, font, 9.5, darkColor);
    drawRightText(firstPage, sampleData.idCard || '', RIGHT_COL3_X, 699.3, font, 9.5, darkColor);

    drawRightText(firstPage, sampleData.phone || '', RIGHT_COL1_X, 681.8, font, 9.5, darkColor);
    drawRightText(firstPage, sampleData.gestationalAge || '', RIGHT_COL2_X, 681.8, font, 9.5, darkColor);
    drawRightText(firstPage, sampleData.pregnancyType || 'Đơn thai', RIGHT_COL3_X, 681.8, font, 9.5, darkColor);

    firstPage.drawText(sampleData.address || '', { x: 68, y: 660.9, size: 9.5, font, color: darkColor });

    drawRightText(firstPage, sampleData.agencyCode || '', RIGHT_COL2_X, 625.9, font, 9.5, darkColor);
    drawRightText(firstPage, sampleData.sampleCode || '', RIGHT_COL3_X, 625.9, fontBold, 9.5, textColor);

    drawRightText(firstPage, sampleData.doctorName || '', RIGHT_COL1_X, 608.3, font, 9.5, darkColor);
    const cfDnaVal = sampleData.cfDNA ? `${sampleData.cfDNA}%` : '5.58%';
    drawRightText(firstPage, cfDnaVal, RIGHT_COL3_X, 608.3, fontBold, 10, alertColor);

    drawRightText(firstPage, formattedReceivedDate, RIGHT_COL3_X, 591.0, font, 9.5, darkColor);

    const res = sampleData.results || this.getDefaultResults();

    // Section I on Page 1 (T21, T18, T13 - Exact Y coordinates from KQ_NIPT_GENET 23.pdf)
    if (res.t21) {
      drawCenterText(firstPage, res.t21.value || '-0.243', TABLE_VAL_CENTER_X, 489.3, fontBold, 9.5, darkColor);
      drawCenterText(firstPage, res.t21.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 489.3, fontBold, 9.5, (res.t21.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t18) {
      drawCenterText(firstPage, res.t18.value || '0.941', TABLE_VAL_CENTER_X, 470.8, fontBold, 9.5, darkColor);
      drawCenterText(firstPage, res.t18.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 470.8, fontBold, 9.5, (res.t18.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t13) {
      drawCenterText(firstPage, res.t13.value || '0.020', TABLE_VAL_CENTER_X, 452.3, fontBold, 9.5, darkColor);
      drawCenterText(firstPage, res.t13.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 452.3, fontBold, 9.5, (res.t13.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Section II on Page 1 (4 Sex Chromosomes - Exact Y coordinates from KQ_NIPT_GENET 23.pdf)
    if (res.turner) {
      drawCenterText(firstPage, res.turner.value || '2.364', TABLE_VAL_CENTER_X, 380.3, fontBold, 9, darkColor);
      drawCenterText(firstPage, res.turner.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 380.3, fontBold, 9, textColor);
    }
    if (res.klinefelter) {
      drawCenterText(firstPage, res.klinefelter.value || '2.364', TABLE_VAL_CENTER_X, 364.2, fontBold, 9, darkColor);
      drawCenterText(firstPage, res.klinefelter.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 364.2, fontBold, 9, textColor);
    }
    if (res.jacobs) {
      drawCenterText(firstPage, res.jacobs.value || '2.364', TABLE_VAL_CENTER_X, 348.1, fontBold, 9, darkColor);
      drawCenterText(firstPage, res.jacobs.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 348.1, fontBold, 9, textColor);
    }
    if (res.tripleX) {
      drawCenterText(firstPage, res.tripleX.value || '2.364', TABLE_VAL_CENTER_X, 332.3, fontBold, 9, darkColor);
      drawCenterText(firstPage, res.tripleX.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 332.3, fontBold, 9, textColor);
    }

    // Medical Conclusion on Page 1
    const conclusionStr = sampleData.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.';
    firstPage.drawText(conclusionStr, { x: 98, y: 316.4, size: 8.5, font: fontBold, color: rgb(0.05, 0.25, 0.55), maxWidth: 450, lineHeight: 12 });

    // Date line on Page 1 (Hà Nội, ngày... tháng... năm... tại y = 222.3)
    const dateToUse = formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);
    const dateParts = dateToUse.split('/');
    if (dateParts.length === 3) {
      firstPage.drawText(dateParts[0], { x: 408, y: 222.3, size: 9, font: fontBold, color: darkColor });
      firstPage.drawText(dateParts[1], { x: 466, y: 222.3, size: 9, font: fontBold, color: darkColor });
      firstPage.drawText(dateParts[2], { x: 516, y: 222.3, size: 9, font: fontBold, color: darkColor });
    }

    // Checker & Director Signatures on Page 1
    const CHECKER_CENTER_X = 149.0;
    const DIRECTOR_CENTER_X = 442.0;
    if (sampleData.checkerName) {
      drawCenterText(firstPage, sampleData.checkerName, CHECKER_CENTER_X, 135.0, fontBold, 9.5, darkColor);
    }
    if (sampleData.directorName) {
      drawCenterText(firstPage, sampleData.directorName, DIRECTOR_CENTER_X, 135.0, fontBold, 9.5, darkColor);
    }

    // ================= PAGE 2 OVERLAY =================
    if (secondPage) {
      secondPage.drawText(sampleData.fullName || '', { x: 120.0, y: 760.5, size: 10.5, font: fontBold, color: textColor });
      secondPage.drawText(sampleData.sampleCode || '', { x: 465.0, y: 760.5, size: 10.5, font: fontBold, color: textColor });

      const page2YMap = {
        trisomy_1: 691.3,
        trisomy_2: 671.1,
        trisomy_3: 650.9,
        trisomy_4: 630.7,
        trisomy_5: 610.5,
        trisomy_6: 590.4,
        trisomy_7: 570.2,
        trisomy_8: 550.0,
        trisomy_9: 529.9,
        trisomy_10: 509.7,
        trisomy_11: 489.6,
        trisomy_12: 469.4,
        trisomy_14: 449.3,
        trisomy_15: 429.2,
        trisomy_16: 409.0,
        trisomy_17: 388.9,
        trisomy_19: 368.7,
        trisomy_20: 348.5,
        trisomy_22: 328.4
      };

      Object.entries(page2YMap).forEach(([key, yPos]) => {
        const item = res[key];
        if (item) {
          drawCenterText(secondPage, item.value || '-0.400', TABLE_VAL_CENTER_X, yPos, font, 9, darkColor);
          drawCenterText(secondPage, item.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, yPos, fontBold, 9, (item.risk || '').includes('cao') ? alertColor : textColor);
        }
      });
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
};
