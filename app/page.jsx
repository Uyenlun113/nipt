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
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  FileText,
  Layers,
  ArrowUpRight
} from 'lucide-react';

function formatDateVN(dateStr) {
  if (!dateStr) return '';
  const cleanStr = dateStr.split('T')[0];
  const parts = cleanStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

export default function MainDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [selectedFilterPkg, setSelectedFilterPkg] = useState('Tất cả');
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
  }, [selectedFilterPkg, searchTerm]);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      let url = `/api/samples`;
      const queryParams = [];
      if (selectedFilterPkg && selectedFilterPkg !== 'Tất cả') {
        queryParams.push(`package=${encodeURIComponent(selectedFilterPkg)}`);
      }
      if (searchTerm) {
        queryParams.push(`search=${encodeURIComponent(searchTerm)}`);
      }
      if (queryParams.length > 0) {
        url += `?${queryParams.join('&')}`;
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
        text: `Đã đọc thành công chỉ số cfDNA ${data.cfDNA}% từ file kết quả ${file.name}`
      });

      fetchSamples();
    } catch (err) {
      setStatusMsg({ type: 'error', text: err.message });
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteSample = async (sampleId, sampleCode) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa mẫu NIPT barcode: ${sampleCode}?`)) return;

    try {
      const res = await fetch(`/api/samples/${sampleId}`, { method: 'DELETE' });
      if (res.ok) {
        setStatusMsg({ type: 'success', text: `Đã xóa mẫu ${sampleCode} thành công` });
        fetchSamples();
      }
    } catch (e) {
      setStatusMsg({ type: 'error', text: 'Lỗi xóa mẫu' });
    }
  };

  const getPackageDetailRoute = (sampleId, packageType) => {
    const pkg = (packageType || '').toLowerCase();
    if (pkg.includes('7')) return `/samples/genet7/${sampleId}`;
    if (pkg.includes('23')) return `/samples/genet23/${sampleId}`;
    if (pkg.includes('plus')) return `/samples/plus/${sampleId}`;
    if (pkg.includes('twin')) return `/samples/twins/${sampleId}`;
    if (pkg.includes('4') || pkg.includes('genni')) return `/samples/genet4/${sampleId}`;
    return `/samples/eco/${sampleId}`;
  };

  // Detailed Statistics Data Calculations
  const totalSamplesCount = samples.length;
  
  const packageStats = [
    {
      id: 'GeneT Eco',
      name: 'GeneT Eco',
      count: samples.filter(s => (s.packageType || '').includes('Eco')).length,
      color: 'from-teal-500 to-teal-600',
      barBg: 'bg-teal-500',
      badgeBg: 'bg-teal-50 text-teal-900 border-teal-200',
      route: '/packages/eco'
    },
    {
      id: 'GeneT 4',
      name: 'GeneT 4',
      count: samples.filter(s => (s.packageType || '').includes('4') || (s.packageType || '').includes('GENNI')).length,
      color: 'from-amber-500 to-amber-600',
      barBg: 'bg-amber-500',
      badgeBg: 'bg-amber-50 text-amber-900 border-amber-200',
      route: '/packages/genet4'
    },
    {
      id: 'GeneT 7',
      name: 'GeneT 7',
      count: samples.filter(s => (s.packageType || '').includes('7')).length,
      color: 'from-blue-500 to-blue-600',
      barBg: 'bg-blue-500',
      badgeBg: 'bg-blue-50 text-blue-900 border-blue-200',
      route: '/packages/genet7'
    },
    {
      id: 'GeneT 23',
      name: 'GeneT 23',
      count: samples.filter(s => (s.packageType || '').includes('23')).length,
      color: 'from-indigo-500 to-indigo-600',
      barBg: 'bg-indigo-500',
      badgeBg: 'bg-indigo-50 text-indigo-900 border-indigo-200',
      route: '/packages/genet23'
    },
    {
      id: 'GeneT Plus',
      name: 'GeneT Plus',
      count: samples.filter(s => (s.packageType || '').toLowerCase().includes('plus')).length,
      color: 'from-purple-500 to-purple-600',
      barBg: 'bg-purple-500',
      badgeBg: 'bg-purple-50 text-purple-900 border-purple-200',
      route: '/packages/plus'
    },
    {
      id: 'GeneT Twins',
      name: 'GeneT Twins',
      count: samples.filter(s => (s.packageType || '').toLowerCase().includes('twin')).length,
      color: 'from-rose-500 to-rose-600',
      barBg: 'bg-rose-500',
      badgeBg: 'bg-rose-50 text-rose-900 border-rose-200',
      route: '/packages/twins'
    }
  ];

  // Status statistics
  const completedSamplesCount = samples.filter(s => s.status === 'completed' || s.status === 'extracted' || Boolean(s.originalPdfUrl) || Boolean(s.cfDNA)).length;
  const pendingSamplesCount = totalSamplesCount - completedSamplesCount;
  const extractedCount = completedSamplesCount;
  const pendingCount = pendingSamplesCount;
  const extractedPercent = totalSamplesCount > 0 ? Math.round((completedSamplesCount / totalSamplesCount) * 100) : 0;

  // Maximum count for relative chart bar heights
  const maxCount = Math.max(...packageStats.map(p => p.count), 1);

  // High risk check
  const highRiskCount = samples.filter(s => {
    if (!s.results) return false;
    return Object.values(s.results).some(item => (item?.risk || '').includes('cao'));
  }).length;

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar selectedPackage="Dashboard" userRole={user?.role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-8 w-full">
          {/* Top Title & Primary Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
                <span>Dashboard Thống Kê Tổng Quan NIPT</span>
                <span className="px-3 py-1 bg-teal-100 text-teal-900 text-xs font-bold rounded-full border border-teal-200">
                  Biểu Đồ Theo Gói
                </span>
              </h1>
              <p className="text-sm text-slate-500 font-medium mt-1">
                Báo cáo trực quan số lượng mẫu NIPT, phân bổ theo từng gói dịch vụ và tỷ lệ trích xuất kết quả
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={fetchSamples}
                className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-700 hover:bg-slate-100 transition-all shadow-sm"
                title="Làm mới dữ liệu thống kê"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <Link
                href="/samples/create"
                className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Tạo Mẫu NIPT Mới</span>
              </Link>
            </div>
          </div>

          {statusMsg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border ${
              statusMsg.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              <CheckCircle2 className="w-5 h-5 text-teal-600 shrink-0" />
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Section 1: Summary Metric Counter Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-slate-500 tracking-wider">Tổng Mẫu NIPT</span>
                <div className="p-2.5 bg-teal-50 text-teal-700 rounded-xl">
                  <Dna className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900">{totalSamplesCount}</span>
                <span className="text-xs font-bold text-slate-400">mẫu đã tiếp nhận</span>
              </div>
              <p className="text-xs text-slate-500 font-medium">Toàn bộ 6 gói xét nghiệm</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-emerald-800 tracking-wider">Đã Trả Kết Quả</span>
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-800">{completedSamplesCount}</span>
                <span className="text-xs font-bold text-emerald-800">mẫu hoàn tất</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium">Đã xuất hoặc sẵn sàng phôi</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-amber-800 tracking-wider">Chờ Kết Quả</span>
                <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-amber-800">{pendingSamplesCount}</span>
                <span className="text-xs font-bold text-amber-800">mẫu chờ xử lý</span>
              </div>
              <p className="text-xs text-amber-800 font-medium">Chờ tải lên file PDF kết quả</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-rose-800 tracking-wider">Nguy Cơ Cao</span>
                <div className="p-2.5 bg-rose-50 text-rose-700 rounded-xl">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-rose-800">{highRiskCount}</span>
                <span className="text-xs font-bold text-rose-800">mẫu phát hiện</span>
              </div>
              <p className="text-xs text-rose-600 font-bold">Cần bác sĩ di truyền hội chẩn</p>
            </div>
          </div>

          {/* Section 2: VISUAL CHARTS GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Biểu Đồ Cột Phân Bổ Mẫu Theo Gói NIPT (2 Columns) */}
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-teal-50 text-teal-800 rounded-xl">
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Biểu Đồ Thống Kê Mẫu Theo Gói Xét Nghiệm NIPT</h3>
                    <p className="text-xs text-slate-500 font-medium">Phân bố số lượng mẫu thực tế theo từng loại dịch vụ</p>
                  </div>
                </div>

                <span className="text-xs font-mono font-extrabold px-3 py-1 bg-slate-100 rounded-lg text-slate-700">
                  Tổng: {totalSamplesCount} Mẫu
                </span>
              </div>

              {/* Bar Chart Visual Bars */}
              <div className="grid grid-cols-6 gap-3 items-end h-64 pt-6 pb-2 px-2 border-b border-slate-200">
                {packageStats.map((item) => {
                  const heightPercent = totalSamplesCount > 0 ? Math.max(Math.round((item.count / maxCount) * 100), 8) : 8;
                  const percentOfTotal = totalSamplesCount > 0 ? Math.round((item.count / totalSamplesCount) * 100) : 0;

                  return (
                    <div key={item.id} className="flex flex-col items-center gap-2 h-full justify-end group">
                      <span className="text-xs font-mono font-black text-slate-900 group-hover:scale-110 transition-transform">
                        {item.count}
                      </span>
                      <div className="w-full bg-slate-100 rounded-xl overflow-hidden flex items-end h-full p-1 border border-slate-200/60">
                        <div
                          className={`w-full bg-gradient-to-t ${item.color} rounded-lg transition-all duration-700 group-hover:opacity-90 shadow-sm`}
                          style={{ height: `${heightPercent}%` }}
                        />
                      </div>
                      <div className="text-center">
                        <span className="block text-xs font-extrabold text-slate-800 truncate max-w-[80px]" title={item.name}>
                          {item.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 font-bold">{percentOfTotal}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Package Quick Links Legend Footer */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                {packageStats.map((item) => (
                  <Link
                    key={item.id}
                    href={item.route}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center justify-between ${item.badgeBg} hover:shadow-xs`}
                  >
                    <span>{item.name}</span>
                    <span className="font-mono text-xs">{item.count}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Chart 2: Biểu Đồ Tròn Tỷ Lệ Trạng Thái Mẫu (1 Column) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-50 text-indigo-800 rounded-xl">
                    <PieChart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-slate-900">Tỷ Lệ Xử Lý Kết Quả</h3>
                    <p className="text-xs text-slate-500 font-medium">Trạng thái trích xuất cfDNA</p>
                  </div>
                </div>
              </div>

              {/* SVG Donut Chart Visual */}
              <div className="relative flex items-center justify-center my-4">
                <svg className="w-48 h-48 transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-slate-100"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-teal-600 transition-all duration-1000"
                    strokeDasharray={`${extractedPercent}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>

                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                  <span className="text-3xl font-black text-slate-900 font-mono">{extractedPercent}%</span>
                  <span className="text-[11px] font-extrabold text-teal-800 uppercase tracking-wider">Đã trích xuất</span>
                </div>
              </div>

              {/* Progress Breakdown Stats */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-teal-600" />
                    <span>Đã trích xuất cfDNA</span>
                  </span>
                  <span className="font-mono text-slate-900">{completedSamplesCount} mẫu</span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2 text-slate-700">
                    <span className="w-3 h-3 rounded-full bg-slate-200" />
                    <span>Chờ upload file PDF</span>
                  </span>
                  <span className="font-mono text-slate-900">{pendingSamplesCount} mẫu</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Search & Master Samples Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 w-full">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">
                  Danh Sách Mẫu NIPT Trên Toàn Hệ Thống
                </h3>
                <p className="text-xs text-slate-500 font-medium">Bảng tổng hợp quản lý mẫu NIPT của tất cả các gói xét nghiệm</p>
              </div>

              <div className="relative flex-1 max-w-md w-full">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo Tên thai phụ, Barcode, SĐT, CCCD..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            {/* Package Filter Buttons */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {['Tất cả', 'GeneT Eco', 'GeneT 4', 'GeneT 7', 'GeneT 23'].map((pkg) => (
                <button
                  key={pkg}
                  onClick={() => setSelectedFilterPkg(pkg)}
                  className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all shrink-0 ${
                    selectedFilterPkg === pkg
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {pkg}
                </button>
              ))}
            </div>

            {/* Master Table */}
            <div className="rounded-xl border border-slate-200 overflow-hidden w-full">
              {loading ? (
                <div className="p-12 text-center text-slate-500 font-bold text-sm">
                  <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                  Đang tải danh sách mẫu NIPT...
                </div>
              ) : samples.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <Dna className="w-12 h-12 text-slate-300 mx-auto" />
                  <h3 className="text-base font-bold text-slate-700">Chưa có mẫu NIPT nào trong danh mục này</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Ấn nút &ldquo;Tạo Mẫu NIPT Mới&rdquo; để khởi tạo mẫu NIPT cho thai phụ
                  </p>
                  <Link
                    href="/samples/create"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-xs font-bold hover:bg-teal-700 transition-all shadow-sm"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Tạo Mẫu Đầu Tiên</span>
                  </Link>
                </div>
              ) : (
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-600 text-xs uppercase font-extrabold border-b border-slate-200">
                        <th className="py-3.5 px-4">Barcode / Mã mẫu</th>
                        <th className="py-3.5 px-4">Họ và tên Thai Phụ</th>
                        <th className="py-3.5 px-4">SĐT / CCCD</th>
                        <th className="py-3.5 px-4">Gói Xét Nghiệm</th>
                        <th className="py-3.5 px-4">Tuổi Thai</th>
                        <th className="py-3.5 px-4 text-center">Hàm lượng cfDNA (%)</th>
                        <th className="py-3.5 px-4 text-center">Trạng thái</th>
                        <th className="py-3.5 px-4 text-right">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {samples.map((s) => {
                        const id = s._id || s.id;
                        const hasCfDna = Boolean(s.cfDNA);
                        const isUploadingThis = uploadingId === id;
                        const formattedDob = formatDateVN(s.dob);
                        const hasOriginalFile = Boolean(s.originalPdfUrl);
                        const detailUrl = getPackageDetailRoute(id, s.packageType);

                        return (
                          <tr key={id} className="hover:bg-slate-50 transition-colors">
                            <td className="py-4 px-4 font-mono font-extrabold text-teal-900 text-sm">
                              <Link href={detailUrl} className="hover:underline flex items-center gap-1">
                                <span>{s.sampleCode}</span>
                                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                              </Link>
                            </td>
                            <td className="py-4 px-4 font-extrabold text-slate-900 text-sm">
                              <Link href={detailUrl} className="hover:underline">
                                {s.fullName}
                              </Link>
                              <span className="block text-xs text-slate-500 font-medium mt-0.5">
                                {formattedDob ? `Ngày sinh: ${formattedDob}` : ''}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-700 font-medium">
                              <div>{s.phone || '-'}</div>
                              <div className="text-xs text-slate-400">{s.idCard || ''}</div>
                            </td>
                            <td className="py-4 px-4 font-bold text-slate-800">
                              <span className="px-3 py-1 rounded-lg bg-slate-100 border border-slate-200 text-xs font-extrabold">
                                {s.packageType}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-700 font-medium">
                              {s.gestationalAge} ({s.pregnancyType || 'Đơn thai'})
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
                                {/* Nếu đã có file gốc -> Ẩn nút Upload, hiển thị nút File Gốc Cloudinary */}
                                {hasOriginalFile ? (
                                  <a
                                    href={s.originalPdfUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="px-3 py-1.5 rounded-xl text-xs font-extrabold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 flex items-center gap-1.5 transition-all shadow-xs"
                                    title={`Xem/Tải file gốc đối chiếu (${s.originalPdfName || 'File gốc'})`}
                                  >
                                    <FileText className="w-4 h-4 text-indigo-600" />
                                    <span>File gốc</span>
                                  </a>
                                ) : (
                                  <label
                                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold cursor-pointer flex items-center gap-1.5 transition-all ${
                                      isUploadingThis
                                        ? 'bg-amber-100 text-amber-900'
                                        : 'bg-teal-50 text-teal-800 hover:bg-teal-100 border border-teal-300'
                                    }`}
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
                                  rel="noopener noreferrer"
                                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-extrabold transition-all shadow-xs flex items-center gap-1.5"
                                  title="Xuất file PDF kết quả GeneTrust"
                                >
                                  <Download className="w-4 h-4" />
                                  <span>Phôi</span>
                                </a>

                                {user?.role === 'admin' && (
                                  <button
                                    onClick={() => handleDeleteSample(id, s.sampleCode)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                    title="Xóa mẫu"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
