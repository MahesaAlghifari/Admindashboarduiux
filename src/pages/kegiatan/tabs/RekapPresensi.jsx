import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  FunnelIcon,
  ChevronDownIcon,
  EyeIcon,
  XMarkIcon,
  CalendarDaysIcon
} from "@heroicons/react/24/outline";

// --- IMPORT DATA DARI 2 FILE TERPISAH ---
// Pastikan path import ini sesuai dengan struktur folder Anda
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa";
import { DATA_ABSENSI_DUMMY } from "../../../data/dummyAbsensi";

export default function RekapPresensi() {
  // --- STATE ---
  const [filterType, setFilterType] = useState("weekly"); // Default mingguan
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchSiswa, setSearchSiswa] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);

  // Filter Values (Kosmetik UI)
  const [selectedWeek, setSelectedWeek] = useState("2025-W30");
  const [selectedMonth, setSelectedMonth] = useState("2025-07");
  const [selectedSemester, setSelectedSemester] = useState("ganjil");
  const [selectedYear, setSelectedYear] = useState("2025");

  // --- LOGIC PENGOLAHAN DATA ---
  // Mengambil data mentah dari DATA_ABSENSI_DUMMY dan memotongnya sesuai filterType
  const processedAttendanceData = useMemo(() => {
    const result = {};

    DATA_SISWA_DUMMY.forEach(student => {
      // Ambil data mentah 90 hari
      const rawData = DATA_ABSENSI_DUMMY[student.id];
      
      if (!rawData) {
          result[student.id] = { history: [], stats: { h:0, s:0, i:0, a:0, percentage:0 } };
          return;
      }

      // Tentukan jumlah hari yang diambil (Slice)
      let sliceCount = 90; 
      if (filterType === 'weekly') sliceCount = 5;   // Ambil 5 hari
      if (filterType === 'monthly') sliceCount = 20; // Ambil 20 hari

      // Ambil data history (Kita ambil dari array awal)
      const filteredHistory = rawData.history.slice(0, sliceCount);

      // Hitung Ulang Total (H/S/I/A) berdasarkan data yang sudah dipotong
      const h = filteredHistory.filter(d => d.status === 'H').length;
      const s = filteredHistory.filter(d => d.status === 'S').length;
      const i = filteredHistory.filter(d => d.status === 'I').length;
      const a = filteredHistory.filter(d => d.status === 'A').length;
      
      const totalDays = filteredHistory.length;
      const percentage = totalDays > 0 ? Math.round((h / totalDays) * 100) : 0;

      // Simpan hasil
      result[student.id] = {
          history: filteredHistory,
          stats: { h, s, i, a, percentage }
      };
    });

    return result;
  }, [filterType]); // Recalculate hanya jika filterType berubah

  // --- FILTER SISWA (Pencarian & Kelas) ---
  const filteredSiswa = useMemo(() => {
    return DATA_SISWA_DUMMY.filter(s => {
      const matchClass = selectedClass === "all" ? true : s.class_id === Number(selectedClass);
      const matchName = s.peserta_didik.nama_lengkap.toLowerCase().includes(searchSiswa.toLowerCase());
      return matchClass && matchName;
    });
  }, [selectedClass, searchSiswa]);

  // --- HELPER NAMA KELAS ---
  const getClassName = (classId) => {
      const found = DATA_KELAS_DUMMY.find(k => k.id === classId);
      return found ? found.nama : "-";
  };

  // --- HANDLERS ---
  const handleOpenModal = (student) => {
      setSelectedStudent(student);
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setSelectedStudent(null);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      
      {/* --- TOOLBAR SECTION --- */}
      <div className="bg-white pb-6 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Rekapitulasi Absensi</h1>
            <p className="text-sm text-slate-500 mt-1">
              Data kehadiran siswa untuk keperluan administrasi dan rapor.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-colors border border-slate-200 shadow-sm">
            <ArrowDownTrayIcon className="h-4 w-4" /> Export Data
          </button>
        </div>

        {/* --- MAIN FILTERS ROW --- */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center border-t border-slate-100 pt-6">
          
          {/* LEFT: CLASS TABS (Segmented Control Style) */}
          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas:</span>
              
              <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                {/* Tab Semua Kelas */}
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

                {/* Tab Dinamis Kelas */}
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

          {/* RIGHT: PERIOD & SEARCH */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            
            {/* 1. Filter Type (Dropdown) */}
            <div className="relative">
                <select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)} 
                    className="pl-3 pr-8 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#e94640] cursor-pointer appearance-none shadow-sm font-medium min-w-[120px]"
                >
                    <option value="weekly">Mingguan</option>
                    <option value="monthly">Bulanan</option>
                    <option value="semester">Semester</option>
                </select>
                <ChevronDownIcon className="h-3 w-3 absolute right-3 top-3 text-slate-400 pointer-events-none"/>
            </div>

            {/* 2. Dynamic Date Inputs */}
            {filterType === 'weekly' && (
                <input type="week" value={selectedWeek} onChange={(e) => setSelectedWeek(e.target.value)} 
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] bg-white shadow-sm" />
            )}
            
            {filterType === 'monthly' && (
                <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} 
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] bg-white shadow-sm" />
            )}
            
            {filterType === 'semester' && (
                <div className="flex gap-2">
                    <select value={selectedYear} onChange={(e) => setSelectedYear(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] bg-white shadow-sm cursor-pointer"><option value="2024">2024</option><option value="2025">2025</option></select>
                    <select value={selectedSemester} onChange={(e) => setSelectedSemester(e.target.value)} className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] bg-white shadow-sm cursor-pointer"><option value="ganjil">Ganjil</option><option value="genap">Genap</option></select>
                </div>
            )}

            {/* 3. Search */}
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cari siswa..." 
                    value={searchSiswa} 
                    onChange={(e) => setSearchSiswa(e.target.value)} 
                    className="w-full xl:w-56 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-200 transition-all shadow-sm" 
                />
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>

          </div>
        </div>
      </div>

      {/* --- TABLE SECTION (SUMMARY ONLY) --- */}
      <div className="flex-1 relative border border-slate-200 rounded-xl overflow-hidden mb-6">
        <div className="overflow-auto h-full">
            <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm ring-1 ring-slate-900/5">
                <tr>
                  <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                  <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Nomor Induk</th>
                  <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider min-w-[200px]">Nama Siswa</th>
                  {selectedClass === 'all' && (
                      <th className="px-4 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Kelas</th>
                  )}
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase border-l border-slate-200/50 w-20">Hadir</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase w-20">Sakit</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase w-20">Izin</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-600 uppercase w-20">Alfa</th>
                  <th className="px-6 py-4 text-center text-xs font-semibold text-slate-600 uppercase border-l border-slate-200 w-32">% Hadir</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase w-20">Detail</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSiswa.length > 0 ? (
                filteredSiswa.map((siswa, index) => {
                    // Ambil Data Processed (bukan random)
                    const data = processedAttendanceData[siswa.id] || { stats: { h:0, s:0, i:0, a:0, percentage:0 } };
                    const { stats } = data;

                    return (
                    <tr key={siswa.id} onClick={() => handleOpenModal(siswa)} className="hover:bg-slate-50 transition-colors group cursor-pointer">
                        <td className="px-6 py-4 text-center text-sm text-slate-500 font-mono">{index + 1}</td>
                        <td className="px-4 py-4 text-sm text-slate-500 font-mono">
                            {siswa.peserta_didik.nomor_induk}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-slate-700 transition-colors">{siswa.peserta_didik.nama_lengkap}</div>
                        </td>
                        {selectedClass === 'all' && (
                            <td className="px-4 py-4">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs bg-slate-100 text-slate-800">
                                    {getClassName(siswa.class_id)}
                                </span>
                            </td>
                        )}
                        <td className="px-4 py-4 text-center text-sm border-l border-slate-50">{stats.h}</td>
                        <td className="px-4 py-4 text-center text-sm">{stats.s}</td>
                        <td className="px-4 py-4 text-center text-sm">{stats.i}</td>
                        <td className="px-4 py-4 text-center text-sm">{stats.a}</td>
                        <td className="px-6 py-4 text-center border-l border-slate-50">
                            <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-bold border ${
                                stats.percentage >= 80 ? 'bg-green-50 text-green-700 border-green-100' : 
                                stats.percentage >= 50 ? 'bg-yellow-50 text-yellow-700 border-yellow-100' : 
                                'bg-red-50 text-red-700 border-red-100'
                            }`}>
                                {`${stats.percentage}%`}
                            </span>
                        </td>
                        <td className="px-4 py-4 text-center">
                            <button onClick={(e) => {e.stopPropagation(); handleOpenModal(siswa)}} className="p-2 text-slate-400 hover:text-[#e94640] hover:bg-red-50 rounded-lg transition-all">
                                <EyeIcon className="h-5 w-5" />
                            </button>
                        </td>
                    </tr>
                    );
                })
                ) : (
                <tr>
                    <td colSpan={selectedClass === 'all' ? 10 : 9} className="py-12 text-center text-slate-400">
                      <FunnelIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                      <span className="text-sm">Data tidak ditemukan</span>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
        
        {/* Footer */}
        <div className="border-t border-slate-200 bg-slate-50 p-4 flex justify-between items-center text-sm text-slate-500">
            <span>Total: <span className="font-semibold text-slate-700">{filteredSiswa.length}</span> Siswa</span>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 text-xs font-medium bg-white shadow-sm">Prev</button>
              <button className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 text-xs font-medium bg-white shadow-sm">Next</button>
            </div>
        </div>
      </div>

      {/* --- POPUP DETAIL --- */}
      {isModalOpen && selectedStudent && processedAttendanceData[selectedStudent.id] && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200">
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900">Detail Kehadiran</h3>
                        <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                            <span className="font-medium text-slate-700">{selectedStudent.peserta_didik.nama_lengkap}</span>
                            <span>•</span>
                            <span className="font-mono">{selectedStudent.peserta_didik.nomor_induk}</span>
                            <span>•</span>
                            <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">{getClassName(selectedStudent.class_id)}</span>
                        </div>
                    </div>
                    <button onClick={handleCloseModal} className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                        <XMarkIcon className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-6 overflow-y-auto">
                    {/* Ringkasan Popup */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col items-center">
                            <span className="text-xs font-bold text-emerald-600 uppercase mb-1">Hadir</span>
                            <span className="text-2xl font-bold text-emerald-700">{processedAttendanceData[selectedStudent.id].stats.h}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col items-center">
                            <span className="text-xs font-bold text-blue-600 uppercase mb-1">Sakit</span>
                            <span className="text-2xl font-bold text-blue-700">{processedAttendanceData[selectedStudent.id].stats.s}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col items-center">
                            <span className="text-xs font-bold text-amber-600 uppercase mb-1">Izin</span>
                            <span className="text-2xl font-bold text-amber-700">{processedAttendanceData[selectedStudent.id].stats.i}</span>
                        </div>
                        <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col items-center">
                            <span className="text-xs font-bold text-rose-600 uppercase mb-1">Alpha</span>
                            <span className="text-2xl font-bold text-rose-700">{processedAttendanceData[selectedStudent.id].stats.a}</span>
                        </div>
                    </div>
                    {/* Tabel Riwayat Popup */}
                    <div className="space-y-3">
                        <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            <CalendarDaysIcon className="h-4 w-4 text-[#e94640]" />
                            Riwayat Absensi
                        </h4>
                        <div className="border border-slate-200 rounded-lg overflow-hidden">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Tanggal</th>
                                        <th className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase">Status</th>
                                        <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase">Keterangan</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {processedAttendanceData[selectedStudent.id].history.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-slate-50">
                                            <td className="px-4 py-3 text-sm text-slate-600 font-mono">{item.date}</td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold border ${
                                                    item.status === 'H' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                                                    item.status === 'S' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                    item.status === 'I' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                                                    'bg-rose-50 text-rose-700 border-rose-100'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-slate-600">{item.keterangan}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}