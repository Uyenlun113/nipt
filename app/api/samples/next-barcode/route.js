import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { fallbackStore } from '@/lib/store-fallback';
import { generateNextSequentialBarcode } from '@/lib/barcode-utils';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const packageType = searchParams.get('package') || 'GeneT 7';

    let existingCodes = [];

    const db = await connectToDatabase();
    if (db) {
      const samples = await NiptSample.find({}, { sampleCode: 1, _id: 0 }).lean();
      existingCodes = samples.map((s) => s.sampleCode).filter(Boolean);
    } else {
      existingCodes = (fallbackStore.samples || []).map((s) => s.sampleCode).filter(Boolean);
    }

    const nextBarcode = generateNextSequentialBarcode(packageType, existingCodes);

    return NextResponse.json({ sampleCode: nextBarcode });
  } catch (error) {
    console.error('Error fetching next barcode:', error);
    return NextResponse.json({ sampleCode: 'GT7-000001' });
  }
}
