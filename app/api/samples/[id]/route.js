import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { fallbackStore } from '@/lib/store-fallback';
import mongoose from 'mongoose';

export async function GET(req, { params }) {
  try {
    const { id } = params;
    const db = await connectToDatabase();
    if (db) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const sample = await NiptSample.findById(id);
        if (sample) return NextResponse.json(sample);
      } else {
        const sample = await NiptSample.findOne({ sampleCode: id });
        if (sample) return NextResponse.json(sample);
      }
    }

    const sample = fallbackStore.samples.find(s => s.id === id || s._id === id || s.sampleCode === id);
    if (sample) return NextResponse.json(sample);

    return NextResponse.json({ error: 'Không tìm thấy mẫu NIPT' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi máy chủ' }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = params;
    const body = await req.json();

    const db = await connectToDatabase();
    if (db) {
      let updated = null;
      if (mongoose.Types.ObjectId.isValid(id)) {
        updated = await NiptSample.findByIdAndUpdate(id, body, { new: true });
      } else {
        updated = await NiptSample.findOneAndUpdate({ sampleCode: id }, body, { new: true });
      }
      if (updated) return NextResponse.json({ message: 'Cập nhật mẫu thành công', sample: updated });
    }

    const index = fallbackStore.samples.findIndex(s => s.id === id || s._id === id || s.sampleCode === id);
    if (index !== -1) {
      fallbackStore.samples[index] = {
        ...fallbackStore.samples[index],
        ...body,
        updatedAt: new Date().toISOString()
      };
      return NextResponse.json({ message: 'Cập nhật mẫu thành công (Local)', sample: fallbackStore.samples[index] });
    }

    return NextResponse.json({ error: 'Không tìm thấy mẫu NIPT để cập nhật' }, { status: 404 });
  } catch (error) {
    console.error('Update sample error:', error);
    return NextResponse.json({ error: 'Lỗi cập nhật thông tin mẫu' }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = params;
    const db = await connectToDatabase();
    if (db) {
      if (mongoose.Types.ObjectId.isValid(id)) {
        await NiptSample.findByIdAndDelete(id);
      } else {
        await NiptSample.findOneAndDelete({ sampleCode: id });
      }
      return NextResponse.json({ message: 'Đã xóa mẫu NIPT' });
    }

    const index = fallbackStore.samples.findIndex(s => s.id === id || s._id === id || s.sampleCode === id);
    if (index !== -1) {
      fallbackStore.samples.splice(index, 1);
      return NextResponse.json({ message: 'Đã xóa mẫu NIPT (Local)' });
    }

    return NextResponse.json({ error: 'Không tìm thấy mẫu NIPT để xóa' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Lỗi xóa mẫu NIPT' }, { status: 500 });
  }
}
