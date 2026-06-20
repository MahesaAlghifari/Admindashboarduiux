import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

import { DATA_SISWA_DUMMY } from "../../../data/dummySiswa"; 
import RekapPresensiToolbar from "../RekapPresensi/RekapPresensiToolbar";
import RekapPresensiTable from "../RekapPresensi/RekapPresensiTable";
import { AbsensiPrintTemplate } from "../../../components/common/AbsensiPrintTemplate"; 

export default function RekapPresensiView() {
  const [filterKelas, setFilterKelas] = useState("Semua Kelas");
  const [filterBulan, setFilterBulan] = useState("Juli 2026");
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

  // Simulasi fetch data absen per siswa berdasarkan bulan
  const getAbsenData = (studentId) => {
     // Return dummy data (Bisa dikembangkan sesuai dummyAbsensi.js)
     return { summary: { h: 20, s: 1, i: 1, a: 0 } };
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
    
    // (Opsional) Keluar dari mode seleksi otomatis setelah cetak ditekan
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

      <RekapPresensiToolbar
        filterKelas={filterKelas} setFilterKelas={setFilterKelas}
        filterBulan={filterBulan} setFilterBulan={setFilterBulan}
        search={search} setSearch={setSearch}
        isSelectionMode={isSelectionMode} setIsSelectionMode={setIsSelectionMode}
        onExecutePrint={handleExecutePrint}
        selectedCount={selectedStudents.length}
        clearSelection={() => setSelectedStudents([])}
      />

      <RekapPresensiTable 
        data={filtered} 
        getAbsenData={getAbsenData}
        onPrintItem={handlePrintIndividual} 
        selectedStudents={selectedStudents} 
        setSelectedStudents={setSelectedStudents}
        isSelectionMode={isSelectionMode}
      />

      {/* PORTAL TERSEMBUNYI UNTUK RENDER CETAK MASSAL/SATUAN */}
      {printState.studentsToPrint.length > 0 && createPortal(
        <div id="print-root" style={{ display: printState.trigger ? "block" : "none" }}>
          {printState.studentsToPrint.map((student) => (
            <div key={`print-absen-${student.id}`} className="print-student-wrapper">
              <AbsensiPrintTemplate 
                student={student} 
                bulanLabel={filterBulan}
                absenData={getAbsenData(student.id)} 
              />
            </div>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}