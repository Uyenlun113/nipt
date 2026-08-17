'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import Link from 'next/link';
import { ArrowLeft, FileText, FolderCheck, CheckCircle2 } from 'lucide-react';

export default function TemplatesPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('nipt_user');
    if (!storedUser) {
      router.push('/login');
    } else {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        router.push('/login');
      }
    }
  }, [router]);

  const phoiTemplates = [
    { name: 'KQ_NIPT_GENET Eco.pdf', package: 'GeneT Eco', desc: 'Phôi kết quả Gói GeneT Eco (Sàng lọc T21, T18, T13)' },
    { name: 'KQ_NIPT_GENET 7.pdf', package: 'GeneT 7', desc: 'Phôi kết quả Gói GeneT 7 (T21, T18, T13 + NST Giới tính)' },
    { name: 'KQ_NIPT_GENET 23.pdf', package: 'GeneT 23', desc: 'Phôi kết quả Gói GeneT 23 (Khảo sát toàn bộ 23 cặp NST)' },
    { name: 'KQ_NIPT_GENET Plus k mở rộng.pdf', package: 'GeneT Plus', desc: 'Phôi kết quả Gói GeneT Plus (Toàn bộ NST + 86 hội chứng vi mất đoạn)' },
    { name: 'KQ_NIPT_GENET Twins.pdf', package: 'GeneT Twins', desc: 'Phôi kết quả Gói GeneT Twins (Dành riêng cho Thai đôi / Song thai)' },
    { name: 'KQ_NIPT_GENNI 4.pdf', package: 'GENNI 4', desc: 'Phôi kết quả Gói GENNI 4' },
    { name: 'Kết quả phụ.pdf', package: 'Phụ lục / Gen lặn', desc: 'Phôi kết quả phụ kèm theo' },
  ];

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
              <h1 className="text-2xl font-extrabold text-slate-900">Thư Viện Phôi Kết Quả GeneTrust</h1>
              <p className="text-sm text-slate-500 font-medium">Danh sách các file phôi PDF chuẩn y khoa tại thư mục `Phôi kết quả`</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-5xl">
            {phoiTemplates.map((t, idx) => (
              <div key={idx} className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:border-teal-300 transition-all flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
                  <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-extrabold text-slate-900 truncate">{t.name}</span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-900 rounded-lg text-xs font-bold border border-purple-200">
                      {t.package}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 font-medium mt-1">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
