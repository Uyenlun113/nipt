import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, degrees } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParse from 'pdf-parse';
import { extractGbsResultFromText } from '../gbs-extractor.js';
import { extractTextWithOcrIfNeeded } from '../ocr-helper.js';
import { extractCfDnaFromText } from '../cfdna-extractor.js';
import { formatDateVN } from '../date-utils.js';
import { getCachedFontBytes, getCachedPdfTemplate, getCachedMstStampBytes, getCachedDirectorSignatureBytes, getCachedCheckerSignatureBytes } from '../file-cache.js';
import { MICRO_LIST } from '../constants/micro-list.js';

export { MICRO_LIST };

export const genetPlusPackageHandler = {
  id: 'GeneT Plus',
  name: 'GeneT Plus (k mở rộng)',
  templateFileName: 'KQ_NIPT_GENET Plus k mở rộng.pdf',

  // 1. Default Results (23 Trisomies + 4 Sex Chromosomes + Microdeletions - Empty values)
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
      microdeletions: []
    };
  },

  // 2. Parse uploaded result PDF for GeneT Plus (Plus 122.pdf)
  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text || '';
    const text = await extractTextWithOcrIfNeeded(pdfBuffer, rawText);

    // Extract Patient Info if present in PDF
    let fullName = '';
    const nameMatch = text.match(/Họ\s*tên:\s*([^\n\r]+)/i);
    if (nameMatch) {
      fullName = nameMatch[1].replace(/(?:Mã\s*số|Mii\s*số|Barcode|Số\s*CMND|Giới\s*tính)[\s\S]*$/i, '').trim();
    }

    let sampleCode = '';
    const codeMatch = text.match(/(?:Mã\s*số\s*XN|Mii\s*số\s*XN|Barcode)\s*:?\s*([^\n\r]+)/i);
    if (codeMatch) {
      const codeStr = codeMatch[1].trim();
      const mCode = codeStr.match(/(?:P'-26-)?([A-Za-z0-9]+)/i);
      if (mCode) {
        sampleCode = codeStr.replace(/^P'-26-/i, '').split(' ')[0].trim();
      }
    }

    let dob = '';
    const dobMatch = text.match(/Năm\s*sinh:\s*([^\n\r]+)/i) || text.match(/Ngày\s*sinh:\s*([^\n\r]+)/i);
    if (dobMatch) dob = dobMatch[1].trim();

    let gestationalAge = '';
    const gaMatch = text.match(/Tuổi\s*thai:\s*([^\n\r]+)/i);
    if (gaMatch) gestationalAge = gaMatch[1].trim();

    // Extract cfDNA percentage
    const cfDNA = extractCfDnaFromText(text);

    const results = this.getDefaultResults();

    const extractTrisomy = (pattern) => {
      const lines = text.split(/\r?\n/);
      for (const line of lines) {
        if (new RegExp(pattern, 'i').test(line)) {
          const decMatch = line.match(/(?:Z-score|<3|< 3|>3|> 3)[\s\S]*?(-?[0-9]+[.,][0-9]{2,3})/i) || line.match(/(-?[0-9]+[.,][0-9]{2,3})/);
          if (decMatch) {
            let risk = 'Nguy cơ thấp';
            if (/nguy\s*cơ\s*cao/i.test(line)) risk = 'Nguy cơ cao';
            return { value: decMatch[1].replace(',', '.'), risk };
          }
        }
      }
      return null;
    };

    const t21 = extractTrisomy('Trisomy 21|HC Down');
    if (t21) {
      results.t21.value = t21.value;
      results.t21.risk = t21.risk;
    }

    const t18 = extractTrisomy('Trisomy 18|HC Edwards');
    if (t18) {
      results.t18.value = t18.value;
      results.t18.risk = t18.risk;
    }

    const t13 = extractTrisomy('Trisomy 13|HC Patau');
    if (t13) {
      results.t13.value = t13.value;
      results.t13.risk = t13.risk;
    }

    // Extract Sex Chromosomes
    const turner = extractTrisomy('Turner|45,\\s*XO|\\(XO\\)|XO');
    if (turner) {
      results.turner.value = turner.value;
      results.turner.risk = turner.risk;
    }

    const klinefelter = extractTrisomy('Klinefelter|47,\\s*XXY|XXY');
    if (klinefelter) {
      results.klinefelter.value = klinefelter.value;
      results.klinefelter.risk = klinefelter.risk;
    }

    const jacobs = extractTrisomy('Jacobs|47,\\s*XYY|XYY');
    if (jacobs) {
      results.jacobs.value = jacobs.value;
      results.jacobs.risk = jacobs.risk;
    }

    const tripleX = extractTrisomy('siêu\\s*nữ|Trisomy\\s*X|47,\\s*XXX|XXX|Triple\\s*X');
    if (tripleX) {
      results.tripleX.value = tripleX.value;
      results.tripleX.risk = tripleX.risk;
    }

    // Extract 19 other Trisomies
    const otherKeys = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22];
    for (const num of otherKeys) {
      const match = extractTrisomy(`Trisomy\\s*${num}\\b`);
      if (match) {
        results.otherTrisomies[`t${num}`].value = match.value;
        results.otherTrisomies[`t${num}`].risk = match.risk;
      }
    }

    // Extract Microdeletions/Duplications
    const candidateLines = [];
    const textLines = text.split(/\r?\n/);

    for (const rawLine of textLines) {
      const line = rawLine.trim();
      if (!line || line.length < 4) continue;

      if (/Trisomy|Z-score|Zscore|HC\s*(Down|Edwards|Patau|Turner|Klinefelter|Jacobs|siêu|XO|XXY|XYY|XXX)|Lệch\s*bội\s*phổ\s*biến|Lệch\s*bội\s*NST\s*giới|Lệch\s*bội\s*NST\s*khác|Thông\s*tin|BÁO\s*CÁO|Phương\s*pháp|Khoảng\s*giá\s*trị|Tình\s*trạng|Họ\s*tên|Mã\s*số\s*XN|Tuổi\s*thai|BS\s*chỉ\s*định|Trang\s+[0-9]+|cfDNA|QC:|Passed|NIPT|Phòng\s*Xét\s*nghiệm|Viện\s*Công\s*Nghệ|CÔNG\s*TY|Hotline|Website|Hoàng\s*Quốc\s*Việt|gmail|email|Địa\s*chỉ|Điện\s*thoại|SĐT/i.test(line)) {
        continue;
      }

      // A valid microdeletion table line MUST contain a threshold indicator (< 5, < 7, < 3, 5%, 7%, 3%) OR a result/risk keyword
      const refMatch = line.match(/(<\s*[0-9]+(?:[.,][0-9]+)?\s*%?|\b[357]\s*%)/i);
      const hasResultKw = /(?:không\s*phát\s*hiện|phát\s*hiện|nguy\s*cơ|kết\s*quả|bình\s*thường)/i.test(line);

      if (!refMatch && !hasResultKw) {
        continue; // Skip OCR noise lines!
      }

      const afterRef = refMatch ? line.slice(refMatch.index + refMatch[0].length) : line;

      const lineWithoutBands = afterRef.replace(/\b[0-9X]+[pq][0-9.a-z-]*\b/gi, '');

      // Match decimal percentage (0.91%, 0,91%), decimal number (0.91, 0,91), OR OCR 3-digit percentage (092%, 142%, 074%)
      const valMatch = lineWithoutBands.match(/(-?[0-9]+[.,][0-9]{1,3}\s*%?)/) ||
                       lineWithoutBands.match(/\b([0-9]{3}%)/) ||
                       line.replace(/\b[0-9X]+[pq][0-9.a-z-]*\b/gi, '').match(/(?:không\s*phát\s*hiện|phát\s*hiện|nguy\s*cơ)[\s\S]*?(-?[0-9]+[.,][0-9]{1,3}\s*%?|\b[0-9]{3}%)/i);

      if (valMatch) {
        let val = valMatch[1].replace(',', '.').trim();

        // Fix OCR 3-digit percentage like 092% -> 0.92%, 142% -> 1.42%
        if (/^[0-9]{3}%$/.test(val)) {
          if (val.startsWith('0')) {
            val = '0.' + val.slice(1);
          } else {
            val = val.slice(0, 1) + '.' + val.slice(1);
          }
        }

        if ((val === '5%' || val === '7%' || val === '3%' || val === '5' || val === '7' || val === '3') && !val.includes('.')) {
          continue;
        }

        const numVal = parseFloat(val);
        if (isNaN(numVal) || Math.abs(numVal) > 100) {
          continue;
        }

        if (!val.endsWith('%') && !isNaN(numVal)) val += '%';

        let risk = 'Nguy cơ thấp';
        if (/nguy\s*cơ\s*cao/i.test(line)) risk = 'Nguy cơ cao';

        let result = 'Không phát hiện';
        if (/phát\s*hiện/i.test(line) && !/không\s*phát\s*hiện/i.test(line)) {
          result = 'Phát hiện';
        }

        candidateLines.push({
          rawLine: line,
          value: val,
          risk,
          result
        });
      }
    }

    const microdeletions = MICRO_LIST.map((microItem, listIdx) => {
      const cand = candidateLines[listIdx];
      if (cand) {
        return {
          name: microItem.name,
          ref: '< 5%',
          value: cand.value,
          risk: cand.risk,
          result: cand.result
        };
      }

      return {
        name: microItem.name,
        ref: '< 5%',
        value: '0.00%',
        risk: 'Nguy cơ thấp',
        result: 'Không phát hiện'
      };
    });

    results.microdeletions = microdeletions;

    // Extract "Phiên giải kết quả:"
    let conclusion = '';
    const pgMatch = text.match(/(?:Phiên\s*giải\s*kết\s*quả|Phien\s*giai\s*ket\s*qua|Phiên\s*giải|Phien\s*giai)\s*:?/i);
    if (pgMatch) {
      const pgIndex = pgMatch.index + pgMatch[0].length;
      let rawPg = text.slice(pgIndex, pgIndex + 600);
      const stopIndex = rawPg.search(/L[ưu]{1,3}\s*[ýy]|Khuyến\s*cáo|Khuyen\s*cao|Ghi\s*chú|Ghi\s*chu|Chú\s*ý|Chu\s*y|Họ\s*tên|Ho\s*ten|Mã\s*số|Ma\s*so|Người\s*XN|Nguoi\s*XN|Trang\s+[0-9]+|1[\)\.\-\*]|2[\)\.\-\*]|\(\*\)/i);
      if (stopIndex !== -1) {
        rawPg = rawPg.slice(0, stopIndex);
      }
      conclusion = rawPg.replace(/\s+/g, ' ').trim();
      conclusion = conclusion.replace(/^(?:kết\s*qu[ảa]|ket\s*qua)\s*:?\s*/i, '').trim();
      conclusion = conclusion.replace(/(?:L[ưu]{1,3}\s*[ýy]|Khuyến\s*cáo|1[\)\.\-\*]|2[\)\.\-\*]|\(\*\))\s*:?$/i, '').trim();
    }

    if (!conclusion) {
      conclusion = 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.';
    }

    // Extract GBS result from recommendation line 2)
    const gbsResult = extractGbsResultFromText(text);

    return {
      ...(fullName ? { fullName } : {}),
      ...(sampleCode ? { sampleCode } : {}),
      ...(dob ? { dob } : {}),
      ...(gestationalAge ? { gestationalAge } : {}),
      cfDNA,
      results,
      conclusion,
      gbsResult
    };
  },

  // 3. Generate populated GeneTrust Plus PDF template (Pages 1 and 2 overlaid)
  async generatePdf(sampleData) {
    const pdfBuffer = getCachedPdfTemplate(this.templateFileName, 'KQ_NIPT_GENET Plus k mở rộng.pdf');

    const pdfDoc = await PDFDocument.load(pdfBuffer);
    pdfDoc.registerFontkit(fontkit);

    let font, fontBold;
    try {
      const { fontBytes, fontBoldBytes } = getCachedFontBytes();
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
    const cfDnaVal = sampleData.cfDNA ? `${sampleData.cfDNA}%` : '';
    drawRightTextOnPage(page1, cfDnaVal, RIGHT_COL3_X, 608.3, fontBold, 10, alertColor);

    drawRightTextOnPage(page1, formattedReceivedDate, RIGHT_COL3_X, 591.0, font, 9.5, darkColor);

    const res = sampleData.results || this.getDefaultResults();

    // Section I (T21, T18, T13)
    if (res.t21) {
      drawCenterTextOnPage(page1, res.t21.value || '', TABLE_VAL_CENTER_X, 489.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t21.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 489.3, fontBold, 9.5, (res.t21.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t18) {
      drawCenterTextOnPage(page1, res.t18.value || '', TABLE_VAL_CENTER_X, 470.8, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t18.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 470.8, fontBold, 9.5, (res.t18.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.t13) {
      drawCenterTextOnPage(page1, res.t13.value || '', TABLE_VAL_CENTER_X, 452.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.t13.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 452.3, fontBold, 9.5, (res.t13.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Section II (4 Sex Chromosomes)
    if (res.turner) {
      drawCenterTextOnPage(page1, res.turner.value || '', TABLE_VAL_CENTER_X, 380.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.turner.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 380.3, fontBold, 9.5, (res.turner.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.klinefelter) {
      drawCenterTextOnPage(page1, res.klinefelter.value || '', TABLE_VAL_CENTER_X, 364.2, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.klinefelter.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 364.2, fontBold, 9.5, (res.klinefelter.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.jacobs) {
      drawCenterTextOnPage(page1, res.jacobs.value || '', TABLE_VAL_CENTER_X, 348.1, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.jacobs.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 348.1, fontBold, 9.5, (res.jacobs.risk || '').includes('cao') ? alertColor : textColor);
    }
    if (res.tripleX) {
      drawCenterTextOnPage(page1, res.tripleX.value || '', TABLE_VAL_CENTER_X, 332.3, fontBold, 9.5, darkColor);
      drawCenterTextOnPage(page1, res.tripleX.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, 332.3, fontBold, 9.5, (res.tripleX.risk || '').includes('cao') ? alertColor : textColor);
    }

    // Medical Conclusion on Page 1
    const conclusionStr = sampleData.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.';
    page1.drawText(conclusionStr, { x: 98, y: 316.4, size: 9, font: fontBold, color: rgb(0.05, 0.25, 0.55), maxWidth: 450, lineHeight: 13 });

    // Signature Date Line on Page 1
    const formattedReportDate = formatDateVN(sampleData.reportDate);
    const dateToUse = formattedReportDate || formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);
    const dateParts = dateToUse.split('/');
    if (dateParts.length === 3) {
      page1.drawText(dateParts[0], { x: 408, y: 222.3, size: 9, font: fontBold, color: darkColor });
      page1.drawText(dateParts[1], { x: 466, y: 222.3, size: 9, font: fontBold, color: darkColor });
      page1.drawText(dateParts[2], { x: 512, y: 222.3, size: 9, font: fontBold, color: darkColor });
    }

    // Checker & Director Signatures on Page 1
    const CHECKER_CENTER_X = 149.0;
    const DIRECTOR_CENTER_X = 442.0;
    if (sampleData.checkerName) {
      drawCenterTextOnPage(page1, sampleData.checkerName, CHECKER_CENTER_X, 135.0, fontBold, 9.5, darkColor);

      const checkerSigBytes = getCachedCheckerSignatureBytes();
      if (checkerSigBytes) {
        try {
          const cSigImage = await pdfDoc.embedPng(checkerSigBytes);
          const cSigDims = cSigImage.scaleToFit(85, 85);
          page1.drawImage(cSigImage, {
            x: CHECKER_CENTER_X - (cSigDims.width / 2),
            y: 125.0,
            width: cSigDims.width,
            height: cSigDims.height,
          });
        } catch (cErr) {
          console.error('Error embedding checker signature:', cErr);
        }
      }
    }
    if (sampleData.directorName) {
      drawCenterTextOnPage(page1, sampleData.directorName, DIRECTOR_CENTER_X, 135.0, fontBold, 9.5, darkColor);

      const sigBytes = getCachedDirectorSignatureBytes(sampleData.directorName);
      if (sigBytes) {
        try {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const sigDims = sigImage.scaleToFit(175, 82);
          page1.drawImage(sigImage, {
            x: DIRECTOR_CENTER_X - (sigDims.width / 2),
            y: 127.0,
            width: sigDims.width,
            height: sigDims.height,
          });
        } catch (sErr) {
          console.error('Error embedding director signature:', sErr);
        }
      }
    }
    if (sampleData.hasMstStamp) {
      try {
        const mstStampBytes = getCachedMstStampBytes();
        const mstImage = await pdfDoc.embedPng(mstStampBytes);
        page1.drawImage(mstImage, {
          x: 215,
          y: 131,
          width: 250,
          height: 80,
        });
      } catch (err) {
        console.error('Error embedding MST stamp:', err);
      }
    }

    // Header info ONLY on Page 2 (where HỌ VÀ TÊN and BARCODE header bar exists)
    if (page2) {
      page2.drawText(sampleData.fullName || '', { x: 120.0, y: 760.5, size: 10.5, font: fontBold, color: textColor });
      page2.drawText(sampleData.sampleCode || '', { x: 465.0, y: 760.5, size: 10.5, font: fontBold, color: textColor });
    }

    // Page 2 Section III (19 Other Trisomies)
    if (page2) {
      const otherTrisomiesCoords = {
        t1: 694.3, t2: 675.3, t3: 656.1, t4: 637.2, t5: 618.2, t6: 599.2, t7: 580.3,
        t8: 561.3, t9: 542.1, t10: 523.1, t11: 504.1, t12: 485.2, t14: 466.2, t15: 447.3,
        t16: 428.3, t17: 409.1, t19: 390.1, t20: 371.2, t22: 352.2
      };

      const others = res.otherTrisomies || {};
      for (const [key, yPos] of Object.entries(otherTrisomiesCoords)) {
        const item = others[key];
        if (item) {
          drawCenterTextOnPage(page2, item.value || '', TABLE_VAL_CENTER_X, yPos, fontBold, 9.5, darkColor);
          const isAlert = (item.risk || '').toLowerCase().includes('cao');
          drawCenterTextOnPage(page2, item.risk || 'Nguy cơ thấp', TABLE_RISK_CENTER_X, yPos, fontBold, 9.5, isAlert ? alertColor : textColor);
        }
      }
    }

    // Overlay Microdeletions / Duplications across Pages 2, 3, 4, 5, 6
    const microResults = res.microdeletions || sampleData.microdeletions || [];
    const TABLE_MICRO_VAL_CENTER_X = 350.0;
    const TABLE_MICRO_RISK_CENTER_X = 468.0;

    const normalizeStr = (str) => {
      if (!str) return '';
      return String(str)
        .toLowerCase()
        .replace(/[áàảãạâấầẩẫậăắằẳẵặ]/g, 'a')
        .replace(/[éèẻẽẹêếềểễệ]/g, 'e')
        .replace(/[íìỉĩị]/g, 'i')
        .replace(/[óòỏõọôốồổỗộơớờởỡợ]/g, 'o')
        .replace(/[úùủũụưứừửữự]/g, 'u')
        .replace(/[ýỳỷỹỵ]/g, 'y')
        .replace(/đ/g, 'd')
        .replace(/hoi\s*chung|syndrome|chromosome|microdeletion|triplication/g, '')
        .replace(/[^a-z0-9]/g, '');
    };

    MICRO_LIST.forEach((microItem, listIdx) => {
      const targetPage = pages[microItem.pageIdx];
      if (!targetPage) return;

      let foundMatch = microResults[listIdx];

      if (!foundMatch) {
        const itemNorm = normalizeStr(microItem.name);
        foundMatch = microResults.find((m) => {
          if (!m) return false;
          const mName = typeof m === 'string' ? m : (m.name || '');
          if (!mName) return false;

          const mNorm = normalizeStr(mName);
          if (mNorm && itemNorm && mNorm === itemNorm) {
            return true;
          }

          return false;
        });
      }

      let valToDraw = '0.00%';
      let textToDraw = 'Không phát hiện';
      let isAlert = false;

      if (foundMatch) {
        if (typeof foundMatch === 'object') {
          valToDraw = foundMatch.value || foundMatch.analysisValue || foundMatch.zScore || '0.00%';
          if (foundMatch.result) {
            textToDraw = foundMatch.result;
          } else if (foundMatch.risk) {
            textToDraw = foundMatch.risk;
          }
        } else if (typeof foundMatch === 'string') {
          textToDraw = foundMatch;
        }
      }

      if (valToDraw && !valToDraw.endsWith('%') && !isNaN(parseFloat(valToDraw))) {
        valToDraw += '%';
      }

      const lowerRes = (textToDraw || '').toLowerCase();
      if (
        lowerRes.includes('cao') ||
        (lowerRes.includes('phát hiện') && !lowerRes.includes('không phát hiện')) ||
        lowerRes.includes('bất thường') ||
        lowerRes.includes('dương tính')
      ) {
        isAlert = true;
      }

      // Column 3: Giá trị phân tích (Center X = 350.0)
      drawCenterTextOnPage(
        targetPage,
        valToDraw,
        TABLE_MICRO_VAL_CENTER_X,
        microItem.y,
        font,
        8.5,
        darkColor
      );

      // Column 4: Kết quả (Center X = 468.0)
      drawCenterTextOnPage(
        targetPage,
        textToDraw,
        TABLE_MICRO_RISK_CENTER_X,
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
