const fs = require('fs');
const { PDFDocument, PDFRawStream } = require('pdf-lib');

async function extractStreams() {
  const buf = fs.readFileSync('Phôi kết quả/Kết quả phụ.pdf');
  const doc = await PDFDocument.load(buf);
  const objects = doc.context.enumerateIndirectObjects();
  let imgIdx = 0;
  for (const [ref, obj] of objects) {
    if (obj instanceof PDFRawStream) {
      const dict = obj.dict;
      const keys = dict.keys().map(k => k.value());
      if (keys.includes('/Subtype') && dict.get(dict.keys().find(k => k.value() === '/Subtype'))?.value() === '/Image') {
        const width = dict.get(dict.keys().find(k => k.value() === '/Width'))?.numberValue;
        const height = dict.get(dict.keys().find(k => k.value() === '/Height'))?.numberValue;
        const filter = dict.get(dict.keys().find(k => k.value() === '/Filter'))?.value();
        console.log(`Obj ${ref.tag}: ${width}x${height}, filter=${filter}`);
        if (filter === '/DCTDecode') {
          imgIdx++;
          fs.writeFileSync(`phu_img_${imgIdx}_${width}x${height}.jpg`, obj.contents);
          console.log(`Wrote phu_img_${imgIdx}_${width}x${height}.jpg`);
        }
      }
    }
  }
}
extractStreams();
