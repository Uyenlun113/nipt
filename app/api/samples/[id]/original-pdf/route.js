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

    const sampleCode = sample.sampleCode || id;
    const originalPdfName = sample.originalPdfName || '';

    // Search order for the PDF file:
    // 1. Explicit local path stored in sample
    if (sample.originalPdfPath && fs.existsSync(sample.originalPdfPath)) {
      const buffer = fs.readFileSync(sample.originalPdfPath);
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${originalPdfName || 'original.pdf'}"`,
        },
      });
    }

    // 2. Check uploads/originals folder
    const uploadsDir = path.join(process.cwd(), 'uploads', 'originals');
    if (fs.existsSync(uploadsDir)) {
      const possibleNames = [
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
              'Content-Disposition': `inline; filename="${originalPdfName || 'original.pdf'}"`,
            },
          });
        }
      }
    }

    // 3. Fallback check by originalPdfName in uploads
    if (originalPdfName) {
      const directUploadPath = path.join(uploadsDir, originalPdfName);
      if (fs.existsSync(directUploadPath)) {
        const buffer = fs.readFileSync(directUploadPath);
        return new NextResponse(buffer, {
          headers: {
            'Content-Type': 'application/pdf',
            'Content-Disposition': `inline; filename="${originalPdfName}"`,
          },
        });
      }
    }

    return NextResponse.json({ error: 'Không tìm thấy file PDF gốc đối chiếu' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching original PDF:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải file PDF gốc' }, { status: 500 });
  }
}
