const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

async function inspectObj8() {
  const buf = fs.readFileSync('Phôi kết quả/Kết quả phụ.pdf');
  const doc = await PDFDocument.load(buf);
  for (const [ref, obj] of doc.context.enumerateIndirectObjects()) {
    if (ref.tag === '8 0 R') {
      const dict = obj.dict;
      for (const k of dict.keys()) {
        console.log(k.value(), '=>', dict.get(k)?.toString());
      }
    }
  }
}
inspectObj8();
