'use client';

import React, { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function SampleDetailDispatcherPage() {
  const router = useRouter();
  const params = useParams();
  const sampleId = params.id;

  useEffect(() => {
    if (sampleId) {
      fetch(`/api/samples/${sampleId}`)
        .then(r => r.json())
        .then(data => {
          const pkg = (data.packageType || '').toLowerCase();
          if (pkg.includes('7')) {
            router.replace(`/samples/genet7/${sampleId}`);
          } else if (pkg.includes('23')) {
            router.replace(`/samples/genet23/${sampleId}`);
          } else if (pkg.includes('plus')) {
            router.replace(`/samples/plus/${sampleId}`);
          } else if (pkg.includes('twin')) {
            router.replace(`/samples/twins/${sampleId}`);
          } else if (pkg.includes('4') || pkg.includes('genni')) {
            router.replace(`/samples/genet4/${sampleId}`);
          } else {
            router.replace(`/samples/eco/${sampleId}`);
          }
        })
        .catch(err => {
          console.error(err);
          router.replace(`/samples/eco/${sampleId}`);
        });
    }
  }, [sampleId, router]);

  return (
    <div className="flex h-screen bg-slate-50 items-center justify-center font-sans">
      <div className="text-center font-bold text-slate-700 text-sm">
        <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
        Đang chuyển hướng đến trang chuyên biệt của gói NIPT...
      </div>
    </div>
  );
}
