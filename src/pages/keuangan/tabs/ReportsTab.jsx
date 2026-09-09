import { useState } from "react";
import {
  ArrowDownTrayIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ScaleIcon,
  BanknotesIcon,
  PresentationChartLineIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  
} from "@heroicons/react/24/outline";

// --- DATA DUMMY GRAFIK (Bulanan) ---
const MONTHLY_STATS = [
  { month: "Jul", income: 45, expense: 30 },
  { month: "Agu", income: 50, expense: 35 },
  { month: "Sep", income: 48, expense: 40 },
  { month: "Okt", income: 52, expense: 28 },
  { month: "Nov", income: 49, expense: 45 },
  { month: "Des", income: 60, expense: 50 }, // Akhir Semester
];

// --- DATA DUMMY HIBAH (GRANTS) ---
const DUMMY_GRANTS = [
  { id: "GR-001", name: "BOS Reguler Tahap 1", provider: "Kemendikbud", total: 150000000, used: 120000000, date: "2026-01-15", status: "active" },
  { id: "GR-002", name: "Sponsor Lapangan Futsal", provider: "PT. Olahraga Jaya", total: 50000000, used: 50000000, date: "2025-11-20", status: "completed" },
  { id: "GR-003", name: "Hibah Buku Perpustakaan", provider: "Yayasan Membaca", total: 25000000, used: 5000000, date: "2026-02-01", status: "active" },
];

export default function ReportsTab() {
  const [year, setYear] = useState("2025/2026");

  // --- FORMATTER ---
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  const formatPercent = (used, total) => Math.round((used / total) * 100);

  return (
    <div className="space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Laporan & Analisis Keuangan</h2>
          <p className="text-sm text-slate-500">Ringkasan kinerja keuangan dan monitoring dana hibah sekolah.</p>
        </div>
        <select 
            value={year} 
            onChange={(e) => setYear(e.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg focus:outline-none focus:border-[#e94640]"
        >
            <option value="2025/2026">TA 2025/2026</option>
            <option value="2024/2025">TA 2024/2025</option>
        </select>
      </div>

      {/* --- TOP STATS --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard title="Total Pendapatan (YTD)" value="Rp 850.000.000" icon={ArrowTrendingUpIcon} color="text-emerald-600" bg="bg-emerald-50" />
          <StatCard title="Total Pengeluaran (YTD)" value="Rp 620.000.000" icon={ArrowTrendingDownIcon} color="text-rose-600" bg="bg-rose-50" />
          <StatCard title="Surplus / Defisit" value="+ Rp 230.000.000" icon={ScaleIcon} color="text-blue-600" bg="bg-blue-50" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* --- LEFT: CHART SECTION (CSS ONLY) --- */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex justify-between items-center mb-6">
                 <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    <PresentationChartLineIcon className="w-5 h-5 text-slate-500"/>
                    Arus Kas Semester Ini
                 </h3>
                 <div className="flex gap-4 text-xs">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Masuk</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Keluar</div>
                 </div>
             </div>
             
             {/* Chart Container */}
             <div className="flex items-end justify-between h-48 gap-2 md:gap-4 px-2">
                {MONTHLY_STATS.map((data, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="relative w-full flex justify-center gap-1 h-full items-end">
                            {/* Bar Income */}
                            <div 
                                style={{ height: `${data.income}%` }} 
                                className="w-3 md:w-6 bg-emerald-500 rounded-t-sm transition-all duration-500 hover:bg-emerald-600 relative group-hover:opacity-100"
                            ></div>
                            {/* Bar Expense */}
                            <div 
                                style={{ height: `${data.expense}%` }} 
                                className="w-3 md:w-6 bg-rose-500 rounded-t-sm transition-all duration-500 hover:bg-rose-600"
                            ></div>
                        </div>
                        <span className="text-xs font-bold text-slate-500">{data.month}</span>
                    </div>
                ))}
             </div>
          </div>

          {/* --- RIGHT: DOWNLOAD CENTER --- */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
             <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                <DocumentTextIcon className="w-5 h-5 text-slate-500"/>
                Pusat Laporan
             </h3>
             <div className="space-y-3">
                <DownloadItem label="Neraca Keuangan (Balance Sheet)" desc="Posisi Aset & Kewajiban" />
                <DownloadItem label="Laporan Arus Kas (Cash Flow)" desc="Detail Inflow & Outflow" />
                <DownloadItem label="Laporan Laba Rugi" desc="Performa Operasional" />
                <DownloadItem label="Rekapitulasi Pajak (PPh 21)" desc="Potongan Pajak Karyawan" />
             </div>
          </div>
      </div>

      {/* --- GRANT MANAGEMENT SECTION (HIBAH) --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
             <div>
                <h3 className="font-bold text-slate-800 flex items-center gap-2">
                    Dana Hibah & Sponsorship
                </h3>
                <p className="text-xs text-slate-500">Monitoring penggunaan dana dari pihak ketiga/pemerintah.</p>
             </div>
             <button className="text-xs font-bold text-[#e94640] hover:underline">
                + Tambah Hibah Baru
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-white text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3">Nama Program</th>
                        <th className="px-6 py-3">Pemberi Dana</th>
                        <th className="px-6 py-3">Total Dana</th>
                        <th className="px-6 py-3">Realisasi</th>
                        <th className="px-6 py-3">Progress</th>
                        <th className="px-6 py-3 text-center">Status</th>
                        <th className="px-6 py-3 text-right">Laporan</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {DUMMY_GRANTS.map((grant) => {
                        const percent = formatPercent(grant.used, grant.total);
                        return (
                            <tr key={grant.id} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-bold text-slate-700">
                                    {grant.name}
                                    <div className="text-[10px] text-slate-400 font-mono font-normal">{grant.id}</div>
                                </td>
                                <td className="px-6 py-4 text-slate-600">{grant.provider}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{formatIDR(grant.total)}</td>
                                <td className="px-6 py-4 font-medium text-slate-600">{formatIDR(grant.used)}</td>
                                <td className="px-6 py-4 w-32">
                                    <div className="flex items-center gap-2">
                                        <div className="w-full bg-slate-100 rounded-full h-1.5">
                                            <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${percent}%` }}></div>
                                        </div>
                                        <span className="text-[10px] font-bold text-slate-500">{percent}%</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${grant.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                        {grant.status === 'active' ? 'Aktif' : 'Selesai'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-blue-600 hover:underline text-xs font-bold flex items-center gap-1 justify-end">
                                        <DocumentTextIcon className="w-3 h-3" /> Detail
                                    </button>
                                </td>
                            </tr>
                        )
                    })}
                </tbody>
            </table>
          </div>
      </div>

    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ title, value, icon: Icon, color, bg }) {
    return (
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex items-start justify-between">
            <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">{title}</p>
                <h3 className={`text-2xl font-bold mt-1 ${color.replace('text-', 'text-slate-800')}`}>{value}</h3>
            </div>
            <div className={`p-2 rounded-lg ${bg} ${color}`}>
                <Icon className="w-6 h-6" />
            </div>
        </div>
    )
}

function DownloadItem({ label, desc }) {
    return (
        <button className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-[#e94640] hover:shadow-sm transition-all group">
            <div className="text-left">
                <p className="text-sm font-bold text-slate-700 group-hover:text-[#e94640] transition-colors">{label}</p>
                <p className="text-xs text-slate-400">{desc}</p>
            </div>
            <ArrowDownTrayIcon className="w-4 h-4 text-slate-300 group-hover:text-[#e94640]" />
        </button>
    )
}