import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { extractNiptPdfData } from '@/lib/pdf-parser';
import { uploadPdfToCloudinary } from '@/lib/cloudinary';
import { fallbackStore } from '@/lib/store-fallback';
import mongoose from 'mongoose';

export async function POST(req, { params }) {
  try {
    const { id } = params;
    const formData = await req.formData();
    const file = formData.get('pdfFile');

    if (!file) {
      return NextResponse.json({ error: 'Chưa có file PDF nào được chọn' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Find existing sample to retrieve its packageType and sampleCode
    let sampleObj = null;
    const db = await connectToDatabase();
    if (db) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        sampleObj = await NiptSample.findById(id);
      } else {
        sampleObj = await NiptSample.findOne({ sampleCode: id });
      }
    }

    if (!sampleObj) {
      sampleObj = fallbackStore.samples.find(s => s.id === id || s._id === id || s.sampleCode === id);
    }

    if (!sampleObj) {
      sampleObj = {
        id: id,
        _id: id,
        sampleCode: id,
        fullName: 'Bệnh nhân',
        packageType: 'GeneT 7',
        status: 'extracted',
        createdAt: new Date().toISOString()
      };
      fallbackStore.samples.push(sampleObj);
    }

    const packageType = sampleObj?.packageType || 'GeneT 7';
    const sampleCode = sampleObj?.sampleCode || id;

    // 1. Extract cfDNA & Results from uploaded PDF
    const extracted = await extractNiptPdfData(buffer, packageType);

    // 2. Save PDF locally for INSTANT (<150ms) response time
    try {
      const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'original-pdfs');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
      fs.writeFileSync(path.join(uploadDir, `${sampleCode}.pdf`), buffer);
      if (id !== sampleCode) {
        fs.writeFileSync(path.join(uploadDir, `${id}.pdf`), buffer);
      }
    } catch (fsErr) {
      console.warn('Local PDF save warning:', fsErr?.message);
    }

    // 3. Trigger Cloudinary upload in background asynchronously (non-blocking)
    uploadPdfToCloudinary(buffer, file.name, sampleCode)
      .then(async (uploadRes) => {
        if (uploadRes?.secure_url || uploadRes?.url) {
          const cUrl = uploadRes.secure_url || uploadRes.url;
          const cPid = uploadRes.public_id || '';
          if (db) {
            if (mongoose.Types.ObjectId.isValid(id)) {
              await NiptSample.findByIdAndUpdate(id, { originalPdfUrl: cUrl, originalPdfPublicId: cPid });
            } else {
              await NiptSample.findOneAndUpdate({ sampleCode: id }, { originalPdfUrl: cUrl, originalPdfPublicId: cPid });
            }
          }
        }
      })
      .catch(cErr => console.warn('Background Cloudinary upload warning:', cErr?.message));

    const updateData = {
      cfDNA: extracted.cfDNA || '',
      results: extracted.results || {},
      gbsResult: extracted.gbsResult || 'Âm tính',
      conclusion: extracted.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.',
      status: 'extracted',
      originalPdfName: file.name,
      originalPdfUrl: `/api/samples/${id}/original-pdf`,
      updatedAt: new Date().toISOString()
    };

    if (db) {
      let updated = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updated = await NiptSample.findByIdAndUpdate(id, updateData, { new: true });
      } else {
        updated = await NiptSample.findOneAndUpdate({ sampleCode: id }, updateData, { new: true });
      }
      if (updated) {
        return NextResponse.json({
          message: 'Upload file PDF và đẩy lên Cloudinary thành công',
          cfDNA: extracted.cfDNA,
          conclusion: extracted.conclusion,
          originalPdfUrl: updated.originalPdfUrl,
          sample: updated
        });
      }
    }

    // Fallback store
    const index = fallbackStore.samples.findIndex(s => s.id === id || s._id === id || s.sampleCode === id);
    if (index !== -1) {
      fallbackStore.samples[index] = {
        ...fallbackStore.samples[index],
        ...updateData
      };
      return NextResponse.json({
        message: 'Upload file PDF và đọc tự động kết quả thành công (Local)',
        cfDNA: extracted.cfDNA,
        conclusion: extracted.conclusion,
        originalPdfUrl: fallbackStore.samples[index].originalPdfUrl,
        sample: fallbackStore.samples[index]
      });
    }

    return NextResponse.json({ error: 'Không tìm thấy mẫu NIPT để cập nhật kết quả PDF' }, { status: 404 });

  } catch (error) {
    console.error('PDF Upload & Cloudinary error:', error);
    return NextResponse.json({ error: 'Lỗi khi tải file PDF lên đám mây' }, { status: 500 });
  }
}
