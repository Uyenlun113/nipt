'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Dna,
  FileSpreadsheet,
  Users,
  FileText,
  PlusCircle,
  BarChart3
} from 'lucide-react';

export default function Sidebar({ selectedPackage, userRole }) {
  const pathname = usePathname();

  const packageItems = [
    { id: 'GeneT Eco', label: 'GeneT Eco', icon: Dna, color: 'text-teal-600', href: '/packages/eco' },
    { id: 'GeneT 4', label: 'GeneT 4', icon: Dna, color: 'text-amber-600', href: '/packages/genet4' },
    { id: 'GeneT 7', label: 'GeneT 7', icon: Dna, color: 'text-blue-600', href: '/packages/genet7' },
    { id: 'GeneT 23', label: 'GeneT 23', icon: Dna, color: 'text-indigo-600', href: '/packages/genet23' },
    { id: 'GeneT Plus', label: 'GeneT Plus (k mở rộng)', icon: Dna, color: 'text-purple-600', href: '/packages/plus' },
    { id: 'GeneT Twins', label: 'GeneT Twins (Song thai)', icon: Dna, color: 'text-rose-600', href: '/packages/twins' },
  ];

  return (
    <aside className="w-72 bg-white text-slate-800 flex flex-col border-r border-slate-200 h-screen sticky top-0 shadow-sm z-30">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-200 flex items-center gap-3 bg-slate-50/80">
        <div className="w-11 h-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-600/20">
          <Dna className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-extrabold text-lg text-slate-900 tracking-tight">GENETRUST</h1>
          <p className="text-xs text-teal-700 font-semibold">NIPT Management Tool</p>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">
        {/* Quick Action: Tạo Mẫu Mới (Trang riêng) */}
        <Link
          href="/samples/create"
          className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm shadow-md shadow-teal-600/20 transition-all"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Tạo Mẫu NIPT Mới</span>
        </Link>

        {/* Menu: Dashboard Thống Kê Tổng Quan */}
        <div>
          <div className="px-2 mb-2 text-xs font-bold tracking-wider text-slate-500 uppercase">
            Tổng Quan
          </div>
          <Link
            href="/"
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              pathname === '/' ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold shadow-sm' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <BarChart3 className={`w-5 h-5 ${pathname === '/' ? 'text-teal-600' : 'text-slate-600'}`} />
            <span>Dashboard Thống kê</span>
          </Link>
        </div>

        {/* Section: Packages Filter */}
        <div>
          <div className="px-2 mb-3 flex items-center justify-between text-xs font-bold tracking-wider text-slate-500 uppercase">
            <span>Danh mục Mẫu NIPT</span>
            <FileSpreadsheet className="w-4 h-4 text-slate-400" />
          </div>
          <nav className="space-y-1.5">
            {packageItems.map((item) => {
              const Icon = item.icon;
              const isSelected = pathname.includes(item.href) || selectedPackage === item.id;
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    isSelected
                      ? 'bg-teal-50 text-teal-900 border border-teal-200 font-bold shadow-sm'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? 'text-teal-600' : item.color}`} />
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Section: Management / System */}
        <div>
          <div className="px-2 mb-3 text-xs font-bold tracking-wider text-slate-500 uppercase">
            Quản trị & Thư viện
          </div>
          <nav className="space-y-1.5">
            {userRole === 'admin' && (
              <Link
                href="/users"
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  pathname === '/users' ? 'bg-blue-50 text-blue-900 border border-blue-200 font-bold' : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Users className="w-5 h-5 text-blue-600" />
                <span>Quản lý Người dùng</span>
              </Link>
            )}

            <Link
              href="/templates"
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                pathname === '/templates' ? 'bg-purple-50 text-purple-900 border border-purple-200 font-bold' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <FileText className="w-5 h-5 text-purple-600" />
              <span>Thư viện Phôi kết quả</span>
            </Link>
          </nav>
        </div>
      </div>

      {/* User Footer info */}
      <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-teal-600 text-white font-bold text-sm flex items-center justify-center">
          GT
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-slate-900 truncate">GeneTrust Việt Nam</p>
          <p className="text-xs text-slate-500 truncate">Hệ thống NIPT v2.5</p>
        </div>
      </div>
    </aside>
  );
}
