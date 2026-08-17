'use client';

import React, { useState } from 'react';
import { X, Dna, FileText, CheckCircle, AlertCircle } from 'lucide-react';

export default function SampleFormModal({ isOpen, onClose, onSave, initialPackage = 'GeneT 7' }) {
  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    idCard: '',
    phone: '',
    address: '',
    gestationalAge: '12 tuần 0 ngày',
    pregnancyType: 'Đơn thai',
    packageType: initialPackage === 'all' ? 'GeneT 7' : initialPackage,
    agencyCode: 'PK-HANOI-01',
    sampleCode: 'GT-' + Math.floor(10000 + Math.random() * 90000),
    doctorName: '',
    tubeType: 'Streck',
    receivedDate: new Date().toISOString().split('T')[0],
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.sampleCode || !formData.packageType) {
      setError('Vui lòng điền đầy đủ các trường bắt buộc (*)');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      setError(err.message || 'Không thể tạo mẫu NIPT');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <Dna className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Thêm Mẫu Xét Nghiệm NIPT Mới</h2>
              <p className="text-xs text-teal-300">Nhập thông tin khách hàng & thông tin hành chính của mẫu</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Thông tin khách hàng */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <span>1. Thông tin Khách hàng (Thai phụ)</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Họ và tên thai phụ <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Ví dụ: Nguyễn Thị A"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày / Năm sinh</label>
                <input
                  type="text"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  placeholder="YYYY-MM-DD hoặc DD/MM/YYYY"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số CMT / CCCD</label>
                <input
                  type="text"
                  name="idCard"
                  value={formData.idCard}
                  onChange={handleChange}
                  placeholder="001..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số điện thoại</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="098..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tuổi thai</label>
                <input
                  type="text"
                  name="gestationalAge"
                  value={formData.gestationalAge}
                  onChange={handleChange}
                  placeholder="12 tuần 0 ngày"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Số lượng thai</label>
                <select
                  name="pregnancyType"
                  value={formData.pregnancyType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="Đơn thai">Đơn thai</option>
                  <option value="Song thai">Song thai</option>
                </select>
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Địa chỉ liên hệ</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh/Thành phố"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Thông tin mẫu xét nghiệm */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-teal-700 mb-3 flex items-center gap-2 border-b border-slate-100 pb-1.5">
              <span>2. Thông tin Mẫu & Đơn vị chỉ định</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mã Barcode / Mã mẫu <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="sampleCode"
                  value={formData.sampleCode}
                  onChange={handleChange}
                  placeholder="GT-2026-..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-teal-800 bg-teal-50/50 border-teal-200 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Gói xét nghiệm NIPT <span className="text-rose-500">*</span>
                </label>
                <select
                  name="packageType"
                  value={formData.packageType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                >
                  <option value="GeneT Eco">GeneT Eco</option>
                  <option value="GeneT 7">GeneT 7</option>
                  <option value="GeneT 23">GeneT 23</option>
                  <option value="GeneT Plus">GeneT Plus (k mở rộng)</option>
                  <option value="GeneT Twins">GeneT Twins (Song thai)</option>
                  <option value="GENNI 4">GENNI 4</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mã Đại lý / Phòng khám</label>
                <input
                  type="text"
                  name="agencyCode"
                  value={formData.agencyCode}
                  onChange={handleChange}
                  placeholder="PK-HANOI-01"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bác sĩ chỉ định</label>
                <input
                  type="text"
                  name="doctorName"
                  value={formData.doctorName}
                  onChange={handleChange}
                  placeholder="BS. Nguyễn Văn..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Loại ống nghiệm</label>
                <input
                  type="text"
                  name="tubeType"
                  value={formData.tubeType}
                  onChange={handleChange}
                  placeholder="Streck"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Ngày nhận mẫu</label>
                <input
                  type="date"
                  name="receivedDate"
                  value={formData.receivedDate}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                />
              </div>
            </div>
          </div>

          {/* Note on cfDNA reading */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2.5">
            <CheckCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Hàm lượng cfDNA tự động đọc từ file PDF</p>
              <p className="text-[11px] text-amber-700">
                Bạn KHÔNG cần nhập chỉ số cfDNA tại đây. Sau khi tạo mẫu, bấm nút <strong>Upload Kết Quả</strong> trên danh sách mẫu, hệ thống sẽ tự động trích xuất chỉ số cfDNA (%) và điền vào mẫu.
              </p>
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
            >
              {loading ? 'Đang lưu...' : 'Lưu Thông Tin Mẫu'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
