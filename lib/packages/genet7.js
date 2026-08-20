import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParse from 'pdf-parse';
import { extractGbsResultFromText } from '../gbs-extractor.js';
import { extractTextWithOcrIfNeeded } from '../ocr-helper.js';
import { extractCfDnaFromText } from '../cfdna-extractor.js';

import { formatDateVN } from '../date-utils.js';

export const genet7PackageHandler = {
  id: 'GeneT 7',
  name: 'GeneT 7',
  templateFileName: 'KQ_NIPT_GENET 7.pdf',

  // 1. Default 7 Chromosome Disorder Rows for GeneT 7 (Empty values)
  getDefaultResults() {
    return {
      t21: { label: 'Trisomy 21 (Down)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t18: { label: 'Trisomy 18 (Edwards)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t13: { label: 'Trisomy 13 (Patau)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      turner: { label: 'HC Turner (45, XO)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      tripleX: { label: 'HC Trisomy X (47, XXX)', value: '', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' }
    };
  },

  // 2. Parse uploaded result PDF for GeneT 7
  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text || '';
    const text = await extractTextWithOcrIfNeeded(pdfBuffer, rawText);

    // Extract cfDNA percentage
    const cfDNA = extractCfDnaFromText(text);

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
      const decimalMatch = line.match(/-?[0-9]+[.,][0-9]+/g);
      if (decimalMatch && decimalMatch.length > 0) {
        value = decimalMatch[decimalMatch.length - 1].replace(',', '.');
      }

      return { value, risk };
    };

    // Extract T21, T18, T13
    const t21 = extractTrisomy('(?:Trisomy 21|HC Down|Down)');
    if (t21) {
      results.t21.value = t21.value;
      results.t21.risk = t21.risk;
    }

    const t18 = extractTrisomy('(?:Trisomy 18|HC Edwards|Edwards)');
    if (t18) {
      results.t18.value = t18.value;
      results.t18.risk = t18.risk;
    }

    const t13 = extractTrisomy('(?:Trisomy 13|HC Patau|Patau)');
    if (t13) {
      results.t13.value = t13.value;
      results.t13.risk = t13.risk;
    }

    // Extract sex chromosomes
    const turner = extractTrisomy('(?:Turner|45,\\s*XO|\\(XO\\))');
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

  // 3. Generate populated GeneTrust 7 PDF template (Page 1 ONLY)
  async generatePdf(sampleData) {
    const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
    let templatePath = path.join(phoiDir, this.templateFileName);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(phoiDir, 'KQ_NIPT_GENET 7.pdf');
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

    const firstPage = pdfDoc.getPages()[0]; // PAGE 1 ONLY

    const textColor = rgb(0.05, 0.15, 0.35);
    const darkColor = rgb(0.1, 0.1, 0.1);
    const alertColor = rgb(0.85, 0.1, 0.1);

    const formattedDob = formatDateVN(sampleData.dob);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate);

    const drawRightText = (text, rightX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      firstPage.drawText(str, { x: rightX - textWidth, y, size, font: selectedFont, color });
    };

    const drawCenterText = (text, centerX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      firstPage.drawText(str, { x: centerX - (textWidth / 2), y, size, font: selectedFont, color });
    };

    const RIGHT_COL1_X = 235;
    const RIGHT_COL2_X = 390;
    const RIGHT_COL3_X = 545;

    // Header Metadata
    drawRightText(sampleData.fullName || '', RIGHT_COL1_X, 699.3, fontBold, 9.5, textColor);
    drawRightText(formattedDob, RIGHT_COL2_X, 699.3, font, 9.5, darkColor);
    drawRightText(sampleData.idCard || '', RIGHT_COL3_X, 699.3, font, 9.5, darkColor);

    drawRightText(sampleData.phone || '', RIGHT_COL1_X, 681.8, font, 9.5, darkColor);
    drawRightText(sampleData.gestationalAge || '', RIGHT_COL2_X, 681.8, font, 9.5, darkColor);
    drawRightText(sampleData.pregnancyType || 'Đơn thai', RIGHT_COL3_X, 681.8, font, 9.5, darkColor);

    firstPage.drawText(sampleData.address || '', { x: 68, y: 660.9, size: 9.5, font, color: darkColor });

    drawRightText(sampleData.agencyCode || '', RIGHT_COL2_X, 625.9, font, 9.5, darkColor);
    drawRightText(sampleData.sampleCode || '', RIGHT_COL3_X, 625.9, fontBold, 9.5, textColor);

    drawRightText(sampleData.doctorName || '', RIGHT_COL1_X, 608.3, font, 9.5, darkColor);
    const cfDnaVal = sampleData.cfDNA ? `${sampleData.cfDNA}%` : '12.22%';
    drawRightText(cfDnaVal, RIGHT_COL3_X, 608.3, fontBold, 10, alertColor);

    drawRightText(formattedReceivedDate, RIGHT_COL3_X, 591.0, font, 9.5, darkColor);

    // Table values for 7 Chromosome Disorders
    const res = sampleData.results || this.getDefaultResults();
    const TABLE_VAL_CENTER_X = 317.0;
    const TABLE_RISK_CENTER_X = 471.0;

    // 1. Lệch bội phổ biến (3 NST Thường)
    if (res.t21) {
      drawCenterText(res.t21.value || '', TABLE_VAL_CENTER_X, 489.3, fontBold, 9.5, darkColor);
      drawCenterText(res.t21.risk || '', TABLE_RISK_CENTER_X, 489.3, fontBold, 9.5, (res.t21.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t18) {
      drawCenterText(res.t18.value || '', TABLE_VAL_CENTER_X, 470.8, fontBold, 9.5, darkColor);
      drawCenterText(res.t18.risk || '', TABLE_RISK_CENTER_X, 470.8, fontBold, 9.5, (res.t18.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t13) {
      drawCenterText(res.t13.value || '', TABLE_VAL_CENTER_X, 452.3, fontBold, 9.5, darkColor);
      drawCenterText(res.t13.risk || '', TABLE_RISK_CENTER_X, 452.3, fontBold, 9.5, (res.t13.risk || '').includes('cao') ? alertColor : textColor);
    }

    // 2. Lệch bội NST Giới tính (4 NST Giới tính)
    if (res.turner) {
      drawCenterText(res.turner.value || '', TABLE_VAL_CENTER_X, 380.3, fontBold, 9, darkColor);
      drawCenterText(res.turner.risk || '', TABLE_RISK_CENTER_X, 380.3, fontBold, 9, textColor);
    }
    if (res.klinefelter) {
      drawCenterText(res.klinefelter.value || '', TABLE_VAL_CENTER_X, 364.2, fontBold, 9, darkColor);
      drawCenterText(res.klinefelter.risk || '', TABLE_RISK_CENTER_X, 364.2, fontBold, 9, textColor);
    }
    if (res.jacobs) {
      drawCenterText(res.jacobs.value || '', TABLE_VAL_CENTER_X, 348.1, fontBold, 9, darkColor);
      drawCenterText(res.jacobs.risk || '', TABLE_RISK_CENTER_X, 348.1, fontBold, 9, textColor);
    }
    if (res.tripleX) {
      drawCenterText(res.tripleX.value || '', TABLE_VAL_CENTER_X, 332.3, fontBold, 9, darkColor);
      drawCenterText(res.tripleX.risk || '', TABLE_RISK_CENTER_X, 332.3, fontBold, 9, textColor);
    }

    // 3. IV. KẾT LUẬN Y KHOA
    const conclusionStr = sampleData.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.';
    firstPage.drawText(conclusionStr, { x: 98, y: 316.4, size: 9, font: fontBold, color: rgb(0.05, 0.25, 0.55), maxWidth: 450, lineHeight: 13 });

    // 4. Date line (Hà Nội, ngày... tháng... năm... tại y = 223.0)
    const dateToUse = formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);
    const dateParts = dateToUse.split('/');
    if (dateParts.length === 3) {
      firstPage.drawText(dateParts[0], { x: 403, y: 223.0, size: 9, font: fontBold, color: darkColor });
      firstPage.drawText(dateParts[1], { x: 468, y: 223.0, size: 9, font: fontBold, color: darkColor });
      firstPage.drawText(dateParts[2], { x: 518, y: 223.0, size: 9, font: fontBold, color: darkColor });
    }

    // Checker & Director Signatures on Page 1
    const CHECKER_CENTER_X = 149.0;
    const DIRECTOR_CENTER_X = 442.0;
    if (sampleData.checkerName) {
      drawCenterText(sampleData.checkerName, CHECKER_CENTER_X, 135.0, fontBold, 9.5, darkColor);
    }
    if (sampleData.directorName) {
      drawCenterText(sampleData.directorName, DIRECTOR_CENTER_X, 135.0, fontBold, 9.5, darkColor);
    }

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  }
};
