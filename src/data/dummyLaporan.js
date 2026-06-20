// ==========================================
// DATA DUMMY MODUL LAPORAN & CETAK
// ==========================================

export const DAYS_PRINT = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];

export const METRICS_PRINT = [
  { key: "jam_tidur", label: "Jam Tidur" },
  { key: "anak_bab", label: "Anak BAB" },
  { key: "suhu_tubuh", label: "Suhu Tubuh" },
  { key: "menu_sarapan", label: "Menu Sarapan" }
];

// Data Dummy Identitas Siswa untuk Cetak
export const DUMMY_PRINT_STUDENT = {
  nama: "Ahmad Rizky Pratama",
  kelas: "TK A",
  nis: "2324001",
  semester: "Semester Ganjil",
  minggu: "Minggu 30",
  tahun: "Tahun 2026"
};

// Data Dummy Isi Buku Penghubung
export const DUMMY_PRINT_DATA = {
  Senin: {
    jam_tidur: "21.00 - 05.00",
    anak_bab: "Ya",
    suhu_tubuh: "36.5°C",
    menu_sarapan: "Nasi Goreng",
    catatan_ortu: "Ananda tidur nyenyak dan bangun pagi dengan semangat.",
    catatan_guru: "Hari ini aktif mengikuti kegiatan mewarnai dan bernyanyi."
  },
  Selasa: {
    jam_tidur: "20.30 - 05.00",
    anak_bab: "Ya",
    suhu_tubuh: "36.7°C",
    menu_sarapan: "Roti dan Susu",
    catatan_ortu: "Pagi hari sedikit susah bangun tetapi tetap ceria.",
    catatan_guru: "Sudah mulai berani bermain bersama teman-temannya."
  },
  Rabu: {
    jam_tidur: "21.00 - 05.30",
    anak_bab: "Tidak",
    suhu_tubuh: "36.4°C",
    menu_sarapan: "Bubur Ayam",
    catatan_ortu: "Hari ini terlihat sedikit mengantuk.",
    catatan_guru: "Fokus belajar cukup baik dan mengikuti arahan guru."
  },
  Kamis: {
    jam_tidur: "20.45 - 05.00",
    anak_bab: "Ya",
    suhu_tubuh: "36.6°C",
    menu_sarapan: "Mie Goreng",
    catatan_ortu: "Ananda sangat semangat berangkat sekolah.",
    catatan_guru: "Aktif saat kegiatan motorik dan bermain kelompok."
  },
  Jumat: {
    jam_tidur: "21.15 - 05.15",
    anak_bab: "Ya",
    suhu_tubuh: "36.5°C",
    menu_sarapan: "Nasi Uduk",
    catatan_ortu: "Kondisi sehat dan ceria.",
    catatan_guru: "Mampu menyelesaikan tugas dengan baik."
  }
};