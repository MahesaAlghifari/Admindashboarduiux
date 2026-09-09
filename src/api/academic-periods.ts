import { apiGetJson, apiRequestJson } from "./http";

const ACADEMIC_PERIODS_ENDPOINT = "/api/academic-periods";

export interface AcademicPeriod {
  id: number;
  tahun_ajaran: string;
  semester: number;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active: boolean;
}

export interface CreateAcademicPeriodInput {
  tahun_ajaran: string;
  semester: number;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
  is_active?: boolean;
}

export const ACADEMIC_PERIOD_UPDATE_SUPPORTED = false as const;
export const ACADEMIC_PERIOD_DELETE_SUPPORTED = false as const;

const text = (value: unknown): string => String(value ?? "").trim();
const dateOnly = (value: unknown): string => text(value).slice(0, 10);

function positiveInteger(value: unknown, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} tidak valid.`);
  }
  return parsed;
}

function normalizeAcademicPeriod(raw: unknown): AcademicPeriod {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response periode akademik tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  return {
    id: positiveInteger(value.id, "ID periode akademik"),
    tahun_ajaran: text(value.tahun_ajaran),
    semester: Number.isFinite(Number(value.semester)) ? Number(value.semester) : 0,
    nama_periode: text(value.nama_periode),
    tanggal_mulai: dateOnly(value.tanggal_mulai),
    tanggal_selesai: dateOnly(value.tanggal_selesai),
    is_active: Boolean(value.is_active),
  };
}

function normalizeCreateInput(input: CreateAcademicPeriodInput): CreateAcademicPeriodInput {
  const tahun_ajaran = text(input.tahun_ajaran);
  const semester = Number(input.semester);
  const nama_periode = text(input.nama_periode);
  const tanggal_mulai = dateOnly(input.tanggal_mulai);
  const tanggal_selesai = dateOnly(input.tanggal_selesai);

  if (!tahun_ajaran) throw new Error("Tahun ajaran wajib diisi.");
  if (!Number.isInteger(semester) || ![1, 2].includes(semester)) throw new Error("Semester harus 1 atau 2.");
  if (!nama_periode) throw new Error("Nama periode wajib diisi.");
  if (!tanggal_mulai || !tanggal_selesai) throw new Error("Tanggal mulai dan selesai wajib diisi.");
  if (tanggal_selesai < tanggal_mulai) throw new Error("Tanggal selesai tidak boleh sebelum tanggal mulai.");

  return {
    tahun_ajaran,
    semester,
    nama_periode,
    tanggal_mulai,
    tanggal_selesai,
    is_active: Boolean(input.is_active),
  };
}

export async function fetchAcademicPeriods(signal?: AbortSignal): Promise<AcademicPeriod[]> {
  const response = await apiGetJson<unknown>(ACADEMIC_PERIODS_ENDPOINT, { signal });
  if (!Array.isArray(response)) {
    throw new Error("Response daftar periode akademik tidak valid.");
  }
  return response.map(normalizeAcademicPeriod);
}

export async function fetchCurrentAcademicPeriod(signal?: AbortSignal): Promise<AcademicPeriod> {
  const response = await apiGetJson<unknown>(`${ACADEMIC_PERIODS_ENDPOINT}/current`, { signal });
  return normalizeAcademicPeriod(response);
}

export async function createAcademicPeriod(
  input: CreateAcademicPeriodInput
): Promise<AcademicPeriod> {
  const response = await apiRequestJson<unknown>(ACADEMIC_PERIODS_ENDPOINT, {
    method: "POST",
    jsonBody: normalizeCreateInput(input),
  });
  return normalizeAcademicPeriod(response);
}

export async function activateAcademicPeriod(periodId: number | string): Promise<AcademicPeriod> {
  const id = positiveInteger(periodId, "ID periode akademik");
  const response = await apiRequestJson<unknown>(`${ACADEMIC_PERIODS_ENDPOINT}/${id}/activate`, {
    method: "PUT",
  });
  return normalizeAcademicPeriod(response);
}

export async function fetchAcademicYearOptions(signal?: AbortSignal): Promise<string[]> {
  const periods = await fetchAcademicPeriods(signal);
  return [
    ...new Set(periods.map((period) => text(period.tahun_ajaran)).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a, "id", { numeric: true, sensitivity: "base" }));
}
