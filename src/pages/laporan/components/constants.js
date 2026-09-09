import {
  IdentificationIcon,
  PrinterIcon,
  ClipboardDocumentCheckIcon,
  PresentationChartLineIcon,
  BookOpenIcon,
  PuzzlePieceIcon,
} from "@heroicons/react/24/outline";
import { buildAcademicYearOptions, fallbackAcademicYear } from "../../../lib/academicYear";

export const CLASSES = ["A", "B"];

const [CURRENT_ACADEMIC_YEAR, PREVIOUS_ACADEMIC_YEAR] =
  buildAcademicYearOptions(fallbackAcademicYear(), 2);

export const SEMESTERS = [
  `Ganjil ${CURRENT_ACADEMIC_YEAR}`,
  `Genap ${CURRENT_ACADEMIC_YEAR}`,
  `Ganjil ${PREVIOUS_ACADEMIC_YEAR}`,
];

export const TABS = [
  {
    id: "buku-induk",
    label: "Buku Induk",
    icon: IdentificationIcon,
    desc: "Data lengkap seluruh siswa",
  },
  {
    id: "rapor",
    label: "Cetak Rapor",
    icon: PrinterIcon,
    desc: "Nilai akademik dan laporan hasil belajar",
  },
  {
    id: "absen",
    label: "Cetak Rekap Presensi",
    icon: ClipboardDocumentCheckIcon,
    desc: "Rekap kehadiran siswa berdasarkan periode",
  },
  {
    id: "penghubung",
    label: "Buku Penghubung",
    icon: BookOpenIcon,
    desc: "Riwayat komunikasi guru dan orang tua",
  },
  {
    id: "aktivitas",
    label: "Laporan Aktivitas",
    icon: PuzzlePieceIcon,
    desc: "Ringkasan kegiatan harian kelas",
  },
  {
    id: "perkembangan",
    label: "Grafik Perkembangan",
    icon: PresentationChartLineIcon,
    desc: "Analisis tumbuh kembang siswa",
  },
];

export const STUDENTS_DB = Array.from({ length: 20 }).map((_, index) => ({
  id: `SIS-${1000 + index}`,
  name: ["Aditya Pratama", "Bunga Citra Lestari", "Chandra Wijaya", "Dewi Sartika"][index % 4],
  class: CLASSES[index % 2],
  nis: 2025000 + index,
}));

export const REPORT_DATA = STUDENTS_DB.map((student, index) => ({
  ...student,
  average: (75 + (index % 20)).toFixed(1),
  rank: (index % 10) + 1,
  attitude: ["Sangat Baik", "Baik", "Cukup"][index % 3],
  extracurricular: ["Pramuka", "Futsal", "Tari", "Musik"][index % 4],
  status: index % 10 ? "Lulus / Naik Kelas" : "Perlu Bimbingan",
}));
