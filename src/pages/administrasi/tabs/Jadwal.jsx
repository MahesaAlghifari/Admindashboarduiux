import { useState, useMemo } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
  CalendarDaysIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  CalendarIcon
} from "@heroicons/react/24/outline";

// Note: Kita butuh data jurnal juga di sini untuk relasi
import { DATA_JURNAL_DUMMY } from "../../../data/dummyPembelajaran";

const DATA_JADWAL_INIT = [
  { id: 1, jurnal_id: 1, tanggal: "2025-07-15" }, 
  { id: 2, jurnal_id: 2, tanggal: "2025-07-16" }, 
];

export default function Jadwal() {
  const [jadwalData, setJadwalData] = useState(DATA_JADWAL_INIT);
  const [search, setSearch] = useState("");
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [isEditJadwal, setIsEditJadwal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({ id: null, jurnal_id: "", tanggal: "" });

  // 1. Enrich Data (Gabungkan Jadwal + Detail Jurnal)
  const enrichedJadwal = useMemo(() => {
    let data = jadwalData.map(item => {
      const rencana = DATA_JURNAL_DUMMY.find(j => j.id === Number(item.jurnal_id));
      return { ...item, rencana }; 
    });

    // Filter by Search
    if (search) {
      data = data.filter(item => 
        (item.rencana?.jurnal.toLowerCase().includes(search.toLowerCase())) ||
        (item.rencana?.tema.toLowerCase().includes(search.toLowerCase())) ||
        (item.tanggal.includes(search))
      );
    }

    // Sort by Date (Terbaru ke Terlama atau sebaliknya)
    return data.sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  }, [jadwalData, search]);

  const selectedJurnalDetail = useMemo(() => {
    if (!formJadwal.jurnal_id) return null;
    return DATA_JURNAL_DUMMY.find(j => j.id === Number(formJadwal.jurnal_id));
  }, [formJadwal.jurnal_id]);

  const handleSaveJadwal = (e) => {
    e.preventDefault();
    if (isEditJadwal) {
      setJadwalData(jadwalData.map(item => item.id === formJadwal.id ? formJadwal : item));
    } else {
      setJadwalData([...jadwalData, { ...formJadwal, id: Date.now() }]);
    }
    setIsJadwalModalOpen(false);
  };

  const handleDeleteJadwal = (id) => {
    if (confirm("Hapus jadwal ini?")) setJadwalData(jadwalData.filter(item => item.id !== id));
  };

  const openJadwalModal = (item = null) => {
    if (item) { setFormJadwal(item); setIsEditJadwal(true); } 
    else { setFormJadwal({ id: null, jurnal_id: "", tanggal: "" }); setIsEditJadwal(false); }
    setIsJadwalModalOpen(true);
  };

  // Helper untuk format tanggal Indonesia
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
        dayName: date.toLocaleDateString("id-ID", { weekday: 'long' }),
        dayNum: date.getDate(),
        monthYear: date.toLocaleDateString("id-ID", { month: 'short', year: 'numeric' })
    };
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HEADER PAGE */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Jadwal Pembelajaran</h2>
          <p className="text-slate-500 text-sm">Kelola kalender pelaksanaan rencana pembelajaran.</p>
        </div>
        <button 
          onClick={() => openJadwalModal()} 
          className="flex items-center gap-2 bg-[#e94640] hover:bg-[#d63d38] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <CalendarIcon className="h-5 w-5" /> 
          <span>Atur Jadwal</span>
        </button>
      </div>

      {/* 2. SEARCH BAR */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Cari kegiatan atau tanggal..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none transition-all placeholder:text-slate-400" 
          />
        </div>
      </div>

      {/* 3. TABLE DATA */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-48">Tanggal</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Detail Kegiatan</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {enrichedJadwal.map((item) => {
                const dateInfo = formatDate(item.tanggal);
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                    
                    {/* KOLOM TANGGAL (Visual Calendar) */}
                    <td className="px-6 py-4 align-top">
                       <div className="flex items-center gap-3">
                          <div className="flex flex-col items-center justify-center w-12 h-12 bg-white border border-slate-200 rounded-lg shadow-sm">
                             <span className="text-lg font-bold text-slate-800 leading-none">{dateInfo.dayNum}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-sm font-bold text-slate-800">{dateInfo.dayName}</span>
                             <span className="text-xs text-slate-500">{dateInfo.monthYear}</span>
                          </div>
                       </div>
                    </td>

                    {/* KOLOM KEGIATAN */}
                    <td className="px-6 py-4 align-top">
                      {item.rencana ? (
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start gap-2">
                             <span className="text-sm font-bold text-slate-800 leading-snug">{item.rencana.jurnal}</span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                             <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                               Tema: {item.rencana.tema}
                             </span>
                             <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                               Pilar: {item.rencana.pilar_karakter}
                             </span>
                             {item.rencana.pembiasaan && (
                                <span className="inline-flex items-center px-2 py-1 rounded-md text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                  Pembiasaan: {item.rencana.pembiasaan}
                                </span>
                             )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-rose-500 italic bg-rose-50 px-2 py-1 rounded border border-rose-100">
                          Data Rencana Terhapus
                        </span>
                      )}
                    </td>

                    {/* KOLOM AKSI */}
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-1">
                        <button 
                          onClick={() => openJadwalModal(item)} 
                          className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" 
                          title="Edit Jadwal"
                        >
                          <PencilSquareIcon className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteJadwal(item.id)} 
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" 
                          title="Hapus Jadwal"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {enrichedJadwal.length === 0 && (
                 <tr><td colSpan="3" className="px-6 py-12 text-center text-slate-400 text-sm">Belum ada jadwal yang diatur.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL FORM */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {isEditJadwal ? "Edit Jadwal" : "Atur Jadwal Baru"}
              </h3>
              <button onClick={() => setIsJadwalModalOpen(false)}>
                <XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            
            <form onSubmit={handleSaveJadwal} className="p-6 space-y-5">
              
              {/* Select Kegiatan */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Pilih Kegiatan (Jurnal)</label>
                <select 
                  required 
                  value={formJadwal.jurnal_id} 
                  onChange={e => setFormJadwal({...formJadwal, jurnal_id: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none bg-white cursor-pointer"
                >
                  <option value="">-- Pilih Kegiatan --</option>
                  {DATA_JURNAL_DUMMY.map(j => (
                    <option key={j.id} value={j.id}>{j.jurnal.substring(0, 50)}... (Tema: {j.tema})</option>
                  ))}
                </select>
                
                {/* Preview Detail Jurnal Terpilih */}
                {selectedJurnalDetail && (
                  <div className="mt-3 bg-slate-50 border border-slate-100 rounded-lg p-3 space-y-2 animate-in fade-in slide-in-from-top-1">
                    <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                       <span className="text-slate-500">Tema</span> 
                       <span className="font-semibold text-slate-700">{selectedJurnalDetail.tema}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                       <span className="text-slate-500">Pilar Karakter</span> 
                       <span className="font-semibold text-slate-700">{selectedJurnalDetail.pilar_karakter}</span>
                    </div>
                    <div className="text-xs pt-1">
                       <span className="block text-slate-500 mb-1">Kegiatan Inti:</span> 
                       <span className="block font-medium text-slate-800 leading-relaxed italic">"{selectedJurnalDetail.jurnal}"</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Input Tanggal */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tanggal Pelaksanaan</label>
                <div className="relative">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <CalendarDaysIcon className="h-5 w-5" />
                   </div>
                   <input 
                     type="date" 
                     required 
                     value={formJadwal.tanggal} 
                     onChange={e => setFormJadwal({...formJadwal, tanggal: e.target.value})} 
                     className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none" 
                   />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsJadwalModalOpen(false)} 
                  className="px-4 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#e94640] text-white rounded-lg text-sm font-medium hover:bg-[#d63d38] transition-colors shadow-sm"
                >
                  Simpan Jadwal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}