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
  RefreshCw,
  Layers
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

export default function ComboPackageListPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [subPackageFilter, setSubPackageFilter] = useState('all');
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
  }, [debouncedSearchTerm, subPackageFilter]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      let pkgQuery = subPackageFilter !== 'all' ? subPackageFilter : 'combo';
      let url = `/api/samples?package=${encodeURIComponent(pkgQuery)}`;
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

  const handleFileUpload = async (sampleId, target, e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingId(`${sampleId}_${target}`);
    setStatusMsg({ type: '', text: '' });

    const formData = new FormData();
    formData.append('pdfFile', file);
    formData.append('target', target);

    try {
      const res = await fetch(`/api/samples/${sampleId}/upload-pdf?target=${target}`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi đọc file PDF');

      setStatusMsg({
        type: 'success',
        text: `Đã tải lên và đọc tự động file ${target === '20ga' ? '20GA' : 'NIPT'} thành công cho mẫu!`
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
      <Sidebar userRole={user?.role} selectedPackage="Combo" />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-6 w-full">
          {/* Top Banner */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div>
              <div className="flex items-center gap-3">
                <span className="p-2.5 bg-violet-100 text-violet-800 rounded-xl">
                  <Layers className="w-6 h-6" />
                </span>
                <div>
                  <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                    Quản Lý Gói Combo GeneT (NIPT + 20GA)
                  </h1>
                  <p className="text-sm text-slate-500 font-medium">
                    Bao gồm 4 gói combo: GeneT 7 + 20GA, GeneT 23 + 20GA, GeneT Plus + 20GA, GeneT Twins + 20GA
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
                className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl font-extrabold text-sm shadow-md shadow-violet-600/20 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo Mẫu Combo Mới</span>
              </Link>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase">Tổng Mẫu Combo (NIPT + 20GA)</p>
                <h3 className="text-3xl font-black text-slate-900 mt-1">{samples.length}</h3>
              </div>
              <div className="w-12 h-12 bg-violet-50 border border-violet-100 rounded-2xl flex items-center justify-center text-violet-600 font-black">
                {samples.length}
              </div>
            </div>

            <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-emerald-700 uppercase">Đã Có Kết Quả</p>
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
                  : 'bg-violet-50 text-violet-900 border-violet-200')}
            >
              <div className="flex items-center gap-2">
                {statusMsg.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-violet-600 shrink-0" />
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

          {/* Search & Sub-package Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
            <div className="relative flex-1 min-w-[280px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo Mã Mẫu (Barcode), Họ tên thai phụ, Số điện thoại hoặc CMT..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:border-violet-500 transition-all"
              />
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">Gói combo:</span>
              <select
                value={subPackageFilter}
                onChange={(e) => setSubPackageFilter(e.target.value)}
                className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:border-violet-500"
              >
                <option value="all">Tất cả Gói Combo (4 Gói)</option>
                <option value="GeneT 7 + 20GA">GeneT 7 + 20GA</option>
                <option value="GeneT 23 + 20GA">GeneT 23 + 20GA</option>
                <option value="GeneT Plus + 20GA">GeneT Plus + 20GA</option>
                <option value="GeneT Twins + 20GA">GeneT Twins + 20GA</option>
              </select>
            </div>
          </div>

          {/* Full Width Table of Combo Samples */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden w-full">
            <div className="overflow-x-auto w-full">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                    <th className="py-4 px-4">Mã Mẫu / Barcode</th>
                    <th className="py-4 px-4">Họ và Tên Thai Phụ</th>
                    <th className="py-4 px-4">Gói Xét Nghiệm</th>
                    <th className="py-4 px-4">Số Điện Thoại / CMT</th>
                    <th className="py-4 px-4 text-center">Trạng Thái NIPT / 20GA</th>
                    <th className="py-4 px-4 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-violet-600" />
                        <span>Đang tải danh sách mẫu Combo NIPT + 20GA...</span>
                      </td>
                    </tr>
                  ) : samples.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        Chưa có mẫu xét nghiệm Combo NIPT + 20GA nào trong danh sách.
                      </td>
                    </tr>
                  ) : (
                    samples.map((s) => {
                      const id = s._id || s.id;
                      const hasNiptFile = Boolean(s.originalPdfUrl) || Boolean(s.cfDNA);
                      const has20GAFile = Boolean(s.originalPdf20GAUrl) || (s.results20GA && Object.keys(s.results20GA).length > 0);
                      const detailUrl = '/samples/combo/' + id;

                      const isUploadingNipt = uploadingId === `${id}_nipt`;
                      const isUploading20GA = uploadingId === `${id}_20ga`;

                      return (
                        <tr key={id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-4 px-4 font-mono font-extrabold text-violet-900 text-sm">
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
                          <td className="py-4 px-4">
                            <span className="px-2.5 py-1 bg-violet-50 text-violet-900 text-xs font-bold rounded-lg border border-violet-200">
                              {s.packageType}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-700 font-medium">
                            <div>{s.phone || '-'}</div>
                            <div className="text-xs text-slate-400">{s.idCard || ''}</div>
                          </td>

                          <td className="py-4 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold ${hasNiptFile ? 'bg-blue-50 text-blue-800 border border-blue-200' : 'bg-slate-100 text-slate-500'}`}>
                                NIPT: {hasNiptFile ? 'Đã có' : 'Chưa up'}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded text-[11px] font-extrabold ${has20GAFile ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                                20GA: {has20GAFile ? 'Đã có' : 'Chưa up'}
                              </span>
                            </div>
                          </td>

                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              {/* Upload NIPT Button */}
                              <label
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 border ${isUploadingNipt ? 'bg-amber-100 text-amber-900' : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border-blue-200'}`}
                                title="Up file NIPT PDF"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploadingNipt ? '...' : 'Up NIPT'}</span>
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(id, 'nipt', e)}
                                  disabled={Boolean(uploadingId)}
                                />
                              </label>

                              {/* Upload 20GA Button */}
                              <label
                                className={`px-2.5 py-1 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1 border ${isUploading20GA ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border-emerald-200'}`}
                                title="Up file 20GA PDF"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>{isUploading20GA ? '...' : 'Up 20GA'}</span>
                                <input
                                  type="file"
                                  accept=".pdf"
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(id, '20ga', e)}
                                  disabled={Boolean(uploadingId)}
                                />
                              </label>

                              <Link
                                href={detailUrl}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-900 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1 border border-slate-300"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-700" />
                                <span>Chi Tiết</span>
                              </Link>

                              <button
                                onClick={() => {
                                  window.open('/api/samples/' + id + '/download-zip', '_blank');
                                }}
                                className="px-3 py-1 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1"
                                title="Tải về cả 2 file PDF (ZIP)"
                              >
                                <Download className="w-3.5 h-3.5" />
                                <span>Tải 2 File</span>
                              </button>

                              <button
                                onClick={() => handleDelete(id, s.sampleCode)}
                                className="p-1.5 text-slate-400 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-all"
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
        isOpen={!!deleteTarget}
        sampleCode={deleteTarget?.sampleCode || ''}
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTarget(null)}
        loading={deleting}
      />
    </div>
  );
}
