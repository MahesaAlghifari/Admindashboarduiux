import { useState, useMemo, useEffect } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  XMarkIcon,
  PlusCircleIcon,
  FolderPlusIcon,
  DocumentPlusIcon,
  ExclamationTriangleIcon
} from "@heroicons/react/24/outline";

import { DATA_PEMBELAJARAN_DUMMY } from "../../../data/dummyPembelajaran";

const ASPEK_MAP = {
  "Nilai Agama & Moral": 1,
  "Fisik Motorik": 2,
  "Kognitif": 3,
  "Bahasa": 4,
  "Sosial Emosional": 5,
  "Seni": 6,
};
const ASPEK_OPTIONS = Object.keys(ASPEK_MAP);

export default function Indikator() {
  const [data, setData] = useState(DATA_PEMBELAJARAN_DUMMY);
  const [search, setSearch] = useState("");
  const [filterAspek, setFilterAspek] = useState("Semua");
  
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10); 
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); 
  const [lockedFields, setLockedFields] = useState([]); 
  const [hiddenFields, setHiddenFields] = useState([]);
  const [editContext, setEditContext] = useState(null); 

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [form, setForm] = useState({ 
    id: null, kode: "", aspek: "", sub_aspek: "", indikator: "" 
  });

  // --- FILTERING & SORTING ---
  const filteredData = useMemo(() => {
    return data.filter((item) => {
      const matchSearch = item.sub_aspek.toLowerCase().includes(search.toLowerCase()) || 
                          item.kode.toLowerCase().includes(search.toLowerCase()) || 
                          item.indikator.toLowerCase().includes(search.toLowerCase());
      const matchAspek = filterAspek === "Semua" ? true : item.aspek === filterAspek;
      return matchSearch && matchAspek;
    });
  }, [data, search, filterAspek]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      const aspekDiff = a.aspek.localeCompare(b.aspek);
      if (aspekDiff !== 0) return aspekDiff;
      if (a.kode === "-" || b.kode === "-") return 0;
      // Sort numeric kode dengan benar (misal 4.3.2 vs 4.3.10)
      return a.kode.localeCompare(b.kode, undefined, { numeric: true, sensitivity: 'base' });
    });
  }, [filteredData]);

  useEffect(() => { setCurrentPage(1); }, [search, filterAspek, itemsPerPage]);

  const totalItems = sortedData.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // --- GROUPING LOGIC ---
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

  // --- HELPERS BARU: GENERATE SMART CODE ---
  const generateSmartCode = (aspekName, subAspekName) => {
    if (!aspekName) return "";

    const aspekId = ASPEK_MAP[aspekName] || 99;
    
    // Ambil semua data di aspek ini
    const aspectItems = data.filter(d => d.aspek === aspekName);

    // 1. Tentukan Bagian Tengah (ID Sub Aspek)
    let subId = 1;
    
    // Cek apakah sub aspek ini sudah ada sebelumnya (dan punya kode valid)
    const existingSub = aspectItems.find(d => 
        d.sub_aspek.toLowerCase() === subAspekName.toLowerCase() && d.kode !== "-" && d.kode.split('.').length >= 2
    );

    if (existingSub) {
        // Jika ada, pakai ID tengah milik dia
        const parts = existingSub.kode.split('.');
        subId = parseInt(parts[1]) || 1;
    } else {
        // Jika sub aspek BARU, cari angka tengah terbesar di aspek ini, lalu + 1
        const allSubIds = aspectItems
            .map(d => {
                const parts = d.kode.split('.');
                return (parts.length >= 2 && !isNaN(parts[1])) ? parseInt(parts[1]) : 0;
            });
        
        const maxSubId = allSubIds.length > 0 ? Math.max(...allSubIds) : 0;
        subId = maxSubId + 1;
    }

    // 2. Tentukan Bagian Akhir (Urutan Indikator)
    // Ambil item yang sub aspeknya sama persis
    const subItems = aspectItems.filter(d => d.sub_aspek.toLowerCase() === subAspekName.toLowerCase());
    
    const indIds = subItems
        .map(d => {
            const parts = d.kode.split('.');
            return (parts.length === 3 && !isNaN(parts[2])) ? parseInt(parts[2]) : 0;
        });
    
    const nextIndSequence = indIds.length > 0 ? Math.max(...indIds) + 1 : 1;

    // Format Akhir: [AspekID].[SubID].[IndikatorID]
    return `${aspekId}.${subId}.${nextIndSequence}`;
  };

  const availableSubAspeks = useMemo(() => {
    const subs = data.filter(d => d.aspek === form.aspek && d.sub_aspek !== "-").map(d => d.sub_aspek);
    return [...new Set(subs)];
  }, [data, form.aspek]);

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

  // --- HANDLERS UTAMA ---
  const openModal = (mode, contextItem = null, contextType = null) => {
    setModalMode(mode);
    setEditContext(null); 

    let locks = [];
    let hiddens = [];
    let initialForm = { id: null, kode: "-", aspek: "", sub_aspek: "-", indikator: "-" };

    if (mode === 'create') {
      if (!contextItem && !contextType) {
         // TAMBAH ASPEK BARU
         initialForm.aspek = "";
         hiddens = ['sub_aspek', 'kode', 'indikator'];
      }
      else if (contextType === 'add_sub_to_aspek') {
         // TAMBAH SUB ASPEK KE ASPEK YG ADA
         initialForm.aspek = contextItem.aspek;
         initialForm.sub_aspek = ""; 
         locks = ['aspek'];
         hiddens = ['kode', 'indikator'];
      } 
      else if (contextType === 'add_ind_to_sub') {
         // TAMBAH INDIKATOR KE SUB YG ADA (Disini kita generate kode otomatis)
         initialForm.aspek = contextItem.aspek;
         initialForm.sub_aspek = contextItem.sub_aspek;
         
         // Generate Kode Berurutan di sini!
         initialForm.kode = generateSmartCode(contextItem.aspek, contextItem.sub_aspek);
         
         initialForm.indikator = "";
         locks = ['aspek', 'sub_aspek']; 
      }
    } else if (mode === 'edit') {
      initialForm = { ...contextItem };
      if (contextType === 'edit_aspek_group') {
          setEditContext('aspek_group');
          hiddens = ['sub_aspek', 'kode', 'indikator'];
      } else if (contextType === 'edit_sub_group') {
          setEditContext('sub_group');
          locks = ['aspek'];
          hiddens = ['kode', 'indikator'];
      } else {
          setEditContext('item');
          locks = ['aspek', 'sub_aspek'];
      }
    }

    setForm(initialForm);
    setLockedFields(locks);
    setHiddenFields(hiddens);
    setIsModalOpen(true);
  };

  // Efek samping: Jika user mengetik sub aspek baru di form (saat buat baru), update kodenya real-time
  const handleSubAspekChange = (e) => {
      const newSub = e.target.value;
      
      // Jika field kode TIDAK disembunyikan dan TIDAK di-lock, kita update otomatis
      if (!hiddenFields.includes('kode') && !lockedFields.includes('kode')) {
           const newCode = generateSmartCode(form.aspek, newSub);
           setForm(prev => ({ ...prev, sub_aspek: newSub, kode: newCode }));
      } else {
           setForm(prev => ({ ...prev, sub_aspek: newSub }));
      }
  };

  const handleSaveModal = (e) => {
    e.preventDefault();
    const payload = { 
        ...form,
        sub_aspek: hiddenFields.includes('sub_aspek') ? "-" : form.sub_aspek,
        kode: hiddenFields.includes('kode') ? "-" : form.kode,
        indikator: hiddenFields.includes('indikator') ? "-" : form.indikator,
    };

    if (modalMode === 'create') {
        setData(prev => [...prev, { ...payload, id: Date.now() }]);
    } else {
        setData(prev => {
            if (editContext === 'aspek_group') {
                const oldItem = prev.find(p => p.id === form.id);
                return prev.map(item => item.aspek === oldItem.aspek ? { ...item, aspek: form.aspek } : item);
            } else if (editContext === 'sub_group') {
                const oldItem = prev.find(p => p.id === form.id);
                return prev.map(item => (item.aspek === oldItem.aspek && item.sub_aspek === oldItem.sub_aspek) ? { ...item, sub_aspek: form.sub_aspek } : item);
            } else {
                return prev.map(item => item.id === form.id ? payload : item);
            }
        });
    }
    setIsModalOpen(false);
  };

  const confirmDeleteAction = () => {
    if (!deleteTarget) return;
    const { type, value, extraValue, id } = deleteTarget;

    setData(prev => {
        if (type === 'row') return prev.filter(item => item.id !== id);
        if (type === 'group_aspek') return prev.filter(item => item.aspek !== value);
        if (type === 'group_sub') return prev.filter(item => !(item.aspek === value && item.sub_aspek === extraValue));
        return prev;
    });

    setIsDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const triggerDelete = (target) => {
      setDeleteTarget(target);
      setIsDeleteModalOpen(true);
  };

  const ActionButtons = ({ onEdit, onDelete, onAdd, addTitle }) => (
    <div className="flex items-center gap-1">
      {onAdd && (
         <button onClick={onAdd} title={addTitle} className="p-1 text-slate-400 hover:text-emerald-500 transition-colors">
            {addTitle.includes("Sub") ? <FolderPlusIcon className="h-4 w-4" /> : <DocumentPlusIcon className="h-4 w-4" />}
         </button>
      )}
      <button onClick={onEdit} title="Edit" className="p-1 text-slate-400 hover:text-amber-500 transition-colors">
        <PencilSquareIcon className="h-4 w-4" />
      </button>
      <button onClick={onDelete} title="Hapus" className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
        <TrashIcon className="h-4 w-4" />
      </button>
    </div>
  );

  const getInputClass = (fieldName) => {
      const baseClass = "w-full border rounded-lg px-3 py-2 text-sm outline-none transition-colors ";
      const activeClass = "bg-white border-slate-200 text-slate-700 focus:border-[#e94640]";
      const disabledClass = "bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed select-none";
      return baseClass + (lockedFields.includes(fieldName) ? disabledClass : activeClass);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* HEADER */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Aspek Pembelajaran</h2>
            <p className="text-slate-500 text-sm">Kelola standar tingkat pencapaian perkembangan anak.</p>
          </div>
          <button onClick={() => openModal('create')} className="flex items-center gap-2 bg-[#e94640] hover:bg-[#d63d38] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm">
            <PlusCircleIcon className="h-5 w-5" /> <span>Tambah Aspek</span>
          </button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="relative w-full md:w-56"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><FunnelIcon className="h-4 w-4" /></div><select value={filterAspek} onChange={(e) => setFilterAspek(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-600 focus:border-[#e94640] outline-none cursor-pointer"><option value="Semua">Semua Aspek</option>{ASPEK_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}</select></div>
        <div className="relative w-full md:w-72"><div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400"><MagnifyingGlassIcon className="h-4 w-4" /></div><input type="text" placeholder="Cari indikator..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#e94640] outline-none" /></div>
      </div>

      {/* --- TABLE --- */}
      <div className="border border-slate-200 rounded-lg overflow-hidden bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Aspek Perkembangan</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-1/4">Sub Aspek</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider w-24">Kode</th>
                <th className="px-6 py-4 text-left text-[11px] font-bold text-slate-400 uppercase tracking-wider">Indikator Pencapaian</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {groupedData.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  
                  {/* KOLOM ASPEK */}
                  {item.aspekRowSpan > 0 && (
                    <td className="px-6 py-4 align-top bg-white border-r border-slate-50" rowSpan={item.aspekRowSpan}>
                      <div className="flex justify-between items-start gap-2">
                        <span className={`inline-flex px-2.5 py-1 rounded text-[10px] font-bold ${getBadgeColor(item.aspek)}`}>
                          {item.aspek}
                        </span>
                        <ActionButtons 
                           onEdit={() => openModal('edit', item, 'edit_aspek_group')} 
                           onDelete={() => triggerDelete({ type: 'group_aspek', value: item.aspek })}
                           onAdd={() => openModal('create', item, 'add_sub_to_aspek')}
                           addTitle="Tambah Sub Aspek"
                        />
                      </div>
                    </td>
                  )}

                  {/* KOLOM SUB ASPEK */}
                  {item.subRowSpan > 0 && (
                    <td className="px-6 py-4 align-top bg-white border-r border-slate-50" rowSpan={item.subRowSpan}>
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-xs font-semibold text-slate-700 leading-relaxed max-w-[180px]">
                           {item.sub_aspek === "-" ? <span className="text-slate-300 italic">Belum ada sub aspek</span> : item.sub_aspek}
                        </span>
                        {item.aspek !== "-" && (
                            <ActionButtons 
                                onEdit={() => item.sub_aspek !== "-" ? openModal('edit', item, 'edit_sub_group') : null} 
                                onDelete={() => triggerDelete({ type: 'group_sub', value: item.aspek, extraValue: item.sub_aspek })}
                                onAdd={() => openModal('create', item, 'add_ind_to_sub')} 
                                addTitle="Tambah Indikator"
                            />
                        )}
                      </div>
                    </td>
                  )}

                  {/* KOLOM KODE */}
                  <td className="px-6 py-4 text-xs font-mono text-slate-500 align-top">{item.kode === "-" ? "" : item.kode}</td>
                  
                  {/* KOLOM INDIKATOR */}
                  <td className="px-6 py-4 align-top">
                    <div className="flex justify-between items-start gap-4">
                        <span className="text-xs text-slate-600 leading-relaxed flex-1">
                            {item.indikator === "-" ? <span className="text-slate-300 italic">Belum ada indikator</span> : item.indikator}
                        </span>
                        <div className="shrink-0">
                            {item.indikator !== "-" && (
                                <ActionButtons 
                                    onEdit={() => openModal('edit', item, 'edit_ind')} 
                                    onDelete={() => triggerDelete({ type: 'row', id: item.id })}
                                />
                            )}
                        </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalItems > 0 && (
           <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center"><div className="text-xs text-slate-500">Hal {currentPage} dari {totalPages}</div><div className="flex gap-2"><button onClick={() => setCurrentPage(p=>Math.max(1, p-1))} className="p-1 border rounded hover:bg-slate-50"><ChevronLeftIcon className="h-4 w-4 text-slate-500"/></button><button onClick={() => setCurrentPage(p=>Math.min(totalPages, p+1))} className="p-1 border rounded hover:bg-slate-50"><ChevronRightIcon className="h-4 w-4 text-slate-500"/></button></div></div>
        )}
      </div>

      {/* --- MODAL FORM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                {modalMode === 'create' ? "Tambah Data" : "Edit Data"}
              </h3>
              <button onClick={() => setIsModalOpen(false)}><XMarkIcon className="h-5 w-5 text-slate-400 hover:text-slate-600" /></button>
            </div>
            
            <form onSubmit={handleSaveModal} className="p-6 space-y-5">
              <div className="grid grid-cols-2 gap-5">
                
                {/* FIELD ASPEK */}
                <div className={hiddenFields.includes('aspek') ? 'hidden' : 'col-span-2'}>
                  <label className="block text-xs font-medium text-slate-500 mb-1.5">Nama Aspek</label>
                  <input 
                    type="text"
                    required
                    value={form.aspek} 
                    disabled={lockedFields.includes('aspek')} 
                    onChange={e => setForm({...form, aspek: e.target.value})} 
                    className={getInputClass('aspek')}
                    placeholder="Contoh: Nilai Agama & Moral"
                  />
                </div>

                {/* FIELD KODE */}
                {!hiddenFields.includes('kode') && (
                    <div className="col-span-2">
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Kode</label>
                        <input 
                            type="text" 
                            value={form.kode} 
                            disabled={lockedFields.includes('kode') || modalMode === 'create'}
                            onChange={e => setForm({...form, kode: e.target.value})} 
                            className={getInputClass('kode') + " font-mono"} 
                        />
                    </div>
                )}
              </div>
              
              {/* FIELD SUB ASPEK */}
              {!hiddenFields.includes('sub_aspek') && (
                <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Sub Aspek</label>
                    <input 
                        type="text" 
                        required 
                        list={!lockedFields.includes('sub_aspek') ? "sub-suggestions" : ""} 
                        value={form.sub_aspek} 
                        disabled={lockedFields.includes('sub_aspek')} 
                        onChange={handleSubAspekChange} 
                        className={getInputClass('sub_aspek')}
                        placeholder="Nama Sub Aspek..." 
                    />
                    {!lockedFields.includes('sub_aspek') && (
                        <datalist id="sub-suggestions">{availableSubAspeks.map((sub, idx) => <option key={idx} value={sub} />)}</datalist>
                    )}
                </div>
              )}
              
              {/* FIELD INDIKATOR */}
              {!hiddenFields.includes('indikator') && (
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1.5">Indikator</label>
                    <textarea 
                        rows={4} 
                        required 
                        disabled={lockedFields.includes('indikator')}
                        value={form.indikator} 
                        onChange={e => setForm({...form, indikator: e.target.value})} 
                        className={getInputClass('indikator') + " resize-none"} 
                        placeholder="Deskripsi indikator..."
                    />
                  </div>
              )}

              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg text-slate-500 text-sm font-medium hover:bg-slate-50">Batal</button>
                <button type="submit" className="px-4 py-2 bg-[#e94640] text-white rounded-lg text-sm font-medium hover:bg-[#d63d38]">Simpan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DELETE CONFIRMATION --- */}
      {isDeleteModalOpen && deleteTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 backdrop-blur-[2px] p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mb-4">
                    <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">Konfirmasi Hapus</h3>
                <p className="text-sm text-slate-500 mb-6">
                    Apakah Anda yakin ingin menghapus 
                    {deleteTarget.type === 'row' ? ' indikator ini' : 
                     deleteTarget.type === 'group_aspek' ? ` seluruh aspek "${deleteTarget.value}"` : 
                     ` sub aspek "${deleteTarget.extraValue}"`}? 
                </p>
                <div className="flex gap-3 justify-center">
                    <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2.5 rounded-lg border text-slate-600 text-sm font-medium hover:bg-slate-50 w-full">Batal</button>
                    <button onClick={confirmDeleteAction} className="px-4 py-2.5 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 w-full shadow-sm">Ya, Hapus</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}