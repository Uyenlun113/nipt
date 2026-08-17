'use client';

import React from 'react';
import { X, FileText, CheckCircle, Dna, FolderCheck } from 'lucide-react';

export default function TemplateLibraryModal({ isOpen, onClose }) {
  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 border border-purple-400/30 flex items-center justify-center">
              <FolderCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base">Thư Viện Phôi Kết Quả GeneTrust</h2>
              <p className="text-xs text-slate-300">Danh sách các file phôi PDF chuẩn y khoa được lưu trữ tại `Phôi kết quả`</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {phoiTemplates.map((t, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl hover:border-purple-300 hover:bg-purple-50/30 transition-all flex items-start gap-3">
                <FileText className="w-6 h-6 text-purple-600 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 truncate">{t.name}</span>
                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-semibold">{t.package}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{t.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-xs font-semibold hover:bg-slate-900">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
