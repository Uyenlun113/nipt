'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { checkAuth, logout } from '@/lib/auth-client';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Dna, CheckCircle2, AlertCircle, Save } from 'lucide-react';

export default function CreateSamplePage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    fullName: '',
    dob: '',
    idCard: '',
    phone: '',
    address: '',
    gestationalAge: '12 tuần 0 ngày',
    pregnancyType: 'Đơn thai',
    packageType: 'GeneT 7',
    agencyCode: '',
    sampleCode: 'GT-' + Math.floor(10000 + Math.random() * 90000),
    doctorName: '',
    checkerName: '',
    directorName: '',
    tubeType: 'Streck',
    receivedDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    return checkAuth(router, setUser);
  }, [router]);

  const getPackageListRoute = (packageType) => {
    const pkg = (packageType || '').toLowerCase();
    if (pkg.includes('20ga') || pkg.includes('20')) return '/packages/20ga';
    if (pkg.includes('7')) return '/packages/genet7';
    if (pkg.includes('23')) return '/packages/genet23';
    if (pkg.includes('plus')) return '/packages/plus';
    if (pkg.includes('twin')) return '/packages/twins';
    if (pkg.includes('eco')) return '/packages/eco';
    if (pkg.includes('4') || pkg.includes('genni')) return '/packages/genet4';
    return '/';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim()) {
      setError('Vui lòng nhập họ và tên thai phụ');
      return;
    }
    if (!formData.sampleCode.trim()) {
      setError('Vui lòng nhập mã mẫu Barcode');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/samples', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi khi tạo mẫu');

      const targetRoute = getPackageListRoute(formData.packageType);
      router.push(targetRoute);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans w-full">
      <Sidebar userRole={user?.role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden w-full">
        <Header user={user} onLogout={() => logout(router)} />

        <main className="flex-1 overflow-y-auto p-8 space-y-6 w-full">
          {/* Page Top Navigation & Heading */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 w-full">
            <div className="flex items-center gap-4">
              <Link
                href="/"
                className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-700 transition-all"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Tạo Mới Mẫu Xét Nghiệm NIPT
                </h1>
                <p className="text-sm text-slate-500 font-medium">
                  Nhập thông tin hành chính của thai phụ và thông tin đơn vị chỉ định
                </p>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-sm font-semibold text-rose-800 flex items-center gap-3 w-full">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Create Form Container Full Width */}
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8 w-full">
            {/* Section 1: Thông tin Khách hàng */}
            <div className="space-y-4 w-full">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-teal-800 border-b border-slate-200 pb-2 flex items-center gap-2">
                <Dna className="w-5 h-5 text-teal-600" />
                <span>I. Thông Tin Khách Hàng (Thai Phụ)</span>
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm w-full">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Họ và tên thai phụ <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Ví dụ: Nguyễn Thị Thu Hà"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Ngày / Năm sinh</label>
                  <input
                    type="text"
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    placeholder="1995-04-12 hoặc 12/04/1995"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Số CMT / CCCD</label>
                  <input
                    type="text"
                    name="idCard"
                    value={formData.idCard}
                    onChange={handleChange}
                    placeholder="001195008912"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Số điện thoại liên hệ</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0988123456"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Tuổi thai (Tuần / Ngày)</label>
                  <input
                    type="text"
                    name="gestationalAge"
                    value={formData.gestationalAge}
                    onChange={handleChange}
                    placeholder="12 tuần 3 ngày"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Số lượng thai</label>
                  <select
                    name="pregnancyType"
                    value={formData.pregnancyType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                  >
                    <option value="Đơn thai">Đơn thai</option>
                    <option value="Song thai">Song thai</option>
                  </select>
                </div>

                <div className="md:col-span-3">
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Địa chỉ liên hệ</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    placeholder="Địa chỉ nhà, Quận/Huyện, Tỉnh/Thành phố"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Thông tin Mẫu */}
            <div className="space-y-4 pt-4 border-t border-slate-200 w-full">
              <h2 className="text-base font-extrabold uppercase tracking-wider text-teal-800 border-b border-slate-200 pb-2">
                II. Thông Tin Mẫu & Đơn Vị Chỉ Định
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm w-full">
                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Mã Barcode / Mã số mẫu <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sampleCode"
                    value={formData.sampleCode}
                    onChange={handleChange}
                    placeholder="GT-2026-..."
                    className="w-full px-4 py-3 bg-teal-50/60 border border-teal-300 rounded-xl text-sm font-mono font-bold text-teal-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">
                    Gói xét nghiệm NIPT <span className="text-rose-500">*</span>
                  </label>
                  <select
                    name="packageType"
                    value={formData.packageType}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  >
                    <option value="GeneT Eco">GeneT Eco</option>
                    <option value="GeneT 7">GeneT 7</option>
                    <option value="GeneT 23">GeneT 23</option>
                    <option value="GeneT Plus">GeneT Plus (k mở rộng)</option>
                    <option value="GeneT Twins">GeneT Twins (Song thai)</option>
                    <option value="GENNI 4">GENNI 4</option>
                    <option value="20GA">20GA (20 Bệnh Gen Lặn)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Mã Đại lý / PK chỉ định</label>
                  <input
                    type="text"
                    name="agencyCode"
                    value={formData.agencyCode}
                    onChange={handleChange}
                    placeholder="PK-HANOI-01"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Nơi gửi mẫu (Cơ sở / Phòng khám)</label>
                  <input
                    type="text"
                    name="facilityName"
                    value={formData.facilityName || ''}
                    onChange={handleChange}
                    placeholder="Ví dụ: Phòng khám 47 Mỹ Đình, Nam Từ Liêm"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Bác sĩ chỉ định</label>
                  <input
                    type="text"
                    name="doctorName"
                    value={formData.doctorName}
                    onChange={handleChange}
                    placeholder="BS. Nguyễn Văn A"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>



                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Loại ống nghiệm</label>
                  <input
                    type="text"
                    name="tubeType"
                    value={formData.tubeType}
                    onChange={handleChange}
                    placeholder="Streck"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-slate-800 mb-1.5">Ngày nhận mẫu</label>
                  <input
                    type="date"
                    name="receivedDate"
                    value={formData.receivedDate}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Note on cfDNA */}
            <div className="p-4 bg-teal-50 border border-teal-200 rounded-2xl text-sm text-teal-900 flex items-start gap-3 w-full">
              <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Hàm lượng cfDNA tự động đọc từ file PDF</p>
                <p className="text-xs text-teal-800 mt-0.5">
                  Bạn không cần nhập hàm lượng cfDNA tại đây. Sau khi tạo mẫu thành công, bạn bấm <strong>Upload Kết Quả</strong> ở màn danh sách để đọc tự động chỉ số cfDNA và các kết quả phân tích.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-4 w-full">
              <Link
                href="/"
                className="px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
              >
                Hủy bỏ
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-teal-600/20 transition-all flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Đang tạo mẫu...' : 'Lưu Thông Tin Mẫu NIPT'}</span>
              </button>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
