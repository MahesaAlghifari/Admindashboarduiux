import { useState, useEffect, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  CheckCircleIcon,
  XCircleIcon,
  BookOpenIcon, 
  BookmarkSquareIcon,
  ArrowPathIcon,
  AdjustmentsHorizontalIcon,
  PlusIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// Menggunakan Master Data yang sama dengan Tab Pembelajaran
import { DATA_PEMBELAJARAN_DUMMY } from "../../../data/dummyPembelajaran";

// --- INITIAL DATA ---
const INITIAL_KURIKULUM_OPTIONS = [
  { id: "km_2025", label: "Kurikulum Merdeka (2025/2026)", desc: "Fokus pada pengembangan karakter dan kompetensi." },
  { id: "km_2024", label: "Kurikulum Merdeka (2024/2025)", desc: "Versi terdahulu." },
  { id: "k13_rev", label: "Kurikulum 2013 (Revisi)", desc: "Berbasis kompetensi inti dan dasar." },
];

// Simulasi Database Config
const INITIAL_DB_CONFIG = {
  "km_2025": [1, 2, 3, 4, 11, 12, 14, 24, 25], 
  "km_2024": [1, 5, 6, 9, 10], 
  "k13_rev": [3, 4, 7, 8, 18, 19, 20] 
};

const ASPEK_OPTIONS = [
  "Nilai Agama & Moral",
  "Fisik Motorik",
  "Kognitif",
  "Bahasa",
  "Sosial Emosional",
  "Seni",
];

export default function Kurikulum() {
  // --- STATE UTAMA ---
  const [kurikulumList, setKurikulumList] = useState(INITIAL_KURIKULUM_OPTIONS);
  const [databaseConfig, setDatabaseConfig] = useState(INITIAL_DB_CONFIG);
  const [selectedKurikulumId, setSelectedKurikulumId] = useState("km_2025");
  
  // State Filter Tabel
  const [search, setSearch] = useState("");
  const [filterAspek, setFilterAspek] = useState("Semua");
  const [filterStatus, setFilterStatus] = useState("Semua"); 

  // State Checklist Aktif (Indikator terpilih)
  const [activeIds, setActiveIds] = useState([]);
  
  // State Modal Tambah Kurikulum
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKurikulumName, setNewKurikulumName] = useState("");
  
  const [isSaving, setIsSaving] = useState(false);

  // --- EFFECT: LOAD DATA SAAT GANTI KURIKULUM ---
  useEffect(() => {
    const currentConfig = databaseConfig[selectedKurikulumId] || [];
    setActiveIds(currentConfig);
  }, [selectedKurikulumId, databaseConfig]);

  // --- LOGIC FILTERING ---
  const filteredData = useMemo(() => {
    return DATA_PEMBELAJARAN_DUMMY.filter((item) => {
      const matchSearch = 
        item.sub_aspek.toLowerCase().includes(search.toLowerCase()) ||
        item.kode.toLowerCase().includes(search.toLowerCase()) ||
        item.indikator.toLowerCase().includes(search.toLowerCase());
      
      const matchAspek = filterAspek === "Semua" ? true : item.aspek === filterAspek;

      const isActive = activeIds.includes(item.id);
      let matchStatus = true;
      if (filterStatus === "Aktif") matchStatus = isActive;
      if (filterStatus === "Tidak Aktif") matchStatus = !isActive;

      return matchSearch && matchAspek && matchStatus;
    });
  }, [search, filterAspek, filterStatus, activeIds]);

  // --- LOGIC GROUPING (ROWSPAN) ---
  const groupedData = useMemo(() => {
    const rows = [];
    filteredData.forEach((item, index) => {
      const isNewAspek = index === 0 || item.aspek !== filteredData[index - 1].aspek;
      const isNewSub = index === 0 || item.sub_aspek !== filteredData[index - 1].sub_aspek || isNewAspek;

      let aspekCount = 0;
      if (isNewAspek) aspekCount = filteredData.slice(index).filter(r => r.aspek === item.aspek).length;

      let subCount = 0;
      if (isNewSub) subCount = filteredData.slice(index).filter(r => r.sub_aspek === item.sub_aspek && r.aspek === item.aspek).length;

      rows.push({
        ...item,
        aspekRowSpan: isNewAspek ? aspekCount : 0,
        subRowSpan: isNewSub ? subCount : 0,
      });
    });
    return rows;
  }, [filteredData]);

  // --- HANDLERS ---
  
  const toggleSelection = (id) => {
    setActiveIds((prev) => 
      prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    const visibleIds = filteredData.map(d => d.id);
    const allSelected = visibleIds.every(id => activeIds.includes(id));

    if (allSelected) {
      setActiveIds(prev => prev.filter(id => !visibleIds.includes(id)));
    } else {
      const newIds = [...new Set([...activeIds, ...visibleIds])];
      setActiveIds(newIds);
    }
  };

  const handleSaveConfig = () => {
    setIsSaving(true);
    setTimeout(() => {
      setDatabaseConfig(prev => ({
        ...prev,
        [selectedKurikulumId]: activeIds 
      }));
      setIsSaving(false);
      alert(`Konfigurasi untuk ${kurikulumList.find(k => k.id === selectedKurikulumId).label} berhasil disimpan!`);
    }, 800);
  };

  const handleSaveNewKurikulum = (e) => {
    e.preventDefault();
    if (!newKurikulumName.trim()) return;

    const newId = `custom_${Date.now()}`;
    const newKurikulum = { 
      id: newId, 
      label: newKurikulumName, 
      desc: "Kurikulum Kustom Baru" 
    };

    setKurikulumList([...kurikulumList, newKurikulum]);
    setDatabaseConfig(prev => ({ ...prev, [newId]: [] }));
    setSelectedKurikulumId(newId);
    
    setNewKurikulumName("");
    setIsAddModalOpen(false);
  };

  const activeCurriculum = kurikulumList.find(k => k.id === selectedKurikulumId);
  const totalMaster = DATA_PEMBELAJARAN_DUMMY.length;
  const totalActive = activeIds.length;
  const percentage = Math.round((totalActive / totalMaster) * 100);

  // Minimalist Badge Colors (Softer, no borders)
  const getBadgeColor = (aspek) => {
    switch (aspek) {
      case "Nilai Agama & Moral": return "bg-green-100 text-green-800";
      case "Fisik Motorik": return "bg-blue-100 text-blue-800";
      case "Kognitif": return "bg-purple-100 text-purple-800";
      case "Bahasa": return "bg-orange-100 text-orange-800";
      case "Sosial Emosional": return "bg-rose-100 text-rose-800";
      case "Seni": return "bg-pink-100 text-pink-800";
      default: return "bg-slate-100 text-slate-700";
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. CONFIGURATION SECTION (CLEANER) */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        
        {/* Left: Select Curriculum */}
        <div className="w-full lg:max-w-2xl space-y-4">
           <div>
             <h2 className="text-lg font-bold text-slate-900">Konfigurasi Kurikulum</h2>
             <p className="text-slate-500 text-sm">Pilih kurikulum dasar yang akan digunakan untuk tahun ajaran ini.</p>
           </div>
           
           <div className="flex gap-2">
              <div className="relative flex-1 group">
                 <select
                  value={selectedKurikulumId}
                  onChange={(e) => setSelectedKurikulumId(e.target.value)}
                  className="w-full pl-4 pr-10 py-2.5 bg-white border border-slate-300 rounded-lg text-sm font-medium text-slate-800 focus:border-[#e94640] focus:ring-2 focus:ring-[#e94640]/10 outline-none cursor-pointer appearance-none transition-all hover:border-slate-400"
                >
                  {kurikulumList.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-3 pointer-events-none text-slate-500">
                   <AdjustmentsHorizontalIcon className="h-5 w-5" />
                </div>
              </div>
              
              <button 
                onClick={() => setIsAddModalOpen(true)}
                className="p-2.5 rounded-lg border border-slate-300 bg-white text-slate-600 hover:text-[#e94640] hover:border-[#e94640] hover:bg-slate-50 transition-all"
                title="Tambah Kurikulum"
              >
                <PlusIcon className="h-5 w-5" />
              </button>
           </div>

           {/* Description Badge */}
           <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 text-xs font-medium text-slate-600">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              {activeCurriculum?.desc}
           </div>
        </div>

        {/* Right: Stats & Action */}
        <div className="w-full lg:w-auto flex flex-col items-end gap-4">
           <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Indikator Terpilih</p>
                <p className="text-2xl font-bold text-slate-900 leading-none mt-1">
                   {totalActive} <span className="text-sm font-medium text-slate-400 text-base">/ {totalMaster}</span>
                </p>
              </div>
              
              {/* Minimalist Progress Circle */}
              <div className="relative w-12 h-12">
                 <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-slate-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-[#e94640] transition-all duration-1000 ease-out" strokeDasharray={`${percentage}, 100`} d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-slate-700">
                    {percentage}%
                 </div>
              </div>
           </div>

           <button 
             onClick={handleSaveConfig}
             disabled={isSaving}
             className="flex items-center gap-2 bg-[#e94640] hover:bg-[#d63d38] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
           >
             {isSaving ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <BookmarkSquareIcon className="h-4 w-4" />}
             {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
           </button>
        </div>
      </div>

      <hr className="border-slate-100" />

      {/* 2. FILTER BAR (MINIMALIST) */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex gap-3 w-full md:w-auto">
           {/* Filter Aspek */}
           <div className="relative w-full md:w-48">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FunnelIcon className="h-4 w-4" /></div>
              <select 
                value={filterAspek} 
                onChange={(e) => setFilterAspek(e.target.value)} 
                className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none cursor-pointer appearance-none"
              >
                <option value="Semua">Semua Aspek</option>
                {ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
           </div>
           
           {/* Filter Status */}
           <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)} 
              className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none cursor-pointer"
           >
              <option value="Semua">Semua Status</option>
              <option value="Aktif">Aktif</option>
              <option value="Tidak Aktif">Tidak Aktif</option>
           </select>
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MagnifyingGlassIcon className="h-4 w-4" /></div>
           <input 
             type="text" 
             placeholder="Cari indikator..." 
             value={search} 
             onChange={(e) => setSearch(e.target.value)} 
             className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none transition-all placeholder:text-slate-400" 
           />
        </div>
      </div>

      {/* 3. TABLE DATA (MINIMALIST) */}
      <div className="border border-slate-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  <input 
                    type="checkbox" 
                    onChange={toggleSelectAll}
                    checked={filteredData.length > 0 && filteredData.every(d => activeIds.includes(d.id))}
                    className="w-4 h-4 text-[#e94640] border-slate-300 rounded focus:ring-[#e94640] cursor-pointer accent-[#e94640]"
                  />
                </th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Aspek</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Sub Aspek</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Kode</th>
                <th className="px-4 py-3 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Indikator</th>
                <th className="px-4 py-3 text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {groupedData.map((item) => {
                const isSelected = activeIds.includes(item.id);
                return (
                  <tr key={item.id} className={`group hover:bg-slate-50 transition-colors ${isSelected ? 'bg-slate-50/50' : ''}`}>
                    <td className="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelection(item.id)}
                        className="w-4 h-4 text-[#e94640] border-slate-300 rounded focus:ring-[#e94640] cursor-pointer accent-[#e94640]"
                      />
                    </td>
                    {item.aspekRowSpan > 0 && (
                      <td className="px-4 py-3 align-top bg-white" rowSpan={item.aspekRowSpan}>
                        <span className={`inline-flex px-2 py-1 rounded text-[10px] font-bold ${getBadgeColor(item.aspek)}`}>{item.aspek}</span>
                      </td>
                    )}
                    {item.subRowSpan > 0 && (
                      <td className="px-4 py-3 align-top text-xs font-semibold text-slate-700 bg-white" rowSpan={item.subRowSpan}>{item.sub_aspek}</td>
                    )}
                    <td className="px-4 py-3 text-xs font-mono text-slate-500 align-top">{item.kode}</td>
                    <td className="px-4 py-3 text-xs text-slate-600 align-top leading-relaxed">{item.indikator}</td>
                    <td className="px-4 py-3 text-center align-top">
                      {isSelected ? (
                        <CheckCircleIcon className="h-5 w-5 text-emerald-500 mx-auto" />
                      ) : (
                        <div className="h-5 w-5 mx-auto rounded-full border border-slate-200"></div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {groupedData.length === 0 && (
                <tr><td colSpan="6" className="px-6 py-12 text-center text-slate-400 text-sm">Data tidak ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ================= MODAL TAMBAH KURIKULUM (CLEANER) ================= */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm overflow-hidden border border-slate-100">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Tambah Kurikulum</h3>
              <button onClick={() => setIsAddModalOpen(false)}><XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <form onSubmit={handleSaveNewKurikulum} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5">Nama Kurikulum</label>
                <input 
                  type="text" 
                  required 
                  value={newKurikulumName} 
                  onChange={(e) => setNewKurikulumName(e.target.value)}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none" 
                  placeholder="Misal: Kurikulum 2026/2027"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors">Batal</button>
                <button type="submit" className="px-4 py-2 rounded-lg bg-[#e94640] text-white text-sm font-medium hover:bg-[#d63d38] transition-colors">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}