import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { generateSupplementaryPdf } from '@/lib/pdf-generator';
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

    const pdfBuffer = await generateSupplementaryPdf(sample);
    const safeName = removeVietnameseAccents(sample.fullName || 'KhachHang');
    const code = removeVietnameseAccents(sample.sampleCode || 'NIPT');
    const fileName = `Ket_Qua_Phu_${code}_${safeName}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${fileName}"`,
      },
    });

  } catch (error) {
    console.error('Supplementary PDF generation error:', error);
    return NextResponse.json({ error: 'Không thể tạo file phôi Kết quả phụ: ' + error.message }, { status: 500 });
  }
}
