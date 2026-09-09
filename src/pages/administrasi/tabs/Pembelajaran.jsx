import { useState, useEffect, useMemo } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  BookOpenIcon, 
  ListBulletIcon,
  AdjustmentsHorizontalIcon,
  CalendarDaysIcon,
  PlusCircleIcon,
  DocumentTextIcon // Icon untuk Jurnal
} from "@heroicons/react/24/outline";

// --- IMPORT DATA DUMMY ---
import { DATA_PEMBELAJARAN_DUMMY, DATA_JURNAL_DUMMY } from "../../../data/dummyPembelajaran";

// --- KONFIGURASI UTAMA ---
const ASPEK_MAP = {
  "Nilai Agama & Moral": 1,
  "Fisik Motorik": 2,
  "Kognitif": 3,
  "Bahasa": 4,
  "Sosial Emosional": 5,
  "Seni": 6,
};

const ASPEK_OPTIONS = Object.keys(ASPEK_MAP);

const KURIKULUM_OPTIONS = [
  { id: "all", label: "Semua Data (Master)" },
  { id: "km_2025", label: "Kurikulum Merdeka 2025/2026" },
  { id: "km_2024", label: "Kurikulum Merdeka 2024/2025" },
  { id: "k13_rev", label: "Kurikulum 2013 (Revisi)" },
];

const MOCK_CURRICULUM_CONFIG = {
  "km_2025": [1, 2, 3, 4, 11, 12, 14, 24, 25], 
  "km_2024": [1, 5, 6, 9, 10],
  "k13_rev": [3, 4, 7, 8, 18, 19, 20]
};

const DATA_JADWAL_INIT = [
  { id: 1, jurnal_id: 1, tanggal: "2025-07-15" }, 
  { id: 2, jurnal_id: 2, tanggal: "2025-07-16" }, 
];

export default function Pembelajaran() {
  const [activeView, setActiveView] = useState("indikator");

  // =========================================
  // STATE 1: INDIKATOR
  // =========================================
  const [data, setData] = useState(DATA_PEMBELAJARAN_DUMMY);
  const [search, setSearch] = useState("");
  const [filterAspek, setFilterAspek] = useState("Semua");
  const [selectedKurikulum, setSelectedKurikulum] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create_new"); 
  const [form, setForm] = useState({ id: null, kode: "", aspek: ASPEK_OPTIONS[0], sub_aspek: "", indikator: "" });

  // =========================================
  // STATE 2: PERENCANAAN (JURNAL)
  // =========================================
  const [jurnalData, setJurnalData] = useState(DATA_JURNAL_DUMMY);
  const [searchJurnal, setSearchJurnal] = useState("");
  const [pageJurnal, setPageJurnal] = useState(1);
  const [itemsPerPageJurnal, setItemsPerPageJurnal] = useState(5);
  
  const [isJurnalModalOpen, setIsJurnalModalOpen] = useState(false);
  const [isEditJurnal, setIsEditJurnal] = useState(false);
  const [formJurnal, setFormJurnal] = useState({ id: null, tema: "", pilar_karakter: "", pembiasaan: "", jurnal: "" });

  // =========================================
  // STATE 3: JADWAL
  // =========================================
  const [jadwalData, setJadwalData] = useState(DATA_JADWAL_INIT);
  const [isJadwalModalOpen, setIsJadwalModalOpen] = useState(false);
  const [isEditJadwal, setIsEditJadwal] = useState(false);
  const [formJadwal, setFormJadwal] = useState({ id: null, jurnal_id: "", tanggal: "" });

  // #####################################################################
  // LOGIC 1: INDIKATOR
  // #####################################################################
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.sub_aspek.toLowerCase().includes(search.toLowerCase()) || 
                          item.kode.toLowerCase().includes(search.toLowerCase()) || 
                          item.indikator.toLowerCase().includes(search.toLowerCase());
      const matchAspek = filterAspek === "Semua" ? true : item.aspek === filterAspek;
      let matchKurikulum = true;
      if (selectedKurikulum !== "all") {
        const activeIds = MOCK_CURRICULUM_CONFIG[selectedKurikulum] || [];
        matchKurikulum = activeIds.includes(item.id);
      }
      return matchSearch && matchAspek && matchKurikulum;
    });
  }, [data, search, filterAspek, selectedKurikulum]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aspekDiff = a.aspek.localeCompare(b.aspek);
      if (aspekDiff !== 0) return aspekDiff;
      return a.kode.localeCompare(b.kode, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredData]);

  useEffect(() => { setCurrentPage(1); }, [search, filterAspek, selectedKurikulum, itemsPerPage]);
  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const groupedData = useMemo(() => {
    const rows = [];
    paginatedData.forEach((item, index) => {
      const isNewAspek = index === 0 || item.aspek !== paginatedData[index - 1].aspek;
      const isNewSub = index === 0 || item.sub_aspek !== paginatedData[index - 1].sub_aspek || isNewAspek;
      
      let aspekCount = 0;
      if (isNewAspek) aspekCount = paginatedData.slice(index).filter(r => r.aspek === item.aspek).length;
      
      let subCount = 0;
      if (isNewSub) subCount = paginatedData.slice(index).filter(r => r.sub_aspek === item.sub_aspek && r.aspek === item.aspek).length;

      rows.push({ ...item, aspekRowSpan: isNewAspek ? aspekCount : 0, subRowSpan: isNewSub ? subCount : 0 });
    });
    return rows;
  }, [paginatedData]);

  const generateAutoCode = (mode, contextData = null, selectedAspek = null) => {
    let aspekName = selectedAspek || (contextData ? contextData.aspek : ASPEK_OPTIONS[0]);
    let aspekId = ASPEK_MAP[aspekName] || 9; 
    const sameAspekData = data.filter(d => d.aspek === aspekName);

    if (mode === 'create_new') {
      if (sameAspekData.length === 0) return `${aspekId}.1.1`;
      const uniqueSubs = [...new Set(sameAspekData.map(d => d.sub_aspek))];
      return `${aspekId}.${uniqueSubs.length + 1}.1`;
    }
    if (mode === 'add_sub') {
      const uniqueSubs = [...new Set(sameAspekData.map(d => d.sub_aspek))];
      return `${aspekId}.${uniqueSubs.length + 1}.1`;
    }
    if (mode === 'add_ind') {
      const targetSub = contextData.sub_aspek;
      const sameSubData = sameAspekData.filter(d => d.sub_aspek === targetSub);
      if(sameSubData.length > 0) {
        const parts = sameSubData[0].kode.split('.'); 
        const subId = parts[1] || 1;
        return `${aspekId}.${subId}.${sameSubData.length + 1}`;
      }
      return `${aspekId}.1.1`;
    }
    return "";
  };

  const openModalIndikator = (mode, item = null) => {
    setModalMode(mode);
    if (mode === 'edit') {
      setForm(item);
    } 
    else if (mode === 'create_new') {
      const defaultAspek = ASPEK_OPTIONS[0];
      const code = generateAutoCode('create_new', null, defaultAspek);
      setForm({ id: null, kode: code, aspek: defaultAspek, sub_aspek: "", indikator: "" });
    }
    else if (mode === 'add_sub') {
      const code = generateAutoCode('add_sub', item);
      setForm({ id: null, kode: code, aspek: item.aspek, sub_aspek: "", indikator: "" });
    }
    else if (mode === 'add_ind') {
      const code = generateAutoCode('add_ind', item);
      setForm({ id: null, kode: code, aspek: item.aspek, sub_aspek: item.sub_aspek, indikator: "" });
    }
    setIsModalOpen(true);
  };

  const handleSaveIndikator = (e) => {
    e.preventDefault();
    if (modalMode === 'edit') {
      setData(data.map((item) => (item.id === form.id ? form : item)));
    } else {
      const newItem = { ...form, id: Date.now() };
      setData([...data, newItem]);
    }
    setIsModalOpen(false);
  };

  const handleDeleteIndikator = (id) => {
    if (confirm("Hapus indikator ini?")) setData(data.filter((item) => item.id !== id));
  };

  const handleAspekChange = (newAspek) => {
    const newCode = generateAutoCode('create_new', null, newAspek);
    setForm(prev => ({ ...prev, aspek: newAspek, kode: newCode }));
  };

  // #####################################################################
  // LOGIC 2: PERENCANAAN
  // #####################################################################
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

  // #####################################################################
  // LOGIC 3: JADWAL (ACTIVITY DRIVEN)
  // #####################################################################
  
  // Menggabungkan jadwal dengan detail jurnal lengkap
  const enrichedJadwal = useMemo(() => {
    return jadwalData.map(item => {
      const rencana = jurnalData.find(j => j.id === Number(item.jurnal_id));
      return { ...item, rencana }; 
    }).sort((a, b) => new Date(a.tanggal) - new Date(b.tanggal));
  }, [jadwalData, jurnalData]);

  // Helper untuk menampilkan preview di modal saat memilih jurnal
  const selectedJurnalDetail = useMemo(() => {
    if (!formJadwal.jurnal_id) return null;
    return jurnalData.find(j => j.id === Number(formJadwal.jurnal_id));
  }, [formJadwal.jurnal_id, jurnalData]);

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

  // --- Helpers ---
  const getBadgeColor = (aspek) => {
    switch (aspek) {
      case "Nilai Agama & Moral": return "bg-green-50 text-green-700 border-green-100";
      case "Fisik Motorik": return "bg-blue-50 text-blue-700 border-blue-100";
      case "Kognitif": return "bg-purple-50 text-purple-700 border-purple-100";
      case "Bahasa": return "bg-orange-50 text-orange-700 border-orange-100";
      case "Sosial Emosional": return "bg-rose-50 text-rose-700 border-rose-100";
      case "Seni": return "bg-pink-50 text-pink-700 border-pink-100";
      default: return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-10">
      
      {/* SWITCHER */}
      <div className="flex justify-center">
        <div className="bg-slate-100 p-1 rounded-xl inline-flex shadow-inner">
          <button onClick={() => setActiveView("indikator")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeView === "indikator" ? "bg-white text-[#e94640] shadow-sm" : "text-slate-500"}`}><ListBulletIcon className="h-5 w-5" /> Indikator</button>
          <button onClick={() => setActiveView("perencanaan")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeView === "perencanaan" ? "bg-white text-[#e94640] shadow-sm" : "text-slate-500"}`}><BookOpenIcon className="h-5 w-5" /> Perencanaan</button>
          <button onClick={() => setActiveView("jadwal")} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all ${activeView === "jadwal" ? "bg-white text-[#e94640] shadow-sm" : "text-slate-500"}`}><CalendarDaysIcon className="h-5 w-5" /> Jadwal</button>
        </div>
      </div>

      {/* VIEW 1: INDIKATOR */}
      {activeView === "indikator" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col xl:flex-row justify-between xl:items-center gap-6 mb-6">
              <div><h2 className="text-lg font-bold text-slate-800">Indikator Pembelajaran</h2><p className="text-slate-500 text-sm">Standar tingkat pencapaian perkembangan anak.</p></div>
              <div className="flex gap-3">
                 <button onClick={() => openModalIndikator('create_new')} className="flex items-center gap-2 bg-[#e94640] text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg hover:bg-[#d63d38] transition-all"><PlusIcon className="h-5 w-5" /> Aspek Baru</button>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-4">
               <div className="relative w-full md:w-56 group"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FunnelIcon className="h-5 w-5" /></div><select value={filterAspek} onChange={(e) => setFilterAspek(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:border-[#e94640] outline-none cursor-pointer"><option value="Semua">Semua Aspek</option>{ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
               <div className="relative w-full md:w-72 group"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MagnifyingGlassIcon className="h-5 w-5" /></div><input type="text" placeholder="Cari..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#e94640] outline-none" /></div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase border-r border-slate-100 w-1/4">Aspek</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase border-r border-slate-100 w-1/4">Sub Aspek</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-24">Kode</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Indikator</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-100">
                {groupedData.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    {item.aspekRowSpan > 0 && (
                      <td className="px-6 py-4 align-top border-r border-slate-100 bg-slate-50/30" rowSpan={item.aspekRowSpan}>
                        <div className="flex flex-col items-start gap-2">
                          <span className={`inline-flex px-3 py-1.5 rounded-lg text-xs font-bold border ${getBadgeColor(item.aspek)}`}>{item.aspek}</span>
                          <button onClick={() => openModalIndikator('add_sub', item)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-[#e94640] font-medium transition-colors mt-1"><PlusCircleIcon className="h-4 w-4" /> Tambah Sub</button>
                        </div>
                      </td>
                    )}
                    {item.subRowSpan > 0 && (
                      <td className="px-6 py-4 align-top border-r border-slate-100 text-sm font-semibold text-slate-700" rowSpan={item.subRowSpan}>
                        <div className="flex flex-col items-start gap-1">
                          <span>{item.sub_aspek}</span>
                          <button onClick={() => openModalIndikator('add_ind', item)} className="text-[10px] flex items-center gap-1 text-slate-400 hover:text-emerald-600 font-medium transition-colors mt-2"><PlusCircleIcon className="h-4 w-4" /> Tambah Indikator</button>
                        </div>
                      </td>
                    )}
                    <td className="px-6 py-4 text-sm font-mono text-slate-500 border-r border-slate-100 align-top">{item.kode}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 align-top leading-relaxed">{item.indikator}</td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openModalIndikator('edit', item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><PencilSquareIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteIndikator(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><TrashIcon className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalItems > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 text-sm text-slate-600"><span>Show</span><select value={itemsPerPage} onChange={(e) => setItemsPerPage(Number(e.target.value))} className="bg-white border rounded text-xs p-1 outline-none"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></div>
               <div className="flex gap-2"><button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button><span className="text-sm flex items-center px-2 text-slate-600">{currentPage} / {totalPages}</span><button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button></div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PERENCANAAN */}
      {activeView === "perencanaan" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <div><h2 className="text-lg font-bold text-slate-800">Perencanaan Pembelajaran</h2><p className="text-slate-500 text-sm">Tema, pilar karakter, dan jurnal harian.</p></div>
              <button onClick={() => openJurnalModal()} className="flex items-center gap-2 bg-[#e94640] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:bg-[#d63d38] transition-all"><PlusIcon className="h-5 w-5" /> Tambah Jurnal</button>
            </div>
            <div className="relative w-full md:w-80 group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MagnifyingGlassIcon className="h-5 w-5" /></div>
                <input type="text" placeholder="Cari tema / pilar..." value={searchJurnal} onChange={(e) => setSearchJurnal(e.target.value)} className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#e94640] outline-none" />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-amber-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Tema Pembelajaran</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-48">Pilar Karakter</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-48">Pembiasaan</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-1/3">Jurnal Kegiatan</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedJurnal.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 align-top"><div className="text-sm font-bold text-slate-800">{item.tema}</div></td>
                    <td className="px-6 py-4 text-sm text-slate-700 font-medium align-top">{item.pilar_karakter}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 align-top leading-relaxed">{item.pembiasaan || "-"}</td>
                    <td className="px-6 py-4 text-sm text-slate-600 italic leading-relaxed align-top">"{item.jurnal}"</td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openJurnalModal(item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><PencilSquareIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteJurnal(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><TrashIcon className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalJurnal > 0 && (
            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
               <div className="flex items-center gap-2 text-sm text-slate-600"><span>Show</span><select value={itemsPerPageJurnal} onChange={(e) => setItemsPerPageJurnal(Number(e.target.value))} className="bg-white border rounded text-xs p-1 outline-none"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></div>
               <div className="flex gap-2"><button onClick={() => setPageJurnal(p => Math.max(1, p - 1))} disabled={pageJurnal === 1} className="p-1.5 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronLeftIcon className="h-4 w-4"/></button><span className="text-sm flex items-center px-2 text-slate-600">{pageJurnal} / {totalPagesJurnal}</span><button onClick={() => setPageJurnal(p => Math.min(totalPagesJurnal, p + 1))} disabled={pageJurnal === totalPagesJurnal} className="p-1.5 bg-white border rounded hover:bg-slate-50 disabled:opacity-50"><ChevronRightIcon className="h-4 w-4"/></button></div>
            </div>
          )}
        </div>
      )}

      {/* VIEW 3: JADWAL (ACTIVITY DRIVEN) */}
      {activeView === "jadwal" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
          <div className="p-6 border-b border-slate-100">
            <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-6">
              <div><h2 className="text-lg font-bold text-slate-800">Jadwal Pembelajaran</h2><p className="text-slate-500 text-sm">Atur tanggal pelaksanaan rencana pembelajaran.</p></div>
              <button onClick={() => openJadwalModal()} className="flex items-center gap-2 bg-[#e94640] text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg hover:bg-[#d63d38] transition-all"><PlusIcon className="h-5 w-5" /> Atur Jadwal</button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50/50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase w-48">Hari & Tanggal</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase">Jurnal Kegiatan & Detail</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {enrichedJadwal.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-sm font-medium text-slate-700 align-top">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-slate-100 rounded-lg text-slate-500"><CalendarDaysIcon className="h-5 w-5" /></div>
                        <div>
                           <div className="text-sm font-bold text-slate-800">{new Date(item.tanggal).toLocaleDateString("id-ID", { weekday: 'long' })}</div>
                           <div className="text-xs text-slate-500">{new Date(item.tanggal).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 align-top">
                      {item.rencana ? (
                        <div className="flex flex-col gap-1.5">
                          {/* Main Focus: Jurnal */}
                          <div className="flex items-start gap-2">
                             <DocumentTextIcon className="h-5 w-5 text-indigo-500 mt-0.5" />
                             <span className="text-sm font-bold text-slate-800 leading-snug">{item.rencana.jurnal}</span>
                          </div>
                          
                          {/* Secondary: Details */}
                          <div className="flex flex-wrap gap-2 ml-7">
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-50 text-amber-700 border border-amber-100">
                               Tema: {item.rencana.tema}
                             </span>
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                               Pilar: {item.rencana.pilar_karakter}
                             </span>
                             <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-50 text-slate-600 border border-slate-200">
                               Pembiasaan: {item.rencana.pembiasaan || "-"}
                             </span>
                          </div>
                        </div>
                      ) : (<span className="text-xs text-rose-500 italic">Rencana dihapus</span>)}
                    </td>
                    <td className="px-6 py-4 text-right align-top">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => openJadwalModal(item)} className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg"><PencilSquareIcon className="h-5 w-5" /></button>
                        <button onClick={() => handleDeleteJadwal(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg"><TrashIcon className="h-5 w-5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================================
          MODAL INDIKATOR
         ================================================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50">
              <h3 className="text-lg font-bold text-slate-800">
                {modalMode === 'create_new' && "Tambah Aspek Baru"}
                {modalMode === 'add_sub' && "Tambah Sub Aspek"}
                {modalMode === 'add_ind' && "Tambah Indikator"}
                {modalMode === 'edit' && "Edit Data"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-6 w-6 text-slate-400" /></button>
            </div>
            <form onSubmit={handleSaveIndikator} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Kode (Auto)</label><input type="text" value={form.kode} onChange={e => setForm({...form, kode: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none bg-slate-50 text-slate-600 font-mono" readOnly={modalMode !== 'edit'} /></div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Aspek</label>
                  {modalMode === 'create_new' ? (
                    <select value={form.aspek} onChange={e => handleAspekChange(e.target.value)} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none cursor-pointer">{ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select>
                  ) : (
                    <input type="text" value={form.aspek} readOnly className="w-full border rounded-xl px-3 py-2 text-sm bg-slate-100 text-slate-500 outline-none" />
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Sub Aspek</label>
                <input type="text" required value={form.sub_aspek} onChange={e => setForm({...form, sub_aspek: e.target.value})} className={`w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none ${modalMode === 'add_ind' ? 'bg-slate-100 text-slate-500' : ''}`} readOnly={modalMode === 'add_ind'} placeholder="Nama sub aspek..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Indikator</label>
                <textarea rows={3} required value={form.indikator} onChange={e => setForm({...form, indikator: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none resize-none" placeholder="Deskripsi indikator..." />
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Batal</button>
                <button type="submit" className="px-4 py-2 bg-[#e94640] text-white rounded-xl text-sm font-semibold hover:bg-[#d63d38]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================================
          MODAL JURNAL
         ================================================================================= */}
      {isJurnalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50"><h3 className="text-lg font-bold">{isEditJurnal ? "Edit Jurnal" : "Tambah Jurnal"}</h3><button onClick={() => setIsJurnalModalOpen(false)}><XMarkIcon className="h-6 w-6 text-slate-400" /></button></div>
            <form onSubmit={handleSaveJurnal} className="p-6 space-y-4">
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Tema Pembelajaran</label><input type="text" required value={formJurnal.tema} onChange={e => setFormJurnal({...formJurnal, tema: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none" placeholder="Misal: Diri Sendiri"/></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Pilar Karakter</label><input type="text" required value={formJurnal.pilar_karakter} onChange={e => setFormJurnal({...formJurnal, pilar_karakter: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none"/></div>
                <div><label className="block text-xs font-bold text-slate-500 mb-1">Pembiasaan</label><textarea rows={1} value={formJurnal.pembiasaan} onChange={e => setFormJurnal({...formJurnal, pembiasaan: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none resize-none"/></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-500 mb-1">Isi Jurnal Kegiatan</label><textarea rows={3} required value={formJurnal.jurnal} onChange={e => setFormJurnal({...formJurnal, jurnal: e.target.value})} className="w-full border rounded-xl px-3 py-2 text-sm focus:border-[#e94640] outline-none"/></div>
              <div className="pt-4 flex justify-end gap-3 border-t mt-2"><button type="button" onClick={() => setIsJurnalModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Batal</button><button type="submit" className="px-4 py-2 bg-[#e94640] text-white rounded-xl text-sm font-semibold">Simpan</button></div>
            </form>
          </div>
        </div>
      )}

      {/* =================================================================================
          MODAL JADWAL (ACTIVITY BASED)
         ================================================================================= */}
      {isJadwalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b flex justify-between items-center bg-slate-50/50"><h3 className="text-lg font-bold">{isEditJadwal ? "Edit Jadwal" : "Atur Jadwal Baru"}</h3><button onClick={() => setIsJadwalModalOpen(false)}><XMarkIcon className="h-6 w-6 text-slate-400" /></button></div>
            <form onSubmit={handleSaveJadwal} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Pilih Kegiatan (Jurnal)</label>
                <select required value={formJadwal.jurnal_id} onChange={e => setFormJadwal({...formJadwal, jurnal_id: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:border-[#e94640] outline-none bg-white cursor-pointer">
                  <option value="">-- Pilih Kegiatan --</option>
                  {jurnalData.map(j => (<option key={j.id} value={j.id}>{j.jurnal} (Tema: {j.tema})</option>))}
                </select>
                
                {/* AUTO FILL / PREVIEW CARD */}
                {selectedJurnalDetail && (
                  <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
                    <div className="flex justify-between"><span className="text-slate-500">Tema:</span> <span className="font-semibold text-slate-700">{selectedJurnalDetail.tema}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Pilar:</span> <span className="font-semibold text-slate-700">{selectedJurnalDetail.pilar_karakter}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Pembiasaan:</span> <span className="font-semibold text-slate-700">{selectedJurnalDetail.pembiasaan || "-"}</span></div>
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 mb-1">Tanggal Pelaksanaan</label>
                <input type="date" required value={formJadwal.tanggal} onChange={e => setFormJadwal({...formJadwal, tanggal: e.target.value})} className="w-full border rounded-xl px-3 py-2.5 text-sm focus:border-[#e94640] outline-none" />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t mt-2"><button type="button" onClick={() => setIsJadwalModalOpen(false)} className="px-4 py-2 border rounded-xl text-sm font-semibold">Batal</button><button type="submit" className="px-4 py-2 bg-[#e94640] text-white rounded-xl text-sm font-semibold">Simpan Jadwal</button></div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}