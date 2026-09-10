'use client';

import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { checkAuth, logout } from '@/lib/auth-client';
import ConfirmDeleteModal from '@/components/ConfirmDeleteModal';
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

export default function PackageThalassemiaPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [samples, setSamples] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadingId, setUploadingId] = useState(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    return checkAuth(router, setUser);
  }, [router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchSamples();
  }, [debouncedSearchTerm]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      let url = `/api/samples?package=${encodeURIComponent('Thalassemia')}`;
      if (debouncedSearchTerm) {
        url += `&search=${encodeURIComponent(debouncedSearchTerm)}`;
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
        text: 'Đã đọc và cập nhật kết quả Sàng lọc Thalassemia từ file ' + file.name + ' thành công!'
      });

      fetchSamples();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message || 'Không thể đọc file PDF' });
    } finally {
      setUploadingId(null);
    }
  };

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = (sampleId, sampleCode) => {
    setDeleteTarget({ id: sampleId, sampleCode });
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/samples/${deleteTarget.id}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: 'Đã xóa mẫu ' + deleteTarget.sampleCode + ' thành công' });
        fetchSamples();
      } else {
        const d = await res.json();
        throw new Error(d.error || 'Lỗi xóa mẫu');
      }
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const completedCount = samples.filter(s => s.status === 'completed').length;
  const pendingCount = samples.length - completedCount;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} selectedPackage="Thalassemia" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-6 w-full">
          {/* Top Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Dna className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Sàng lọc Thalassemia (Gen Lặn)</h1>
                  <p className="text-sm text-slate-500 font-medium">Danh sách và quản lý mẫu phiếu trả kết quả Thalassemia</p>
                </div>
              </div>
            </div>

            <Link
              href="/samples/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm rounded-xl shadow-md transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tạo Mẫu NIPT Mới</span>
            </Link>
          </div>

          {statusMsg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border w-full ${
              statusMsg.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng số mẫu</p>
                <p className="text-2xl font-black text-slate-900">{samples.length}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đã hoàn thành / Upload</p>
                <p className="text-2xl font-black text-emerald-600">{completedCount}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Đang chờ xử lý</p>
                <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm theo Mã mẫu, Họ tên, SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>

            <button
              onClick={fetchSamples}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all border border-slate-200"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Làm mới</span>
            </button>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-4 text-center">STT</th>
                    <th className="py-4 px-4">Mã Mẫu / Barcode</th>
                    <th className="py-4 px-4">Họ và Tên</th>
                    <th className="py-4 px-4">Số điện thoại / CCCD</th>
                    <th className="py-4 px-4">Ngày lấy / nhận mẫu</th>
                    <th className="py-4 px-4 text-center">Trạng thái</th>
                    <th className="py-4 px-4 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-teal-600" />
                        Đang tải danh sách mẫu Thalassemia...
                      </td>
                    </tr>
                  ) : samples.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-12 text-slate-400">
                        Chưa có dữ liệu mẫu Thalassemia nào.
                      </td>
                    </tr>
                  ) : (
                    samples.map((s, idx) => {
                      const id = s._id || s.id;
                      const detailUrl = `/samples/thalassemia/${id}`;
                      const isCompleted = s.status === 'completed';
                      const hasOriginalFile = Boolean(s.originalPdfUrl);
                      const isUploadingThis = uploadingId === id;

                      return (
                        <tr key={id} className="hover:bg-slate-50 transition-all">
                          <td className="py-4 px-4 text-center text-slate-400 font-bold text-xs">{idx + 1}</td>
                          <td className="py-4 px-4 font-mono font-extrabold text-xs">
                            <Link href={detailUrl} className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-800 border border-rose-200 hover:bg-rose-100 transition-all">
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
                          <td className="py-4 px-4 text-xs text-slate-500">
                            <div>Lấy: {formatDateVN(s.samplingDate) || '---'}</div>
                            <div>Nhận: {formatDateVN(s.receivedDate) || '---'}</div>
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
                              {hasOriginalFile ? (
                                <a
                                  href={`/api/samples/${id}/original-pdf`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-all shadow-xs"
                                  title="Xem/Tải file gốc đối chiếu"
                                >
                                  <FileText className="w-4 h-4 text-indigo-600" />
                                  <span>File gốc</span>
                                </a>
                              ) : (
                                <label
                                  className={"px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all " + (isUploadingThis
                                      ? 'bg-amber-100 text-amber-900'
                                      : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-300')}
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
                                href={`/api/samples/${id}/generate-genetrust`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5"
                                title="Tải về file PDF kết quả Sàng lọc Thalassemia"
                              >
                                <Download className="w-4 h-4" />
                                <span>Tải PDF</span>
                              </a>

                              <button
                                onClick={() => handleDelete(id, s.sampleCode)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
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

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        sampleCode={deleteTarget?.sampleCode || ''}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
      />
    </div>
  );
}
