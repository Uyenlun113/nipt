const fs = require('fs');
const pdfjs = require('pdf-parse/lib/pdf.js/v1.10.100/build/pdf.js');

async function inspectPathOps() {
  const data = new Uint8Array(fs.readFileSync('Phôi kết quả/Kết quả phụ.pdf'));
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const ops = await page.getOperatorList();
  
  // Find all constructPath or line/rect operations
  for (let i = 0; i < ops.fnArray.length; i++) {
    const fn = ops.fnArray[i];
    if (fn === pdfjs.OPS.constructPath) {
      const args = ops.argsArray[i];
      // args[0] is array of operations (19 = rect, etc.), args[1] is coordinates
      console.log(`Path ${i}: ops=${JSON.stringify(args[0])}, coords=${JSON.stringify(args[1])}`);
    }
  }
}
inspectPathOps();
