import { CheckCircleIcon, PrinterIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";

export default function BukuPenghubungTableRow({ 
  item, penghubungData, onPrint,
  selectedStudents, setSelectedStudents,
  isSelectionMode 
}) {
  const isSelected = selectedStudents.includes(item.id);
  
  // Simulasi mengecek apakah data 5 hari penuh
  const hariTerisi = Object.keys(penghubungData || {}).length;
  const statusLengkap = hariTerisi >= 5;

  const handleSelect = () => {
    if (isSelected) setSelectedStudents(prev => prev.filter(id => id !== item.id));
    else setSelectedStudents(prev => [...prev, item.id]);
  };

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${isSelected && isSelectionMode ? 'bg-red-50/30' : ''}`}>
      
      {isSelectionMode && (
        <td className="px-6 py-4 animate-in fade-in slide-in-from-left-2 duration-300">
          <input 
            type="checkbox" checked={isSelected} onChange={handleSelect}
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
         <span className="font-bold text-slate-600 text-sm">
            {hariTerisi} <span className="text-slate-400 font-medium text-xs">/ 5 Hari</span>
         </span>
      </td>

      <td className="px-6 py-4 text-center">
         {statusLengkap ? (
             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
                <CheckCircleIcon className="w-3.5 h-3.5" /> Lengkap
             </span>
         ) : (
             <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase bg-amber-50 text-amber-600 border border-amber-100">
                <ExclamationCircleIcon className="w-3.5 h-3.5" /> Belum Lengkap
             </span>
         )}
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