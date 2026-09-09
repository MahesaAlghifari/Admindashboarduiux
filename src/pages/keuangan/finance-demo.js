import { fallbackAcademicYear } from "../../lib/academicYear";

const DEMO_ACADEMIC_YEAR = fallbackAcademicYear();

export const DEMO_INVOICES = [
  {
    id: "INV-001",
    student_id: 1,
    nomor_tagihan: "INV-2026-001",
    jumlah_tagihan: 850000,
    status_pembayaran: "lunas",
    tanggal_tagihan: "2026-09-01",
    tanggal_jatuh_tempo: "2026-09-10",
    student: {
      id: 1,
      nik: "",
      nama_lengkap: "Alya Putri",
      nisn: "0012345678",
    },
  },
  {
    id: "INV-002",
    student_id: 2,
    nomor_tagihan: "INV-2026-002",
    jumlah_tagihan: 850000,
    status_pembayaran: "belum_lunas",
    tanggal_tagihan: "2026-09-01",
    tanggal_jatuh_tempo: "2026-09-10",
    student: {
      id: 2,
      nik: "",
      nama_lengkap: "Bima Pratama",
      nisn: "0012345679",
    },
  },
  {
    id: "INV-003",
    student_id: 3,
    nomor_tagihan: "INV-2026-003",
    jumlah_tagihan: 1100000,
    status_pembayaran: "jatuh_tempo",
    tanggal_tagihan: "2026-08-01",
    tanggal_jatuh_tempo: "2026-08-10",
    student: {
      id: 3,
      nik: "",
      nama_lengkap: "Citra Lestari",
      nisn: "0012345680",
    },
  },
];

export const DEMO_TRANSACTIONS = [
  {
    id: "TRX-001",
    nomor_transaksi: "TRX-2026-001",
    tipe_transaksi: "pemasukan",
    jumlah: 850000,
    kategori: "Pembayaran SPP",
    deskripsi: "Pembayaran SPP September - Alya Putri",
    tanggal_transaksi: "2026-09-03",
    invoice_id: "INV-001",
  },
  {
    id: "TRX-002",
    nomor_transaksi: "TRX-2026-002",
    tipe_transaksi: "pengeluaran",
    jumlah: 450000,
    kategori: "Perlengkapan Kantor",
    deskripsi: "Kertas HVS dan tinta printer",
    tanggal_transaksi: "2026-09-03",
    invoice_id: null,
  },
  {
    id: "TRX-003",
    nomor_transaksi: "TRX-2026-003",
    tipe_transaksi: "pengeluaran",
    jumlah: 250000,
    kategori: "Konsumsi",
    deskripsi: "Konsumsi rapat guru",
    tanggal_transaksi: "2026-09-02",
    invoice_id: null,
  },
  {
    id: "TRX-004",
    nomor_transaksi: "TRX-2026-004",
    tipe_transaksi: "pemasukan",
    jumlah: 2000000,
    kategori: "Kas Kecil",
    deskripsi: "Pengisian saldo kas kecil",
    tanggal_transaksi: "2026-09-01",
    invoice_id: null,
  },
  {
    id: "TRX-005",
    nomor_transaksi: "TRX-2026-005",
    tipe_transaksi: "pengeluaran",
    jumlah: 175000,
    kategori: "Kas Kecil",
    deskripsi: "Pembelian ATK mendadak",
    tanggal_transaksi: "2026-09-01",
    invoice_id: null,
  },
];

export const DEMO_BUDGETS = [
  {
    id: "BG-01",
    nama_anggaran: "Gaji & Tunjangan",
    alokasi: 500000000,
    terpakai: 250000000,
    periode: DEMO_ACADEMIC_YEAR,
  },
  {
    id: "BG-02",
    nama_anggaran: "Sarana Prasarana",
    alokasi: 150000000,
    terpakai: 98000000,
    periode: DEMO_ACADEMIC_YEAR,
  },
  {
    id: "BG-03",
    nama_anggaran: "Operasional & ATK",
    alokasi: 50000000,
    terpakai: 20000000,
    periode: DEMO_ACADEMIC_YEAR,
  },
  {
    id: "BG-04",
    nama_anggaran: "Kegiatan Siswa",
    alokasi: 75000000,
    terpakai: 10000000,
    periode: DEMO_ACADEMIC_YEAR,
  },
];

export const DEMO_PAYROLL = [
  {
    id: 1,
    nama_lengkap: "Rina Wulandari",
    jabatan: "Guru Kelas",
    gaji_pokok: 4500000,
    periode: "September 2026",
    status_pembayaran: "dibayar",
  },
  {
    id: 2,
    nama_lengkap: "Dedi Saputra",
    jabatan: "Guru Pendamping",
    gaji_pokok: 3800000,
    periode: "September 2026",
    status_pembayaran: "menunggu",
  },
  {
    id: 3,
    nama_lengkap: "Sari Melati",
    jabatan: "Tata Usaha",
    gaji_pokok: 4200000,
    periode: "September 2026",
    status_pembayaran: "dibayar",
  },
];

export const DEMO_SUMMARY = {
  saldo_kas: 82450000,
  pengeluaran_periode: 14250000,
  anggaran_terpakai: 378000000,
  total_anggaran: 775000000,
};

export const DEMO_GRANTS = [
  {
    id: "GR-01",
    name: "BOS Reguler",
    provider: "Kemendikbud",
    total: 150000000,
    used: 120000000,
  },
  {
    id: "GR-02",
    name: "Hibah Sarana",
    provider: "Yayasan",
    total: 50000000,
    used: 28000000,
  },
];
