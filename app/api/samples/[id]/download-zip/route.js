import JSZip from 'jszip';
import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { generateGeneTrustPdf, generateSupplementaryPdf } from '@/lib/pdf-generator';
import { fallbackStore } from '@/lib/store-fallback';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    let sample = null;

    const db = await connectToDatabase();
    if (db) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        sample = await NiptSample.findById(id);
      } else {
        sample = await NiptSample.findOne({ sampleCode: id });
      }
    }

    if (!sample) {
      sample = fallbackStore.samples.find(s => s.id === id || s._id === id || s.sampleCode === id);
    }

    if (!sample) {
      return NextResponse.json({ error: 'Không tìm thấy thông tin mẫu NIPT' }, { status: 404 });
    }

    const safeName = (sample.fullName || 'KhachHang').replace(/[^a-zA-Z0-9_\- ]/g, '').trim().replace(/\s+/g, '_');
    const code = (sample.sampleCode || 'NIPT').replace(/[^a-zA-Z0-9_\-]/g, '_');

    // Generate both PDFs concurrently
    const [pdfMain, pdfSupp] = await Promise.all([
      generateGeneTrustPdf(sample),
      generateSupplementaryPdf(sample)
    ]);

    const zip = new JSZip();
    zip.file(`Ket_Qua_NIPT_${code}_${safeName}.pdf`, pdfMain);
    zip.file(`Ket_Qua_Phu_${code}_${safeName}.pdf`, pdfSupp);

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    // File name zip: tên folder/zip là mã ca (mã mẫu NIPT)
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
