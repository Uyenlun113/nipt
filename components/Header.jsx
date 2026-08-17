'use client';

import React from 'react';
import Link from 'next/link';
import { Search, Plus, LogOut, Dna } from 'lucide-react';

export default function Header({ user, onLogout, onSearchChange, searchTerm }) {
  return (
    <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-20 shadow-sm">
      {/* Search Input */}
      <div className="flex items-center gap-3 w-96">
        <div className="relative w-full">
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm || ''}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            placeholder="Tìm theo Barcode, Họ tên, SĐT, CCCD..."
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
          />
        </div>
      </div>

      {/* Action Buttons & User Info */}
      <div className="flex items-center gap-4">
        {/* Create New Sample Button (Trang riêng) */}
        <Link
          href="/samples/create"
          className="flex items-center gap-2 px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-bold shadow-md shadow-teal-600/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          <span>Tạo Mẫu NIPT Mới</span>
        </Link>

        <div className="h-6 w-px bg-slate-200" />

        {/* Account Tag */}
        <div className="flex items-center gap-3 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200">
          <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-bold text-sm">
            {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-900 leading-none">
                {user?.fullName || 'Người dùng'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs font-extrabold leading-none ${
                user?.role === 'admin' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-blue-100 text-blue-800 border border-blue-200'
              }`}>
                {user?.role === 'admin' ? 'ADMIN' : 'STAFF'}
              </span>
            </div>
            <span className="text-xs text-slate-500 leading-tight block mt-0.5">
              {user?.username || 'user'}
            </span>
          </div>
        </div>

        {/* Logout button */}
        <button
          onClick={onLogout}
          title="Đăng xuất"
          className="p-2.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}
