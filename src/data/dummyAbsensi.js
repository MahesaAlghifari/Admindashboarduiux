// =========================================
// FILE: src/data/dummyAbsensi.js
// DESKRIPSI: Generator Data Absensi (90 Hari)
// =========================================

import { DATA_SISWA_DUMMY } from "./dummySiswa";

const generateAttendanceData = (students) => {
  const data = {};
  
  // Start Date: 15 Juli 2025
  const startDate = new Date("2025-07-15"); 
  const totalDays = 90; // Generate 90 hari ke depan

  students.forEach((student) => {
    const history = [];
    let hCount = 0;
    let sCount = 0;
    let iCount = 0;
    let aCount = 0;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      // Skip Sabtu (6) dan Minggu (0)
      const day = currentDate.getDay();
      if (day === 0 || day === 6) continue;

      const dateString = currentDate.toISOString().split("T")[0]; // Format YYYY-MM-DD

      // --- LOGIKA RANDOM STATUS ---
      // Probabilitas: Hadir (85%), Sakit (5%), Izin (5%), Alpha (5%)
      const rand = Math.random();
      let status = "H";
      let keterangan = "-";

      if (rand > 0.95) {
        status = "A";
        keterangan = "Tanpa Keterangan";
        aCount++;
      } else if (rand > 0.90) {
        status = "I";
        keterangan = "Acara Keluarga";
        iCount++;
      } else if (rand > 0.85) {
        status = "S";
        keterangan = "Sakit Demam";
        sCount++;
      } else {
        status = "H";
        hCount++;
      }

      history.push({
        date: dateString,
        status: status,
        keterangan: keterangan,
      });
    }

    // Hitung Persentase Total
    const totalMasuk = hCount + sCount + iCount + aCount;
    const percentage = totalMasuk > 0 ? Math.round((hCount / totalMasuk) * 100) : 0;

    // Struktur Data Final per Siswa
    data[student.id] = {
      history: history, // Array detail history
      stats: {          // Total rekap
        h: hCount,
        s: sCount,
        i: iCount,
        a: aCount,
        percentage: percentage
      }
    };
  });

  return data;
};

// Export Data Absensi yang sudah jadi
export const DATA_ABSENSI_DUMMY = generateAttendanceData(DATA_SISWA_DUMMY);