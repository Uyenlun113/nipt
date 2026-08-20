import path from 'path';
import { createWorker } from 'tesseract.js';

async function checkTesseractPaths() {
  const workerPath = path.join(process.cwd(), 'node_modules', 'tesseract.js', 'src', 'node', 'index.js');
  console.log('Local workerPath exists:', require('fs').existsSync(workerPath));
  console.log('workerPath:', workerPath);
}

checkTesseractPaths();
