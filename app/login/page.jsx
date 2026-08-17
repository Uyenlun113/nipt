'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dna, Lock, User, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { saveAuthSession, isAuthValid } from '@/lib/auth-client';

export default function LoginPage() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sessionExpiredNotice, setSessionExpiredNotice] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // If already logged in and session is still valid (less than 1 day), redirect to home
    if (isAuthValid()) {
      router.push('/');
      return;
    }

    // Check if redirected due to expired session
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const isExpired = urlParams.get('expired') === '1';
      const msg = sessionStorage.getItem('nipt_auth_msg');
      if (isExpired || msg) {
        setSessionExpiredNotice(true);
        sessionStorage.removeItem('nipt_auth_msg');
      }
    }
  }, [router]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');

      // Save token, user and 1-day expiration timestamp
      saveAuthSession(data.token, data.user, data.expiresAt);

      router.push('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 relative">
      <div className="w-full max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-600 shadow-lg shadow-teal-600/20 mb-4">
            <Dna className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">GENETRUST NIPT</h1>
          <p className="text-sm text-teal-800 font-bold mt-1">Hệ thống Quản lý Mẫu & Đọc Kết quả Xét nghiệm NIPT</p>
        </div>

        {/* Login Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-xl space-y-6">
          <div className="text-center pb-3 border-b border-slate-200">
            <h2 className="text-base font-extrabold text-slate-900 uppercase tracking-wider">Đăng nhập Hệ thống</h2>
            <p className="text-xs text-slate-500 font-medium mt-1">Nhập tài khoản kỹ thuật viên hoặc quản trị viên</p>
          </div>

          {sessionExpiredNotice && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Phiên đăng nhập đã hết hạn (1 ngày). Vui lòng đăng nhập lại để tiếp tục.</span>
            </div>
          )}

          {error && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-800">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Tên đăng nhập</label>
              <div className="relative">
                <User className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin hoặc nhanvien"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-800 mb-1.5">Mật khẩu</label>
              <div className="relative">
                <Lock className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mật khẩu của bạn"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-sm text-slate-900 font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-extrabold text-sm shadow-lg shadow-teal-600/20 transition-all flex items-center justify-center gap-2 group mt-2"
            >
              <span>{loading ? 'Đang xác thực...' : 'Đăng nhập vào Hệ thống'}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          {/* Preset credentials helper for testing */}
          <div className="pt-4 border-t border-slate-200 text-xs text-slate-600 space-y-2">
            <div className="flex items-center gap-1.5 text-teal-800 font-bold">
              <CheckCircle2 className="w-4 h-4 text-teal-600" />
              <span>Tài khoản thử nghiệm sẵn có:</span>
            </div>
            <div className="flex justify-between bg-slate-100 p-2.5 rounded-xl font-mono text-xs font-semibold">
              <span>Admin: <strong>admin</strong> / <strong>admin123</strong></span>
              <span>KTV: <strong>nhanvien</strong> / <strong>admin123</strong></span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
