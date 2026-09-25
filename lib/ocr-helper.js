import path from 'path';
import { PDFDocument, PDFName, PDFRawStream } from 'pdf-lib';
import { createWorker } from 'tesseract.js';

let workerPromise = null;

async function getOcrWorker() {
  if (!workerPromise) {
    workerPromise = (async () => {
      const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'worker-script', 'node', 'index.js');
      const worker = await createWorker('vie+eng', 1, {
        workerPath: workerPath,
      });
      return worker;
    })();
  }
  return workerPromise;
}

export async function extractTextWithOcrIfNeeded(pdfBuffer, rawText = '') {
  const hasKeyResults = /(?:Trisomy|Down|Edwards|Patau|Z-score|Zscore|cfDNA|Nguy\s*cơ|Mất\s*đoạn|Lệch\s*bội)/i.test(rawText);
  if (rawText && rawText.trim().length > 150 && hasKeyResults) {
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
          if (subtype === PDFName.of('Image')) {
            try {
              const imgBytes = obj.getContents();
              if (imgBytes && imgBytes.length > 500) {
                imageBuffers.push(Buffer.from(imgBytes));
              }
            } catch (e) {
              // Ignore invalid image streams
            }
          }
        }
      }
    }

    if (imageBuffers.length === 0) {
      return rawText;
    }

    const worker = await getOcrWorker();
    await worker.setParameters({
      tessedit_pageseg_mode: '3',
    });
    let ocrCombinedText = '';

    for (const imgBuf of imageBuffers) {
      try {
        const ret = await worker.recognize(imgBuf);
        ocrCombinedText += '\n' + (ret?.data?.text || '');
      } catch (rErr) {
        console.warn('OCR recognize single image warning:', rErr?.message);
      }
    }

    return ocrCombinedText.trim() ? (rawText + '\n' + ocrCombinedText) : rawText;
  } catch (err) {
    console.error('OCR Extraction error:', err);
    return rawText;
  }
}
