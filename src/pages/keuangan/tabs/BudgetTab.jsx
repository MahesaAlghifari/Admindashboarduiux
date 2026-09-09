import { useState } from "react";
import {
  ChartPieIcon,
  PencilSquareIcon,
  PlusIcon,
  ArrowTrendingUpIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  BanknotesIcon
} from "@heroicons/react/24/outline";

// --- DATA DUMMY ANGGARAN (TAHUN AJARAN 2025/2026) ---
const DUMMY_BUDGETS = [
  { id: "BG-01", category: "Gaji & Tunjangan", limit: 500000000, used: 250000000, color: "bg-purple-500" },
  { id: "BG-02", category: "Sarana Prasarana (Aset)", limit: 150000000, used: 145000000, color: "bg-blue-500" },
  { id: "BG-03", category: "Operasional Kantor & ATK", limit: 50000000, used: 20000000, color: "bg-emerald-500" },
  { id: "BG-04", category: "Kegiatan Siswa & Lomba", limit: 75000000, used: 10000000, color: "bg-amber-500" },
  { id: "BG-05", category: "Pemasaran (PPDB)", limit: 30000000, used: 32000000, color: "bg-rose-500" }, // Over budget case
  { id: "BG-06", category: "Pemeliharaan Gedung", limit: 40000000, used: 5000000, color: "bg-cyan-500" },
];

export default function BudgetTab() {
  const [year, setYear] = useState("2025/2026");

  // --- CALCULATIONS ---
  const totalLimit = DUMMY_BUDGETS.reduce((acc, curr) => acc + curr.limit, 0);
  const totalUsed = DUMMY_BUDGETS.reduce((acc, curr) => acc + curr.used, 0);
  const percentageTotal = Math.round((totalUsed / totalLimit) * 100);

  // --- FORMATTER ---
  const formatIDR = (num) => new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(num);

  return (
    <div className="space-y-8">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Anggaran (Budgeting)</h2>
          <p className="text-sm text-slate-500">Perencanaan dan monitoring penggunaan dana Tahun Ajaran <span className="font-bold text-slate-800">{year}</span>.</p>
        </div>
        
        <div className="flex gap-2">
            <select 
                value={year} 
                onChange={(e) => setYear(e.target.value)}
                className="px-3 py-2 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg focus:outline-none focus:border-[#e94640]"
            >
                <option value="2025/2026">2025/2026</option>
                <option value="2024/2025">2024/2025</option>
            </select>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#e94640] text-white text-xs font-bold rounded-lg hover:bg-[#d63d38] transition-colors shadow-md">
                <PlusIcon className="w-4 h-4" /> Buat Pos Anggaran
            </button>
        </div>
      </div>

      {/* --- OVERALL SUMMARY --- */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 shadow-lg relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          
          <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
              <div>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2">Total Anggaran Tahunan</p>
                  <h3 className="text-3xl font-bold">{formatIDR(totalLimit)}</h3>
                  <div className="mt-4 flex items-center gap-2 text-sm text-slate-300">
                      <BanknotesIcon className="w-5 h-5 text-emerald-400" />
                      <span>Dana Tersedia</span>
                  </div>
              </div>

              <div className="md:col-span-2">
                  <div className="flex justify-between items-end mb-2">
                      <div>
                          <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Realisasi Penggunaan</p>
                          <p className="text-2xl font-bold mt-1">{formatIDR(totalUsed)} <span className="text-sm font-normal text-slate-400">({percentageTotal}%)</span></p>
                      </div>
                      <p className="text-sm font-medium text-slate-300">Sisa: <span className="text-white font-bold">{formatIDR(totalLimit - totalUsed)}</span></p>
                  </div>
                  
                  {/* Progress Bar Besar */}
                  <div className="w-full bg-slate-700 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${percentageTotal > 90 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${percentageTotal}%` }}
                      ></div>
                  </div>
              </div>
          </div>
      </div>

      {/* --- BUDGET DETAILS GRID --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {DUMMY_BUDGETS.map((budget) => {
             const percent = Math.round((budget.used / budget.limit) * 100);
             let statusColor = "text-emerald-600 bg-emerald-50 border-emerald-100";
             let statusLabel = "Aman";
             let StatusIcon = CheckCircleIcon;

             if (percent >= 80 && percent <= 100) {
                 statusColor = "text-amber-600 bg-amber-50 border-amber-100";
                 statusLabel = "Menipis";
                 StatusIcon = ArrowTrendingUpIcon;
             } else if (percent > 100) {
                 statusColor = "text-rose-600 bg-rose-50 border-rose-100";
                 statusLabel = "Over Budget";
                 StatusIcon = ExclamationTriangleIcon;
             }

             return (
                 <div key={budget.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${budget.color} bg-opacity-10`}>
                                <ChartPieIcon className={`w-6 h-6 ${budget.color.replace('bg-', 'text-')}`} />
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800">{budget.category}</h4>
                                <p className="text-xs text-slate-500 font-mono">{budget.id}</p>
                            </div>
                        </div>
                        <button className="text-slate-400 hover:text-slate-600">
                            <PencilSquareIcon className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="mb-4">
                        <div className="flex justify-between text-sm mb-1">
                            <span className="text-slate-500">Terpakai</span>
                            <span className="font-bold text-slate-800">{formatIDR(budget.used)}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${percent > 100 ? 'bg-rose-500' : budget.color.replace('bg-', 'bg-')}`} 
                                style={{ width: `${Math.min(percent, 100)}%` }}
                            ></div>
                        </div>
                        <div className="flex justify-between text-xs mt-1.5">
                            <span className="text-slate-400">Target: {formatIDR(budget.limit)}</span>
                            <span className={`font-bold ${percent > 100 ? 'text-rose-600' : 'text-slate-600'}`}>{percent}%</span>
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${statusColor}`}>
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusLabel}
                        </div>
                        <p className="text-xs text-slate-400">
                            Sisa: <span className={budget.limit - budget.used < 0 ? "text-rose-600 font-bold" : "text-slate-600 font-bold"}>
                                {formatIDR(budget.limit - budget.used)}
                            </span>
                        </p>
                    </div>
                 </div>
             )
          })}
      </div>

    </div>
  );
}