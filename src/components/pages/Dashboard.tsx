import React from 'react';
import { Users, GraduationCap, CheckCircle, DollarSign, Bell, TrendingUp, TrendingDown } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { dashboardStats, absensiHeatmap, keuanganBulanan, siswaMenunggak, notifikasi } from '../../data/dummyData';

export function Dashboard() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1>Dashboard</h1>
        <p className="text-[#64748B] mt-1">Selamat datang di Sistem Admin PAUD Yayasan Suci Sutjipto</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#64748B]">Total Siswa</p>
              <h2 className="mt-2">{dashboardStats.totalSiswa}</h2>
              <p className="text-[#22C55E] mt-2 flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                +2 dari bulan lalu
              </p>
            </div>
            <div className="w-14 h-14 brand-gradient rounded-2xl flex items-center justify-center">
              <GraduationCap className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#64748B]">Total Karyawan</p>
              <h2 className="mt-2">{dashboardStats.totalKaryawan}</h2>
              <p className="text-[#64748B] mt-2">Karyawan aktif</p>
            </div>
            <div className="w-14 h-14 bg-[#3B82F6] rounded-2xl flex items-center justify-center">
              <Users className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#64748B]">Kehadiran Siswa</p>
              <h2 className="mt-2">{dashboardStats.persentaseKehadiran}%</h2>
              <p className="text-[#22C55E] mt-2">Persentase bulan ini</p>
            </div>
            <div className="w-14 h-14 bg-[#22C55E] rounded-2xl flex items-center justify-center">
              <CheckCircle className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#64748B]">Pembayaran Lunas</p>
              <h2 className="mt-2">{dashboardStats.statusPembayaran.lunas}/{dashboardStats.totalSiswa}</h2>
              <p className="text-[#EF4444] mt-2">{dashboardStats.statusPembayaran.belumLunas} belum lunas</p>
            </div>
            <div className="w-14 h-14 bg-[#F59E0B] rounded-2xl flex items-center justify-center">
              <DollarSign className="w-7 h-7 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Absensi Heatmap */}
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Heatmap Absensi Siswa</h3>
            </div>
            <p className="text-[#64748B]">Kehadiran per kelas minggu ini</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={absensiHeatmap}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="tanggal" tick={{ fill: '#64748B' }} />
              <YAxis tick={{ fill: '#64748B' }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="kelasA" fill="#E94640" name="Kelas A" radius={[8, 8, 0, 0]} />
              <Bar dataKey="kelasB" fill="#3B82F6" name="Kelas B" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Grafik Keuangan */}
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Grafik Keuangan</h3>
            </div>
            <p className="text-[#64748B]">Pemasukan vs Pengeluaran per bulan</p>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={keuanganBulanan}>
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
                dot={{ fill: '#22C55E', r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="pengeluaran"
                stroke="#EF4444"
                strokeWidth={3}
                name="Pengeluaran"
                dot={{ fill: '#EF4444', r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Siswa Menunggak */}
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Siswa Menunggak</h3>
            </div>
            <p className="text-[#64748B]">Daftar siswa dengan tunggakan pembayaran</p>
          </div>

          <div className="space-y-3">
            {siswaMenunggak.map((siswa, index) => (
              <div
                key={index}
                className="p-4 border border-[#E5E7EB] rounded-xl hover:border-[#E94640] transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-[#0F172A]">{siswa.nama}</h4>
                    <p className="text-[#64748B]">{siswa.kelas}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#EF4444]">
                      Rp {siswa.nominal.toLocaleString('id-ID')}
                    </p>
                    <p className="text-[#64748B]">{siswa.bulanTunggakan} bulan</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Notifikasi */}
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Notifikasi Terbaru</h3>
            </div>
            <p className="text-[#64748B]">Aktivitas dan pembaruan sistem</p>
          </div>

          <div className="space-y-3">
            {notifikasi.map((notif) => (
              <div
                key={notif.id}
                className={`p-4 border rounded-xl transition-colors ${
                  notif.dibaca
                    ? 'border-[#E5E7EB] bg-white'
                    : 'border-[#E94640] bg-[#E94640]/5'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    notif.tipe === 'nilai' ? 'bg-[#22C55E]/10' :
                    notif.tipe === 'presensi' ? 'bg-[#F59E0B]/10' :
                    notif.tipe === 'pengumuman' ? 'bg-[#3B82F6]/10' :
                    notif.tipe === 'backup' ? 'bg-[#64748B]/10' :
                    'bg-[#E94640]/10'
                  }`}>
                    <Bell className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[#0F172A]">{notif.pesan}</p>
                    <p className="text-[#64748B] mt-1">{notif.waktu}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
