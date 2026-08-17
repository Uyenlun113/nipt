'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkAuth, logout } from '@/lib/auth-client';
import {
  PlusCircle,
  Upload,
  Eye,
  Download,
  Trash2,
  Search,
  CheckCircle2,
  Clock,
  Dna,
  FileText,
  RefreshCw
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

export default function EcoPackageListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    return checkAuth(router, setUser);
  }, [router]);

  useEffect(() => {
    fetchSamples();
  }, [searchTerm]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      let url = `/api/samples?package=${encodeURIComponent('GeneT Eco')}`;
      if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setSamples(data);
      }
    } catch (e) {
      console.error('Fetch samples error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (sampleId, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(sampleId);
    setStatusMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('pdfFile', file);

    try {
      const res = await fetch(`/api/samples/${sampleId}/upload-pdf`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đọc file PDF');

      setStatusMsg({
        type: 'success',
        text: 'Đã đọc thành công chỉ số cfDNA ' + data.cfDNA + '% từ file kết quả ' + file.name + ' và lưu trữ lên Cloudinary!'
      });

      fetchSamples();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Không thể đọc file PDF' });
    } finally {
      setUploadingId(null);
    }
  };

  const handleDelete = async (sampleId, sampleCode) => {
    if (!confirm('Bạn có chắc chắn muốn xóa mẫu NIPT ' + sampleCode + ' không?')) return;

    try {
      const res = await fetch(`/api/samples/${sampleId}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Đã xóa mẫu ' + sampleCode + ' thành công' });
        fetchSamples();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Lỗi xóa mẫu');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    }
  };

  const completedCount = samples.filter(s => s.status === 'completed' || s.status === 'extracted' || Boolean(s.originalPdfUrl) || Boolean(s.cfDNA)).length;
  const pendingCount = samples.length - completedCount;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} selectedPackage="GeneT Eco" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-6 w-full">
          {/* Top Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-teal-100 text-teal-800 rounded-xl">
                  <Dna className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Quản Lý Gói NIPT GeneT Eco (Song Thai)
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Sàng lọc 3 hội chứng lệch bội phổ biến nhất: Hội chứng Down (T21), Edwards (T18), Patau (T13)
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSamples}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all shadow-sm"
                title="Làm mới danh sách"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <Link
                href="/samples/create"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo Mẫu Eco Mới</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Tổng Mẫu NIPT GeneT Eco (Song Thai)</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{samples.length}</h3>
              </div>
              <div className="w-12 h-12 bg-teal-50 border border-teal-100 rounded-2xl flex items-center justify-center text-teal-600 font-black">
                {samples.length}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase">Đã Trả Kết Quả</p>
                <h3 className="text-3xl font-black text-emerald-700 mt-1">{completedCount}</h3>
              </div>
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 font-black">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-amber-700 uppercase">Chờ Kết Quả</p>
                <h3 className="text-3xl font-black text-amber-700 mt-1">{pendingCount}</h3>
              </div>
              <div className="w-12 h-12 bg-amber-50 border border-amber-100 rounded-2xl flex items-center justify-center text-amber-600 font-black">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Status Message Notification */}
          {statusMsg.text && (
            <div
              className={"p-4 rounded-xl text-sm font-bold flex items-center justify-between border " + (statusMsg.type === 'success'
                  ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                  : 'bg-teal-50 text-teal-900 border-teal-200')}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-teal-600 shrink-0" />
                )}
                <span>{statusMsg.text}</span>
              </div>
              <button
                onClick={() => setStatusMsg({ type: '', text: '' })}
                className="text-xs text-slate-500 hover:text-slate-800 font-bold"
              >
                Đóng
              </button>
            </div>
          )}

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo Mã Mẫu (Barcode), Họ tên thai phụ, Số điện thoại hoặc CMT..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {/* Full Width Table of Samples */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-4">Mã Mẫu / Barcode</th>
                    <th className="py-4 px-4">Họ và Tên Thai Phụ</th>
                    <th className="py-4 px-4">Số Điện Thoại / CMT</th>
                    <th className="py-4 px-4">Tuổi Thai / Loại</th>
                    <th className="py-4 px-4 text-center">cfDNA (%)</th>
                    <th className="py-4 px-4 text-center">Trạng Thái</th>
                    <th className="py-4 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        <span>Đang tải danh sách mẫu NIPT GeneT Eco (Song Thai)...</span>
                      </td>
                    </tr>
                  ) : samples.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400">
                        Chưa có mẫu xét nghiệm NIPT GeneT Eco (Song Thai) nào trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    samples.map((s) => {
                      const id = s._id || s.id;
                      const hasCfDna = Boolean(s.cfDNA);
                      const isCompleted = s.status === 'completed' || s.status === 'extracted' || Boolean(s.originalPdfUrl) || hasCfDna;
                      const hasOriginalFile = Boolean(s.originalPdfUrl);
                      const isUploadingThis = uploadingId === id;
                      const detailUrl = '/samples/eco/' + id;

                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 font-mono font-extrabold text-teal-900 text-sm">
                            <Link href={detailUrl} className="hover:underline">
                              {s.sampleCode}
                            </Link>
                          </td>
                          <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                            <Link href={detailUrl} className="hover:underline">
                              {s.fullName}
                            </Link>
                            <span className="block text-xs text-slate-500 font-medium mt-0.5">
                              {formatDateVN(s.dob) ? ('Ngày sinh: ' + formatDateVN(s.dob)) : ''}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-700 font-medium">
                            <div>{s.phone || '-'}</div>
                            <div className="text-xs text-slate-400">{s.idCard || ''}</div>
                          </td>
                          <td className="py-4 px-4 text-slate-700 font-medium">
                            <div>{s.gestationalAge || '-'}</div>
                            <span className="inline-block mt-0.5 px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                              {s.pregnancyType || 'Đơn thai'}
                            </span>
                          </td>

                          <td className="py-4 px-4 text-center">
                            {hasCfDna ? (
                              <span className="px-3 py-1 rounded-lg bg-teal-50 text-teal-900 font-mono font-extrabold text-xs border border-teal-200 shadow-xs">
                                {s.cfDNA}%
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">Chưa có</span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-center">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-extrabold text-xs border border-emerald-200 shadow-xs">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Đã trả kết quả
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 font-bold text-xs border border-amber-200">
                                <Clock className="w-3.5 h-3.5 text-amber-600" />
                                Chờ kết quả
                              </span>
                            )}
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {isCompleted ? (
                                hasOriginalFile ? (
                                  <a
                                    href={s.originalPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-all shadow-xs"
                                    title={'Xem/Tải file gốc đối chiếu'}
                                  >
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span>File gốc</span>
                                  </a>
                                ) : null
                              ) : (
                                <label
                                  className={"px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all " + (isUploadingThis
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-300')}
                                  title="Tải lên file PDF kết quả từ máy"
                                >
                                  <Upload className="w-4 h-4" />
                                  <span>{isUploadingThis ? 'Đang đọc...' : 'Upload PDF'}</span>
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    className="hidden"
                                    onChange={(e) => handleFileUpload(id, e)}
                                    disabled={isUploadingThis}
                                  />
                                </label>
                              )}

                              <Link
                                href={detailUrl}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 border border-slate-300"
                              >
                                <Eye className="w-4 h-4 text-slate-700" />
                                <span>Chi Tiết</span>
                              </Link>

                              <a
                                href={'/api/samples/' + id + '/generate-genetrust'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5"
                                title="Xuất file PDF kết quả GeneTrust"
                              >
                                <Download className="w-4 h-4" />
                                <span>Phôi</span>
                              </a>

                              <button
                                onClick={() => handleDelete(id, s.sampleCode)}
                                className="p-1.5 text-slate-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg transition-all"
                                title="Xóa mẫu"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
