import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParse from 'pdf-parse';
import { extractTextWithOcrIfNeeded } from '../ocr-helper.js';
import { formatDateVN } from '../date-utils.js';
import { getCachedFontBytes, getCachedPdfTemplate, getCachedMstStampBytes, getCachedDirectorSignatureBytes, getCachedCheckerSignatureBytes } from '../file-cache.js';

export const thalassemiaPackageHandler = {
  id: 'Thalassemia',
  name: 'Sàng lọc người mang gen Thalassemia',
  templateFileName: 'Thalassemia.pdf',

  getDefaultResults() {
    return {
      disease_1: {
        label: 'Alpha-Thalassemia: SEA, -3.7, -4.2 và 110 đột biến điểm vùng mã hóa.',
        gene: 'HBA1 & HBA2',
        nst: '16p13.3',
        value: 'Chưa phát hiện đột biến trong vùng được khảo sát'
      },
      disease_2: {
        label: 'Beta-Thalassemia: Khảo sát 377 đột biến điểm vùng mã hóa và 4 đột biến điểm vùng intron (*)',
        gene: 'HBB',
        nst: '11p15.4',
        value: 'Chưa phát hiện đột biến trong vùng được khảo sát'
      }
    };
  },

  // ONLY extract results & conclusion from uploaded PDF (Do NOT extract customer info)
  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text || '';
    const text = await extractTextWithOcrIfNeeded(pdfBuffer, rawText);

    const defaultResults = this.getDefaultResults();
    const results = {};

    let conclusion = '';
    const klMatch = text.match(/KẾT\s*LUẬN\s*[\s\S]*?(?=LƯU\s*Ý|Ngày|KIỂM\s*SOÁT|$)/i);
    if (klMatch) {
      let rawKl = klMatch[0].replace(/^KẾT\s*LUẬN\s*:?/i, '').trim();
      conclusion = rawKl.replace(/\s+/g, ' ').trim();
    }
    conclusion = conclusion.replace(/^(KẾT\s*LUẬN|Kết\s*quả)\s*:?\s*/i, '').trim();
    if (!conclusion) {
      conclusion = 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.';
    }

    const lines = text.split(/\r?\n/);
    
    // Parse Alpha result
    let valAlpha = defaultResults.disease_1.value;
    for (const line of lines) {
      if (/Alpha/i.test(line)) {
        if (/Phát\s*hiện\s*đột\s*biến|Mang\s*gen|Dương\s*tính/i.test(line)) {
          const m = line.match(/(Phát\s*hiện[^\.\n\r]+|Mang\s*gen[^\.\n\r]+|Dương\s*tính[^\.\n\r]+)/i);
          if (m) valAlpha = m[1].trim();
        } else if (/Chưa\s*phát\s*hiện/i.test(line)) {
          valAlpha = 'Chưa phát hiện đột biến trong vùng được khảo sát';
        }
      }
    }
    results.disease_1 = { ...defaultResults.disease_1, value: valAlpha };

    // Parse Beta result
    let valBeta = defaultResults.disease_2.value;
    for (const line of lines) {
      if (/Beta/i.test(line)) {
        if (/Phát\s*hiện\s*đột\s*biến|Mang\s*gen|Dương\s*tính/i.test(line)) {
          const m = line.match(/(Phát\s*hiện[^\.\n\r]+|Mang\s*gen[^\.\n\r]+|Dương\s*tính[^\.\n\r]+)/i);
          if (m) valBeta = m[1].trim();
        } else if (/Chưa\s*phát\s*hiện/i.test(line)) {
          valBeta = 'Chưa phát hiện đột biến trong vùng được khảo sát';
        }
      }
    }
    results.disease_2 = { ...defaultResults.disease_2, value: valBeta };

    return {
      results,
      conclusion
    };
  },

  async generatePdf(sampleData) {
    const pdfBuffer = getCachedPdfTemplate(this.templateFileName, 'Thalassemia.pdf');

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

    const textColor = rgb(0.05, 0.15, 0.35); // GeneTrust dark blue accent
    const darkColor = rgb(0.1, 0.1, 0.1);

    const formattedDob = formatDateVN(sampleData.dob) || sampleData.dob;
    const formattedSamplingDate = formatDateVN(sampleData.samplingDate);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate) || formattedSamplingDate;
    const formattedReportDate = formatDateVN(sampleData.reportDate) || formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);

    // Helper functions for alignment matching 20GA / NIPT packages
    const drawRightText = (text, rightX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      page1.drawText(str, { x: rightX - textWidth, y, size, font: selectedFont, color });
    };

    const drawCenterWrappedText = (text, centerX, startY, selectedFont, size, color, maxWidth = 170, lineHeight = 11) => {
      if (!text) return;
      const words = String(text).split(' ');
      let lines = [];
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const testWidth = selectedFont.widthOfTextAtSize(testLine, size);
        if (testWidth > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      let y = startY;
      if (lines.length > 1) {
        y = startY + ((lines.length - 1) * lineHeight) / 2;
      }

      for (let i = 0; i < lines.length; i++) {
        const lineStr = lines[i];
        const textWidth = selectedFont.widthOfTextAtSize(lineStr, size);
        page1.drawText(lineStr, {
          x: centerX - (textWidth / 2),
          y: y - (i * lineHeight),
          size,
          font: selectedFont,
          color
        });
      }
    };

    const RIGHT_COL1_X = 235;
    const RIGHT_COL2_X = 390;
    const RIGHT_COL3_X = 565;

    // 1. THÔNG TIN KHÁCH HÀNG (Banner 1)
    // Row 1 (y = 731.0)
    drawRightText(sampleData.fullName || '', RIGHT_COL1_X, 731.0, fontBold, 9.5, textColor);
    drawRightText(formattedDob, RIGHT_COL2_X, 731.0, font, 9.5, darkColor);
    drawRightText(sampleData.idCard || '', RIGHT_COL3_X, 731.0, font, 9.5, darkColor);

    // Row 2 (y = 711.5)
    drawRightText(sampleData.phone || '', RIGHT_COL1_X, 711.5, font, 9.5, darkColor);
    drawRightText(sampleData.gender || '', RIGHT_COL2_X, 711.5, font, 9.5, darkColor);
    drawRightText(sampleData.address || '', RIGHT_COL3_X, 711.5, font, 8.5, darkColor);

    // 2. THÔNG TIN MẪU (Banner 2)
    // Row 1 (y = 673.0)
    drawRightText(sampleData.packageType || 'Thalassemia', RIGHT_COL1_X, 673.0, fontBold, 9.5, textColor);
    drawRightText(sampleData.sampleCode || '', RIGHT_COL2_X, 673.0, fontBold, 9.5, textColor);
    drawRightText(formattedSamplingDate, RIGHT_COL3_X, 673.0, font, 9.5, darkColor);

    // Row 2 (y = 654.5)
    drawRightText(sampleData.doctorName || '', RIGHT_COL1_X, 654.5, font, 9.5, darkColor);
    drawRightText(sampleData.agencyCode || '', RIGHT_COL2_X, 654.5, font, 9.5, darkColor);
    drawRightText(formattedReceivedDate, RIGHT_COL3_X, 654.5, font, 9.5, darkColor);

    // Row 3 (y = 635.5)
    drawRightText(sampleData.facilityName || '', RIGHT_COL1_X, 635.5, font, 8.5, darkColor);

    // 3. KẾT QUẢ XẾT NGHIỆM (Cell center alignment at x = 472.5)
    const defaultResults = this.getDefaultResults();
    const res = sampleData.results || defaultResults;

    const valAlpha = res?.disease_1?.value || defaultResults.disease_1.value;
    const valBeta = res?.disease_2?.value || defaultResults.disease_2.value;

    const TABLE_CENTER_X = 472.5;

    // Row 1 (Alpha-thalassemia)
    drawCenterWrappedText(valAlpha, TABLE_CENTER_X, 538.0, font, 8.5, darkColor, 170, 11);

    // Row 2 (Beta-thalassemia - vertically centered in 45pt cell)
    drawCenterWrappedText(valBeta, TABLE_CENTER_X, 497.0, font, 8.5, darkColor, 170, 11);

    // 4. KẾT LUẬN (Same line right after "KẾT LUẬN:" header at x = 98, y = 448.0)
    let conclusionStr = (sampleData.conclusion || '').replace(/^(KẾT\s*LUẬN|Kết\s*quả)\s*:?\s*/i, '').trim();
    if (!conclusionStr) {
      conclusionStr = 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.';
    }
    page1.drawText(conclusionStr, {
      x: 98,
      y: 448.0,
      size: 9.5,
      font,
      color: darkColor,
      maxWidth: 460
    });

    // 5. FOOTER (Report Date & Signatures)
    // Date at y = 202.0
    const dateParts = formattedReportDate ? formattedReportDate.split('/') : [];
    if (dateParts.length === 3) {
      page1.drawText(dateParts[0], { x: 407, y: 202.0, size: 9.5, font, color: darkColor });
      page1.drawText(dateParts[1], { x: 455, y: 202.0, size: 9.5, font, color: darkColor });
      page1.drawText(dateParts[2].slice(-2), { x: 505, y: 202.0, size: 9.5, font, color: darkColor });
    }

    const directorToUse = sampleData.directorName || '';
    const checkerToUse = sampleData.checkerName || '';
    const hasMstStamp = !!sampleData.hasMstStamp;

    const CHECKER_CENTER_X = 161.0;
    const DIRECTOR_CENTER_X = 441.0;

    const drawCenterText = (text, centerX, y, selectedFont, size, color) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      page1.drawText(str, { x: centerX - (textWidth / 2), y, size, font: selectedFont, color });
    };

    try {
      if (directorToUse) {
        drawCenterText(directorToUse, DIRECTOR_CENTER_X, 115.0, fontBold, 9.5, darkColor);

        const sigBytes = getCachedDirectorSignatureBytes(directorToUse);
        if (sigBytes) {
          const sigImage = await pdfDoc.embedPng(sigBytes);
          const sigDims = sigImage.scaleToFit(180, 80);
          page1.drawImage(sigImage, {
            x: DIRECTOR_CENTER_X - (sigDims.width / 2),
            y: 120.0,
            width: sigDims.width,
            height: sigDims.height,
          });
        }
      }

      if (checkerToUse) {
        drawCenterText(checkerToUse, CHECKER_CENTER_X, 115.0, fontBold, 9.5, darkColor);

        const checkerSigBytes = getCachedCheckerSignatureBytes();
        if (checkerSigBytes) {
          const cSigImage = await pdfDoc.embedPng(checkerSigBytes);
          const cSigDims = cSigImage.scaleToFit(120, 75);
          page1.drawImage(cSigImage, {
            x: CHECKER_CENTER_X - (cSigDims.width / 2) + 22,
            y: 120.0,
            width: cSigDims.width,
            height: cSigDims.height,
          });
        }
      }

      if (hasMstStamp) {
        const mstStampBytes = getCachedMstStampBytes();
        if (mstStampBytes) {
          const mstImage = await pdfDoc.embedPng(mstStampBytes);
          page1.drawImage(mstImage, {
            x: 215.0,
            y: 105.0,
            width: 210,
            height: 75,
          });
        }
      }
    } catch (e) {
      console.warn('Thalassemia signature embed warning:', e?.message);
    }

    return await pdfDoc.save();
  }
};
