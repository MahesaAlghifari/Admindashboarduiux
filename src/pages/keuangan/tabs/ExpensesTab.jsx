import { useState } from "react";
import {
  PlusIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  DocumentCheckIcon,
  ClockIcon,
  XCircleIcon,
  CheckCircleIcon,
  PaperClipIcon,
  EllipsisHorizontalIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY PENGELUARAN ---
const DUMMY_EXPENSES = [
  { id: "EXP-001", date: "2026-02-01", desc: "Beli Kertas HVS & Tinta Printer", category: "Perlengkapan Kantor", amount: 450000, requester: "Tata Usaha", status: "approved", attachment: true },
  { id: "EXP-002", date: "2026-02-01", desc: "Konsumsi Rapat Guru", category: "Konsumsi", amount: 250000, requester: "Kepala Sekolah", status: "pending", attachment: false },
  { id: "EXP-003", date: "2026-01-30", desc: "Perbaikan AC Ruang Guru", category: "Pemeliharaan", amount: 750000, requester: "Sarpras", status: "approved", attachment: true },
  { id: "EXP-004", date: "2026-01-28", desc: "Langganan Zoom Premium", category: "Software & Lisensi", amount: 300000, requester: "IT Support", status: "rejected", attachment: false },
  { id: "EXP-005", date: "2026-01-25", desc: "Gaji Guru Honorer (Januari)", category: "Gaji & Upah", amount: 12500000, requester: "Bendahara", status: "approved", attachment: true },
];

const CATEGORIES = ["Semua Kategori", "Perlengkapan Kantor", "Pemeliharaan", "Gaji & Upah", "Konsumsi", "Transportasi"];

export default function ExpensesTab() {
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("Semua Kategori");
  const [filterStatus, setFilterStatus] = useState("all");

  // --- LOGIC FILTER ---
  const filteredData = DUMMY_EXPENSES.filter((item) => {
    const matchSearch = item.desc.toLowerCase().includes(search.toLowerCase()) || 
                        item.requester.toLowerCase().includes(search.toLowerCase());
    const matchCategory = filterCategory === "Semua Kategori" ? true : item.category === filterCategory;
    const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;

    return matchSearch && matchCategory && matchStatus;
  });

  // --- FORMATTER ---
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pencatatan Pengeluaran</h2>
          <p className="text-sm text-slate-500">Kelola dan setujui pengajuan dana operasional sekolah.</p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#e94640] text-white text-xs font-bold rounded-lg hover:bg-[#d63d38] transition-colors shadow-md">
            <PlusIcon className="w-4 h-4" /> Catat Pengeluaran
        </button>
      </div>

      {/* --- SUMMARY STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Total Keluar (Bulan Ini)</p>
                <p className="text-xl font-bold text-slate-800 mt-1">Rp 14.250.000</p>
             </div>
             <div className="p-2 bg-rose-50 rounded-lg text-rose-600"><DocumentCheckIcon className="w-6 h-6"/></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Menunggu Persetujuan</p>
                <p className="text-xl font-bold text-amber-600 mt-1">3 Pengajuan</p>
             </div>
             <div className="p-2 bg-amber-50 rounded-lg text-amber-600"><ClockIcon className="w-6 h-6"/></div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
             <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wide">Sisa Anggaran</p>
                <p className="text-xl font-bold text-emerald-600 mt-1">Rp 35.750.000</p>
             </div>
             <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600"><CheckCircleIcon className="w-6 h-6"/></div>
          </div>
      </div>

      {/* --- TOOLBAR --- */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-72">
            <input 
                type="text" 
                placeholder="Cari Deskripsi / Pemohon..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
         </div>

         <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0 no-scrollbar">
            <div className="relative min-w-[160px]">
                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none cursor-pointer shadow-sm text-slate-600 font-medium"
                >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <FunnelIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>

            <div className="relative min-w-[140px]">
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none cursor-pointer shadow-sm text-slate-600 font-medium"
                >
                    <option value="all">Semua Status</option>
                    <option value="approved">Disetujui</option>
                    <option value="pending">Menunggu</option>
                    <option value="rejected">Ditolak</option>
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
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Keterangan</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4">Jumlah</th>
                        <th className="px-6 py-4">Pemohon</th>
                        <th className="px-6 py-4 text-center">Bukti</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                        filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{formatDate(item.date)}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{item.desc}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                        {item.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-bold text-rose-600">{formatIDR(item.amount)}</td>
                                <td className="px-6 py-4 text-slate-600 text-xs">{item.requester}</td>
                                <td className="px-6 py-4 text-center">
                                    {item.attachment ? (
                                        <button className="text-blue-600 hover:underline text-[10px] flex items-center justify-center gap-1 mx-auto"><PaperClipIcon className="w-3 h-3"/> Lihat</button>
                                    ) : (
                                        <span className="text-slate-300 text-[10px] italic">Nihil</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={item.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="p-1.5 text-slate-400 hover:bg-slate-100 rounded-lg transition-colors">
                                        <EllipsisHorizontalIcon className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                                Tidak ada data pengeluaran.
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

// --- SUB COMPONENT ---
function StatusBadge({ status }) {
    if (status === "approved") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase"><CheckCircleIcon className="w-3 h-3" /> Disetujui</span>;
    }
    if (status === "pending") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase"><ClockIcon className="w-3 h-3" /> Menunggu</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase"><XCircleIcon className="w-3 h-3" /> Ditolak</span>;
}