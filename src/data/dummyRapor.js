import { DATA_SISWA_DUMMY } from "./dummySiswa";
import { DATA_PEMBELAJARAN_DUMMY } from "./dummyPembelajaran";

const SCALES = ["BB", "MB", "BSH", "BSB"];

// Fungsi pembantu untuk mengacak nilai rapor PAUD
const getRandomScale = () => SCALES[Math.floor(Math.random() * SCALES.length)];

// Generate data rapor untuk setiap siswa di DATA_SISWA_DUMMY
export const DATA_RAPOR_DUMMY = {};

DATA_SISWA_DUMMY.forEach((siswa, index) => {
  const nilaiSem1 = {};
  const nilaiSem2 = {};
  
  DATA_PEMBELAJARAN_DUMMY.forEach(ind => {
    nilaiSem1[ind.indikator] = getRandomScale();
    // Simulasi perkembangan di semester 2 (Nilai lebih banyak BSH/BSB)
    nilaiSem2[ind.indikator] = Math.random() > 0.4 ? "BSB" : "BSH"; 
  });

  DATA_RAPOR_DUMMY[siswa.id] = {
    sem1: {
      nilai: nilaiSem1,
      catatan: `Ananda ${siswa.peserta_didik.nama_panggilan || "siswa"} menunjukkan perkembangan yang cukup baik dalam bersosialisasi dan kemandirian.`,
      fisik: { bb: 16 + (index % 5), tb: 105 + (index % 8) },
      absen: { s: index % 3, i: index % 2, a: 0 },
      komentar_ortu: "Terima kasih bapak/ibu guru atas bimbingannya selama semester ini."
    },
    sem2: {
      nilai: nilaiSem2,
      catatan: `Pada semester genap ini, ${siswa.peserta_didik.nama_panggilan || "siswa"} semakin mandiri, kreatif, dan mampu membantu teman-temannya.`,
      fisik: { bb: 17 + (index % 5), tb: 108 + (index % 8) },
      absen: { s: 0, i: 1, a: 0 },
      komentar_ortu: "Alhamdulillah perkembangannya sangat membanggakan, terima kasih sekolah SS."
    }
  };
});