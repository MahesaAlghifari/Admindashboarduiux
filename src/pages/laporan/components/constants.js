import {
  PrinterIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
  BookOpenIcon,
  PuzzlePieceIcon
} from "@heroicons/react/24/outline";

export const CLASSES = ["A", "B"];

export const SEMESTERS = [
  "Ganjil 2025/2026",
  "Genap 2025/2026",
  "Ganjil 2024/2025"
];

export const TABS = [
  {
    id: "rapor",
    label: "Cetak Rapor",
    icon: PrinterIcon,
    desc: "Nilai Akademik & Laporan Hasil Belajar"
  },

  {
    id: "absen",
    label: "Cetak Absensi",
    icon: ClipboardDocumentCheckIcon,
    desc: "Rekap Kehadiran Siswa Bulanan"
  },

  {
    id: "penghubung",
    label: "Buku Penghubung",
    icon: BookOpenIcon,
    desc: "Log Komunikasi Guru & Wali Murid"
  },

  {
    id: "aktivitas",
    label: "Laporan Aktivitas",
    icon: PuzzlePieceIcon,
    desc: "Jurnal Kegiatan Harian Kelas"
  },

  {
    id: "perkembangan",
    label: "Grafik Perkembangan",
    icon: PresentationChartLineIcon,
    desc: "Analisa Tumbuh Kembang Siswa"
  }
];

export const STUDENTS_DB = Array.from({ length: 20 }).map((_, i) => ({
  id: `SIS-${1000 + i}`,

  name:
    [
      "Aditya Pratama",
      "Bunga Citra Lestari",
      "Chandra Wijaya",
      "Dewi Sartika",
      "Eko Prasetyo",
      "Fajar Nugraha",
      "Gita Gutawa",
      "Hendra Setiawan"
    ][i % 8] + ` ${String.fromCharCode(65 + (i % 5))}.`,

  class: CLASSES[i % 2],

  nis: 2025000 + i
}));

export const REPORT_DATA = STUDENTS_DB.map(
  (student, i) => ({
    ...student,

    average: (
      75 +
      Math.random() * 20
    ).toFixed(1),

    rank: (i % 10) + 1,

    attitude: [
      "Sangat Baik",
      "Baik",
      "Cukup"
    ][i % 3],

    extracurricular: [
      "Pramuka",
      "Futsal",
      "Tari",
      "Musik"
    ][i % 4],

    status:
      Math.random() > 0.1
        ? "Lulus / Naik Kelas"
        : "Perlu Bimbingan"
  })
);