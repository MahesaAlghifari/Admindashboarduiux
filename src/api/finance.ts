import {
  apiGetJson,
  apiRequestJson,
  type ApiGetInit,
} from "./http";

export interface FinanceSummary {
  saldo_kas: number;
  pengeluaran_periode: number;
  anggaran_terpakai: number;
  total_anggaran: number;
}

export interface FinanceInvoice {
  id: number | string;
  student_id: number | string;
  nomor_tagihan: string;
  jumlah_tagihan: number;
  status_pembayaran: string;
  tanggal_tagihan: string;
  tanggal_jatuh_tempo: string;
  student: {
    id: number | string;
    nik: string;
    nama_lengkap: string;
    nisn: string;
  } | null;
}

export interface FinanceTransaction {
  id: number | string;
  nomor_transaksi: string;
  tipe_transaksi: string;
  jumlah: number;
  kategori: string;
  deskripsi: string;
  tanggal_transaksi: string;
  invoice_id: number | string | null;
}

export interface FinanceBudget {
  id: number | string;
  nama_anggaran: string;
  alokasi: number;
  terpakai: number;
  periode: string;
}

export interface FinancePayroll {
  id: number | string;
  nama_lengkap: string;
  jabatan: string;
  gaji_pokok: number;
  periode: string;
  status_pembayaran: string;
}

const text = (value: unknown) => String(value ?? "").trim();
const number = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const array = <T>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];

  if (value && typeof value === "object") {
    const root = value as Record<string, unknown>;
    for (const key of ["items", "data", "results", "rows"]) {
      if (Array.isArray(root[key])) {
        return root[key] as T[];
      }
    }
  }

  return [];
};

const query = (
  path: string,
  params: Record<string, unknown>
) => {
  const search = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (
      value === undefined ||
      value === null ||
      value === ""
    ) {
      return;
    }

    search.set(key, String(value));
  });

  const value = search.toString();
  return value ? `${path}?${value}` : path;
};

export async function fetchFinanceSummary(
  params: {
    start_date?: string;
    end_date?: string;
  } = {},
  init?: ApiGetInit
): Promise<FinanceSummary> {
  const raw = await apiGetJson<Record<string, unknown>>(
    query("/api/finance/summary", params),
    init
  );

  return {
    saldo_kas: number(raw?.saldo_kas),
    pengeluaran_periode: number(
      raw?.pengeluaran_periode
    ),
    anggaran_terpakai: number(
      raw?.anggaran_terpakai
    ),
    total_anggaran: number(raw?.total_anggaran),
  };
}

export async function fetchFinanceInvoices(
  init?: ApiGetInit
): Promise<FinanceInvoice[]> {
  const raw = await apiGetJson<unknown>(
    "/api/finance/invoices",
    init
  );

  return array<Record<string, any>>(raw).map((item) => ({
    id: item.id ?? "",
    student_id: item.student_id ?? "",
    nomor_tagihan: text(item.nomor_tagihan),
    jumlah_tagihan: number(item.jumlah_tagihan),
    status_pembayaran: text(
      item.status_pembayaran
    ),
    tanggal_tagihan: text(
      item.tanggal_tagihan
    ).slice(0, 10),
    tanggal_jatuh_tempo: text(
      item.tanggal_jatuh_tempo
    ).slice(0, 10),
    student:
      item.student && typeof item.student === "object"
        ? {
            id: item.student.id ?? item.student_id ?? "",
            nik: text(item.student.nik),
            nama_lengkap: text(
              item.student.nama_lengkap
            ),
            nisn: text(item.student.nisn),
          }
        : null,
  }));
}

export async function fetchFinanceTransactions(
  init?: ApiGetInit
): Promise<FinanceTransaction[]> {
  const raw = await apiGetJson<unknown>(
    "/api/finance/transactions",
    init
  );

  return array<Record<string, any>>(raw).map((item) => ({
    id: item.id ?? "",
    nomor_transaksi: text(item.nomor_transaksi),
    tipe_transaksi: text(item.tipe_transaksi),
    jumlah: number(item.jumlah),
    kategori: text(item.kategori),
    deskripsi: text(item.deskripsi),
    tanggal_transaksi: text(
      item.tanggal_transaksi
    ).slice(0, 10),
    invoice_id: item.invoice_id ?? null,
  }));
}

export async function fetchFinanceBudgets(
  init?: ApiGetInit
): Promise<FinanceBudget[]> {
  const raw = await apiGetJson<unknown>(
    "/api/finance/budgets",
    init
  );

  return array<Record<string, any>>(raw).map((item) => ({
    id: item.id ?? "",
    nama_anggaran: text(item.nama_anggaran),
    alokasi: number(item.alokasi),
    terpakai: number(item.terpakai),
    periode: text(item.periode),
  }));
}

export async function fetchFinancePayroll(
  init?: ApiGetInit
): Promise<FinancePayroll[]> {
  const raw = await apiGetJson<unknown>(
    "/api/finance/payroll",
    init
  );

  return array<Record<string, any>>(raw).map((item) => ({
    id: item.id ?? "",
    nama_lengkap: text(item.nama_lengkap),
    jabatan: text(item.jabatan),
    gaji_pokok: number(item.gaji_pokok),
    periode: text(item.periode),
    status_pembayaran: text(
      item.status_pembayaran
    ),
  }));
}

export function createFinanceInvoice(payload: {
  student_id: number | string;
  jumlah_tagihan: number;
  tanggal_tagihan: string;
  tanggal_jatuh_tempo: string;
}) {
  return apiRequestJson<FinanceInvoice>(
    "/api/finance/invoices",
    {
      method: "POST",
      jsonBody: payload,
    }
  );
}

export function createFinanceTransaction(payload: {
  tipe_transaksi: string;
  jumlah: number;
  kategori: string;
  deskripsi: string;
  tanggal_transaksi: string;
  invoice_id?: number | string | null;
}) {
  return apiRequestJson<FinanceTransaction>(
    "/api/finance/transactions",
    {
      method: "POST",
      jsonBody: {
        ...payload,
        invoice_id: payload.invoice_id ?? null,
      },
    }
  );
}
