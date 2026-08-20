import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

import { formatDateVN } from './date-utils.js';

export async function attachSupplementaryReport(mainPdfBytes, sampleData) {
  try {
    const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
    const phuPath = path.join(phoiDir, 'Kết quả phụ.pdf');
    if (!fs.existsSync(phuPath)) {
      console.warn('Không tìm thấy file Phôi kết quả/Kết quả phụ.pdf');
      return mainPdfBytes;
    }

    const mainDoc = await PDFDocument.load(mainPdfBytes);
    mainDoc.registerFontkit(fontkit);

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
    if (pages.length === 0) return mainPdfBytes;
    const page = pages[0];

    const textColor = rgb(0.08, 0.18, 0.38);
    const darkColor = rgb(0.12, 0.15, 0.2);
    const resultGreen = rgb(0.02, 0.45, 0.2);
    const resultRed = rgb(0.8, 0.1, 0.1);

    const formattedDob = formatDateVN(sampleData.dob);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate) || formatDateVN(new Date().toISOString().split('T')[0]);

    // 1. Thông tin khách hàng (THÔNG TIN KHÁCH HÀNG)
    // Row 1: Họ và tên (32.2), Ngày sinh (234), CMT/CCCD (386.1) tại y = 706.4
    page.drawText(sampleData.fullName || '', { x: 85, y: 706.4, size: 9, font: fontBold, color: textColor });
    page.drawText(formattedDob || '', { x: 285, y: 706.4, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.idCard || '', { x: 445, y: 706.4, size: 9, font: fontBold, color: textColor });

    // Row 2: Số điện thoại (32.2), Tuổi thai (234), Số lượng thai (386.1) tại y = 688.9
    page.drawText(sampleData.phone || '', { x: 98, y: 688.9, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.gestationalAge || '', { x: 282, y: 688.9, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.pregnancyType || 'Đơn thai', { x: 455, y: 688.9, size: 9, font: fontBold, color: textColor });

    // Row 3: Địa chỉ (32.2) tại y = 669.9
    page.drawText(sampleData.address || '', { x: 75, y: 669.9, size: 9, font: fontBold, color: textColor });

    // 2. Thông tin mẫu (THÔNG TIN MẪU)
    // Bác sĩ chỉ định (32.2), Nơi gửi mẫu (234), Ngày nhận mẫu (400.5) tại y = 631.5
    page.drawText(sampleData.doctorName || '', { x: 105, y: 631.5, size: 9, font: fontBold, color: textColor });
    page.drawText(sampleData.agencyCode || '', { x: 298, y: 631.5, size: 9, font: fontBold, color: textColor });
    page.drawText(formattedReceivedDate || '', { x: 480, y: 631.7, size: 9, font: fontBold, color: textColor });

    // 3. Kết quả GBS (KẾT QUẢ GBS) - Chỉ hiển thị ÂM TÍNH hoặc DƯƠNG TÍNH căn giữa sát tiêu đề
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

    // Save populated phu page
    const populatedPhuBytes = await phuDoc.save();
    const tempDoc = await PDFDocument.load(populatedPhuBytes);
    const [copiedPage] = await mainDoc.copyPages(tempDoc, [0]);
    mainDoc.addPage(copiedPage);

    const finalBytes = await mainDoc.save();
    return Buffer.from(finalBytes);
  } catch (err) {
    console.error('Error attaching supplementary report:', err);
    return mainPdfBytes;
  }
}
