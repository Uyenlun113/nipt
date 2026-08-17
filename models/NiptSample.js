import mongoose from 'mongoose';

const NiptSampleSchema = new mongoose.Schema({
  sampleCode: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  dob: { type: String },
  idCard: { type: String },
  phone: { type: String },
  address: { type: String },
  gestationalAge: { type: String },
  pregnancyType: { type: String, default: 'Đơn thai' },
  packageType: { type: String, required: true },
  agencyCode: { type: String },
  doctorName: { type: String },
  tubeType: { type: String, default: 'Streck' },
  receivedDate: { type: String },
  cfDNA: { type: String, default: '' },
  results: { type: Object, default: {} },
  gbsResult: { type: String, default: 'Âm tính' },
  conclusion: { type: String, default: 'Chưa phát hiện lệch bội nhiễm sắc thể trên các cặp NST khảo sát.' },
  status: { type: String, enum: ['pending', 'completed', 'extracted'], default: 'pending' },
  originalPdfUrl: { type: String, default: '' },
  originalPdfName: { type: String, default: '' },
  createdById: { type: String },
}, { timestamps: true });

export default mongoose.models.NiptSample || mongoose.model('NiptSample', NiptSampleSchema);
