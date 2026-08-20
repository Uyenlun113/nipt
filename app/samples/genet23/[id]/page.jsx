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

export default function GeneT23SampleDetailPage() {
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

        const defaultGeneT23Results = {
          t21: { label: 'Trisomy 21 (Down)', value: '', risk: '', ref: '-3 < Z < 3' },
          t18: { label: 'Trisomy 18 (Edwards)', value: '', risk: '', ref: '-3 < Z < 3' },
          t13: { label: 'Trisomy 13 (Patau)', value: '', risk: '', ref: '-3 < Z < 3' },
          turner: { label: 'HC Turner (45, XO)', value: '', risk: '', ref: '-3 < Z < 3' },
          klinefelter: { label: 'HC Klinefelter (47, XXY)', value: '', risk: '', ref: '-3 < Z < 3' },
          jacobs: { label: 'HC Jacobs (47, XYY)', value: '', risk: '', ref: '-3 < Z < 3' },
          tripleX: { label: 'HC Trisomy X (47, XXX)', value: '', risk: '', ref: '-3 < Z < 3' }
        };

        const otherTrisomies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 19, 20, 22];
        otherTrisomies.forEach(num => {
          defaultGeneT23Results[`trisomy_${num}`] = {
            label: `Trisomy ${num}`,
            value: '',
            risk: '',
            ref: '-3 < Z < 3'
          };
        });

        const hasCustomResults = data.results && Object.keys(data.results).length > 0;
        let activeResults = hasCustomResults ? { ...data.results } : defaultGeneT23Results;

        setFormData({
          ...data,
          packageType: 'GeneT 23',
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

      setMsg({ type: 'success', text: 'Đã lưu thay đổi Mẫu GeneT 23 & cập nhật bản xem trước PDF!' });
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
          <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Đang tải trang chi tiết Mẫu GeneT 23...
        </div>
      </div>
    );
  }

  const pdfPreviewUrl = `/api/samples/${sampleId}/generate-genetrust?t=${previewKey}`;

  // Grouping results into 3 Sections for GeneT 23:
  // Section 1: T21, T18, T13
  // Section 2: Turner, Klinefelter, Jacobs, TripleX
  // Section 3: All 19 other Trisomies (trisomy_1..22)
  const resultsObj = formData.results || {};
  const section1Keys = ['t21', 't18', 't13'];
  const section2Keys = ['turner', 'klinefelter', 'jacobs', 'tripleX'];
  const section3Keys = Object.keys(resultsObj).filter(k => !section1Keys.includes(k) && !section2Keys.includes(k));

  const renderResultRows = (keys) => {
    return keys.map((key) => {
      const item = resultsObj[key];
      if (!item) return null;
      return (
        <tr key={key} className="hover:bg-slate-50">
          <td className="py-3 px-4 font-bold text-slate-900">{item.label}</td>
          <td className="py-3 px-4 text-slate-600">{item.ref}</td>
          <td className="py-3 px-4">
            <input
              type="text"
              value={item.value || ''}
              onChange={(e) => handleResultChange(key, 'value', e.target.value)}
              className="w-32 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold"
            />
          </td>
          <td className="py-3 px-4">
            <select
              value={item.risk || 'Nguy cơ thấp'}
              onChange={(e) => handleResultChange(key, 'risk', e.target.value)}
              className="px-3 py-1.5 rounded-xl text-xs font-bold border bg-emerald-50 text-emerald-800 border-emerald-300"
            >
              <option value="Nguy cơ thấp">Nguy cơ thấp</option>
              <option value="Nguy cơ cao">Nguy cơ cao</option>
            </select>
          </td>
        </tr>
      );
    });
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} selectedPackage="GeneT 23" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 w-full">
          {/* Top Title & Actions Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div className="flex items-center gap-4">
              <Link
                href="/packages/genet23"
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Chi Tiết Mẫu GeneT 23 (Focus.pdf - Phôi In 2 Trang)
                  </h1>
                  <span className="px-3 py-1 bg-indigo-100 text-indigo-900 font-mono font-extrabold text-sm rounded-lg border border-indigo-200">
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
                  Trang xử lý riêng biệt dành riêng cho Gói Xét Nghiệm NIPT GeneT 23 (Chèn trọn vẹn CẢ 2 TRANG phôi)
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
                <span>{saving ? 'Đang lưu...' : 'Lưu Mẫu GeneT 23'}</span>
              </button>

              <button
                onClick={handleDownloadPdf}
                className="px-6 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-extrabold shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                <span>Tải về Mẫu GeneT 23</span>
              </button>
            </div>
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border w-full ${msg.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* Full Width Layout */}
          <div className="w-full space-y-8">
            {/* Section 1: Thông tin thai phụ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>I. Thông Tin Hành Chính Thai Phụ</span>
                <span className="text-indigo-700 font-bold font-mono">Gói: GeneT 23</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm w-full">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên thai phụ</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày / Năm sinh (Định dạng DD/MM/YYYY)</label>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={formData.dob || ''}
                    onChange={(e) => handleInputChange('dob', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">CMT / CCCD</label>
                  <input
                    type="text"
                    value={formData.idCard || ''}
                    onChange={(e) => handleInputChange('idCard', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tuổi thai</label>
                  <input
                    type="text"
                    value={formData.gestationalAge || ''}
                    onChange={(e) => handleInputChange('gestationalAge', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số lượng thai</label>
                  <input
                    type="text"
                    value={formData.pregnancyType || 'Đơn thai'}
                    onChange={(e) => handleInputChange('pregnancyType', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bác sĩ chỉ định</label>
                  <input
                    type="text"
                    value={formData.doctorName || ''}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ (Tránh chờm nhãn)</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mã Barcode mẫu</label>
                  <input
                    type="text"
                    value={formData.sampleCode || ''}
                    onChange={(e) => handleInputChange('sampleCode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: cfDNA % */}
            <div className="bg-teal-50/80 p-5 rounded-2xl border border-teal-200 shadow-sm flex items-center justify-between w-full">
              <div>
                <h3 className="text-sm font-extrabold text-teal-950 uppercase tracking-wider">Hàm lượng cfDNA (%) - Mẫu GeneT 23</h3>
                <p className="text-xs text-teal-800 font-medium">Tự động trích xuất từ file Focus.pdf ({formData.originalPdfName || 'File kết quả'})</p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-700">cfDNA:</span>
                <input
                  type="text"
                  value={formData.cfDNA || '5.58'}
                  onChange={(e) => handleInputChange('cfDNA', e.target.value)}
                  className="w-36 px-4 py-2 text-xl font-extrabold text-teal-900 bg-white border border-teal-300 rounded-xl text-center shadow-inner"
                />
                <span className="text-sm font-bold text-teal-800">%</span>
              </div>
            </div>

            {/* Section 3: Bảng kết quả 3 phần (Trang 1: Phần I & II | Trang 2: Phần III) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  KẾT QUẢ PHÂN TÍCH XÉT NGHIỆM GENET 23 (23 CẶP NHIỄM SẮC THỂ)
                </h3>
              </div>

              {/* Phần I: Lệch Bội Phổ Biến (In trên Trang 1 phôi) */}
              <div className="space-y-3">
                <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 font-extrabold text-xs uppercase text-teal-900">
                  I. Lệch Bội Phổ Biến (Nhiễm Sắc Thể Thường 21, 18, 13) - In Trên Trang 1 Phôi
                </div>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-extrabold border-b border-slate-300">
                      <th className="py-3 px-4">Hội chứng / NST</th>
                      <th className="py-3 px-4">Khoảng tham chiếu</th>
                      <th className="py-3 px-4">Giá trị phân tích (Z-score)</th>
                      <th className="py-3 px-4">Kết luận nguy cơ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {renderResultRows(section1Keys)}
                  </tbody>
                </table>
              </div>

              {/* Phần II: Lệch Bội NST Giới Tính (In trên Trang 1 phôi) */}
              <div className="space-y-3 pt-2">
                <div className="bg-indigo-50 px-4 py-2 rounded-xl border border-indigo-200 font-extrabold text-xs uppercase text-indigo-950">
                  II. Lệch Bội Nhiễm Sắc Thể Giới Tính (Turner, Klinefelter, Jacobs, Triple X) - In Trên Trang 1 Phôi
                </div>
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-extrabold border-b border-slate-300">
                      <th className="py-3 px-4">Hội chứng / NST</th>
                      <th className="py-3 px-4">Khoảng tham chiếu</th>
                      <th className="py-3 px-4">Giá trị phân tích (Z-score)</th>
                      <th className="py-3 px-4">Kết luận nguy cơ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {renderResultRows(section2Keys)}
                  </tbody>
                </table>
              </div>

              {/* Phần III: Lệch Bội NST Khác (In trên Trang 2 phôi) */}
              {section3Keys.length > 0 && (
                <div className="space-y-3 pt-2">
                  <div className="bg-purple-50 px-4 py-2 rounded-xl border border-purple-200 font-extrabold text-xs uppercase text-purple-950">
                    III. Lệch Bội Nhiễm Sắc Thể Khác (Trisomy 1..22 trừ 13, 18, 21) - In Trên Trang 2 Phôi
                  </div>
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-extrabold border-b border-slate-300">
                        <th className="py-3 px-4">Hội chứng / NST</th>
                        <th className="py-3 px-4">Khoảng tham chiếu</th>
                        <th className="py-3 px-4">Giá trị phân tích (Z-score)</th>
                        <th className="py-3 px-4">Kết luận nguy cơ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {renderResultRows(section3Keys)}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Section 4: KẾT LUẬN Y KHOA & NGƯỜI KÝ TÊN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-teal-900 border-b border-slate-200 pb-2">
                Nội dung Phiên giải kết quả (Medical Conclusion) & Người Ký Tên
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung kết luận:</label>
                  <textarea
                    rows={3}
                    value={formData.conclusion || ''}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold"
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
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giám đốc</label>
                    <input
                      type="text"
                      value={formData.directorName || ''}
                      onChange={(e) => handleInputChange('directorName', e.target.value)}
                      placeholder="TS. Đặng..."
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                    />
                  </div>
                </div>
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
            </div>

            {/* Section 5: LIVE PDF PREVIEW FRAME FOR GENET 23 (CHÈN CẢ 2 TRANG!) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-5 h-5 text-teal-600" />
                  <span>Bản Xem Trước Phôi In GeneTrust 23 (Chèn Trọn Vẹn CẢ 2 TRANG Phôi!)</span>
                </h3>
                <button onClick={() => setPreviewKey(Date.now())} className="px-3.5 py-2 bg-slate-100 rounded-xl text-xs font-bold flex items-center gap-1.5">
                  <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
              </div>

              <div className="w-full h-[950px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-300">
                <iframe key={previewKey} src={pdfPreviewUrl} className="w-full h-full border-0" />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
