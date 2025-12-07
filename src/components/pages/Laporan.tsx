import React, { useState } from 'react';
import { FileText, Download, Printer, FileSpreadsheet, FileImage, TrendingUp, Users, DollarSign, GraduationCap } from 'lucide-react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

type ActiveTab = 'laporan' | 'analitik' | 'ekspor';

export function Laporan() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('laporan');

  const tabs = [
    { id: 'laporan', label: 'Laporan', icon: FileText },
    { id: 'analitik', label: 'Analitik Kinerja', icon: TrendingUp },
    { id: 'ekspor', label: 'Ekspor Data', icon: Download },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Laporan & Analisa</h1>
        <p className="text-[#64748B] mt-1">Laporan komprehensif dan analisis data sekolah</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-[#E5E7EB]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-6 py-4 flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#E94640] text-[#E94640]'
                    : 'border-transparent text-[#64748B] hover:text-[#E94640]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'laporan' && <LaporanTab />}
          {activeTab === 'analitik' && <AnalitikTab />}
          {activeTab === 'ekspor' && <EksporTab />}
        </div>
      </div>
    </div>
  );
}

function LaporanTab() {
  const quickReports = [
    { id: 'absensi', label: 'Laporan Absensi', icon: Users, color: '#3B82F6' },
    { id: 'pembayaran', label: 'Laporan Pembayaran', icon: DollarSign, color: '#22C55E' },
    { id: 'pengeluaran', label: 'Laporan Pengeluaran', icon: TrendingUp, color: '#EF4444' },
    { id: 'rapor', label: 'Laporan Rapor', icon: GraduationCap, color: '#F59E0B' },
    { id: 'siswa', label: 'Laporan Data Siswa', icon: Users, color: '#8B5CF6' },
    { id: 'karyawan', label: 'Laporan Data Karyawan', icon: Users, color: '#EC4899' },
  ];

  return (
    <div className="space-y-6">
      <h3>Quick Reports</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickReports.map((report) => {
          const Icon = report.icon;
          return (
            <div
              key={report.id}
              className="card p-6 hover:shadow-lg transition-all text-left"
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ backgroundColor: `${report.color}20` }}
              >
                <Icon className="w-6 h-6" style={{ color: report.color }} />
              </div>
              <h4 className="text-[#0F172A] mb-2">{report.label}</h4>
              <div className="flex gap-2 mt-4">
                <button className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] transition-colors flex items-center justify-center gap-2">
                  <Download className="w-4 h-4" />
                  PDF
                </button>
                <button className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] transition-colors flex items-center justify-center gap-2">
                  <FileSpreadsheet className="w-4 h-4" />
                  Excel
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Report Builder */}
      <div className="card p-6 mt-6">
        <h3 className="mb-4">Custom Report Builder</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-2">Jenis Laporan</label>
            <select className="input-field">
              <option>Pilih Jenis Laporan</option>
              <option>Laporan Akademik</option>
              <option>Laporan Keuangan</option>
              <option>Laporan Kehadiran</option>
              <option>Laporan Siswa</option>
            </select>
          </div>
          <div>
            <label className="block mb-2">Periode Dari</label>
            <input type="date" className="input-field" />
          </div>
          <div>
            <label className="block mb-2">Periode Sampai</label>
            <input type="date" className="input-field" />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button className="btn-gradient px-6 py-2.5 rounded-lg flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Generate Laporan
          </button>
          <button className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] transition-colors flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Print
          </button>
        </div>
      </div>
    </div>
  );
}

function AnalitikTab() {
  const performanceData = [
    { bulan: 'Jul', kehadiran: 92, pembayaran: 85, akademik: 88 },
    { bulan: 'Agu', kehadiran: 94, pembayaran: 88, akademik: 90 },
    { bulan: 'Sep', kehadiran: 93, pembayaran: 90, akademik: 89 },
    { bulan: 'Okt', kehadiran: 95, pembayaran: 92, akademik: 91 },
    { bulan: 'Nov', kehadiran: 94, pembayaran: 95, akademik: 92 },
    { bulan: 'Des', kehadiran: 95, pembayaran: 80, akademik: 93 },
  ];

  const distributionData = [
    { name: 'Kelas A', value: 12, color: '#E94640' },
    { name: 'Kelas B', value: 13, color: '#3B82F6' },
  ];

  return (
    <div className="space-y-6">
      <h3>Analitik Kinerja Sekolah</h3>

      {/* Performance Chart */}
      <div className="card p-6">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-1 h-8 brand-gradient rounded-full" />
            <h3>Tren Kinerja 6 Bulan Terakhir</h3>
          </div>
          <p className="text-[#64748B]">Persentase kehadiran, pembayaran, dan nilai akademik</p>
        </div>

        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="bulan" tick={{ fill: '#64748B' }} />
            <YAxis tick={{ fill: '#64748B' }} domain={[0, 100]} />
            <Tooltip formatter={(value: number) => `${value}%`} />
            <Legend />
            <Line
              type="monotone"
              dataKey="kehadiran"
              stroke="#3B82F6"
              strokeWidth={3}
              name="Kehadiran"
              dot={{ fill: '#3B82F6', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="pembayaran"
              stroke="#22C55E"
              strokeWidth={3}
              name="Pembayaran"
              dot={{ fill: '#22C55E', r: 4 }}
            />
            <Line
              type="monotone"
              dataKey="akademik"
              stroke="#F59E0B"
              strokeWidth={3}
              name="Akademik"
              dot={{ fill: '#F59E0B', r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Distribusi Siswa per Kelas</h3>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="card p-6">
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-1 h-8 brand-gradient rounded-full" />
              <h3>Insight Kinerja</h3>
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-4 bg-[#DCFCE7] border border-[#22C55E] rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#22C55E] rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-[#0F172A]">Peningkatan Kehadiran</h4>
                  <p className="text-[#166534] mt-1">
                    Tingkat kehadiran siswa meningkat 5% dibanding bulan lalu
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FEF3C7] border border-[#F59E0B] rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#F59E0B] rounded-lg flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-[#0F172A]">Perhatian Pembayaran</h4>
                  <p className="text-[#92400E] mt-1">
                    Ada 5 siswa dengan tunggakan lebih dari 2 bulan
                  </p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#DBEAFE] border border-[#3B82F6] rounded-lg">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 bg-[#3B82F6] rounded-lg flex items-center justify-center flex-shrink-0">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="text-[#0F172A]">Prestasi Akademik</h4>
                  <p className="text-[#1E40AF] mt-1">
                    Rata-rata nilai akademik meningkat menjadi 93%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EksporTab() {
  const eksporModules = [
    { id: 'siswa', label: 'Data Siswa', desc: 'Ekspor data lengkap siswa' },
    { id: 'karyawan', label: 'Data Karyawan', desc: 'Ekspor data lengkap karyawan' },
    { id: 'penilaian', label: 'Data Penilaian', desc: 'Ekspor nilai siswa' },
    { id: 'presensi', label: 'Data Presensi', desc: 'Ekspor data kehadiran' },
    { id: 'keuangan', label: 'Data Keuangan', desc: 'Ekspor transaksi keuangan' },
    { id: 'pengguna', label: 'Data Pengguna', desc: 'Ekspor daftar pengguna sistem' },
  ];

  return (
    <div className="space-y-6">
      <h3>Ekspor Data</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eksporModules.map((module) => (
          <div key={module.id} className="card p-6">
            <h4 className="text-[#0F172A] mb-2">{module.label}</h4>
            <p className="text-[#64748B] mb-4">{module.desc}</p>
            <div className="flex gap-2">
              <button className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] transition-colors flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                CSV
              </button>
              <button className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] transition-colors flex items-center justify-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                XLSX
              </button>
              <button className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] transition-colors flex items-center justify-center gap-2">
                <FileText className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Template Exports */}
      <div className="card p-6">
        <h3 className="mb-4">Template Ekspor</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-6 border border-[#E5E7EB] rounded-xl hover:border-[#E94640] hover:bg-[#E94640]/5 transition-colors text-left">
            <FileImage className="w-8 h-8 text-[#E94640] mb-3" />
            <h4 className="text-[#0F172A]">Print Layout Rapor</h4>
            <p className="text-[#64748B] mt-2">Template cetak rapor siswa</p>
          </button>

          <button className="p-6 border border-[#E5E7EB] rounded-xl hover:border-[#E94640] hover:bg-[#E94640]/5 transition-colors text-left">
            <FileText className="w-8 h-8 text-[#E94640] mb-3" />
            <h4 className="text-[#0F172A]">Template Ijazah</h4>
            <p className="text-[#64748B] mt-2">Template ijazah kelulusan</p>
          </button>

          <button className="p-6 border border-[#E5E7EB] rounded-xl hover:border-[#E94640] hover:bg-[#E94640]/5 transition-colors text-left">
            <FileText className="w-8 h-8 text-[#E94640] mb-3" />
            <h4 className="text-[#0F172A]">Template Surat Resmi</h4>
            <p className="text-[#64748B] mt-2">Template surat keterangan</p>
          </button>
        </div>
      </div>
    </div>
  );
}