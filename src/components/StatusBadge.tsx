import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'payment' | 'penilaian';
}

export function StatusBadge({ status, type = 'status' }: StatusBadgeProps) {
  const getStatusColor = () => {
    const statusLower = status.toLowerCase();

    if (type === 'penilaian') {
      if (statusLower === 'final') return 'bg-[#22C55E]/10 text-[#22C55E]';
      if (statusLower === 'revisi') return 'bg-[#F59E0B]/10 text-[#F59E0B]';
      if (statusLower === 'draft') return 'bg-[#64748B]/10 text-[#64748B]';
    }

    if (statusLower === 'aktif' || statusLower === 'lunas' || statusLower === 'hadir') {
      return 'bg-[#22C55E]/10 text-[#22C55E]';
    }
    if (statusLower === 'nonaktif' || statusLower === 'belum lunas' || statusLower === 'alfa') {
      return 'bg-[#EF4444]/10 text-[#EF4444]';
    }
    if (statusLower === 'pindahan' || statusLower === 'tertunda' || statusLower === 'sakit') {
      return 'bg-[#F59E0B]/10 text-[#F59E0B]';
    }
    if (statusLower === 'alumni' || statusLower === 'izin') {
      return 'bg-[#3B82F6]/10 text-[#3B82F6]';
    }
    if (statusLower === 'mengundurkan diri') {
      return 'bg-[#64748B]/10 text-[#64748B]';
    }

    return 'bg-[#64748B]/10 text-[#64748B]';
  };

  return (
    <span className={`px-3 py-1 rounded-full ${getStatusColor()}`}>
      {status}
    </span>
  );
}
