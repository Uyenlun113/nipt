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
      const zScoreIdx = line.search(/Z-score|Z\s*</i);
      if (zScoreIdx !== -1) {
        const afterRef = line.slice(zScoreIdx).replace(/Z-score\s*<\s*3/i, '').replace(/Z-score/i, '').replace(/Z\s*<\s*3/i, '');
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
    const turner = extractTrisomy('(?:Turner|XO)');
    if (turner) {
      results.turner.value = turner.value;
      results.turner.risk = turner.risk;
    }

    const klinefelter = extractTrisomy('(?:Klinefelter|XXY)');
    if (klinefelter) {
      results.klinefelter.value = klinefelter.value;
      results.klinefelter.risk = klinefelter.risk;
    }

    const jacobs = extractTrisomy('(?:Jacobs|XYY)');
    if (jacobs) {
      results.jacobs.value = jacobs.value;
      results.jacobs.risk = jacobs.risk;
    }

    const tripleX = extractTrisomy('(?:siêu nữ|Triple X|XXX)');
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
    const pgMatch = text.match(/(?:Phiên\s*giải\s*kết\s*quả|Phien\s*giai\s*ket\s*qua|Phiên\s*giải|Phien\s*giai)\s*:?/i);
    if (pgMatch) {
      const pgIndex = pgMatch.index + pgMatch[0].length;
      let rawPg = text.slice(pgIndex, pgIndex + 600);
      const stopIndex = rawPg.search(/L[ưu]{1,3}\s*[ýy]|Khuyến\s*cáo|Khuyen\s*cao|Ghi\s*chú|Ghi\s*chu|Chú\s*ý|Chu\s*y|Họ\s*tên|Ho\s*ten|Mã\s*số|Ma\s*so|Người\s*XN|Nguoi\s*XN|Trang\s+[0-9]+|1[\)\.\-\*]|2[\)\.\-\*]|\(\*\)/i);
      if (stopIndex !== -1) {
        rawPg = rawPg.slice(0, stopIndex);
      }
      conclusion = rawPg.replace(/\s+/g, ' ').trim();
      conclusion = conclusion.replace(/(?:L[ưu]{1,3}\s*[ýy]|Khuyến\s*cáo|1[\)\.\-\*]|2[\)\.\-\*]|\(\*\))\s*:?$/i, '').trim();
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

    // 102 Microdeletions / Duplications list (Pages 2 - 6)
    const MICRO_LIST = [
  {
    "name": "Chromosome 1p32 - p31 deletion syndrome",
    "pageIdx": 1,
    "y": 247
  },
  {
    "name": "Chromosome 1 q41 - q42 deletion syndrome",
    "pageIdx": 1,
    "y": 215
  },
  {
    "name": "Chromosome 2p12 - p11.2 deletion syndrome",
    "pageIdx": 1,
    "y": 182
  },
  {
    "name": "Chromosome 2q duplication",
    "pageIdx": 1,
    "y": 155
  },
  {
    "name": "Chromosome 2q24 deletion syndrome",
    "pageIdx": 1,
    "y": 133
  },
  {
    "name": "Split - hand/foot malformation 5",
    "pageIdx": 1,
    "y": 111
  },
  {
    "name": "Chromosome 2q35 duplication syndrome",
    "pageIdx": 1,
    "y": 84
  },
  {
    "name": "Holoprosencephaly 6",
    "pageIdx": 2,
    "y": 761
  },
  {
    "name": "Chromosome 3 pter - p25 deletion syndrome",
    "pageIdx": 2,
    "y": 734
  },
  {
    "name": "Distal duplication of chromosome 3p",
    "pageIdx": 2,
    "y": 707
  },
  {
    "name": "Chromosome 3q duplication",
    "pageIdx": 2,
    "y": 684
  },
  {
    "name": "Dandy - Walker syndrome",
    "pageIdx": 2,
    "y": 662
  },
  {
    "name": "Chromosome 3 q26 - q27 deletion syndrome",
    "pageIdx": 2,
    "y": 635
  },
  {
    "name": "Chromosome 4p duplication",
    "pageIdx": 2,
    "y": 608
  },
  {
    "name": "Distal deletion of chromosome 4q",
    "pageIdx": 2,
    "y": 586
  },
  {
    "name": "Distal duplication of chromosome 4q",
    "pageIdx": 2,
    "y": 563
  },
  {
    "name": "Chromosome 4q21 deletion syndrome",
    "pageIdx": 2,
    "y": 541
  },
  {
    "name": "Chromosome 5p duplication",
    "pageIdx": 2,
    "y": 519
  },
  {
    "name": "Chromosome 5p13 duplication",
    "pageIdx": 2,
    "y": 497
  },
  {
    "name": "Chromosome 5q14.3 deletion syndrome",
    "pageIdx": 2,
    "y": 475
  },
  {
    "name": "Chromosome 5q23 deletion syndrome",
    "pageIdx": 2,
    "y": 453
  },
  {
    "name": "Chromosome 6 pter - p24 deletion syndrome",
    "pageIdx": 2,
    "y": 426
  },
  {
    "name": "Chromosome 6p deletion",
    "pageIdx": 2,
    "y": 398
  },
  {
    "name": "Chromosome 6 q11 - q14 deletion syndrome",
    "pageIdx": 2,
    "y": 371
  },
  {
    "name": "Chromosome 6 q1 5 - q 23 deletion syndrome",
    "pageIdx": 2,
    "y": 339
  },
  {
    "name": "Chromosome 6 q 24 - q 2 5 deletion syndrome",
    "pageIdx": 2,
    "y": 306
  },
  {
    "name": "Chromosome 6 q 2 5 - q ter deletion syndrome",
    "pageIdx": 2,
    "y": 274
  },
  {
    "name": "Chromosome 7q deletion",
    "pageIdx": 2,
    "y": 247
  },
  {
    "name": "Chromosome 7q 21 - q32 deletion syndrome",
    "pageIdx": 2,
    "y": 219
  },
  {
    "name": "Chromosome 7q31 deletion syndrome",
    "pageIdx": 2,
    "y": 192
  },
  {
    "name": "Chromosome 8p duplication",
    "pageIdx": 2,
    "y": 170
  },
  {
    "name": "Chromosome 8q duplication",
    "pageIdx": 2,
    "y": 148
  },
  {
    "name": "Chromosome 8 q 12.1 - q21.2 deletion syndrome",
    "pageIdx": 2,
    "y": 121
  },
  {
    "name": "Chromosome 9p duplication",
    "pageIdx": 2,
    "y": 93
  },
  {
    "name": "Chromosome 9p deletion syndrome",
    "pageIdx": 2,
    "y": 71
  },
  {
    "name": "Chromosome 10p duplication",
    "pageIdx": 3,
    "y": 761
  },
  {
    "name": "Chromosome 10 p12.1 - p11 deletion syndrome",
    "pageIdx": 3,
    "y": 734
  },
  {
    "name": "Chromosome 10q22.3 - q23. 2 deletion syndrome",
    "pageIdx": 3,
    "y": 701
  },
  {
    "name": "Chromosome 10q22.3 - q23.3 duplication syndrome",
    "pageIdx": 3,
    "y": 669
  },
  {
    "name": "Chromosome 10q26 deletion syndrome",
    "pageIdx": 3,
    "y": 641
  },
  {
    "name": "WAGRO syndrome",
    "pageIdx": 3,
    "y": 619
  },
  {
    "name": "Jacobsen syndrome",
    "pageIdx": 3,
    "y": 597
  },
  {
    "name": "Chromosome 12p duplication",
    "pageIdx": 3,
    "y": 575
  },
  {
    "name": "Chromosome 13q14 deletion",
    "pageIdx": 3,
    "y": 553
  },
  {
    "name": "Chromosome 1 4 q 11 - q22 deletion syndrome",
    "pageIdx": 3,
    "y": 526
  },
  {
    "name": "Chromosome 14q duplication",
    "pageIdx": 3,
    "y": 499
  },
  {
    "name": "Proximal deletion of chromosome 14q",
    "pageIdx": 3,
    "y": 477
  },
  {
    "name": "Chromosome 14q32 duplication",
    "pageIdx": 3,
    "y": 455
  },
  {
    "name": "Chromosome 15q 11 - q13 duplication syndrome",
    "pageIdx": 3,
    "y": 427
  },
  {
    "name": "Chromosome 15q25 deletion syndrome",
    "pageIdx": 3,
    "y": 400
  },
  {
    "name": "Distal deletion of chromosome 15q",
    "pageIdx": 3,
    "y": 378
  },
  {
    "name": "Levy - Shanske syndrome",
    "pageIdx": 3,
    "y": 356
  },
  {
    "name": "Chromosome 1 5q26 - qter deletion syndrome",
    "pageIdx": 3,
    "y": 329
  },
  {
    "name": "Chromosome 16p deletion syndrome",
    "pageIdx": 3,
    "y": 301
  },
  {
    "name": "Proximal duplication of chromosome 16q",
    "pageIdx": 3,
    "y": 274
  },
  {
    "name": "Chromosome 17p duplication",
    "pageIdx": 3,
    "y": 247
  },
  {
    "name": "Chromosome 18p deletion syndrome",
    "pageIdx": 3,
    "y": 225
  },
  {
    "name": "Chromosome 18q deletion syndrome",
    "pageIdx": 3,
    "y": 202
  },
  {
    "name": "Chromosome 20p duplication",
    "pageIdx": 3,
    "y": 180
  },
  {
    "name": "Cat - Eye syndrome",
    "pageIdx": 3,
    "y": 158
  },
  {
    "name": "Chromosome 1p31 duplication syndrome",
    "pageIdx": 3,
    "y": 110
  },
  {
    "name": "Chromosome 1p21.3 deletion syndrome",
    "pageIdx": 3,
    "y": 83
  },
  {
    "name": "Chromosome 1p 36 deletion syndrome",
    "pageIdx": 4,
    "y": 761
  },
  {
    "name": "Chromosome 2p16.1 - p15 deletion syndrome",
    "pageIdx": 4,
    "y": 734
  },
  {
    "name": "Chromosome 2q31.1 duplication syndrome",
    "pageIdx": 4,
    "y": 701
  },
  {
    "name": "Chromosome 2q33.1 deletion syndrome",
    "pageIdx": 4,
    "y": 674
  },
  {
    "name": "Chromosome 3q13.31 deletion syndrome",
    "pageIdx": 4,
    "y": 652
  },
  {
    "name": "Chromosome 3q29 duplication syndrome",
    "pageIdx": 4,
    "y": 625
  },
  {
    "name": "Chromosome 3q29 deletion syndrome",
    "pageIdx": 4,
    "y": 597
  },
  {
    "name": "Wolf - Hirschhorn syndrome",
    "pageIdx": 4,
    "y": 575
  },
  {
    "name": "Chromosome 4q32.1 - q32.2 triplication syndrome",
    "pageIdx": 4,
    "y": 548
  },
  {
    "name": "Cri - du - chat syndrome",
    "pageIdx": 4,
    "y": 521
  },
  {
    "name": "Chromosome 5q12 deletion syndrome",
    "pageIdx": 4,
    "y": 499
  },
  {
    "name": "CHDM",
    "pageIdx": 4,
    "y": 477
  },
  {
    "name": "Chromosome 7q11.23 deletion syndrome",
    "pageIdx": 4,
    "y": 455
  },
  {
    "name": "Chromosome 7q11.23 duplication syndrome",
    "pageIdx": 4,
    "y": 427
  },
  {
    "name": "Chromosome 8p23.1 deletion syndrome",
    "pageIdx": 4,
    "y": 400
  },
  {
    "name": "Chromosome 8p23.1 duplication syndrome",
    "pageIdx": 4,
    "y": 373
  },
  {
    "name": "Chromosome 8q22.1 duplication syndrome",
    "pageIdx": 4,
    "y": 340
  },
  {
    "name": "Chromosome 8q22.1 deletion syndrome",
    "pageIdx": 4,
    "y": 313
  },
  {
    "name": "Langer - Giedion syndrome",
    "pageIdx": 4,
    "y": 291
  },
  {
    "name": "Chromosome 8q24.3 deletion syndrome",
    "pageIdx": 4,
    "y": 269
  },
  {
    "name": "DiGeorge syndrome 2",
    "pageIdx": 4,
    "y": 247
  },
  {
    "name": "WAGR syndrome",
    "pageIdx": 4,
    "y": 225
  },
  {
    "name": "Potocki - Shaffer syndrome",
    "pageIdx": 4,
    "y": 202
  },
  {
    "name": "Chromosome 11q22.2 - q22.3 deletion syndrome",
    "pageIdx": 4,
    "y": 175
  },
  {
    "name": "Chromosome 12p12.1 deletion syndrome",
    "pageIdx": 4,
    "y": 148
  },
  {
    "name": "Chromosome 12q14 microdeletion syndrome",
    "pageIdx": 4,
    "y": 121
  },
  {
    "name": "Distal deletion of chromosome",
    "pageIdx": 4,
    "y": 95
  },
  {
    "name": "Frias syndrome",
    "pageIdx": 4,
    "y": 72
  },
  {
    "name": "Prader - Willi syndrome",
    "pageIdx": 5,
    "y": 761
  },
  {
    "name": "Angelman syndrome",
    "pageIdx": 5,
    "y": 739
  },
  {
    "name": "Chromosome 15q24 deletion syndrome",
    "pageIdx": 5,
    "y": 717
  },
  {
    "name": "Chromosome 15q14 deletion syndrome",
    "pageIdx": 5,
    "y": 695
  },
  {
    "name": "HCD",
    "pageIdx": 5,
    "y": 673
  },
  {
    "name": "Chromosome 16p13.3 deletion syndrome",
    "pageIdx": 5,
    "y": 651
  },
  {
    "name": "Chromosome 16p12.2 - p11.2 microduplication syndrome",
    "pageIdx": 5,
    "y": 623
  },
  {
    "name": "Chromosome 16p12.2 - p11.2 deletion syndrome",
    "pageIdx": 5,
    "y": 591
  },
  {
    "name": "Chromosome 16q22 deletion syndrome",
    "pageIdx": 5,
    "y": 563
  },
  {
    "name": "Chromosome 17p13.3 deletion syndrome",
    "pageIdx": 5,
    "y": 541
  },
  {
    "name": "Chromosome 17p13.3 duplication syndrome",
    "pageIdx": 5,
    "y": 514
  },
  {
    "name": "Smith - Magenis syndrome",
    "pageIdx": 5,
    "y": 487
  },
  {
    "name": "Potocki - Lupski syndrome",
    "pageIdx": 5,
    "y": 465
  },
  {
    "name": "Chromosome 17q12 deletion syndrome",
    "pageIdx": 5,
    "y": 443
  },
  {
    "name": "Chromosome 17q12 duplication syndrome",
    "pageIdx": 5,
    "y": 415
  },
  {
    "name": "Chromosome 17q21.31 duplication syndrome",
    "pageIdx": 5,
    "y": 383
  },
  {
    "name": "Chromosome 17q23.1 - q23.2 deletion syndrome",
    "pageIdx": 5,
    "y": 351
  },
  {
    "name": "Yuan - Harel - Lupski syndrome",
    "pageIdx": 5,
    "y": 323
  },
  {
    "name": "Chromosome 19q13.11 deletion syndrome",
    "pageIdx": 5,
    "y": 296
  },
  {
    "name": "Holoprosencephaly 1",
    "pageIdx": 5,
    "y": 269
  },
  {
    "name": "DiGeorge syndrome",
    "pageIdx": 5,
    "y": 247
  },
  {
    "name": "Chromosome 22q11.2 duplication syndrome",
    "pageIdx": 5,
    "y": 219
  },
  {
    "name": "Chromosome 22q11.2 deletion syndrome",
    "pageIdx": 5,
    "y": 192
  },
  {
    "name": "Chromosome X q 22 .2 - p22.13 duplication syndrome",
    "pageIdx": 5,
    "y": 165
  },
  {
    "name": "Chromosome Xq27.3 - q28 duplication syndrome",
    "pageIdx": 5,
    "y": 132
  },
  {
    "name": "Chromosome Xq28 duplication syndrome",
    "pageIdx": 5,
    "y": 100
  },
  {
    "name": "Chromosome Xp21 deletion syndrome",
    "pageIdx": 5,
    "y": 73
  },
  {
    "name": "Chromosome Xp11.3 deletion syndrome",
    "pageIdx": 6,
    "y": 761
  },
  {
    "name": "Chromosome Xp11. 23 - p11.22 duplication syndrome",
    "pageIdx": 6,
    "y": 734
  },
  {
    "name": "Chromosome Xq21 deletion syndrome",
    "pageIdx": 6,
    "y": 707
  },
  {
    "name": "Chromosome Xq2 2.3 telomeric deletion syndrome",
    "pageIdx": 6,
    "y": 683
  },
  {
    "name": "Chromosome Xq28 deletion syndrome",
    "pageIdx": 6,
    "y": 659
  }
];

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
    const microResults = res.microdeletions || [];
    const TABLE_MICRO_VAL_CENTER_X = 350.0;
    const TABLE_MICRO_RISK_CENTER_X = 468.0;

    MICRO_LIST.forEach((microItem) => {
      const targetPage = pages[microItem.pageIdx];
      if (!targetPage) return;

      const foundMatch = microResults.find(m => {
        if (!m.name) return false;
        const mClean = m.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        const itemClean = microItem.name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return mClean.includes(itemClean) || itemClean.includes(mClean);
      });

      let valToDraw = '';
      let textToDraw = 'Không phát hiện';
      let isAlert = false;

      if (foundMatch) {
        valToDraw = foundMatch.value || foundMatch.analysisValue || foundMatch.zScore || '';
        if (foundMatch.result) {
          textToDraw = foundMatch.result;
        } else if (foundMatch.risk) {
          textToDraw = foundMatch.risk;
        }
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
      if (valToDraw) {
        drawCenterTextOnPage(
          targetPage,
          valToDraw,
          TABLE_MICRO_VAL_CENTER_X,
          microItem.y,
          font,
          8.5,
          darkColor
        );
      }

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
