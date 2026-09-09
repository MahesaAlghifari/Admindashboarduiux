import { CheckCircleIcon, PrinterIcon } from "@heroicons/react/24/outline";

export default function RaporTableRow({ 
  item, raporData, activeSemesterKey, onPrint,
  selectedStudents, setSelectedStudents,
  isSelectionMode // State baru
}) {
  const isSelected = selectedStudents.includes(item.id);
  const currRapor = raporData[item.id]?.[activeSemesterKey];

  const nilai = currRapor?.nilai || {};
  const total = Object.keys(nilai).length;
  const tercapai = Object.values(nilai).filter(v => v === "BSH" || v === "BSB").length;
  
  const statusComplete = currRapor?.catatan && currRapor?.fisik?.bb ? "Lengkap" : "Belum Lengkap";

  const handleSelect = () => {
    if (isSelected) {
      setSelectedStudents(prev => prev.filter(id => id !== item.id));
    } else {
      setSelectedStudents(prev => [...prev, item.id]);
    }
  };

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${isSelected && isSelectionMode ? 'bg-red-50/30' : ''}`}>
      
      {/* Kolom Checkbox Row (Kondisional) */}
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
      <td className="px-6 py-4 text-slate-600 font-bold text-center">
        {tercapai} <span className="text-slate-400 font-medium text-xs">/ {total > 0 ? total : "-"}</span>
      </td>
      <td className="px-6 py-4 text-center text-slate-600 text-xs">
        <span className="text-rose-600 font-bold">{currRapor?.absen?.s || 0}</span> / <span className="text-amber-600 font-bold">{currRapor?.absen?.i || 0}</span> / <span className="font-bold text-slate-400">{currRapor?.absen?.a || 0}</span>
      </td>
      <td className="px-6 py-4 text-center">
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${statusComplete === "Lengkap" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-amber-50 text-amber-600 border border-amber-100"}`}>
          <CheckCircleIcon className="w-3.5 h-3.5" /> {statusComplete}
        </span>
      </td>
      <td className="px-6 py-4 text-right">
        {/* Opsional: Nonaktifkan klik cetak satuan saat mode seleksi aktif agar user fokus memilih */}
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