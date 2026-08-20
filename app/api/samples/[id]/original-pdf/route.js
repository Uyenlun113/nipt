import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
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
      return NextResponse.json({ error: 'Không tìm thấy mẫu' }, { status: 404 });
    }

    const originalPdfUrl = sample.originalPdfUrl || '';
    const originalPdfName = sample.originalPdfName || 'original.pdf';
    const sampleCode = sample.sampleCode || id;



    // 2. If stored in Cloudinary, proxy or redirect
    if (originalPdfUrl && originalPdfUrl.startsWith('http')) {
      try {
        let pdfRes = await fetch(originalPdfUrl);
        if (!pdfRes.ok && originalPdfUrl.includes('/raw/upload/')) {
          const imgUrl = originalPdfUrl.replace('/raw/upload/', '/image/upload/');
          pdfRes = await fetch(imgUrl);
        }

        if (pdfRes.ok) {
          const pdfBuffer = await pdfRes.arrayBuffer();
          return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${encodeURIComponent(originalPdfName)}"`,
            },
          });
        }
      } catch (err) {
        console.error('Proxy Cloudinary error:', err);
      }
      return NextResponse.redirect(originalPdfUrl);
    }

    return NextResponse.json({ error: 'Không tìm thấy file PDF gốc đối chiếu. Vui lòng tải lại file PDF kết quả.' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching original PDF:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải file PDF gốc' }, { status: 500 });
  }
}
