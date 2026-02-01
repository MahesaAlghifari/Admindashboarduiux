import { useState } from "react";
import {
  BanknotesIcon,
  UserIcon,
  PrinterIcon,
  EnvelopeIcon,
  ArrowPathIcon,
  CheckBadgeIcon,
  ClockIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  BuildingLibraryIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY KARYAWAN & GAJI ---
const DUMMY_PAYROLL = [
  { 
    id: "EMP-001", name: "Siti Nurhaliza, S.Pd.", role: "Guru Wali Kelas", 
    basic: 3500000, allowance: 1200000, deduction: 150000, 
    net: 4550000, status: "paid", bank: "BCA - 1234567890" 
  },
  { 
    id: "EMP-002", name: "Budi Santoso, M.Pd.", role: "Kepala Sekolah", 
    basic: 5000000, allowance: 2500000, deduction: 300000, 
    net: 7200000, status: "paid", bank: "Mandiri - 0987654321" 
  },
  { 
    id: "EMP-003", name: "Rina Nose", role: "Staff Tata Usaha", 
    basic: 2800000, allowance: 800000, deduction: 100000, 
    net: 3500000, status: "processed", bank: "BRI - 1122334455" 
  },
  { 
    id: "EMP-004", name: "Joko Kendil", role: "Satpam", 
    basic: 2500000, allowance: 500000, deduction: 50000, 
    net: 2950000, status: "draft", bank: "Beni - 5544332211" 
  },
  { 
    id: "EMP-005", name: "Dewi Persik", role: "Guru Honorer", 
    basic: 1500000, allowance: 300000, deduction: 0, 
    net: 1800000, status: "draft", bank: "Tunai" 
  },
];

export default function PayrollTab() {
  const [search, setSearch] = useState("");
  const [selectedSlip, setSelectedSlip] = useState(null); // Untuk Modal Slip Gaji
  const [isGenerating, setIsGenerating] = useState(false);

  // --- LOGIC FILTER ---
  const filteredData = DUMMY_PAYROLL.filter((item) => 
    item.name.toLowerCase().includes(search.toLowerCase()) || 
    item.role.toLowerCase().includes(search.toLowerCase())
  );

  // --- SIMULASI GENERATE PAYROLL ---
  const handleGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      alert("Laporan penggajian bulan ini berhasil dibuat!");
    }, 2000);
  };

  // --- FORMATTER ---
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Penggajian (Payroll)</h2>
          <p className="text-sm text-slate-500">Periode: <span className="font-bold text-slate-800">Februari 2026</span></p>
        </div>
        
        <div className="flex gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 text-xs font-bold rounded-lg hover:bg-slate-50 transition-colors shadow-sm">
                <BuildingLibraryIcon className="w-4 h-4" /> Atur Komponen
            </button>
            <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="flex items-center gap-2 px-4 py-2 bg-[#e94640] text-white text-xs font-bold rounded-lg hover:bg-[#d63d38] transition-colors shadow-md disabled:opacity-70"
            >
                {isGenerating ? <ArrowPathIcon className="w-4 h-4 animate-spin"/> : <ArrowPathIcon className="w-4 h-4" />}
                {isGenerating ? "Memproses..." : "Generate Payroll"}
            </button>
        </div>
      </div>

      {/* --- STATS --- */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Total Gaji (Estimasi)" value="Rp 38.500.000" color="text-slate-800" />
          <StatCard label="Sudah Dibayarkan" value="Rp 11.750.000" color="text-emerald-600" />
          <StatCard label="Menunggu Pembayaran" value="Rp 26.750.000" color="text-amber-600" />
      </div>

      {/* --- TOOLBAR --- */}
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex items-center justify-between">
         <div className="relative w-full md:w-80">
            <input 
                type="text" 
                placeholder="Cari Nama Guru / Staff..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-100 focus:border-[#e94640] outline-none transition-all shadow-sm"
            />
            <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
         </div>
      </div>

      {/* --- TABLE --- */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                    <tr>
                        <th className="px-6 py-4">Nama Pegawai</th>
                        <th className="px-6 py-4">Gaji Pokok</th>
                        <th className="px-6 py-4 text-emerald-600">Tunjangan (+)</th>
                        <th className="px-6 py-4 text-rose-600">Potongan (-)</th>
                        <th className="px-6 py-4 font-bold bg-slate-50/50">Gaji Bersih</th>
                        <th className="px-6 py-4 text-center">Status</th>
                        <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {filteredData.map((emp, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="font-bold text-slate-800">{emp.name}</div>
                                <div className="text-xs text-slate-500">{emp.role}</div>
                            </td>
                            <td className="px-6 py-4 text-slate-600">{formatIDR(emp.basic)}</td>
                            <td className="px-6 py-4 text-emerald-600 font-medium">{formatIDR(emp.allowance)}</td>
                            <td className="px-6 py-4 text-rose-600 font-medium">{formatIDR(emp.deduction)}</td>
                            <td className="px-6 py-4 font-bold text-slate-800 bg-slate-50/30">{formatIDR(emp.net)}</td>
                            <td className="px-6 py-4 text-center">
                                <StatusBadge status={emp.status} />
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => setSelectedSlip(emp)}
                                    className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline"
                                >
                                    Lihat Slip
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* --- MODAL SLIP GAJI --- */}
      {selectedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-200">
             <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">
                
                {/* Header Modal */}
                <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                    <div>
                        <h3 className="text-lg font-bold text-slate-800">Slip Gaji Digital</h3>
                        <p className="text-xs text-slate-500">Periode: Februari 2026</p>
                    </div>
                    <button onClick={() => setSelectedSlip(null)} className="p-1 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                {/* Konten Slip */}
                <div className="p-8">
                    {/* Info Pegawai */}
                    <div className="flex justify-between mb-8 pb-4 border-b border-dashed border-slate-300">
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Nama Pegawai</p>
                            <p className="text-lg font-bold text-slate-800">{selectedSlip.name}</p>
                            <p className="text-sm text-slate-500">{selectedSlip.role}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-slate-400 font-bold uppercase">ID Pegawai</p>
                            <p className="text-sm font-mono text-slate-700">{selectedSlip.id}</p>
                            <p className="text-xs text-slate-500 mt-1">{selectedSlip.bank}</p>
                        </div>
                    </div>

                    {/* Rincian Gaji */}
                    <div className="grid grid-cols-2 gap-8 mb-6">
                        {/* Pendapatan */}
                        <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-3 border-b border-emerald-100 pb-1">Pendapatan (Earnings)</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Gaji Pokok</span>
                                    <span className="font-medium text-slate-800">{formatIDR(selectedSlip.basic)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tunj. Jabatan</span>
                                    <span className="font-medium text-slate-800">{formatIDR(selectedSlip.allowance * 0.6)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tunj. Transport</span>
                                    <span className="font-medium text-slate-800">{formatIDR(selectedSlip.allowance * 0.4)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Potongan */}
                        <div>
                            <p className="text-xs font-bold text-rose-600 uppercase mb-3 border-b border-rose-100 pb-1">Potongan (Deductions)</p>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">BPJS Kesehatan</span>
                                    <span className="font-medium text-rose-600">-{formatIDR(selectedSlip.deduction * 0.7)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">PPh 21</span>
                                    <span className="font-medium text-rose-600">-{formatIDR(selectedSlip.deduction * 0.3)}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Total Gaji Bersih */}
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-between items-center">
                        <div>
                            <p className="text-xs text-slate-500 font-bold uppercase">Total Gaji Bersih (Net Salary)</p>
                            <p className="text-xs text-slate-400 italic">Ditransfer ke rekening terdaftar</p>
                        </div>
                        <p className="text-2xl font-bold text-[#e94640]">{formatIDR(selectedSlip.net)}</p>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:bg-slate-100 transition-colors">
                        <PrinterIcon className="w-4 h-4" /> Cetak PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white text-sm font-bold rounded-lg hover:bg-slate-900 transition-colors">
                        <EnvelopeIcon className="w-4 h-4" /> Kirim Email
                    </button>
                </div>
             </div>
        </div>
      )}

    </div>
  );
}

// --- SUB COMPONENTS ---

function StatCard({ label, value, color }) {
    return (
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wide mb-1">{label}</p>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
        </div>
    )
}

function StatusBadge({ status }) {
    if (status === "paid") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase"><CheckBadgeIcon className="w-3 h-3" /> Dibayarkan</span>;
    }
    if (status === "processed") {
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100 uppercase"><ArrowPathIcon className="w-3 h-3" /> Diproses</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase"><ClockIcon className="w-3 h-3" /> Draft</span>;
}