import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MagnifyingGlassIcon,
  ArrowLeftIcon,
  DocumentTextIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  FunnelIcon,
  AcademicCapIcon
} from "@heroicons/react/24/outline";

// --- IMPORT DATA DUMMY ---
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa";
import { DATA_PEMBELAJARAN_DUMMY } from "../../../data/dummyPembelajaran";

// Import Template Print
import { RaporPrintTemplate } from "../../../components/common/RaporPrintTemplate";

const SCALES = ["BB", "MB", "BSH", "BSB"];

export default function Rapor() {
  // --- STATE ---
  const [viewMode, setViewMode] = useState("list");
  const [selectedClass, setSelectedClass] = useState("all"); // Default 'all'
  const [searchSiswa, setSearchSiswa] = useState("");
  const [currentStudent, setCurrentStudent] = useState(null);

  // State Data Rapor
  const [allRaporData, setAllRaporData] = useState({});
  const [raporData, setRaporData] = useState({});

  // --- LOGIKA SEMESTER OTOMATIS ---
  const today = new Date();
  const currentMonth = today.getMonth();
  const isSemester1 = currentMonth >= 6;
  const activeSemesterKey = isSemester1 ? "sem1" : "sem2";
  const activeSemesterLabel = isSemester1 ? "Semester I (Ganjil)" : "Semester II (Genap)";

  // Init Data Kosong
  const initialRaporState = {
    sem1: { nilai: {}, catatan: "", fisik: { bb: "", tb: "" }, absen: { s: 0, i: 0, a: 0 }, komentar_ortu: "" },
    sem2: { nilai: {}, catatan: "", fisik: { bb: "", tb: "" }, absen: { s: 0, i: 0, a: 0 }, komentar_ortu: "" }
  };

  // --- TRANSFORM DATA INDIKATOR ---
  const dynamicIndicators = useMemo(() => {
    const grouped = {};
    const orderMap = {
      "Nilai Agama & Moral": 1, "Fisik Motorik": 2, "Kognitif": 3,
      "Bahasa": 4, "Sosial Emosional": 5, "Seni": 6
    };

    DATA_PEMBELAJARAN_DUMMY.forEach(item => {
      if (!grouped[item.aspek]) grouped[item.aspek] = [];
      grouped[item.aspek].push(item.indikator);
    });

    return Object.keys(grouped)
      .sort((a, b) => (orderMap[a] || 99) - (orderMap[b] || 99))
      .map(key => ({ category: key.toUpperCase(), items: grouped[key] }));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // --- HELPER: STATUS ---
  const calculateStatus = (studentId) => {
    const data = allRaporData[studentId];
    if (!data) return "Belum Diisi";

    const currentSemData = data[activeSemesterKey];
    const isComplete = currentSemData?.catatan && currentSemData?.fisik?.bb;

    return isComplete ? "Selesai" : "Belum Lengkap";
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case "Selesai": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircleIcon className="h-3.5 w-3.5" /> Selesai</span>;
      case "Belum Lengkap": return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200"><ClockIcon className="h-3.5 w-3.5" /> Proses</span>;
      default: return <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200"><ExclamationCircleIcon className="h-3.5 w-3.5" /> Kosong</span>;
    }
  };

  const filteredSiswa = useMemo(() => {
    return DATA_SISWA_DUMMY.filter(s => {
      const matchClass = selectedClass === "all" ? true : s.class_id === Number(selectedClass);
      const matchName = s.peserta_didik.nama_lengkap.toLowerCase().includes(searchSiswa.toLowerCase());
      return matchClass && matchName;
    });
  }, [selectedClass, searchSiswa]);

  const handleOpenDetail = (student) => {
    setCurrentStudent(student);

    let dataToLoad = allRaporData[student.id]
      ? JSON.parse(JSON.stringify(allRaporData[student.id]))
      : JSON.parse(JSON.stringify(initialRaporState));

    if (!dataToLoad[activeSemesterKey].fisik.bb) {
      dataToLoad[activeSemesterKey].fisik.bb = student.peserta_didik.keadaan_jasmani.berat_badan;
    }
    if (!dataToLoad[activeSemesterKey].fisik.tb) {
      dataToLoad[activeSemesterKey].fisik.tb = student.peserta_didik.keadaan_jasmani.tinggi_badan;
    }

    setRaporData(dataToLoad);
    setViewMode("detail");
    window.scrollTo(0, 0);
  };

  const updateRapor = (category, field, value) => {
    setRaporData(prev => ({
      ...prev,
      [activeSemesterKey]: {
        ...prev[activeSemesterKey],
        [category]: typeof prev[activeSemesterKey][category] === 'object'
          ? { ...prev[activeSemesterKey][category], [field]: value }
          : value
      }
    }));
  };

  const updateNilai = (indikator, skala) => {
    setRaporData(prev => ({
      ...prev,
      [activeSemesterKey]: {
        ...prev[activeSemesterKey],
        nilai: {
          ...prev[activeSemesterKey].nilai,
          [indikator]: skala
        }
      }
    }));
  };

  const handleSave = () => {
    setAllRaporData(prev => ({
      ...prev,
      [currentStudent.id]: raporData
    }));
    alert("Data Rapor Berhasil Disimpan!");
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">

      {/* STYLE PRINT */}
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-root { display: block !important; position: absolute; top: 0; left: 0; width: 100%; height: auto; z-index: 9999; background: white; }
        }
      `}</style>

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
                <h1 className="text-2xl font-bold text-slate-900">Laporan Perkembangan</h1>
                <p className="text-sm text-slate-500 mt-1">
                  Kelola penilaian semester dan cetak rapor siswa.
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
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${selectedClass === "all"
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
                        className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${selectedClass === k.id
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
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">NIS</th>
                  <th className="px-4 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Nama Siswa</th>
                  <th className="px-4 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider w-40">Status ({activeSemesterKey})</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider w-32">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredSiswa.length > 0 ? (
                  filteredSiswa.map((siswa, index) => {
                    const status = calculateStatus(siswa.id);
                    return (
                      <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-6 py-4 text-sm text-slate-500 font-mono">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4 text-sm font-mono text-slate-500">
                          {siswa.peserta_didik.nomor_induk}
                        </td>
                        <td className="px-4 py-4">
                          <div className="text-sm font-semibold text-slate-700 group-hover:text-[#e94640] transition-colors">
                            {siswa.peserta_didik.nama_lengkap}
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center">
                          <StatusBadge status={status} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            onClick={() => handleOpenDetail(siswa)}
                            // PERBAIKAN DI SINI: tambahkan 'whitespace-nowrap'
                            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:border-[#e94640] hover:text-[#e94640] hover:bg-red-50 transition-all shadow-sm whitespace-nowrap"
                          >
                            {/* Tambahkan 'shrink-0' agar icon tidak gepeng */}
                            <DocumentTextIcon className="h-4 w-4 shrink-0" />
                            {status === "Belum Diisi" ? "Isi Rapor" : "Edit Rapor"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="py-20 text-center text-slate-400">
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
          VIEW 2: DETAIL RAPOR (ISI KONTEN SAMA, HANYA WRAPPER DI RAPOHKAN)
         ================================================================================= */}
      {viewMode === "detail" && currentStudent && (
        <div className="animate-in fade-in zoom-in-95 duration-200 space-y-6">

          {/* Header Detail */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <button
                onClick={() => setViewMode("list")}
                className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700 hover:shadow-sm transition-all"
                title="Kembali"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{currentStudent.peserta_didik.nama_lengkap}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {currentStudent.peserta_didik.nomor_induk}
                  </span>
                  <span className="text-xs text-[#e94640] font-bold uppercase tracking-wide">{activeSemesterLabel}</span>
                </div>
              </div>
            </div>

            <div className="flex bg-violet-50 px-4 py-2 rounded-xl text-violet-700 font-bold text-sm items-center gap-2 border border-violet-100 shadow-sm">
              <AcademicCapIcon className="h-5 w-5" />
              Input Penilaian Rapor
            </div>
          </div>

          {/* CARD 1: INPUT NILAI INDIKATOR */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Penilaian Indikator</h3>
              <p className="text-xs text-slate-500">Pilih pencapaian siswa untuk setiap indikator perkembangan.</p>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 border-collapse">
                <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                  <tr>
                    <th className="px-6 py-4 text-left border-r border-slate-200 w-[60%]">Aspek & Indikator</th>
                    <th className="px-2 py-2 text-center w-[40%] bg-violet-50 text-violet-700">Pencapaian <div className="grid grid-cols-4 mt-1 text-[10px] text-violet-400/80"><span>BB</span><span>MB</span><span>BSH</span><span>BSB</span></div></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                  {dynamicIndicators.map((section, idx) => (
                    <>
                      <tr key={`sec-${idx}`} className="bg-slate-50/80">
                        <td colSpan={2} className="px-6 py-3 font-bold text-slate-800 border-b border-slate-200 uppercase mt-2 block md:table-cell">
                          {section.category}
                        </td>
                      </tr>
                      {section.items.map((item, itemIdx) => (
                        <tr key={`${idx}-${itemIdx}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-3 border-r border-slate-100 text-slate-600">{item}</td>
                          <td className="px-2 py-3">
                            <div className="grid grid-cols-4 place-items-center">
                              {SCALES.map(scale => (
                                <label key={scale} className="cursor-pointer flex items-center justify-center w-full h-full py-2 hover:bg-violet-50 rounded group">
                                  <input
                                    type="radio"
                                    name={item}
                                    checked={raporData[activeSemesterKey].nilai[item] === scale}
                                    onChange={() => updateNilai(item, scale)}
                                    className="w-4 h-4 text-[#e94640] border-slate-300 focus:ring-[#e94640] transition-all cursor-pointer"
                                  />
                                </label>
                              ))}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* CARD 2: CATATAN & DATA FISIK */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* KIRI: Catatan Guru */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
              <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                <h4 className="text-sm font-bold text-slate-800 uppercase">Catatan Guru</h4>
              </div>
              <div className="p-4 flex-1">
                <textarea
                  value={raporData[activeSemesterKey].catatan}
                  onChange={(e) => updateRapor('catatan', null, e.target.value)}
                  className="w-full h-full min-h-[180px] border border-slate-200 rounded-lg p-3 text-sm outline-none resize-none focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640]/20 transition-all placeholder-slate-300"
                  placeholder="Tulis deskripsi capaian dan saran perkembangan anak disini..."
                />
              </div>
            </div>

            {/* KANAN: Data Fisik & Absen */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Data Fisik</h4>
                </div>
                <div className="p-6 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 font-bold block mb-1.5 ml-1">Berat Badan (kg)</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#e94640] outline-none transition-all"
                      value={raporData[activeSemesterKey].fisik.bb}
                      onChange={(e) => updateRapor('fisik', 'bb', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 font-bold block mb-1.5 ml-1">Tinggi Badan (cm)</label>
                    <input type="number" className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:border-[#e94640] outline-none transition-all"
                      value={raporData[activeSemesterKey].fisik.tb}
                      onChange={(e) => updateRapor('fisik', 'tb', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                  <h4 className="text-sm font-bold text-slate-800 uppercase">Kehadiran (Hari)</h4>
                </div>
                <div className="p-6 grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5 text-center">Sakit</label>
                    <input type="number" className="w-full text-center border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-[#e94640] outline-none transition-all" value={raporData[activeSemesterKey].absen.s} onChange={(e) => updateRapor('absen', 's', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5 text-center">Izin</label>
                    <input type="number" className="w-full text-center border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-[#e94640] outline-none transition-all" value={raporData[activeSemesterKey].absen.i} onChange={(e) => updateRapor('absen', 'i', e.target.value)} placeholder="0" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500 block mb-1.5 text-center">Alfa</label>
                    <input type="number" className="w-full text-center border border-slate-200 rounded-lg px-2 py-2 text-sm focus:border-[#e94640] outline-none transition-all" value={raporData[activeSemesterKey].absen.a} onChange={(e) => updateRapor('absen', 'a', e.target.value)} placeholder="0" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div className="flex flex-col-reverse md:flex-row justify-end gap-4 pb-10 border-t border-slate-200 pt-6">
            <button
              onClick={() => setViewMode("list")}
              className="px-6 py-2.5 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all"
            >
              Batal / Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-6 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              <PrinterIcon className="h-5 w-5" /> Cetak Rapor
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2.5 bg-[#e94640] text-white rounded-lg text-sm font-bold hover:bg-[#d63d38] transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow"
            >
              <ArrowDownTrayIcon className="h-5 w-5" /> Simpan Data
            </button>
          </div>

          {/* HIDDEN PRINT COMPONENT */}
          {createPortal(
            <div id="print-root" style={{ display: "none" }}>
              <RaporPrintTemplate student={currentStudent} data={raporData} />
            </div>,
            document.body
          )}

        </div>
      )}

    </div>
  );
}