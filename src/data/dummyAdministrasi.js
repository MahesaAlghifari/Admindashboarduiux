// ==========================================
// DATA DUMMY MODUL ADMINISTRASI PAUD
// ==========================================

// 1. DATA PENGUMUMAN (Pengumuman.jsx)
export const DATA_PENGUMUMAN_DUMMY = [
  { 
    id: 1, 
    judul: "Libur Awal Puasa Ramadhan", 
    isi: "Diberitahukan kepada seluruh siswa dan staf bahwa kegiatan belajar mengajar diliburkan pada tanggal 12 Maret 2026 menyambut awal puasa.", 
    tanggal: "2026-03-10", 
    tipe: "Libur", 
    target: "Semua" 
  },
  { 
    id: 2, 
    judul: "Rapat Koordinasi Wali Kelas", 
    isi: "Mohon kehadiran Bapak/Ibu Wali Kelas di Ruang Guru untuk membahas persiapan evaluasi perkembangan anak tengah semester.", 
    tanggal: "2026-03-15", 
    tipe: "Penting", 
    target: "Guru" 
  },
  { 
    id: 3, 
    judul: "Pemberitahuan Kegiatan Renang", 
    isi: "Sehubungan dengan jadwal kegiatan renang bulan ini, dimohon kepada orang tua untuk membawakan perlengkapan renang (baju renang, handuk, pakaian ganti) pada hari Jumat mendatang.", 
    tanggal: "2026-03-20", 
    tipe: "Info", 
    target: "Siswa" 
  }
];

// 2. DATA JADWAL PEMBELAJARAN (Jadwal.jsx)
// Catatan: jurnal_id merujuk pada relasi id di DATA_JURNAL_DUMMY
export const DATA_JADWAL_DUMMY = [
  { 
    id: 1, 
    jurnal_id: 1, 
    tanggal: "2026-07-15" 
  }, 
  { 
    id: 2, 
    jurnal_id: 2, 
    tanggal: "2026-07-16" 
  },
  { 
    id: 3, 
    jurnal_id: 3, 
    tanggal: "2026-07-17" 
  }
];