import fs from 'fs';
import path from 'path';
import { PDFDocument, degrees } from 'pdf-lib';

async function testStamp() {
  const templatePath = path.join(process.cwd(), 'Phôi kết quả', 'KQ_NIPT_GENET 23.pdf');
  const pdfBytes = fs.readFileSync(templatePath);
  const pdfDoc = await PDFDocument.load(pdfBytes);

  const mstBytes = fs.readFileSync(path.join(process.cwd(), 'MST GT.png'));
  const mstImage = await pdfDoc.embedPng(mstBytes);

  const pages = pdfDoc.getPages();
  const page1 = pages[0];

  const width = 190;
  const height = 61.1;

  page1.drawImage(mstImage, {
    x: 180,
    y: 95,
    width: width,
    height: height,
    rotate: degrees(7.5),
  });

  const outBytes = await pdfDoc.save();
  fs.writeFileSync(path.join(process.cwd(), 'scratch', 'test_out.pdf'), outBytes);
  console.log('Saved test_out.pdf!');
}

testStamp().catch(console.error);
