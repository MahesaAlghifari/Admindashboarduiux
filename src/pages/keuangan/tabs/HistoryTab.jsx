import { useState } from "react";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon, 
  PrinterIcon,
  CheckCircleIcon,
  ClockIcon,
  XCircleIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY TRANSAKSI ---
const DUMMY_TRANSACTIONS = [
  { id: "TRX-001", date: "2026-02-01", student: "Budi Santoso", class: "TK-A", type: "SPP Februari", amount: 350000, method: "Transfer Bank", status: "success" },
  { id: "TRX-002", date: "2026-02-01", student: "Siti Aminah", class: "TK-B", type: "Uang Pangkal", amount: 1500000, method: "Tunai", status: "success" },
  { id: "TRX-003", date: "2026-01-31", student: "Rizky Billar", class: "Playgroup", type: "Seragam", amount: 450000, method: "QRIS", status: "pending" },
  { id: "TRX-004", date: "2026-01-30", student: "Anak Cerdas", class: "TK-A", type: "SPP Januari", amount: 350000, method: "Transfer Bank", status: "failed" },
  { id: "TRX-005", date: "2026-01-29", student: "Dewi Persik", class: "TK-B", type: "Kegiatan Renang", amount: 50000, method: "Tunai", status: "success" },
  { id: "TRX-006", date: "2026-01-28", student: "Joko Anwar", class: "Playgroup", type: "Buku Paket", amount: 200000, method: "Transfer Bank", status: "success" },
];

export default function HistoryTab() {
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterDate, setFilterDate] = useState("");

  // --- LOGIC FILTER ---
  const filteredData = DUMMY_TRANSACTIONS.filter((item) => {
    const matchSearch = item.student.toLowerCase().includes(search.toLowerCase()) || 
                        item.id.toLowerCase().includes(search.toLowerCase()) ||
                        item.type.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "all" ? true : item.status === filterStatus;
    const matchDate = filterDate ? item.date === filterDate : true;

    return matchSearch && matchStatus && matchDate;
  });

  // --- FORMAT CURRENCY ---
  const formatIDR = (num) => {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);
  };

  // --- FORMAT TANGGAL ---
  const formatDate = (dateStr) => {
    const options = { day: 'numeric', month: 'short', year: 'numeric' };
    return new Date(dateStr).toLocaleDateString('id-ID', options);
  };

  // --- EXPORT CSV ---
  const handleExportCSV = () => {
    const headers = ["ID Transaksi,Tanggal,Siswa,Kelas,Jenis Pembayaran,Nominal,Metode,Status"];
    const rows = filteredData.map(t => 
      `${t.id},${t.date},${t.student},${t.class},${t.type},${t.amount},${t.method},${t.status}`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "riwayat_transaksi.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* --- HEADER KONTEN --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Riwayat Pembayaran</h2>
          <p className="text-sm text-slate-500">Log lengkap semua transaksi masuk dari siswa/wali murid.</p>
        </div>
        
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <PrinterIcon className="w-4 h-4" /> Cetak
            </button>
            <button 
                onClick={handleExportCSV}
                className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-md"
            >
                <ArrowDownTrayIcon className="w-4 h-4" /> Export .CSV
            </button>
        </div>
      </div>

      {/* --- TOOLBAR (SEARCH & FILTER) --- */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
         
         {/* Search Box */}
         <div className="relative w-full md:w-72">
            <input 
                type="text" 
                placeholder="Cari ID, Siswa, atau Pembayaran..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
         </div>

         {/* Filters */}
         <div className="flex w-full md:w-auto gap-2 overflow-x-auto pb-2 md:pb-0">
            <div className="relative min-w-[140px]">
                <select 
                    value={filterStatus} 
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="w-full appearance-none pl-9 pr-8 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none cursor-pointer shadow-sm text-slate-600 font-medium"
                >
                    <option value="all">Semua Status</option>
                    <option value="success">Berhasil</option>
                    <option value="pending">Tertunda</option>
                    <option value="failed">Gagal</option>
                </select>
                <FunnelIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>

            <div className="relative min-w-[150px]">
                <input 
                    type="date" 
                    value={filterDate}
                    onChange={(e) => setFilterDate(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none shadow-sm text-slate-600"
                />
                <CalendarIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
         </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">ID Transaksi</th>
                        <th className="px-6 py-4">Tanggal</th>
                        <th className="px-6 py-4">Siswa</th>
                        <th className="px-6 py-4">Kategori</th>
                        <th className="px-6 py-4">Nominal</th>
                        <th className="px-6 py-4">Metode</th>
                        <th className="px-6 py-4 text-center">Status</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.length > 0 ? (
                        filteredData.map((trx, idx) => (
                            <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 font-mono text-slate-600 font-medium">{trx.id}</td>
                                <td className="px-6 py-4 text-slate-600">{formatDate(trx.date)}</td>
                                <td className="px-6 py-4">
                                    <div>
                                        <p className="font-bold text-slate-800">{trx.student}</p>
                                        <p className="text-[10px] text-slate-400">{trx.class}</p>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-700">{trx.type}</td>
                                <td className="px-6 py-4 font-bold text-slate-800">{formatIDR(trx.amount)}</td>
                                <td className="px-6 py-4 text-slate-600">{trx.method}</td>
                                <td className="px-6 py-4 text-center">
                                    <StatusBadge status={trx.status} />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                Tidak ada data transaksi yang ditemukan.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination Placeholder */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
            <span className="text-xs text-slate-500">Menampilkan <strong>{filteredData.length}</strong> data</span>
            <div className="flex gap-1">
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs text-slate-600 disabled:opacity-50" disabled>Prev</button>
                <button className="px-3 py-1 bg-white border border-slate-200 rounded hover:bg-slate-50 text-xs text-slate-600">Next</button>
            </div>
        </div>
      </div>

    </div>
  );
}

// --- HELPER COMPONENT: BADGE STATUS ---
function StatusBadge({ status }) {
    if (status === "success") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase"><CheckCircleIcon className="w-3 h-3" /> Berhasil</span>;
    }
    if (status === "pending") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-600 border border-amber-100 uppercase"><ClockIcon className="w-3 h-3" /> Tertunda</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-50 text-rose-600 border border-rose-100 uppercase"><XCircleIcon className="w-3 h-3" /> Gagal</span>;
}