import { useState } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusCircleIcon
} from "@heroicons/react/24/outline";

import { DATA_JURNAL_DUMMY } from "../../../data/dummyPembelajaran";

export default function Perencanaan() {
  const [jurnalData, setJurnalData] = useState(DATA_JURNAL_DUMMY);
  const [searchJurnal, setSearchJurnal] = useState("");
  const [pageJurnal, setPageJurnal] = useState(1);
  const [itemsPerPageJurnal, setItemsPerPageJurnal] = useState(5);
  
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [isEditJurnal, setIsEditJurnal] = useState(false);
  const [formJurnal, setFormJurnal] = useState({ id: null, tema: "", pilar_karakter: "", pembiasaan: "", jurnal: "" });

  const filteredJurnal = jurnalData.filter(item => 
    item.tema.toLowerCase().includes(searchJurnal.toLowerCase()) || 
    item.pilar_karakter.toLowerCase().includes(searchJurnal.toLowerCase()) || 
    (item.pembiasaan && item.pembiasaan.toLowerCase().includes(searchJurnal.toLowerCase()))
  );
  
  const totalJurnal = filteredJurnal.length;
  const totalPagesJurnal = Math.ceil(totalJurnal / itemsPerPageJurnal);
  const paginatedJurnal = filteredJurnal.slice((pageJurnal - 1) * itemsPerPageJurnal, pageJurnal * itemsPerPageJurnal);

  const handleSaveJurnal = (e) => {
    e.preventDefault();
    if (isEditJurnal) {
      setJurnalData(jurnalData.map(item => item.id === formJurnal.id ? formJurnal : item));
    } else {
      setJurnalData([...jurnalData, { ...formJurnal, id: Date.now() }]);
    }
    setIsJurnalModalOpen(false);
  };

  const handleDeleteJurnal = (id) => {
    if (confirm("Hapus data jurnal ini?")) setJurnalData(jurnalData.filter((item) => item.id !== id));
  };

  const openJurnalModal = (item = null) => {
    if (item) { setFormJurnal(item); setIsEditJurnal(true); } 
    else { setFormJurnal({ id: null, tema: "", pilar_karakter: "", pembiasaan: "", jurnal: "" }); setIsEditJurnal(false); }
    setIsJurnalModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HEADER PAGE */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Perencanaan Pembelajaran</h2>
          <p className="text-slate-500 text-sm">Kelola tema, pilar karakter, dan jurnal harian.</p>
        </div>
        <button 
          onClick={() => openJurnalModal()} 
          className="flex items-center gap-2 bg-[#e94640] hover:bg-[#d63d38] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <PlusCircleIcon className="h-5 w-5" /> 
          <span>Tambah Jurnal</span>
        </button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex justify-end">
        <div className="relative w-full md:w-72">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <MagnifyingGlassIcon className="h-4 w-4" />
          </div>
          <input 
            type="text" 
            placeholder="Cari tema, pilar, atau jurnal..." 
            value={searchJurnal} 
            onChange={(e) => setSearchJurnal(e.target.value)} 
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
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Tema</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Pilar Karakter</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-1/5">Pembiasaan</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Jurnal Kegiatan</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {paginatedJurnal.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                  <td className="px-6 py-4 align-top">
                    <div className="text-sm font-bold text-slate-800">{item.tema}</div>
                  </td>
                  <td className="px-6 py-4 align-top">
                    <div className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded inline-block">
                      {item.pilar_karakter}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 align-top leading-relaxed">
                    {item.pembiasaan || <span className="text-slate-300 italic">-</span>}
                  </td>
                  <td className="px-6 py-4 text-xs text-slate-600 leading-relaxed align-top">
                    {item.jurnal}
                  </td>
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => openJurnalModal(item)} 
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors" 
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteJurnal(item.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors" 
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredJurnal.length === 0 && (
                 <tr><td colSpan="5" className="px-6 py-12 text-center text-slate-400 text-sm">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. PAGINATION */}
      {totalJurnal > 0 && (
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center rounded-b-lg">
           <div className="flex items-center gap-2 text-xs text-slate-500">
              <span>Show</span>
              <select 
                value={itemsPerPageJurnal} 
                onChange={(e) => setItemsPerPageJurnal(Number(e.target.value))} 
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 outline-none focus:border-[#e94640] cursor-pointer"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={25}>25</option>
              </select>
           </div>
           <div className="flex gap-2">
              <button 
                onClick={() => setPageJurnal(p => Math.max(1, p - 1))} 
                disabled={pageJurnal === 1} 
                className="p-1.5 border rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-500 transition-colors"
              >
                <ChevronLeftIcon className="h-4 w-4"/>
              </button>
              <span className="text-xs font-medium text-slate-600 px-2 flex items-center">{pageJurnal} / {totalPagesJurnal}</span>
              <button 
                onClick={() => setPageJurnal(p => Math.min(totalPagesJurnal, p + 1))} 
                disabled={pageJurnal === totalPagesJurnal} 
                className="p-1.5 border rounded hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-white text-slate-500 transition-colors"
              >
                <ChevronRightIcon className="h-4 w-4"/>
              </button>
           </div>
        </div>
      )}

      {/* 5. MODAL FORM */}
      {isJurnalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {isEditJurnal ? "Edit Jurnal" : "Tambah Jurnal"}
              </h3>
              <button onClick={() => setIsJurnalModalOpen(false)}>
                <XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            
            <form onSubmit={handleSaveJurnal} className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Tema Pembelajaran</label>
                <input 
                  type="text" 
                  required 
                  value={formJurnal.tema} 
                  onChange={e => setFormJurnal({...formJurnal, tema: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none" 
                  placeholder="Misal: Diri Sendiri"
                />
              </div>

              <div className="grid grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Pilar Karakter</label>
                  <input 
                    type="text" 
                    required 
                    value={formJurnal.pilar_karakter} 
                    onChange={e => setFormJurnal({...formJurnal, pilar_karakter: e.target.value})} 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none"
                    placeholder="Contoh: Mandiri"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Pembiasaan</label>
                  <input 
                    type="text" 
                    value={formJurnal.pembiasaan} 
                    onChange={e => setFormJurnal({...formJurnal, pembiasaan: e.target.value})} 
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none"
                    placeholder="Contoh: Berdoa"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Isi Jurnal Kegiatan</label>
                <textarea 
                  rows={4} 
                  required 
                  value={formJurnal.jurnal} 
                  onChange={e => setFormJurnal({...formJurnal, jurnal: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none resize-none"
                  placeholder="Deskripsikan kegiatan..."
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsJurnalModalOpen(false)} 
                  className="px-4 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#e94640] text-white rounded-lg text-sm font-medium hover:bg-[#d63d38] transition-colors shadow-sm"
                >
                  Simpan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}