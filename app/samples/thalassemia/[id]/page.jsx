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
  FileText,
  Dna
} from 'lucide-react';

import { formatDateVN, formatDateForInput } from '@/lib/date-utils';

const DEFAULT_THALASSEMIA_RESULTS = {
  disease_1: {
    label: 'Tan máu bẩm sinh thể Alpha (Alpha-thalassemia)',
    gene: 'HBA1, HBA2',
    nst: '16p13.3',
    value: 'Chưa phát hiện đột biến trong vùng được khảo sát'
  },
  disease_2: {
    label: 'Tan máu bẩm sinh thể Beta (Beta-thalassemia)',
    gene: 'HBB',
    nst: '11p15.4',
    value: 'Chưa phát hiện đột biến trong vùng được khảo sát'
  }
};

export default function ThalassemiaSampleDetailPage() {
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

        const hasCustomResults = data.results && Object.keys(data.results).length > 0;
        let activeResults = hasCustomResults ? { ...DEFAULT_THALASSEMIA_RESULTS, ...data.results } : DEFAULT_THALASSEMIA_RESULTS;

        setFormData({
          ...data,
          packageType: 'Thalassemia',
          directorName: data.directorName !== undefined ? data.directorName : 'GS.TS.BS Trần Vân Khánh',
          dob: formatDateVN(data.dob),
          samplingDate: formatDateVN(data.samplingDate),
          receivedDate: formatDateVN(data.receivedDate),
          reportDate: formatDateVN(data.reportDate),
          conclusion: data.conclusion || 'Chưa phát hiện biến thể gây bệnh/ có thể gây bệnh trên các vùng gen được khảo sát.',
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
      if (res.ok) {
        setMsg({ type: 'success', text: 'Đã lưu thông tin chi tiết kết quả Thalassemia thành công!' });
        setPreviewKey(Date.now());
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Lỗi khi lưu dữ liệu');
      }
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

    const data = new FormData();
    data.append('pdfFile', file);

    try {
      const res = await fetch(`/api/samples/${sampleId}/upload-pdf`, {
        method: 'POST',
        body: data
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Lỗi khi upload PDF');

      setMsg({ type: 'success', text: `Upload & Đọc file PDF kết quả ${file.name} thành công!` });
      fetchSampleDetail();
      setPreviewKey(Date.now());
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setUploading(false);
    }
  };

  const handleDownloadPdf = () => {
    window.open(`/api/samples/${sampleId}/generate-genetrust`, '_blank');
  };

  const handleConfirmAndDeliver = async () => {
    setSaving(true);
    setMsg({ type: '', text: '' });
    try {
      const todayStr = formatDateVN(new Date().toISOString().split('T')[0]);
      const updatedData = {
        ...formData,
        status: 'completed',
        reportDate: formData.reportDate || todayStr
      };

      const res = await fetch(`/api/samples/${sampleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedData)
      });

      if (res.ok) {
        setFormData(updatedData);
        setMsg({ type: 'success', text: 'Đã xác nhận và trả kết quả mẫu Thalassemia thành công!' });
        setPreviewKey(Date.now());
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Lỗi khi xác nhận trả kết quả');
      }
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center font-sans">
        <div className="text-center font-bold text-slate-600 text-sm">
          <RefreshCw className="w-8 h-8 animate-spin text-rose-600 mx-auto mb-3" />
          <p>Đang tải trang chi tiết Mẫu Sàng lọc Thalassemia...</p>
        </div>
      </div>
    );
  }

  const isCompleted = formData.status === 'completed';

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} selectedPackage="Thalassemia" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 w-full">
          {/* Top Title & Actions Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div className="flex items-center gap-4">
              <Link
                href="/packages/thalassemia"
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Chi Tiết Mẫu Sàng Lọc Thalassemia (Gen Lặn)
                  </h1>
                  <span className="px-3 py-1 bg-rose-100 text-rose-900 font-mono font-extrabold text-sm rounded-lg border border-rose-200">
                    {formData.sampleCode}
                  </span>
                  {isCompleted ? (
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
                  Trang xử lý riêng biệt dành riêng cho Gói Xét Nghiệm Sàng lọc Thalassemia (Chèn phôi Thalassemia.pdf)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {formData.originalPdfUrl && (
                <a
                  href={`/api/samples/${sampleId}/original-pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-indigo-200 shadow-xs"
                  title="Xem/Tải file PDF gốc đối chiếu"
                >
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span>Xem File Gốc</span>
                </a>
              )}

              <label className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-extrabold cursor-pointer transition-all flex items-center gap-2 shadow-md shadow-teal-600/20">
                <Upload className="w-4 h-4" />
                <span>{uploading ? 'Đang đọc PDF...' : (formData.originalPdfUrl ? 'Đọc lại / Tải lại PDF' : 'Upload File PDF Kết Quả')}</span>
                <input type="file" accept=".pdf" className="hidden" onChange={handlePdfUpload} disabled={uploading} />
              </label>

              <button
                onClick={handleDownloadPdf}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 shadow-md"
              >
                <Download className="w-4 h-4" />
                <span>Xuất PDF Kết Quả</span>
              </button>

              <button
                onClick={handleConfirmAndDeliver}
                disabled={saving}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{isCompleted ? 'Cập Nhật Trả Kết Quả' : 'Xác Nhận & Trả Kết Quả'}</span>
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-extrabold transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? 'Đang lưu...' : 'Lưu Thay Đổi'}</span>
              </button>
            </div>
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border w-full ${
              msg.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* Full Width 1-Column Layout */}
          <div className="w-full space-y-8">
            {/* Section 1: Thông tin hành chính thai phụ (Matching exactly the standard layout in screenshot) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>I. THÔNG TIN HÀNH CHÍNH THAI PHỤ</span>
                <span className="text-rose-700 font-bold font-mono">GÓI : SÀNG LỌC THALASSEMIA</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm w-full">
                {/* Row 1 */}
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số điện thoại</label>
                  <input
                    type="text"
                    value={formData.phone || ''}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                {/* Row 2 */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Tuổi thai</label>
                  <input
                    type="text"
                    value={formData.gestationalAge || ''}
                    onChange={(e) => handleInputChange('gestationalAge', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Số lượng thai</label>
                  <input
                    type="text"
                    value={formData.pregnancyType || 'Đơn thai'}
                    onChange={(e) => handleInputChange('pregnancyType', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ (Tránh chòm nhãn)</label>
                  <input
                    type="text"
                    value={formData.address || ''}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bác sĩ chỉ định</label>
                  <input
                    type="text"
                    value={formData.doctorName || ''}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                {/* Row 3 */}
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nơi gửi mẫu (Cơ sở / Phòng khám)</label>
                  <input
                    type="text"
                    value={formData.agencyCode || ''}
                    onChange={(e) => handleInputChange('agencyCode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mã Barcode mẫu</label>
                  <input
                    type="text"
                    value={formData.sampleCode || ''}
                    onChange={(e) => handleInputChange('sampleCode', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày nhận mẫu</label>
                  <input
                    type="text"
                    value={formData.receivedDate || ''}
                    onChange={(e) => handleInputChange('receivedDate', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Giới tính</label>
                  <select
                    value={formData.gender || 'Nữ'}
                    onChange={(e) => handleInputChange('gender', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-medium"
                  >
                    <option value="Nữ">Nữ</option>
                    <option value="Nam">Nam</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Kết quả phân tích gen */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                II. KẾT QUẢ PHÂN TÍCH GEN THALASSEMIA
              </h2>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Bệnh</th>
                      <th className="py-3 px-4 w-32">Tên gen</th>
                      <th className="py-3 px-4 w-28">Vị trí NST</th>
                      <th className="py-3 px-4">Kết quả phân tích</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-sm">
                    {/* Row 1: Alpha */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">1</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Tan máu bẩm sinh thể Alpha (Alpha-thalassemia)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 italic">HBA1, HBA2</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">16p13.3</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={formData.results?.disease_1?.value || ''}
                            onChange={(e) => handleResultChange('disease_1', 'value', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleResultChange('disease_1', 'value', 'Chưa phát hiện đột biến trong vùng được khảo sát')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-all"
                          >
                            Set: Chưa phát hiện đột biến
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Row 2: Beta */}
                    <tr className="hover:bg-slate-50/80">
                      <td className="py-3.5 px-4 text-center font-bold text-slate-500">2</td>
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        Tan máu bẩm sinh thể Beta (Beta-thalassemia)
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-slate-700 italic">HBB</td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">11p15.4</td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={formData.results?.disease_2?.value || ''}
                            onChange={(e) => handleResultChange('disease_2', 'value', e.target.value)}
                            className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-900 focus:bg-white"
                          />
                          <button
                            type="button"
                            onClick={() => handleResultChange('disease_2', 'value', 'Chưa phát hiện đột biến trong vùng được khảo sát')}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-300 transition-all"
                          >
                            Set: Chưa phát hiện đột biến
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: Kết luận & Chữ ký */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2">
                III. KẾT LUẬN & CẤU HÌNH KÝ DUYỆT
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nội dung kết luận:</label>
                  <textarea
                    rows={3}
                    value={formData.conclusion || ''}
                    onChange={(e) => handleInputChange('conclusion', e.target.value)}
                    className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm font-medium pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ngày trả kết quả</label>
                    <input
                      type="date"
                      value={formatDateForInput(formData.reportDate || '')}
                      onChange={(e) => handleInputChange('reportDate', formatDateVN(e.target.value))}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white cursor-pointer"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kiểm soát kết quả</label>
                    <input
                      type="text"
                      placeholder="TS. BS. Nguyễn Văn A"
                      value={formData.checkerName || ''}
                      onChange={(e) => handleInputChange('checkerName', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Giám đốc ký</label>
                    <input
                      type="text"
                      placeholder="GS.TS.BS Trần Vân Khánh"
                      value={formData.directorName ?? ''}
                      onChange={(e) => handleInputChange('directorName', e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white"
                    />
                  </div>

                  <div className="flex items-center pt-5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={!!formData.hasMstStamp}
                        onChange={(e) => handleInputChange('hasMstStamp', e.target.checked)}
                        className="w-4 h-4 text-rose-600 rounded"
                      />
                      <span>Thêm dấu vuông (MST GeneTrust)</span>
                    </label>
                  </div>
                </div>

                {/* Bottom Buttons below Conclusion */}
                <div className="pt-5 border-t border-slate-200 flex items-center justify-end gap-4">
                  <button
                    onClick={handleDownloadPdf}
                    className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-md"
                  >
                    <Download className="w-4 h-4" />
                    <span>Xuất PDF Kết Quả</span>
                  </button>

                  <button
                    onClick={handleConfirmAndDeliver}
                    disabled={saving}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isCompleted ? 'Cập Nhật Trả Kết Quả' : 'Xác Nhận & Trả Kết Quả'}</span>
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold text-sm transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu Mẫu Thalassemia'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: LIVE PDF PREVIEW FRAME AT THE BOTTOM */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-5 h-5 text-rose-600" />
                  <span>Bản Xem Trước Phôi In Thalassemia</span>
                </h3>
                <button
                  onClick={() => setPreviewKey(Date.now())}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-all"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Làm mới</span>
                </button>
              </div>

              <div className="w-full h-[950px] bg-slate-100 rounded-2xl overflow-hidden border border-slate-300">
                <iframe
                  key={previewKey}
                  src={`/api/samples/${sampleId}/generate-genetrust?t=${previewKey}`}
                  className="w-full h-full border-0"
                  title="Thalassemia PDF Preview"
                />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
