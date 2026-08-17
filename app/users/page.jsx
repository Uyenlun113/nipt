'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, Users, UserPlus, CheckCircle2, AlertCircle } from 'lucide-react';

export default function UsersPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    fullName: '',
    email: '',
    role: 'staff'
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('nipt_user');
    if (!storedUser) {
      router.push('/login');
    } else {
      try {
        const u = JSON.parse(storedUser);
        setUser(u);
        if (u.role !== 'admin') {
          router.push('/');
        }
      } catch (e) {
        router.push('/login');
      }
    }
  }, [router]);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (!newUser.username || !newUser.password || !newUser.fullName) {
      setMsg({ type: 'error', text: 'Vui lòng nhập Tên đăng nhập, Mật khẩu và Họ tên' });
      return;
    }

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Thất bại');

      setMsg({ type: 'success', text: 'Tạo tài khoản người dùng thành công!' });
      setNewUser({ username: '', password: '', fullName: '', email: '', role: 'staff' });
      fetchUsers();
    } catch (err) {
      setMsg({ type: 'error', text: err.message });
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar userRole={user?.role} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header user={user} onLogout={() => { localStorage.clear(); router.push('/login'); }} />

        <main className="flex-1 overflow-y-auto p-8 space-y-6">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
            <Link href="/" className="p-2.5 bg-white border border-slate-200 rounded-xl hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Link>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900">Quản Lý Người Dùng & Phân Quyền</h1>
              <p className="text-sm text-slate-500 font-medium">Tạo tài khoản kỹ thuật viên & quản trị viên hệ thống</p>
            </div>
          </div>

          {msg.text && (
            <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-3 border ${
              msg.type === 'success' ? 'bg-teal-50 border-teal-200 text-teal-900' : 'bg-rose-50 border-rose-200 text-rose-900'
            }`}>
              {msg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-teal-600" /> : <AlertCircle className="w-5 h-5 text-rose-600" />}
              <span>{msg.text}</span>
            </div>
          )}

          {/* Form Create User */}
          <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl">
            <h2 className="text-sm font-extrabold uppercase text-slate-900 flex items-center gap-2 border-b border-slate-200 pb-2">
              <UserPlus className="w-5 h-5 text-teal-600" />
              <span>Tạo Tài Khoản Người Dùng Mới</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tên đăng nhập *</label>
                <input
                  type="text"
                  value={newUser.username}
                  onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                  placeholder="nhanvien01"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mật khẩu *</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="******"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Họ và tên *</label>
                <input
                  type="text"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  placeholder="Nguyễn Văn A"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Email liên hệ</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="nv@genetrust.vn"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phân quyền</label>
                <select
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value })}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="staff">Nhân viên (Staff)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-teal-600/20"
                >
                  + Tạo Tài Khoản
                </button>
              </div>
            </div>
          </form>

          {/* User Table */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 max-w-4xl">
            <h2 className="text-sm font-extrabold uppercase text-slate-900 border-b border-slate-200 pb-2">
              Danh Sách Tài Khoản Hệ Thống ({users.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-xs font-extrabold border-b">
                    <th className="p-3">Tên đăng nhập</th>
                    <th className="p-3">Họ và tên</th>
                    <th className="p-3">Email</th>
                    <th className="p-3">Vai trò</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-slate-50">
                      <td className="p-3 font-mono font-bold text-slate-900">{u.username}</td>
                      <td className="p-3 font-semibold">{u.fullName}</td>
                      <td className="p-3 text-slate-500">{u.email || '-'}</td>
                      <td className="p-3">
                        <span className={`px-2.5 py-1 rounded text-xs font-extrabold ${
                          u.role === 'admin' ? 'bg-amber-100 text-amber-900 border border-amber-200' : 'bg-blue-100 text-blue-900 border border-blue-200'
                        }`}>
                          {u.role === 'admin' ? 'ADMIN' : 'STAFF'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
