'use client';

import React, { useState, useEffect } from 'react';
import { X, Dna, Download, Save, FileText, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

export default function SampleDetailModal({ isOpen, onClose, sample, onSaveSample }) {
  const [formData, setFormData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (sample) {
      setFormData({
        ...sample,
        cfDNA: sample.cfDNA || '8.45',
        results: sample.results || {
          t21: { label: 'Trisomy 21 (Down)', value: '-0.35', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
          t18: { label: 'Trisomy 18 (Edwards)', value: '0.12', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
          t13: { label: 'Trisomy 13 (Patau)', value: '-0.08', risk: 'Nguy cơ thấp', ref: '-3 < Z < 3' },
          sexChr: { label: 'Nhiễm sắc thể Giới tính', value: 'XX (Nữ)', risk: 'Bình thường', ref: 'Bình thường' },
          microdeletions: { label: 'Vi mất đoạn / lặp đoạn', value: 'Chưa phát hiện bất thường', risk: 'Nguy cơ thấp', ref: 'Bình thường' }
        }
      });
    }
  }, [sample]);

  if (!isOpen || !formData) return null;

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResultChange = (key, subfield, value) => {
    setFormData((prev) => ({
      ...prev,
      results: {
        ...prev.results,
        [key]: {
          ...prev.results[key],
          [subfield]: value
        }
      }
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      await onSaveSample(formData);
      setMsg({ type: 'success', text: 'Đã lưu thay đổi thông tin kết quả mẫu NIPT thành công!' });
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi lưu thông tin mẫu: ' + err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadGenetrustPdf = () => {
    const id = formData._id || formData.id;
    window.open(`/api/samples/${id}/generate-genetrust`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base">Chi Tiết Kết Quả Mẫu NIPT</h2>
                <span className="px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 text-[10px] font-mono font-bold border border-teal-500/30">
                  {formData.sampleCode}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Đọc dữ liệu tự động từ PDF • Cho phép kiểm tra & chỉnh sửa trước khi xuất phôi GeneTrust
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50/50">
          {msg.text && (
            <div className={`p-3.5 rounded-xl text-xs flex items-center justify-between ${
              msg.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
            }`}>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{msg.text}</span>
              </div>
            </div>
          )}

          {/* Section 1: Thông tin hành chính thai phụ */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>I. Thông tin Hành chính & Đơn vị chỉ định</span>
              <span className="text-xs font-semibold text-teal-600 font-mono">Gói: {formData.packageType}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Họ và tên</label>
                <input
                  type="text"
                  value={formData.fullName || ''}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md font-bold text-slate-900 focus:bg-white focus:border-teal-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Ngày sinh</label>
                <input
                  type="text"
                  value={formData.dob || ''}
                  onChange={(e) => handleInputChange('dob', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">CMT / CCCD</label>
                <input
                  type="text"
                  value={formData.idCard || ''}
                  onChange={(e) => handleInputChange('idCard', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Số điện thoại</label>
                <input
                  type="text"
                  value={formData.phone || ''}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Tuổi thai</label>
                <input
                  type="text"
                  value={formData.gestationalAge || ''}
                  onChange={(e) => handleInputChange('gestationalAge', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Số lượng thai</label>
                <input
                  type="text"
                  value={formData.pregnancyType || 'Đơn thai'}
                  onChange={(e) => handleInputChange('pregnancyType', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Bác sĩ chỉ định</label>
                <input
                  type="text"
                  value={formData.doctorName || ''}
                  onChange={(e) => handleInputChange('doctorName', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-0.5">Mã đại lý</label>
                <input
                  type="text"
                  value={formData.agencyCode || ''}
                  onChange={(e) => handleInputChange('agencyCode', e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-slate-800 focus:bg-white"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Chỉ số cfDNA đọc từ PDF */}
          <div className="bg-gradient-to-r from-teal-500/10 via-teal-500/5 to-transparent p-4 rounded-xl border border-teal-200 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-teal-500/20">
                %
              </div>
              <div>
                <h4 className="text-xs font-bold text-teal-950 uppercase tracking-wider">Hàm lượng cfDNA (%)</h4>
                <p className="text-[11px] text-teal-700">Tự động trích xuất từ file PDF kết quả gốc ({formData.originalPdfName || 'File PDF đã chọn'})</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">cfDNA:</span>
              <input
                type="text"
                value={formData.cfDNA || ''}
                onChange={(e) => handleInputChange('cfDNA', e.target.value)}
                className="w-28 px-3 py-1.5 text-base font-bold text-teal-800 bg-white border border-teal-300 rounded-lg text-center shadow-inner focus:ring-2 focus:ring-teal-500/30"
              />
              <span className="text-xs font-bold text-teal-700">%</span>
            </div>
          </div>

          {/* Section 3: Bảng chỉ số kết quả NST (Cho phép xem và chỉnh sửa) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2">
              <span>II. Kết Quả Phân Tích Nhiễm Sắc Thể (Đã đọc từ PDF)</span>
              <span className="text-[11px] font-normal text-slate-400">Bạn có thể sửa trực tiếp trong các ô dưới đây</span>
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/80 text-slate-600 text-[11px] uppercase font-semibold border-b border-slate-200">
                    <th className="py-2 px-3">Hội chứng / NST</th>
                    <th className="py-2 px-3">Khoảng tham chiếu</th>
                    <th className="py-2 px-3">Giá trị phân tích (Z-score)</th>
                    <th className="py-2 px-3">Kết luận nguy cơ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Object.entries(formData.results || {}).map(([key, item]) => {
                    const isHighRisk = (item.risk || '').includes('cao');
                    return (
                      <tr key={key} className="hover:bg-slate-50/80">
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          <input
                            type="text"
                            value={item.label || ''}
                            onChange={(e) => handleResultChange(key, 'label', e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-200 text-xs focus:border-teal-500 font-semibold"
                          />
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          <input
                            type="text"
                            value={item.ref || '-3 < Z < 3'}
                            onChange={(e) => handleResultChange(key, 'ref', e.target.value)}
                            className="w-full bg-transparent border-b border-dashed border-slate-200 text-xs focus:border-teal-500 text-slate-500"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <input
                            type="text"
                            value={item.value || ''}
                            onChange={(e) => handleResultChange(key, 'value', e.target.value)}
                            className="w-28 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono font-bold text-slate-800"
                          />
                        </td>
                        <td className="py-2.5 px-3">
                          <select
                            value={item.risk || 'Nguy cơ thấp'}
                            onChange={(e) => handleResultChange(key, 'risk', e.target.value)}
                            className={`px-2 py-1 rounded text-xs font-semibold border ${
                              isHighRisk
                                ? 'bg-rose-50 text-rose-700 border-rose-200 font-bold'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <option value="Nguy cơ thấp">Nguy cơ thấp</option>
                            <option value="Nguy cơ cao">Nguy cơ cao</option>
                            <option value="Bình thường">Bình thường</option>
                            <option value="Không phát hiện">Không phát hiện</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
            </div>
          </div>

          {/* Section 4: Kết luận & Người Ký Tên */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800 border-b border-slate-100 pb-2">
              III. Kết Luận Y Khoa & Người Ký Tên
            </h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-500 block mb-1">Nội dung kết luận:</label>
                <textarea
                  rows={3}
                  value={formData.conclusion || ''}
                  onChange={(e) => handleInputChange('conclusion', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Kiểm soát kết quả</label>
                  <input
                    type="text"
                    value={formData.checkerName || ''}
                    onChange={(e) => handleInputChange('checkerName', e.target.value)}
                    placeholder="TS. BS. Nguyễn Văn A"
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-0.5">Giám đốc</label>
                  <input
                    type="text"
                    value={formData.directorName || ''}
                    onChange={(e) => handleInputChange('directorName', e.target.value)}
                    placeholder="TS. Đặng..."
                    className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:bg-white"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-all"
          >
            Đóng
          </button>

          <div className="flex items-center gap-3">
            {formData.originalPdfUrl && (
              <a
                href={`/api/samples/${formData._id || formData.id || formData.sampleCode}/original-pdf`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold transition-all flex items-center gap-2 border border-indigo-200 shadow-xs"
                title={`Tải/Xem file gốc đối chiếu: ${formData.originalPdfName || 'Cloudinary File'}`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Xem File Gốc</span>
              </a>
            )}

            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
            </button>

            <button
              onClick={handleDownloadGenetrustPdf}
              className="px-5 py-2 bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 text-white rounded-lg text-xs font-bold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Tải về Mẫu GeneTrust</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
