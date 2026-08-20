import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';

async function inspectImages() {
  const filePath = path.join(process.cwd(), 'uploads', 'originals', 'GT-58376_Trần_Thị_Thanh_Trúc_26B02057_Extra.pdf');
  const buffer = fs.readFileSync(filePath);
  const pdfDoc = await PDFDocument.load(buffer);
  
  console.log('Page count:', pdfDoc.getPageCount());
  
  const pages = pdfDoc.getPages();
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i];
    console.log(`Page ${i+1} size:`, page.getSize());
  }
}

inspectImages();
