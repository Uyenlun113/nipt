import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { createWorker } from 'tesseract.js';

let workerPromise = null;

async function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const worker = await createWorker('vie+eng');
      return worker;
    })();
  }
  return workerPromise;
}

export async function extractTextWithOcrIfNeeded(pdfBuffer, rawText = '') {
  if (rawText && rawText.trim().length > 60) {
    return rawText;
  }

  try {
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    const imageBuffers = [];

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const { Resources } = page.node.normalizedEntries();
      if (!Resources) continue;
      const xObject = Resources.get(PDFName.of('XObject'));
      if (!xObject) continue;

      const xObjectDict = page.node.context.lookup(xObject);
      if (!xObjectDict) continue;

      for (const [key, value] of xObjectDict.entries()) {
        const obj = page.node.context.lookup(value);
        if (obj instanceof PDFRawStream) {
          const subtype = obj.dict.get(PDFName.of('Subtype'));
          const filter = obj.dict.get(PDFName.of('Filter'));
          if (subtype === PDFName.of('Image') && filter === PDFName.of('DCTDecode')) {
            const imgBytes = obj.getContents();
            imageBuffers.push(Buffer.from(imgBytes));
          }
        }
      }
    }

    if (imageBuffers.length === 0) {
      return rawText;
    }

    const worker = await getOcrWorker();
    let ocrCombinedText = '';

    for (const imgBuf of imageBuffers) {
      const ret = await worker.recognize(imgBuf);
      ocrCombinedText += '\n' + (ret?.data?.text || '');
    }

    return ocrCombinedText.trim() ? (rawText + '\n' + ocrCombinedText) : rawText;
  } catch (err) {
    console.error('OCR Extraction error:', err);
    return rawText;
  }
}
