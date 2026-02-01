import { useState } from "react";
import {
  PlusIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowUpRightIcon,
  ArrowDownLeftIcon,
  WalletIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY KAS KECIL ---
// Saldo Awal Bulan: Rp 2.000.000
const DUMMY_CASHFLOW = [
  { id: "PC-001", date: "2026-02-01", desc: "Isi Ulang Kas Kecil (Dari Bank)", category: "Top Up", type: "in", amount: 2000000, balance: 2000000, user: "Bendahara" },
  { id: "PC-002", date: "2026-02-02", desc: "Beli Air Mineral Galon (5x)", category: "Konsumsi", type: "out", amount: 100000, balance: 1900000, user: "OB" },
  { id: "PC-003", date: "2026-02-03", desc: "Fotokopi Materi Rapat", category: "ATK", type: "out", amount: 45000, balance: 1855000, user: "Tata Usaha" },
  { id: "PC-004", date: "2026-02-04", desc: "Bensin Motor Sekolah", category: "Transportasi", type: "out", amount: 35000, balance: 1820000, user: "Kurir" },
  { id: "PC-005", date: "2026-02-05", desc: "Sisa Kembalian Pembelian Alat", category: "Lainnya", type: "in", amount: 5000, balance: 1825000, user: "Guru IPA" },
  { id: "PC-006", date: "2026-02-06", desc: "Snack Tamu Yayasan", category: "Konsumsi", type: "out", amount: 150000, balance: 1675000, user: "Kepala Sekolah" },
];

export default function PettyCashTab() {
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("all"); // all, in, out

  // --- LOGIC FILTER ---
  const filteredData = DUMMY_CASHFLOW.filter((item) => {
    const matchSearch = item.desc.toLowerCase().includes(search.toLowerCase()) || 
                        item.id.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === "all" ? true : item.type === filterType;
    
    return matchSearch && matchType;
  });

  // --- HITUNG RINGKASAN (Simulasi) ---
  const totalIn = filteredData.filter(i => i.type === 'in').reduce((acc, curr) => acc + curr.amount, 0);
  const totalOut = filteredData.filter(i => i.type === 'out').reduce((acc, curr) => acc + curr.amount, 0);
  const currentBalance = 1675000; // Hardcoded saldo akhir dari dummy terakhir

  // --- FORMATTER ---
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  const formatDate = (dateStr) => new Date(dateStr).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Buku Kas Kecil</h2>
          <p className="text-sm text-slate-500">Pencatatan pengeluaran rutin operasional sekolah.</p>
        </div>
        
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition-colors shadow-md">
                <BanknotesIcon className="w-4 h-4" /> Isi Ulang Kas
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#e94640] text-white text-xs font-bold rounded-lg hover:bg-[#d63d38] transition-colors shadow-md">
                <PlusIcon className="w-4 h-4" /> Catat Transaksi
            </button>
        </div>
      </div>

      {/* --- SUMMARY CARDS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <SummaryBox label="Saldo Awal" value="Rp 2.000.000" icon={WalletIcon} color="text-slate-600" bg="bg-slate-100" />
          <SummaryBox label="Total Masuk" value={formatIDR(totalIn)} icon={ArrowDownLeftIcon} color="text-emerald-600" bg="bg-emerald-50" />
          <SummaryBox label="Total Keluar" value={formatIDR(totalOut)} icon={ArrowUpRightIcon} color="text-rose-600" bg="bg-rose-50" />
          <SummaryBox label="Saldo Akhir" value={formatIDR(currentBalance)} icon={BanknotesIcon} color="text-blue-600" bg="bg-blue-50" border />
      </div>

      {/* --- TOOLBAR --- */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         <div className="relative w-full md:w-80">
            <input 
                type="text" 
                placeholder="Cari Keterangan / No. Transaksi..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
         </div>

         <div className="flex w-full md:w-auto gap-2">
            <div className="relative min-w-[150px]">
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                    className="w-full appearance-none pl-3 pr-8 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none cursor-pointer shadow-sm text-slate-600 font-medium"
                >
                    <option value="all">Semua Tipe</option>
                    <option value="in">Pemasukan (Debet)</option>
                    <option value="out">Pengeluaran (Kredit)</option>
                </select>
                <FunnelIcon className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
            </div>
            
            <button className="flex items-center justify-center w-10 h-10 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 text-slate-600 shadow-sm" title="Export Excel">
                <ArrowDownTrayIcon className="w-5 h-5" />
            </button>
         </div>
      </div>

      {/* --- TABLE (LEDGER STYLE) --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">No. Ref</th>
                        <th className="px-6 py-4">Keterangan</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4 text-right text-emerald-600">Masuk (Debet)</th>
                        <th className="px-6 py-4 text-right text-rose-600">Keluar (Kredit)</th>
                        <th className="px-6 py-4 text-right bg-slate-50/50 font-bold">Saldo</th>
                        <th className="px-6 py-4">User</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                        filteredData.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 text-slate-500 font-mono text-xs">{formatDate(item.date)}</td>
                                <td className="px-6 py-4 font-mono text-xs text-slate-400">{item.id}</td>
                                <td className="px-6 py-4 font-medium text-slate-800">{item.desc}</td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600 border border-slate-200">
                                        {item.category}
                                    </span>
                                </td>
                                {/* Logic Kolom Masuk/Keluar */}
                                <td className="px-6 py-4 text-right font-medium text-emerald-600">
                                    {item.type === 'in' ? formatIDR(item.amount) : "-"}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-rose-600">
                                    {item.type === 'out' ? formatIDR(item.amount) : "-"}
                                </td>
                                <td className="px-6 py-4 text-right font-bold text-slate-800 bg-slate-50/30">
                                    {formatIDR(item.balance)}
                                </td>
                                <td className="px-6 py-4 text-xs text-slate-500">{item.user}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="8" className="px-6 py-12 text-center text-slate-400">
                                Tidak ada transaksi yang ditemukan.
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
function SummaryBox({ label, value, icon: Icon, color, bg, border }) {
    return (
        <div className={`p-4 rounded-xl border ${border ? 'border-blue-200 ring-1 ring-blue-100' : 'border-slate-200'} bg-white shadow-sm flex flex-col justify-between h-28 relative overflow-hidden`}>
            <div className={`absolute top-0 right-0 p-2 rounded-bl-xl ${bg}`}>
                <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider z-10">{label}</p>
            <p className={`text-xl font-bold ${color} z-10`}>{value}</p>
        </div>
    )
}