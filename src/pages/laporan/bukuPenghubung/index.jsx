import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { DATA_SISWA_DUMMY } from "../../../data/dummySiswa"; 
// Import data cetak penghubung dummy yang dibuat sebelumnya
import { DUMMY_PRINT_DATA } from "../../../data/dummyLaporan"; 

import BukuPenghubungToolbar from "./BukuPenghubungToolbar";
import BukuPenghubungTable from "./BukuPenghubungTable";
import { BukuPenghubungPrintTemplate } from "../../../components/common/BukuPenghubungPrintTemplate";

export default function LaporanBukuPenghubungView() {
  const [filterKelas, setFilterKelas] = useState("Semua Kelas");
  const [filterMinggu, setFilterMinggu] = useState("Minggu 1 - Jul 2026");
  const [search, setSearch] = useState("");

  // STATE MODE SELEKSI & CETAK
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [printState, setPrintState] = useState({ trigger: false, studentsToPrint: [] });

  const getClassId = (className) => {
    if (className === "TK A") return 1;
    if (className === "TK B") return 2;
    return "all";
  };

  const filtered = DATA_SISWA_DUMMY.filter((s) => {
    const targetClassId = getClassId(filterKelas);
    const classMatch = targetClassId === "all" ? true : s.class_id === targetClassId;
    const searchMatch = s.peserta_didik.nama_lengkap.toLowerCase().includes(search.toLowerCase());
    return classMatch && searchMatch;
  });

  // Simulasi fetch data buku penghubung per siswa berdasarkan minggu
  const getPenghubungData = (studentId) => {
     // Menggunakan dummy data yang sudah kita buat sebelumnya untuk semua siswa
     // Di aplikasi asli, filter berdasarkan studentId dan filterMinggu
     return DUMMY_PRINT_DATA;
  };

  const handlePrintIndividual = (studentItem) => {
    setPrintState({ trigger: true, studentsToPrint: [studentItem] });
  };

  const handleExecutePrint = () => {
    if (selectedStudents.length === 0) {
      alert("Silakan centang (pilih) minimal satu siswa pada tabel terlebih dahulu!");
      return;
    }
    const studentsToPrint = filtered.filter(s => selectedStudents.includes(s.id));
    setPrintState({ trigger: true, studentsToPrint: studentsToPrint });
  };

  useEffect(() => {
    if (printState.trigger && printState.studentsToPrint.length > 0) {
      setTimeout(() => {
        window.print();
        setPrintState({ trigger: false, studentsToPrint: [] });
      }, 500); 
    }
  }, [printState]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* CSS ISOLASI UNTUK CETAK MASSAL */}
      <style>{`
        @media print {
          body > :not(#print-root) { display: none !important; }
          #print-root { display: block !important; position: absolute; top: 0; left: 0; width: 100%; }
          .print-student-wrapper { page-break-after: always; }
          .print-student-wrapper:last-child { page-break-after: auto; }
        }
      `}</style>

      <BukuPenghubungToolbar
        filterKelas={filterKelas} setFilterKelas={setFilterKelas}
        filterMinggu={filterMinggu} setFilterMinggu={setFilterMinggu}
        search={search} setSearch={setSearch}
        isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode}
        onExecutePrint={handleExecutePrint}
        selectedCount={selectedStudents.length}
        clearSelection={() => setSelectedStudents([])}
      />

      <BukuPenghubungTable 
        data={filtered} 
        getPenghubungData={getPenghubungData}
        onPrintItem={handlePrintIndividual} 
        selectedStudents={selectedStudents} 
        setSelectedStudents={setSelectedStudents}
        isSelectionMode={isSelectionMode}
      />

      {/* PORTAL TERSEMBUNYI UNTUK RENDER CETAK MASSAL/SATUAN */}
      {printState.studentsToPrint.length > 0 && createPortal(
        <div id="print-root" style={{ display: printState.trigger ? "block" : "none" }}>
          {printState.studentsToPrint.map((student) => (
            <div key={`print-phb-${student.id}`} className="print-student-wrapper">
              <BukuPenghubungPrintTemplate 
                student={student} 
                mingguLabel={filterMinggu}
                penghubungData={getPenghubungData(student.id)} 
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}