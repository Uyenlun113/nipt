const fs = require('fs');
const { PDFDocument, rgb } = require('pdf-lib');
const fontkit = require('@pdf-lib/fontkit');

async function testPhoiPhuOverlay() {
  const phuBuffer = fs.readFileSync('Phôi kết quả/Kết quả phụ.pdf');
  const pdfDoc = await PDFDocument.load(phuBuffer);
  pdfDoc.registerFontkit(fontkit);
  
  const fontBytes = fs.readFileSync('fonts/arial.ttf');
  const fontBoldBytes = fs.readFileSync('fonts/arialbd.ttf');
  const font = await pdfDoc.embedFont(fontBytes);
  const fontBold = await pdfDoc.embedFont(fontBoldBytes);
  
  const page = pdfDoc.getPages()[0];
  const textColor = rgb(0.08, 0.18, 0.38);
  const darkColor = rgb(0.12, 0.15, 0.2);
  const resultGreen = rgb(0.02, 0.45, 0.2);
  const resultRed = rgb(0.75, 0.1, 0.1);
  
  // Sample Data
  const sample = {
    fullName: 'NGUYỄN THỊ MAI ANH',
    dob: '15/05/1995',
    idCard: '001195012345',
    phone: '0987654321',
    gestationalAge: '12 tuần 3 ngày',
    pregnancyType: 'Đơn thai',
    address: 'Cầu Giấy, Hà Nội',
    doctorName: 'BS. Trần Văn Hùng',
    agencyCode: 'Phòng khám Sản Phụ Khoa',
    receivedDate: '17/08/2026',
    gbsResult: 'Âm tính'
  };
  
  // Draw Row 1: Họ và tên (32.2), Ngày sinh (234), CMT/CCCD (386.1)
  page.drawText(sample.fullName, { x: 85, y: 706.4, size: 9, font: fontBold, color: textColor });
  page.drawText(sample.dob, { x: 285, y: 706.4, size: 9, font: fontBold, color: textColor });
  page.drawText(sample.idCard, { x: 445, y: 706.4, size: 9, font: fontBold, color: textColor });
  
  // Draw Row 2: Số điện thoại (32.2), Tuổi thai (234), Số lượng thai (386.1)
  page.drawText(sample.phone, { x: 98, y: 688.9, size: 9, font: fontBold, color: textColor });
  page.drawText(sample.gestationalAge, { x: 282, y: 688.9, size: 9, font: fontBold, color: textColor });
  page.drawText(sample.pregnancyType, { x: 455, y: 688.9, size: 9, font: fontBold, color: textColor });
  
  // Draw Row 3: Địa chỉ (32.2)
  page.drawText(sample.address, { x: 75, y: 669.9, size: 9, font: fontBold, color: textColor });
  
  // Draw Row 4: Bác sĩ chỉ định (32.2), Nơi gửi mẫu (234), Ngày nhận mẫu (400.5)
  page.drawText(sample.doctorName, { x: 105, y: 631.5, size: 9, font: fontBold, color: textColor });
  page.drawText(sample.agencyCode, { x: 298, y: 631.5, size: 9, font: fontBold, color: textColor });
  page.drawText(sample.receivedDate, { x: 480, y: 631.7, size: 9, font: fontBold, color: textColor });
  
  // Draw GBS Result Section below y = 588.5
  // Let's draw table row / result box
  const isNegative = (sample.gbsResult || 'Âm tính').toLowerCase().includes('âm');
  const gbsText = isNegative ? 'ÂM TÍNH' : 'DƯƠNG TÍNH';
  const gbsColor = isNegative ? resultGreen : resultRed;
  
  // Table row: Tên XN, Phương pháp, Kết quả, Đơn vị/Ngưỡng
  // If template has table lines, or we draw table box / content:
  page.drawText('Sàng lọc vi khuẩn Streptococcus nhóm B (GBS)', { x: 45, y: 535, size: 9.5, font: fontBold, color: darkColor });
  page.drawText('Realtime PCR', { x: 270, y: 535, size: 9, font: font, color: darkColor });
  page.drawText(gbsText, { x: 380, y: 535, size: 10, font: fontBold, color: gbsColor });
  page.drawText('Âm tính', { x: 485, y: 535, size: 9, font: font, color: darkColor });
  
  // Conclusion Box
  const conclusionGBS = isNegative
    ? 'KẾT LUẬN: ÂM TÍNH - Không phát hiện vi khuẩn Streptococcus nhóm B (GBS) trong mẫu bệnh phẩm.'
    : 'KẾT LUẬN: DƯƠNG TÍNH - Phát hiện vi khuẩn Streptococcus nhóm B (GBS) trong mẫu bệnh phẩm. Khuyến nghị tư vấn y khoa.';
  page.drawText(conclusionGBS, { x: 45, y: 460, size: 9.5, font: fontBold, color: gbsColor, maxWidth: 500, lineHeight: 14 });
  
  // Date line
  const dateParts = sample.receivedDate.split('/');
  if (dateParts.length === 3) {
    page.drawText(dateParts[0], { x: 416, y: 222.3, size: 9, font: fontBold, color: darkColor });
    page.drawText(dateParts[1], { x: 468, y: 222.3, size: 9, font: fontBold, color: darkColor });
    page.drawText(dateParts[2], { x: 512, y: 222.3, size: 9, font: fontBold, color: darkColor });
  }

  const outBytes = await pdfDoc.save();
  fs.writeFileSync('test_phu_out.pdf', outBytes);
  console.log('Saved test_phu_out.pdf, bytes:', outBytes.length);
}
testPhoiPhuOverlay();
