import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import NiptSample from '@/models/NiptSample';
import { fallbackStore } from '@/lib/store-fallback';
import mongoose from 'mongoose';
import cloudinary from '@/lib/cloudinary';

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
    const originalPdfPublicId = sample.originalPdfPublicId || '';
    const originalPdfName = sample.originalPdfName || 'original.pdf';

    // 1. Try downloading using Cloudinary signed private download URL
    if (originalPdfPublicId || originalPdfUrl) {
      let publicId = originalPdfPublicId;
      if (!publicId && originalPdfUrl) {
        const parts = originalPdfUrl.split('/nipt_original_files/');
        if (parts.length > 1) {
          publicId = 'nipt_original_files/' + parts[1].replace(/\.pdf\.pdf$/i, '.pdf');
        }
      }

      if (publicId) {
        const resourceTypes = ['image', 'raw'];
        for (const resType of resourceTypes) {
          try {
            const signedDownloadUrl = cloudinary.utils.private_download_url(publicId, 'pdf', {
              resource_type: resType,
              type: 'upload'
            });

            const pdfRes = await fetch(signedDownloadUrl);
            if (pdfRes.ok) {
              const pdfBuffer = await pdfRes.arrayBuffer();
              return new NextResponse(Buffer.from(pdfBuffer), {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `inline; filename="${encodeURIComponent(originalPdfName)}"`,
                },
              });
            }
          } catch (e) {
            console.warn(`Cloudinary fetch attempt error for ${resType}:`, e?.message);
          }
        }
      }

      // 2. Direct fetch fallback with url variants
      if (originalPdfUrl && originalPdfUrl.startsWith('http')) {
        const urlVariants = [
          originalPdfUrl,
          originalPdfUrl.replace('/image/upload/', '/raw/upload/'),
          originalPdfUrl.replace('/raw/upload/', '/image/upload/'),
          originalPdfUrl.replace('.pdf.pdf', '.pdf'),
        ];

        for (const targetUrl of urlVariants) {
          try {
            const pdfRes = await fetch(targetUrl);
            if (pdfRes.ok) {
              const pdfBuffer = await pdfRes.arrayBuffer();
              return new NextResponse(Buffer.from(pdfBuffer), {
                headers: {
                  'Content-Type': 'application/pdf',
                  'Content-Disposition': `inline; filename="${encodeURIComponent(originalPdfName)}"`,
                },
              });
            }
          } catch (e) {}
        }
      }
    }

    return NextResponse.json({ error: 'Không tìm thấy file PDF gốc đối chiếu. Vui lòng tải lại file PDF kết quả.' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching original PDF:', error);
    return NextResponse.json({ error: 'Lỗi máy chủ khi tải file PDF gốc' }, { status: 500 });
  }
}
