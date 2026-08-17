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

    // 1. If stored in Cloudinary, redirect to Cloudinary secure URL directly
    if (originalPdfUrl && originalPdfUrl.startsWith('http')) {
      return NextResponse.redirect(originalPdfUrl);
    }

    // 2. Check local uploads/originals folder
    const uploadsDir = path.join(process.cwd(), 'uploads', 'originals');
    if (fs.existsSync(uploadsDir)) {
      const possibleNames = [
        `${sampleCode}_${originalPdfName.replace(/\s+/g, '_')}`,
        `${sampleCode}_${originalPdfName}`,
        `${id}_${originalPdfName}`,
        `${sampleCode}.pdf`,
        originalPdfName
      ].filter(Boolean);

      for (const name of possibleNames) {
        const filePath = path.join(uploadsDir, name);
        if (fs.existsSync(filePath)) {
          const buffer = fs.readFileSync(filePath);
          return new NextResponse(buffer, {
            headers: {
              'Content-Type': 'application/pdf',
              'Content-Disposition': `inline; filename="${originalPdfName}"`,
            },
          });
        }
      }
    }

    return NextResponse.json({ error: 'Không tìm thấy file PDF gốc đối chiếu. Vui lòng tải lại file PDF kết quả.' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching original PDF:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải file PDF gốc' }, { status: 500 });
  }
}
