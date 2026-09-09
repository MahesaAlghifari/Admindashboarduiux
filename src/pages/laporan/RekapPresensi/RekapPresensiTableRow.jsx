import { CheckCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";

export default function RekapPresensiTableRow({ 
  item, absenData, onPrint,
  selectedStudents, setSelectedStudents,
  isSelectionMode 
}) {
  const isSelected = selectedStudents.includes(item.id);
  const stats = absenData?.summary || { h: 22, s: 0, i: 0, a: 0 };
  const persentase = Math.round((stats.h / (stats.h + stats.s + stats.i + stats.a)) * 100) || 0;

  const handleSelect = () => {
    if (isSelected) setSelectedStudents(prev => prev.filter(id => id !== item.id));
    else setSelectedStudents(prev => [...prev, item.id]);
  };

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${isSelected && isSelectionMode ? 'bg-red-50/30' : ''}`}>
      
      {isSelectionMode && (
        <td className="px-6 py-4 animate-in fade-in slide-in-from-left-2 duration-300">
          <input 
            type="checkbox" 
            checked={isSelected} 
            onChange={handleSelect}
            className="w-4 h-4 rounded border-slate-300 text-[#e94640] focus:ring-[#e94640] cursor-pointer"
          />
        </td>
      )}

      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200 shadow-sm">
            {item.peserta_didik.nama_lengkap.substring(0, 2).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-slate-800">{item.peserta_didik.nama_lengkap}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">NIS: {item.peserta_didik.nomor_induk || "-"}</p>
          </div>
        </div>
      </td>
      
      <td className="px-6 py-4 text-center">
         <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold ${persentase >= 90 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
            {persentase}%
         </span>
      </td>

      <td className="px-6 py-4 text-center font-bold text-slate-600 text-sm">
         <span className="text-emerald-600">{stats.h}</span> / <span className="text-blue-600">{stats.s}</span> / <span className="text-amber-600">{stats.i}</span> / <span className="text-rose-600">{stats.a}</span>
      </td>

      <td className="px-6 py-4 text-right">
        <button 
          onClick={() => onPrint(item)} 
          disabled={isSelectionMode}
          className={`p-2 rounded-lg transition-colors border border-transparent ${isSelectionMode ? 'text-slate-300 cursor-not-allowed' : 'text-slate-400 hover:text-[#e94640] hover:bg-red-50 hover:border-red-100'}`} 
          title="Cetak Satuan"
        >
          <PrinterIcon className="w-5 h-5" />
        </button>
      </td>
    </tr>
  );
}