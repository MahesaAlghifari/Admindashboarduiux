// ==========================================
// DATA DUMMY MODUL KEUANGAN PAUD
// ==========================================

// 1. DATA TAGIHAN SISWA (TuitionTab)
export const DUMMY_INVOICES = [
  { id: "INV-24001", student: "Budi Santoso", class: "TK-A", type: "SPP Februari 2026", amount: 350000, dueDate: "2026-02-10", status: "paid" },
  { id: "INV-24002", student: "Siti Aminah", class: "TK-B", type: "SPP Februari 2026", amount: 350000, dueDate: "2026-02-10", status: "unpaid" },
  { id: "INV-24003", student: "Rizky Billar", class: "Playgroup", type: "Uang Pangkal", amount: 1500000, dueDate: "2026-01-20", status: "overdue" },
  { id: "INV-24004", student: "Dewi Persik", class: "TK-A", type: "Seragam", amount: 450000, dueDate: "2026-01-10", status: "paid" },
];

// 2. DATA RIWAYAT TRANSAKSI (HistoryTab)
export const DUMMY_TRANSACTIONS = [
  { id: "TRX-001", date: "2026-02-01", student: "Budi Santoso", class: "TK-A", type: "SPP Februari", amount: 350000, method: "Transfer Bank", status: "success" },
  { id: "TRX-002", date: "2026-02-01", student: "Siti Aminah", class: "TK-B", type: "Uang Pangkal", amount: 1500000, method: "Tunai", status: "success" },
  { id: "TRX-003", date: "2026-01-31", student: "Rizky Billar", class: "Playgroup", type: "Seragam", amount: 450000, method: "QRIS", status: "pending" },
  { id: "TRX-004", date: "2026-01-30", student: "Anak Cerdas", class: "TK-A", type: "SPP Januari", amount: 350000, method: "Transfer Bank", status: "failed" },
];

// 3. DATA PENGELUARAN & APPROVAL (ExpensesTab)
export const DUMMY_EXPENSES = [
  { id: "EXP-001", date: "2026-02-01", desc: "Beli Kertas HVS & Tinta Printer", category: "Perlengkapan Kantor", amount: 450000, requester: "Tata Usaha", status: "approved", attachment: true },
  { id: "EXP-002", date: "2026-02-01", desc: "Konsumsi Rapat Guru", category: "Konsumsi", amount: 250000, requester: "Kepala Sekolah", status: "pending", attachment: false },
  { id: "EXP-003", date: "2026-01-30", desc: "Perbaikan AC Ruang Guru", category: "Pemeliharaan", amount: 750000, requester: "Sarpras", status: "approved", attachment: true },
  { id: "EXP-004", date: "2026-01-28", desc: "Langganan Zoom Premium", category: "Software & Lisensi", amount: 300000, requester: "IT", status: "approved", attachment: true },
];

// 4. DATA KAS KECIL / PETTY CASH (PettyCashTab)
export const DUMMY_CASHFLOW = [
  { id: "PC-001", date: "2026-02-01", desc: "Isi Ulang Kas Kecil (Dari Bank)", category: "Top Up", type: "in", amount: 2000000, balance: 2000000, user: "Bendahara" },
  { id: "PC-002", date: "2026-02-02", desc: "Beli Air Mineral Galon (5x)", category: "Konsumsi", type: "out", amount: 100000, balance: 1900000, user: "OB" },
  { id: "PC-003", date: "2026-02-03", desc: "Fotokopi Materi Rapat", category: "ATK", type: "out", amount: 45000, balance: 1855000, user: "Tata Usaha" },
  { id: "PC-004", date: "2026-02-04", desc: "Parkir Tamu & Kurir", category: "Lainnya", type: "out", amount: 15000, balance: 1840000, user: "Satpam" },
];

// 5. DATA PENGGAJIAN / PAYROLL (PayrollTab)
export const DUMMY_PAYROLL = [
  { 
    id: "EMP-001", name: "Siti Nurhaliza, S.Pd.", role: "Guru Wali Kelas", 
    basic: 3500000, allowance: 1200000, deduction: 150000, 
    net: 4550000, status: "paid", bank: "BCA - 1234567890" 
  },
  { 
    id: "EMP-002", name: "Budi Santoso, M.Pd.", role: "Kepala Sekolah", 
    basic: 5000000, allowance: 2500000, deduction: 300000, 
    net: 7200000, status: "paid", bank: "Mandiri - 0987654321" 
  },
  { 
    id: "EMP-003", name: "Rina Nose", role: "Staff Tata Usaha", 
    basic: 2800000, allowance: 500000, deduction: 50000, 
    net: 3250000, status: "pending", bank: "BRI - 1122334455" 
  },
];

// 6. DATA ANGGARAN & BUDGETING (BudgetTab)
export const DUMMY_BUDGETS = [
  { id: "BG-01", category: "Gaji & Tunjangan", limit: 500000000, used: 250000000, color: "bg-purple-500" },
  { id: "BG-02", category: "Sarana Prasarana (Aset)", limit: 150000000, used: 145000000, color: "bg-blue-500" },
  { id: "BG-03", category: "Operasional Kantor & ATK", limit: 50000000, used: 20000000, color: "bg-emerald-500" },
  { id: "BG-04", category: "Kegiatan Siswa & Lomba", limit: 75000000, used: 10000000, color: "bg-amber-500" },
  { id: "BG-05", category: "Pemasaran (PPDB)", limit: 30000000, used: 35000000, color: "bg-rose-500" },
];

// 7. DATA LAPORAN & GRAFIK (ReportsTab)
export const MONTHLY_STATS = [
  { month: "Jul", income: 45, expense: 30 },
  { month: "Agu", income: 50, expense: 35 },
  { month: "Sep", income: 48, expense: 40 },
  { month: "Okt", income: 52, expense: 28 },
  { month: "Nov", income: 49, expense: 45 },
  { month: "Des", income: 60, expense: 50 },
];

export const DUMMY_GRANTS = [
  { id: "GR-001", name: "BOS Reguler Tahap 1", provider: "Kemendikbud", total: 150000000, used: 120000000, date: "2026-01-15", status: "active" },
  { id: "GR-002", name: "Sponsor Lapangan Futsal", provider: "PT Indofood", total: 25000000, used: 25000000, date: "2025-11-10", status: "completed" },
];