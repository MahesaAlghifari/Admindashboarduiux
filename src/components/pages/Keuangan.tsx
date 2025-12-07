import React, { useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Wallet, CreditCard, FileText, PieChart } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function Keuangan() {
  const [activeModule, setActiveModule] = useState<string>('overview');

  const modules = [
    { id: 'tuition', label: 'Tuition Fee Management', icon: DollarSign },
    { id: 'payment', label: 'Payment History', icon: CreditCard },
    { id: 'expense', label: 'Expense Tracking', icon: TrendingDown },
    { id: 'budgeting', label: 'Budgeting', icon: PieChart },
    { id: 'payroll', label: 'Payroll', icon: Wallet },
    { id: 'petty-cash', label: 'Petty Cash', icon: Wallet },
    { id: 'reports', label: 'Financial Reports', icon: FileText },
    { id: 'grants', label: 'Grant & Sponsorship', icon: TrendingUp },
  ];

  const keuanganData = [
    { bulan: 'Jul', pemasukan: 45000000, pengeluaran: 28000000 },
    { bulan: 'Agu', pemasukan: 47000000, pengeluaran: 30000000 },
    { bulan: 'Sep', pemasukan: 46000000, pengeluaran: 29000000 },
    { bulan: 'Okt', pemasukan: 48000000, pengeluaran: 31000000 },
    { bulan: 'Nov', pemasukan: 47000000, pengeluaran: 30000000 },
    { bulan: 'Des', pemasukan: 45000000, pengeluaran: 28000000 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Manajemen Keuangan</h1>
        <p className="text-[#64748B] mt-1">Kelola keuangan sekolah secara komprehensif</p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[#64748B]">Total Pemasukan</p>
              <h2 className="mt-2">Rp 278M</h2>
              <p className="text-[#22C55E] mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +8.5% dari bulan lalu
              </p>
            </div>
            <div className="w-14 h-14 bg-[#22C55E] rounded-2xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[#64748B]">Total Pengeluaran</p>
              <h2 className="mt-2">Rp 176M</h2>
              <p className="text-[#EF4444] mt-2 flex items-center gap-1">
                <TrendingDown className="w-4 h-4" />
                +3.2% dari bulan lalu
              </p>
            </div>
            <div className="w-14 h-14 bg-[#EF4444] rounded-2xl flex items-center justify-center">
              <TrendingDown className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[#64748B]">Saldo Kas</p>
              <h2 className="mt-2">Rp 102M</h2>
              <p className="text-[#64748B] mt-2">Saldo saat ini</p>
            </div>
            <div className="w-14 h-14 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
              <Wallet className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-[#64748B]">Tunggakan</p>
              <h2 className="mt-2">Rp 6.75M</h2>
              <p className="text-[#F59E0B] mt-2">5 siswa menunggak</p>
            </div>
            <div className="w-14 h-14 bg-[#F59E0B] rounded-2xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div>
        <h3 className="mb-4">Modul Keuangan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {modules.map((module) => {
            const Icon = module.icon;
            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module.id)}
                className="card p-6 hover:shadow-lg transition-all hover:scale-105 text-left"
              >
                <div className="w-12 h-12 brand-gradient rounded-xl flex items-center justify-center mb-4">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-[#0F172A]">{module.label}</h4>
              </button>
            );
          })}
        </div>
      </div>

      {/* Chart Section */}
      <div className="card p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 brand-gradient rounded-full" />
            <h3>Laporan Keuangan 6 Bulan Terakhir</h3>
          </div>
          <p className="text-[#64748B]">Grafik pemasukan dan pengeluaran</p>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={keuanganData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="bulan" tick={{ fill: '#64748B' }} />
            <YAxis tick={{ fill: '#64748B' }} />
            <Tooltip formatter={(value: number) => `Rp ${value.toLocaleString('id-ID')}`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="pemasukan"
              stroke="#22C55E"
              strokeWidth={3}
              name="Pemasukan"
              dot={{ fill: '#22C55E', r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="pengeluaran"
              stroke="#EF4444"
              strokeWidth={3}
              name="Pengeluaran"
              dot={{ fill: '#EF4444', r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Transaksi Pemasukan Terbaru</h3>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { nama: 'Aisyah Zahra Putri', jumlah: 750000, tanggal: '2024-12-05', keterangan: 'SPP Desember' },
              { nama: 'Farhan Ahmad Hakim', jumlah: 750000, tanggal: '2024-12-04', keterangan: 'SPP Desember' },
              { nama: 'Naura Kamila Azzahra', jumlah: 750000, tanggal: '2024-12-03', keterangan: 'SPP Desember' },
            ].map((transaksi, index) => (
              <div key={index} className="p-4 border border-[#E5E7EB] rounded-xl hover:border-[#22C55E] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[#0F172A]">{transaksi.nama}</h4>
                    <p className="text-[#64748B]">{transaksi.keterangan}</p>
                    <p className="text-[#64748B]">{transaksi.tanggal}</p>
                  </div>
                  <p className="text-[#22C55E]">
                    +Rp {transaksi.jumlah.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Transaksi Pengeluaran Terbaru</h3>
            </div>
          </div>
          <div className="space-y-3">
            {[
              { keterangan: 'Gaji Karyawan November', jumlah: 40500000, tanggal: '2024-12-01', kategori: 'Payroll' },
              { keterangan: 'Pembelian Alat Tulis', jumlah: 2500000, tanggal: '2024-11-28', kategori: 'Operasional' },
              { keterangan: 'Listrik & Air November', jumlah: 3200000, tanggal: '2024-11-25', kategori: 'Utilitas' },
            ].map((transaksi, index) => (
              <div key={index} className="p-4 border border-[#E5E7EB] rounded-xl hover:border-[#EF4444] transition-colors">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-[#0F172A]">{transaksi.keterangan}</h4>
                    <p className="text-[#64748B]">{transaksi.kategori}</p>
                    <p className="text-[#64748B]">{transaksi.tanggal}</p>
                  </div>
                  <p className="text-[#EF4444]">
                    -Rp {transaksi.jumlah.toLocaleString('id-ID')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
