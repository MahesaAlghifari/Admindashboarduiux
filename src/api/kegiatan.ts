import { apiGetJson, apiRequestJson } from "./http";
import { fetchAllClassrooms, type Classroom } from "./classrooms";
import { fetchAllCurriculums, fetchAllIndicators } from "./administrasi";
import { fetchCurrentAcademicPeriod, type AcademicPeriod } from "./academic-periods";
import {
  fetchSchoolCalendarContext,
  resolveSchoolDayStatus,
  type SchoolCalendarContext,
  type SchoolDayStatus,
} from "./school-calendar";
import {
  fetchActivePeriodStudents,
  type ActivePeriodStudent,
} from "./active-period-students";
import { fetchStudentById } from "./students";
// queryClient is JavaScript in the current project and is intentionally shared by the whole app.
// @ts-ignore
import { queryClient } from "../lib/queryClient";

type Id = number | string;

export type AttendanceStatus = "H" | "S" | "I" | "A";
export type SemesterNumber = 1 | 2;

export interface KegiatanClassroomCurriculum {
  id: Id;
  nama_kurikulum: string;
  tahun_ajaran: string;
  indikator_ids: Id[];
}

export interface KegiatanClassroomTeacher {
  id: Id | null;
  nik: string;
  nama_lengkap: string;
  jabatan: string;
}

export interface KegiatanClassroom {
  id: Id;
  nama_kelas: string;
  curriculum: KegiatanClassroomCurriculum | null;
  wali_kelas: KegiatanClassroomTeacher | null;
}

export interface ReportAcademicPeriod {
  tahun_ajaran: string;
  semester: SemesterNumber;
  semester_key: "sem1" | "sem2";
  semester_label: string;
  nama_periode: string;
  tanggal_mulai: string;
  tanggal_selesai: string;
}

export interface ReportCurriculumContext {
  period: ReportAcademicPeriod;
  curriculum: KegiatanClassroomCurriculum | null;
  indicators: ReportIndicator[];
}

export interface KegiatanStudent {
  id: Id;
  nama_lengkap: string;
  nomor_induk: string;
  nisn: string;
  classroom_id: Id | null;
  classroom_name: string;
  jenis_kelamin: string;
  foto: string;
  berat_badan: number | null;
  tinggi_badan: number | null;
}

export interface AttendanceRecord {
  student_id: Id;
  tanggal: string;
  status: AttendanceStatus | "";
  keterangan: string;
  classroom_id?: Id | null;
  classroom_name?: string;
  is_cross_class?: boolean;
  student_name?: string;
  student_nisn?: string;
  student_gender?: string;
}

export interface AttendanceSheetItem extends KegiatanStudent {
  attendance: AttendanceRecord;
}

export interface AttendanceSheet {
  classroom_id: Id;
  tanggal: string;
  is_holiday: boolean;
  holiday_label: string;
  holiday_description: string;
  is_saved: boolean;
  saved_count: number;
  total_students: number;
  items: AttendanceSheetItem[];
}

export interface AttendanceBulkPayload {
  classroom_id: Id;
  tanggal: string;
  allow_update?: boolean;
  locked_student_ids?: Id[];
  items: Array<{
    student_id: Id;
    status: AttendanceStatus;
    keterangan?: string;
  }>;
}

export interface AttendanceFillDate {
  tanggal: string;
  saved_count: number;
  total_students: number;
  is_complete: boolean;
  is_partial: boolean;
}

export interface AttendanceRecapHistory {
  tanggal: string;
  status: AttendanceStatus;
  keterangan: string;
  classroom_id?: Id | null;
  classroom_name?: string;
}

export interface AttendanceRecapItem extends KegiatanStudent {
  history: AttendanceRecapHistory[];
  stats: {
    h: number;
    s: number;
    i: number;
    a: number;
    total: number;
    percentage: number;
  };
}

export interface AttendanceReportPeriodSummary {
  tahun_ajaran: string;
  total_records: number;
  dari: string;
  sampai: string;
}

export interface AttendanceReportResult {
  dari: string;
  sampai: string;
  items: AttendanceRecapItem[];
  total_records: number;
}

export interface DailyActivityPlan {
  schedule_id: Id | null;
  journal_id: Id | null;
  week_start: string;
  tema: string;
  pilar_karakter: string;
  nilai_karakter: string;
  jurnal: string;
  aktivitas: string;
  pembiasaan: string;
  has_schedule: boolean;
}

export type DailyActivityCompletionStatus = "" | "Dilakukan" | "Tidak Dilakukan";

export interface DailyActivityStudentLog {
  student_id: Id;
  /**
   * Partisipasi Aktivitas Harian per siswa. Backend belum punya kolom khusus.
   * Status tambahan disimpan di cache client agar payload API tetap memakai
   * field native backend dan tidak membebani kolom catatan_guru.
   */
  /** Alias lama; tetap diisi agar laporan lama tidak rusak. */
  nilai_karakter_status?: DailyActivityCompletionStatus;
  /** Partisipasi Pilar Karakter pada form mingguan siswa. */
  pilar_karakter_status?: DailyActivityCompletionStatus;
  jurnal_status?: DailyActivityCompletionStatus;
  aktivitas_status?: DailyActivityCompletionStatus;
  pembiasaan_status?: DailyActivityCompletionStatus;
  /** Data refleksi harian seperti lembar Aktivitas Harian sekolah. */
  makanan: string;
  perasaan: string;
  barang_bawaan: string;
  catatan_guru: string;
  /**
   * Rencana harian untuk tanggal ini. Backend hanya punya rencana_mingguan;
   * variasi Senin-Jumat dipertahankan di cache client.
   */
  daily_plan?: DailyActivityPlan;
  student_name?: string;
  student_nisn?: string;
  student_gender?: string;
  classroom_id?: Id | null;
  classroom_name?: string;
  activity_source_classroom_id?: Id | null;
  activity_source_classroom_name?: string;
  activity_readonly?: boolean;
}

export interface DailyActivitySheet {
  classroom_id: Id;
  tanggal: string;
  plan: DailyActivityPlan;
  is_holiday: boolean;
  holiday_label: string;
  holiday_description: string;
  items: Array<KegiatanStudent & { log: DailyActivityStudentLog }>;
}

export interface DailyActivityPayload {
  classroom_id: Id;
  classroom_name?: string;
  tanggal: string;
  week_start: string;
  plan: DailyActivityPlan;
  is_holiday: boolean;
  items: DailyActivityStudentLog[];
  /**
   * Snapshot minggu yang sudah ada di UI. Dipakai saat menyimpan supaya proses
   * save tidak perlu melakukan rangkaian GET tambahan sebelum PUT.
   */
  week_sheets?: Array<{
    tanggal: string;
    is_holiday: boolean;
    items: DailyActivityStudentLog[];
  }>;
}

export interface DailyActivityReportRecord {
  classroom_id: Id;
  classroom_name: string;
  tanggal: string;
  week_start: string;
  plan: DailyActivityPlan;
  is_holiday: boolean;
  items: Array<KegiatanStudent & { log: DailyActivityStudentLog }>;
  stats: {
    total_students: number;
    filled_students: number;
    meals_habis: number;
    meals_tersisa: number;
    meals_tidak: number;
    feeling_senang: number;
    teacher_notes: number;
  };
}

export interface DailyActivityReportPeriodSummary {
  tahun_ajaran: string;
  total_days: number;
  dari: string;
  sampai: string;
}

export interface DailyActivityReportResult {
  dari: string;
  sampai: string;
  items: DailyActivityReportRecord[];
  total_days: number;
  total_holidays: number;
  total_student_logs: number;
  total_filled_students: number;
}

export interface WeeklyStudentActivityDay {
  hari: string;
  tanggal: string;
  is_holiday: boolean;
  plan: DailyActivityPlan;
  log: DailyActivityStudentLog;
  parent_note: string;
  communication_teacher_note: string;
  participation_recorded: boolean;
}

export interface WeeklyStudentActivityReportItem extends KegiatanStudent {
  week: string;
  week_start: string;
  week_end: string;
  plan: DailyActivityPlan;
  days: WeeklyStudentActivityDay[];
  weekly_teacher_summary: string;
  stats: {
    active_days: number;
    holiday_days: number;
    filled_days: number;
    parent_notes: number;
    teacher_notes: number;
    meals_recorded: number;
    feelings_recorded: number;
  };
}

export interface WeeklyStudentActivityReportResult {
  week: string;
  dari: string;
  sampai: string;
  items: WeeklyStudentActivityReportItem[];
  total_students: number;
  total_filled_days: number;
  total_parent_notes: number;
  total_teacher_notes: number;
}

export interface CommunicationBookDay {
  hari: string;
  tanggal: string;
  /** True only when this date exists in the backend response. */
  persisted?: boolean;
  is_holiday: boolean;
  holiday_label: string;
  holiday_description: string;
  jam_tidur: string;
  anak_bab: string;
  suhu_tubuh: string;
  menu_sarapan: string;
  catatan_ortu: string;
  catatan_guru: string;
}

export interface CommunicationBook {
  student_id: Id;
  week: string;
  days: CommunicationBookDay[];
  student_name?: string;
  student_nisn?: string;
  student_gender?: string;
  classroom_id?: Id | null;
  classroom_name?: string;
}

export interface CommunicationBookReportItem extends KegiatanStudent {
  books: CommunicationBook[];
  stats: {
    weeks: number;
    filled_days: number;
    parent_notes: number;
    teacher_notes: number;
    data_points: number;
    last_activity: string;
  };
}

export interface CommunicationBookReportPeriodSummary {
  tahun_ajaran: string;
  total_books: number;
  dari: string;
  sampai: string;
}

export interface CommunicationBookReportResult {
  dari: string;
  sampai: string;
  items: CommunicationBookReportItem[];
  total_books: number;
  total_days: number;
}

export interface StudentDevelopment {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  tinggi_badan: number | null;
  berat_badan: number | null;
  bmi: number | null;
  status_gizi: string;
  lingkar_kepala?: number | null;
  catatan?: string;
  tanggal_pemeriksaan?: string;
  student_name?: string;
  student_nisn?: string;
  student_gender?: string;
  classroom_id?: Id | null;
  classroom_name?: string;
}

export interface DevelopmentAnalysisStudent extends KegiatanStudent {
  developments: StudentDevelopment[];
  latest: StudentDevelopment | null;
  first: StudentDevelopment | null;
  delta_tinggi: number | null;
  delta_berat: number | null;
}

export interface DevelopmentAnalysisPeriod {
  tahun_ajaran: string;
  semester: SemesterNumber;
  label: string;
}

export interface DevelopmentAnalysisResult {
  periods: DevelopmentAnalysisPeriod[];
  students: DevelopmentAnalysisStudent[];
  summary: {
    total_students: number;
    students_with_data: number;
    latest_avg_height: number | null;
    latest_avg_weight: number | null;
    avg_height_change: number | null;
    avg_weight_change: number | null;
    status_distribution: Array<{ status: string; count: number }>;
    trend: Array<{
      tahun_ajaran: string;
      semester: SemesterNumber;
      label: string;
      average_height: number | null;
      average_weight: number | null;
      student_count: number;
    }>;
  };
}

export interface ReportIndicator {
  id: Id;
  kode: string;
  aspek: string;
  sub_aspek: string;
  deskripsi: string;
}

export interface StudentReportScore {
  indicator_id: Id;
  scale: "BB" | "MB" | "BSH" | "BSB";
}

export type StudentReportStatus = "DRAFT" | "FINAL";

export interface StudentReportHistoryItem {
  action: "CREATED" | "UPDATED" | "FINALIZED" | "REOPENED";
  at: string;
  by: string;
}

export interface StudentReport {
  student_id: Id;
  student_nama?: string;
  nisn?: string;
  foto?: string;
  classroom_id?: Id | null;
  classroom_nama?: string;
  curriculum_id?: Id | null;
  curriculum_nama?: string;
  tahun_ajaran: string;
  semester: SemesterNumber;
  scores: StudentReportScore[];
  catatan: string;
  fisik: {
    berat_badan: number | null;
    tinggi_badan: number | null;
  };
  absensi: {
    hadir?: number;
    sakit: number;
    izin: number;
    alpa: number;
    total?: number;
  };
  komentar_ortu: string;
  report_status: StudentReportStatus;
  created_at: string;
  created_by: string;
  updated_at: string;
  updated_by: string;
  finalized_at: string;
  finalized_by: string;
  history: StudentReportHistoryItem[];
}

export interface StudentReportProgress {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  indicator_ids: Id[];
  has_catatan: boolean;
  has_komentar_ortu: boolean;
  has_development?: boolean;
  report_status: StudentReportStatus;
  backend_status?: string;
  filled_count?: number;
  total_count?: number;
}

export interface SchoolProfile {
  nama_sekolah: string;
  alamat: string;
  npsn?: string;
  alamat_jalan_1?: string;
  alamat_jalan_2?: string;
  kelurahan_kecamatan?: string;
  kota_provinsi?: string;
  kode_pos?: string;
  telepon?: string;
  email?: string;
}

export interface StudentReportIdentity {
  id: Id;
  nama_lengkap: string;
  nama_panggilan: string;
  nisn: string;
  nik: string;
  tempat_lahir: string;
  tanggal_lahir: string;
  jenis_kelamin: string;
  agama: string;
  kewarganegaraan: string;
  alamat_lengkap: string;
  no_telepon_rumah: string;
  bahasa_sehari_hari: string;
  status_tempat_tinggal: string;
  jarak_ke_sekolah: number;
  jumlah_saudara_kandung: number;
  jumlah_saudara_tiri: number;
  jumlah_saudara_angkat: number;
  asal_peserta_didik: string;
  nama_lembaga: string;
  alamat_lembaga: string;
  nama_lembaga_asal: string;
  alamat_lembaga_asal: string;
  kelompok_umur_sebelumnya: string;
  catatan_penting: string;
  classroom_id: Id | null;
  classroom_name: string;
  parent: {
    nama_ayah: string;
    pendidikan_ayah: string;
    pekerjaan_ayah: string;
    kontak_ayah: string;
    nama_ibu: string;
    pendidikan_ibu: string;
    pekerjaan_ibu: string;
    kontak_ibu: string;
    nama_wali: string;
    pendidikan_wali: string;
    pekerjaan_wali: string;
    hubungan_keluarga_wali: string;
    kontak_wali: string;
    no_hp_ortu: string;
  };
  status: {
    status_aktif: boolean;
    tanggal_masuk: string;
    tanggal_keluar: string;
    alasan_keluar: string;
    kelompok_umur: string;
    tahun_pelajaran: string;
    nomor_surat_keterangan: string;
    lembaga_lanjutan: string;
    tanggal_pindah: string;
    dari_kelompok_umur: string;
    ke_lembaga: string;
    tingkat_kelompok_umur: string;
  };
}

export interface ReportPeriodSummary {
  tahun_ajaran: string;
  semester: SemesterNumber;
  total_reports: number;
  total_final: number;
  total_draft: number;
}

export interface StudentReportSupportStatus {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  has_development: boolean;
  has_attendance: boolean;
  attendance_days: number;
}

const SCHOOL_PROFILE_STORAGE_KEY = "school_sphere_school_profile";

const DEFAULT_SCHOOL_PROFILE: SchoolProfile = {
  nama_sekolah: "SEKOLAH SS",
  alamat: "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  npsn: "-",
  alamat_jalan_1: "Perumahan Baranangsiang Indah",
  alamat_jalan_2: "Jl. Megamendung IV Blok E1 No. 21",
  kelurahan_kecamatan: "Katulampa / Bogor Timur",
  kota_provinsi: "Kota Bogor / Jawa Barat",
  kode_pos: "16144",
  telepon: "0811 - 9141 - 285",
  email: "adm.sekolahss@gmail.com",
};

const text = (value: unknown) => String(value ?? "").trim();
const curriculumDisplayName = (value: unknown) => {
  const raw = text(value);
  if (!raw) return "Kurikulum";
  return (
    raw.replace(
      /\s*·\s*Penetapan\s+20\d{2}\s*[\/-]\s*20\d{2}(?:\s+#\d+)?\s*$/i,
      ""
    ).trim() || raw
  );
};
const obj = (value: unknown): Record<string, unknown> =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
const list = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;

  let current = obj(value);
  for (let depth = 0; depth < 4; depth += 1) {
    for (const key of ["items", "data", "results", "rows", "records"]) {
      if (Array.isArray(current[key])) return current[key] as unknown[];
    }

    const nested = [current.data, current.result, current.detail]
      .map(obj)
      .find((candidate) => Object.keys(candidate).length > 0);
    if (!nested) break;
    current = nested;
  }

  return [];
};
const numberOrNull = (value: unknown): number | null => {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};
const idOf = (value: unknown): Id | null =>
  typeof value === "number" || typeof value === "string" ? value : null;
const dateOnly = (value: unknown) => text(value).slice(0, 10);
const localTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
const validSemester = (value: unknown): SemesterNumber =>
  Number(value) === 2 ? 2 : 1;
const attendanceStatusMap: Record<string, AttendanceStatus> = { H: "H", HADIR: "H", S: "S", SAKIT: "S", I: "I", IZIN: "I", A: "A", ALPA: "A" };
const attendanceStatus = (value: unknown): AttendanceStatus | "" => attendanceStatusMap[text(value).toUpperCase()] || "";
const isAttendanceStatus = (value: unknown): value is AttendanceStatus => Boolean(attendanceStatus(value));
const queryUrl = (
  path: string,
  params: Record<string, string | number | null | undefined>
) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};

const qk = {
  root: ["kegiatan"] as const,
  calendar: () => ["school-calendar", "active"] as const,
  classrooms: () => ["kegiatan", "classrooms"] as const,
  students: (classroomId: unknown, q: unknown) =>
    ["kegiatan", "students", text(classroomId || "all"), text(q)] as const,
  attendance: (classroomId: unknown, tanggal: unknown, q: unknown) =>
    ["kegiatan", "attendance", text(classroomId), dateOnly(tanggal), text(q)] as const,
  attendanceFill: (classroomId: unknown, dari: unknown, sampai: unknown) =>
    ["kegiatan", "attendance", "fill", text(classroomId), dateOnly(dari), dateOnly(sampai)] as const,
  recap: (classroomId: unknown, studentId: unknown, dari: unknown, sampai: unknown, q: unknown) =>
    ["kegiatan", "attendance-recap", text(classroomId || "all"), text(studentId || "all"), dateOnly(dari), dateOnly(sampai), text(q)] as const,
  dailyWeek: (classroomId: unknown, weekStart: unknown) =>
    ["kegiatan", "daily-week", text(classroomId), dateOnly(weekStart)] as const,
  communication: (studentId: unknown, week: unknown) =>
    ["kegiatan", "communication", text(studentId), dateOnly(week)] as const,
  developments: (studentId: unknown, year?: unknown, semester?: unknown) =>
    ["kegiatan", "developments", text(studentId), text(year), text(semester)] as const,
  reportsList: (classroomId: unknown, year: unknown, semester: unknown, q: unknown) =>
    ["kegiatan", "reports", text(classroomId || "all"), text(year), text(semester), text(q)] as const,
  report: (studentId: unknown, year: unknown, semester: unknown) =>
    ["kegiatan", "report", text(studentId), text(year), text(semester)] as const,
  indicators: () => ["kegiatan", "report-indicators"] as const,
};

async function cached<T>(
  queryKey: readonly unknown[],
  queryFn: (signal: AbortSignal) => Promise<T>,
  staleTime = 30_000
): Promise<T> {
  return queryClient.fetchQuery({
    queryKey,
    queryFn: ({ signal }: { signal: AbortSignal }) => queryFn(signal),
    staleTime,
  }) as Promise<T>;
}

const invalidate = async (queryKey: readonly unknown[]) => {
  await queryClient.invalidateQueries({ queryKey });
};

const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const addDays = (dateString: string, amount: number) => {
  const [y, m, d] = dateString.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + amount);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const mondayOf = (dateString: string) => {
  const raw = dateOnly(dateString);
  const [y, m, d] = raw.split("-").map(Number);
  if (!y || !m || !d) return "";
  const date = new Date(y, m - 1, d);
  const day = date.getDay() || 7;
  date.setDate(date.getDate() - day + 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

const weekStartDate = (value: unknown) => {
  const raw = text(value);
  const isoWeek = /^(\d{4})-W(\d{2})$/.exec(raw);

  if (isoWeek) {
    const year = Number(isoWeek[1]);
    const week = Number(isoWeek[2]);
    const januaryFourth = new Date(year, 0, 4);
    const day = januaryFourth.getDay() || 7;
    const monday = new Date(januaryFourth);
    monday.setDate(
      januaryFourth.getDate() - day + 1 + (week - 1) * 7
    );
    return `${monday.getFullYear()}-${String(monday.getMonth() + 1).padStart(2, "0")}-${String(monday.getDate()).padStart(2, "0")}`;
  }

  return mondayOf(raw);
};


function newestCurriculumForYear(
  curriculums: Awaited<ReturnType<typeof fetchAllCurriculums>>,
  tahunAjaran: string
) {
  const year = text(tahunAjaran);
  return [...curriculums]
    .filter((item) => item.id !== null && text(item.tahun_ajaran) === year)
    .sort((a, b) => {
      const idA = Number(a.id);
      const idB = Number(b.id);
      if (Number.isFinite(idA) && Number.isFinite(idB) && idA !== idB) {
        return idB - idA;
      }
      return String(b.id ?? "").localeCompare(String(a.id ?? ""), "id", { numeric: true });
    })[0] ?? null;
}

async function sharedCurrentAcademicPeriod(): Promise<AcademicPeriod> {
  return queryClient.fetchQuery({
    queryKey: ["admin", "academic-period", "current"],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchCurrentAcademicPeriod(signal),
    staleTime: 60_000,
  }) as Promise<AcademicPeriod>;
}

async function sharedSchoolCalendar(): Promise<SchoolCalendarContext> {
  const period = await sharedCurrentAcademicPeriod();
  return queryClient.fetchQuery({
    queryKey: [
      ...qk.calendar(),
      period.id,
      dateOnly(period.tanggal_mulai),
      dateOnly(period.tanggal_selesai),
    ],
    queryFn: ({ signal }: { signal: AbortSignal }) =>
      fetchSchoolCalendarContext(signal, period),
    staleTime: 60_000,
  }) as Promise<SchoolCalendarContext>;
}

async function schoolDayStatus(date: string): Promise<SchoolDayStatus> {
  const calendar = await sharedSchoolCalendar();
  return resolveSchoolDayStatus(dateOnly(date), calendar);
}

async function assertEffectiveSchoolDay(
  date: string,
  label = "Tanggal"
): Promise<SchoolDayStatus> {
  await assertDateInActiveAcademicPeriod(date, label);
  const status = await schoolDayStatus(date);

  if (status.is_holiday) {
    throw new Error(
      `${label} ${dateOnly(date)} adalah hari libur (${status.label}). Input tidak diperlukan.`
    );
  }

  return status;
}

export async function fetchKegiatanCurrentAcademicPeriod(): Promise<ReportAcademicPeriod> {
  const period = await sharedCurrentAcademicPeriod();
  return {
    tahun_ajaran: text(period.tahun_ajaran),
    semester: validSemester(period.semester),
    semester_key: Number(period.semester) === 2 ? "sem2" : "sem1",
    semester_label:
      Number(period.semester) === 2
        ? "Semester II (Genap)"
        : "Semester I (Ganjil)",
    nama_periode: text(period.nama_periode),
    tanggal_mulai: dateOnly(period.tanggal_mulai),
    tanggal_selesai: dateOnly(period.tanggal_selesai),
  };
}

async function sharedCurriculums() {
  return queryClient.fetchQuery({
    queryKey: ["admin", "curriculums"],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchAllCurriculums(100, signal),
    staleTime: 30_000,
  }) as Promise<Awaited<ReturnType<typeof fetchAllCurriculums>>>;
}

async function sharedIndicators() {
  return queryClient.fetchQuery({
    queryKey: ["admin", "indicators"],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchAllIndicators(100, signal),
    staleTime: 60_000,
  }) as Promise<Awaited<ReturnType<typeof fetchAllIndicators>>>;
}

async function sharedClassrooms() {
  return queryClient.fetchQuery({
    queryKey: ["admin", "classrooms", "master"],
    queryFn: ({ signal }: { signal: AbortSignal }) => fetchAllClassrooms(100, signal),
    staleTime: 30_000,
  }) as Promise<Awaited<ReturnType<typeof fetchAllClassrooms>>>;
}

function activePeriodBounds(period: AcademicPeriod) {
  return {
    start: dateOnly(period.tanggal_mulai),
    end: dateOnly(period.tanggal_selesai),
  };
}

function isDateWithinBounds(
  date: string,
  bounds: { start: string; end: string }
) {
  const value = dateOnly(date);
  if (!value) return false;
  if (bounds.start && value < bounds.start) return false;
  if (bounds.end && value > bounds.end) return false;
  return true;
}

function rangesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
) {
  if (!startA || !endA || !startB || !endB) return false;
  return startA <= endB && startB <= endA;
}

async function assertDateInActiveAcademicPeriod(
  date: string,
  label = "Tanggal"
) {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);
  const value = dateOnly(date);

  if (!value) {
    throw new Error(`${label} tidak valid.`);
  }

  if (!isDateWithinBounds(value, bounds)) {
    throw new Error(
      `${label} ${value} berada di luar periode akademik aktif ${text(
        period.nama_periode
      ) || `${text(period.tahun_ajaran)} Semester ${validSemester(period.semester)}`}.`
    );
  }

  return period;
}

async function assertRangeInActiveAcademicPeriod(
  from: string,
  to: string,
  label = "Rentang tanggal"
) {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);
  const dari = dateOnly(from);
  const sampai = dateOnly(to);

  if (!dari || !sampai || dari > sampai) {
    throw new Error(`${label} tidak valid.`);
  }

  if (
    (bounds.start && dari < bounds.start) ||
    (bounds.end && sampai > bounds.end)
  ) {
    throw new Error(
      `${label} harus berada di dalam periode akademik aktif ${text(
        period.nama_periode
      ) || text(period.tahun_ajaran)}.`
    );
  }

  return period;
}

async function assertWeekOverlapsActiveAcademicPeriod(weekStart: string) {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);
  const monday = dateOnly(weekStart);
  const friday = addDays(monday, 4);

  if (
    !monday ||
    !friday ||
    !rangesOverlap(monday, friday, bounds.start, bounds.end)
  ) {
    throw new Error(
      `Minggu yang dipilih berada di luar periode akademik aktif ${text(
        period.nama_periode
      ) || text(period.tahun_ajaran)}.`
    );
  }

  return period;
}

async function assertCurrentReportPeriod(
  tahunAjaran: string,
  semester: SemesterNumber
) {
  const period = await sharedCurrentAcademicPeriod();

  if (
    text(period.tahun_ajaran) !== text(tahunAjaran) ||
    validSemester(period.semester) !== validSemester(semester)
  ) {
    throw new Error(
      `Kegiatan hanya dapat diproses pada periode akademik aktif: ${
        text(period.nama_periode) ||
        `${text(period.tahun_ajaran)} Semester ${validSemester(period.semester)}`
      }.`
    );
  }

  return period;
}

async function sharedEligibleKegiatanStudents(): Promise<ActivePeriodStudent[]> {
  return queryClient.fetchQuery({
    queryKey: ["kegiatan", "eligible-students"],
    queryFn: async ({ signal }: { signal: AbortSignal }) => {
      const [period, classrooms] = await Promise.all([
        sharedCurrentAcademicPeriod(),
        sharedClassrooms(),
      ]);

      return fetchActivePeriodStudents({
        period,
        classrooms,
        requireClassroom: true,
        signal,
      });
    },
    // Daftar Kegiatan hanya berisi siswa yang status pendidikan masih aktif
    // (masih di lembaga) dan punya penempatan kelas saat ini.
    staleTime: 30_000,
  }) as Promise<ActivePeriodStudent[]>;
}

async function assertEligibleKegiatanStudent(
  studentId: Id,
  expectedClassroomId?: Id | null
): Promise<ActivePeriodStudent> {
  const students = await sharedEligibleKegiatanStudents();

  const student = students.find(
    (item) => String(item.id) === String(studentId)
  );

  if (!student) {
    throw new Error(
      "Siswa tidak aktif atau belum memiliki penempatan kelas yang valid sehingga tidak dapat diproses."
    );
  }

  if (
    expectedClassroomId !== undefined &&
    expectedClassroomId !== null &&
    String(student.classroom_id) !== String(expectedClassroomId)
  ) {
    throw new Error(
      "Penempatan kelas siswa sudah berubah. Muat ulang data sebelum melanjutkan."
    );
  }

  const classrooms = await sharedClassrooms();
  const classExists = classrooms.some(
    (item) =>
      item.id !== null &&
      String(item.id) === String(student.classroom_id)
  );

  if (!classExists) {
    throw new Error(
      "Kelas siswa tidak lagi terdaftar. Perbarui penempatan siswa di Manajemen Pengguna."
    );
  }

  return student;
}

export async function fetchReportCurriculumContext(): Promise<ReportCurriculumContext> {
  const [period, curriculums, indicators] = await Promise.all([
    sharedCurrentAcademicPeriod(),
    sharedCurriculums(),
    sharedIndicators(),
  ]);

  const curriculum = newestCurriculumForYear(curriculums, period.tahun_ajaran);
  const allowedIds = new Set(
    (curriculum?.indikator_ids ?? []).map((id) => String(id))
  );

  const reportIndicators: ReportIndicator[] = indicators
    .filter(
      (indicator) =>
        indicator.id !== null &&
        allowedIds.has(String(indicator.id))
    )
    .map((indicator) => ({
      id: indicator.id as Id,
      kode: text(indicator.kode),
      aspek: text(indicator.aspek),
      sub_aspek: text(indicator.sub_aspek),
      deskripsi: text(indicator.deskripsi),
    }));

  return {
    period: {
      tahun_ajaran: text(period.tahun_ajaran),
      semester: validSemester(period.semester),
      semester_key: Number(period.semester) === 2 ? "sem2" : "sem1",
      semester_label:
        Number(period.semester) === 2
          ? "Semester II (Genap)"
          : "Semester I (Ganjil)",
      nama_periode: text(period.nama_periode),
      tanggal_mulai: dateOnly(period.tanggal_mulai),
      tanggal_selesai: dateOnly(period.tanggal_selesai),
    },
    curriculum: curriculum?.id !== null && curriculum?.id !== undefined
      ? {
          id: curriculum.id,
          nama_kurikulum: curriculumDisplayName(curriculum.nama_kurikulum),
          tahun_ajaran: text(curriculum.tahun_ajaran),
          indikator_ids: (curriculum.indikator_ids ?? []).filter(
            (id): id is Id => typeof id === "number" || typeof id === "string"
          ),
        }
      : null,
    indicators: reportIndicators,
  };
}

export async function fetchKegiatanClassrooms(): Promise<KegiatanClassroom[]> {
  const [period, classrooms, curriculums] = await Promise.all([
    sharedCurrentAcademicPeriod(),
    sharedClassrooms(),
    sharedCurriculums(),
  ]);

  if (!text(period.tahun_ajaran)) {
    throw new Error(
      "Periode akademik aktif belum tersedia. Aktifkan periode akademik terlebih dahulu."
    );
  }
  const curriculumMap = new Map(
    curriculums
      .filter((item) => item.id !== null)
      .map((item) => [String(item.id), item])
  );

  return classrooms
    .filter(
      (item): item is Classroom & { id: Id } =>
        item.id !== null && Boolean(text(item.nama_kelas))
    )
    .map((item) => {
      const fullCurriculum =
        item.curriculum?.id !== null && item.curriculum?.id !== undefined
          ? curriculumMap.get(String(item.curriculum.id))
          : undefined;

      return {
        id: item.id,
        nama_kelas: text(item.nama_kelas),
        curriculum:
          item.curriculum?.id !== null && item.curriculum?.id !== undefined
            ? {
                id: item.curriculum.id,
                nama_kurikulum:
                  text(fullCurriculum?.nama_kurikulum) ||
                  text(item.curriculum.nama_kurikulum),
                tahun_ajaran:
                  text(fullCurriculum?.tahun_ajaran) ||
                  text(item.curriculum.tahun_ajaran),
                indikator_ids:
                  Array.isArray(fullCurriculum?.indikator_ids) &&
                  fullCurriculum.indikator_ids.length
                    ? fullCurriculum.indikator_ids
                    : Array.isArray(item.curriculum.indikator_ids)
                      ? item.curriculum.indikator_ids.filter(
                          (id): id is Id =>
                            typeof id === "number" || typeof id === "string"
                        )
                      : [],
              }
            : null,
        wali_kelas: item.wali_kelas
          ? {
              id: item.wali_kelas.id,
              nik: text(item.wali_kelas.nik),
              nama_lengkap: text(item.wali_kelas.nama_lengkap),
              jabatan: text(item.wali_kelas.jabatan),
            }
          : null,
      };
    })
    .sort((a, b) =>
      a.nama_kelas.localeCompare(b.nama_kelas, "id", {
        numeric: true,
        sensitivity: "base",
      })
    );
}

export async function fetchKegiatanStudents(params: {
  classroom_id?: Id | "all" | null;
  q?: string;
  fresh?: boolean;
} = {}): Promise<KegiatanStudent[]> {
  const allStudents = params.fresh
    ? await (async () => {
        const [period, classrooms] = await Promise.all([
          sharedCurrentAcademicPeriod(),
          sharedClassrooms(),
        ]);
        return fetchActivePeriodStudents({
          period,
          classrooms,
          requireClassroom: true,
        });
      })()
    : await sharedEligibleKegiatanStudents();
  const classroomFilter = params.classroom_id;
  const query = text(params.q).toLocaleLowerCase("id-ID");
  const students = allStudents.filter((student) => {
    if (
      classroomFilter !== undefined &&
      classroomFilter !== null &&
      classroomFilter !== "all" &&
      String(student.classroom_id) !== String(classroomFilter)
    ) {
      return false;
    }

    if (!query) return true;
    return [
      student.nama_lengkap,
      student.nisn,
      student.nik,
      student.classroom_name,
    ]
      .map((value) => text(value).toLocaleLowerCase("id-ID"))
      .some((value) => value.includes(query));
  });

  return students
    .filter((student) => student.classroom_id !== null)
    .map((student): KegiatanStudent => ({
      id: student.id,
      nama_lengkap: student.nama_lengkap,
      nomor_induk: student.nisn,
      nisn: student.nisn,
      classroom_id: student.classroom_id,
      classroom_name: student.classroom_name,
      jenis_kelamin: student.jenis_kelamin,
      foto: student.foto,
      berat_badan: student.berat_badan,
      tinggi_badan: student.tinggi_badan,
    }))
    .sort((a, b) =>
      a.nama_lengkap.localeCompare(b.nama_lengkap, "id", {
        sensitivity: "base",
        numeric: true,
      })
    );
}

function normalizeAttendanceRow(raw: unknown): AttendanceRecord & {
  id?: Id | null;
  student_name?: string;
  student_nisn?: string;
} {
  const value=obj(raw),student=obj(value.student);
  return {
    id:idOf(value.id),
    student_id:idOf(value.student_id??value.siswa_id??value.studentId??student.id)??"",
    tanggal:dateOnly(value.tanggal??value.date),
    status:attendanceStatus(value.status??value.status_kehadiran??value.attendance_status),
    keterangan:text(value.catatan??value.keterangan??value.note),
    classroom_id:idOf(value.classroom_id??value.kelas_id),
    student_name:text(value.student_nama??value.nama_siswa??student.nama_lengkap),
    student_nisn:text(value.nisn??student.nisn),
  };
}

async function fetchAttendanceRowsFresh(
  classroomId: Id,
  tanggal: string,
  signal?: AbortSignal
) {
  const rawRows = await apiGetJson<unknown>(
    queryUrl("/api/attendances", {
      classroom_id: classroomId,
      tanggal: dateOnly(tanggal),
    }),
    signal ? { signal } : undefined
  );

  return list(rawRows).map(normalizeAttendanceRow);
}

const savedAttendanceRows = (
  rows: Array<ReturnType<typeof normalizeAttendanceRow>>
) => rows.filter((row) => isAttendanceStatus(row.status));

function attendanceStatusFromRecapRow(raw: unknown): AttendanceStatus | "" {
  const value=obj(raw);
  if((Number(value.hadir)||0)>0)return "H";
  if((Number(value.sakit)||0)>0)return "S";
  if((Number(value.izin)||0)>0)return "I";
  if((Number(value.alpa)||0)>0)return "A";
  return "";
}

async function fetchAttendanceDayRecap(tanggal:string,signal?:AbortSignal){
  const day=dateOnly(tanggal);
  return cached(["kegiatan","attendance-day-recap",day],async(cacheSignal)=>{
    const activeSignal=signal??cacheSignal;
    const raw=await apiGetJson<unknown>(queryUrl("/api/attendances/recap",{dari:day,sampai:day}),activeSignal?{signal:activeSignal}:undefined);
    return list(raw).map(item=>{const value=obj(item);return{student_id:idOf(value.student_id??value.siswa_id),status:attendanceStatusFromRecapRow(value),classroom_id:idOf(value.classroom_id??value.kelas_id),classroom_name:text(value.classroom_nama??value.nama_kelas)};}).filter(item=>item.student_id!==null&&isAttendanceStatus(item.status));
  },5_000);
}

function assertAttendanceDateNotFuture(tanggal: string) {
  const value = dateOnly(tanggal);
  const today = localTodayDate();

  if (value && value > today) {
    throw new Error(
      `Presensi tanggal ${value} belum dapat diisi karena tanggal tersebut belum berlangsung.`
    );
  }
}

export async function fetchAttendanceSheet(params: {
  classroom_id: Id;
  tanggal: string;
  q?: string;
}): Promise<AttendanceSheet> {
  const tanggal = dateOnly(params.tanggal);
  await assertDateInActiveAcademicPeriod(tanggal, "Tanggal presensi");
  const dayStatus = await schoolDayStatus(tanggal);

  return cached(qk.attendance(params.classroom_id,tanggal,params.q),async(signal)=>{
    const [rows,students,dayRecap]=await Promise.all([
      fetchAttendanceRowsFresh(params.classroom_id,tanggal,signal),
      fetchKegiatanStudents({classroom_id:params.classroom_id,q:params.q}),
      dayStatus.is_holiday?Promise.resolve([]):fetchAttendanceDayRecap(tanggal,signal).catch(()=>[]),
    ]);
    const currentClassId=String(params.classroom_id);
    const studentIds=new Set(students.map(student=>String(student.id)));
    const currentMap=new Map(savedAttendanceRows(rows).filter(row=>studentIds.has(String(row.student_id))).map(row=>[String(row.student_id),row]));
    const recapMap=new Map(dayRecap.filter(item=>studentIds.has(String(item.student_id))).map(item=>[String(item.student_id),item]));
    const persistedIds=new Set([...studentIds].filter(id=>currentMap.has(id)||recapMap.has(id)));

    return{
      classroom_id:params.classroom_id,
      tanggal,
      is_holiday:dayStatus.is_holiday,
      holiday_label:dayStatus.is_holiday?dayStatus.label:"",
      holiday_description:dayStatus.is_holiday?dayStatus.description:"",
      is_saved:persistedIds.size>0,
      saved_count:persistedIds.size,
      total_students:students.length,
      items:students.map(student=>{
        const key=String(student.id);
        const current=currentMap.get(key);
        const recap=recapMap.get(key);
        const sourceClassId=current?.classroom_id??recap?.classroom_id??params.classroom_id;
        const crossClass=!current&&Boolean(recap&&String(sourceClassId)!==currentClassId);
        const sourceClassName=text(recap?.classroom_name)||student.classroom_name||
          (crossClass?"Kelas sebelumnya/lainnya":"");
        return{
          ...student,
          attendance:{
            student_id:student.id,
            tanggal,
            status:dayStatus.is_holiday?"":current?.status??recap?.status??"",
            keterangan:dayStatus.is_holiday?"":current?.keterangan??"",
            classroom_id:sourceClassId,
            classroom_name:sourceClassName,
            is_cross_class:crossClass,
            student_name:student.nama_lengkap,
            student_nisn:student.nisn,
            student_gender:student.jenis_kelamin,
          }
        };
      }),
    };
  },5_000);
}

export async function saveAttendanceBulk(payload: AttendanceBulkPayload): Promise<AttendanceSheet> {
  const tanggal = dateOnly(payload.tanggal);
  await assertEffectiveSchoolDay(tanggal, "Tanggal presensi");
  assertAttendanceDateNotFuture(tanggal);

  const [eligibleStudents, existingRows, dayRecap] = await Promise.all([
    fetchKegiatanStudents({ classroom_id: payload.classroom_id, fresh: true }),
    fetchAttendanceRowsFresh(payload.classroom_id, tanggal),
    fetchAttendanceDayRecap(tanggal).catch(() => []),
  ]);

  if (!eligibleStudents.length) throw new Error("Tidak ada siswa aktif pada kelas ini untuk periode akademik aktif.");

  const eligibleIds=new Set(eligibleStudents.map(student=>String(student.id))),lockedIds=new Set((payload.locked_student_ids||[]).map(value=>String(value)));
  const existingMap = new Map(
    savedAttendanceRows(existingRows)
      .filter((row) => eligibleIds.has(String(row.student_id)))
      .map((row) => [String(row.student_id), row])
  );
  // GET /api/attendances can occasionally return a row without the persisted
  // status while the daily recap already reflects it.  Use the recap only as
  // a completeness signal so a second/partial save does not treat previously
  // saved students as empty.  Mutations still rely on existingMap because the
  // recap does not carry the original note needed for safe update comparison.
  const recapSavedIds = new Set(
    dayRecap
      .filter((item) =>
        eligibleIds.has(String(item.student_id)) &&
        isAttendanceStatus(item.status) &&
        (item.classroom_id === null ||
          item.classroom_id === undefined ||
          String(item.classroom_id) === String(payload.classroom_id))
      )
      .map((item) => String(item.student_id))
  );
  const payloadByStudent = new Map<string, AttendanceBulkPayload["items"][number]>();

  payload.items.forEach((item) => {
    const key = String(item.student_id);
    if (!payloadByStudent.has(key)) payloadByStudent.set(key, item);
  });

  const invalidIds = [...payloadByStudent.keys()].filter((studentId) => !eligibleIds.has(studentId));
  if (invalidIds.length) throw new Error("Daftar siswa sudah berubah. Muat ulang data sebelum menyimpan presensi.");

  const missingStudents=eligibleStudents.filter(student=>{const key=String(student.id);if(existingMap.has(key)||recapSavedIds.has(key)||lockedIds.has(key))return false;return !isAttendanceStatus(payloadByStudent.get(key)?.status);});

  if (missingStudents.length) {
    throw new Error(`Lengkapi presensi seluruh siswa sebelum menyimpan. Masih ada ${missingStudents.length} siswa yang belum diisi.`);
  }

  if (payload.allow_update !== true) {
    const changedSaved = eligibleStudents.filter((student) => {
      const key = String(student.id);
      const existing = existingMap.get(key);
      const item = payloadByStudent.get(key);
      if (!existing || !item) return false;
      return attendanceStatus(existing.status) !== attendanceStatus(item.status) || text(existing.keterangan) !== text(item.keterangan);
    });
    if (changedSaved.length) {
      const names = changedSaved.slice(0, 5).map((student) => student.nama_lengkap).join(", ");
      throw new Error(`Presensi ${names} sudah tersimpan. Klik Edit Presensi terlebih dahulu untuk mengubah data yang sudah ada.`);
    }
  }

  const normalizedItems = eligibleStudents.flatMap((student) => {
    const key = String(student.id);
    const item = payloadByStudent.get(key);
    if (!item || !isAttendanceStatus(item.status)) return [];
    if(lockedIds.has(key))return [];
    const existing = existingMap.get(key);
    if (existing) {
      if (payload.allow_update !== true) return [];
      if (attendanceStatus(existing.status) === attendanceStatus(item.status) && text(existing.keterangan) === text(item.keterangan)) return [];
    }
    return [{ student_id: Number(student.id), status: item.status, catatan: text(item.keterangan) }];
  });

  const classroomId = Number(payload.classroom_id);
  if (!Number.isInteger(classroomId) || classroomId <= 0) throw new Error("ID kelas tidak valid. Muat ulang halaman lalu coba kembali.");
  if (normalizedItems.some((item) => !Number.isInteger(item.student_id) || item.student_id <= 0)) throw new Error("Terdapat ID siswa yang tidak valid. Muat ulang data siswa lalu coba kembali.");

  if (normalizedItems.length) {
    const requestBody = { classroom_id: classroomId, tanggal, items: normalizedItems };
    try {
      await apiRequestJson<unknown>("/api/attendances/bulk", { method: "PUT", jsonBody: requestBody });
    } catch (error) {
      const status = Number((error as { status?: unknown })?.status ?? 0) || 0;
      if (status !== 500) throw error;
      const currentRows = await fetchAttendanceRowsFresh(payload.classroom_id, tanggal).catch(() => []);
      const currentMap = new Map<string, ReturnType<typeof normalizeAttendanceRow>>(
        currentRows.map((row) => [String(row.student_id), row] as const)
      );
      const failedIds = normalizedItems
        .filter((item) => {
          const current = currentMap.get(String(item.student_id));
          return attendanceStatus(current?.status) !== attendanceStatus(item.status) || text(current?.keterangan) !== text(item.catatan);
        })
        .map((item) => String(item.student_id));
      if (failedIds.length) {
        const failedSet = new Set(failedIds);
        const names = eligibleStudents.filter((student) => failedSet.has(String(student.id))).slice(0, 5).map((student) => student.nama_lengkap);
        const suffix = failedIds.length > 5 ? ` dan ${failedIds.length - 5} siswa lainnya` : "";
        const action = payload.allow_update === true ? "memperbarui" : "menyimpan";
        const state = payload.allow_update === true ? "Belum berubah" : "Belum tersimpan";
        throw new Error(`Backend gagal ${action} presensi (HTTP 500). ${state}: ${names.join(", ")}${suffix}.`);
      }
    }
  }

  await Promise.all([
    invalidate(["kegiatan", "attendance"]),
    invalidate(["kegiatan", "attendance-day-recap"]),
    invalidate(["kegiatan", "attendance-recap"]),
    invalidate(["kegiatan", "report"]),
    invalidate(["kegiatan", "reports"]),
  ]);

  return fetchAttendanceSheet({ classroom_id: payload.classroom_id, tanggal });
}


export async function fetchStudentAttendanceHistory(params: {
  student_id: Id;
  dari: string;
  sampai: string;
  expected_total?: number;
  candidate_dates?: string[];
  preferred_classroom_id?: Id | null;
}): Promise<AttendanceRecapHistory[]> {
  const dari=dateOnly(params.dari),sampai=dateOnly(params.sampai);
  await assertRangeInActiveAcademicPeriod(dari,sampai,"Rentang riwayat presensi");
  const [classrooms,calendar]=await Promise.all([fetchKegiatanClassrooms(),sharedSchoolCalendar()]);
  const preferred=text(params.preferred_classroom_id);
  const orderedClassrooms=[...classrooms].sort((left,right)=>{
    if(preferred&&String(left.id)===preferred)return -1;
    if(preferred&&String(right.id)===preferred)return 1;
    return text(left.nama_kelas).localeCompare(text(right.nama_kelas),"id",{sensitivity:"base",numeric:true});
  });
  const today=localTodayDate(),end=sampai>today?today:sampai,allDates:string[]=[];
  for(let value=dari,count=0;value&&value<=end&&count<370;value=addDays(value,1),count+=1)if(!resolveSchoolDayStatus(value,calendar).is_holiday)allDates.push(value);
  const candidates=(params.candidate_dates||[]).map(dateOnly).filter(value=>value>=dari&&value<=end),priority=[...new Set([...candidates.slice().reverse(),...allDates.slice().reverse()])];
  const expected=Math.max(0,Number(params.expected_total||0)||0),found=new Map<string,AttendanceRecapHistory>();
  const statusFromStats=(stats:AttendanceRecapItem["stats"]):AttendanceStatus|""=>stats.h>0?"H":stats.s>0?"S":stats.i>0?"I":stats.a>0?"A":"";
  let cursor=0;
  const workers=Array.from({length:Math.min(4,priority.length)},async()=>{
    while(cursor<priority.length){
      if(expected&&found.size>=expected)return;
      const tanggal=priority[cursor++];
      for(const classroom of orderedClassrooms){
        if(expected&&found.size>=expected)return;
        const rows=await fetchAttendanceRowsFresh(classroom.id,tanggal).catch(()=>[]),row=rows.find(item=>String(item.student_id)===String(params.student_id)&&isAttendanceStatus(item.status));
        if(row){found.set(tanggal,{tanggal,status:attendanceStatus(row.status) as AttendanceStatus,keterangan:text(row.keterangan),classroom_id:classroom.id,classroom_name:text(classroom.nama_kelas)});break;}
        const recap=await fetchAttendanceRecap({classroom_id:classroom.id,student_id:params.student_id,dari:tanggal,sampai:tanggal}).catch(()=>[]),status=recap[0]?statusFromStats(recap[0].stats):"";
        if(status){found.set(tanggal,{tanggal,status,keterangan:"",classroom_id:classroom.id,classroom_name:text(classroom.nama_kelas)});break;}
      }
    }
  });
  await Promise.all(workers);
  return [...found.values()].sort((left,right)=>right.tanggal.localeCompare(left.tanggal));
}

export async function updateStudentAttendanceHistory(payload:{classroom_id:Id;student_id:Id;tanggal:string;status:AttendanceStatus;keterangan?:string}):Promise<void>{
  const classroomId=Number(payload.classroom_id),studentId=Number(payload.student_id),tanggal=dateOnly(payload.tanggal),status=attendanceStatus(payload.status);
  if(!Number.isInteger(classroomId)||classroomId<=0)throw new Error("ID kelas presensi tidak valid.");
  if(!Number.isInteger(studentId)||studentId<=0)throw new Error("ID siswa tidak valid.");
  if(!isAttendanceStatus(status))throw new Error("Status presensi tidak valid.");
  await apiRequestJson<unknown>("/api/attendances/bulk",{method:"PUT",jsonBody:{classroom_id:classroomId,tanggal,items:[{student_id:studentId,status,catatan:text(payload.keterangan)}]}});
  await Promise.all([invalidate(["kegiatan","attendance"]),invalidate(["kegiatan","attendance-day-recap"]),invalidate(["kegiatan","attendance-recap"]),invalidate(["kegiatan","report"]),invalidate(["kegiatan","reports"])]);
}

export async function fetchAttendanceFillDates(params: {
  classroom_id: Id;
  dari: string;
  sampai: string;
}): Promise<AttendanceFillDate[]> {
  const dari = dateOnly(params.dari);
  const sampai = dateOnly(params.sampai);
  await assertRangeInActiveAcademicPeriod(dari, sampai, "Rentang status pengisian presensi");

  return cached(qk.attendanceFill(params.classroom_id, dari, sampai), async (signal) => {
    const [students, calendar] = await Promise.all([
      fetchKegiatanStudents({ classroom_id: params.classroom_id }),
      sharedSchoolCalendar(),
    ]);
    const eligibleIds = new Set(students.map((student) => String(student.id)));
    const today = localTodayDate();
    const dates: string[] = [];

    for (let value = dari, count = 0; value && value <= sampai && value <= today && count < 370; value = addDays(value, 1), count += 1) {
      const status = resolveSchoolDayStatus(value, calendar);
      if (!status.is_holiday) dates.push(value);
    }

    const output = new Array<AttendanceFillDate>(dates.length);
    let cursor = 0;
    const workers = Array.from({ length: Math.min(6, dates.length) }, async () => {
      while (cursor < dates.length) {
        const index = cursor++;
        const tanggal = dates[index];
        const rows = await fetchAttendanceDayRecap(tanggal, signal);
        const saved = new Set(rows.filter((row) => eligibleIds.has(String(row.student_id))).map((row) => String(row.student_id))).size;
        const total = students.length;
        output[index] = {
          tanggal,
          saved_count: saved,
          total_students: total,
          is_complete: total > 0 && saved >= total,
          is_partial: saved > 0 && saved < total,
        };
      }
    });

    await Promise.all(workers);
    return output;
  }, 5_000);
}

function recapStudentFromRaw(raw: unknown, detail?: KegiatanStudent): AttendanceRecapItem {
  const value = obj(raw);
  const id = idOf(value.student_id) ?? detail?.id ?? "";
  const h = Number(value.hadir ?? 0) || 0;
  const s = Number(value.sakit ?? 0) || 0;
  const i = Number(value.izin ?? 0) || 0;
  const a = Number(value.alpa ?? 0) || 0;
  const total = Number(value.total ?? h + s + i + a) || h + s + i + a;
  const percentage = Number(value.persentase_kehadiran ?? (total ? (h / total) * 100 : 0)) || 0;
  return {
    id,
    nama_lengkap: text(value.student_nama) || detail?.nama_lengkap || `Siswa ${id}`,
    nomor_induk: text(value.nisn) || detail?.nomor_induk || "",
    nisn: text(value.nisn) || detail?.nisn || "",
    classroom_id: idOf(value.classroom_id) ?? detail?.classroom_id ?? null,
    classroom_name: text(value.classroom_nama) || detail?.classroom_name || "",
    jenis_kelamin: detail?.jenis_kelamin || "",
    foto: detail?.foto || "",
    berat_badan: detail?.berat_badan ?? null,
    tinggi_badan: detail?.tinggi_badan ?? null,
    history: [],
    stats: {
      h,
      s,
      i,
      a,
      total,
      percentage: Math.round(percentage),
    },
  };
}

export async function fetchAttendanceRecap(params: {
  classroom_id?: Id | "all" | null;
  student_id?: Id | null;
  dari: string;
  sampai: string;
  q?: string;
}): Promise<AttendanceRecapItem[]> {
  const dari=dateOnly(params.dari),sampai=dateOnly(params.sampai);
  await assertRangeInActiveAcademicPeriod(dari,sampai,"Rentang Rekap Presensi");
  return cached(qk.recap(params.classroom_id,params.student_id,dari,sampai,params.q),async(signal)=>{
    const path=queryUrl("/api/attendances/recap",{classroom_id:params.classroom_id==="all"?undefined:params.classroom_id as Id|null|undefined,student_id:params.student_id??undefined,dari,sampai,q:text(params.q)});
    const [raw,students]=await Promise.all([apiGetJson<unknown>(path,{signal}),fetchKegiatanStudents({classroom_id:params.classroom_id,q:params.q})]);
    const rawRows=list(raw);
    const studentMap=new Map(students.map(student=>[String(student.id),student]));
    if(params.student_id!==undefined&&params.student_id!==null){
      const targetId=String(params.student_id);
      const row=rawRows.find(item=>String(idOf(obj(item).student_id)??"")===targetId);
      const detail=studentMap.get(targetId);
      if(row)return [recapStudentFromRaw(row,detail)];
      if(detail)return [recapStudentFromRaw({student_id:detail.id,student_nama:detail.nama_lengkap,nisn:detail.nisn,classroom_id:detail.classroom_id,classroom_nama:detail.classroom_name,hadir:0,sakit:0,izin:0,alpa:0,total:0},detail)];
      return [];
    }
    const rawMap=new Map(rawRows.map(row=>{const value=obj(row),id=idOf(value.student_id);return id===null?null:[String(id),row] as const;}).filter((item):item is readonly[string,unknown]=>item!==null));
    return students.map(student=>recapStudentFromRaw(rawMap.get(String(student.id))??{student_id:student.id,student_nama:student.nama_lengkap,nisn:student.nisn,classroom_id:student.classroom_id,classroom_nama:student.classroom_name,hadir:0,sakit:0,izin:0,alpa:0,total:0},student)).sort((a,b)=>a.nama_lengkap.localeCompare(b.nama_lengkap,"id",{sensitivity:"base"}));
  });
}


export async function fetchAttendanceReportPeriods(): Promise<AttendanceReportPeriodSummary[]> {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);
  const rows = await fetchAttendanceRecap({
    dari: bounds.start,
    sampai: bounds.end,
  });

  return [
    {
      tahun_ajaran: text(period.tahun_ajaran),
      total_records: rows.reduce((sum, item) => sum + item.stats.total, 0),
      dari: bounds.start,
      sampai: bounds.end,
    },
  ];
}

export async function fetchAttendanceReport(params: {
  dari: string;
  sampai: string;
  classroom_id?: Id | "all" | null;
  q?: string;
}): Promise<AttendanceReportResult> {
  const items = await fetchAttendanceRecap(params);
  return {
    dari: dateOnly(params.dari),
    sampai: dateOnly(params.sampai),
    items,
    total_records: items.reduce((sum, item) => sum + item.stats.total, 0),
  };
}

function normalizePlan(root: Record<string, unknown>, weekStart: string): DailyActivityPlan {
  const raw = obj(root.rencana_mingguan ?? root.plan);
  return {
    schedule_id: idOf(root.schedule_id ?? raw.schedule_id),
    journal_id: idOf(raw.id ?? raw.journal_id),
    week_start: weekStart,
    tema: text(raw.tema),
    pilar_karakter: text(raw.pilar_karakter),
    nilai_karakter: text(raw.nilai_karakter),
    jurnal: text(raw.isi_jurnal ?? raw.jurnal),
    aktivitas: text(raw.aktivitas),
    pembiasaan: text(raw.pembiasaan),
    has_schedule: idOf(root.schedule_id ?? raw.schedule_id) !== null || idOf(raw.id ?? raw.journal_id) !== null,
  };
}


const dailyActivityCompletionStatus = (value: unknown): DailyActivityCompletionStatus => {
  const normalized = text(value).toLowerCase();
  if (normalized === "dilakukan") return "Dilakukan";
  if (normalized === "tidak dilakukan" || normalized === "tidak_dilakukan") {
    return "Tidak Dilakukan";
  }
  return "";
};

const DAILY_ACTIVITY_META_PREFIX_V4 = "__SS_DAILY_V4__:";
const DAILY_ACTIVITY_META_PREFIX_V3 = "__SS_DAILY_V3__:";
const DAILY_ACTIVITY_META_PREFIX_V2 = "__SS_DAILY_V2__:";

type DailyActivityStoredMeta = {
  version: 4;
  partisipasi: {
    jurnal: DailyActivityCompletionStatus;
    pilar_karakter: DailyActivityCompletionStatus;
    aktivitas: DailyActivityCompletionStatus;
    pembiasaan: DailyActivityCompletionStatus;
  };
  catatan_guru: string;
  daily_plan?: DailyActivityPlan;
};

function decodeDailyActivityMeta(value: unknown): DailyActivityStoredMeta | null {
  const raw = String(value ?? "");
  const prefix = raw.startsWith(DAILY_ACTIVITY_META_PREFIX_V4)
    ? DAILY_ACTIVITY_META_PREFIX_V4
    : raw.startsWith(DAILY_ACTIVITY_META_PREFIX_V3)
      ? DAILY_ACTIVITY_META_PREFIX_V3
      : raw.startsWith(DAILY_ACTIVITY_META_PREFIX_V2)
        ? DAILY_ACTIVITY_META_PREFIX_V2
        : "";

  if (!prefix) return null;

  try {
    const parsed = JSON.parse(raw.slice(prefix.length));
    if (!parsed || typeof parsed !== "object") return null;
    const parsedRecord = parsed as Record<string, unknown>;
    const partisipasi = obj(parsedRecord.partisipasi);
    const rawDailyPlan = obj(parsedRecord.daily_plan);
    const hasDailyPlan = Object.keys(rawDailyPlan).length > 0 || parsedRecord.daily_plan !== undefined;
    const dailyPlan = hasDailyPlan
      ? {
          schedule_id: idOf(rawDailyPlan.schedule_id),
          journal_id: idOf(rawDailyPlan.journal_id),
          week_start: dateOnly(rawDailyPlan.week_start),
          tema: text(rawDailyPlan.tema),
          pilar_karakter: text(rawDailyPlan.pilar_karakter),
          nilai_karakter: text(rawDailyPlan.nilai_karakter),
          jurnal: text(rawDailyPlan.jurnal ?? rawDailyPlan.isi_jurnal),
          aktivitas: text(rawDailyPlan.aktivitas),
          pembiasaan: text(rawDailyPlan.pembiasaan),
          has_schedule: Boolean(rawDailyPlan.has_schedule ?? rawDailyPlan.schedule_id ?? rawDailyPlan.journal_id),
        }
      : undefined;
    return {
      version: 4,
      partisipasi: {
        jurnal: dailyActivityCompletionStatus(partisipasi.jurnal),
        pilar_karakter: dailyActivityCompletionStatus(partisipasi.pilar_karakter),
        aktivitas: dailyActivityCompletionStatus(partisipasi.aktivitas),
        pembiasaan: dailyActivityCompletionStatus(partisipasi.pembiasaan),
      },
      catatan_guru: text(parsedRecord.catatan_guru),
      daily_plan: dailyPlan,
    };
  } catch {
    return null;
  }
}

function encodeDailyActivityMeta(item: DailyActivityStudentLog): string {
  const pilarStatus = dailyActivityCompletionStatus(
    item.pilar_karakter_status ?? item.nilai_karakter_status
  );
  const rawDailyPlan = item.daily_plan;
  const dailyPlan = rawDailyPlan
    ? {
        schedule_id: rawDailyPlan.schedule_id ?? null,
        journal_id: rawDailyPlan.journal_id ?? null,
        week_start: dateOnly(rawDailyPlan.week_start),
        tema: text(rawDailyPlan.tema),
        pilar_karakter: text(rawDailyPlan.pilar_karakter),
        nilai_karakter: text(rawDailyPlan.nilai_karakter),
        jurnal: text(rawDailyPlan.jurnal),
        aktivitas: text(rawDailyPlan.aktivitas),
        pembiasaan: text(rawDailyPlan.pembiasaan),
        has_schedule: Boolean(rawDailyPlan.has_schedule),
      }
    : undefined;
  const meta: DailyActivityStoredMeta = {
    version: 4,
    partisipasi: {
      jurnal: dailyActivityCompletionStatus(item.jurnal_status),
      pilar_karakter: pilarStatus,
      aktivitas: dailyActivityCompletionStatus(item.aktivitas_status),
      pembiasaan: dailyActivityCompletionStatus(item.pembiasaan_status),
    },
    catatan_guru: text(item.catatan_guru),
    daily_plan: dailyPlan,
  };
  return `${DAILY_ACTIVITY_META_PREFIX_V4}${JSON.stringify(meta)}`;
}

const DAILY_ACTIVITY_CLIENT_META_KEY = "ssphere:daily-activity-client-meta:v1";

type DailyActivityClientMeta = {
  classroom_id: Id;
  student_id: Id;
  tanggal: string;
  jurnal_status: DailyActivityCompletionStatus;
  pilar_karakter_status: DailyActivityCompletionStatus;
  aktivitas_status: DailyActivityCompletionStatus;
  pembiasaan_status: DailyActivityCompletionStatus;
  daily_plan?: DailyActivityPlan;
};

function dailyActivityClientMetaKey(classroomId: Id, studentId: Id, tanggal: string) {
  return `${String(classroomId)}|${String(studentId)}|${dateOnly(tanggal)}`;
}

function readDailyActivityClientMeta(): DailyActivityClientMeta[] {
  if (typeof window === "undefined" || !window.localStorage) return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DAILY_ACTIVITY_CLIENT_META_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed.map((value): DailyActivityClientMeta | null => {
      const classroomId = idOf(value?.classroom_id);
      const studentId = idOf(value?.student_id);
      const tanggal = dateOnly(value?.tanggal);
      if (classroomId === null || studentId === null || !tanggal) return null;
      const rawPlan = obj(value?.daily_plan);
      const dailyPlan = value?.daily_plan !== undefined
        ? {
            schedule_id: idOf(rawPlan.schedule_id),
            journal_id: idOf(rawPlan.journal_id),
            week_start: dateOnly(rawPlan.week_start),
            tema: text(rawPlan.tema),
            pilar_karakter: text(rawPlan.pilar_karakter),
            nilai_karakter: text(rawPlan.nilai_karakter),
            jurnal: text(rawPlan.jurnal ?? rawPlan.isi_jurnal),
            aktivitas: text(rawPlan.aktivitas),
            pembiasaan: text(rawPlan.pembiasaan),
            has_schedule: Boolean(rawPlan.has_schedule ?? rawPlan.schedule_id ?? rawPlan.journal_id),
          }
        : undefined;
      return {
        classroom_id: classroomId,
        student_id: studentId,
        tanggal,
        jurnal_status: dailyActivityCompletionStatus(value?.jurnal_status),
        pilar_karakter_status: dailyActivityCompletionStatus(value?.pilar_karakter_status ?? value?.nilai_karakter_status),
        aktivitas_status: dailyActivityCompletionStatus(value?.aktivitas_status),
        pembiasaan_status: dailyActivityCompletionStatus(value?.pembiasaan_status),
        daily_plan: dailyPlan,
      };
    }).filter((value): value is DailyActivityClientMeta => value !== null);
  } catch {
    return [];
  }
}

function writeDailyActivityClientMeta(rows: DailyActivityClientMeta[]): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const map = new Map(
      readDailyActivityClientMeta().map((row) => [
        dailyActivityClientMetaKey(row.classroom_id, row.student_id, row.tanggal),
        row,
      ])
    );
    // Satu rencana harian cukup disimpan sekali per kelas/tanggal agar cache
    // tidak membengkak karena rencana yang sama diduplikasi untuk semua siswa.
    const planDates = new Set(
      rows
        .filter((row) => row.daily_plan !== undefined)
        .map((row) => `${String(row.classroom_id)}|${row.tanggal}`)
    );
    if (planDates.size) {
      map.forEach((row, key) => {
        if (planDates.has(`${String(row.classroom_id)}|${row.tanggal}`) && row.daily_plan !== undefined) {
          map.set(key, { ...row, daily_plan: undefined });
        }
      });
    }
    rows.forEach((row) => {
      map.set(dailyActivityClientMetaKey(row.classroom_id, row.student_id, row.tanggal), row);
    });
    const values = [...map.values()]
      .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
      .slice(0, 10000);
    window.localStorage.setItem(DAILY_ACTIVITY_CLIENT_META_KEY, JSON.stringify(values));
  } catch {}
}

function decodedDailyActivityLog(row?: NormalizedDailyActivityRow | null) {
  const meta = decodeDailyActivityMeta(row?.catatan_guru);
  if (meta) {
    return {
      jurnal_status: meta.partisipasi.jurnal,
      pilar_karakter_status: meta.partisipasi.pilar_karakter,
      nilai_karakter_status: meta.partisipasi.pilar_karakter,
      aktivitas_status: meta.partisipasi.aktivitas,
      pembiasaan_status: meta.partisipasi.pembiasaan,
      makanan: row?.makanan ?? "",
      perasaan: row?.perasaan ?? "",
      barang_bawaan: row?.barang_bawaan ?? "",
      catatan_guru: meta.catatan_guru,
      daily_plan: meta.daily_plan,
    };
  }

  // Migrasi data dari versi sementara yang menyimpan empat status langsung
  // ke empat field legacy. Nilai yang bukan status tetap diperlakukan sebagai
  // data lama makanan/perasaan/barang/catatan.
  const pilarStatus = dailyActivityCompletionStatus(row?.makanan);
  const jurnalStatus = dailyActivityCompletionStatus(row?.perasaan);
  const aktivitasStatus = dailyActivityCompletionStatus(row?.barang_bawaan);
  const pembiasaanStatus = dailyActivityCompletionStatus(row?.catatan_guru);

  return {
    jurnal_status: jurnalStatus,
    pilar_karakter_status: pilarStatus,
    nilai_karakter_status: pilarStatus,
    aktivitas_status: aktivitasStatus,
    pembiasaan_status: pembiasaanStatus,
    makanan: pilarStatus ? "" : row?.makanan ?? "",
    perasaan: jurnalStatus ? "" : row?.perasaan ?? "",
    barang_bawaan: aktivitasStatus ? "" : row?.barang_bawaan ?? "",
    catatan_guru: pembiasaanStatus ? "" : row?.catatan_guru ?? "",
    daily_plan: undefined,
  };
}

interface NormalizedDailyActivityRow {
  student_id: Id | null;
  tanggal: string;
  makanan: string;
  perasaan: string;
  barang_bawaan: string;
  catatan_guru: string;
  classroom_id: Id | null;
  classroom_name: string;
  student_name: string;
  student_nisn: string;
  student_gender: string;
}

function normalizedDailyActivityRows(raw: unknown, fallbackClassroomId?: Id | null, fallbackClassroomName = ""): NormalizedDailyActivityRow[] {
  const root = obj(raw);
  const rootClassroomId = idOf(root.classroom_id ?? root.kelas_id ?? fallbackClassroomId);
  const rootClassroomName = text(root.classroom_nama ?? root.nama_kelas ?? fallbackClassroomName);
  const rows = [...list(root.students_activities), ...list(root.items), ...list(root.activities)];
  const mapped = rows.map((row): NormalizedDailyActivityRow => {
    const value = obj(row), student = obj(value.student);
    return {
      student_id: idOf(value.student_id ?? value.siswa_id ?? student.id),
      tanggal: dateOnly(value.tanggal ?? value.date),
      makanan: text(value.makanan),
      perasaan: text(value.perasaan),
      barang_bawaan: text(value.barang_bawaan),
      catatan_guru: text(value.catatan_guru),
      classroom_id: idOf(value.classroom_id ?? value.kelas_id ?? rootClassroomId),
      classroom_name: text(value.classroom_nama ?? value.nama_kelas ?? rootClassroomName),
      student_name: text(value.student_nama ?? value.nama_siswa ?? student.nama_lengkap),
      student_nisn: text(value.nisn ?? student.nisn),
      student_gender: text(value.jenis_kelamin ?? student.jenis_kelamin),
    };
  }).filter((row) => row.student_id !== null && Boolean(row.tanggal));
  const unique = new Map<string, NormalizedDailyActivityRow>();
  mapped.forEach((row) => unique.set(`${String(row.student_id)}|${row.tanggal}`, row));
  return [...unique.values()];
}

const hasDailyActivityValue = (row?: Pick<NormalizedDailyActivityRow, "makanan" | "perasaan" | "barang_bawaan" | "catatan_guru"> | null) =>
  Boolean(row && [row.makanan, row.perasaan, row.barang_bawaan, row.catatan_guru].some((value) => text(value)));

const DAILY_ACTIVITY_ARCHIVE_KEY="ssphere:daily-activity-history:v2";

function readDailyActivityArchive():NormalizedDailyActivityRow[]{
  if(typeof window==="undefined"||!window.localStorage)return[];
  try{
    const parsed=JSON.parse(window.localStorage.getItem(DAILY_ACTIVITY_ARCHIVE_KEY)||"[]");
    if(!Array.isArray(parsed))return[];
    return parsed.map((value):NormalizedDailyActivityRow=>({
      student_id:idOf(value?.student_id),tanggal:dateOnly(value?.tanggal),makanan:text(value?.makanan),perasaan:text(value?.perasaan),barang_bawaan:text(value?.barang_bawaan),catatan_guru:text(value?.catatan_guru),classroom_id:idOf(value?.classroom_id),classroom_name:text(value?.classroom_name),student_name:text(value?.student_name),student_nisn:text(value?.student_nisn),student_gender:text(value?.student_gender),
    })).filter((row)=>row.student_id!==null&&Boolean(row.tanggal)&&hasDailyActivityValue(row));
  }catch{return[];}
}

function archiveDailyActivityRows(rows:NormalizedDailyActivityRow[]):void{
  if(typeof window==="undefined"||!window.localStorage)return;
  try{
    const map=new Map(readDailyActivityArchive().map((row)=>[`${String(row.student_id)}|${row.tanggal}`,row]));
    rows.filter((row)=>row.student_id!==null&&Boolean(row.tanggal)&&hasDailyActivityValue(row)).forEach((row)=>map.set(`${String(row.student_id)}|${row.tanggal}`,row));
    const values=[...map.values()].sort((a,b)=>b.tanggal.localeCompare(a.tanggal)).slice(0,10000);
    window.localStorage.setItem(DAILY_ACTIVITY_ARCHIVE_KEY,JSON.stringify(values));
  }catch{}
}

function archivedDailyActivityRows(studentIds:Set<string>,weekStart:string):NormalizedDailyActivityRow[]{
  const start=dateOnly(weekStart),end=addDays(start,4);
  return readDailyActivityArchive().filter((row)=>row.student_id!==null&&studentIds.has(String(row.student_id))&&row.tanggal>=start&&row.tanggal<=end&&hasDailyActivityValue(row));
}

function normalizeDailyActivityRaw(raw: unknown, students: KegiatanStudent[], weekStart: string, options: {
  classroom_id?: Id | null;
  classroom_name?: string;
  current_student_ids?: Set<string>;
  fallback_rows?: NormalizedDailyActivityRow[];
} = {}): DailyActivitySheet[] {
  const root = obj(raw);
  const plan = normalizePlan(root, weekStart);
  const days = [...list(root.days)];
  const selectedClassroomId = idOf(root.classroom_id ?? root.kelas_id ?? options.classroom_id) ?? "";
  const selectedClassroomName = text(root.classroom_nama ?? root.nama_kelas ?? options.classroom_name);
  const clientMetaMap = new Map(
    readDailyActivityClientMeta()
      .filter((row) => String(row.classroom_id) === String(selectedClassroomId))
      .map((row) => [dailyActivityClientMetaKey(row.classroom_id, row.student_id, row.tanggal), row])
  );
  const activityRows = normalizedDailyActivityRows(raw, selectedClassroomId, selectedClassroomName);
  const fallbackRows = options.fallback_rows ?? [];
  const currentStudentIds = options.current_student_ids ?? new Set(students.map((student) => String(student.id)));
  const holidayMap = new Map(days.map((row) => {
    const value = obj(row);
    return [dateOnly(value.tanggal), Boolean(value.is_holiday)] as const;
  }));
  const dates = dayNames.map((_, index) => addDays(weekStart, index));
  return dates.map((tanggal) => {
    const rowsForDate = activityRows.filter((row) => row.tanggal === tanggal && row.student_id !== null);
    const fallbackRowsForDate = fallbackRows.filter((row) => row.tanggal === tanggal && row.student_id !== null && hasDailyActivityValue(row));
    const logMap = new Map(rowsForDate.map((row) => [String(row.student_id), row]));
    const fallbackMap = new Map(fallbackRowsForDate.map((row) => [String(row.student_id), row]));
    const clientDailyPlan = students
      .map((student) => clientMetaMap.get(
        dailyActivityClientMetaKey(selectedClassroomId, student.id, tanggal)
      )?.daily_plan)
      .find((value) => value !== undefined);
    const storedDailyPlan = clientDailyPlan ?? [...rowsForDate, ...fallbackRowsForDate]
      .map((row) => decodedDailyActivityLog(row).daily_plan)
      .find((value) => value !== undefined);
    const dayPlan = storedDailyPlan !== undefined
      ? { ...plan, ...storedDailyPlan, week_start: weekStart }
      : plan;
    return {
      classroom_id: selectedClassroomId,
      tanggal,
      plan: dayPlan,
      is_holiday: Boolean(holidayMap.get(tanggal)),
      holiday_label: "",
      holiday_description: "",
      items: students.map((student) => {
        const studentKey = String(student.id), currentRow = logMap.get(studentKey), fallbackRow = fallbackMap.get(studentKey);
        const row = currentRow && hasDailyActivityValue(currentRow) ? currentRow : fallbackRow ?? currentRow;
        const sourceClassroomId = row?.classroom_id ?? selectedClassroomId;
        const sourceClassroomName = text(row?.classroom_name) || (String(sourceClassroomId) === String(selectedClassroomId) ? selectedClassroomName : "");
        const readonly = Boolean(row && (String(sourceClassroomId) !== String(selectedClassroomId) || !currentStudentIds.has(studentKey)));
        const decoded = decodedDailyActivityLog(row);
        const clientMeta = clientMetaMap.get(
          dailyActivityClientMetaKey(selectedClassroomId, student.id, tanggal)
        );
        const mergedDecoded = clientMeta
          ? {
              ...decoded,
              jurnal_status: clientMeta.jurnal_status,
              pilar_karakter_status: clientMeta.pilar_karakter_status,
              nilai_karakter_status: clientMeta.pilar_karakter_status,
              aktivitas_status: clientMeta.aktivitas_status,
              pembiasaan_status: clientMeta.pembiasaan_status,
              daily_plan: clientMeta.daily_plan ?? decoded.daily_plan,
            }
          : decoded;
        return {
          ...student,
          log: {
            student_id: student.id,
            ...mergedDecoded,
            student_name: student.nama_lengkap,
            student_nisn: student.nisn,
            student_gender: student.jenis_kelamin,
            classroom_id: student.classroom_id,
            classroom_name: student.classroom_name,
            activity_source_classroom_id: sourceClassroomId,
            activity_source_classroom_name: sourceClassroomName,
            activity_readonly: readonly,
          },
        };
      }),
    };
  });
}

async function fetchDailyActivityRawWeek(classroomId: Id, weekStart: string, signal?: AbortSignal) {
  return apiGetJson<unknown>(queryUrl("/api/daily-activities/week", {
    classroom_id: classroomId,
    week_start_date: weekStart,
  }), signal ? { signal } : undefined);
}

async function fetchDailyWeekInternal(classroomId: Id, weekStart: string, signal?: AbortSignal) {
  const [raw, currentStudents, calendar] = await Promise.all([
    fetchDailyActivityRawWeek(classroomId, weekStart, signal),
    fetchKegiatanStudents({ classroom_id: classroomId }),
    sharedSchoolCalendar(),
  ]);

  const selectedClassroomName =
    currentStudents[0]?.classroom_name ||
    text(obj(raw).classroom_nama ?? obj(raw).nama_kelas);
  const currentStudentIds = new Set(currentStudents.map((student) => String(student.id)));
  const selectedRows = normalizedDailyActivityRows(raw, classroomId, selectedClassroomName);
  archiveDailyActivityRows(selectedRows);

  // Kegiatan hanya menampilkan siswa yang masih di lembaga. Riwayat silang kelas
  // tidak lagi diambil dari seluruh kelas saat initial load; bila ada data lama untuk
  // siswa aktif yang pindah kelas, cache lokal tetap dapat menjadi fallback.
  const fallbackRows = archivedDailyActivityRows(currentStudentIds, weekStart);
  const students = [...currentStudents].sort((a, b) =>
    a.nama_lengkap.localeCompare(b.nama_lengkap, "id", {
      sensitivity: "base",
      numeric: true,
    })
  );

  return normalizeDailyActivityRaw(raw, students, weekStart, {
    classroom_id: classroomId,
    classroom_name: selectedClassroomName,
    current_student_ids: currentStudentIds,
    fallback_rows: fallbackRows,
  }).map((sheet) => {
    const dayStatus = resolveSchoolDayStatus(sheet.tanggal, calendar);
    return {
      ...sheet,
      is_holiday: dayStatus.is_holiday,
      holiday_label: dayStatus.is_holiday ? dayStatus.label : "",
      holiday_description: dayStatus.is_holiday ? dayStatus.description : "",
    };
  });
}

export async function fetchDailyActivityPlan(tanggalInput: string): Promise<DailyActivityPlan> {
  const weekStart = mondayOf(tanggalInput);
  if (!weekStart) {
    return {
      schedule_id: null, journal_id: null, week_start: "", tema: "", pilar_karakter: "",
      nilai_karakter: "", jurnal: "", aktivitas: "", pembiasaan: "", has_schedule: false,
    };
  }
  const classrooms = await fetchKegiatanClassrooms();
  if (!classrooms.length) {
    return {
      schedule_id: null, journal_id: null, week_start: weekStart, tema: "", pilar_karakter: "",
      nilai_karakter: "", jurnal: "", aktivitas: "", pembiasaan: "", has_schedule: false,
    };
  }
  const sheets = await fetchDailyActivityWeek({ classroom_id: classrooms[0].id, tanggal_list: [weekStart] });
  return sheets[0]?.plan ?? {
    schedule_id: null, journal_id: null, week_start: weekStart, tema: "", pilar_karakter: "",
    nilai_karakter: "", jurnal: "", aktivitas: "", pembiasaan: "", has_schedule: false,
  };
}

export async function fetchDailyActivityWeek(params: {
  classroom_id: Id;
  tanggal_list: string[];
}): Promise<DailyActivitySheet[]> {
  const first = params.tanggal_list.map(dateOnly).find(Boolean) ?? "";
  const weekStart = mondayOf(first);
  if (!weekStart) return [];

  await assertWeekOverlapsActiveAcademicPeriod(weekStart);

  const sheets = await cached(qk.dailyWeek(params.classroom_id, weekStart),
    (signal) => fetchDailyWeekInternal(params.classroom_id, weekStart, signal));
  const wanted = new Set(params.tanggal_list.map(dateOnly).filter(Boolean));
  return sheets.filter((sheet) => wanted.size === 0 || wanted.has(sheet.tanggal));
}

export async function fetchDailyActivitySheet(params: {
  classroom_id: Id;
  tanggal: string;
  q?: string;
}): Promise<DailyActivitySheet> {
  const tanggal = dateOnly(params.tanggal);
  const sheets = await fetchDailyActivityWeek({ classroom_id: params.classroom_id, tanggal_list: [tanggal] });
  const sheet = sheets.find((item) => item.tanggal === tanggal) ?? {
    classroom_id: params.classroom_id,
    tanggal,
    plan: { schedule_id: null, journal_id: null, week_start: mondayOf(tanggal), tema: "", pilar_karakter: "", nilai_karakter: "", jurnal: "", aktivitas: "", pembiasaan: "", has_schedule: false },
    is_holiday: false,
    holiday_label: "",
    holiday_description: "",
    items: [],
  };
  if (!text(params.q)) return sheet;
  const q = text(params.q).toLowerCase();
  return {
    ...sheet,
    items: sheet.items.filter((student) =>
      student.nama_lengkap.toLowerCase().includes(q) || student.nisn.toLowerCase().includes(q)
    ),
  };
}

export async function saveDailyActivity(payload: DailyActivityPayload): Promise<DailyActivitySheet> {
  const tanggal = dateOnly(payload.tanggal);
  const weekStart = weekStartDate(payload.week_start || tanggal);
  const classroomId = Number(payload.classroom_id);

  if (!tanggal) {
    throw new Error("Tanggal Aktivitas Harian tidak valid.");
  }
  if (!weekStart) {
    throw new Error("Minggu Aktivitas Harian tidak valid.");
  }
  if (!Number.isFinite(classroomId) || classroomId <= 0) {
    throw new Error("Kelas Aktivitas Harian tidak valid.");
  }

  // Gunakan snapshot yang sudah dimuat/diubah di UI. Save tidak boleh gagal
  // hanya karena GET siswa, kalender, kelas, atau week-data tambahan gagal.
  const suppliedSheets = payload.week_sheets?.length
    ? payload.week_sheets
    : [{
        tanggal,
        is_holiday: Boolean(payload.is_holiday),
        items: payload.items,
      }];

  const suppliedByDate = new Map(
    suppliedSheets
      .map((sheet) => ({
        tanggal: dateOnly(sheet.tanggal),
        is_holiday: Boolean(sheet.is_holiday),
        items: sheet.items ?? [],
      }))
      .filter((sheet) => Boolean(sheet.tanggal))
      .map((sheet) => [sheet.tanggal, sheet] as const)
  );

  // Pastikan hari yang sedang diedit selalu berasal dari payload terbaru,
  // walaupun caller belum mengirim week_sheets.
  suppliedByDate.set(tanggal, {
    tanggal,
    is_holiday: Boolean(payload.is_holiday),
    items: payload.items ?? [],
  });

  const sheets = dayNames.map((_, index) => {
    const date = addDays(weekStart, index);
    return suppliedByDate.get(date) ?? {
      tanggal: date,
      is_holiday: false,
      items: [],
    };
  });

  const activities = sheets
    .filter((sheet) => !sheet.is_holiday)
    .flatMap((sheet) =>
      sheet.items
        .filter((item) => item.activity_readonly !== true)
        .map((item) => {
          const studentId = Number(item.student_id);
          if (!Number.isFinite(studentId) || studentId <= 0) {
            throw new Error(`ID siswa pada ${sheet.tanggal} tidak valid.`);
          }
          // Kirim hanya field native yang didukung backend. Jangan menaruh JSON
          // metadata di catatan_guru karena kolom backend dapat memiliki batas
          // panjang dan sebelumnya memicu HTTP 500 saat menyimpan.
          return {
            student_id: studentId,
            tanggal: sheet.tanggal,
            makanan: text(item.makanan),
            perasaan: text(item.perasaan),
            barang_bawaan: text(item.barang_bawaan),
            catatan_guru: text(item.catatan_guru),
          };
        })
    );

  const scheduleId = payload.plan.schedule_id;
  const jsonBody = {
    classroom_id: classroomId,
    week_start_date: weekStart,
    // Pertahankan kontrak lama: backend menerima schedule_id dari frontend,
    // termasuk null ketika minggu belum memiliki Jadwal Administrasi.
    schedule_id:
      scheduleId === null || scheduleId === undefined || scheduleId === ""
        ? null
        : Number(scheduleId),
    rencana_mingguan: {
      tema: text(payload.plan.tema),
      pilar_karakter: text(payload.plan.pilar_karakter),
      nilai_karakter: text(payload.plan.nilai_karakter),
      isi_jurnal: text(payload.plan.jurnal),
      jurnal: text(payload.plan.jurnal),
      aktivitas: text(payload.plan.aktivitas),
      pembiasaan: text(payload.plan.pembiasaan),
    },
    days: sheets.map((sheet) => ({
      tanggal: sheet.tanggal,
      is_holiday: Boolean(sheet.is_holiday),
      catatan_libur: "",
    })),
    // `items` dan `activities` adalah alias untuk data aktivitas siswa. Jangan
    // mengirim record yang sama dua kali: beberapa implementasi backend dapat
    // menggabungkan kedua array dan memicu duplicate insert/upsert. Tetap kirim
    // field `activities` sebagai array kosong agar kompatibel jika schema masih
    // mendeklarasikan keduanya sebagai field request.
    items: activities,
    activities: [],
  };

  const raw = await apiRequestJson<unknown>("/api/daily-activities/week", {
    method: "PUT",
    jsonBody,
  });

  // Backend belum menyediakan field untuk partisipasi 4 aspek dan rencana
  // berbeda per hari. Simpan metadata tambahan di cache client hanya setelah
  // PUT berhasil, sehingga UI tidak menandai data gagal sebagai tersimpan.
  const clientMetaRows: DailyActivityClientMeta[] = [];
  sheets.forEach((sheet) => {
    let planStored = false;
    sheet.items
      .filter((item) => item.activity_readonly !== true)
      .forEach((item) => {
        const studentId = idOf(item.student_id);
        if (studentId === null) return;
        const dailyPlan = !planStored && item.daily_plan
          ? { ...item.daily_plan, week_start: weekStart }
          : undefined;
        if (dailyPlan) planStored = true;
        clientMetaRows.push({
          classroom_id: classroomId,
          student_id: studentId,
          tanggal: sheet.tanggal,
          jurnal_status: dailyActivityCompletionStatus(item.jurnal_status),
          pilar_karakter_status: dailyActivityCompletionStatus(
            item.pilar_karakter_status ?? item.nilai_karakter_status
          ),
          aktivitas_status: dailyActivityCompletionStatus(item.aktivitas_status),
          pembiasaan_status: dailyActivityCompletionStatus(item.pembiasaan_status),
          daily_plan: dailyPlan,
        });
      });
  });
  writeDailyActivityClientMeta(clientMetaRows);

  const sourceClassName = text(payload.classroom_name);
  const metadataByKey = new Map<string, DailyActivityStudentLog>();
  sheets.forEach((sheet) => {
    sheet.items.forEach((item) => {
      metadataByKey.set(`${String(item.student_id)}|${sheet.tanggal}`, item);
    });
  });

  archiveDailyActivityRows(
    activities.map((item) => {
      const metadata = metadataByKey.get(`${String(item.student_id)}|${item.tanggal}`);
      return {
        student_id: item.student_id,
        tanggal: item.tanggal,
        makanan: item.makanan,
        perasaan: item.perasaan,
        barang_bawaan: item.barang_bawaan,
        catatan_guru: item.catatan_guru,
        classroom_id: payload.classroom_id,
        classroom_name: sourceClassName || text(metadata?.classroom_name),
        student_name: text(metadata?.student_name),
        student_nisn: text(metadata?.student_nisn),
        student_gender: text(metadata?.student_gender),
      };
    })
  );
  archiveDailyActivityRows(
    normalizedDailyActivityRows(raw, payload.classroom_id, sourceClassName)
  );

  // Cache refresh adalah post-save concern. Kegagalan refetch tidak boleh
  // mengubah PUT yang sudah sukses menjadi notifikasi "gagal disimpan".
  void invalidate(["kegiatan", "daily-week"]).catch(() => undefined);

  const root = obj(raw);
  const responsePlanRaw = obj(root.rencana_mingguan ?? root.plan);
  const hasResponsePlan =
    Object.keys(responsePlanRaw).length > 0 ||
    root.schedule_id !== undefined;
  const savedPlan = hasResponsePlan
    ? normalizePlan(root, weekStart)
    : { ...payload.plan, week_start: weekStart };

  return {
    classroom_id: payload.classroom_id,
    tanggal,
    plan: savedPlan,
    is_holiday: Boolean(payload.is_holiday),
    holiday_label: "",
    holiday_description: "",
    // Caller mempertahankan snapshot siswa lokal. Data server akan disegarkan
    // lewat invalidasi cache tanpa memblokir hasil save.
    items: [],
  };
}

// Reporting helpers now derive from backend week data instead of browser storage.
export async function fetchDailyActivityReportPeriods(): Promise<DailyActivityReportPeriodSummary[]> {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);

  return [
    {
      tahun_ajaran: text(period.tahun_ajaran),
      total_days: 0,
      dari: bounds.start,
      sampai: bounds.end,
    },
  ];
}

export async function fetchDailyActivityReport(params: {
  dari: string;
  sampai: string;
  classroom_id?: Id | "all" | null;
  q?: string;
}): Promise<DailyActivityReportResult> {
  // No range endpoint exists; keep this helper intentionally conservative.
  return { dari: dateOnly(params.dari), sampai: dateOnly(params.sampai), items: [], total_days: 0, total_holidays: 0, total_student_logs: 0, total_filled_students: 0 };
}

export async function fetchWeeklyStudentActivityReport(params: {
  week: string;
  classroom_id?: Id | "all" | null;
  q?: string;
}): Promise<WeeklyStudentActivityReportResult> {
  const weekStart = mondayOf(params.week) || dateOnly(params.week);
  const classes = await fetchKegiatanClassrooms();
  const selected = classes.filter((item) =>
    params.classroom_id === undefined || params.classroom_id === null || params.classroom_id === "all" || String(item.id) === String(params.classroom_id)
  );
  const sheetsByClass = await Promise.all(selected.map((item) => fetchDailyActivityWeek({
    classroom_id: item.id,
    tanggal_list: dayNames.map((_, index) => addDays(weekStart, index)),
  })));
  const items: WeeklyStudentActivityReportItem[] = [];
  sheetsByClass.forEach((sheets) => {
    const studentIds = new Set(sheets.flatMap((sheet) => sheet.items.map((student) => String(student.id))));
    studentIds.forEach((studentId) => {
      const student = sheets.flatMap((sheet) => sheet.items).find((row) => String(row.id) === studentId);
      if (!student) return;
      const days: WeeklyStudentActivityDay[] = sheets.map((sheet, index) => ({
        hari: dayNames[index] ?? "",
        tanggal: sheet.tanggal,
        is_holiday: sheet.is_holiday,
        plan: sheet.plan,
        log: sheet.items.find((row) => String(row.id) === studentId)?.log ?? { student_id: student.id, makanan: "", perasaan: "", barang_bawaan: "", catatan_guru: "" },
        parent_note: "",
        communication_teacher_note: "",
        participation_recorded: (() => {
          const log = sheet.items.find((row) => String(row.id) === studentId)?.log;
          return Boolean(
            log &&
              [log.makanan, log.perasaan, log.barang_bawaan, log.catatan_guru]
                .map(text)
                .some(Boolean)
          );
        })(),
      }));
      items.push({
        ...student,
        week: weekStart,
        week_start: weekStart,
        week_end: addDays(weekStart, 4),
        plan: sheets[0]?.plan ?? { schedule_id: null, journal_id: null, week_start: weekStart, tema: "", pilar_karakter: "", nilai_karakter: "", jurnal: "", aktivitas: "", pembiasaan: "", has_schedule: false },
        days,
        weekly_teacher_summary: days.map((day) => day.log.catatan_guru).filter(Boolean).join(" · "),
        stats: {
          active_days: days.filter((day) => !day.is_holiday).length,
          holiday_days: days.filter((day) => day.is_holiday).length,
          filled_days: days.filter((day) => day.participation_recorded).length,
          parent_notes: 0,
          teacher_notes: days.filter((day) => text(day.log.catatan_guru)).length,
          meals_recorded: days.filter((day) => text(day.log.makanan)).length,
          feelings_recorded: days.filter((day) => text(day.log.perasaan)).length,
        },
      });
    });
  });
  const q = text(params.q).toLowerCase();
  const filtered = q ? items.filter((item) => item.nama_lengkap.toLowerCase().includes(q) || item.nisn.toLowerCase().includes(q)) : items;
  return {
    week: weekStart,
    dari: weekStart,
    sampai: addDays(weekStart, 4),
    items: filtered,
    total_students: filtered.length,
    total_filled_days: filtered.reduce((sum, item) => sum + item.stats.filled_days, 0),
    total_parent_notes: 0,
    total_teacher_notes: filtered.reduce((sum, item) => sum + item.stats.teacher_notes, 0),
  };
}

const communicationBookRowHasData = (value: Record<string, unknown>): boolean => {
  const temperature = numberOrNull(value.suhu_tubuh);
  const bab = value.anak_bab;

  return Boolean(
    text(value.jam_tidur) ||
      text(value.menu_sarapan) ||
      text(value.catatan_ortu) ||
      text(value.catatan_guru) ||
      (temperature !== null && temperature > 0) ||
      bab === true ||
      text(bab).toLowerCase() === "ya"
  );
};

const communicationBookDayHasData = (day: CommunicationBookDay): boolean => {
  const temperature = numberOrNull(day.suhu_tubuh);

  return Boolean(
    text(day.jam_tidur) ||
      text(day.menu_sarapan) ||
      text(day.catatan_ortu) ||
      text(day.catatan_guru) ||
      (temperature !== null && temperature > 0) ||
      text(day.anak_bab).toLowerCase() === "ya"
  );
};

function normalizeCommunicationBook(
  raw: unknown,
  studentId: Id,
  week: string,
  calendar?: SchoolCalendarContext
): CommunicationBook {
  const root = obj(raw);
  const rows = [...list(root.days), ...list(root.items), ...list(root.harian)];
  const map = new Map(rows.map((row) => {
    const value = obj(row);
    return [dateOnly(value.tanggal), value] as const;
  }));
  const persistedDates = new Set(
    rows
      .map((row) => obj(row))
      .filter(communicationBookRowHasData)
      .map((row) => dateOnly(row.tanggal))
      .filter(Boolean)
  );
  const weekStart = dateOnly(root.week_start_date ?? root.week ?? week) || dateOnly(week);
  return {
    student_id: idOf(root.student_id) ?? studentId,
    week: weekStart,
    student_name: text(root.student_nama),
    student_nisn: text(root.nisn),
    classroom_id: idOf(root.classroom_id),
    classroom_name: text(root.classroom_nama),
    days: dayNames.map((hari, index) => {
      const tanggal = addDays(weekStart, index);
      const row = map.get(tanggal) ?? {};
      const bab = row.anak_bab;
      const dayStatus = calendar
        ? resolveSchoolDayStatus(tanggal, calendar)
        : null;
      return {
        hari,
        tanggal,
        persisted: persistedDates.has(tanggal),
        is_holiday: Boolean(dayStatus?.is_holiday),
        holiday_label: dayStatus?.is_holiday ? dayStatus.label : "",
        holiday_description: dayStatus?.is_holiday ? dayStatus.description : "",
        jam_tidur: text(row.jam_tidur),
        anak_bab: typeof bab === "boolean" ? (bab ? "Ya" : "Tidak") : text(bab),
        suhu_tubuh: row.suhu_tubuh === null || row.suhu_tubuh === undefined ? "" : text(row.suhu_tubuh),
        menu_sarapan: text(row.menu_sarapan),
        catatan_ortu: text(row.catatan_ortu),
        catatan_guru: text(row.catatan_guru),
      };
    }),
  };
}

export async function fetchCommunicationBook(params: {
  student_id: Id;
  week: string;
}): Promise<CommunicationBook> {
  const week = weekStartDate(params.week);
  await Promise.all([
    assertEligibleKegiatanStudent(params.student_id),
    assertWeekOverlapsActiveAcademicPeriod(week),
  ]);

  return cached(qk.communication(params.student_id, week), async (signal) => {
    const [raw, calendar] = await Promise.all([
      apiGetJson<unknown>(queryUrl("/api/communication-books", {
        student_id: params.student_id,
        week,
      }), { signal }),
      sharedSchoolCalendar(),
    ]);
    const normalized = normalizeCommunicationBook(raw, params.student_id, week, calendar);
    if (!normalized.student_name || !normalized.classroom_name) {
      const student = (await fetchKegiatanStudents()).find((item) => String(item.id) === String(params.student_id));
      if (student) {
        normalized.student_name ||= student.nama_lengkap;
        normalized.student_nisn ||= student.nisn;
        normalized.student_gender ||= student.jenis_kelamin;
        normalized.classroom_id ??= student.classroom_id;
        normalized.classroom_name ||= student.classroom_name;
      }
    }
    return normalized;
  }, 120_000);
}

export async function saveCommunicationBook(payload: CommunicationBook): Promise<CommunicationBook> {
  const week = weekStartDate(payload.week);
  await Promise.all([
    assertEligibleKegiatanStudent(payload.student_id, payload.classroom_id),
    assertWeekOverlapsActiveAcademicPeriod(week),
  ]);

  const period = await sharedCurrentAcademicPeriod();
  const calendar = await sharedSchoolCalendar();
  const bounds = activePeriodBounds(period);
  const days = payload.days
    .filter((day) => {
      if (!isDateWithinBounds(day.tanggal, bounds)) return false;
      if (resolveSchoolDayStatus(day.tanggal, calendar).is_holiday) return false;
      return communicationBookDayHasData(day);
    })
    .map((day) => ({
      tanggal: dateOnly(day.tanggal),
      jam_tidur: text(day.jam_tidur),
      anak_bab: ["ya", "true", "1"].includes(text(day.anak_bab).toLowerCase()),
      suhu_tubuh: numberOrNull(day.suhu_tubuh) ?? 0,
      menu_sarapan: text(day.menu_sarapan),
      catatan_ortu: text(day.catatan_ortu),
      catatan_guru: text(day.catatan_guru),
    }));
  const raw = await apiRequestJson<unknown>("/api/communication-books", {
    method: "PUT",
    jsonBody: {
      student_id: Number(payload.student_id),
      week,
      week_start_date: week,
      days,
      items: days,
      harian: days,
    },
  });
  await invalidate(["kegiatan", "communication"]);
  return normalizeCommunicationBook(raw, payload.student_id, week, calendar);
}

export async function fetchCommunicationBookReportPeriods(): Promise<CommunicationBookReportPeriodSummary[]> {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);

  return [
    {
      tahun_ajaran: text(period.tahun_ajaran),
      total_books: 0,
      dari: bounds.start,
      sampai: bounds.end,
    },
  ];
}

export async function fetchCommunicationBookReport(params: {
  dari: string;
  sampai: string;
  classroom_id?: Id | "all" | null;
  q?: string;
}): Promise<CommunicationBookReportResult> {
  const dari = dateOnly(params.dari);
  const sampai = dateOnly(params.sampai);
  if (!dari || !sampai || dari > sampai) {
    return { dari, sampai, items: [], total_books: 0, total_days: 0 };
  }

  // Backend Buku Penghubung hanya menyediakan lookup per siswa/per minggu.
  // Halaman laporan perlu mengagregasi endpoint tersebut agar index dan cetak
  // membaca sumber data backend yang sama dengan halaman input Kegiatan.
  const students = await fetchKegiatanStudents({
    classroom_id: params.classroom_id ?? "all",
    q: params.q,
  });
  if (!students.length) {
    return { dari, sampai, items: [], total_books: 0, total_days: 0 };
  }

  const calendar = await sharedSchoolCalendar();
  const weekStarts: string[] = [];
  let cursor = mondayOf(dari) || dari;
  while (cursor && cursor <= sampai) {
    weekStarts.push(cursor);
    const next = addDays(cursor, 7);
    if (!next || next === cursor) break;
    cursor = next;
  }

  const jobs = students.flatMap((student) =>
    weekStarts.map((weekStart) => ({ student, weekStart }))
  );
  const booksByStudent = new Map<string, CommunicationBook[]>();
  let jobIndex = 0;
  const workerCount = Math.min(5, jobs.length);

  const workers = Array.from({ length: workerCount }, async () => {
    while (jobIndex < jobs.length) {
      const current = jobs[jobIndex++];
      try {
        const raw = await apiGetJson<unknown>(
          queryUrl("/api/communication-books", {
            student_id: current.student.id,
            week: current.weekStart,
            week_start_date: current.weekStart,
          })
        );
        const book = normalizeCommunicationBook(
          raw,
          current.student.id,
          current.weekStart,
          calendar
        );
        book.student_name ||= current.student.nama_lengkap;
        book.student_nisn ||= current.student.nisn;
        book.student_gender ||= current.student.jenis_kelamin;
        book.classroom_id ??= current.student.classroom_id;
        book.classroom_name ||= current.student.classroom_name;

        const hasData = book.days.some(
          (day) => Boolean(day.persisted) || communicationBookDayHasData(day)
        );
        if (!hasData) continue;

        const key = String(current.student.id);
        const existing = booksByStudent.get(key) ?? [];
        existing.push(book);
        booksByStudent.set(key, existing);
      } catch {
        // Satu minggu kosong / gagal dibaca tidak boleh menggagalkan seluruh
        // laporan sekolah. Minggu lain dan siswa lain tetap ditampilkan.
      }
    }
  });
  await Promise.all(workers);

  const items: CommunicationBookReportItem[] = students.flatMap((student) => {
    const books = (booksByStudent.get(String(student.id)) ?? [])
      .sort((a, b) => b.week.localeCompare(a.week));
    if (!books.length) return [];

    const filledDays = books.flatMap((book) =>
      book.days.filter(
        (day) => Boolean(day.persisted) || communicationBookDayHasData(day)
      )
    );
    const dataPoints = filledDays.reduce((sum, day) =>
      sum + [
        day.jam_tidur,
        day.anak_bab,
        day.suhu_tubuh,
        day.menu_sarapan,
        day.catatan_ortu,
        day.catatan_guru,
      ].filter((value) => text(value)).length, 0
    );
    const activityDates = filledDays
      .map((day) => dateOnly(day.tanggal))
      .filter(Boolean)
      .sort();
    const lastActivity = activityDates.length
      ? activityDates[activityDates.length - 1]
      : "";

    return [{
      ...student,
      books,
      stats: {
        weeks: books.length,
        filled_days: filledDays.length,
        parent_notes: filledDays.filter((day) => text(day.catatan_ortu)).length,
        teacher_notes: filledDays.filter((day) => text(day.catatan_guru)).length,
        data_points: dataPoints,
        last_activity: lastActivity,
      },
    }];
  });

  return {
    dari,
    sampai,
    items,
    total_books: items.reduce((sum, item) => sum + item.stats.weeks, 0),
    total_days: items.reduce((sum, item) => sum + item.stats.filled_days, 0),
  };
}

function normalizeDevelopment(raw: unknown): StudentDevelopment {
  const value = obj(raw);
  return {
    student_id: idOf(value.student_id) ?? "",
    tahun_ajaran: text(value.tahun_ajaran),
    semester: validSemester(value.semester),
    tinggi_badan: numberOrNull(value.tinggi_badan),
    berat_badan: numberOrNull(value.berat_badan),
    bmi: numberOrNull(value.bmi),
    status_gizi: text(value.status_gizi),
    lingkar_kepala: numberOrNull(value.lingkar_kepala),
    catatan: text(value.catatan),
    tanggal_pemeriksaan: dateOnly(value.tanggal_pemeriksaan),
    student_name: text(value.student_nama),
    student_nisn: text(value.nisn),
    classroom_id: idOf(value.classroom_id),
    classroom_name: text(value.classroom_nama),
  };
}

export async function fetchStudentDevelopmentsList(params: {
  student_id?: Id | null;
  classroom_id?: Id | "all" | null;
  tahun_ajaran?: string;
  semester?: SemesterNumber | null;
  q?: string;
} = {}): Promise<StudentDevelopment[]> {
  const classroomId = params.classroom_id === "all" ? null : params.classroom_id;
  return cached(
    [
      "kegiatan",
      "developments",
      "list",
      text(params.student_id),
      text(classroomId),
      text(params.tahun_ajaran),
      text(params.semester),
      text(params.q),
    ],
    async (signal) => {
      const raw = await apiGetJson<unknown>(
        queryUrl("/api/student-developments", {
          student_id: params.student_id ?? undefined,
          classroom_id: classroomId ?? undefined,
          tahun_ajaran: text(params.tahun_ajaran),
          semester: params.semester ?? undefined,
          q: text(params.q),
        }),
        { signal }
      );
      return list(raw)
        .map(normalizeDevelopment)
        .sort(
          (a, b) =>
            b.tahun_ajaran.localeCompare(a.tahun_ajaran) ||
            a.semester - b.semester
        );
    },
    120_000
  );
}

export async function fetchStudentDevelopments(studentId: Id): Promise<StudentDevelopment[]> {
  await assertEligibleKegiatanStudent(studentId);
  return fetchStudentDevelopmentsList({ student_id: studentId });
}

export async function saveStudentDevelopment(payload: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  tinggi_badan: number | string | null;
  berat_badan: number | string | null;
  lingkar_kepala?: number | string | null;
  catatan?: string;
  tanggal_pemeriksaan?: string;
}): Promise<StudentDevelopment> {
  const period = await sharedCurrentAcademicPeriod();
  const bounds = activePeriodBounds(period);
  const today = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
      now.getDate()
    ).padStart(2, "0")}`;
  })();
  const examinationDate =
    dateOnly(payload.tanggal_pemeriksaan) ||
    (isDateWithinBounds(today, bounds) ? today : bounds.start || bounds.end);

  await Promise.all([
    assertEligibleKegiatanStudent(payload.student_id),
    assertCurrentReportPeriod(payload.tahun_ajaran, payload.semester),
    assertDateInActiveAcademicPeriod(examinationDate, "Tanggal pemeriksaan"),
  ]);

  const raw = await apiRequestJson<unknown>("/api/student-developments", {
    method: "PUT",
    jsonBody: {
      student_id: Number(payload.student_id),
      tahun_ajaran: text(payload.tahun_ajaran),
      semester: payload.semester,
      tinggi_badan: numberOrNull(payload.tinggi_badan) ?? 0,
      berat_badan: numberOrNull(payload.berat_badan) ?? 0,
      lingkar_kepala: numberOrNull(payload.lingkar_kepala) ?? 0,
      catatan: text(payload.catatan),
      tanggal_pemeriksaan: examinationDate,
    },
  });
  await Promise.all([
    invalidate(["kegiatan", "developments"]),
    invalidate(["kegiatan", "report"]),
    invalidate(["kegiatan", "reports"]),
  ]);
  return normalizeDevelopment(raw);
}

function normalizeReportScale(value: unknown): StudentReportScore["scale"] | null {
  const scale = text(value).toUpperCase();
  return ["BB", "MB", "BSH", "BSB"].includes(scale)
    ? (scale as StudentReportScore["scale"])
    : null;
}

function reportEnvelope(raw: unknown): Record<string, unknown> {
  let current = obj(raw);

  // Some API gateways wrap successful responses in data/result/report/detail.
  // Walk only object envelopes so direct backend responses remain untouched.
  for (let depth = 0; depth < 4; depth += 1) {
    const next = [current.data, current.result, current.report, current.detail]
      .map(obj)
      .find((candidate) => Object.keys(candidate).length > 0);

    if (!next) break;
    current = next;
  }

  return current;
}

function collectReportScores(value: unknown, output: StudentReportScore[] = []): StudentReportScore[] {
  if (Array.isArray(value)) {
    value.forEach((item) => collectReportScores(item, output));
    return output;
  }

  const row = obj(value);
  if (!Object.keys(row).length) return output;

  const nestedIndicator = obj(
    row.indicator ?? row.indikator_detail ?? row.indicator_detail
  );
  const scale = normalizeReportScale(
    row.scale ??
      row.skala ??
      row.nilai ??
      row.skor ??
      row.nilai_rapor ??
      row.status_nilai ??
      row.capaian ??
      row.hasil
  );
  const indicatorId = idOf(
    row.indicator_id ??
      row.indikator_id ??
      row.id_indikator ??
      nestedIndicator.id ??
      nestedIndicator.indicator_id ??
      nestedIndicator.indikator_id ??
      (scale ? row.id : null)
  );

  if (indicatorId !== null && scale) {
    const key = String(indicatorId);
    const existingIndex = output.findIndex(
      (item) => String(item.indicator_id) === key
    );
    const nextScore = { indicator_id: indicatorId, scale } as StudentReportScore;

    if (existingIndex >= 0) output[existingIndex] = nextScore;
    else output.push(nextScore);
  }

  [
    "aspek_penilaian",
    "aspects",
    "aspek",
    "sub_aspects",
    "subaspects",
    "sub_aspek",
    "indicators",
    "indikator",
    "indicator_scores",
    "nilai_indikator",
    "penilaian",
    "scores",
    "items",
    "children",
  ].forEach((key) => {
    if (row[key] !== undefined) collectReportScores(row[key], output);
  });

  return output;
}

function backendReportStatus(_value: unknown): StudentReportStatus {
  // Backend final exposes Belum diisi / Proses / Sudah Diisi, but does not expose
  // finalize/reopen mutations. Keep editing lifecycle as DRAFT to avoid a fake lock.
  return "DRAFT";
}

function normalizeReport(raw: unknown, studentId: Id, year: string, semester: SemesterNumber): StudentReport {
  const root = reportEnvelope(raw);
  const attendance = obj(root.kehadiran ?? root.absensi);
  const physical = obj(root.fisik);
  const scores = collectReportScores(root.aspek_penilaian ?? root.scores ?? []);
  return {
    student_id: idOf(root.student_id) ?? studentId,
    student_nama: text(root.student_nama ?? root.nama_siswa ?? root.nama_lengkap),
    nisn: text(root.nisn ?? root.nomor_induk),
    foto: text(root.foto),
    classroom_id: idOf(root.classroom_id ?? root.kelas_id),
    classroom_nama: text(root.classroom_nama ?? root.nama_kelas),
    curriculum_id: idOf(root.curriculum_id ?? root.kurikulum_id),
    curriculum_nama: text(root.curriculum_nama ?? root.nama_kurikulum),
    tahun_ajaran: text(root.tahun_ajaran) || year,
    semester: validSemester(root.semester ?? semester),
    scores,
    catatan: text(root.catatan),
    fisik: {
      berat_badan: numberOrNull(physical.berat_badan),
      tinggi_badan: numberOrNull(physical.tinggi_badan),
    },
    absensi: {
      hadir: Number(attendance.hadir ?? 0) || 0,
      sakit: Number(attendance.sakit ?? 0) || 0,
      izin: Number(attendance.izin ?? 0) || 0,
      alpa: Number(attendance.alpa ?? 0) || 0,
      total:
        Number(attendance.total ?? 0) ||
        (Number(attendance.hadir ?? 0) || 0) +
          (Number(attendance.sakit ?? 0) || 0) +
          (Number(attendance.izin ?? 0) || 0) +
          (Number(attendance.alpa ?? 0) || 0),
    },
    komentar_ortu: text(root.komentar_ortu),
    report_status: backendReportStatus(root.status_rapor ?? root.report_status),
    created_at: text(root.created_at),
    created_by: text(root.created_by),
    updated_at: text(root.updated_at),
    updated_by: text(root.updated_by),
    finalized_at: "",
    finalized_by: "",
    history: [],
  };
}

export async function fetchSchoolProfile(): Promise<SchoolProfile> {
  if (typeof window === "undefined") return { ...DEFAULT_SCHOOL_PROFILE };
  try {
    const raw = window.localStorage.getItem(SCHOOL_PROFILE_STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SCHOOL_PROFILE };
    const stored = JSON.parse(raw) as Partial<SchoolProfile>;
    return { ...DEFAULT_SCHOOL_PROFILE, ...stored, nama_sekolah: text(stored.nama_sekolah) || DEFAULT_SCHOOL_PROFILE.nama_sekolah, alamat: text(stored.alamat) || DEFAULT_SCHOOL_PROFILE.alamat };
  } catch {
    return { ...DEFAULT_SCHOOL_PROFILE };
  }
}

export async function saveSchoolProfile(payload: SchoolProfile): Promise<SchoolProfile> {
  const next = { ...DEFAULT_SCHOOL_PROFILE, ...payload, nama_sekolah: text(payload.nama_sekolah) || DEFAULT_SCHOOL_PROFILE.nama_sekolah, alamat: text(payload.alamat) || DEFAULT_SCHOOL_PROFILE.alamat };
  if (typeof window !== "undefined") window.localStorage.setItem(SCHOOL_PROFILE_STORAGE_KEY, JSON.stringify(next));
  return next;
}

export async function fetchStudentReportIdentity(studentId: Id): Promise<StudentReportIdentity | null> {
  const [placement, student] = await Promise.all([
    assertEligibleKegiatanStudent(studentId),
    fetchStudentById(studentId),
  ]);

  if (student.id === null) return null;

  const parent = obj(student.parent);

  return {
    id: student.id,
    nama_lengkap: text(student.nama_lengkap),
    nama_panggilan: text(student.nama_panggilan),
    nisn: text(student.nisn),
    nik: text(student.nik),
    tempat_lahir: text(student.tempat_lahir),
    tanggal_lahir: dateOnly(student.tanggal_lahir),
    jenis_kelamin: text(student.jenis_kelamin),
    agama: text(student.agama),
    kewarganegaraan: text(student.kewarganegaraan),
    alamat_lengkap: text(student.alamat_lengkap),
    no_telepon_rumah: text(student.no_telepon_rumah),
    bahasa_sehari_hari: text(student.bahasa_sehari_hari),
    status_tempat_tinggal: text(student.status_tempat_tinggal),
    jarak_ke_sekolah: Number(student.jarak_ke_sekolah) || 0,
    jumlah_saudara_kandung: Number(student.jumlah_saudara_kandung) || 0,
    jumlah_saudara_tiri: Number(student.jumlah_saudara_tiri) || 0,
    jumlah_saudara_angkat: Number(student.jumlah_saudara_angkat) || 0,
    asal_peserta_didik: text(student.asal_peserta_didik),
    nama_lembaga: text(student.nama_lembaga),
    alamat_lembaga: text(student.alamat_lembaga),
    nama_lembaga_asal: text(student.nama_lembaga_asal),
    alamat_lembaga_asal: text(student.alamat_lembaga_asal),
    kelompok_umur_sebelumnya: text(student.kelompok_umur_sebelumnya),
    catatan_penting: text(student.catatan_penting),
    classroom_id: placement.classroom_id,
    classroom_name: placement.classroom_name,
    parent: {
      nama_ayah: text(parent.nama_ayah),
      pendidikan_ayah: text(parent.pendidikan_ayah),
      pekerjaan_ayah: text(parent.pekerjaan_ayah),
      kontak_ayah: text(parent.kontak_ayah),
      nama_ibu: text(parent.nama_ibu),
      pendidikan_ibu: text(parent.pendidikan_ibu),
      pekerjaan_ibu: text(parent.pekerjaan_ibu),
      kontak_ibu: text(parent.kontak_ibu),
      nama_wali: text(parent.nama_wali),
      pendidikan_wali: text(parent.pendidikan_wali),
      pekerjaan_wali: text(parent.pekerjaan_wali),
      hubungan_keluarga_wali: text(parent.hubungan_keluarga_wali),
      kontak_wali: text(parent.kontak_wali),
      no_hp_ortu: text(parent.no_hp_ortu),
    },
    status: {
      status_aktif: student.status?.status_aktif !== false,
      tanggal_masuk: dateOnly(student.status?.tanggal_masuk),
      tanggal_keluar: dateOnly(student.status?.tanggal_keluar),
      alasan_keluar: text(student.status?.alasan_keluar),
      kelompok_umur: text(student.status?.kelompok_umur),
      tahun_pelajaran: text(student.status?.tahun_pelajaran),
      nomor_surat_keterangan: text(student.status?.nomor_surat_keterangan),
      lembaga_lanjutan: text(student.status?.lembaga_lanjutan),
      tanggal_pindah: dateOnly(student.status?.tanggal_pindah),
      dari_kelompok_umur: text(student.status?.dari_kelompok_umur),
      ke_lembaga: text(student.status?.ke_lembaga),
      tingkat_kelompok_umur: text(student.status?.tingkat_kelompok_umur),
    },
  };
}

export async function fetchReportIndicators(options: { include_inactive?: boolean } = {}): Promise<ReportIndicator[]> {
  const indicators = await sharedIndicators();
  return indicators
    .filter((indicator) => indicator.id !== null && (options.include_inactive || indicator.status_aktif))
    .map((indicator) => ({
      id: indicator.id as Id,
      kode: text(indicator.kode),
      aspek: text(indicator.aspek),
      sub_aspek: text(indicator.sub_aspek),
      deskripsi: text(indicator.deskripsi),
    }));
}

interface BackendReportListItem {
  student_id: Id;
  student_nama: string;
  nisn: string;
  foto: string;
  classroom_id: Id | null;
  classroom_nama: string;
  curriculum_id: Id | null;
  curriculum_nama: string;
  tahun_ajaran: string;
  semester: SemesterNumber;
  status_rapor: string;
  jumlah_indikator_terisi: number;
  total_indikator: number;
  catatan: string;
  komentar_ortu: string;
  updated_at: string;
}

function normalizeReportListItem(raw: unknown): BackendReportListItem {
  const value = obj(raw);
  return {
    student_id: idOf(value.student_id) ?? "",
    student_nama: text(value.student_nama),
    nisn: text(value.nisn),
    foto: text(value.foto),
    classroom_id: idOf(value.classroom_id),
    classroom_nama: text(value.classroom_nama),
    curriculum_id: idOf(value.curriculum_id),
    curriculum_nama: text(value.curriculum_nama),
    tahun_ajaran: text(value.tahun_ajaran),
    semester: validSemester(value.semester),
    status_rapor: text(value.status_rapor),
    jumlah_indikator_terisi: Number(value.jumlah_indikator_terisi ?? 0) || 0,
    total_indikator: Number(value.total_indikator ?? 0) || 0,
    catatan: text(value.catatan),
    komentar_ortu: text(value.komentar_ortu),
    updated_at: text(value.updated_at),
  };
}

async function fetchReportsList(params: {
  classroom_id?: Id | "all" | null;
  tahun_ajaran?: string;
  semester?: SemesterNumber;
  q?: string;
}): Promise<BackendReportListItem[]> {
  return cached(qk.reportsList(params.classroom_id, params.tahun_ajaran, params.semester, params.q), async (signal) => {
    const raw = await apiGetJson<unknown>(queryUrl("/api/reports", {
      classroom_id: params.classroom_id === "all" ? undefined : (params.classroom_id as Id | null | undefined),
      tahun_ajaran: text(params.tahun_ajaran),
      semester: params.semester,
      q: text(params.q),
    }), { signal });
    return list(raw).map(normalizeReportListItem);
  }, 120_000);
}

export async function fetchReportPeriods(): Promise<ReportPeriodSummary[]> {
  const period = await sharedCurrentAcademicPeriod();
  const students = await fetchKegiatanStudents();
  const activeIds = new Set(students.map((student) => String(student.id)));
  const rows = (
    await fetchReportsList({
      tahun_ajaran: text(period.tahun_ajaran),
      semester: validSemester(period.semester),
    })
  ).filter((row) => activeIds.has(String(row.student_id)));

  let totalReports = 0;
  let totalFinal = 0;
  let totalDraf = 0;

  rows.forEach((row) => {
    const filled =
      row.jumlah_indikator_terisi > 0 ||
      Boolean(text(row.catatan));
    if (filled) totalReports += 1;

    const status = text(row.status_rapor).toLowerCase();
    if (status.includes("sudah") || status.includes("final")) {
      totalFinal += 1;
    } else if (filled) {
      totalDraf += 1;
    }
  });

  return [
    {
      tahun_ajaran: text(period.tahun_ajaran),
      semester: validSemester(period.semester),
      total_reports: totalReports,
      total_final: totalFinal,
      total_draft: totalDraf,
    },
  ];
}

export async function fetchReportStudentsForPeriod(params: {
  tahun_ajaran: string;
  semester: SemesterNumber;
}): Promise<KegiatanStudent[]> {
  await assertCurrentReportPeriod(params.tahun_ajaran, params.semester);

  const [students, rows] = await Promise.all([
    fetchKegiatanStudents(),
    fetchReportsList(params),
  ]);
  const rowMap = new Map(
    rows.map((row) => [String(row.student_id), row])
  );

  return students
    .filter((student) => {
      const row = rowMap.get(String(student.id));
      return Boolean(
        row &&
          (row.jumlah_indikator_terisi > 0 || text(row.catatan))
      );
    })
    .sort((a, b) =>
      a.nama_lengkap.localeCompare(b.nama_lengkap, "id", {
        sensitivity: "base",
      })
    );
}

export async function fetchStudentReportSupportStatus(params: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
}): Promise<StudentReportSupportStatus> {
  await Promise.all([
    assertEligibleKegiatanStudent(params.student_id),
    assertCurrentReportPeriod(params.tahun_ajaran, params.semester),
  ]);

  const [development, report] = await Promise.all([
    cached(qk.developments(params.student_id, params.tahun_ajaran, params.semester), async (signal) => {
      const raw = await apiGetJson<unknown>(queryUrl("/api/student-developments", {
        student_id: params.student_id,
        tahun_ajaran: params.tahun_ajaran,
        semester: params.semester,
      }), { signal });
      return list(raw).map(normalizeDevelopment);
    }),
    fetchStudentReport(params),
  ]);
  const attendanceTotal =
    Number(report.absensi.total ?? 0) ||
    Number(report.absensi.hadir ?? 0) +
      report.absensi.sakit +
      report.absensi.izin +
      report.absensi.alpa;
  return {
    student_id: params.student_id,
    tahun_ajaran: params.tahun_ajaran,
    semester: params.semester,
    has_development: development.length > 0,
    has_attendance: attendanceTotal > 0,
    attendance_days: attendanceTotal,
  };
}

export async function fetchStudentReportProgressList(params: {
  classroom_id?: Id | "all" | null;
  tahun_ajaran: string;
  semester: SemesterNumber;
  q?: string;
}): Promise<StudentReportProgress[]> {
  await assertCurrentReportPeriod(params.tahun_ajaran, params.semester);

  const classroomId = params.classroom_id === "all" ? null : params.classroom_id;
  const [rows, developments, students] = await Promise.all([
    fetchReportsList({
      classroom_id: classroomId,
      tahun_ajaran: params.tahun_ajaran,
      semester: params.semester,
      q: params.q,
    }),
    fetchStudentDevelopmentsList({
      classroom_id: classroomId,
      tahun_ajaran: params.tahun_ajaran,
      semester: params.semester,
    }),
    fetchKegiatanStudents({
      classroom_id: classroomId ?? "all",
    }),
  ]);

  const rowMap = new Map(rows.map((row) => [String(row.student_id), row]));
  const developmentIds = new Set(
    developments.map((item) => String(item.student_id))
  );

  return students.map((student) => {
    const row = rowMap.get(String(student.id));
    return {
      student_id: student.id,
      tahun_ajaran: row?.tahun_ajaran || text(params.tahun_ajaran),
      semester: row?.semester ?? params.semester,
      indicator_ids: [],
      has_catatan: Boolean(text(row?.catatan)),
      has_komentar_ortu: Boolean(text(row?.komentar_ortu)),
      has_development: developmentIds.has(String(student.id)),
      report_status: "DRAFT",
      backend_status: row?.status_rapor || "Belum diisi",
      filled_count: row?.jumlah_indikator_terisi ?? 0,
      total_count: row?.total_indikator ?? 0,
    };
  });
}

export async function fetchStudentReportProgress(params: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
}): Promise<StudentReportProgress> {
  await Promise.all([
    assertEligibleKegiatanStudent(params.student_id),
    assertCurrentReportPeriod(params.tahun_ajaran, params.semester),
  ]);

  // Use the reports-list endpoint as the authoritative source for list badges.
  // Parallel callers are deduplicated by QueryClient because they share the same key.
  const rows = await fetchReportsList({
    tahun_ajaran: params.tahun_ajaran,
    semester: params.semester,
  });
  const row = rows.find(
    (item) => String(item.student_id) === String(params.student_id)
  );

  if (!row) {
    return {
      student_id: params.student_id,
      tahun_ajaran: text(params.tahun_ajaran),
      semester: params.semester,
      indicator_ids: [],
      has_catatan: false,
      has_komentar_ortu: false,
      report_status: "DRAFT",
      backend_status: "Belum diisi",
      filled_count: 0,
      total_count: 0,
    };
  }

  return {
    student_id: row.student_id,
    tahun_ajaran: row.tahun_ajaran || text(params.tahun_ajaran),
    semester: row.semester,
    indicator_ids: [],
    has_catatan: Boolean(text(row.catatan)),
    has_komentar_ortu: Boolean(text(row.komentar_ortu)),
    report_status: "DRAFT",
    backend_status: row.status_rapor,
    filled_count: row.jumlah_indikator_terisi,
    total_count: row.total_indikator,
  };
}

async function fetchStudentReportFresh(params: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  signal?: AbortSignal;
}): Promise<StudentReport> {
  const raw = await apiGetJson<unknown>(queryUrl("/api/reports/student", {
    student_id: params.student_id,
    tahun_ajaran: text(params.tahun_ajaran),
    semester: params.semester,
  }), params.signal ? { signal: params.signal } : undefined);

  return normalizeReport(
    raw,
    params.student_id,
    text(params.tahun_ajaran),
    params.semester
  );
}

export async function fetchStudentReport(params: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  classroom_id?: Id | null;
}): Promise<StudentReport> {
  await Promise.all([
    assertEligibleKegiatanStudent(
      params.student_id,
      params.classroom_id
    ),
    assertCurrentReportPeriod(params.tahun_ajaran, params.semester),
  ]);

  return cached(
    qk.report(params.student_id, params.tahun_ajaran, params.semester),
    (signal) => fetchStudentReportFresh({ ...params, signal })
  );
}

function normalizedRequestedScores(scores: StudentReportScore[]): StudentReportScore[] {
  const map = new Map<string, StudentReportScore>();

  scores.forEach((score) => {
    const scale = normalizeReportScale(score.scale);
    const indicatorId = idOf(score.indicator_id);
    if (indicatorId === null || !scale) return;
    map.set(String(indicatorId), { indicator_id: indicatorId, scale });
  });

  return [...map.values()];
}

function reportPersistenceMismatch(
  requested: StudentReportScore[],
  persisted: StudentReportScore[]
): string[] {
  const persistedMap = new Map(
    persisted.map((score) => [String(score.indicator_id), score.scale])
  );

  return requested
    .filter(
      (score) =>
        persistedMap.get(String(score.indicator_id)) !== score.scale
    )
    .map((score) => String(score.indicator_id));
}

export async function saveStudentReport(payload: StudentReport, _actor?: string): Promise<StudentReport> {
  await Promise.all([
    assertEligibleKegiatanStudent(payload.student_id),
    assertCurrentReportPeriod(payload.tahun_ajaran, payload.semester),
  ]);

  const curriculums = await sharedCurriculums();
  const establishedCurriculum = newestCurriculumForYear(
    curriculums,
    payload.tahun_ajaran
  );
  const curriculumId = establishedCurriculum?.id;
  if (curriculumId === null || curriculumId === undefined) {
    throw new Error(
      `Kurikulum aktif Administrasi belum tersedia untuk tahun ajaran ${text(payload.tahun_ajaran) || "ini"}.`
    );
  }
  const requestedScores = normalizedRequestedScores(payload.scores);

  await apiRequestJson<unknown>("/api/reports/student", {
    method: "PUT",
    jsonBody: {
      student_id: Number(payload.student_id),
      tahun_ajaran: text(payload.tahun_ajaran),
      semester: payload.semester,
      curriculum_id: Number(curriculumId),
      scores: requestedScores.map((score) => ({
        indicator_id: Number(score.indicator_id),
        scale: score.scale,
      })),
      catatan: text(payload.catatan),
      komentar_ortu: text(payload.komentar_ortu),
    },
  });

  await Promise.all([
    invalidate(["kegiatan", "report"]),
    invalidate(["kegiatan", "reports"]),
  ]);

  // Do not trust the PUT response as the source of truth. Read the report back
  // from the backend and verify that the requested indicator values persisted.
  let persisted = await fetchStudentReportFresh({
    student_id: payload.student_id,
    tahun_ajaran: payload.tahun_ajaran,
    semester: payload.semester,
  });
  let mismatch = reportPersistenceMismatch(requestedScores, persisted.scores);

  // A short retry covers deployments where the write is committed just after
  // the PUT response is returned.
  if (mismatch.length > 0) {
    await new Promise((resolve) => setTimeout(resolve, 180));
    persisted = await fetchStudentReportFresh({
      student_id: payload.student_id,
      tahun_ajaran: payload.tahun_ajaran,
      semester: payload.semester,
    });
    mismatch = reportPersistenceMismatch(requestedScores, persisted.scores);
  }

  if (mismatch.length > 0) {
    throw new Error(
      `Backend menerima permintaan simpan, tetapi ${mismatch.length} nilai indikator belum kembali saat diverifikasi. ID indikator: ${mismatch.slice(0, 8).join(", ")}${mismatch.length > 8 ? "…" : ""}.`
    );
  }

  if (text(payload.catatan) && text(persisted.catatan) !== text(payload.catatan)) {
    throw new Error(
      "Backend menerima permintaan simpan, tetapi Catatan Guru belum kembali saat diverifikasi."
    );
  }

  if (
    text(payload.komentar_ortu) &&
    text(persisted.komentar_ortu) !== text(payload.komentar_ortu)
  ) {
    throw new Error(
      "Backend menerima permintaan simpan, tetapi Komentar Orang Tua berubah atau belum kembali saat diverifikasi."
    );
  }

  // Seed the exact verified result back into the shared QueryClient so every
  // consumer sees the same persisted report immediately.
  queryClient.setQueryData(
    qk.report(payload.student_id, payload.tahun_ajaran, payload.semester),
    persisted
  );

  return persisted;
}

export async function finalizeStudentReport(_params: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  actor?: string;
}): Promise<StudentReport> {
  throw new Error("Fitur finalisasi rapor belum tersedia di backend. Silakan tambahkan endpoint PUT /api/reports/student/finalize.");
}

export async function reopenStudentReport(_params: {
  student_id: Id;
  tahun_ajaran: string;
  semester: SemesterNumber;
  actor?: string;
}): Promise<StudentReport> {
  throw new Error("Fitur buka kembali rapor belum tersedia di backend. Silakan tambahkan endpoint PUT /api/reports/student/reopen.");
}

const developmentPeriodOrder = (year: string, semester: SemesterNumber) => {
  const start = Number(text(year).split("/")[0]);
  return (Number.isFinite(start) ? start : 0) * 10 + semester;
};
const averageNullable = (values: Array<number | null | undefined>) => {
  const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
  if (!valid.length) return null;
  return Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1));
};

export async function fetchDevelopmentAnalysis(params: {
  classroom_id?: Id | "all" | null;
  q?: string;
  tahun_ajaran?: string;
} = {}): Promise<DevelopmentAnalysisResult> {
  const students = await fetchKegiatanStudents({ classroom_id: params.classroom_id, q: params.q });
  const raw = await cached(["kegiatan", "development-analysis", text(params.classroom_id || "all"), text(params.q), text(params.tahun_ajaran)], async (signal) => {
    const response = await apiGetJson<unknown>(queryUrl("/api/student-developments", {
      classroom_id: params.classroom_id === "all" ? undefined : (params.classroom_id as Id | null | undefined),
      tahun_ajaran: text(params.tahun_ajaran),
      q: text(params.q),
    }), { signal });
    return list(response).map(normalizeDevelopment);
  });
  const byStudent = new Map<string, StudentDevelopment[]>();
  raw.forEach((item) => {
    const current = byStudent.get(String(item.student_id)) ?? [];
    current.push(item);
    byStudent.set(String(item.student_id), current);
  });
  const analysisStudents: DevelopmentAnalysisStudent[] = students.map((student) => {
    const developments = (byStudent.get(String(student.id)) ?? []).sort((a, b) => developmentPeriodOrder(a.tahun_ajaran, a.semester) - developmentPeriodOrder(b.tahun_ajaran, b.semester));
    const first = developments[0] ?? null;
    const latest = developments[developments.length - 1] ?? null;
    return {
      ...student,
      developments,
      first,
      latest,
      delta_tinggi: first?.tinggi_badan !== null && latest?.tinggi_badan !== null && first && latest ? Number(((latest.tinggi_badan ?? 0) - (first.tinggi_badan ?? 0)).toFixed(1)) : null,
      delta_berat: first?.berat_badan !== null && latest?.berat_badan !== null && first && latest ? Number(((latest.berat_badan ?? 0) - (first.berat_badan ?? 0)).toFixed(1)) : null,
    };
  });
  const periodMap = new Map<string, DevelopmentAnalysisPeriod>();
  raw.forEach((item) => periodMap.set(`${item.tahun_ajaran}_${item.semester}`, {
    tahun_ajaran: item.tahun_ajaran,
    semester: item.semester,
    label: `${item.tahun_ajaran} · Semester ${item.semester === 1 ? "I" : "II"}`,
  }));
  const periods = [...periodMap.values()].sort((a, b) => developmentPeriodOrder(a.tahun_ajaran, a.semester) - developmentPeriodOrder(b.tahun_ajaran, b.semester));
  const trend = periods.map((period) => {
    const points = raw.filter((item) => item.tahun_ajaran === period.tahun_ajaran && item.semester === period.semester);
    return {
      ...period,
      average_height: averageNullable(points.map((item) => item.tinggi_badan)),
      average_weight: averageNullable(points.map((item) => item.berat_badan)),
      student_count: new Set(points.map((item) => String(item.student_id))).size,
    };
  });
  const status = new Map<string, number>();
  analysisStudents.forEach((student) => {
    const key = text(student.latest?.status_gizi) || "Belum tersedia";
    status.set(key, (status.get(key) ?? 0) + 1);
  });
  return {
    periods,
    students: analysisStudents,
    summary: {
      total_students: analysisStudents.length,
      students_with_data: analysisStudents.filter((student) => student.developments.length > 0).length,
      latest_avg_height: averageNullable(analysisStudents.map((student) => student.latest?.tinggi_badan)),
      latest_avg_weight: averageNullable(analysisStudents.map((student) => student.latest?.berat_badan)),
      avg_height_change: averageNullable(analysisStudents.map((student) => student.delta_tinggi)),
      avg_weight_change: averageNullable(analysisStudents.map((student) => student.delta_berat)),
      status_distribution: [...status.entries()].map(([name, count]) => ({ status: name, count })).sort((a, b) => b.count - a.count),
      trend,
    },
  };
}

export async function fetchDevelopmentAnalysisYears(): Promise<string[]> {
  const period = await sharedCurrentAcademicPeriod();
  return text(period.tahun_ajaran)
    ? [text(period.tahun_ajaran)]
    : [];
}
