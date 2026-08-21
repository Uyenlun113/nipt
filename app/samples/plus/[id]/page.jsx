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
  Search,
  Dna,
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

export default function GeneTPlusSampleDetailPage() {
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

  // Search filter for 92 microdeletions
  const [microSearch, setMicroSearch] = useState('');

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
      if (!res.ok) throw new Error('Không thể tải thông tin mẫu');
      const data = await res.json();

      if (!data.results) {
        data.results = {
          t21: { label: 'HC Down (Trisomy 21)', value: '', risk: '', ref: '-3 < Z < 3' },
          t18: { label: 'HC Edwards (Trisomy 18)', value: '', risk: '', ref: '-3 < Z < 3' },
          t13: { label: 'HC Patau (Trisomy 13)', value: '', risk: '', ref: '-3 < Z < 3' },

          turner: { label: 'HC Turner (45, XO)', value: '', risk: '', ref: '-3 < Z < 3' },
          klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: '', ref: '-3 < Z < 3' },
          jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: '', ref: '-3 < Z < 3' },
          tripleX: { label: 'HC Siêu nữ (47, XXX)', value: '', risk: '', ref: '-3 < Z < 3' },

          otherTrisomies: {
            t1: { label: 'Trisomy 1', value: '', risk: '', ref: '-3 < Z < 3' },
            t2: { label: 'Trisomy 2', value: '', risk: '', ref: '-3 < Z < 3' },
            t3: { label: 'Trisomy 3', value: '', risk: '', ref: '-3 < Z < 3' },
            t4: { label: 'Trisomy 4', value: '', risk: '', ref: '-3 < Z < 3' },
            t5: { label: 'Trisomy 5', value: '', risk: '', ref: '-3 < Z < 3' },
            t6: { label: 'Trisomy 6', value: '', risk: '', ref: '-3 < Z < 3' },
            t7: { label: 'Trisomy 7', value: '', risk: '', ref: '-3 < Z < 3' },
            t8: { label: 'Trisomy 8', value: '', risk: '', ref: '-3 < Z < 3' },
            t9: { label: 'Trisomy 9', value: '', risk: '', ref: '-3 < Z < 3' },
            t10: { label: 'Trisomy 10', value: '', risk: '', ref: '-3 < Z < 3' },
            t11: { label: 'Trisomy 11', value: '', risk: '', ref: '-3 < Z < 3' },
            t12: { label: 'Trisomy 12', value: '', risk: '', ref: '-3 < Z < 3' },
            t14: { label: 'Trisomy 14', value: '', risk: '', ref: '-3 < Z < 3' },
            t15: { label: 'Trisomy 15', value: '', risk: '', ref: '-3 < Z < 3' },
            t16: { label: 'Trisomy 16', value: '', risk: '', ref: '-3 < Z < 3' },
            t17: { label: 'Trisomy 17', value: '', risk: '', ref: '-3 < Z < 3' },
            t19: { label: 'Trisomy 19', value: '', risk: '', ref: '-3 < Z < 3' },
            t20: { label: 'Trisomy 20', value: '', risk: '', ref: '-3 < Z < 3' },
            t22: { label: 'Trisomy 22', value: '', risk: '', ref: '-3 < Z < 3' },
          },
          microdeletions: []
        };
      }

      if (!data.conclusion) {
        data.conclusion = 'Bộ nhiễm sắc thể người bình thường bao gồm 23 cặp, trong đó có 22 cặp Nhiễm sắc thể thường và 1 cặp nhiễm sắc thể giới tính. Mỗi cặp có 2 nhiễm sắc thể. Kết quả NIPT nguy cơ thấp phản ánh không có bất thường về số lượng Nhiễm sắc thể đối với các cặp Nhiễm sắc thể được kiểm tra. Mất đoạn, lặp đoạn xảy ra do mất hoặc thêm vật chất di truyền ở trên một nhiễm sắc thể. Các bất thường này có thể gây ra các khuyết tật bẩm sinh. Kết quả xét nghiệm “Không phát hiện” phản ánh không phát hiện các bất thường vi mất, lặp đoạn nằm trong khả năng bao phủ của xét nghiệm.';
      }

      setFormData(data);
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleResultChange = (sec, key, field, value) => {
    setFormData((prev) => {
      const newRes = { ...prev.results };
      if (sec === 'main') {
        newRes[key] = { ...newRes[key], [field]: value };
      } else if (sec === 'others') {
        newRes.otherTrisomies = { ...newRes.otherTrisomies };
        newRes.otherTrisomies[key] = { ...newRes.otherTrisomies[key], [field]: value };
      }
      return { ...prev, results: newRes };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const res = await fetch(`/api/samples/${sampleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Không thể lưu thông tin mẫu');
      const updated = await res.json();
      setFormData(updated);
      setPreviewKey(Date.now());
      setMsg({ type: 'success', text: 'Cập nhật mẫu GeneT Plus thành công!' });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMsg({ type: '', text: '' });

    const form = new FormData();
    form.append('pdfFile', file);

    try {
      const res = await fetch(`/api/samples/${sampleId}/upload-pdf`, {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đọc PDF');

      setFormData(data.sample);
      setPreviewKey(Date.now());
      const microCount = data.sample?.results?.microdeletions?.length || 0;
      setMsg({
        type: 'success',
        text: `Đã đọc thành công cfDNA ${data.cfDNA}%, 23 cặp NST và trích xuất ${microCount} hội chứng vi mất/lặp đoạn từ ${file.name}`
      });
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadBothPdfs = () => {
    window.open(`/api/samples/${sampleId}/generate-genetrust`, '_blank');
    setTimeout(() => {
      window.open(`/api/samples/${sampleId}/generate-supplementary`, '_blank');
    }, 400);
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center font-sans">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-slate-600">Đang tải thông tin mẫu GeneT Plus...</p>
        </div>
      </div>
    );
  }

  const otherKeys = [
    { key: 't1', label: 'Trisomy 1' }, { key: 't2', label: 'Trisomy 2' }, { key: 't3', label: 'Trisomy 3' },
    { key: 't4', label: 'Trisomy 4' }, { key: 't5', label: 'Trisomy 5' }, { key: 't6', label: 'Trisomy 6' },
    { key: 't7', label: 'Trisomy 7' }, { key: 't8', label: 'Trisomy 8' }, { key: 't9', label: 'Trisomy 9' },
    { key: 't10', label: 'Trisomy 10' }, { key: 't11', label: 'Trisomy 11' }, { key: 't12', label: 'Trisomy 12' },
    { key: 't14', label: 'Trisomy 14' }, { key: 't15', label: 'Trisomy 15' }, { key: 't16', label: 'Trisomy 16' },
    { key: 't17', label: 'Trisomy 17' }, { key: 't19', label: 'Trisomy 19' }, { key: 't20', label: 'Trisomy 20' },
    { key: 't22', label: 'Trisomy 22' }
  ];

  const microdeletionsList = formData?.results?.microdeletions || [];
  const filteredMicros = microdeletionsList.filter(item =>
    (item.name || '').toLowerCase().includes(microSearch.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar selectedPackage="GeneT Plus" userRole={user?.role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 w-full">
          {/* Top Title Bar */}
          <div className="flex items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <Link
                href="/packages/plus"
                className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-700 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl font-black text-slate-900 flex items-center gap-3">
                    <span>Mẫu GeneT Plus: {formData?.sampleCode}</span>
                    <span className="px-3 py-1 bg-purple-100 text-purple-900 text-xs font-bold rounded-full border border-purple-200">
                      Gói 23 NST + 122 Vi Mất Lặp Đoạn
                    </span>
                  </h1>
                  {(formData?.status === 'completed' || formData?.status === 'extracted' || formData?.originalPdfUrl || formData?.cfDNA) ? (
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
                <p className="text-xs text-slate-500 font-semibold mt-0.5">
                  Thai phụ: {formData?.fullName} - Ngày tạo: {formatDateVN(formData?.createdAt)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(formData?.status === 'completed' || formData?.status === 'extracted' || formData?.originalPdfUrl || formData?.cfDNA) ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/samples/${sampleId}/original-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 border border-indigo-200 shadow-xs"
                    title={`Xem/Tải file PDF gốc đối chiếu: ${formData?.originalPdfName || 'File PDF'}`}
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Xem File Gốc Đối Chiếu</span>
                  </a>
                </div>
              ) : (
                <label className="px-4 py-2 bg-purple-50 text-purple-800 hover:bg-purple-100 rounded-xl text-xs font-extrabold cursor-pointer border border-purple-300 transition-all flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  <span>{uploading ? 'Đang phân tích...' : 'Upload File PDF Kết Quả'}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border ${msg.type === 'success' ? 'bg-purple-50 border-purple-200 text-purple-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
              <CheckCircle2 className="w-5 h-5 text-purple-600 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* FULL-WIDTH STACKED FORM SECTIONS */}
          <div className="space-y-6 w-full">
            {/* Section 1: Patient Information Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                1. Thông Tin Thai Phụ & Mẫu Xét Nghiệm
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <label className="block text-slate-500 mb-1">Họ và tên Thai Phụ</label>
                  <input
                    type="text"
                    value={formData?.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Ngày sinh (YYYY-MM-DD)</label>
                  <input
                    type="text"
                    value={formData?.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Số CMND / CCCD</label>
                  <input
                    type="text"
                    value={formData?.idCard || ''}
                    onChange={(e) => handleInputChange('idCard', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Số Điện Thoại</label>
                  <input
                    type="text"
                    value={formData?.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-500 mb-1">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    value={formData?.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Tuổi Thai</label>
                  <input
                    type="text"
                    value={formData?.gestationalAge || ''}
                    onChange={(e) => handleInputChange('gestationalAge', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Loại Thai</label>
                  <input
                    type="text"
                    value={formData?.pregnancyType || 'Đơn thai'}
                    onChange={(e) => handleInputChange('pregnancyType', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Barcode / Mã Mẫu</label>
                  <input
                    type="text"
                    value={formData?.sampleCode || ''}
                    onChange={(e) => handleInputChange('sampleCode', e.target.value)}
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 font-mono font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Mã Đơn Vị Chi Nhánh</label>
                  <input
                    type="text"
                    value={formData?.agencyCode || ''}
                    onChange={(e) => handleInputChange('agencyCode', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Hàm lượng cfDNA (%)</label>
                  <input
                    type="text"
                    value={formData?.cfDNA || ''}
                    onChange={(e) => handleInputChange('cfDNA', e.target.value)}
                    className="w-full px-3 py-2 bg-purple-50 border border-purple-300 rounded-xl text-purple-900 font-mono font-black text-sm focus:outline-none"
                    placeholder="8.39"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Bác Sĩ Chỉ Định</label>
                  <input
                    type="text"
                    value={formData?.doctorName || ''}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                    placeholder="Nhập tên bác sĩ"
                  />
                </div>
                <div>
                  <label className="block text-slate-500 mb-1">Nơi gửi mẫu (Cơ sở / Phòng khám)</label>
                  <input
                    type="text"
                    value={formData?.facilityName || ''}
                    onChange={(e) => handleInputChange('facilityName', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:border-purple-500"
                    placeholder="VD: PK 47 Mỹ Đình"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: 3 Common Trisomies */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                2. Kết Quả Section I (3 Lệch Bội NST Thường)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { key: 't21', label: 'Trisomy 21 (Down)' },
                  { key: 't18', label: 'Trisomy 18 (Edwards)' },
                  { key: 't13', label: 'Trisomy 13 (Patau)' },
                ].map((item) => {
                  const rowData = formData?.results?.[item.key] || {};
                  return (
                    <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="font-extrabold text-slate-800">{item.label}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Z-score</label>
                          <input
                            type="text"
                            value={rowData.value || ''}
                            onChange={(e) => handleResultChange('main', item.key, 'value', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Đánh giá nguy cơ</label>
                          <input
                            type="text"
                            value={rowData.risk || 'Nguy cơ thấp'}
                            onChange={(e) => handleResultChange('main', item.key, 'risk', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-center font-bold ${(rowData.risk || '').includes('cao')
                              ? 'bg-rose-50 text-rose-900 border-rose-300'
                              : 'bg-purple-50 text-purple-900 border-purple-200'
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 3: 4 Sex Chromosomes */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                3. Kết Quả Section II (4 Lệch Bội NST Giới Tính)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { key: 'turner', label: 'HC Turner (45, XO)' },
                  { key: 'klinefelter', label: 'HC Klinefelter (47, XXY)' },
                  { key: 'jacobs', label: 'HC Jacobs (47, XYY)' },
                  { key: 'tripleX', label: 'HC Siêu nữ (47, XXX)' },
                ].map((item) => {
                  const rowData = formData?.results?.[item.key] || {};
                  return (
                    <div key={item.key} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                      <div className="font-extrabold text-slate-800">{item.label}</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Z-score</label>
                          <input
                            type="text"
                            value={rowData.value || ''}
                            onChange={(e) => handleResultChange('main', item.key, 'value', e.target.value)}
                            className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-center font-mono font-bold"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] text-slate-400 font-bold mb-0.5">Đánh giá nguy cơ</label>
                          <input
                            type="text"
                            value={rowData.risk || 'Nguy cơ thấp'}
                            onChange={(e) => handleResultChange('main', item.key, 'risk', e.target.value)}
                            className={`w-full px-2 py-1 border rounded text-center font-bold ${(rowData.risk || '').includes('cao')
                              ? 'bg-rose-50 text-rose-900 border-rose-300'
                              : 'bg-purple-50 text-purple-900 border-purple-200'
                              }`}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 4: 19 Other Trisomies */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                4. Kết Quả Section III (19 Lệch Bội NST Khác - Trang 2 Phôi)
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {otherKeys.map((item) => {
                  const rowData = formData?.results?.otherTrisomies?.[item.key] || {};
                  return (
                    <div key={item.key} className="p-2 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                      <div className="font-bold text-slate-800 truncate text-[11px]">{item.label}</div>
                      <div className="grid grid-cols-2 gap-1">
                        <input
                          type="text"
                          value={rowData.value || ''}
                          onChange={(e) => handleResultChange('others', item.key, 'value', e.target.value)}
                          className="w-full px-1 py-0.5 bg-white border border-slate-200 rounded text-center font-mono font-bold text-[11px]"
                          placeholder="Z-score"
                        />
                        <input
                          type="text"
                          value={rowData.risk || 'Nguy cơ thấp'}
                          onChange={(e) => handleResultChange('others', item.key, 'risk', e.target.value)}
                          className="w-full px-1 py-0.5 bg-purple-50 text-purple-900 border border-purple-200 rounded text-center font-bold text-[10px]"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Section 5: NEW 102 Microdeletions/Duplications Table */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Dna className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    5. Danh Sách 102 Hội Chứng Vi Mất / Lặp Đoạn NST (&gt;10Mb & &gt;5Mb)
                  </h3>
                  <span className="px-2.5 py-0.5 bg-purple-100 text-purple-900 font-mono font-extrabold text-xs rounded-full border border-purple-200">
                    {microdeletionsList.length} hội chứng
                  </span>
                </div>

                <div className="relative w-full md:w-72">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên hội chứng vi mất/lặp..."
                    value={microSearch}
                    onChange={(e) => setMicroSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {microdeletionsList.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500 font-semibold bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  Upload file PDF kết quả <span className="font-mono text-purple-700 font-bold">Plus 122.pdf</span> để tự động trích xuất danh sách 102 hội chứng vi mất/lặp đoạn
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 sticky top-0 border-b border-slate-200 font-extrabold text-slate-600 uppercase">
                      <tr>
                        <th className="py-2.5 px-3">STT</th>
                        <th className="py-2.5 px-3">Tên Hội Chứng Vi Mất / Lặp Đoạn</th>
                        <th className="py-2.5 px-3 text-center">Ngưỡng Tham Chiếu</th>
                        <th className="py-2.5 px-3 text-center">Giá Trị Phân Tích (%)</th>
                        <th className="py-2.5 px-3 text-center">Đánh Giá Nguy Cơ</th>
                        <th className="py-2.5 px-3 text-center">Kết Quả</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredMicros.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 font-semibold">
                          <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.name}</td>
                          <td className="py-2 px-3 text-center font-mono text-slate-500">{item.ref}</td>
                          <td className="py-2 px-3 text-center font-mono font-bold text-purple-900">{item.value}</td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${(item.risk || '').includes('cao')
                              ? 'bg-rose-100 text-rose-900'
                              : 'bg-purple-100 text-purple-900'
                              }`}>
                              {item.risk}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${((item.result || '').toLowerCase().includes('phát hiện') && !(item.result || '').toLowerCase().includes('không phát hiện')) || (item.risk || '').toLowerCase().includes('cao')
                              ? 'bg-rose-100 text-rose-900 border-rose-200'
                              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              }`}>
                              {item.result}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 6: Medical Conclusion & Signatures Form */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3">
                6. Kết Luận Y Khoa & Người Ký Tên
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung kết luận:</label>
                  <textarea
                    rows={4}
                    value={formData?.conclusion || ''}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:border-purple-500 leading-relaxed"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kiểm soát kết quả</label>
                    <input
                      type="text"
                      value={formData?.checkerName || ''}
                      onChange={(e) => handleInputChange('checkerName', e.target.value)}
                      placeholder="TS. BS. Nguyễn Văn A"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giám đốc</label>
                    <input
                      type="text"
                      value={formData?.directorName || ''}
                      onChange={(e) => handleInputChange('directorName', e.target.value)}
                      placeholder="TS. Đặng..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 7: Supplementary Result (Ket qua phu - GBS) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">
                    7. Kết Quả Phụ Đính Kèm
                  </h3>
                </div>
                <span className="px-3 py-1 bg-indigo-50 text-indigo-800 font-bold text-xs rounded-full border border-indigo-200">
                  Đính kèm trang Kết quả phụ.pdf
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                <div>
                  <label className="block text-slate-600 font-bold text-xs mb-2">
                    Kết Quả Xét Nghiệm GBS :
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

              {/* Bottom Action Buttons below Conclusion & Signatures */}
              <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Đang lưu...' : 'Lưu Mẫu Plus'}</span>
                </button>

                <button
                  onClick={handleDownloadBothPdfs}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-sm font-extrabold shadow-md transition-all flex items-center gap-2"
                  title="Tải về cả 2 file PDF (NIPT & Kết quả phụ)"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải 2 File Kết Quả (PDF)</span>
                </button>
              </div>
            </div>

            {/* FULL-WIDTH BOTTOM PDF PREVIEW IFRAME SECTION */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  <h3 className="font-extrabold text-base text-slate-900">
                    Xem Trước Phôi Kết Quả GeneTrust (Full-width View)
                  </h3>
                </div>
                <button
                  onClick={() => setPreviewKey(Date.now())}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border border-slate-300"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Làm mới Xem Trước</span>
                </button>
              </div>

              <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-lg h-[950px] w-full">
                <iframe
                  src={`/api/samples/${sampleId}/generate-genetrust?t=${previewKey}`}
                  className="w-full h-full border-0"
                  title="PDF Preview Full Width"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
