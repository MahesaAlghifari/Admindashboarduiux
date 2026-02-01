import { useState, useMemo, useRef } from "react";
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  FaceSmileIcon,
  FaceFrownIcon,
  NoSymbolIcon,
  SparklesIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  XCircleIcon,
  CalendarDaysIcon,
  PauseCircleIcon // Icon untuk tombol libur
} from "@heroicons/react/24/outline";

import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa";

// --- KONFIGURASI TOMBOL (CLEAN STYLE) ---
const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

const RADIO_CONFIG = {
  makanan: [
    { 
      id: "Habis", 
      label: "Habis", 
      icon: <CheckCircleIcon className="h-5 w-5" />, 
      base: "bg-white border-slate-200 text-slate-400 hover:border-emerald-200 hover:text-emerald-500", 
      active: "bg-emerald-50 border-emerald-200 text-emerald-600 ring-1 ring-emerald-100 shadow-sm" 
    },
    { 
      id: "Tersisa", 
      label: "Sisa", 
      icon: <ExclamationCircleIcon className="h-5 w-5" />, 
      base: "bg-white border-slate-200 text-slate-400 hover:border-amber-200 hover:text-amber-500", 
      active: "bg-amber-50 border-amber-200 text-amber-600 ring-1 ring-amber-100 shadow-sm" 
    },
    { 
      id: "Tidak", 
      label: "Tdk", 
      icon: <XCircleIcon className="h-5 w-5" />, 
      base: "bg-white border-slate-200 text-slate-400 hover:border-rose-200 hover:text-rose-500", 
      active: "bg-rose-50 border-rose-200 text-rose-600 ring-1 ring-rose-100 shadow-sm" 
    }
  ],
  perasaan: [
    { label: "Senang", icon: <FaceSmileIcon className="h-5 w-5" />, base: "text-slate-400 hover:text-emerald-500 hover:bg-emerald-50", active: "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-sm" },
    { label: "Sedih", icon: <FaceFrownIcon className="h-5 w-5" />, base: "text-slate-400 hover:text-blue-500 hover:bg-blue-50", active: "bg-blue-50 text-blue-600 ring-1 ring-blue-200 shadow-sm" },
    { label: "Lelah", icon: <NoSymbolIcon className="h-5 w-5" />, base: "text-slate-400 hover:text-amber-500 hover:bg-amber-50", active: "bg-amber-50 text-amber-600 ring-1 ring-amber-200 shadow-sm" },
    { label: "Lainnya", icon: <SparklesIcon className="h-5 w-5" />, base: "text-slate-400 hover:text-purple-500 hover:bg-purple-50", active: "bg-purple-50 text-purple-600 ring-1 ring-purple-200 shadow-sm" }
  ]
};

// Helper Dates
const getDatesOfWeek = (weekString) => {
  if (!weekString) return {};
  const [year, week] = weekString.split('-W');
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay());
  
  const dates = {};
  DAYS.forEach((day, index) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + index);
    dates[day] = d.toISOString().split('T')[0];
  });
  return dates;
};

export default function AktivitasHarian() {
  // --- STATE ---
  const [selectedWeek, setSelectedWeek] = useState("2025-W30");
  const [selectedClass, setSelectedClass] = useState("all"); 
  const [searchSiswa, setSearchSiswa] = useState("");
  const [selectedDay, setSelectedDay] = useState("Senin"); 

  // STATE 1: GLOBAL CLASS ACTIVITY (Include isHoliday status)
  const [globalActivity, setGlobalActivity] = useState(() => {
    const init = {};
    DAYS.forEach(day => { 
        init[day] = { 
            jurnal: "", 
            pilar: "", 
            aktivitas: "", 
            pembiasaan: "",
            isHoliday: false // Default False
        }; 
    });
    return init;
  });

  // STATE 2: PERSONAL DATA
  const [studentLogs, setStudentLogs] = useState({});

  const filteredSiswa = useMemo(() => {
    return DATA_SISWA_DUMMY.filter(s => {
      const matchClass = selectedClass === "all" ? true : s.class_id === Number(selectedClass);
      const matchName = s.peserta_didik.nama_lengkap.toLowerCase().includes(searchSiswa.toLowerCase());
      return matchClass && matchName;
    });
  }, [selectedClass, searchSiswa]);

  const weekDates = useMemo(() => getDatesOfWeek(selectedWeek), [selectedWeek]);

  // --- HANDLERS ---
  const handlePersonalChange = (studentId, field, value) => {
    const key = `${selectedWeek}_${studentId}_${selectedDay}`;
    setStudentLogs(prev => ({
      ...prev,
      [key]: { ...prev[key], [field]: value }
    }));
  };

  const handleGlobalChange = (field, value) => {
    setGlobalActivity(prev => ({
      ...prev,
      [selectedDay]: { ...prev[selectedDay], [field]: value }
    }));
  };

  // Toggle Holiday Status for the selected day
  const handleToggleHoliday = () => {
    setGlobalActivity(prev => ({
        ...prev,
        [selectedDay]: {
            ...prev[selectedDay],
            isHoliday: !prev[selectedDay].isHoliday
        }
    }));
  };

  const handleSave = () => {
    if (globalActivity[selectedDay].isHoliday) {
        alert(`Status libur untuk hari ${selectedDay} berhasil disimpan.`);
    } else {
        alert(`Data Aktivitas hari ${selectedDay} berhasil disimpan!`);
    }
  };

  // Cek apakah hari yang dipilih sedang libur
  const isCurrentDayHoliday = globalActivity[selectedDay].isHoliday;

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      
      {/* --- TOOLBAR --- */}
      <div className="bg-white pb-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Aktivitas Harian</h1>
            <p className="text-sm text-slate-500 mt-1">
              Input jurnal kegiatan kelas dan refleksi siswa per hari.
            </p>
          </div>
        </div>

        {/* Filters & Tabs */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center border-t border-slate-100 pt-6">
          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
             <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hari:</span>
                <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                    {DAYS.map(day => {
                        const isDayHoliday = globalActivity[day]?.isHoliday;
                        return (
                            <button
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap flex items-center gap-2 ${
                                    selectedDay === day 
                                    ? 'bg-white text-[#e94640] shadow-sm ring-1 ring-slate-200' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                            >
                                {day}
                                {isDayHoliday && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Libur"></span>}
                            </button>
                        );
                    })}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium ml-2 hidden sm:flex bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-100">
                    <CalendarDaysIcon className="h-4 w-4 text-[#e94640]" />
                    {weekDates[selectedDay] ? new Date(weekDates[selectedDay]).toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' }) : "-"}
                </div>
             </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            <input 
                type="week" 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)} 
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] bg-white shadow-sm transition-all focus:shadow cursor-pointer" 
            />
            <div className="relative">
                <select 
                    value={selectedClass} 
                    onChange={(e) => setSelectedClass(e.target.value)} 
                    className="pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#e94640] cursor-pointer appearance-none font-medium min-w-[140px] shadow-sm transition-all focus:shadow"
                >
                    <option value="all">Semua Kelas</option>
                    {DATA_KELAS_DUMMY.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* KONDISI: JIKA HARI LIBUR, TAMPILKAN BANNER KHUSUS */}
      {/* ========================================================= */}
      
      {isCurrentDayHoliday ? (
        <div className="bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 p-12 flex flex-col items-center justify-center mb-6 animate-in fade-in zoom-in-95">
            <div className="p-4 bg-white rounded-full shadow-sm mb-4">
                <SparklesIcon className="h-10 w-10 text-amber-400" />
            </div>
            <h2 className="text-xl font-bold text-slate-700">Hari ini Diliburkan</h2>
            <p className="text-slate-500 mt-2 text-center max-w-md">
                Tidak ada kegiatan kelas atau input refleksi siswa yang perlu diisi pada hari ini.
            </p>
            <button 
                onClick={handleToggleHoliday}
                className="mt-6 px-5 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 hover:text-slate-900 transition-all shadow-sm"
            >
                Batalkan Libur (Aktifkan Input)
            </button>
        </div>
      ) : (
        <>
          {/* --- GLOBAL INPUT (KEGIATAN KELAS) - NORMAL MODE --- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-red-50 text-[#e94640] rounded-lg">
                    <ClipboardDocumentListIcon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm uppercase tracking-wide">Rencana Kegiatan Kelas</h3>
              </div>
              
              {/* TOMBOL SET LIBUR */}
              <button 
                onClick={handleToggleHoliday}
                className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 bg-slate-50 rounded-lg border border-slate-200 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                <PauseCircleIcon className="h-4 w-4" />
                Set Hari Libur
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {["jurnal", "pilar", "aktivitas", "pembiasaan"].map(field => (
                <div key={field}>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1.5 block ml-1">{field}</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 transition-all placeholder-slate-300 hover:border-slate-300"
                    placeholder={`Isi ${field}...`}
                    value={globalActivity[selectedDay][field]}
                    onChange={(e) => handleGlobalChange(field, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* --- TABEL INPUT SISWA - NORMAL MODE --- */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-20">
            
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col md:flex-row justify-between items-center gap-3 bg-white">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                <UserCircleIcon className="h-5 w-5 text-slate-400" />
                Input Refleksi Siswa
              </h3>
              <div className="relative w-full md:w-72">
                <input type="text" placeholder="Cari nama siswa..." value={searchSiswa} onChange={(e) => setSearchSiswa(e.target.value)} className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-200 transition-all shadow-sm focus:shadow" />
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="bg-slate-50 sticky top-0 z-20 shadow-sm ring-1 ring-slate-900/5">
                  <tr>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase w-12">No</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase w-56">Siswa</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase w-48">Makan</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase w-48">Perasaan</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase w-48">Barang Bawaan</th>
                    <th className="px-4 py-3 text-left text-[10px] font-bold text-slate-500 uppercase min-w-[220px]">Catatan Guru</th>
                    <th className="px-4 py-3 text-center text-[10px] font-bold text-slate-500 uppercase w-24">Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredSiswa.map((siswa, index) => {
                    const key = `${selectedWeek}_${siswa.id}_${selectedDay}`;
                    const data = studentLogs[key] || {};

                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-4 py-5 text-center text-slate-400 text-xs font-mono align-top pt-6">{index + 1}</td>
                        
                        {/* INFO SISWA */}
                        <td className="px-4 py-5 align-top">
                          <div className="text-sm font-bold text-slate-700 group-hover:text-[#e94640] transition-colors">{siswa.peserta_didik.nama_lengkap}</div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">{siswa.peserta_didik.nomor_induk}</div>
                        </td>

                        {/* INPUT: MAKANAN */}
                        <td className="px-4 py-5 align-top">
                          <div className="flex gap-2 justify-center">
                            {RADIO_CONFIG.makanan.map((opt) => {
                              const isSelected = data.makanan === opt.id;
                              return (
                                <button
                                  key={opt.id}
                                  onClick={() => handlePersonalChange(siswa.id, "makanan", opt.id)}
                                  title={opt.label}
                                  className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200 border ${isSelected ? opt.active : opt.base}`}
                                >
                                  {opt.icon}
                                </button>
                              );
                            })}
                          </div>
                        </td>

                        {/* INPUT: PERASAAN */}
                        <td className="px-4 py-5 align-top">
                          <div className="flex gap-1 justify-center bg-white p-1 w-fit mx-auto">
                            {RADIO_CONFIG.perasaan.map((opt) => {
                              const isSelected = data.perasaan === opt.label;
                              return (
                                <button 
                                  key={opt.label}
                                  onClick={() => handlePersonalChange(siswa.id, "perasaan", opt.label)}
                                  title={opt.label}
                                  className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all duration-200 ${isSelected ? opt.active : opt.base}`}
                                >
                                  {opt.icon}
                                </button>
                              )
                            })}
                          </div>
                        </td>

                        {/* INPUT: BARANG BAWAAN */}
                        <td className="px-4 py-5 align-top">
                          <input 
                            type="text" 
                            value={data.barang_bawaan || ""} 
                            onChange={(e) => handlePersonalChange(siswa.id, "barang_bawaan", e.target.value)} 
                            placeholder="..." 
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 transition-all placeholder-slate-300 hover:border-slate-300" 
                          />
                        </td>

                        {/* INPUT: CATATAN GURU */}
                        <td className="px-4 py-5 align-top">
                          <textarea 
                            rows={2} 
                            value={data.catatan_guru || ""} 
                            onChange={(e) => handlePersonalChange(siswa.id, "catatan_guru", e.target.value)} 
                            className="w-full text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 resize-none placeholder-slate-300 transition-all hover:border-slate-300" 
                            placeholder="Catatan..." 
                          />
                        </td>

                        {/* INPUT: DOKUMENTASI */}
                        <td className="px-4 py-5 align-top text-center">
                          <MiniImageUpload 
                            value={data.dokumentasi} 
                            onChange={(file) => handlePersonalChange(siswa.id, "dokumentasi", file)}
                          />
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="px-6 py-4 border-t border-slate-100 bg-white flex justify-between items-center sticky bottom-0 z-30 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
              <div className="text-xs text-slate-500 font-medium">
                Total Siswa: <span className="font-bold text-slate-900">{filteredSiswa.length}</span>
              </div>
              <button 
                onClick={handleSave} 
                className="px-6 py-2.5 bg-[#e94640] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#d63d38] hover:shadow transition-all flex items-center gap-2"
              >
                <DocumentTextIcon className="h-4 w-4" />
                Simpan Data
              </button>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

// --- MINI COMPONENT FOR UPLOAD (CLEAN) ---
function MiniImageUpload({ value, onChange }) {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      onChange({ file, previewUrl });
    }
  };

  return (
    <div className="flex justify-center">
      {value ? (
        <div className="relative group w-10 h-10 bg-slate-50 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md transition-all" onClick={() => onChange(null)}>
          <img src={value.previewUrl} alt="Doc" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white backdrop-blur-[1px]">
            <TrashIcon className="h-4 w-4"/>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center justify-center w-10 h-10 border border-dashed border-slate-300 rounded-lg cursor-pointer bg-white hover:border-[#e94640] hover:text-[#e94640] transition-all group text-slate-400">
          <PhotoIcon className="w-4 h-4" />
          <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
        </label>
      )}
    </div>
  );
}