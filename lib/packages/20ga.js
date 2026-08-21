import fs from 'fs';
import path from 'path';
import { PDFDocument, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import pdfParse from 'pdf-parse';
import { extractTextWithOcrIfNeeded } from '../ocr-helper.js';
import { formatDateVN } from '../date-utils.js';

export const package20gaHandler = {
  id: '20GA',
  name: '20GA (20 Bệnh Gen Lặn)',
  templateFileName: '20GA.pdf',

  getDefaultResults() {
    return {
      disease_1: { label: 'Alpha-Thalassemia', gene: 'HBA1 & HBA2', nst: '16p13.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_2: { label: 'Beta-Thalassemia', gene: 'HBB', nst: '11p15.4', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_3: { label: 'Thiếu men G6PD', gene: 'G6PD', nst: 'Xq28', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_4: { label: 'Phenyketon niệu', gene: 'PAH', nst: '12q23.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_5: { label: 'Rối loạn chuyển hoá galactose', gene: 'GALT', nst: '9p13.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_6: { label: 'Bệnh vàng da ứ mật do thiếu hụt citrin', gene: 'SLC25A13', nst: '1q21.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_7: { label: 'Rối loạn phát triển giới tính nam do thiếu 5α-reductase type 2', gene: 'SRD5A2', nst: '2q23.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_8: { label: 'Bệnh Pompe (rối loạn dự trữ Glycogen loại 2)', gene: 'GAA', nst: '17q25.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_9: { label: 'Bệnh Wilson (rối loạn chuyển hoá đồng)', gene: 'ATP7B', nst: '13q14.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_10: { label: 'Bệnh xơ nang', gene: 'CFTR', nst: '7q31.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_11: { label: 'Bệnh Fabry (Rối loạn tích trữ lipid thể tiêu hợp)', gene: 'GLA', nst: 'Xq22.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_12: { label: 'Thiếu hụt đa enzyme Acyl-CoA dehydrogenase', gene: 'ETFDH', nst: '4q32.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_13: { label: 'Bệnh thận đa nang', gene: 'PKHD1', nst: '6p12.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_14: { label: 'Tăng sản thượng thận bẩm sinh (Do thiếu men 21-hydroxylase)', gene: 'CYP21A2', nst: '6p21.33', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_15: { label: 'Cường insulin bẩm sinh', gene: 'ABCC8', nst: '11p15.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_16: { label: 'Teo cơ tủy sống (SMA)', gene: 'SMN1', nst: '5q13.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_17: { label: 'Bệnh Gaucher (Thiếu hụt men glucocerebrosidase)', gene: 'GBA', nst: '1q22', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_18: { label: 'Bệnh máu khó đông Hemophilia A', gene: 'F8', nst: 'Xq28', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_19: { label: 'Thiếu hụt hormone TSH đơn độc (Suy giáp bẩm sinh trung ương)', gene: 'TSHB', nst: '1p13.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
      disease_20: { label: 'Tăng homocysteine niệu (Rối loạn chuyển hóa axi amin chứa lưu huỳnh)', gene: 'CBS', nst: '21q22.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
    };
  },

  async parsePdf(pdfBuffer) {
    const parsed = await pdfParse(pdfBuffer);
    const rawText = parsed.text || '';
    const text = await extractTextWithOcrIfNeeded(pdfBuffer, rawText);

    const defaultResults = this.getDefaultResults();
    const results = {};

    let fullName = '';
    const nameMatch = text.match(/Họ\s*tên:\s*([^\n\r]+)/i);
    if (nameMatch) fullName = nameMatch[1].trim();

    let sampleCode = '';
    const codeMatch = text.match(/Mã\s*số\s*XN:\s*([^\n\r]+)/i) || text.match(/Barcode:\s*([^\n\r]+)/i);
    if (codeMatch) sampleCode = codeMatch[1].trim();

    let dob = '';
    const dobMatch = text.match(/Năm\s*sinh:\s*([^\n\r]+)/i) || text.match(/Ngày\s*sinh:\s*([^\n\r]+)/i);
    if (dobMatch) dob = dobMatch[1].trim();

    let phone = '';
    const phoneMatch = text.match(/Điện\s*thoại:\s*([^\n\r]+)/i) || text.match(/Số\s*điện\s*thoại:\s*([^\n\r]+)/i);
    if (phoneMatch) phone = phoneMatch[1].trim();

    let idCard = '';
    const idMatch = text.match(/Số\s*CCCD:\s*([^\n\r]+)/i) || text.match(/CMT\/CCCD:\s*([^\n\r]+)/i);
    if (idMatch) idCard = idMatch[1].trim();

    let doctorName = '';
    const docMatch = text.match(/Bác\s*sỹ\s*chỉ\s*định:\s*([^\n\r]+)/i) || text.match(/Bác\s*sĩ\s*tư\s*vấn:\s*([^\n\r]+)/i);
    if (docMatch) doctorName = docMatch[1].trim();

    let address = '';
    const addrMatch = text.match(/Địa\s*chỉ:\s*([^\n\r]+)/i);
    if (addrMatch) address = addrMatch[1].trim();

    let facilityName = '';
    const facMatch = text.match(/Nơi\s*gửi\s*mẫu:\s*([^\n\r]+)/i);
    if (facMatch) facilityName = facMatch[1].trim();

    let conclusion = '';
    const klMatch = text.match(/KẾT\s*LUẬN\s*[\s\S]*?(?=Hà\s*Nội|Thông\s*tin\s*xét\s*nghiệm|LƯU\s*Ý|$)/i);
    if (klMatch) {
      let rawKl = klMatch[0].replace(/^KẾT\s*LUẬN/i, '').trim();
      conclusion = rawKl.replace(/\s+/g, ' ').trim();
    }
    if (!conclusion) {
      conclusion = 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.';
    }

    const diseaseDefs = [
      { key: 'disease_1', pattern: /Alpha\s*-?\s*Thalassemia/i },
      { key: 'disease_2', pattern: /Beta\s*-?\s*Thalassemia/i },
      { key: 'disease_3', pattern: /Thiếu\s*men\s*G6PD/i },
      { key: 'disease_4', pattern: /Phenyketon\s*niệu/i },
      { key: 'disease_5', pattern: /galactose/i },
      { key: 'disease_6', pattern: /citrin/i },
      { key: 'disease_7', pattern: /5α/i },
      { key: 'disease_8', pattern: /Pompe/i },
      { key: 'disease_9', pattern: /Wilson/i },
      { key: 'disease_10', pattern: /xơ\s*nang/i },
      { key: 'disease_11', pattern: /Fabry/i },
      { key: 'disease_12', pattern: /Acyl/i },
      { key: 'disease_13', pattern: /thận\s*đa\s*nang/i },
      { key: 'disease_14', pattern: /21\s*-?\s*hydroxylase/i },
      { key: 'disease_15', pattern: /Cường\s*insulin/i },
      { key: 'disease_16', pattern: /SMA|Teo\s*cơ\s*tủy/i },
      { key: 'disease_17', pattern: /Gaucher/i },
      { key: 'disease_18', pattern: /Hemophilia/i },
      { key: 'disease_19', pattern: /TSH/i },
      { key: 'disease_20', pattern: /homocysteine/i },
    ];

    const lines = text.split(/\r?\n/);
    diseaseDefs.forEach((def) => {
      const defaultItem = defaultResults[def.key];
      let val = defaultItem.value;

      for (const line of lines) {
        if (def.pattern.test(line)) {
          if (/Phát\s*hiện\s*đột\s*biến|Mang\s*gen|Dương\s*tính/i.test(line)) {
            const m = line.match(/(Phát\s*hiện[^\.\n\r]+|Mang\s*gen[^\.\n\r]+|Dương\s*tính[^\.\n\r]+)/i);
            if (m) val = m[1].trim();
          } else if (/Chưa\s*phát\s*hiện/i.test(line)) {
            val = 'Chưa phát hiện đột biến trong vùng được khảo sát';
          }
        }
      }

      results[def.key] = {
        ...defaultItem,
        value: val
      };
    });

    return {
      fullName,
      sampleCode,
      dob,
      phone,
      idCard,
      doctorName,
      address,
      facilityName,
      results,
      conclusion
    };
  },

  async generatePdf(sampleData) {
    const phoiDir = path.join(process.cwd(), 'Phôi kết quả');
    let templatePath = path.join(phoiDir, this.templateFileName);
    if (!fs.existsSync(templatePath)) {
      templatePath = path.join(phoiDir, '20GA.pdf');
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
    const page2 = pages[1] || page1;

    const textColor = rgb(0.05, 0.15, 0.35);
    const darkColor = rgb(0.1, 0.1, 0.1);

    const formattedDob = formatDateVN(sampleData.dob);
    const formattedReceivedDate = formatDateVN(sampleData.receivedDate) || formatDateVN(sampleData.samplingDate);

    // Right-alignment function matching standard GeneTrust template layout
    const drawRightText = (text, rightX, y, selectedFont = font, size = 9.5, color = darkColor) => {
      if (!text) return;
      const str = String(text);
      const textWidth = selectedFont.widthOfTextAtSize(str, size);
      page1.drawText(str, { x: rightX - textWidth, y, size, font: selectedFont, color });
    };

    const drawText = (p, text, x, y, size = 9, selectedFont = font, color = darkColor, maxWidth = undefined) => {
      if (!text) return;
      const options = { x, y, size, font: selectedFont, color };
      if (maxWidth) options.maxWidth = maxWidth;
      p.drawText(String(text), options);
    };

    // STANDARD RIGHT ALIGNMENT ANCHORS FOR COLUMNS:
    const RIGHT_COL1_X = 234;
    const RIGHT_COL2_X = 390;
    const RIGHT_COL3_X = 560;

    // PAGE 1: THÔNG TIN KHÁCH HÀNG (Row 1: y=731, Row 2: y=711)
    drawRightText(sampleData.fullName || '', RIGHT_COL1_X, 731.0, fontBold, 9.5, textColor);
    drawRightText(formattedDob || '', RIGHT_COL2_X, 731.0, font, 9.5, darkColor);
    drawRightText(sampleData.idCard || '', RIGHT_COL3_X, 731.0, font, 9.5, darkColor);

    drawRightText(sampleData.phone || '', RIGHT_COL1_X, 711.0, font, 9.5, darkColor);
    drawRightText(sampleData.gender || 'Nữ', RIGHT_COL2_X, 711.0, font, 9.5, darkColor);
    drawRightText(sampleData.address || '', RIGHT_COL3_X, 711.0, font, 9.5, darkColor);

    // THÔNG TIN MẪU (Row 1: y=672, Row 2: y=654, Row 3: y=635)
    drawRightText(sampleData.packageType || '20GA', RIGHT_COL1_X, 672.0, fontBold, 9.5, textColor);
    drawRightText(sampleData.sampleCode || '', RIGHT_COL2_X, 672.0, fontBold, 9.5, textColor);
    drawRightText(formatDateVN(sampleData.samplingDate) || '', RIGHT_COL3_X, 672.0, font, 9.5, darkColor);

    drawRightText(sampleData.doctorName || '', RIGHT_COL1_X, 654.0, font, 9.5, darkColor);
    drawRightText(sampleData.agencyCode || '', RIGHT_COL2_X, 654.0, font, 9.5, darkColor);
    drawRightText(formattedReceivedDate || '', RIGHT_COL3_X, 654.0, font, 9.5, darkColor);

    // Nơi gửi mẫu: (Right-aligned to Column 1 right edge RIGHT_COL1_X = 234)
    drawRightText(sampleData.facilityName || '', RIGHT_COL1_X, 635.0, font, 8.5, darkColor);

    // BẢNG 20 BỆNH (y positions for 20 items aligned with template rows)
    const defaultResults = this.getDefaultResults();
    const res = sampleData.results || defaultResults;
    const yMap = [
      544.0, 526.0, 510.0, 494.0, 478.0, 462.0, 442.0, 420.0, 404.0, 388.0,
      368.0, 347.0, 323.0, 303.0, 282.0, 266.0, 244.0, 224.0, 204.0, 179.0
    ];

    for (let i = 1; i <= 20; i++) {
      const key = `disease_${i}`;
      const item = res[key];
      const defaultItem = defaultResults[key];
      const y = yMap[i - 1];

      let val = 'Chưa phát hiện đột biến trong vùng được khảo sát';
      if (typeof item === 'object' && item !== null) {
        val = item.value || defaultItem.value;
      } else if (typeof item === 'string' && item.trim()) {
        val = item.trim();
      }

      if (y) {
        page1.drawText(String(val), {
          x: 390,
          y: y,
          size: 7.5,
          font: font,
          color: darkColor,
          maxWidth: 175,
          lineHeight: 9
        });
      }
    }

    // KẾT LUẬN (y=139.0)
    const conclusionStr = sampleData.conclusion || 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.';
    page1.drawText(conclusionStr, {
      x: 86,
      y: 139.0,
      size: 9,
      font: fontBold,
      color: textColor,
      maxWidth: 480,
      lineHeight: 12
    });

    // PAGE 2: Ngày tháng & Chữ ký
    if (pages.length > 1) {
      const dateToUse = formattedReceivedDate || formatDateVN(new Date().toISOString().split('T')[0]);
      const dateParts = dateToUse.split('/');
      if (dateParts.length === 3) {
        drawText(page2, dateParts[0], 405, 607.0, 9.5, fontBold, darkColor);
        drawText(page2, dateParts[1], 452, 607.0, 9.5, fontBold, darkColor);
        drawText(page2, dateParts[2].slice(-2), 507, 607.0, 9.5, fontBold, darkColor);
      }

      if (sampleData.checkerName) {
        drawText(page2, sampleData.checkerName, 105, 520.0, 9.5, fontBold, darkColor);
      }
      if (sampleData.directorName) {
        drawText(page2, sampleData.directorName, 410, 520.0, 9.5, fontBold, darkColor);
      }
    }

    return await pdfDoc.save();
  }
};
