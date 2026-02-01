import { useState } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  PlusIcon,
  BanknotesIcon,
  EllipsisHorizontalIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon,
  PaperAirplaneIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY TAGIHAN SISWA ---
const DUMMY_INVOICES = [
  { id: "INV-24001", student: "Budi Santoso", class: "TK-A", type: "SPP Februari 2026", amount: 350000, dueDate: "2026-02-10", status: "paid" },
  { id: "INV-24002", student: "Siti Aminah", class: "TK-B", type: "SPP Februari 2026", amount: 350000, dueDate: "2026-02-10", status: "unpaid" },
  { id: "INV-24003", student: "Rizky Billar", class: "Playgroup", type: "Uang Pangkal", amount: 1500000, dueDate: "2026-01-20", status: "overdue" },
  { id: "INV-24004", student: "Dewi Persik", class: "TK-A", type: "Seragam", amount: 450000, dueDate: "2026-02-05", status: "paid" },
  { id: "INV-24005", student: "Joko Anwar", class: "TK-B", type: "SPP Februari 2026", amount: 350000, dueDate: "2026-02-10", status: "unpaid" },
  { id: "INV-24006", student: "Raffi Ahmad", class: "Playgroup", type: "SPP Januari 2026", amount: 350000, dueDate: "2026-01-10", status: "overdue" },
];

const CLASS_OPTIONS = ["Semua Kelas", "Playgroup", "TK-A", "TK-B"];

export default function TuitionTab() {
  const [search, setSearch] = useState("");
  const [filterClass, setFilterClass] = useState("Semua Kelas");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- LOGIC FILTER ---
  const filteredData = DUMMY_INVOICES.filter((item) => {
    const matchSearch = item.student.toLowerCase().includes(search.toLowerCase()) || 
                        item.id.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "Semua Kelas" ? true : item.class === filterClass;
    const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;

    return matchSearch && matchClass && matchStatus;
  });

  // --- FORMATTER ---
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* --- HEADER & ACTIONS --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manajemen SPP & Tagihan</h2>
          <p className="text-sm text-slate-500">Kelola tagihan siswa dan status pembayaran bulanan.</p>
        </div>
        
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <BanknotesIcon className="w-4 h-4" /> Catat Pembayaran
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#e94640] text-white text-xs font-bold rounded-lg hover:bg-[#d63d38] transition-colors shadow-md">
                <PlusIcon className="w-4 h-4" /> Buat Tagihan (Invoice)
            </button>
        </div>
      </div>

      {/* --- SUMMARY CARDS (OPSIONAL) --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <SummaryCard label="Total Tagihan (Bulan Ini)" value="Rp 45.500.000" color="text-slate-800" />
          <SummaryCard label="Sudah Diterima" value="Rp 28.000.000" color="text-emerald-600" />
          <SummaryCard label="Belum Lunas / Tertunggak" value="Rp 17.500.000" color="text-rose-600" />
      </div>

      {/* --- FILTER TOOLBAR --- */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-64">
            <input 
                type="text" 
                placeholder="Cari Nama Siswa / No. Invoice..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
         </div>

         <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            {/* Filter Kelas */}
            <div className="relative min-w-[140px]">
                <select 
                    value={filterClass}
                    onChange={(e) => setFilterClass(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none cursor-pointer shadow-sm text-slate-600 font-medium"
                >
                    {CLASS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <FunnelIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            {/* Filter Status */}
            <div className="relative min-w-[140px]">
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none cursor-pointer shadow-sm text-slate-600 font-medium"
                >
                    <option value="all">Semua Status</option>
                    <option value="paid">Lunas</option>
                    <option value="unpaid">Belum Lunas</option>
                    <option value="overdue">Jatuh Tempo</option>
                </select>
                <FunnelIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
         </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">Siswa</th>
                        <th className="px-6 py-4">Tagihan</th>
                        <th className="px-6 py-4">Jatuh Tempo</th>
                        <th className="px-6 py-4">Jumlah</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                        filteredData.map((inv, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-600">{inv.id}</td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-bold text-slate-800">{inv.student}</p>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                            {inv.class}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-700 font-medium">{inv.type}</td>
                                <td className="px-6 py-4 text-slate-500 text-xs">{formatDate(inv.dueDate)}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{formatIDR(inv.amount)}</td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={inv.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        {inv.status !== 'paid' && (
                                            <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors" title="Bayar">
                                                <BanknotesIcon className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Kirim Pengingat">
                                            <PaperAirplaneIcon className="w-4 h-4" />
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                            <EllipsisHorizontalIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                Tidak ada data tagihan yang sesuai filter.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

// --- SUB COMPONENTS ---

function SummaryCard({ label, value, color }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
    )
}

function StatusBadge({ status }) {
    if (status === "paid") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase"><CheckCircleIcon className="w-3 h-3" /> Lunas</span>;
    }
    if (status === "unpaid") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase"><ClockIcon className="w-3 h-3" /> Belum Lunas</span>;
    }
    if (status === "overdue") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase"><ExclamationCircleIcon className="w-3 h-3" /> Jatuh Tempo</span>;
    }
    return null;
}