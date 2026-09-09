import { apiGetJson, apiRequestJson } from "./http";


export type AdminId = number | string;

export interface PageResponse<T> {
  items: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

type QueryValue = string | number | boolean | null | undefined;

function text(value: unknown): string {
  return String(value ?? "").trim();
}

function idOf(value: unknown): AdminId | null {
  return typeof value === "number" || typeof value === "string" ? value : null;
}

function requirePositiveId(value: AdminId, label: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label} tidak valid.`);
  }
  return parsed;
}

function dateOnly(value: unknown): string {
  return text(value).slice(0, 10);
}

function requireDate(value: unknown, label: string): string {
  const normalized = dateOnly(value);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    throw new Error(`${label} wajib diisi dalam format YYYY-MM-DD.`);
  }
  return normalized;
}

function queryUrl(path: string, params: Record<string, QueryValue>): string {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]: [string, QueryValue]) => {
    if (value === undefined || value === null || value === "") return;
    query.set(key, String(value));
  });

  const serialized = query.toString();
  return serialized ? `${path}?${serialized}` : path;
}

function normalizePage<T>(
  raw: unknown,
  normalizeItem: (value: unknown) => T
): PageResponse<T> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response daftar Akademik tidak valid.");
  }

  const root = raw as Record<string, unknown>;
  if (!Array.isArray(root.items)) {
    throw new Error("Response daftar Akademik tidak memiliki items.");
  }

  const items: T[] = root.items.map((item: unknown) => normalizeItem(item));
  const total = Number(root.total);
  const page = Number(root.page);
  const perPage = Number(root.per_page);
  const totalPages = Number(root.total_pages);

  return {
    items,
    total: Number.isFinite(total) ? total : items.length,
    page: Number.isFinite(page) && page > 0 ? page : 1,
    per_page:
      Number.isFinite(perPage) && perPage > 0
        ? perPage
        : items.length || 1,
    total_pages:
      Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
  };
}

async function collectPages<T>(
  first: PageResponse<T>,
  fetchPage: (page: number) => Promise<PageResponse<T>>,
  concurrency = 4
): Promise<T[]> {
  if (first.total_pages <= 1) return first.items;

  const pageNumbers: number[] = Array.from(
    { length: first.total_pages - 1 },
    (_value: unknown, index: number) => index + 2
  );
  const results: PageResponse<T>[] = new Array(pageNumbers.length);
  let cursor = 0;

  const worker = async (): Promise<void> => {
    while (true) {
      const index = cursor;
      cursor += 1;
      if (index >= pageNumbers.length) return;
      results[index] = await fetchPage(pageNumbers[index]);
    }
  };

  const workerCount = Math.max(
    1,
    Math.min(concurrency, pageNumbers.length)
  );
  await Promise.all(
    Array.from({ length: workerCount }, (): Promise<void> => worker())
  );

  const items: T[] = [...first.items];
  results.forEach((result: PageResponse<T>) => {
    items.push(...result.items);
  });
  return items;
}


export interface Curriculum {
  id: AdminId | null;
  nama_kurikulum: string;
  tahun_ajaran: string;
  deskripsi: string;
  status_aktif: boolean;
  mata_pelajaran: unknown[];
  indikator_ids: AdminId[];
}

export interface CurriculumPayload {
  nama_kurikulum: string;
  tahun_ajaran: string;
  deskripsi: string;
  status_aktif: boolean;
  mata_pelajaran: unknown[];
}

export interface CurriculumQuery {
  q?: string;
  status_aktif?: boolean;
  page?: number;
  per_page?: number;
  signal?: AbortSignal;
}

export function normalizeCurriculum(raw: unknown): Curriculum {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response kurikulum tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  const indicatorIds: AdminId[] = Array.isArray(value.indikator_ids)
    ? value.indikator_ids
        .map((item: unknown) => idOf(item))
        .filter((id: AdminId | null): id is AdminId => id !== null)
    : [];

  return {
    id: idOf(value.id),
    nama_kurikulum: text(value.nama_kurikulum),
    tahun_ajaran: text(value.tahun_ajaran),
    deskripsi: text(value.deskripsi),
    status_aktif: value.status_aktif === true,
    mata_pelajaran: Array.isArray(value.mata_pelajaran)
      ? value.mata_pelajaran
      : [],
    indikator_ids: indicatorIds,
  };
}

export async function fetchCurriculums(
  params: CurriculumQuery = {}
): Promise<PageResponse<Curriculum>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.per_page ?? 25));

  const raw = await apiGetJson<unknown>(
    queryUrl("/api/curriculums", {
      q: text(params.q),
      status_aktif: params.status_aktif,
      page,
      per_page: perPage,
    }),
    { signal: params.signal }
  );

  return normalizePage(raw, normalizeCurriculum);
}

export async function fetchAllCurriculums(
  perPage = 100,
  signal?: AbortSignal
): Promise<Curriculum[]> {
  const size = Math.min(100, Math.max(1, perPage));
  const first = await fetchCurriculums({ page: 1, per_page: size, signal });
  return collectPages<Curriculum>(
    first,
    (page: number) => fetchCurriculums({ page, per_page: size, signal })
  );
}

export async function createCurriculum(
  payload: CurriculumPayload
): Promise<Curriculum> {
  if (!text(payload.nama_kurikulum)) {
    throw new Error("Nama kurikulum wajib diisi.");
  }
  if (!text(payload.tahun_ajaran)) {
    throw new Error("Tahun ajaran wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>("/api/curriculums", {
    method: "POST",
    jsonBody: {
      nama_kurikulum: text(payload.nama_kurikulum),
      tahun_ajaran: text(payload.tahun_ajaran),
      deskripsi: text(payload.deskripsi),
      status_aktif: Boolean(payload.status_aktif),
      mata_pelajaran: Array.isArray(payload.mata_pelajaran)
        ? payload.mata_pelajaran
        : [],
    },
  });

  return normalizeCurriculum(raw);
}

export async function deleteCurriculum(id: AdminId): Promise<unknown> {
  const curriculumId=requirePositiveId(id,"ID kurikulum");
  return apiRequestJson<unknown>(`/api/curriculums/${curriculumId}`,{method:"DELETE"});
}

export async function setCurriculumIndicators(
  id: AdminId,
  indicatorIds: AdminId[]
): Promise<Curriculum> {
  const curriculumId = requirePositiveId(id, "ID kurikulum");
  const indikator_ids: number[] = indicatorIds.map((value: AdminId) =>
    requirePositiveId(value, "ID indikator")
  );

  const raw = await apiRequestJson<unknown>(
    `/api/curriculums/${curriculumId}/indicators`,
    {
      method: "PUT",
      jsonBody: { indikator_ids },
    }
  );

  return normalizeCurriculum(raw);
}


export interface Indicator {
  id: AdminId | null;
  kode: string;
  deskripsi: string;
  status_aktif: boolean;
  sub_aspek: string;
  aspek: string;
}

export interface SubAspect {
  id: AdminId | null;
  nama_sub_aspek: string;
  indicators: Indicator[];
}

export interface Aspect {
  id: AdminId | null;
  nama_aspek: string;
  sub_aspects: SubAspect[];
}

export interface AspectQuery {
  q?: string;
  aspek?: string;
  page?: number;
  per_page?: number;
  signal?: AbortSignal;
}

export interface IndicatorQuery {
  q?: string;
  aspek?: string;
  status_aktif?: boolean;
  page?: number;
  per_page?: number;
  signal?: AbortSignal;
}

export interface IndicatorPayload {
  kode: string;
  deskripsi: string;
  status_aktif: boolean;
}

export function normalizeIndicator(raw: unknown): Indicator {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response indikator tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  return {
    id: idOf(value.id),
    kode: text(value.kode),
    deskripsi: text(value.deskripsi),
    status_aktif: value.status_aktif === true,
    sub_aspek: text(value.sub_aspek),
    aspek: text(value.aspek),
  };
}

export function normalizeSubAspect(raw: unknown): SubAspect {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response subaspek tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  return {
    id: idOf(value.id),
    nama_sub_aspek: text(value.nama_sub_aspek),
    indicators: Array.isArray(value.indicators)
      ? value.indicators.map((item: unknown) => normalizeIndicator(item))
      : [],
  };
}

export function normalizeAspect(raw: unknown): Aspect {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response aspek tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  return {
    id: idOf(value.id),
    nama_aspek: text(value.nama_aspek),
    sub_aspects: Array.isArray(value.sub_aspects)
      ? value.sub_aspects.map((item: unknown) => normalizeSubAspect(item))
      : [],
  };
}

export async function fetchAspects(
  params: AspectQuery = {}
): Promise<PageResponse<Aspect>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.per_page ?? 25));

  const raw = await apiGetJson<unknown>(
    queryUrl("/api/aspects", {
      q: text(params.q),
      aspek: text(params.aspek),
      page,
      per_page: perPage,
    }),
    { signal: params.signal }
  );

  return normalizePage(raw, normalizeAspect);
}

export async function fetchAllAspects(
  perPage = 100,
  signal?: AbortSignal
): Promise<Aspect[]> {
  const size = Math.min(100, Math.max(1, perPage));
  const first = await fetchAspects({ page: 1, per_page: size, signal });
  return collectPages<Aspect>(first, (page: number) =>
    fetchAspects({ page, per_page: size, signal })
  );
}

export async function createAspect(payload: {
  nama_aspek: string;
}): Promise<Aspect> {
  if (!text(payload.nama_aspek)) {
    throw new Error("Nama aspek wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>("/api/aspects", {
    method: "POST",
    jsonBody: { nama_aspek: text(payload.nama_aspek) },
  });
  return normalizeAspect(raw);
}

export async function updateAspect(
  id: AdminId,
  payload: { nama_aspek: string }
): Promise<Aspect> {
  if (!text(payload.nama_aspek)) {
    throw new Error("Nama aspek wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>(
    `/api/aspects/${requirePositiveId(id, "ID aspek")}`,
    {
      method: "PUT",
      jsonBody: { nama_aspek: text(payload.nama_aspek) },
    }
  );
  return normalizeAspect(raw);
}

export async function deleteAspect(id: AdminId): Promise<void> {
  await apiRequestJson<unknown>(
    `/api/aspects/${requirePositiveId(id, "ID aspek")}`,
    { method: "DELETE" }
  );
}

export async function createSubAspect(
  aspectId: AdminId,
  payload: { nama_sub_aspek: string }
): Promise<SubAspect> {
  if (!text(payload.nama_sub_aspek)) {
    throw new Error("Nama subaspek wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>(
    `/api/aspects/${requirePositiveId(aspectId, "ID aspek")}/sub-aspects`,
    {
      method: "POST",
      jsonBody: { nama_sub_aspek: text(payload.nama_sub_aspek) },
    }
  );
  return normalizeSubAspect(raw);
}

export async function updateSubAspect(
  id: AdminId,
  payload: { nama_sub_aspek: string }
): Promise<SubAspect> {
  if (!text(payload.nama_sub_aspek)) {
    throw new Error("Nama subaspek wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>(
    `/api/sub-aspects/${requirePositiveId(id, "ID subaspek")}`,
    {
      method: "PUT",
      jsonBody: { nama_sub_aspek: text(payload.nama_sub_aspek) },
    }
  );
  return normalizeSubAspect(raw);
}

export async function deleteSubAspect(id: AdminId): Promise<void> {
  await apiRequestJson<unknown>(
    `/api/sub-aspects/${requirePositiveId(id, "ID subaspek")}`,
    { method: "DELETE" }
  );
}

export async function fetchIndicators(
  params: IndicatorQuery = {}
): Promise<PageResponse<Indicator>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.per_page ?? 25));

  const raw = await apiGetJson<unknown>(
    queryUrl("/api/indicators", {
      q: text(params.q),
      aspek: text(params.aspek),
      status_aktif: params.status_aktif,
      page,
      per_page: perPage,
    }),
    { signal: params.signal }
  );

  return normalizePage(raw, normalizeIndicator);
}

export async function fetchAllIndicators(
  perPage = 100,
  signal?: AbortSignal
): Promise<Indicator[]> {
  const size = Math.min(100, Math.max(1, perPage));
  const first = await fetchIndicators({ page: 1, per_page: size, signal });
  return collectPages<Indicator>(first, (page: number) =>
    fetchIndicators({ page, per_page: size, signal })
  );
}

export async function createIndicator(
  subAspectId: AdminId,
  payload: IndicatorPayload
): Promise<Indicator> {
  if (!text(payload.kode)) {
    throw new Error("Kode indikator wajib diisi.");
  }
  if (!text(payload.deskripsi)) {
    throw new Error("Deskripsi indikator wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>(
    `/api/sub-aspects/${requirePositiveId(
      subAspectId,
      "ID subaspek"
    )}/indicators`,
    {
      method: "POST",
      jsonBody: {
        kode: text(payload.kode),
        deskripsi: text(payload.deskripsi),
        status_aktif: Boolean(payload.status_aktif),
      },
    }
  );
  return normalizeIndicator(raw);
}

export async function updateIndicator(
  id: AdminId,
  payload: IndicatorPayload
): Promise<Indicator> {
  if (!text(payload.kode)) {
    throw new Error("Kode indikator wajib diisi.");
  }
  if (!text(payload.deskripsi)) {
    throw new Error("Deskripsi indikator wajib diisi.");
  }

  const raw = await apiRequestJson<unknown>(
    `/api/indicators/${requirePositiveId(id, "ID indikator")}`,
    {
      method: "PUT",
      jsonBody: {
        kode: text(payload.kode),
        deskripsi: text(payload.deskripsi),
        status_aktif: Boolean(payload.status_aktif),
      },
    }
  );
  return normalizeIndicator(raw);
}

export async function deleteIndicator(id: AdminId): Promise<void> {
  await apiRequestJson<unknown>(
    `/api/indicators/${requirePositiveId(id, "ID indikator")}`,
    { method: "DELETE" }
  );
}


export interface Journal {
  id: AdminId | null;
  tema: string;
  pilar_karakter: string;
  nilai_karakter: string;
  isi_jurnal: string;
  aktivitas: string;
  pembiasaan: string;
}

export interface JournalPayload {
  tema: string;
  pilar_karakter: string;
  nilai_karakter: string;
  isi_jurnal: string;
  aktivitas: string;
  pembiasaan: string;
}

export interface JournalQuery {
  q?: string;
  page?: number;
  per_page?: number;
  signal?: AbortSignal;
}

export function normalizeJournal(raw: unknown): Journal {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response jurnal tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  return {
    id: idOf(value.id),
    tema: text(value.tema),
    pilar_karakter: text(value.pilar_karakter),
    nilai_karakter: text(value.nilai_karakter),
    isi_jurnal: text(value.isi_jurnal),
    aktivitas: text(value.aktivitas),
    pembiasaan: text(value.pembiasaan),
  };
}

function serializeJournal(payload: JournalPayload) {
  if (!text(payload.tema)) {
    throw new Error("Tema jurnal wajib diisi.");
  }

  return {
    tema: text(payload.tema),
    pilar_karakter: text(payload.pilar_karakter),
    nilai_karakter: text(payload.nilai_karakter),
    isi_jurnal: text(payload.isi_jurnal),
    aktivitas: text(payload.aktivitas),
    pembiasaan: text(payload.pembiasaan),
  };
}

export async function fetchJournals(
  params: JournalQuery = {}
): Promise<PageResponse<Journal>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.per_page ?? 25));

  const raw = await apiGetJson<unknown>(
    queryUrl("/api/journals", {
      q: text(params.q),
      page,
      per_page: perPage,
    }),
    { signal: params.signal }
  );

  return normalizePage(raw, normalizeJournal);
}

export async function fetchAllJournals(
  perPage = 100,
  signal?: AbortSignal
): Promise<Journal[]> {
  const size = Math.min(100, Math.max(1, perPage));
  const first = await fetchJournals({ page: 1, per_page: size, signal });
  return collectPages<Journal>(first, (page: number) =>
    fetchJournals({ page, per_page: size, signal })
  );
}

export async function fetchJournalById(
  id: AdminId,
  signal?: AbortSignal
): Promise<Journal> {
  const raw = await apiGetJson<unknown>(
    `/api/journals/${requirePositiveId(id, "ID jurnal")}`,
    { signal }
  );
  return normalizeJournal(raw);
}

export async function createJournal(
  payload: JournalPayload
): Promise<Journal> {
  const raw = await apiRequestJson<unknown>("/api/journals", {
    method: "POST",
    jsonBody: serializeJournal(payload),
  });
  return normalizeJournal(raw);
}

export async function updateJournal(
  id: AdminId,
  payload: JournalPayload
): Promise<Journal> {
  const raw = await apiRequestJson<unknown>(
    `/api/journals/${requirePositiveId(id, "ID jurnal")}`,
    {
      method: "PUT",
      jsonBody: serializeJournal(payload),
    }
  );
  return normalizeJournal(raw);
}

export async function deleteJournal(id: AdminId): Promise<void> {
  await apiRequestJson<unknown>(
    `/api/journals/${requirePositiveId(id, "ID jurnal")}`,
    { method: "DELETE" }
  );
}


export interface Schedule {
  id: AdminId | null;
  classroom_id: AdminId | null;
  journal_id: AdminId | null;
  week_start_date: string;
  tanggal: string;
  journal: Journal | null;
}

export interface SchedulePayload {
  classroom_id: AdminId;
  journal_id: AdminId;
  week_start_date: string;
  tanggal: string;
}

export interface ScheduleQuery {
  classroom_id?: AdminId;
  kelas_id?: AdminId;
  week_start_date?: string;
  minggu?: string;
  dari?: string;
  sampai?: string;
  q?: string;
  page?: number;
  per_page?: number;
  signal?: AbortSignal;
}

export function normalizeSchedule(raw: unknown): Schedule {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response jadwal tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  const journalValue = value.journal;

  return {
    id: idOf(value.id),
    classroom_id: idOf(value.classroom_id),
    journal_id: idOf(value.journal_id),
    week_start_date: dateOnly(value.week_start_date),
    tanggal: dateOnly(value.tanggal),
    journal:
      journalValue &&
      typeof journalValue === "object" &&
      !Array.isArray(journalValue)
        ? normalizeJournal(journalValue)
        : null,
  };
}

function serializeSchedule(payload: SchedulePayload) {
  return {
    classroom_id: requirePositiveId(payload.classroom_id, "Kelas"),
    journal_id: requirePositiveId(payload.journal_id, "Jurnal"),
    week_start_date: requireDate(payload.week_start_date, "Awal minggu"),
    tanggal: requireDate(payload.tanggal, "Tanggal jadwal"),
  };
}

export async function fetchSchedules(
  params: ScheduleQuery = {}
): Promise<PageResponse<Schedule>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.per_page ?? 25));

  const raw = await apiGetJson<unknown>(
    queryUrl("/api/schedules", {
      classroom_id: params.classroom_id,
      kelas_id: params.kelas_id,
      week_start_date: dateOnly(params.week_start_date),
      minggu: dateOnly(params.minggu),
      dari: dateOnly(params.dari),
      sampai: dateOnly(params.sampai),
      q: text(params.q),
      page,
      per_page: perPage,
    }),
    { signal: params.signal }
  );

  return normalizePage(raw, normalizeSchedule);
}

export async function fetchScheduleRows(
  params: Omit<
    ScheduleQuery,
    "page" | "per_page"
  > & {
    per_page?: number;
  } = {}
): Promise<Schedule[]> {
  const size = Math.min(
    100,
    Math.max(1, params.per_page ?? 100)
  );

  const first = await fetchSchedules({
    ...params,
    page: 1,
    per_page: size,
  });

  const items =
    first.total_pages <= 1
      ? first.items
      : await collectPages<Schedule>(
          first,
          (page: number) =>
            fetchSchedules({
              ...params,
              page,
              per_page: size,
            })
        );

  const unique = new Map<
    string,
    Schedule
  >();

  items.forEach((item, index) => {
    const key =
      item.id !== null
        ? String(item.id)
        : [
            item.classroom_id,
            item.week_start_date,
            item.tanggal,
            item.journal_id,
            index,
          ].join("|");

    unique.set(key, item);
  });

  return [...unique.values()].sort(
    (left, right) =>
      left.tanggal.localeCompare(
        right.tanggal,
        "id",
        {
          numeric: true,
        }
      )
  );
}

export async function fetchScheduleWeek(
  weekStartDate: string,
  options: {
    classroom_id?: AdminId;
    q?: string;
    signal?: AbortSignal;
  } = {}
): Promise<Schedule[]> {
  return fetchScheduleRows({
    classroom_id:
      options.classroom_id,
    week_start_date:
      weekStartDate,
    q: options.q,
    signal: options.signal,
    per_page: 100,
  });
}

export async function fetchAllSchedules(
  perPage = 100,
  signal?: AbortSignal
): Promise<Schedule[]> {
  return fetchScheduleRows({
    per_page: perPage,
    signal,
  });
}

export async function fetchScheduleById(
  id: AdminId,
  signal?: AbortSignal
): Promise<Schedule> {
  const raw = await apiGetJson<unknown>(
    `/api/schedules/${requirePositiveId(id, "ID jadwal")}`,
    { signal }
  );
  return normalizeSchedule(raw);
}

export async function createSchedule(
  payload: SchedulePayload
): Promise<Schedule> {
  const raw = await apiRequestJson<unknown>("/api/schedules", {
    method: "POST",
    jsonBody: serializeSchedule(payload),
  });
  return normalizeSchedule(raw);
}

export async function updateSchedule(
  id: AdminId,
  payload: SchedulePayload
): Promise<Schedule> {
  const raw = await apiRequestJson<unknown>(
    `/api/schedules/${requirePositiveId(id, "ID jadwal")}`,
    {
      method: "PUT",
      jsonBody: serializeSchedule(payload),
    }
  );
  return normalizeSchedule(raw);
}

export async function deleteSchedule(id: AdminId): Promise<void> {
  await apiRequestJson<unknown>(
    `/api/schedules/${requirePositiveId(id, "ID jadwal")}`,
    { method: "DELETE" }
  );
}


export type AnnouncementType = "Info" | "Penting" | "Kegiatan" | "Libur";
export type AnnouncementTarget = "Semua" | "Guru" | "Siswa" | "Staff";

export interface Announcement {
  id: AdminId | null;
  judul: string;
  isi: string;
  tanggal_terbit: string;
  tipe: AnnouncementType;
  target_audien: AnnouncementTarget;
}

export interface AnnouncementPayload {
  judul: string;
  isi: string;
  tanggal_terbit: string;
  tipe: AnnouncementType;
  target_audien: AnnouncementTarget;
}

export interface AnnouncementQuery {
  q?: string;
  tipe?: AnnouncementType;
  target_audien?: AnnouncementTarget;
  page?: number;
  per_page?: number;
  signal?: AbortSignal;
}

const ANNOUNCEMENT_TYPES: AnnouncementType[] = [
  "Info",
  "Penting",
  "Kegiatan",
  "Libur",
];
const ANNOUNCEMENT_TARGETS: AnnouncementTarget[] = [
  "Semua",
  "Guru",
  "Siswa",
  "Staff",
];

function normalizeAnnouncementType(value: unknown): AnnouncementType {
  const normalized = text(value) as AnnouncementType;
  return ANNOUNCEMENT_TYPES.includes(normalized) ? normalized : "Info";
}

function normalizeAnnouncementTarget(value: unknown): AnnouncementTarget {
  const normalized = text(value) as AnnouncementTarget;
  return ANNOUNCEMENT_TARGETS.includes(normalized) ? normalized : "Semua";
}

export function normalizeAnnouncement(raw: unknown): Announcement {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("Response pengumuman tidak valid.");
  }

  const value = raw as Record<string, unknown>;
  return {
    id: idOf(value.id),
    judul: text(value.judul),
    isi: text(value.isi),
    tanggal_terbit: dateOnly(value.tanggal_terbit),
    tipe: normalizeAnnouncementType(value.tipe),
    target_audien: normalizeAnnouncementTarget(value.target_audien),
  };
}

function serializeAnnouncement(payload: AnnouncementPayload) {
  if (!text(payload.judul)) {
    throw new Error("Judul pengumuman wajib diisi.");
  }
  if (!text(payload.isi)) {
    throw new Error("Isi pengumuman wajib diisi.");
  }
  if (!ANNOUNCEMENT_TYPES.includes(payload.tipe)) {
    throw new Error("Tipe pengumuman tidak valid.");
  }
  if (!ANNOUNCEMENT_TARGETS.includes(payload.target_audien)) {
    throw new Error("Target audiens tidak valid.");
  }

  return {
    judul: text(payload.judul),
    isi: text(payload.isi),
    tanggal_terbit: requireDate(payload.tanggal_terbit, "Tanggal terbit"),
    tipe: payload.tipe,
    target_audien: payload.target_audien,
  };
}

export async function fetchAnnouncements(
  params: AnnouncementQuery = {}
): Promise<PageResponse<Announcement>> {
  const page = Math.max(1, params.page ?? 1);
  const perPage = Math.min(100, Math.max(1, params.per_page ?? 25));

  const raw = await apiGetJson<unknown>(
    queryUrl("/api/announcements", {
      q: text(params.q),
      tipe: params.tipe,
      target_audien: params.target_audien,
      page,
      per_page: perPage,
    }),
    { signal: params.signal }
  );

  return normalizePage(raw, normalizeAnnouncement);
}

export async function fetchAllAnnouncements(
  perPage = 100,
  signal?: AbortSignal
): Promise<Announcement[]> {
  const size = Math.min(100, Math.max(1, perPage));
  const first = await fetchAnnouncements({ page: 1, per_page: size, signal });
  const items = await collectPages<Announcement>(
    first,
    (page: number) => fetchAnnouncements({ page, per_page: size, signal })
  );

  return items.sort((a: Announcement, b: Announcement) =>
    b.tanggal_terbit.localeCompare(a.tanggal_terbit, "id", { numeric: true })
  );
}

export async function createAnnouncement(
  payload: AnnouncementPayload
): Promise<Announcement> {
  const raw = await apiRequestJson<unknown>("/api/announcements", {
    method: "POST",
    jsonBody: serializeAnnouncement(payload),
  });
  return normalizeAnnouncement(raw);
}

export async function updateAnnouncement(
  id: AdminId,
  payload: AnnouncementPayload
): Promise<Announcement> {
  const raw = await apiRequestJson<unknown>(
    `/api/announcements/${requirePositiveId(id, "ID pengumuman")}`,
    {
      method: "PUT",
      jsonBody: serializeAnnouncement(payload),
    }
  );
  return normalizeAnnouncement(raw);
}

export async function deleteAnnouncement(id: AdminId): Promise<void> {
  await apiRequestJson<unknown>(
    `/api/announcements/${requirePositiveId(id, "ID pengumuman")}`,
    { method: "DELETE" }
  );
}
