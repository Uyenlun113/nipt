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
  reportDate: { type: String },
  cfDNA: { type: String, default: '' },
  results: { type: Object, default: {} },
  results20GA: { type: Object, default: {} },
  gbsResult: { type: String, default: 'Âm tính' },
  conclusion: { type: String, default: 'Chưa phát hiện lệch bội nhiễm sắc thể trên các cặp NST khảo sát.' },
  conclusion20GA: { type: String, default: 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.' },
  checkerName: { type: String, default: '' },
  directorName: { type: String, default: '' },
  hasMstStamp: { type: Boolean, default: false },
  status: { type: String, enum: ['pending', 'completed', 'extracted'], default: 'pending' },
  originalPdfUrl: { type: String, default: '' },
  originalPdfName: { type: String, default: '' },
  originalPdf20GAUrl: { type: String, default: '' },
  originalPdf20GAName: { type: String, default: '' },
  createdById: { type: String },
}, { timestamps: true });

NiptSampleSchema.index({ packageType: 1, createdAt: -1 });
NiptSampleSchema.index({ createdAt: -1 });
NiptSampleSchema.index({ fullName: 1 });
NiptSampleSchema.index({ phone: 1 });
NiptSampleSchema.index({ idCard: 1 });

export default mongoose.models.NiptSample || mongoose.model('NiptSample', NiptSampleSchema);
