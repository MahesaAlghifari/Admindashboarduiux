import { useState, useEffect } from "react";
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
  AcademicCapIcon,
  UsersIcon,
  XMarkIcon,
  FunnelIcon,
  BuildingLibraryIcon,
  PlusCircleIcon
} from "@heroicons/react/24/outline";

// --- IMPORT DATA DUMMY EKSTERNAL ---
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa"; 
import { DATA_STAFF_DUMMY } from "../../../data/dummyStaff"; 

export default function Kelas() {
  // --- STATE ---
  const [kelas, setKelas] = useState(DATA_KELAS_DUMMY);
  const [siswa, setSiswa] = useState([]);
  const [guru, setGuru] = useState([]);
  
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  
  // Form State
  const [form, setForm] = useState({
    id: null,
    nama: "",
    wali_kelas_id: "",
    selected_students: [] 
  });

  const [searchSiswaModal, setSearchSiswaModal] = useState("");

  // --- 1. INITIAL LOAD & MAPPING DATA ---
  useEffect(() => {
    // A. Mapping Data Staff -> Guru Options
    const mappedGuru = DATA_STAFF_DUMMY
      .filter(staff => {
        const jabatan = staff.kepegawaian?.jabatan || "";
        return jabatan.toLowerCase().includes("guru");
      })
      .map(staff => ({
        id: staff.id,
        nama: staff.pribadi.nama_lengkap,
        nip: staff.pribadi.nip || "-",
        jabatan: staff.kepegawaian.jabatan
      }));
    
    setGuru(mappedGuru);

    // B. Mapping Data Siswa -> Format Kelas
    if (DATA_SISWA_DUMMY && DATA_SISWA_DUMMY.length > 0) {
      const mappedSiswa = DATA_SISWA_DUMMY.map(s => {
        return {
          id: s.id,
          nama: s.peserta_didik.nama_lengkap,
          nis: s.peserta_didik.nomor_induk,
          foto: s.peserta_didik.foto,
          class_id: s.class_id || null 
        };
      });
      setSiswa(mappedSiswa);
    }
  }, []);

  // --- HANDLERS ---

  const handleOpenModal = (item = null) => {
    if (item) {
      // MODE EDIT
      setIsEdit(true);
      const currentStudents = siswa
        .filter((s) => s.class_id === item.id)
        .map((s) => s.id);

      setForm({
        id: item.id,
        nama: item.nama,
        wali_kelas_id: item.wali_kelas_id,
        selected_students: currentStudents
      });
    } else {
      // MODE TAMBAH
      setIsEdit(false);
      setForm({
        id: null,
        nama: "",
        wali_kelas_id: "",
        selected_students: []
      });
    }
    setSearchSiswaModal("");
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    
    let newClassId = form.id;

    // A. Update/Create Data Kelas
    if (isEdit) {
      setKelas(kelas.map((k) => (k.id === form.id ? { 
        ...k, 
        nama: form.nama, 
        wali_kelas_id: Number(form.wali_kelas_id) 
      } : k)));
    } else {
      newClassId = Date.now();
      const newKelas = {
        id: newClassId,
        nama: form.nama,
        wali_kelas_id: Number(form.wali_kelas_id)
      };
      setKelas([...kelas, newKelas]);
    }

    // B. Update Data Siswa
    const updatedSiswa = siswa.map((s) => {
      // 1. Jika siswa tadinya di kelas ini, tapi sekarang tidak dicentang -> Lepas kelasnya
      if (s.class_id === newClassId && !form.selected_students.includes(s.id)) {
        return { ...s, class_id: null };
      }
      // 2. Jika siswa dicentang -> Masukkan ke kelas ini
      if (form.selected_students.includes(s.id)) {
        return { ...s, class_id: newClassId };
      }
      return s;
    });

    setSiswa(updatedSiswa);
    setIsModalOpen(false);
  };

  const handleDelete = (id) => {
    if (confirm("Hapus kelas ini? Siswa di dalamnya akan menjadi status tanpa kelas.")) {
      setKelas(kelas.filter((k) => k.id !== id));
      setSiswa(siswa.map(s => s.class_id === id ? { ...s, class_id: null } : s));
    }
  };

  const toggleStudent = (studentId) => {
    setForm(prev => {
      const isSelected = prev.selected_students.includes(studentId);
      if (isSelected) {
        return { ...prev, selected_students: prev.selected_students.filter(id => id !== studentId) };
      } else {
        return { ...prev, selected_students: [...prev.selected_students, studentId] };
      }
    });
  };

  // --- LOGIC FILTERING ---
  const filteredKelas = kelas.filter(k => 
    k.nama.toLowerCase().includes(search.toLowerCase())
  );

  const availableStudents = siswa.filter(s => {
    const isNoClass = s.class_id === null;
    const isInThisClass = isEdit && s.class_id === form.id;
    const matchSearch = s.nama.toLowerCase().includes(searchSiswaModal.toLowerCase()) || s.nis.includes(searchSiswaModal);
    
    return (isNoClass || isInThisClass) && matchSearch;
  });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* 1. HEADER PAGE */}
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Manajemen Kelas</h2>
          <p className="text-slate-500 text-sm">Kelola data kelas, wali kelas, dan anggota siswa.</p>
        </div>
        <button 
          onClick={() => handleOpenModal()} 
          className="flex items-center gap-2 bg-[#e94640] hover:bg-[#d63d38] text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm"
        >
          <PlusCircleIcon className="h-5 w-5" /> 
          <span>Buat Kelas</span>
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
            placeholder="Cari kelas..." 
            value={search} 
            onChange={(e) => setSearch(e.target.value)} 
            className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-lg text-sm text-slate-700 focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none transition-all placeholder:text-slate-400" 
          />
        </div>
      </div>

      {/* 3. CLASS CARDS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredKelas.map((item) => {
          const studentCount = siswa.filter(s => s.class_id === item.id).length;
          const waliKelas = guru.find(g => g.id === item.wali_kelas_id);

          return (
            <div key={item.id} className="group bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md hover:border-[#e94640]/30 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-200 to-slate-300 group-hover:from-[#e94640] group-hover:to-orange-500 transition-all duration-500"></div>

              <div className="flex justify-between items-start mb-4">
                <div className="h-10 w-10 rounded-lg bg-slate-50 text-slate-600 flex items-center justify-center border border-slate-100">
                  <BuildingLibraryIcon className="h-5 w-5" />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(item)} className="p-1.5 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-md transition-colors"><PencilSquareIcon className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(item.id)} className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"><TrashIcon className="h-4 w-4" /></button>
                </div>
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-1">{item.nama}</h3>
              <div className="text-xs text-slate-500 mb-5 flex items-center gap-1.5">
                <UsersIcon className="h-3.5 w-3.5" />
                <span>Wali: <span className="font-semibold text-slate-700">{waliKelas ? waliKelas.nama : "Belum ditentukan"}</span></span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Anggota</span>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-md border border-slate-100">
                  <UserGroupIcon className="h-3.5 w-3.5 text-slate-500" />
                  <span className="text-xs font-bold text-slate-700">{studentCount} Siswa</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredKelas.length === 0 && (
        <div className="text-center py-20 bg-white rounded-xl border border-dashed border-slate-200">
          <div className="mx-auto h-12 w-12 text-slate-300 mb-3"><AcademicCapIcon /></div>
          <p className="text-sm text-slate-500">Belum ada data kelas yang dibuat.</p>
        </div>
      )}

      {/* 4. MODAL CONFIGURATION */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-100">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  {isEdit ? "Konfigurasi Kelas" : "Buat Kelas Baru"}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Atur informasi kelas dan anggota siswa.</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 transition-colors">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/30">
              <form id="kelasForm" onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* KOLOM KIRI: INFO KELAS */}
                <div className="lg:col-span-1 space-y-5">
                  <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Nama Kelas</label>
                        <input 
                        type="text" 
                        required 
                        value={form.nama}
                        onChange={e => setForm({...form, nama: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none"
                        placeholder="Contoh: Kelas 1A"
                        />
                    </div>
                    
                    <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1.5">Wali Kelas</label>
                        <select 
                        value={form.wali_kelas_id}
                        onChange={e => setForm({...form, wali_kelas_id: e.target.value})}
                        className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none bg-white cursor-pointer"
                        >
                        <option value="">-- Pilih Guru --</option>
                        {guru.length > 0 ? (
                            guru.map(g => (
                            <option key={g.id} value={g.id}>{g.nama}</option>
                            ))
                        ) : (
                            <option disabled>Tidak ada data Guru</option>
                        )}
                        </select>
                        <p className="text-[10px] text-slate-400 mt-1.5 leading-tight">*Hanya staff dengan jabatan "Guru" yang muncul.</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 p-5 rounded-xl border border-orange-100 flex flex-col items-center text-center">
                    <span className="text-[10px] font-bold text-orange-800 uppercase tracking-wide mb-1">Total Anggota Terpilih</span>
                    <div className="text-3xl font-bold text-orange-600">{form.selected_students.length}</div>
                    <span className="text-xs font-medium text-orange-700">Siswa</span>
                  </div>
                </div>

                {/* KOLOM KANAN: PILIH SISWA */}
                <div className="lg:col-span-2 flex flex-col h-[500px] lg:h-auto bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden">
                  <div className="p-4 border-b border-slate-100 bg-white">
                     <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                        <label className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                        Pilih Siswa 
                        <span className="ml-1 text-slate-400 font-normal normal-case">(Siswa tanpa kelas)</span>
                        </label>
                        <div className="relative w-full sm:w-56">
                            <input 
                                type="text" 
                                placeholder="Cari nama / NIS..." 
                                value={searchSiswaModal}
                                onChange={e => setSearchSiswaModal(e.target.value)}
                                className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-xs focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none"
                            />
                            <MagnifyingGlassIcon className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2" />
                        </div>
                     </div>
                  </div>

                  <div className="bg-slate-50 px-4 py-2 border-b border-slate-100 flex justify-between items-center text-[10px] font-medium text-slate-500 uppercase tracking-wide">
                    <span>Nama Siswa</span>
                    <span>{availableStudents.length === 0 ? "0 Siswa" : `${availableStudents.length} Ditemukan`}</span>
                  </div>
                  
                  <div className="overflow-y-auto flex-1 p-2 space-y-1 scrollbar-thin scrollbar-thumb-slate-200">
                    {availableStudents.map(s => {
                      const isChecked = form.selected_students.includes(s.id);
                      return (
                        <label key={s.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all duration-200 group ${isChecked ? "bg-orange-50 border-orange-200" : "bg-white border-transparent hover:bg-slate-50 border-slate-50"}`}>
                          <div className="relative flex items-center">
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => toggleStudent(s.id)}
                              className="peer h-4 w-4 text-[#e94640] border-slate-300 rounded focus:ring-[#e94640] accent-[#e94640]"
                            />
                          </div>
                          <div className="flex-1">
                            <div className={`text-xs font-bold ${isChecked ? "text-slate-800" : "text-slate-600"}`}>{s.nama}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">NIS: {s.nis}</div>
                          </div>
                          {isChecked && <CheckCircleIconSolid className="h-5 w-5 text-[#e94640] animate-in zoom-in duration-200" />}
                        </label>
                      )
                    })}
                    {availableStudents.length === 0 && (
                      <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10">
                        <FunnelIcon className="h-8 w-8 mb-2 opacity-30" />
                        <p className="text-xs">Tidak ada siswa yang tersedia.</p>
                      </div>
                    )}
                  </div>
                </div>

              </form>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 shrink-0">
              <button 
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-slate-500 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Batal
              </button>
              <button 
                type="submit"
                form="kelasForm"
                className="px-4 py-2 rounded-lg bg-[#e94640] text-white text-sm font-medium hover:bg-[#d63d38] transition-colors shadow-sm"
              >
                Simpan Konfigurasi
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// Icon Helper untuk Checkbox Aktif
function CheckCircleIconSolid(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path fillRule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm13.36-1.814a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clipRule="evenodd" />
    </svg>
  )
}   