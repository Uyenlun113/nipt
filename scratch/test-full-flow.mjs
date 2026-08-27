import fs from 'fs';
import path from 'path';
import { generateGeneTrustPdf } from '../lib/pdf-generator.js';

async function testFullFlow() {
  const sample = {
    sampleCode: 'GT23-999',
    fullName: 'NGUYỄN THỊ THU HÀ',
    dob: '15/08/1995',
    idCard: '001195001234',
    phone: '0988776655',
    address: 'Hà Nội',
    gestationalAge: '12 tuần 3 ngày',
    pregnancyType: 'Đơn thai',
    packageType: 'GeneT 23',
    agencyCode: 'PK-HANOI',
    doctorName: 'BS. Lê Văn B',
    checkerName: 'TS. BS. Nguyễn Văn A',
    directorName: 'TS. Đặng Văn C',
    receivedDate: '27/08/2026',
    cfDNA: '6.85',
    hasMstStamp: true,
    results: {
      t21: { label: 'Trisomy 21 (Down)', value: '-0.15', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t18: { label: 'Trisomy 18 (Edwards)', value: '0.22', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
      t13: { label: 'Trisomy 13 (Patau)', value: '0.05', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' }
    }
  };

  const pdfBuffer = await generateGeneTrustPdf(sample);
  fs.writeFileSync(path.join(process.cwd(), 'scratch', 'test_full_stamp_240.pdf'), pdfBuffer);
  console.log('Saved test_full_stamp_240.pdf successfully!');
}

testFullFlow().catch(console.error);
