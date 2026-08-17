const fs = require('fs');
const pdfjs = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

async function inspectTableLines() {
  const data = new Uint8Array(fs.readFileSync('Phôi kết quả/Kết quả phụ.pdf'));
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const ops = await page.getOperatorList();
  
  console.log('--- ALL DRAWING PATHS ---');
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn === pdfjs.OPS.constructPath) {
      const args = ops.argsArray[i];
      // args[1] are coordinates
      const coords = args[1];
      console.log(`Path ${i}:`, coords.map(c => typeof c === 'number' ? (c / 10).toFixed(1) : c));
    }
  }
}
inspectTableLines();
