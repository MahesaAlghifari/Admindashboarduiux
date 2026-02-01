import { useState, useEffect } from "react";
import {
  UsersIcon,
  BanknotesIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  CheckCircleIcon,
  BellAlertIcon,
  ArrowRightIcon,
  PlusIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY DASHBOARD ---
const STATS = [
  { title: "Total Siswa Aktif", value: "854", sub: "+12 bulan ini", icon: AcademicCapIcon, color: "text-blue-600", bg: "bg-blue-50" },
  { title: "Guru & Staff", value: "62", sub: "58 Aktif, 4 Cuti", icon: UsersIcon, color: "text-purple-600", bg: "bg-purple-50" },
  { title: "Saldo Kas Sekolah", value: "Rp 230.5Jt", sub: "+5.2% vs bulan lalu", icon: BanknotesIcon, color: "text-emerald-600", bg: "bg-emerald-50" },
  { title: "Kehadiran Hari Ini", value: "96.5%", sub: "32 Siswa Izin/Sakit", icon: CheckCircleIcon, color: "text-rose-600", bg: "bg-rose-50" },
];

const RECENT_TRANSACTIONS = [
  { id: "TRX-901", name: "Budi Santoso", class: "X-IPA 1", type: "SPP Maret", amount: "Rp 350.000", date: "Hari ini, 09:30" },
  { id: "TRX-902", name: "Siti Aminah", class: "XI-IPS 2", type: "Uang Gedung", amount: "Rp 1.500.000", date: "Hari ini, 08:15" },
  { id: "TRX-903", name: "Rizky Billar", class: "XII-IPA 3", type: "Seragam", amount: "Rp 450.000", date: "Kemarin" },
  { id: "TRX-904", name: "Dewi Persik", class: "X-IPS 1", type: "SPP Maret", amount: "Rp 350.000", date: "Kemarin" },
];

const UPCOMING_EVENTS = [
  { title: "Ujian Tengah Semester (UTS)", date: "10 Mar 2026", type: "Akademik", color: "bg-blue-500" },
  { title: "Rapat Wali Murid", date: "15 Mar 2026", type: "Pertemuan", color: "bg-amber-500" },
  { title: "Libur Awal Puasa", date: "22 Mar 2026", type: "Libur", color: "bg-rose-500" },
];

const FINANCE_CHART_DATA = [
  { label: "Agu", in: 60, out: 40 },
  { label: "Sep", in: 75, out: 45 },
  { label: "Okt", in: 65, out: 55 },
  { label: "Nov", in: 85, out: 40 },
  { label: "Des", in: 95, out: 80 }, // Pengeluaran tinggi di akhir tahun
  { label: "Jan", in: 70, out: 35 },
];

export default function DashboardPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const session = localStorage.getItem("user_session");
    if (session) {
      try {
        setUser(JSON.parse(session));
      } catch (e) {
        console.error("Error", e);
      }
    }
  }, []);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* --- 1. WELCOME SECTION --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Selamat Datang, {user?.pribadi?.nama_lengkap || "Admin"}! 👋
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Berikut adalah ringkasan aktivitas sekolah hari ini, <span className="font-semibold text-slate-700">Senin, 2 Februari 2026</span>.
          </p>
        </div>

      </div>

      {/* --- 2. KPI CARDS (Stats Utama) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {STATS.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow group">
              <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-lg ${stat.bg} ${stat.color} group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6" />
                </div>
                {stat.sub.includes("+") ? (
                    <span className="flex items-center text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                        <ArrowTrendingUpIcon className="w-3 h-3 mr-1" /> Naik
                    </span>
                ) : (
                    <span className="flex items-center text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-full">
                        Update
                    </span>
                )}
              </div>
              <h3 className="text-2xl font-bold text-slate-800">{stat.value}</h3>
              <p className="text-sm text-slate-500 font-medium mt-1">{stat.title}</p>
              <p className="text-xs text-slate-400 mt-2 border-t border-slate-50 pt-2">{stat.sub}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- 3. FINANCIAL OVERVIEW CHART (Left - Wide) --- */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-slate-800 text-lg">Statistik Keuangan</h3>
                    <p className="text-xs text-slate-500">Pemasukan vs Pengeluaran (6 Bulan Terakhir)</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-3 h-3 bg-emerald-500 rounded-sm"></div> Pemasukan
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-600">
                        <div className="w-3 h-3 bg-rose-500 rounded-sm"></div> Pengeluaran
                    </div>
                </div>
            </div>

            {/* Custom CSS Chart */}
            <div className="h-64 flex items-end justify-between gap-4 px-2">
                {FINANCE_CHART_DATA.map((item, index) => (
                    <div key={index} className="flex flex-col items-center gap-2 flex-1 h-full justify-end group cursor-pointer">
                        <div className="relative w-full flex justify-center gap-1 h-full items-end">
                            {/* Bar Income */}
                            <div 
                                style={{ height: `${item.in}%` }} 
                                className="w-3 md:w-6 bg-emerald-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-500 relative group/bar"
                            >
                                {/* Tooltip */}
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    In: {item.in}%
                                </div>
                            </div>
                            {/* Bar Expense */}
                            <div 
                                style={{ height: `${item.out}%` }} 
                                className="w-3 md:w-6 bg-rose-500 rounded-t-md opacity-80 group-hover:opacity-100 transition-all duration-500 relative group/bar"
                            >
                                 <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    Out: {item.out}%
                                </div>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400 group-hover:text-slate-700 transition-colors">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>

        {/* --- 4. UPCOMING EVENTS (Right - Narrow) --- */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
            <h3 className="font-bold text-slate-800 text-lg mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-slate-500"/>
                Agenda Mendatang
            </h3>
            
            <div className="space-y-4 flex-1">
                {UPCOMING_EVENTS.map((event, idx) => (
                    <div key={idx} className="flex gap-4 items-start group cursor-pointer">
                        <div className="flex flex-col items-center justify-center bg-slate-100 rounded-lg w-12 h-12 shrink-0 border border-slate-200 group-hover:border-[#e94640] transition-colors">
                            <span className="text-[10px] text-slate-500 font-bold uppercase">{event.date.split(' ')[1]}</span>
                            <span className="text-lg font-bold text-slate-800">{event.date.split(' ')[0]}</span>
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#e94640] transition-colors line-clamp-1">{event.title}</h4>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`w-2 h-2 rounded-full ${event.color}`}></span>
                                <span className="text-xs text-slate-500">{event.type}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <button className="mt-6 w-full py-2 text-xs font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-lg border border-dashed border-slate-300 transition-all">
                Lihat Kalender Lengkap
            </button>
        </div>
      </div>

      {/* --- 5. RECENT TRANSACTIONS TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <ClockIcon className="w-5 h-5 text-slate-500"/>
                Transaksi Pembayaran Terakhir
             </h3>
             <button className="text-xs font-bold text-[#e94640] flex items-center gap-1 hover:underline">
                Lihat Semua <ArrowRightIcon className="w-3 h-3" />
             </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                    <tr>
                        <th className="px-6 py-3 bg-white">ID Transaksi</th>
                        <th className="px-6 py-3 bg-white">Siswa</th>
                        <th className="px-6 py-3 bg-white">Jenis Pembayaran</th>
                        <th className="px-6 py-3 bg-white">Jumlah</th>
                        <th className="px-6 py-3 bg-white">Waktu</th>
                        <th className="px-6 py-3 bg-white text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {RECENT_TRANSACTIONS.map((trx, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 font-mono text-slate-500 text-xs">{trx.id}</td>
                            <td className="px-6 py-4">
                                <p className="font-bold text-slate-700">{trx.name}</p>
                                <p className="text-[10px] text-slate-400">{trx.class}</p>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{trx.type}</td>
                            <td className="px-6 py-4 font-bold text-emerald-600">{trx.amount}</td>
                            <td className="px-6 py-4 text-xs text-slate-500">{trx.date}</td>
                            <td className="px-6 py-4 text-center">
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase">
                                    Lunas
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
      </div>

    </div>
  );
}