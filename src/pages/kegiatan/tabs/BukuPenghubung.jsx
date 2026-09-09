import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  FunnelIcon,
  ChatBubbleBottomCenterTextIcon,
  ArrowDownTrayIcon,
  XMarkIcon
} from "@heroicons/react/24/outline";

// Import Data Dummy
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const METRICS = [
  { label: "Jam Tidur", unit: "", placeholder: "21.00 - 05.00" },
  { label: "Anak BAB ?", unit: "", type: "select", options: ["Tidak", "Ya"] },
  { label: "Suhu Tubuh", unit: "°C", type: "number", placeholder: "36" },
  { label: "Menu Sarapan", unit: "", type: "text", placeholder: "Nasi Goreng" }
];

export default function BukuPenghubung() {
  // --- STATE ---
  const [viewMode, setViewMode] = useState("list");
  const [selectedClass, setSelectedClass] = useState("all"); 
  const [searchSiswa, setSearchSiswa] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedWeek, setSelectedWeek] = useState("2025-W30");

  // Data State
  const [penghubungData, setPenghubungData] = useState({});

  // --- FILTER ---
  const filteredSiswa = useMemo(() => {
    return DATA_SISWA_DUMMY.filter(s => {
      const matchClass = selectedClass === "all" ? true : s.class_id === Number(selectedClass);
      const matchName = s.peserta_didik.nama_lengkap.toLowerCase().includes(searchSiswa.toLowerCase());
      return matchClass && matchName;
    });
  }, [selectedClass, searchSiswa]);

  // --- HANDLERS ---
  const handleOpenDetail = (student) => {
    setSelectedStudent(student);
    setViewMode("detail");
  };

  const handleBackToList = () => {
    setSelectedStudent(null);
    setViewMode("list");
  };

  const handlePenghubungChange = (day, field, value) => {
    if (!selectedStudent) return;
    const key = `${selectedWeek}_${selectedStudent.id}`;
    setPenghubungData(prev => ({
      ...prev,
      [key]: { 
        ...prev[key], 
        [day]: { 
          ...prev[key]?.[day], 
          [field]: value 
        } 
      }
    }));
  };

  const handleSave = () => {
    alert(`Data buku penghubung ${selectedStudent.peserta_didik.nama_lengkap} berhasil disimpan!`);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      
      {/* =================================================================================
          VIEW 1: LIST DAFTAR SISWA
         ================================================================================= */}
      {viewMode === "list" && (
        <>
          {/* --- TOOLBAR SECTION --- */}
          <div className="bg-white pb-6 space-y-6">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Buku Penghubung</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Komunikasi harian dan pemantauan aktivitas siswa.
                </p>
              </div>
            </div>

            {/* --- FILTERS --- */}
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center border-t border-slate-100 pt-6">
              
              {/* LEFT: CLASS TABS */}
              <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas:</span>
                  <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                    <button
                      onClick={() => setSelectedClass("all")}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${
                        selectedClass === "all"
                          ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                          : "text-slate-500 hover:text-slate-700"
                      }`}
                    >
                      Semua Kelas
                    </button>
                    {DATA_KELAS_DUMMY.map((k) => (
                      <button
                        key={k.id}
                        onClick={() => setSelectedClass(k.id)}
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${
                          selectedClass === k.id
                            ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                            : "text-slate-500 hover:text-slate-700"
                        }`}
                      >
                        {k.nama}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* RIGHT: SEARCH */}
              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                <div className="relative">
                    <input 
                        type="text" 
                        placeholder="Cari nama siswa..." 
                        value={searchSiswa} 
                        onChange={(e) => setSearchSiswa(e.target.value)} 
                        className="w-full xl:w-64 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-200 transition-all shadow-sm focus:shadow" 
                    />
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>
          </div>

          {/* --- TABLE LIST --- */}
          <div className="flex-1 relative border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm ring-1 ring-slate-900/5">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-16">No</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nomor Induk</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSiswa.length > 0 ? (
                  filteredSiswa.map((siswa, index) => (
                    <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{index + 1}</td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-[#e94640] transition-colors">
                          {siswa.peserta_didik.nama_lengkap}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-mono text-slate-500">{siswa.peserta_didik.nomor_induk}</td>
                      <td className="px-6 py-4 text-right">
                        {/* TOMBOL AKSI: OUTLINE STYLE */}
                        <button 
                          onClick={() => handleOpenDetail(siswa)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:border-[#e94640] hover:text-[#e94640] hover:bg-red-50 transition-all shadow-sm whitespace-nowrap"
                        >
                          <PencilSquareIcon className="h-4 w-4 shrink-0" /> Input Jurnal
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                      <FunnelIcon className="h-12 w-12 mb-3 opacity-20" />
                      <span className="text-sm">Tidak ada siswa ditemukan.</span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* =================================================================================
          VIEW 2: DETAIL SISWA (INPUT JURNAL)
         ================================================================================= */}
      {viewMode === "detail" && selectedStudent && (
        <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full space-y-6">
          
          {/* Header Detail */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button 
                onClick={handleBackToList}
                className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all"
                title="Kembali"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{selectedStudent.peserta_didik.nama_lengkap}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {selectedStudent.peserta_didik.nomor_induk}
                  </span>
                  <span className="text-xs text-slate-400">•</span>
                  <span className="text-xs text-slate-500 font-medium">Buku Penghubung Digital</span>
                </div>
              </div>
            </div>

            <div className="flex bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-medium text-xs items-center gap-2 border border-blue-100 shadow-sm">
              <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
              Jurnal Harian
            </div>
          </div>

          {/* CARD INPUT JURNAL */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1">
            
            {/* Toolbar Input */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="flex items-center gap-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Input Data Mingguan</h3>
                  <p className="text-xs text-slate-500">Isi indikator harian dan catatan komunikasi.</p>
                </div>
                <div className="h-8 w-px bg-slate-200 hidden md:block"></div>
                <div className="flex items-center gap-2">
                  <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
                  <input 
                    type="week" 
                    value={selectedWeek} 
                    onChange={(e) => setSelectedWeek(e.target.value)} 
                    className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-[#e94640] bg-white transition-all shadow-sm focus:shadow cursor-pointer" 
                  />
                </div>
              </div>
            </div>

            {/* Tabel Input Scrollable */}
            <div className="overflow-auto flex-1">
              <table className="min-w-full divide-y divide-slate-200 border-collapse">
                <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-4 py-3 border-r border-slate-200 w-28 text-center text-xs font-bold text-slate-500 uppercase">Hari</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-48 text-left text-xs font-bold text-slate-500 uppercase">Indikator</th>
                    <th className="px-4 py-3 border-r border-slate-200 w-64 text-left text-xs font-bold text-slate-500 uppercase">Hasil / Nilai</th>
                    <th className="px-4 py-3 border-r border-slate-200 bg-amber-50 text-amber-700 text-left text-xs font-bold uppercase">Catatan Orang Tua</th>
                    <th className="px-4 py-3 bg-blue-50 text-blue-700 text-left text-xs font-bold uppercase">Catatan Guru</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {DAYS.map((day) => {
                    const dayData = penghubungData[`${selectedWeek}_${selectedStudent.id}`]?.[day] || {};
                    return (
                      <>
                        {METRICS.map((metric, idx) => (
                          <tr key={`${day}-${idx}`} className="hover:bg-slate-50 group">
                            {idx === 0 && (
                              <td rowSpan={METRICS.length} className="px-4 py-4 font-bold text-slate-700 text-center border-r border-slate-200 bg-slate-50/30 align-middle">
                                {day}
                              </td>
                            )}
                            
                            {/* Label */}
                            <td className="px-4 py-2 border-r border-slate-200 text-slate-600 font-medium">
                              {metric.label}
                            </td>
                            
                            {/* Input / Select (CLEAN STYLE) */}
                            <td className="px-2 py-1 border-r border-slate-200">
                              {metric.type === 'select' ? (
                                <select 
                                  value={dayData[metric.label] || ""} 
                                  onChange={(e) => handlePenghubungChange(day, metric.label, e.target.value)} 
                                  className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 text-sm transition-all cursor-pointer"
                                >
                                  <option value="">- Pilih -</option>
                                  {metric.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                </select>
                              ) : (
                                <div className="relative">
                                  <input 
                                    type={metric.type || "text"} 
                                    value={dayData[metric.label] || ""} 
                                    onChange={(e) => handlePenghubungChange(day, metric.label, e.target.value)} 
                                    placeholder={metric.placeholder || "..."} 
                                    className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 text-sm transition-all placeholder-slate-300" 
                                  />
                                  {metric.unit && <span className="absolute right-3 top-1.5 text-xs text-slate-400 pointer-events-none">{metric.unit}</span>}
                                </div>
                              )}
                            </td>

                            {/* Textareas (CLEAN STYLE) */}
                            {idx === 0 && (
                              <>
                                <td rowSpan={METRICS.length} className="p-2 border-r border-slate-200 align-top bg-amber-50/20">
                                  <textarea 
                                    value={dayData['catatan_ortu'] || ""} 
                                    onChange={(e) => handlePenghubungChange(day, 'catatan_ortu', e.target.value)} 
                                    className="w-full h-full min-h-[160px] p-3 bg-white/60 border border-amber-100 rounded-lg resize-none focus:outline-none focus:bg-white focus:border-amber-300 focus:ring-1 focus:ring-amber-200 transition-all text-xs placeholder-slate-400 leading-relaxed" 
                                    placeholder="Tulis pesan dari rumah..." 
                                  />
                                </td>
                                <td rowSpan={METRICS.length} className="p-2 align-top bg-blue-50/20">
                                  <textarea 
                                    value={dayData['catatan_guru'] || ""} 
                                    onChange={(e) => handlePenghubungChange(day, 'catatan_guru', e.target.value)} 
                                    className="w-full h-full min-h-[160px] p-3 bg-white/60 border border-blue-100 rounded-lg resize-none focus:outline-none focus:bg-white focus:border-blue-300 focus:ring-1 focus:ring-blue-200 transition-all text-xs placeholder-slate-400 leading-relaxed" 
                                    placeholder="Tulis pesan dari sekolah..." 
                                  />
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                        <tr><td colSpan="5" className="bg-slate-100 h-2 border-t border-slate-200"></td></tr>
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* --- FOOTER ACTIONS (SIMPAN & CANCEL) --- */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 sticky bottom-0 z-20 shadow-[0_-4px_10px_-2px_rgba(0,0,0,0.05)]">
              <button 
                onClick={handleBackToList}
                className="px-6 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-white hover:text-slate-800 transition-all flex items-center gap-2"
              >
                <XMarkIcon className="h-4 w-4" /> Batal
              </button>
              <button 
                onClick={handleSave} 
                className="px-6 py-2.5 bg-[#e94640] text-white text-sm font-bold rounded-lg shadow-sm hover:bg-[#d63d38] hover:shadow transition-all flex items-center gap-2"
              >
                <ArrowDownTrayIcon className="h-4 w-4" /> Simpan Data
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}