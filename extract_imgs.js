const fs = require('fs');
const { PDFDocument, PDFName, PDFRef } = require('pdf-lib');

async function extractImages() {
  const buf = fs.readFileSync('Phôi kết quả/Kết quả phụ.pdf');
  const doc = await PDFDocument.load(buf);
  const page = doc.getPages()[0];
  
  const resources = page.node.Resources();
  const xObject = resources ? doc.context.lookup(resources.get(PDFName.of('XObject'))) : null;
  if (xObject) {
    const dict = xObject.dict || xObject;
    for (const [key, ref] of dict.entries()) {
      const obj = doc.context.lookup(ref);
      const subtype = obj.dict.get(PDFName.of('Subtype'));
      if (subtype && subtype.value() === 'Image') {
        const width = obj.dict.get(PDFName.of('Width'))?.numberValue;
        const height = obj.dict.get(PDFName.of('Height'))?.numberValue;
        const filter = obj.dict.get(PDFName.of('Filter'))?.value();
        console.log(`Image ${key.value()}: ${width}x${height}, filter=${filter}`);
        if (filter === 'DCTDecode') {
          fs.writeFileSync(`phu_${key.value().replace('/', '')}.jpg`, obj.contents);
          console.log(`Saved phu_${key.value().replace('/', '')}.jpg`);
        }
      }
    }
  }
}
extractImages();
