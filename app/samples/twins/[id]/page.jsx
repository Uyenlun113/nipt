'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { checkAuth, logout } from '@/lib/auth-client';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import {
  ArrowLeft,
  Save,
  Download,
  CheckCircle2,
  Clock,
  Upload,
  RefreshCw,
  Eye,
  FileText
} from 'lucide-react';

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  if (dateStr.includes('/')) return dateStr;
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function TwinsSampleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sampleId = params.id;

  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });
  const [previewKey, setPreviewKey] = useState(Date.now());

  useEffect(() => {
    return checkAuth(router, setUser);
  }, [router]);

  useEffect(() => {
    if (sampleId) {
      fetchSampleDetail();
    }
  }, [sampleId]);

  const fetchSampleDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/samples/${sampleId}`);
      if (res.ok) {
        const data = await res.json();

        const defaultTwinsResults = {
          t21: { label: 'Trisomy 21 (Down)', value: '', risk: '', ref: '-3 < Z < 3' },
          t18: { label: 'Trisomy 18 (Edwards)', value: '', risk: '', ref: '-3 < Z < 3' },
          t13: { label: 'Trisomy 13 (Patau)', value: '', risk: '', ref: '-3 < Z < 3' }
        };

        const hasCustomResults = data.results && Object.keys(data.results).length > 0;
        let activeResults = hasCustomResults ? { ...data.results } : defaultTwinsResults;

        delete activeResults.sexChr;
        delete activeResults.microdeletions;

        setFormData({
          ...data,
          packageType: 'GeneT Twins',
          pregnancyType: data.pregnancyType || 'Song thai',
          dob: formatDateVN(data.dob),
          receivedDate: formatDateVN(data.receivedDate),
          cfDNA: data.cfDNA || '',
          conclusion: data.conclusion || 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra.',
          results: activeResults
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

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
      const res = await fetch(`/api/samples/${sampleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');

      setMsg({ type: 'success', text: 'Đã lưu thay đổi Mẫu GeneT Twins & cập nhật bản xem trước PDF!' });
      setPreviewKey(Date.now());
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg({ type: '', text: '' });

    const dataForm = new FormData();
    dataForm.append('pdfFile', file);

    try {
      const res = await fetch(`/api/samples/${sampleId}/upload-pdf`, {
        method: 'POST',
        body: dataForm,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đọc PDF');

      setMsg({ type: 'success', text: `Upload & Đọc file PDF ${file.name} thành công. cfDNA: ${data.cfDNA}%` });
      fetchSampleDetail();
      setPreviewKey(Date.now());
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi upload PDF: ' + err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/samples/${sampleId}/generate-genetrust`, '_blank');
  };

  if (loading || !formData) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center font-bold text-slate-600 text-sm">
          <div className="w-8 h-8 border-3 border-rose-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Đang tải trang chi tiết Mẫu GeneT Twins...
        </div>
      </div>
    );
  }

  const pdfPreviewUrl = `/api/samples/${sampleId}/generate-genetrust?t=${previewKey}`;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} selectedPackage="GeneT Twins" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 w-full">
          {/* Top Title & Actions Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div className="flex items-center gap-4">
              <Link
                href="/packages/twins"
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Chi Tiết Mẫu GeneT Twins (Song Thai - Phôi 1 Trang)
                  </h1>
                  <span className="px-3 py-1 bg-rose-100 text-rose-900 font-mono font-extrabold text-sm rounded-lg border border-rose-200">
                    {formData.sampleCode}
                  </span>
                  {(formData.status === 'completed' || formData.status === 'extracted' || formData.originalPdfUrl || formData.cfDNA) ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-extrabold rounded-lg border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      Đã trả kết quả
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-amber-600" />
                      Chờ kết quả
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  Trang xử lý riêng biệt dành riêng cho Gói Xét Nghiệm NIPT GeneT Twins (Chỉ chèn Trang 1 phôi)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(formData.status === 'completed' || formData.status === 'extracted' || formData.originalPdfUrl || formData.cfDNA) ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/samples/${sampleId}/original-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-indigo-200 shadow-xs"
                    title={`Xem/Tải file PDF gốc đối chiếu: ${formData.originalPdfName || 'File PDF'}`}
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Xem File Gốc Đối Chiếu</span>
                  </a>
                </div>
              ) : (
                <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2 border border-slate-300">
                  <Upload className="w-4 h-4 text-slate-700" />
                  <span>{uploading ? 'Đang đọc...' : 'Upload File PDF Kết Quả'}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu Mẫu Twins'}</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-rose-600/20 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Xuất PDF Phôi Twins</span>
              </button>
            </div>
          </div>

          {/* Status Message */}
          {msg.text && (
            <div
              className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* STACKED FULL WIDTH SECTIONS */}
          <div className="space-y-8 w-full">
            {/* 1. Administrative Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                1. Thông Tin Thai Phụ & Mẫu Xét Nghiệm
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 mb-1">Họ và tên Thai Phụ</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ngày sinh (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={formData.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Số CMND / CCCD</label>
                  <input
                    type="text"
                    value={formData.idCard || ''}
                    onChange={(e) => handleInputChange('idCard', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Tuổi Thai</label>
                  <input
                    type="text"
                    value={formData.gestationalAge || ''}
                    onChange={(e) => handleInputChange('gestationalAge', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Loại Thai</label>
                  <input
                    type="text"
                    value={formData.pregnancyType || 'Song thai'}
                    onChange={(e) => handleInputChange('pregnancyType', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-bold focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Mã Barcode</label>
                  <input
                    type="text"
                    value={formData.sampleCode || ''}
                    onChange={(e) => handleInputChange('sampleCode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Mã Đơn Vị Chỉ Định</label>
                  <input
                    type="text"
                    value={formData.agencyCode || ''}
                    onChange={(e) => handleInputChange('agencyCode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Hàm lượng cfDNA (%)</label>
                  <input
                    type="text"
                    value={formData.cfDNA || ''}
                    onChange={(e) => handleInputChange('cfDNA', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-rose-50 border border-rose-300 rounded-xl text-rose-900 font-mono font-black text-sm focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Bác Sĩ Chỉ Định</label>
                  <input
                    type="text"
                    value={formData.doctorName || ''}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                  />
                </div>
              </div>
            </div>

            {/* 2. Results Table: 3 Syndromes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  2. Kết Quả Xét Nghiệm (I. Lệch Bội Phổ Biến - 3 Hội Chứng)
                </h3>
                <span className="text-xs text-rose-700 font-bold bg-rose-50 px-3 py-1 rounded-lg border border-rose-200">
                  Dành riêng cho Song Thai (Trisomy 21, 18, 13)
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-xs font-bold text-slate-600 uppercase border-b border-slate-200">
                      <th className="py-3 px-4">Hội Chứng</th>
                      <th className="py-3 px-4">Khoảng Tham Chiếu</th>
                      <th className="py-3 px-4">Giá Trị Phân Tích (Z-Score)</th>
                      <th className="py-3 px-4">Kết Luận Nguy Cơ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {['t21', 't18', 't13'].map((key) => {
                      const item = formData.results?.[key] || {};
                      const label = key === 't21' ? 'Trisomy 21 (Down)' : key === 't18' ? 'Trisomy 18 (Edwards)' : 'Trisomy 13 (Patau)';
                      const isHigh = (item.risk || '').includes('cao');

                      return (
                        <tr key={key} className="hover:bg-slate-50/50">
                          <td className="py-3.5 px-4 font-bold text-slate-900">{label}</td>
                          <td className="py-3.5 px-4 text-slate-500 font-mono text-xs">{item.ref || '-3 < Z < 3'}</td>
                          <td className="py-3.5 px-4">
                            <input
                              type="text"
                              value={item.value || ''}
                              onChange={(e) => handleResultChange(key, 'value', e.target.value)}
                              className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono font-bold focus:bg-white focus:outline-none focus:border-rose-500 text-center"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={item.risk || 'Nguy cơ thấp'}
                              onChange={(e) => handleResultChange(key, 'risk', e.target.value)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${isHigh
                                ? 'bg-rose-50 text-rose-800 border-rose-300'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                }`}
                            >
                              <option value="Nguy cơ thấp">Nguy cơ thấp</option>
                              <option value="Nguy cơ cao">Nguy cơ cao</option>
                            </select>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 3. Conclusion & Signatures (Full width) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                3. Phiên Giải Kết Luận Y Khoa (Conclusion) & Người Ký Tên
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-2">
                    Nội dung kết luận chèn vào phôi GeneTrust Twins:
                  </label>
                  <textarea
                    rows={4}
                    value={formData.conclusion || ''}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 leading-relaxed focus:bg-white focus:outline-none focus:border-rose-500 font-medium"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kiểm soát kết quả</label>
                    <input
                      type="text"
                      value={formData.checkerName || ''}
                      onChange={(e) => handleInputChange('checkerName', e.target.value)}
                      placeholder="TS. BS. Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giám đốc</label>
                    <input
                      type="text"
                      value={formData.directorName || ''}
                      onChange={(e) => handleInputChange('directorName', e.target.value)}
                      placeholder="TS. Đặng..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>
              <div className="pt-2 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang cập nhật...' : 'Cập Nhật Kết Luận & Xem Thử Phôi'}</span>
                </button>
              </div>
            </div>

            {/* Section: Supplementary Result (Ket qua phu - GBS) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    Kết Quả Phụ Đính Kèm
                  </h3>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-full border border-indigo-200">
                  Đính kèm trang Kết quả phụ.pdf
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-slate-600 font-bold text-xs mb-2">
                    Kết Quả Xét Nghiệm GBS:
                  </label>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleInputChange('gbsResult', 'Âm tính')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${(formData?.gbsResult || 'Âm tính') === 'Âm tính'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ÂM TÍNH</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInputChange('gbsResult', 'Dương tính')}
                      className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-extrabold border transition-all flex items-center justify-center gap-2 ${formData?.gbsResult === 'Dương tính'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                    >
                      <Clock className="w-4 h-4" />
                      <span>DƯƠNG TÍNH</span>
                    </button>
                  </div>
                </div>

              </div>
            </div>

            {/* 4. Live PDF Preview (Full width) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4 flex flex-col">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                  4. Xem Trực Tiếp Phôi In GeneTrust Twins (Full Width)
                </h3>
                <button
                  onClick={() => setPreviewKey(Date.now())}
                  className="text-xs font-bold text-rose-700 hover:text-rose-900 flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Làm mới phôi</span>
                </button>
              </div>

              <div className="w-full h-[850px] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 relative">
                <iframe
                  src={pdfPreviewUrl}
                  className="w-full h-full min-h-[850px]"
                  title="Bản xem trước phôi GeneTrust Twins"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
