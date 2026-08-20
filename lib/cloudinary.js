import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'drjr9j8ct',
  api_key: process.env.CLOUDINARY_API_KEY || '832818238865975',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'kdUQsWh8k-9uG5R_5OQfSX8_-m4',
  secure: true,
});

export async function uploadPdfToCloudinary(buffer, fileName = 'result.pdf', sampleCode = '') {
  return new Promise((resolve, reject) => {
    const cleanBaseName = (fileName || 'result.pdf')
      .replace(/\.pdf$/i, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanCode = (sampleCode || 'SAMPLE')
      .replace(/\s+/g, '_')
      .replace(/[^a-zA-Z0-9_-]/g, '');
    const publicId = `${cleanCode}_${Date.now()}_${cleanBaseName}.pdf`;

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'nipt_original_files',
        resource_type: 'raw',
        public_id: publicId,
      },
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', error);
          reject(error);
        } else {
          resolve(result);
        }
      }
    );

    uploadStream.end(buffer);
  });
}

export default cloudinary;
