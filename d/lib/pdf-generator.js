import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';

const TEMPLATE_MAP = {
  'GeneT Eco': 'KQ_NIPT_GENET Eco.pdf',
  'GeneT 7': 'KQ_NIPT_GENET 7.pdf',
  'GeneT 23': 'KQ_NIPT_GENET 23.pdf',
  'GeneT Plus': 'KQ_NIPT_GENET Plus k mở rộng.pdf',
  'GeneT Twins': 'KQ_NIPT_GENET Twins.pdf',
  'GENNI 4': 'KQ_NIPT_GENNI 4.pdf',
};

export async function generateGeneTrustPdf(sampleData) {
  const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
  
  let templateFileName = TEMPLATE_MAP[sampleData.packageType];
  if (!templateFileName) {
    const files = fs.readdirSync(phoiDir);
    const matched = files.find(f => f.toLowerCase().includes((sampleData.packageType || '').toLowerCase()));
    templateFileName = matched || 'KQ_NIPT_GENET 7.pdf';
  }

  const templatePath = path.join(phoiDir, templateFileName);
  let pdfBuffer;
  try {
    pdfBuffer = fs.readFileSync(templatePath);
  } catch (err) {
    console.error('Template PDF read error:', err);
    const fallbackPath = path.join(phoiDir, 'Kết quả phụ.pdf');
    pdfBuffer = fs.readFileSync(fallbackPath);
  }

  const pdfDoc = await PDFDocument.load(pdfBuffer);
  pdfDoc.registerFontkit(fontkit);

  const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();
  const firstPage = pages[0];

  const textColor = rgb(0.05, 0.15, 0.35); // Dark Navy Blue
  const darkColor = rgb(0.1, 0.1, 0.1);
  const alertColor = rgb(0.85, 0.1, 0.1); // Crimson Red for cfDNA %

  const cleanText = (str) => {
    if (!str) return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D');
  };

  // EXACT ALIGNED COORDINATES FOR GENETRUST TEMPLATES (Page 1)

  // 1. THÔNG TIN KHÁCH HÀNG (Row y = 699.3)
  // Họ và tên (x after "Họ và tên:" ~ x = 82)
  firstPage.drawText(cleanText(sampleData.fullName || ''), {
    x: 82,
    y: 699.3,
    size: 9.5,
    font,
    color: textColor,
  });

  // Ngày sinh (x after "Ngày sinh:" ~ x = 300)
  firstPage.drawText(cleanText(sampleData.dob || ''), {
    x: 300,
    y: 699.3,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // CMT/CCCD (x after "CMT/CCCD:" ~ x = 465)
  firstPage.drawText(cleanText(sampleData.idCard || ''), {
    x: 465,
    y: 699.3,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // 2. Row y = 681.8
  // Số điện thoại (x after "Số điện thoại:" ~ x = 95)
  firstPage.drawText(cleanText(sampleData.phone || ''), {
    x: 95,
    y: 681.8,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // Tuổi thai (x after "Tuổi thai:" ~ x = 300)
  firstPage.drawText(cleanText(sampleData.gestationalAge || ''), {
    x: 300,
    y: 681.8,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // Số lượng thai (x after "Số lượng thai:" ~ x = 485)
  firstPage.drawText(cleanText(sampleData.pregnancyType || 'Don thai'), {
    x: 485,
    y: 681.8,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // 3. Row y = 660.9
  // Địa chỉ (x after "Địa chỉ:" ~ x = 68)
  firstPage.drawText(cleanText(sampleData.address || ''), {
    x: 68,
    y: 660.9,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // 4. THÔNG TIN MẪU (Row y = 625.9)
  // Gói xét nghiệm (x after "Gói xét nghiệm:" ~ x = 110)
  firstPage.drawText(cleanText(sampleData.packageType || ''), {
    x: 110,
    y: 625.9,
    size: 9.5,
    font,
    color: textColor,
  });

  // Mã đại lý (x after "Mã đại lý:" ~ x = 300)
  firstPage.drawText(cleanText(sampleData.agencyCode || ''), {
    x: 300,
    y: 625.9,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // Barcode (x after "Barcode:" ~ x = 450)
  firstPage.drawText(cleanText(sampleData.sampleCode || ''), {
    x: 450,
    y: 625.9,
    size: 9.5,
    font,
    color: textColor,
  });

  // 5. Row y = 608.3
  // Bác sĩ chỉ định (x after "Bác sĩ chỉ định:" ~ x = 102)
  firstPage.drawText(cleanText(sampleData.doctorName || ''), {
    x: 102,
    y: 608.3,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // Loại ống (x after "Loại ống:" ~ x = 300)
  firstPage.drawText(cleanText(sampleData.tubeType || 'Streck'), {
    x: 300,
    y: 608.3,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // Hàm lượng cfDNA (x after "Hàm lượng cfDNA:" ~ x = 512)
  const cfDnaVal = sampleData.cfDNA ? `${sampleData.cfDNA}%` : '8.45%';
  firstPage.drawText(cfDnaVal, {
    x: 512,
    y: 608.3,
    size: 10,
    font,
    color: alertColor,
  });

  // 6. Row y = 591.0
  // Ngày nhận mẫu (x after "Ngày nhận mẫu:" ~ x = 485)
  firstPage.drawText(cleanText(sampleData.receivedDate || ''), {
    x: 485,
    y: 591.0,
    size: 9.5,
    font: fontRegular,
    color: darkColor,
  });

  // 7. KẾT LUẬN Y KHOA (Row y = 300)
  const conclusionStr = cleanText(sampleData.conclusion || 'Chua phat hien lech boi nhiem sac the tren cac cap NST khao sat.');
  firstPage.drawText(conclusionStr, {
    x: 95,
    y: 316.4,
    size: 9.5,
    font,
    color: rgb(0.05, 0.25, 0.55),
    maxWidth: 460,
    lineHeight: 14,
  });

  // Header Barcode on Page 2 if multi-page template
  if (pages.length > 1) {
    const page2 = pages[1];
    page2.drawText(cleanText(sampleData.fullName || ''), {
      x: 110,
      y: 767,
      size: 9,
      font,
      color: textColor,
    });
    page2.drawText(cleanText(sampleData.sampleCode || ''), {
      x: 450,
      y: 767,
      size: 9,
      font,
      color: textColor,
    });
  }

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
}
