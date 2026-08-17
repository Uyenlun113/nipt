'use client';

import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmDeleteModal({
  isOpen,
  title = 'Xác Nhận Xóa Mẫu NIPT',
  message = 'Hành động này không thể hoàn tác. Mẫu xét nghiệm và các dữ liệu liên quan sẽ bị xóa vĩnh viễn.',
  sampleCode = '',
  onConfirm,
  onClose,
  loading = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={loading}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header with Warning Icon */}
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 shrink-0 shadow-xs">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {message}
            </p>
          </div>
        </div>

        {/* Sample Badge */}
        {sampleCode && (
          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-xl flex items-center justify-between text-xs">
            <span className="font-bold text-slate-600">Mã Mẫu / Barcode:</span>
            <span className="font-mono font-extrabold text-rose-900 bg-white px-2.5 py-1 rounded-lg border border-rose-200 shadow-xs">
              {sampleCode}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-all border border-slate-200"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-md shadow-rose-600/20 flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Đang xóa...' : 'Xác Nhận Xóa'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
