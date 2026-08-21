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

const DEFAULT_20GA_RESULTS = {
  disease_1: { label: 'Alpha-Thalassemia', gene: 'HBA1 & HBA2', nst: '16p13.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_2: { label: 'Beta-Thalassemia', gene: 'HBB', nst: '11p15.4', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_3: { label: 'Thiếu men G6PD', gene: 'G6PD', nst: 'Xq28', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_4: { label: 'Phenyketon niệu', gene: 'PAH', nst: '12q23.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_5: { label: 'Rối loạn chuyển hoá galactose', gene: 'GALT', nst: '9p13.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_6: { label: 'Bệnh vàng da ứ mật do thiếu hụt citrin', gene: 'SLC25A13', nst: '1q21.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_7: { label: 'Rối loạn phát triển giới tính nam do thiếu 5α-reductase type 2', gene: 'SRD5A2', nst: '2q23.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_8: { label: 'Bệnh Pompe (rối loạn dự trữ Glycogen loại 2)', gene: 'GAA', nst: '17q25.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_9: { label: 'Bệnh Wilson (rối loạn chuyển hoá đồng)', gene: 'ATP7B', nst: '13q14.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_10: { label: 'Bệnh xơ nang', gene: 'CFTR', nst: '7q31.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_11: { label: 'Bệnh Fabry (Rối loạn tích trữ lipid thể tiêu hợp)', gene: 'GLA', nst: 'Xq22.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_12: { label: 'Thiếu hụt đa enzyme Acyl-CoA dehydrogenase', gene: 'ETFDH', nst: '4q32.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_13: { label: 'Bệnh thận đa nang', gene: 'PKHD1', nst: '6p12.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_14: { label: 'Tăng sản thượng thận bẩm sinh (Do thiếu men 21-hydroxylase)', gene: 'CYP21A2', nst: '6p21.33', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_15: { label: 'Cường insulin bẩm sinh', gene: 'ABCC8', nst: '11p15.1', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_16: { label: 'Teo cơ tủy sống (SMA)', gene: 'SMN1', nst: '5q13.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_17: { label: 'Bệnh Gaucher (Thiếu hụt men glucocerebrosidase)', gene: 'GBA', nst: '1q22', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_18: { label: 'Bệnh máu khó đông Hemophilia A', gene: 'F8', nst: 'Xq28', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_19: { label: 'Thiếu hụt hormone TSH đơn độc (Suy giáp bẩm sinh trung ương)', gene: 'TSHB', nst: '1p13.2', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
  disease_20: { label: 'Tăng homocysteine niệu (Rối loạn chuyển hóa axi amin chứa lưu huỳnh)', gene: 'CBS', nst: '21q22.3', value: 'Chưa phát hiện đột biến trong vùng được khảo sát' },
};

export default function Package20GASampleDetailPage() {
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
  const [previewType, setPreviewType] = useState('nipt'); // 'nipt' or 'phu'

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
        let activeResults = hasCustomResults ? { ...DEFAULT_20GA_RESULTS, ...data.results } : DEFAULT_20GA_RESULTS;

        setFormData({
          ...data,
          packageType: '20GA',
          dob: formatDateVN(data.dob),
          receivedDate: formatDateVN(data.receivedDate),
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi cập nhật');

      setMsg({ type: 'success', text: 'Đã lưu thay đổi Mẫu 20GA & cập nhật bản xem trước PDF!' });
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

      setMsg({ type: 'success', text: `Upload & Đọc file PDF ${file.name} thành công!` });
      fetchSampleDetail();
      setPreviewKey(Date.now());
    } catch (err) {
      setMsg({ type: 'error', text: 'Lỗi upload PDF: ' + err.message });
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

  const handleDownloadNiptPdf = () => {
    window.open(`/api/samples/${sampleId}/generate-genetrust`, '_blank');
  };

  const handleDownloadSupplementaryPdf = () => {
    window.open(`/api/samples/${sampleId}/generate-supplementary`, '_blank');
  };

  if (loading || !formData) {
    return (
      <div className="flex h-screen bg-slate-50 items-center justify-center">
        <div className="text-center font-bold text-slate-600 text-sm">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          Đang tải trang chi tiết Mẫu 20GA...
        </div>
      </div>
    );
  }

  const pdfPreviewUrl = previewType === 'phu'
    ? `/api/samples/${sampleId}/generate-supplementary?t=${previewKey}`
    : `/api/samples/${sampleId}/generate-genetrust?t=${previewKey}`;

  const resultsObj = formData.results || {};

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} selectedPackage="20GA" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 w-full">
          {/* Top Title & Actions Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div className="flex items-center gap-4">
              <Link
                href="/packages/20ga"
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all shadow-sm"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Chi Tiết Mẫu 20GA (20 Bệnh Di Truyền Gen Lặn)
                  </h1>
                  <span className="px-3 py-1 bg-emerald-100 text-emerald-900 font-mono font-extrabold text-sm rounded-lg border border-emerald-200">
                    {formData.sampleCode}
                  </span>
                  {(formData.status === 'completed' || formData.status === 'extracted' || formData.originalPdfUrl) ? (
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
                  Trang quản lý chi tiết Gói xét nghiệm 20 Bệnh Di Truyền Gen Lặn (Phôi 2 trang)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {(formData.status === 'completed' || formData.status === 'extracted' || formData.originalPdfUrl) ? (
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/samples/${sampleId}/original-pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-sm font-bold transition-all flex items-center gap-2 border border-indigo-200 shadow-xs"
                    title={`Xem/Tải file PDF gốc đối chiếu: ${formData.originalPdfName || 'File PDF'}`}
                  >
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Xem File Gốc</span>
                  </a>
                </div>
              ) : (
                <label className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-sm font-bold cursor-pointer transition-all flex items-center gap-2 border border-slate-300">
                  <Upload className="w-4 h-4 text-slate-700" />
                  <span>{uploading ? 'Đang đọc...' : 'Upload PDF Kết Quả'}</span>
                  <input type="file" accept=".pdf" className="hidden" onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border w-full ${msg.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{msg.text}</span>
            </div>
          )}

          {/* Full Width Layout */}
          <div className="w-full space-y-8">
            {/* Section 1: Thông tin thai phụ */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h2 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 border-b border-slate-200 pb-2 flex items-center justify-between">
                <span>I. Thông Tin Hành Chính Khách Hàng</span>
                <span className="text-emerald-700 font-bold font-mono">Gói: 20GA</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-sm w-full">
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Họ và tên khách hàng</label>
                  <input
                    type="text"
                    value={formData.fullName || ''}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Ngày / Năm sinh</label>
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
                  <label className="block text-xs font-bold text-slate-600 mb-1">Bác sĩ chỉ định / Tư vấn</label>
                  <input
                    type="text"
                    value={formData.doctorName || ''}
                    onChange={(e) => handleInputChange('doctorName', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Mã Đại lý</label>
                  <input
                    type="text"
                    value={formData.agencyCode || ''}
                    onChange={(e) => handleInputChange('agencyCode', e.target.value)}
                    placeholder="VD: PK-HANOI-01"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Nơi gửi mẫu (Cơ sở / Phòng khám)</label>
                  <input
                    type="text"
                    value={formData.facilityName || ''}
                    onChange={(e) => handleInputChange('facilityName', e.target.value)}
                    placeholder="VD: 47 Mỹ Đình, Nam Từ Liêm, Hà Nội"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Địa chỉ thai phụ</label>
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

            {/* Section 2: Bảng kết quả 20 bệnh gen lặn */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full">
              <div className="border-b border-slate-200 pb-2">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900">
                  KẾT QUẢ PHÂN TÍCH SÀNG LỌC 20 BỆNH DI TRUYỀN GEN LẶN
                </h3>
              </div>

              <div className="overflow-x-auto w-full">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 text-xs uppercase font-extrabold border-b border-slate-300">
                      <th className="py-3 px-4 w-12 text-center">STT</th>
                      <th className="py-3 px-4">Tên Bệnh Di Truyền</th>
                      <th className="py-3 px-4">Gen xét nghiệm</th>
                      <th className="py-3 px-4">Vị trí NST</th>
                      <th className="py-3 px-4">Kết quả phân tích</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {Array.from({ length: 20 }).map((_, idx) => {
                      const key = `disease_${idx + 1}`;
                      const defaultItem = DEFAULT_20GA_RESULTS[key] || {};
                      const rawItem = resultsObj[key];
                      const item = (typeof rawItem === 'object' && rawItem !== null)
                        ? { ...defaultItem, ...rawItem }
                        : (typeof rawItem === 'string' ? { ...defaultItem, value: rawItem } : defaultItem);

                      return (
                        <tr key={key} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-slate-500 text-center">{idx + 1}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{item.label}</td>
                          <td className="py-3 px-4 text-emerald-800 font-mono font-bold">{item.gene}</td>
                          <td className="py-3 px-4 text-slate-600 font-mono">{item.nst}</td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={item.value || 'Chưa phát hiện đột biến trong vùng được khảo sát'}
                              onChange={(e) => handleResultChange(key, 'value', e.target.value)}
                              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3: KẾT LUẬN & NGƯỜI KÝ TÊN */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 w-full">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-emerald-900 border-b border-slate-200 pb-2">
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

                {/* Bottom Action Buttons below Section 3 */}
                <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-end gap-3">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-sm font-bold shadow-sm transition-all flex items-center gap-2"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'Đang lưu...' : 'Lưu Mẫu 20GA'}</span>
                  </button>

                  <button
                    onClick={handleDownloadBothPdfs}
                    className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-indigo-600 hover:from-emerald-700 hover:to-indigo-700 text-white rounded-xl text-sm font-extrabold shadow-md transition-all flex items-center gap-2"
                    title="Tải về cả 2 file PDF (NIPT & Kết quả phụ)"
                  >
                    <Download className="w-4 h-4" />
                    <span>Tải 2 File Kết Quả (PDF)</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Section 4: LIVE PDF PREVIEW FRAME */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md space-y-4 w-full">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-4">
                  <h3 className="font-extrabold text-base text-slate-900 uppercase tracking-wider flex items-center gap-2">
                    <Eye className="w-5 h-5 text-emerald-600" />
                    <span>Bản Xem Trước Phôi In 20GA</span>
                  </h3>
                  <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => { setPreviewType('nipt'); setPreviewKey(Date.now()); }}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${previewType === 'nipt' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Phôi 20GA
                    </button>
                    <button
                      onClick={() => { setPreviewType('phu'); setPreviewKey(Date.now()); }}
                      className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all ${previewType === 'phu' ? 'bg-indigo-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Phôi Kết Quả Phụ
                    </button>
                  </div>
                </div>

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
