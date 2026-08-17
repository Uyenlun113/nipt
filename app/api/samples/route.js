import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { fallbackStore } from '@/lib/store-fallback';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const packageFilter = searchParams.get('package');
    const search = searchParams.get('search');

    const db = await connectToDatabase();
    if (db) {
      const query = {};
      if (packageFilter && packageFilter !== 'all') {
        query.packageType = packageFilter;
      }
      if (search) {
        query.$or = [
          { fullName: { $regex: search, $options: 'i' } },
          { sampleCode: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } },
          { idCard: { $regex: search, $options: 'i' } },
        ];
      }
      const samples = await NiptSample.find(query).sort({ createdAt: -1 });
      return NextResponse.json(samples);
    }

    // Fallback store
    let filtered = [...fallbackStore.samples];
    if (packageFilter && packageFilter !== 'all') {
      filtered = filtered.filter(s => s.packageType === packageFilter);
    }
    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(s =>
        (s.fullName || '').toLowerCase().includes(term) ||
        (s.sampleCode || '').toLowerCase().includes(term) ||
        (s.phone || '').includes(term) ||
        (s.idCard || '').includes(term)
      );
    }
    return NextResponse.json(filtered);
  } catch (error) {
    console.error('Fetch samples error:', error);
    return NextResponse.json({ error: 'Không thể lấy danh sách mẫu NIPT' }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      fullName,
      dob,
      idCard,
      phone,
      address,
      gestationalAge,
      pregnancyType,
      packageType,
      agencyCode,
      sampleCode,
      doctorName,
      tubeType,
      receivedDate
    } = body;

    if (!fullName || !packageType || !sampleCode) {
      return NextResponse.json({ error: 'Họ tên, Gói xét nghiệm và Barcode / Mã số mẫu là bắt buộc' }, { status: 400 });
    }

    const db = await connectToDatabase();
    if (db) {
      const existing = await NiptSample.findOne({ sampleCode });
      if (existing) {
        return NextResponse.json({ error: 'Mã Barcode / Mã mẫu đã tồn tại' }, { status: 400 });
      }
      const newSample = await NiptSample.create({
        fullName,
        dob: dob || '',
        idCard: idCard || '',
        phone: phone || '',
        address: address || '',
        gestationalAge: gestationalAge || '',
        pregnancyType: pregnancyType || 'Đơn thai',
        packageType,
        agencyCode: agencyCode || '',
        sampleCode,
        doctorName: doctorName || '',
        tubeType: tubeType || 'Streck',
        receivedDate: receivedDate || new Date().toISOString().split('T')[0],
        cfDNA: '',
        results: {},
        status: 'pending'
      });
      return NextResponse.json({ message: 'Tạo mẫu NIPT thành công', sample: newSample });
    }

    // Fallback store
    const exists = fallbackStore.samples.find(s => s.sampleCode === sampleCode);
    if (exists) {
      return NextResponse.json({ error: 'Mã Barcode / Mã mẫu đã tồn tại' }, { status: 400 });
    }

    const newFbSample = {
      id: 'sample_' + Date.now(),
      sampleCode,
      fullName,
      dob: dob || '',
      idCard: idCard || '',
      phone: phone || '',
      address: address || '',
      gestationalAge: gestationalAge || '',
      pregnancyType: pregnancyType || 'Đơn thai',
      packageType,
      agencyCode: agencyCode || '',
      doctorName: doctorName || '',
      tubeType: tubeType || 'Streck',
      receivedDate: receivedDate || new Date().toISOString().split('T')[0],
      cfDNA: '',
      results: {},
      status: 'pending',
      originalPdfName: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    fallbackStore.samples.unshift(newFbSample);

    return NextResponse.json({ message: 'Tạo mẫu NIPT thành công (Local)', sample: newFbSample });

  } catch (error) {
    console.error('Create sample error:', error);
    return NextResponse.json({ error: 'Không thể tạo mẫu NIPT mới' }, { status: 500 });
  }
}
