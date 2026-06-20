import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { DATA_SISWA_DUMMY } from "../../../data/dummySiswa";
import { DATA_RAPOR_DUMMY } from "../../../data/dummyRapor";

import RaporToolbar from "./RaporToolbar";
import RaporTable from "./RaporTable";
import { RaporPrintTemplate } from "../../../components/common/RaporPrintTemplate";

export default function RaporView() {
  const [filterKelas, setFilterKelas] = useState("Semua Kelas");
  const [filterSemester, setFilterSemester] = useState("Ganjil 2025/2026");
  const [search, setSearch] = useState("");

  // STATE MODE SELEKSI & CHECKBOX
  const [isSelectionMode, setIsSelectionMode] = useState(false); // Mode aktif/tidak
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [printState, setPrintState] = useState({ trigger: false, studentsToPrint: [] });

  const activeSemesterKey = filterSemester.toLowerCase().includes("ganjil") ? "sem1" : "sem2";

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

  const handlePrintIndividual = (studentItem) => {
    setPrintState({ trigger: true, studentsToPrint: [studentItem] });
  };

  // ACTION: EKSEKUSI CETAK SETELAH CHECKBOX DIPILIH
  const handleExecutePrint = () => {
    if (selectedStudents.length === 0) {
      alert("Silakan centang (pilih) minimal satu siswa pada tabel terlebih dahulu!");
      return;
    }
    const studentsToPrint = filtered.filter(s => selectedStudents.includes(s.id));
    setPrintState({ trigger: true, studentsToPrint: studentsToPrint });
    
    // Opsional: Keluar dari mode seleksi dan bersihkan checkbox setelah klik cetak
    // setIsSelectionMode(false);
    // setSelectedStudents([]);
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
    <div className="space-y-6">
      
      <style>{`
        @media print {
          body > :not(#print-root) { display: none !important; }
          #print-root { display: block !important; position: absolute; top: 0; left: 0; width: 100%; }
          .print-student-wrapper { page-break-after: always; }
          .print-student-wrapper:last-child { page-break-after: auto; }
        }
      `}</style>

      <RaporToolbar
        filterKelas={filterKelas}
        setFilterKelas={setFilterKelas}
        filterSemester={filterSemester}
        setFilterSemester={setFilterSemester}
        search={search}
        setSearch={setSearch}
        isSelectionMode={isSelectionMode}          // Pass Mode
        setIsSelectionMode={setIsSelectionMode}    // Setter Mode
        onExecutePrint={handleExecutePrint}        // Fungsi Cetak Akhir
        selectedCount={selectedStudents.length}
        clearSelection={() => setSelectedStudents([])}
      />

      <RaporTable 
        data={filtered} 
        raporData={DATA_RAPOR_DUMMY} 
        activeSemesterKey={activeSemesterKey} 
        onPrintItem={handlePrintIndividual} 
        selectedStudents={selectedStudents}
        setSelectedStudents={setSelectedStudents}
        isSelectionMode={isSelectionMode}          // Pass Mode ke Tabel
      />

      {printState.studentsToPrint.length > 0 && createPortal(
        <div id="print-root" style={{ display: printState.trigger ? "block" : "none" }}>
          {printState.studentsToPrint.map((student) => (
            <div key={`print-${student.id}`} className="print-student-wrapper">
              <RaporPrintTemplate 
                student={student} 
                data={{
                  [activeSemesterKey]: DATA_RAPOR_DUMMY[student.id]?.[activeSemesterKey] || {}
                }} 
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}