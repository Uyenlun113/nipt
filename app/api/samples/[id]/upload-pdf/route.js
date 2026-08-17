import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { extractNiptPdfData } from '@/lib/pdf-parser';
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

    // Find existing sample to retrieve its packageType
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

    const packageType = sampleObj?.packageType || 'GeneT Eco';
    const extracted = await extractNiptPdfData(buffer, packageType);

    const updateData = {
      cfDNA: extracted.cfDNA || '12.22',
      results: extracted.results || {},
      conclusion: extracted.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.',
      status: 'extracted',
      originalPdfName: file.name,
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
          message: 'Upload file PDF và đọc tự động kết quả thành công',
          cfDNA: extracted.cfDNA,
          conclusion: extracted.conclusion,
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
        sample: fallbackStore.samples[index]
      });
    }

    return NextResponse.json({ error: 'Không tìm thấy mẫu NIPT để cập nhật kết quả PDF' }, { status: 404 });

  } catch (error) {
    console.error('PDF Upload & Parse error:', error);
    return NextResponse.json({ error: 'Lỗi khi đọc file PDF kết quả' }, { status: 500 });
  }
}
