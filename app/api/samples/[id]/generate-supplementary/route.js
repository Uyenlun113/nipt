import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { generateSupplementaryPdf } from '@/lib/pdf-generator';
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

    const pdfBuffer = await generateSupplementaryPdf(sample);
    const safeName = (sample.fullName || 'KhachHang').replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `Ket_Qua_Phu_${sample.sampleCode || 'NIPT'}_${safeName}.pdf`;

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
