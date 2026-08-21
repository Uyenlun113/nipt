import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import { formatDateVN } from './date-utils.js';

export async function generateStandaloneSupplementaryReport(sampleData) {
  try {
    const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
    const phuPath = path.join(phoiDir, 'Kết quả phụ.pdf');
    if (!fs.existsSync(phuPath)) {
      throw new Error('Không tìm thấy file Phôi kết quả/Kết quả phụ.pdf');
    }

    const phuBuffer = fs.readFileSync(phuPath);
    const phuDoc = await PDFDocument.load(phuBuffer);
    phuDoc.registerFontkit(fontkit);

    // Embed Arial fonts
    let font, fontBold;
    try {
      const fontBytes = fs.readFileSync(path.join(process.cwd(), 'fonts', 'arial.ttf'));
      const fontBoldBytes = fs.readFileSync(path.join(process.cwd(), 'fonts', 'arialbd.ttf'));
      font = await phuDoc.embedFont(fontBytes);
      fontBold = await phuDoc.embedFont(fontBoldBytes);
    } catch (fErr) {
      font = await phuDoc.embedStandardFont('Helvetica');
      fontBold = await phuDoc.embedStandardFont('Helvetica-Bold');
    }

    const pages = phuDoc.getPages();
    if (pages.length === 0) return phuBuffer;
    const page = pages[0];

    const textColor = rgb(0.08, 0.18, 0.38);
    const darkColor = rgb(0.12, 0.15, 0.2);

    const formattedDob = formatDateVN(sampleData.dob);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate) || formatDateVN(new Date().toISOString().split('T')[0]);

    // 1. Thông tin khách hàng
    page.drawText(sampleData.fullName || '', { x: 85, y: 706.4, size: 9, font: fontBold, color: textColor });
    page.drawText(formattedDob || '', { x: 285, y: 706.4, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.idCard || '', { x: 445, y: 706.4, size: 9, font: fontBold, color: textColor });

    page.drawText(sampleData.phone || '', { x: 98, y: 688.9, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.gestationalAge || '', { x: 282, y: 688.9, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.pregnancyType || 'Đơn thai', { x: 455, y: 688.9, size: 9, font: fontBold, color: textColor });

    page.drawText(sampleData.address || '', { x: 75, y: 669.9, size: 9, font: fontBold, color: textColor });

    // 2. Thông tin mẫu
    page.drawText(sampleData.doctorName || '', { x: 105, y: 631.5, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.agencyCode || '', { x: 298, y: 631.5, size: 9, font: fontBold, color: textColor });
    page.drawText(formattedReceivedDate || '', { x: 480, y: 631.7, size: 9, font: fontBold, color: textColor });

    // 3. KẾT QUẢ GBS
    const isNegative = !(sampleData.gbsResult || 'Âm tính').toLowerCase().includes('dương');
    const gbsStatusText = isNegative ? 'ÂM TÍNH' : 'DƯƠNG TÍNH';
    const fontSize = 11;
    const textWidth = fontBold.widthOfTextAtSize(gbsStatusText, fontSize);
    const centerX = (page.getWidth() - textWidth) / 2;

    page.drawText(gbsStatusText, {
      x: centerX,
      y: 548,
      size: fontSize,
      font: fontBold,
      color: darkColor
    });

    const populatedPhuBytes = await phuDoc.save();
    return Buffer.from(populatedPhuBytes);
  } catch (err) {
    console.error('Error generating standalone supplementary report:', err);
    throw err;
  }
}

export async function attachSupplementaryReport(mainPdfBytes, sampleData) {
  try {
    const standalonePhu = await generateStandaloneSupplementaryReport(sampleData);
    const mainDoc = await PDFDocument.load(mainPdfBytes);
    mainDoc.registerFontkit(fontkit);

    const tempDoc = await PDFDocument.load(standalonePhu);
    const [copiedPage] = await mainDoc.copyPages(tempDoc, [0]);
    mainDoc.addPage(copiedPage);

    const finalBytes = await mainDoc.save();
    return Buffer.from(finalBytes);
  } catch (err) {
    console.error('Error attaching supplementary report:', err);
    return mainPdfBytes;
  }
}
