import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { generateGeneTrustPdf, generate20GAPdf, generateSupplementaryPdf } from '@/lib/pdf-generator';
import { fallbackStore } from '@/lib/store-fallback';
import { removeVietnameseAccents } from '@/lib/string-utils';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    let sample = null;

    const db = await connectToDatabase();
    if (db) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        sample = await NiptSample.findById(id).lean();
      } else {
        sample = await NiptSample.findOne({ sampleCode: id }).lean();
      }
    }

    if (!sample) {
      sample = fallbackStore.samples.find(s => s.id === id || s._id === id || s.sampleCode === id);
    }

    if (!sample) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin mẫu NIPT' }, { status: 404 });
    }

    const safeName = removeVietnameseAccents(sample.fullName || 'KhachHang');
    const code = removeVietnameseAccents(sample.sampleCode || 'NIPT');
    const zip = new JSZip();

    const isCombo = (sample.packageType || '').includes('+') || (sample.packageType || '').toLowerCase().includes('combo');

    if (isCombo) {
      // Generate both NIPT and 20GA PDFs concurrently for Combo packages
      const [pdfNipt, pdf20GA] = await Promise.all([
        generateGeneTrustPdf(sample),
        generate20GAPdf(sample)
      ]);

      zip.file(`Ket_Qua_NIPT_${code}_${safeName}.pdf`, pdfNipt);
      zip.file(`Ket_Qua_20GA_${code}_${safeName}.pdf`, pdf20GA);
    } else if (sample.packageType === '20GA') {
      const pdf20GA = await generate20GAPdf(sample);
      zip.file(`Ket_Qua_20GA_${code}_${safeName}.pdf`, pdf20GA);
    } else {
      // Standard NIPT package
      const [pdfMain, pdfSupp] = await Promise.all([
        generateGeneTrustPdf(sample),
        generateSupplementaryPdf(sample)
      ]);

      zip.file(`Ket_Qua_NIPT_${code}_${safeName}.pdf`, pdfMain);
      zip.file(`Ket_Qua_Phu_${code}_${safeName}.pdf`, pdfSupp);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    const zipFileName = `${code}.zip`;

    return new NextResponse(zipBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${zipFileName}"`,
      },
    });

  } catch (error) {
    console.error('ZIP generation error:', error);
    return NextResponse.json({ error: 'Không thể tạo file ZIP kết quả: ' + error.message }, { status: 500 });
  }
}
