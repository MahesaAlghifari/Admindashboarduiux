import { useState, useMemo } from "react";
import {
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  PencilSquareIcon,
  UserIcon
} from "@heroicons/react/24/outline";

// Import Data Dummy
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa";

// --- KONFIGURASI SEMESTER ---
const SEMESTERS = [
  { id: 1, label: "Semester Ganjil", sub: "Juli - Desember 2025" },
  { id: 2, label: "Semester Genap", sub: "Januari - Juni 2026" }
];

export default function Perkembangan() {
  // --- STATE ---
  const [viewMode, setViewMode] = useState("list");
  const [selectedClass, setSelectedClass] = useState("all");
  const [searchSiswa, setSearchSiswa] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null); 

  // Data State
  const [fisikData, setFisikData] = useState({}); 

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

  // --- LOGIC HELPER ---
  const getBMIStatus = (bmi, gender) => {
    const isMale = gender?.toLowerCase().includes("laki");
    if (isMale) {
      if (bmi < 17) return "Kurus";
      if (bmi >= 17 && bmi <= 23) return "Normal";
      if (bmi > 23 && bmi <= 27) return "Gemuk";
      if (bmi > 27) return "Obesitas";
    } else {
      if (bmi < 18) return "Kurus";
      if (bmi >= 18 && bmi <= 25) return "Normal";
      if (bmi > 25 && bmi <= 27) return "Gemuk";
      if (bmi > 27) return "Obesitas";
    }
    return "";
  };

  const getDummyStatus = (id) => {
      const statuses = ["Normal", "Normal", "Normal", "Kurus", "Gemuk"];
      return statuses[id % statuses.length];
  };

  const handleFisikChange = (semesterIndex, field, value) => {
    if (!selectedStudent) return;

    setFisikData(prev => {
      const studentData = prev[selectedStudent.id] || {};
      const semesterData = studentData[semesterIndex] || {};
      let newData = { ...semesterData, [field]: value };

      const tb = field === 'tb' ? value : semesterData.tb;
      const bb = field === 'bb' ? value : semesterData.bb;

      if (tb && bb) {
        const heightM = tb / 100;
        const bmiVal = bb / (heightM * heightM);
        const gender = selectedStudent.peserta_didik.jenis_kelamin;
        newData.ket = getBMIStatus(bmiVal, gender);
      }

      return {
        ...prev,
        [selectedStudent.id]: {
          ...studentData,
          [semesterIndex]: newData
        }
      };
    });
  };

  const calculateBMI = (tb, bb) => {
    if (!tb || !bb) return "";
    const heightInMeters = tb / 100;
    const bmi = bb / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const handleSave = () => {
    alert(`Data perkembangan fisik berhasil disimpan!`);
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      
      {/* =================================================================================
          VIEW 1: LIST DAFTAR SISWA
         ================================================================================= */}
      {viewMode === "list" && (
        <>
          {/* --- TOOLBAR --- */}
          <div className="bg-white pb-6 space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Data Perkembangan</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Pantau pertumbuhan tinggi, berat badan, dan status gizi siswa.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 rounded-lg transition-all border border-slate-200 hover:shadow-sm">
                <ArrowDownTrayIcon className="h-4 w-4" /> Export Laporan
              </button>
            </div>

            {/* --- FILTERS --- */}
            <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center border-t border-slate-100 pt-6">
              <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas:</span>
                  <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                    <button onClick={() => setSelectedClass("all")} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${selectedClass === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Semua Kelas</button>
                    {DATA_KELAS_DUMMY.map((k) => (
                      <button key={k.id} onClick={() => setSelectedClass(k.id)} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${selectedClass === k.id ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>{k.nama}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
                <div className="relative">
                    <input type="text" placeholder="Cari nama siswa..." value={searchSiswa} onChange={(e) => setSearchSiswa(e.target.value)} className="w-full xl:w-64 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-200 transition-all shadow-sm focus:shadow" />
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
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">NIS</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">L/P</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-24">Usia</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSiswa.length > 0 ? (
                  filteredSiswa.map((siswa, index) => {
                    const status = getDummyStatus(siswa.id);
                    return (
                    <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                      <td className="px-6 py-4 text-sm text-slate-500 font-mono">{index + 1}</td>
                      <td className="px-4 py-4 text-sm font-mono text-slate-500">{siswa.peserta_didik.nomor_induk}</td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-semibold text-slate-700 group-hover:text-[#e94640] transition-colors">
                          {siswa.peserta_didik.nama_lengkap}
                        </div>
                      </td>
                      {/* Gender: Simple Text */}
                      <td className="px-4 py-4 text-center text-sm text-slate-600 font-medium">
                        {siswa.peserta_didik.jenis_kelamin === "Laki-laki" ? "L" : "P"}
                      </td>
                      {/* Usia */}
                      <td className="px-4 py-4 text-center text-sm text-slate-500">
                        {6 + (index % 2)} Th
                      </td>
                      {/* Status: Simple Text (No Background) */}
                      <td className="px-4 py-4 text-center">
                        <span className={`text-sm font-medium ${
                            status === 'Normal' ? 'text-emerald-600' :
                            status === 'Kurus' ? 'text-amber-600' : 'text-rose-600'
                        }`}>
                            {status}
                        </span>
                      </td>
                      {/* Button: Outline Simple Style */}
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleOpenDetail(siswa)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:border-[#e94640] hover:text-[#e94640] hover:bg-red-50 transition-all shadow-sm"
                        >
                          <PencilSquareIcon className="h-4 w-4" /> Input
                        </button>
                      </td>
                    </tr>
                  )})
                ) : (
                  <tr>
                    <td colSpan="7" className="py-20 text-center text-slate-400">
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
          VIEW 2: DETAIL SISWA (INPUT DATA)
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
                <div className="flex items-center gap-3 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {selectedStudent.peserta_didik.nomor_induk}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <UserIcon className="h-3 w-3" />
                    {selectedStudent.peserta_didik.jenis_kelamin}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
                <button onClick={handleSave} className="flex bg-[#e94640] px-4 py-2 rounded-lg text-white font-bold text-sm items-center gap-2 shadow-sm hover:bg-[#d63d38] transition-colors">
                    <ArrowDownTrayIcon className="h-4 w-4" /> Simpan Perubahan
                </button>
            </div>
          </div>

          {/* CARD UTAMA (Tabel Input Per Semester) */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col min-h-[400px]">
            
            {/* Toolbar */}
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Data Fisik</h3>
              <p className="text-xs text-slate-500">Lengkapi data tinggi dan berat badan per semester.</p>
            </div>
            
            {/* Tabel Input */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-100 text-sm">
                <thead className="bg-slate-50 text-slate-600 font-semibold uppercase text-xs sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-16">No</th>
                    <th className="px-6 py-4 text-left border-r border-slate-200 w-64">Semester</th>
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-32">Tinggi (cm)</th>
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-32">Berat (kg)</th>
                    <th className="px-6 py-4 text-center border-r border-slate-200 w-32 font-bold text-slate-700">BMI</th>
                    <th className="px-6 py-4 text-left">Keterangan (Otomatis)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {SEMESTERS.map((sem, idx) => {
                    const data = fisikData[selectedStudent.id]?.[idx] || {};
                    const bmi = calculateBMI(data.tb, data.bb);

                    return (
                      <tr key={sem.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-6 text-center text-slate-500 border-r border-slate-100 bg-slate-50/30">{sem.id}</td>
                        <td className="px-6 py-6 border-r border-slate-100">
                            <div className="font-bold text-slate-700 text-sm">{sem.label}</div>
                            <div className="text-xs text-slate-400 mt-1">{sem.sub}</div>
                        </td>
                        
                        {/* INPUT TB */}
                        <td className="px-4 py-4 text-center border-r border-slate-100">
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={data.tb || ""} 
                            onChange={(e) => handleFisikChange(idx, "tb", e.target.value)} 
                            className="w-full text-center bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 transition-all placeholder-slate-300 font-medium" 
                          />
                        </td>

                        {/* INPUT BB */}
                        <td className="px-4 py-4 text-center border-r border-slate-100">
                          <input 
                            type="number" 
                            placeholder="0" 
                            value={data.bb || ""} 
                            onChange={(e) => handleFisikChange(idx, "bb", e.target.value)} 
                            className="w-full text-center bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 transition-all placeholder-slate-300 font-medium" 
                          />
                        </td>

                        {/* HASIL BMI */}
                        <td className="px-6 py-6 text-center font-bold text-slate-700 bg-slate-50/30 border-r border-slate-100 text-lg">
                          {bmi || "-"}
                        </td>

                        {/* KETERANGAN OTOMATIS (SIMPLE TEXT) */}
                        <td className="px-6 py-6">
                          <span className={`text-sm font-medium ${
                            data.ket === 'Normal' ? 'text-emerald-600' :
                            data.ket === 'Kurus' ? 'text-amber-600' :
                            data.ket === 'Gemuk' || data.ket === 'Obesitas' ? 'text-rose-600' :
                            'text-slate-400 italic'
                          }`}>
                            {data.ket || "Belum ada data"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}