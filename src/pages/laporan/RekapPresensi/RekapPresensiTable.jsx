import RekapPresensiTableRow from "./RekapPresensiTableRow";

export default function RekapPresensiTable({ 
  data, getAbsenData, onPrintItem, 
  selectedStudents, setSelectedStudents, isSelectionMode 
}) {
  const isAllSelected = data.length > 0 && selectedStudents.length === data.length;

  const handleSelectAll = () => {
    if (isAllSelected) setSelectedStudents([]); 
    else setSelectedStudents(data.map(item => item.id)); 
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[11px] border-b border-slate-200 tracking-wider">
            <tr>
              {isSelectionMode && (
                 <th className="px-6 py-4 text-left w-12 animate-in fade-in slide-in-from-left-2 duration-300">
                   <input 
                     type="checkbox" 
                     checked={isAllSelected} 
                     onChange={handleSelectAll} 
                     className="w-4 h-4 rounded border-slate-300 text-[#e94640] focus:ring-[#e94640] cursor-pointer" 
                   />
                 </th>
              )}
              <th className="px-6 py-4 text-left">Identitas Siswa</th>
              <th className="px-6 py-4 text-center">Persentase Hadir</th>
              <th className="px-6 py-4 text-center">Rekap (H/S/I/A)</th>
              <th className="px-6 py-4 text-right">Cetak Absensi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((item) => (
                <RekapPresensiTableRow 
                  key={item.id} 
                  item={item} 
                  absenData={getAbsenData(item.id)} 
                  onPrint={onPrintItem}
                  selectedStudents={selectedStudents} 
                  setSelectedStudents={setSelectedStudents}
                  isSelectionMode={isSelectionMode} 
                />
              ))
            ) : (
               <tr>
                 <td colSpan={isSelectionMode ? 5 : 4} className="px-6 py-12 text-center text-slate-400">
                   Tidak ada data siswa ditemukan.
                 </td>
               </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}