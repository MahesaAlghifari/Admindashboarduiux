import { useState, useMemo } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  MegaphoneIcon,
  CalendarDaysIcon,
  FunnelIcon,
  XMarkIcon,
  TagIcon,
  UserGroupIcon
} from "@heroicons/react/24/outline";

// --- IMPORT DATA DUMMY DARI FILE GLOBAL ---
import { DATA_PENGUMUMAN_DUMMY } from "../../../data/dummyAdministrasi";

const TIPE_OPTIONS = ["Info", "Penting", "Kegiatan", "Libur"];
const TARGET_OPTIONS = ["Semua", "Guru", "Siswa", "Staff"];

export default function Pengumuman() {
  const [data, setData] = useState(DATA_PENGUMUMAN_DUMMY);
  const [search, setSearch] = useState("");
  const [filterTipe, setFilterTipe] = useState("Semua");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [form, setForm] = useState({ 
    id: null, 
    judul: "", 
    isi: "", 
    tanggal: new Date().toISOString().split('T')[0], 
    tipe: "Info", 
    target: "Semua" 
  });

  // --- LOGIC ---
  const filteredData = useMemo(() => {
    return data.filter(item => {
      const matchSearch = item.judul.toLowerCase().includes(search.toLowerCase()) || 
                          item.isi.toLowerCase().includes(search.toLowerCase());
      const matchTipe = filterTipe === "Semua" ? true : item.tipe === filterTipe;
      return matchSearch && matchTipe;
    }).sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal)); // Sort terbaru
  }, [data, search, filterTipe]);

  const handleSave = (e) => {
    e.preventDefault();
    if (isEdit) {
      setData(prev => prev.map(item => item.id === form.id ? form : item));
    } else {
      setData(prev => [{ ...form, id: Date.now() }, ...prev]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm("Hapus pengumuman ini?")) setData(prev => prev.filter(item => item.id !== id));
  };

  const openModal = (item = null) => {
    if (item) {
      setForm(item);
      setIsEdit(true);
    } else {
      setForm({ 
        id: null, 
        judul: "", 
        isi: "", 
        tanggal: new Date().toISOString().split('T')[0], 
        tipe: "Info", 
        target: "Semua" 
      });
      setIsEdit(false);
    }
    setIsModalOpen(true);
  };

  // Helper Badge Color
  const getBadgeColor = (tipe) => {
    switch (tipe) {
      case "Penting": return "bg-rose-50 text-rose-700 border-rose-100";
      case "Libur": return "bg-amber-50 text-amber-700 border-amber-100";
      case "Kegiatan": return "bg-emerald-50 text-emerald-700 border-emerald-100";
      default: return "bg-blue-50 text-blue-700 border-blue-100"; // Info
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pengumuman & Informasi</h2>
          <p className="text-slate-500 text-sm">Kelola papan pengumuman sekolah untuk guru dan siswa.</p>
        </div>
        <button 
          onClick={() => openModal()} 
          className="flex items-center gap-2 bg-[#e94640] hover:bg-[#d63d38] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <MegaphoneIcon className="h-5 w-5" /> 
          <span>Buat Pengumuman</span>
        </button>
      </div>

      {/* 2. FILTER & SEARCH */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-48 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FunnelIcon className="h-4 w-4" /></div>
            <select 
              value={filterTipe} 
              onChange={(e) => setFilterTipe(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-[#e94640] outline-none cursor-pointer appearance-none"
            >
              <option value="Semua">Semua Tipe</option>
              {TIPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
        </div>

        <div className="relative w-full md:w-72">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MagnifyingGlassIcon className="h-4 w-4" /></div>
            <input 
              type="text" 
              placeholder="Cari judul atau isi..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none transition-all placeholder:text-slate-400" 
            />
        </div>
      </div>

      {/* 3. TABLE LIST */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-32">Tanggal</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Judul & Isi</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-40">Target & Tipe</th>
                <th className="px-6 py-4 text-right text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredData.map((item) => (
                <tr key={item.id} className="group hover:bg-slate-50 transition-colors">
                  
                  {/* TANGGAL */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex flex-col text-slate-600">
                       <span className="text-sm font-bold">{new Date(item.tanggal).toLocaleDateString('id-ID', {day: 'numeric', month: 'short'})}</span>
                       <span className="text-xs text-slate-400">{new Date(item.tanggal).getFullYear()}</span>
                    </div>
                  </td>

                  {/* KONTEN UTAMA */}
                  <td className="px-6 py-4 align-top">
                    <div className="space-y-1">
                        <div className="text-sm font-bold text-slate-800">{item.judul}</div>
                        <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">{item.isi}</p>
                    </div>
                  </td>

                  {/* METADATA (Target & Tipe) */}
                  <td className="px-6 py-4 align-top">
                     <div className="flex flex-col gap-2 items-start">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${getBadgeColor(item.tipe)}`}>
                           {item.tipe}
                        </span>
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                           <UserGroupIcon className="h-3.5 w-3.5" />
                           <span>{item.target}</span>
                        </div>
                     </div>
                  </td>

                  {/* AKSI */}
                  <td className="px-6 py-4 text-right align-top">
                    <div className="flex justify-end gap-1">
                      <button 
                        onClick={() => openModal(item)} 
                        className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors"
                        title="Edit"
                      >
                        <PencilSquareIcon className="h-4 w-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(item.id)} 
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Hapus"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredData.length === 0 && (
                 <tr><td colSpan="4" className="px-6 py-12 text-center text-slate-400 text-sm">Tidak ada pengumuman ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. MODAL FORM */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {isEdit ? "Edit Pengumuman" : "Buat Pengumuman Baru"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}>
                <XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" />
              </button>
            </div>
            
            <form onSubmit={handleSave} className="p-6 space-y-5">
              
              {/* Judul */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Judul Pengumuman</label>
                <input 
                  type="text" 
                  required 
                  value={form.judul} 
                  onChange={e => setForm({...form, judul: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none" 
                  placeholder="Contoh: Libur Nasional..." 
                />
              </div>

              {/* Grid: Tanggal, Tipe, Target */}
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Tanggal Terbit</label>
                    <div className="relative">
                       <CalendarDaysIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
                       <input 
                         type="date" 
                         required 
                         value={form.tanggal} 
                         onChange={e => setForm({...form, tanggal: e.target.value})} 
                         className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:border-[#e94640] outline-none" 
                       />
                    </div>
                  </div>
                  <div>
                     <label className="block text-xs font-medium text-slate-500 mb-1.5">Tipe Informasi</label>
                     <div className="relative">
                        <TagIcon className="absolute left-3 top-2 h-4 w-4 text-slate-400" />
                        <select 
                          value={form.tipe} 
                          onChange={e => setForm({...form, tipe: e.target.value})} 
                          className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:border-[#e94640] outline-none cursor-pointer appearance-none"
                        >
                          {TIPE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                     </div>
                  </div>
              </div>

              {/* Target */}
              <div>
                 <label className="block text-xs font-medium text-slate-500 mb-1.5">Target Audien</label>
                 <div className="flex flex-wrap gap-2">
                    {TARGET_OPTIONS.map(opt => (
                        <label key={opt} className={`cursor-pointer border rounded-md px-3 py-1.5 text-xs font-medium transition-all ${form.target === opt ? "bg-[#e94640] text-white border-[#e94640]" : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"}`}>
                           <input 
                             type="radio" 
                             name="target" 
                             className="hidden" 
                             value={opt} 
                             checked={form.target === opt} 
                             onChange={() => setForm({...form, target: opt})} 
                           />
                           {opt}
                        </label>
                    ))}
                 </div>
              </div>
              
              {/* Isi */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Isi Pengumuman</label>
                <textarea 
                  rows={5} 
                  required 
                  value={form.isi} 
                  onChange={e => setForm({...form, isi: e.target.value})} 
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none resize-none" 
                  placeholder="Tulis detail pengumuman di sini..." 
                />
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-slate-50 mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 bg-[#e94640] text-white rounded-lg text-sm font-medium hover:bg-[#d63d38] transition-colors shadow-sm">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}