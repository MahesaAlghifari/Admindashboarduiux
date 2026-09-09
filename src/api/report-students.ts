import { apiGetJson } from "./http";
import { fetchAllClassrooms } from "./classrooms";
import { fetchStudentById, fetchStudents, getStudentEducationState, type Student, } from "./students";
import { fetchStudentUsers } from "./users";
import { fetchCurrentAcademicPeriod } from "./academic-periods";
export type ReportStudentId = number | string;
export interface ReportStudent {
    id: ReportStudentId;
    nama_lengkap: string;
    nomor_induk: string;
    nisn: string;
    classroom_id: ReportStudentId | null;
    classroom_name: string;
    jenis_kelamin: string;
    foto: string;
    berat_badan: number | null;
    tinggi_badan: number | null;
    education_state: "current" | "graduated" | "left";
    current_education_state?: "current" | "graduated" | "left";
    tahun_ajaran: string;
    last_tahun_ajaran?: string;
    status: Student["status"];
}
export interface ReportStudentQuery {
    classroom_id?: ReportStudentId | "all" | null;
    q?: string;
    tahun_ajaran?: string | null;
    dari?: string | null;
    sampai?: string | null;
    signal?: AbortSignal;
    fresh?: boolean;
}
const text = (value: unknown): string => String(value ?? "").trim();
const idKey = (value: unknown): string => String(value ?? "");
const obj = (value: unknown): Record<string, any> => value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};
const list = (value: unknown): unknown[] => {
    if (Array.isArray(value))
        return value;
    const root = obj(value);
    for (const key of ["items", "data", "results", "rows"]) {
        if (Array.isArray(root[key]))
            return root[key];
    }
    return [];
};
const numberOrNull = (value: unknown): number | null => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};
const DIRECTORY_TTL = 5 * 60000;
let directoryCache: {
    expiresAt: number;
    rows: ReportStudent[];
} | null = null;
let directoryPromise: Promise<ReportStudent[]> | null = null;
let classroomCache: {
    expiresAt: number;
    rows: any[];
} | null = null;
let classroomPromise: Promise<any[]> | null = null;
const ACTIVITY_TTL = 5 * 60000;
const activityWeekCache = new Map<string, {
    expiresAt: number;
    value: unknown;
}>();
const communicationWeekCache = new Map<string, {
    expiresAt: number;
    value: unknown;
}>();
function hasEducationEvidence(status: Record<string, any>): boolean {
    return Boolean(text(status.alasan_keluar) ||
        text(status.ke_lembaga) ||
        text(status.lembaga_lanjutan) ||
        text(status.nomor_surat_keterangan));
}
function educationState(status: Record<string, any>): "current" | "graduated" | "left" {
    return getStudentEducationState({
        status,
    });
}
function academicYearRange(year: unknown): { dari: string; sampai: string } | null {
    const match = /^(\d{4})\s*\/\s*(\d{4})$/.exec(text(year));
    if (!match)
        return null;
    const start = Number(match[1]);
    const end = Number(match[2]);
    if (!Number.isInteger(start) || end !== start + 1)
        return null;
    return {
        dari: `${start}-07-01`,
        sampai: `${end}-06-30`,
    };
}
function academicYearFromDate(value: unknown): string {
    const date = text(value).slice(0, 10);
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
    if (!match)
        return "";
    const year = Number(match[1]);
    const month = Number(match[2]);
    const start = month >= 7 ? year : year - 1;
    return `${start}/${start + 1}`;
}
function periodContext(query: ReportStudentQuery) {
    const explicitYear = text(query.tahun_ajaran);
    const yearRange = academicYearRange(explicitYear);
    const dari = text(query.dari).slice(0, 10) || yearRange?.dari || "";
    const sampai = text(query.sampai).slice(0, 10) || yearRange?.sampai || "";
    const year = explicitYear || academicYearFromDate(dari || sampai);
    return { year, dari, sampai };
}
export function contextualizeReportStudent(
    student: ReportStudent,
    query: Pick<ReportStudentQuery, "tahun_ajaran" | "dari" | "sampai"> = {}
): ReportStudent | null {
    const context = periodContext(query as ReportStudentQuery);
    if (!context.year && !context.dari && !context.sampai)
        return student;

    const currentState = student.current_education_state ?? student.education_state;
    const masuk = text(student.status?.tanggal_masuk).slice(0, 10);
    const keluar = text(student.status?.tanggal_keluar).slice(0, 10);
    const storedYear = text(student.last_tahun_ajaran) ||
        text(student.status?.tahun_pelajaran) ||
        text(student.tahun_ajaran);

    if (context.sampai && masuk && masuk > context.sampai)
        return null;
    if (context.dari && keluar && keluar < context.dari)
        return null;

    let state: ReportStudent["education_state"] = currentState;
    if (currentState !== "current") {
        if (keluar) {
            state = context.sampai && keluar > context.sampai ? "current" : currentState;
        } else if (context.year && storedYear) {
            const target = Number(context.year.split("/")[0]);
            const last = Number(storedYear.split("/")[0]);
            if (Number.isFinite(target) && Number.isFinite(last)) {
                if (target > last)
                    return null;
                state = target < last ? "current" : currentState;
            }
        }
    }

    const displayYear = context.year || student.tahun_ajaran || storedYear;
    return {
        ...student,
        education_state: state,
        current_education_state: currentState,
        tahun_ajaran: displayYear,
        last_tahun_ajaran: storedYear,
        status: {
            ...student.status,
            tahun_pelajaran: displayYear,
        },
    };
}
export function contextualizeReportStudents(
    students: ReportStudent[],
    query: Pick<ReportStudentQuery, "tahun_ajaran" | "dari" | "sampai"> = {}
): ReportStudent[] {
    return students
        .map((student) => contextualizeReportStudent(student, query))
        .filter((student): student is ReportStudent => Boolean(student));
}
async function mapWithConcurrency<T, R>(items: T[], worker: (item: T) => Promise<R>, limit = 4): Promise<R[]> {
    if (!items.length) {
        return [];
    }
    const results = new Array<R>(items.length);
    let cursor = 0;
    const run = async () => {
        while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= items.length) {
                return;
            }
            results[index] = await worker(items[index]);
        }
    };
    const size = Math.max(1, Math.min(limit, items.length));
    await Promise.all(Array.from({ length: size }, () => run()));
    return results;
}
async function loadReportClassrooms(fresh = false): Promise<any[]> {
    const now = Date.now();
    if (!fresh && classroomCache && classroomCache.expiresAt > now) {
        return classroomCache.rows;
    }
    if (!fresh && classroomPromise)
        return classroomPromise;
    classroomPromise = fetchAllClassrooms(100)
        .then((rows) => {
        classroomCache = {
            expiresAt: Date.now() + DIRECTORY_TTL,
            rows,
        };
        return rows;
    })
        .finally(() => {
        classroomPromise = null;
    });
    return classroomPromise;
}
export async function fetchReportClassrooms(fresh = false): Promise<any[]> {
    return loadReportClassrooms(fresh);
}
async function loadReportStudentDirectory(fresh = false): Promise<ReportStudent[]> {
    const now = Date.now();
    if (!fresh && directoryCache && directoryCache.expiresAt > now) {
        return directoryCache.rows;
    }
    if (!fresh && directoryPromise)
        return directoryPromise;
    directoryPromise = Promise.all([
        fetchStudents(),
        loadReportClassrooms(fresh),
        fetchStudentUsers(),
        fetchCurrentAcademicPeriod().catch(() => null),
    ])
        .then(async ([students, classrooms, studentUsers, activePeriod]) => {
        const detailCandidates = students.filter((student) => {
            const status = obj(student.status);
            return (status.status_aktif ===
                false &&
                !hasEducationEvidence(status) &&
                student.id !== null &&
                student.id !== undefined);
        });
        const details = await mapWithConcurrency(detailCandidates, async (student) => {
            try {
                return await fetchStudentById(student.id);
            }
            catch {
                return student;
            }
        }, 4);
        const detailsById = new Map(details.map((student) => [
            idKey(student.id),
            student,
        ]));
        const classroomById = new Map(classrooms
            .filter((classroom: any) => classroom?.id !== null && classroom?.id !== undefined)
            .map((classroom: any) => [idKey(classroom.id), classroom]));
        const placementById = new Map<string, {
            classroom_id: ReportStudentId | null;
            classroom_name: string;
            tahun_ajaran: string;
        }>();
        const placementByNisn = new Map<string, {
            classroom_id: ReportStudentId | null;
            classroom_name: string;
            tahun_ajaran: string;
        }>();
        const placementByNik = new Map<string, {
            classroom_id: ReportStudentId | null;
            classroom_name: string;
            tahun_ajaran: string;
        }>();
        const registerPlacement = (student: any, placement: {
            classroom_id: ReportStudentId | null;
            classroom_name: string;
            tahun_ajaran: string;
        }, overwrite = true) => {
            const id = idKey(student?.id ?? student?.student_id);
            const nisn = text(student?.nisn);
            const nik = text(student?.nik);
            if (id && (overwrite || !placementById.has(id))) {
                placementById.set(id, placement);
            }
            if (nisn && (overwrite || !placementByNisn.has(nisn))) {
                placementByNisn.set(nisn, placement);
            }
            if (nik && (overwrite || !placementByNik.has(nik))) {
                placementByNik.set(nik, placement);
            }
        };
        studentUsers.forEach((user) => {
            const classroom = user.classroom_id !== null && user.classroom_id !== undefined
                ? classroomById.get(idKey(user.classroom_id))
                : null;
            registerPlacement(user, {
                classroom_id: user.classroom_id ?? null,
                classroom_name: text(classroom?.nama_kelas) || text(user.nama_kelas),
                tahun_ajaran: text(classroom?.curriculum?.tahun_ajaran),
            });
        });
        classrooms.forEach((classroom: any) => {
            const current = {
                classroom_id: classroom?.id ?? null,
                classroom_name: text(classroom?.nama_kelas),
                tahun_ajaran: text(classroom?.curriculum?.tahun_ajaran),
            };
            (Array.isArray(classroom?.students) ? classroom.students : []).forEach((student: any) => {
                registerPlacement(student, current, false);
            });
        });
        const resolvePlacement = (student: any) => {
            const id = idKey(student?.id ?? student?.student_id);
            const nisn = text(student?.nisn);
            const nik = text(student?.nik);
            return placementById.get(id) ||
                (nisn ? placementByNisn.get(nisn) : undefined) ||
                (nik ? placementByNik.get(nik) : undefined) ||
                null;
        };
        const rows = students
            .map((raw): ReportStudent => {
            const rawValue = raw as any;
            const detail = detailsById.get(idKey(raw.id)) ?? raw;
            const detailValue = detail as any;
            const status = obj(detailValue.status ?? rawValue.status);
            const development = obj(detailValue.dev ??
                detailValue.development ??
                rawValue.dev ??
                rawValue.development);
            const matched = resolvePlacement(rawValue);
            const classroomId = matched?.classroom_id ??
                rawValue.classroom_id ??
                rawValue.classroom?.id ??
                null;
            const classroomName = text(matched?.classroom_name) ||
                text(rawValue.classroom?.nama_kelas) ||
                text(rawValue.classroom_name) ||
                text(rawValue.classroom_nama) ||
                text(rawValue.nama_kelas);
            const state = educationState(status);
            const storedYear = text(status.tahun_pelajaran) ||
                text(rawValue.tahun_ajaran) ||
                text(rawValue.tahun_pelajaran);
            const year = state === "current"
                ? text(activePeriod?.tahun_ajaran) || text(matched?.tahun_ajaran) || storedYear
                : storedYear || text(matched?.tahun_ajaran);
            return {
                id: rawValue.id ?? rawValue.student_id ?? "",
                nama_lengkap: text(rawValue.nama_lengkap ?? rawValue.student_nama),
                nomor_induk: text(rawValue.nomor_induk ?? rawValue.nis ?? rawValue.nisn),
                nisn: text(rawValue.nisn ?? rawValue.nomor_induk ?? rawValue.nis),
                classroom_id: classroomId,
                classroom_name: classroomName,
                jenis_kelamin: text(rawValue.jenis_kelamin),
                foto: text(rawValue.foto),
                berat_badan: numberOrNull(development.berat_badan),
                tinggi_badan: numberOrNull(development.tinggi_badan),
                education_state: state,
                current_education_state: state,
                tahun_ajaran: year,
                last_tahun_ajaran: storedYear,
                status: {
                    status_aktif: status.status_aktif !== false,
                    tanggal_masuk: text(status.tanggal_masuk).slice(0, 10),
                    tanggal_keluar: text(status.tanggal_keluar).slice(0, 10),
                    alasan_keluar: text(status.alasan_keluar),
                    kelompok_umur: text(status.kelompok_umur),
                    tahun_pelajaran: year,
                    nomor_surat_keterangan: text(status.nomor_surat_keterangan),
                    lembaga_lanjutan: text(status.lembaga_lanjutan),
                    tanggal_pindah: text(status.tanggal_pindah).slice(0, 10),
                    dari_kelompok_umur: text(status.dari_kelompok_umur),
                    ke_lembaga: text(status.ke_lembaga),
                    tingkat_kelompok_umur: text(status.tingkat_kelompok_umur),
                } as Student["status"],
            };
        })
            .filter((student) => Boolean(student.id))
            .sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap, "id", {
            sensitivity: "base",
            numeric: true,
        }));
        directoryCache = {
            expiresAt: Date.now() + DIRECTORY_TTL,
            rows,
        };
        return rows;
    })
        .finally(() => {
        directoryPromise = null;
    });
    return directoryPromise;
}
export function invalidateReportStudentDirectory(): void {
    directoryCache = null;
    directoryPromise = null;
    classroomCache = null;
    classroomPromise = null;
}
export function invalidateReportStudentCaches(): void {
    invalidateReportStudentDirectory();
    activityWeekCache.clear();
    communicationWeekCache.clear();
}
export async function fetchAllReportStudents(query: ReportStudentQuery = {}): Promise<ReportStudent[]> {
    const rows = await loadReportStudentDirectory(Boolean(query.fresh));
    if (query.signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
    }
    const q = text(query.q).toLocaleLowerCase("id");
    const classroom = query.classroom_id;
    const contextualRows = contextualizeReportStudents(rows, query);
    return contextualRows.filter((student) => {
        const classMatch = classroom === undefined ||
            classroom === null ||
            classroom === "all" ||
            idKey(student.classroom_id) === idKey(classroom);
        const searchMatch = !q ||
            [student.nama_lengkap, student.nomor_induk, student.nisn, student.classroom_name].some((value) => text(value).toLocaleLowerCase("id").includes(q));
        return classMatch && searchMatch;
    });
}
function queryUrl(path: string, params: Record<string, unknown>): string {
    const search = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined || value === null || value === "" || value === "all")
            return;
        search.set(key, String(value));
    });
    const query = search.toString();
    return query ? `${path}?${query}` : path;
}
export async function fetchAllStudentAttendanceReport(params: {
    dari: string;
    sampai: string;
    classroom_id?: ReportStudentId | "all" | null;
    q?: string;
    signal?: AbortSignal;
}) {
    const [students, raw] = await Promise.all([
        fetchAllReportStudents({
            classroom_id: params.classroom_id,
            dari: params.dari,
            sampai: params.sampai,
            signal: params.signal,
        }),
        apiGetJson<unknown>(queryUrl("/api/attendances/recap", {
            classroom_id: params.classroom_id === "all" ? undefined : params.classroom_id,
            dari: params.dari,
            sampai: params.sampai,
        }), { signal: params.signal }),
    ]);
    const rawMap = new Map<string, Record<string, any>>();
    list(raw).forEach((item) => {
        const row = obj(item);
        const id = row.student_id ?? row.student?.id;
        if (id !== undefined && id !== null)
            rawMap.set(idKey(id), row);
    });
    const items = students.map((student) => {
        const row = rawMap.get(idKey(student.id)) ?? {};
        const h = Number(row.hadir ?? 0) || 0;
        const s = Number(row.sakit ?? 0) || 0;
        const i = Number(row.izin ?? 0) || 0;
        const a = Number(row.alpa ?? 0) || 0;
        const total = Number(row.total ?? h + s + i + a) || h + s + i + a;
        const percentage = Number(row.persentase_kehadiran ?? (total ? (h / total) * 100 : 0)) || 0;
        return {
            ...student,
            classroom_id: row.classroom_id ?? student.classroom_id,
            classroom_name: text(row.classroom_nama) || student.classroom_name,
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
    });
    return {
        dari: text(params.dari).slice(0, 10),
        sampai: text(params.sampai).slice(0, 10),
        items,
        total_records: items.reduce((sum, item) => sum + item.stats.total, 0),
    };
}
export async function fetchAllDevelopmentAnalysis(params: {
    classroom_id?: ReportStudentId | "all" | null;
    q?: string;
    tahun_ajaran?: string;
    semester?: number | "all" | string;
    signal?: AbortSignal;
} = {}) {
    const semester = params.semester === "all" || params.semester === undefined
        ? undefined
        : Number(params.semester);
    const [students, raw] = await Promise.all([
        fetchAllReportStudents({
            classroom_id: params.classroom_id,
            q: params.q,
            tahun_ajaran: params.tahun_ajaran === "all" ? undefined : params.tahun_ajaran,
            signal: params.signal,
        }),
        apiGetJson<unknown>(queryUrl("/api/student-developments", {
            classroom_id: params.classroom_id === "all" ? undefined : params.classroom_id,
            tahun_ajaran: params.tahun_ajaran === "all" ? undefined : params.tahun_ajaran,
            semester: semester === 1 || semester === 2 ? semester : undefined,
            q: text(params.q),
        }), { signal: params.signal }),
    ]);
    const developments = list(raw).map((item) => {
        const row = obj(item);
        return {
            student_id: row.student_id ?? "",
            tahun_ajaran: text(row.tahun_ajaran),
            semester: Number(row.semester) === 2 ? 2 : 1,
            tinggi_badan: numberOrNull(row.tinggi_badan),
            berat_badan: numberOrNull(row.berat_badan),
            bmi: numberOrNull(row.bmi),
            status_gizi: text(row.status_gizi),
            lingkar_kepala: numberOrNull(row.lingkar_kepala),
            catatan: text(row.catatan),
            tanggal_pemeriksaan: text(row.tanggal_pemeriksaan).slice(0, 10),
            student_name: text(row.student_nama),
            student_nisn: text(row.nisn),
            classroom_id: row.classroom_id ?? null,
            classroom_name: text(row.classroom_nama),
        };
    });
    const order = (year: string, sem: number) => {
        const start = Number(text(year).split("/")[0]);
        return (Number.isFinite(start) ? start : 0) * 10 + sem;
    };
    const byStudent = new Map<string, any[]>();
    developments.forEach((item) => {
        const current = byStudent.get(idKey(item.student_id)) ?? [];
        current.push(item);
        byStudent.set(idKey(item.student_id), current);
    });
    const analysisStudents = students.map((student) => {
        const rows = (byStudent.get(idKey(student.id)) ?? []).sort((a, b) => order(a.tahun_ajaran, a.semester) -
            order(b.tahun_ajaran, b.semester));
        const first = rows[0] ?? null;
        const latest = rows[rows.length - 1] ?? null;
        return {
            ...student,
            developments: rows,
            first,
            latest,
            delta_tinggi: first?.tinggi_badan !== null &&
                first?.tinggi_badan !== undefined &&
                latest?.tinggi_badan !== null &&
                latest?.tinggi_badan !== undefined
                ? Number((latest.tinggi_badan - first.tinggi_badan).toFixed(1))
                : null,
            delta_berat: first?.berat_badan !== null &&
                first?.berat_badan !== undefined &&
                latest?.berat_badan !== null &&
                latest?.berat_badan !== undefined
                ? Number((latest.berat_badan - first.berat_badan).toFixed(1))
                : null,
        };
    });
    const average = (values: Array<number | null | undefined>) => {
        const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
        return valid.length
            ? Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1))
            : null;
    };
    const periodMap = new Map<string, any>();
    developments.forEach((item) => {
        periodMap.set(`${item.tahun_ajaran}_${item.semester}`, {
            tahun_ajaran: item.tahun_ajaran,
            semester: item.semester,
            label: `${item.tahun_ajaran} · Semester ${item.semester === 1 ? "I" : "II"}`,
        });
    });
    const periods = [...periodMap.values()].sort((a, b) => order(a.tahun_ajaran, a.semester) -
        order(b.tahun_ajaran, b.semester));
    const trend = periods.map((period) => {
        const points = developments.filter((item) => item.tahun_ajaran === period.tahun_ajaran &&
            item.semester === period.semester);
        return {
            ...period,
            average_height: average(points.map((item) => item.tinggi_badan)),
            average_weight: average(points.map((item) => item.berat_badan)),
            student_count: new Set(points.map((item) => idKey(item.student_id))).size,
        };
    });
    const distribution = new Map<string, number>();
    analysisStudents.forEach((student) => {
        const status = text(student.latest?.status_gizi) || "Belum tersedia";
        distribution.set(status, (distribution.get(status) ?? 0) + 1);
    });
    return {
        periods,
        students: analysisStudents,
        summary: {
            total_students: analysisStudents.length,
            students_with_data: analysisStudents.filter((student) => student.developments.length > 0).length,
            latest_avg_height: average(analysisStudents.map((student) => student.latest?.tinggi_badan)),
            latest_avg_weight: average(analysisStudents.map((student) => student.latest?.berat_badan)),
            avg_height_change: average(analysisStudents.map((student) => student.delta_tinggi)),
            avg_weight_change: average(analysisStudents.map((student) => student.delta_berat)),
            status_distribution: [...distribution.entries()]
                .map(([status, count]) => ({ status, count }))
                .sort((a, b) => b.count - a.count),
            trend,
        },
    };
}
export interface ReportOverviewItem {
    student_id: ReportStudentId;
    student_nama: string;
    nomor_induk: string;
    nisn: string;
    foto: string;
    classroom_id: ReportStudentId | null;
    classroom_nama: string;
    curriculum_id: ReportStudentId | null;
    curriculum_nama: string;
    tahun_ajaran: string;
    semester: number;
    status_rapor: string;
    jumlah_indikator_terisi: number;
    total_indikator: number;
    catatan: string;
    komentar_ortu: string;
    updated_at: string;
}
export interface ReportTableRow {
    student: ReportStudent;
    classroom: {
        id: ReportStudentId | null;
        nama_kelas: string;
        curriculum: null;
        wali_kelas: null;
    } | null;
    report: {
        status_rapor: string;
        jumlah_indikator_terisi: number;
        total_indikator: number;
        catatan: string;
        komentar_ortu: string;
        updated_at: string;
    } | null;
    progress: {
        student_id: ReportStudentId;
        tahun_ajaran: string;
        semester: number;
        backend_status: string;
        filled_count: number;
        total_count: number;
        has_catatan: boolean;
        has_komentar_ortu: boolean;
    };
    support: {
        has_development: boolean;
        has_attendance: boolean;
        attendance_days: number;
    };
}
function reportSemesterBounds(year: string, semester: number) {
    const start = Number(text(year).split("/")[0]);
    if (!Number.isFinite(start)) {
        return { dari: "", sampai: "" };
    }
    if (Number(semester) === 2) {
        return {
            dari: `${start + 1}-01-01`,
            sampai: `${start + 1}-06-30`,
        };
    }
    return {
        dari: `${start}-07-01`,
        sampai: `${start}-12-31`,
    };
}
function normalizeReportOverview(raw: unknown): ReportOverviewItem {
    const row = obj(raw);
    return {
        student_id: row.student_id ?? "",
        student_nama: text(row.student_nama),
        nomor_induk: text(row.nomor_induk ?? row.nis ?? row.nisn),
        nisn: text(row.nisn ?? row.nomor_induk ?? row.nis),
        foto: text(row.foto),
        classroom_id: row.classroom_id ?? null,
        classroom_nama: text(row.classroom_nama),
        curriculum_id: row.curriculum_id ?? null,
        curriculum_nama: text(row.curriculum_nama),
        tahun_ajaran: text(row.tahun_ajaran),
        semester: Number(row.semester) === 2 ? 2 : 1,
        status_rapor: text(row.status_rapor),
        jumlah_indikator_terisi: Number(row.jumlah_indikator_terisi ?? 0) || 0,
        total_indikator: Number(row.total_indikator ?? 0) || 0,
        catatan: text(row.catatan),
        komentar_ortu: text(row.komentar_ortu),
        updated_at: text(row.updated_at),
    };
}
export async function fetchReportOverview(params: {
    tahun_ajaran: string;
    semester: number;
    signal?: AbortSignal;
}): Promise<ReportOverviewItem[]> {
    const raw = await apiGetJson<unknown>(queryUrl("/api/reports", {
        tahun_ajaran: text(params.tahun_ajaran),
        semester: Number(params.semester) === 2 ? 2 : 1,
    }), { signal: params.signal });
    return list(raw).map(normalizeReportOverview);
}
export async function fetchAllReportTableRows(params: {
    tahun_ajaran: string;
    semester: number;
    signal?: AbortSignal;
}): Promise<ReportTableRow[]> {
    const semester = Number(params.semester) === 2 ? 2 : 1;
    const [students, reportRaw] = await Promise.all([
        fetchAllReportStudents({
            tahun_ajaran: params.tahun_ajaran,
            signal: params.signal,
        }),
        apiGetJson<unknown>(queryUrl("/api/reports", {
            tahun_ajaran: text(params.tahun_ajaran),
            semester,
        }), { signal: params.signal }),
    ]);
    const reportMap = new Map(list(reportRaw)
        .map(normalizeReportOverview)
        .map((row) => [idKey(row.student_id), row]));
    return students.map((baseStudent) => {
        const overview = reportMap.get(idKey(baseStudent.id)) ?? null;
        const student: ReportStudent = {
            ...baseStudent,
            nama_lengkap: text(overview?.student_nama) || baseStudent.nama_lengkap,
            nisn: text(overview?.nisn) || baseStudent.nisn,
            nomor_induk: baseStudent.nomor_induk || text(overview?.nomor_induk) || text(overview?.nisn),
            foto: text(overview?.foto) || baseStudent.foto,
            classroom_id: overview?.classroom_id ?? baseStudent.classroom_id,
            classroom_name: text(overview?.classroom_nama) || baseStudent.classroom_name,
        };
        return {
            student,
            classroom: student.classroom_id !== null || student.classroom_name
                ? {
                    id: student.classroom_id,
                    nama_kelas: student.classroom_name,
                    curriculum: null,
                    wali_kelas: null,
                }
                : null,
            report: overview
                ? {
                    status_rapor: overview.status_rapor,
                    jumlah_indikator_terisi: overview.jumlah_indikator_terisi,
                    total_indikator: overview.total_indikator,
                    catatan: overview.catatan,
                    komentar_ortu: overview.komentar_ortu,
                    updated_at: overview.updated_at,
                }
                : null,
            progress: {
                student_id: student.id,
                tahun_ajaran: text(params.tahun_ajaran),
                semester,
                backend_status: overview?.status_rapor || "Belum diisi",
                filled_count: overview?.jumlah_indikator_terisi ?? 0,
                total_count: overview?.total_indikator ?? 0,
                has_catatan: Boolean(text(overview?.catatan)),
                has_komentar_ortu: Boolean(text(overview?.komentar_ortu)),
            },
            support: {
                has_development: false,
                has_attendance: false,
                attendance_days: 0,
            },
        };
    });
}
function reportScale(value: unknown) {
    const scale = text(value).toUpperCase();
    return ["BB", "MB", "BSH", "BSB"].includes(scale) ? scale : null;
}
function collectPrintReportScores(value: unknown, output: Array<{
    indicator_id: ReportStudentId;
    scale: string;
}> = []) {
    if (Array.isArray(value)) {
        value.forEach((item) => collectPrintReportScores(item, output));
        return output;
    }
    const row = obj(value);
    if (!Object.keys(row).length)
        return output;
    const nested = obj(row.indicator ??
        row.indikator_detail ??
        row.indicator_detail);
    const scale = reportScale(row.scale ??
        row.skala ??
        row.nilai ??
        row.skor ??
        row.nilai_rapor ??
        row.status_nilai ??
        row.capaian ??
        row.hasil);
    const indicatorId = row.indicator_id ??
        row.indikator_id ??
        row.id_indikator ??
        nested.id ??
        nested.indicator_id ??
        nested.indikator_id ??
        (scale ? row.id : null);
    if (indicatorId !== undefined &&
        indicatorId !== null &&
        scale) {
        const key = idKey(indicatorId);
        const index = output.findIndex((item) => idKey(item.indicator_id) === key);
        const next = { indicator_id: indicatorId, scale };
        if (index >= 0)
            output[index] = next;
        else
            output.push(next);
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
        if (row[key] !== undefined) {
            collectPrintReportScores(row[key], output);
        }
    });
    return output;
}

function scalarText(value: unknown): string {
    return typeof value === "string" || typeof value === "number"
        ? text(value)
        : "";
}
function collectPrintReportIndicators(value: unknown, context: {
    aspek?: string;
    sub_aspek?: string;
} = {}, output: Array<{
    id: ReportStudentId;
    kode: string;
    aspek: string;
    sub_aspek: string;
    deskripsi: string;
}> = []) {
    if (Array.isArray(value)) {
        value.forEach((item) => collectPrintReportIndicators(item, context, output));
        return output;
    }
    const row = obj(value);
    if (!Object.keys(row).length)
        return output;
    const nested = obj(row.indicator ?? row.indikator_detail ?? row.indicator_detail);
    const aspectName = scalarText(row.nama_aspek ?? row.aspek_nama ?? row.aspect_name ?? row.aspect) ||
        (typeof row.aspek === "string" ? text(row.aspek) : "") ||
        context.aspek ||
        "";
    const subAspectName = scalarText(row.nama_sub_aspek ?? row.sub_aspek_nama ?? row.subaspect_name ?? row.sub_aspect_name) ||
        (typeof row.sub_aspek === "string" ? text(row.sub_aspek) : "") ||
        (typeof row.subaspect === "string" ? text(row.subaspect) : "") ||
        context.sub_aspek ||
        "";
    const description = text(row.deskripsi ?? row.indicator_deskripsi ?? row.indikator_deskripsi ?? row.nama_indikator ?? nested.deskripsi ?? nested.nama_indikator ?? nested.nama);
    const code = text(row.kode ?? row.kode_indikator ?? row.indicator_kode ?? nested.kode ?? nested.kode_indikator);
    const scale = reportScale(row.scale ?? row.skala ?? row.nilai ?? row.skor ?? row.nilai_rapor ?? row.status_nilai ?? row.capaian ?? row.hasil);
    const indicatorId = row.indicator_id ??
        row.indikator_id ??
        row.id_indikator ??
        nested.id ??
        nested.indicator_id ??
        nested.indikator_id ??
        (description && scale ? row.id : null);
    if (indicatorId !== undefined && indicatorId !== null && description) {
        const key = idKey(indicatorId);
        const next = {
            id: indicatorId,
            kode: code,
            aspek: aspectName,
            sub_aspek: subAspectName,
            deskripsi: description,
        };
        const index = output.findIndex((item) => idKey(item.id) === key);
        if (index >= 0)
            output[index] = { ...output[index], ...next };
        else
            output.push(next);
    }
    const nextContext = {
        aspek: aspectName || context.aspek || "",
        sub_aspek: subAspectName || context.sub_aspek || "",
    };
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
        const child = row[key];
        if (child !== undefined && (Array.isArray(child) || typeof child === "object")) {
            collectPrintReportIndicators(child, nextContext, output);
        }
    });
    return output;
}

function unwrapReport(raw: unknown) {
    let current = obj(raw);
    for (let depth = 0; depth < 4; depth += 1) {
        const candidates = [
            current.data,
            current.result,
            current.report,
            current.detail,
        ]
            .map(obj)
            .filter((candidate) => Object.keys(candidate).length > 0);
        if (!candidates.length)
            break;
        current = candidates[0];
    }
    return current;
}
export async function fetchReportDetailForPrint(params: {
    student_id: ReportStudentId;
    tahun_ajaran: string;
    semester: number;
    signal?: AbortSignal;
}) {
    const semester = Number(params.semester) === 2 ? 2 : 1;
    const raw = await apiGetJson<unknown>(queryUrl("/api/reports/student", {
        student_id: params.student_id,
        tahun_ajaran: text(params.tahun_ajaran),
        semester,
    }), { signal: params.signal });
    const root = unwrapReport(raw);
    const attendance = obj(root.kehadiran ?? root.absensi);
    const physical = obj(root.fisik);
    const reportTree = root.aspek_penilaian ?? root.scores ?? [];
    return {
        student_id: root.student_id ?? params.student_id,
        student_nama: text(root.student_nama ?? root.nama_siswa ?? root.nama_lengkap),
        nisn: text(root.nisn ?? root.nomor_induk),
        foto: text(root.foto),
        classroom_id: root.classroom_id ?? root.kelas_id ?? null,
        classroom_nama: text(root.classroom_nama ?? root.nama_kelas),
        curriculum_id: root.curriculum_id ?? root.kurikulum_id ?? null,
        curriculum_nama: text(root.curriculum_nama ?? root.nama_kurikulum),
        tahun_ajaran: text(root.tahun_ajaran) || text(params.tahun_ajaran),
        semester: Number(root.semester) === 2 ? 2 : semester,
        status_rapor: text(root.status_rapor ?? root.report_status),
        jumlah_indikator_terisi: Number(root.jumlah_indikator_terisi ?? 0) || 0,
        total_indikator: Number(root.total_indikator ?? 0) || 0,
        scores: collectPrintReportScores(reportTree),
        indicators: collectPrintReportIndicators(reportTree),
        catatan: text(root.catatan),
        fisik: {
            berat_badan: numberOrNull(physical.berat_badan),
            tinggi_badan: numberOrNull(physical.tinggi_badan),
            bmi: numberOrNull(physical.bmi),
            status_gizi: text(physical.status_gizi),
            lingkar_kepala: numberOrNull(physical.lingkar_kepala),
        },
        absensi: {
            hadir: Number(attendance.hadir ?? 0) || 0,
            sakit: Number(attendance.sakit ?? 0) || 0,
            izin: Number(attendance.izin ?? 0) || 0,
            alpa: Number(attendance.alpa ?? 0) || 0,
            total: Number(attendance.total ?? 0) ||
                (Number(attendance.hadir ?? 0) || 0) +
                    (Number(attendance.sakit ?? 0) || 0) +
                    (Number(attendance.izin ?? 0) || 0) +
                    (Number(attendance.alpa ?? 0) || 0),
        },
        komentar_ortu: text(root.komentar_ortu),
        report_status: "DRAFT",
        created_at: text(root.created_at),
        created_by: text(root.created_by),
        updated_at: text(root.updated_at),
        updated_by: text(root.updated_by),
        finalized_at: "",
        finalized_by: "",
        history: [],
    };
}
function averageDevelopment(values: Array<number | null | undefined>) {
    const valid = values.filter((value): value is number => typeof value === "number" && Number.isFinite(value));
    return valid.length
        ? Number((valid.reduce((sum, value) => sum + value, 0) / valid.length).toFixed(1))
        : null;
}
function developmentOrder(year: string, semester: number) {
    const start = Number(text(year).split("/")[0]);
    return (Number.isFinite(start) ? start : 0) * 10 + semester;
}
export function summarizeDevelopmentStudents(students: any[], periods: any[] = []) {
    const distribution = new Map<string, number>();
    students.forEach((student) => {
        const status = text(student.latest?.status_gizi) || "Belum tersedia";
        distribution.set(status, (distribution.get(status) ?? 0) + 1);
    });
    const sourcePeriods = periods.length > 0
        ? periods
        : [
            ...new Map(students
                .flatMap((student) => student.developments ?? [])
                .map((item) => [
                `${item.tahun_ajaran}_${item.semester}`,
                {
                    tahun_ajaran: item.tahun_ajaran,
                    semester: item.semester,
                    label: `${item.tahun_ajaran} · Semester ${item.semester === 1 ? "I" : "II"}`,
                },
            ])).values(),
        ].sort((a, b) => developmentOrder(a.tahun_ajaran, a.semester) -
            developmentOrder(b.tahun_ajaran, b.semester));
    const trend = sourcePeriods.map((period) => {
        const points = students.flatMap((student) => (student.developments ?? []).filter((item) => item.tahun_ajaran === period.tahun_ajaran &&
            item.semester === period.semester));
        return {
            ...period,
            average_height: averageDevelopment(points.map((item) => item.tinggi_badan)),
            average_weight: averageDevelopment(points.map((item) => item.berat_badan)),
            student_count: new Set(points.map((item) => idKey(item.student_id))).size,
        };
    });
    return {
        total_students: students.length,
        students_with_data: students.filter((student) => (student.developments ?? []).length > 0).length,
        latest_avg_height: averageDevelopment(students.map((student) => student.latest?.tinggi_badan)),
        latest_avg_weight: averageDevelopment(students.map((student) => student.latest?.berat_badan)),
        avg_height_change: averageDevelopment(students.map((student) => student.delta_tinggi)),
        avg_weight_change: averageDevelopment(students.map((student) => student.delta_berat)),
        status_distribution: [...distribution.entries()]
            .map(([status, count]) => ({ status, count }))
            .sort((a, b) => b.count - a.count),
        trend,
    };
}
export function filterDevelopmentAnalysis(analysis: any, q: string, educationState: string = "all") {
    const keyword = text(q).toLocaleLowerCase("id");
    const students = (Array.isArray(analysis?.students)
        ? analysis.students
        : []).filter((student) => {
        const searchMatch = !keyword || [student.nama_lengkap, student.nomor_induk, student.nisn, student.classroom_name]
            .some((value) => text(value).toLocaleLowerCase("id").includes(keyword));
        const educationMatch = !educationState || educationState === "all" || student.education_state === educationState;
        return searchMatch && educationMatch;
    });
    if (!keyword && (!educationState || educationState === "all"))
        return analysis;
    return {
        ...analysis,
        students,
        summary: summarizeDevelopmentStudents(students, Array.isArray(analysis?.periods) ? analysis.periods : []),
    };
}
export function mergeCommunicationReportStudents(result: any, students: ReportStudent[]) {
    const map = new Map<string, any>((Array.isArray(result?.items) ? result.items : []).map((item: any) => [
        idKey(item.id),
        item,
    ]));
    const items = students.map((student) => {
        const existing = map.get(idKey(student.id));
        if (existing) {
            return {
                ...student,
                ...existing,
                nomor_induk: student.nomor_induk || text(existing.nomor_induk) || text(existing.nis) || text(existing.nisn),
                nisn: student.nisn || text(existing.nisn) || text(existing.nomor_induk) || text(existing.nis),
                classroom_id: existing.classroom_id ?? student.classroom_id,
                classroom_name: text(existing.classroom_name) || text(existing.classroom_nama) || student.classroom_name,
                education_state: student.education_state,
                tahun_ajaran: student.tahun_ajaran,
                status: student.status,
            };
        }
        return {
            ...student,
            books: [],
            stats: {
                weeks: 0,
                filled_days: 0,
                parent_notes: 0,
                teacher_notes: 0,
                data_points: 0,
                last_activity: "",
            },
        };
    });
    return {
        ...result,
        items,
        total_books: items.reduce((sum: number, item: any) => sum + Number(item.stats?.weeks ?? 0), 0),
        total_days: items.reduce((sum: number, item: any) => sum + Number(item.stats?.filled_days ?? 0), 0),
    };
}
const addDays = (value: string, amount: number): string => {
    const date = new Date(`${text(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime()))
        return "";
    date.setDate(date.getDate() + amount);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};
const activityDayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
function localDateString(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
function mondayOfActivityInput(value: unknown): string {
    const raw = text(value);
    const weekMatch = /^(\d{4})-W(\d{2})$/.exec(raw);
    if (weekMatch) {
        const year = Number(weekMatch[1]);
        const week = Number(weekMatch[2]);
        const januaryFourth = new Date(year, 0, 4);
        const day = januaryFourth.getDay() || 7;
        const monday = new Date(januaryFourth);
        monday.setDate(januaryFourth.getDate() - day + 1 + (week - 1) * 7);
        return localDateString(monday);
    }
    const dateOnlyValue = raw.slice(0, 10);
    const date = new Date(`${dateOnlyValue}T00:00:00`);
    if (Number.isNaN(date.getTime()))
        return "";
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return localDateString(date);
}
function activityPlan(raw: unknown, weekStart: string) {
    const root = obj(raw);
    const plan = obj(root.rencana_mingguan ?? root.plan);
    return {
        schedule_id: root.schedule_id ?? plan.schedule_id ?? null,
        journal_id: plan.id ?? plan.journal_id ?? null,
        week_start: weekStart,
        tema: text(plan.tema),
        pilar_karakter: text(plan.pilar_karakter),
        nilai_karakter: text(plan.nilai_karakter),
        jurnal: text(plan.isi_jurnal ?? plan.jurnal),
        aktivitas: text(plan.aktivitas),
        pembiasaan: text(plan.pembiasaan),
        has_schedule: Boolean(root.schedule_id ??
            plan.schedule_id ??
            plan.id ??
            plan.journal_id),
    };
}
function activityCompletionStatus(value: unknown) {
    const normalized = text(value).toLocaleLowerCase("id").replace(/\s+/g, " ");
    if (normalized === "dilakukan")
        return "Dilakukan";
    if (normalized === "tidak dilakukan" || normalized === "tidak_dilakukan")
        return "Tidak Dilakukan";
    return "";
}
const DAILY_ACTIVITY_META_PREFIX_V4 = "__SS_DAILY_V4__:";
const DAILY_ACTIVITY_META_PREFIX_V3 = "__SS_DAILY_V3__:";
const DAILY_ACTIVITY_META_PREFIX_V2 = "__SS_DAILY_V2__:";
const DAILY_ACTIVITY_CLIENT_META_KEY = "ssphere:daily-activity-client-meta:v1";
function activityClientMetaRows(): any[] {
    if (typeof window === "undefined" || !window.localStorage)
        return [];
    try {
        const parsed = JSON.parse(window.localStorage.getItem(DAILY_ACTIVITY_CLIENT_META_KEY) || "[]");
        if (!Array.isArray(parsed))
            return [];
        return parsed.map((value) => {
            const classroomId = value?.classroom_id ?? null;
            const studentId = value?.student_id ?? null;
            const tanggal = text(value?.tanggal).slice(0, 10);
            if (classroomId === null || studentId === null || !tanggal)
                return null;
            const rawPlan = obj(value?.daily_plan);
            const dailyPlan = value?.daily_plan !== undefined
                ? {
                    schedule_id: rawPlan.schedule_id ?? null,
                    journal_id: rawPlan.journal_id ?? null,
                    week_start: text(rawPlan.week_start).slice(0, 10),
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
                jurnal_status: activityCompletionStatus(value?.jurnal_status),
                pilar_karakter_status: activityCompletionStatus(value?.pilar_karakter_status ?? value?.nilai_karakter_status),
                aktivitas_status: activityCompletionStatus(value?.aktivitas_status),
                pembiasaan_status: activityCompletionStatus(value?.pembiasaan_status),
                daily_plan: dailyPlan,
            };
        }).filter(Boolean);
    }
    catch {
        return [];
    }
}
function activityStoredMeta(value: unknown) {
    const raw = String(value ?? "");
    const prefix = raw.startsWith(DAILY_ACTIVITY_META_PREFIX_V4)
        ? DAILY_ACTIVITY_META_PREFIX_V4
        : raw.startsWith(DAILY_ACTIVITY_META_PREFIX_V3)
            ? DAILY_ACTIVITY_META_PREFIX_V3
            : raw.startsWith(DAILY_ACTIVITY_META_PREFIX_V2)
                ? DAILY_ACTIVITY_META_PREFIX_V2
                : "";
    if (!prefix)
        return null;
    try {
        const parsed = JSON.parse(raw.slice(prefix.length));
        const partisipasi = obj(parsed?.partisipasi);
        const rawDailyPlan = obj(parsed?.daily_plan);
        const hasDailyPlan = Object.keys(rawDailyPlan).length > 0 || parsed?.daily_plan !== undefined;
        return {
            jurnal_status: activityCompletionStatus(partisipasi.jurnal),
            pilar_karakter_status: activityCompletionStatus(partisipasi.pilar_karakter),
            aktivitas_status: activityCompletionStatus(partisipasi.aktivitas),
            pembiasaan_status: activityCompletionStatus(partisipasi.pembiasaan),
            catatan_guru: text(parsed?.catatan_guru),
            daily_plan: hasDailyPlan
                ? {
                    schedule_id: rawDailyPlan.schedule_id ?? null,
                    journal_id: rawDailyPlan.journal_id ?? null,
                    week_start: text(rawDailyPlan.week_start).slice(0, 10),
                    tema: text(rawDailyPlan.tema),
                    pilar_karakter: text(rawDailyPlan.pilar_karakter),
                    nilai_karakter: text(rawDailyPlan.nilai_karakter),
                    jurnal: text(rawDailyPlan.jurnal ?? rawDailyPlan.isi_jurnal),
                    aktivitas: text(rawDailyPlan.aktivitas),
                    pembiasaan: text(rawDailyPlan.pembiasaan),
                    has_schedule: Boolean(rawDailyPlan.has_schedule ?? rawDailyPlan.schedule_id ?? rawDailyPlan.journal_id),
                }
                : undefined,
        };
    }
    catch {
        return null;
    }
}
function activityRows(raw: unknown) {
    const root = obj(raw);
    const rootClassroomId = root.classroom_id ?? root.kelas_id ?? null;
    const clientMetaRows = activityClientMetaRows();
    const clientMetaMap = new Map(clientMetaRows.map((row) => [
        `${idKey(row.classroom_id)}|${idKey(row.student_id)}|${row.tanggal}`,
        row,
    ]));
    const rootClassroomName = text(root.classroom_nama ?? root.nama_kelas);
    const source = [
        ...list(root.students_activities),
        ...list(root.items),
        ...list(root.activities),
    ];
    const map = new Map<string, any>();
    source.forEach((item) => {
        const row = obj(item);
        const student = obj(row.student);
        const studentId = row.student_id ??
            row.siswa_id ??
            student.id ??
            null;
        const tanggal = text(row.tanggal ?? row.date).slice(0, 10);
        if (studentId === null || !tanggal)
            return;
        const meta = activityStoredMeta(row.catatan_guru);
        const rowClassroomId = row.classroom_id ?? row.kelas_id ?? rootClassroomId;
        const clientMeta = clientMetaMap.get(`${idKey(rowClassroomId)}|${idKey(studentId)}|${tanggal}`);
        const legacyPilar = activityCompletionStatus(row.makanan);
        const legacyJurnal = activityCompletionStatus(row.perasaan);
        const legacyAktivitas = activityCompletionStatus(row.barang_bawaan);
        const legacyPembiasaan = activityCompletionStatus(row.catatan_guru);
        const pilarStatus = clientMeta?.pilar_karakter_status ?? meta?.pilar_karakter_status ?? legacyPilar;
        map.set(`${idKey(studentId)}|${tanggal}`, {
            student_id: studentId,
            tanggal,
            nilai_karakter_status: pilarStatus,
            pilar_karakter_status: pilarStatus,
            jurnal_status: clientMeta?.jurnal_status ?? meta?.jurnal_status ?? legacyJurnal,
            aktivitas_status: clientMeta?.aktivitas_status ?? meta?.aktivitas_status ?? legacyAktivitas,
            pembiasaan_status: clientMeta?.pembiasaan_status ?? meta?.pembiasaan_status ?? legacyPembiasaan,
            makanan: meta ? text(row.makanan) : (legacyPilar ? "" : text(row.makanan)),
            perasaan: meta ? text(row.perasaan) : (legacyJurnal ? "" : text(row.perasaan)),
            barang_bawaan: meta ? text(row.barang_bawaan) : (legacyAktivitas ? "" : text(row.barang_bawaan)),
            catatan_guru: meta?.catatan_guru ?? (legacyPembiasaan ? "" : text(row.catatan_guru)),
            daily_plan: clientMeta?.daily_plan ?? meta?.daily_plan,
            classroom_id: rowClassroomId,
            classroom_name: text(row.classroom_nama ?? row.nama_kelas) ||
                rootClassroomName,
            student_name: text(row.student_nama ??
                row.nama_siswa ??
                student.nama_lengkap),
            student_nisn: text(row.nisn ?? student.nisn),
            student_gender: text(row.jenis_kelamin ?? student.jenis_kelamin),
        });
    });
    clientMetaRows
        .filter((row) => idKey(row.classroom_id) === idKey(rootClassroomId))
        .forEach((row) => {
        const key = `${idKey(row.student_id)}|${row.tanggal}`;
        if (map.has(key))
            return;
        map.set(key, {
            student_id: row.student_id,
            tanggal: row.tanggal,
            nilai_karakter_status: row.pilar_karakter_status,
            pilar_karakter_status: row.pilar_karakter_status,
            jurnal_status: row.jurnal_status,
            aktivitas_status: row.aktivitas_status,
            pembiasaan_status: row.pembiasaan_status,
            makanan: "",
            perasaan: "",
            barang_bawaan: "",
            catatan_guru: "",
            daily_plan: row.daily_plan,
            classroom_id: row.classroom_id,
            classroom_name: rootClassroomName,
            student_name: "",
            student_nisn: "",
            student_gender: "",
        });
    });
    return [...map.values()];
}
function activityHolidayMap(raw: unknown) {
    const root = obj(raw);
    const map = new Map<string, boolean>();
    list(root.days).forEach((item) => {
        const row = obj(item);
        const tanggal = text(row.tanggal).slice(0, 10);
        if (tanggal) {
            map.set(tanggal, Boolean(row.is_holiday));
        }
    });
    return map;
}
function hasActivityValue(row: any): boolean {
    return Boolean(row &&
        [
            row.nilai_karakter_status,
            row.pilar_karakter_status,
            row.jurnal_status,
            row.aktivitas_status,
            row.pembiasaan_status,
            row.makanan,
            row.perasaan,
            row.barang_bawaan,
            row.catatan_guru,
        ]
            .map(text)
            .some(Boolean));
}
async function mapActivityConcurrency<T, R>(items: T[], limit: number, mapper: (item: T, index: number) => Promise<R>): Promise<R[]> {
    const output = new Array<R>(items.length);
    let cursor = 0;
    const workers = Array.from({
        length: Math.min(Math.max(1, limit), Math.max(1, items.length)),
    }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            output[index] = await mapper(items[index], index);
        }
    });
    await Promise.all(workers);
    return output;
}
async function fetchActivityWeekRaw(classroomId: ReportStudentId, weekStart: string, signal?: AbortSignal) {
    const cacheKey = `${idKey(classroomId)}|${weekStart}`;
    const cached = activityWeekCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }
    const raw = await apiGetJson<unknown>(queryUrl("/api/daily-activities/week", {
        classroom_id: classroomId,
        week_start_date: weekStart,
    }), signal ? { signal } : undefined);
    activityWeekCache.set(cacheKey, {
        expiresAt: Date.now() + ACTIVITY_TTL,
        value: raw,
    });
    return raw;
}
function emptyActivityPlan(weekStart: string) {
    return {
        schedule_id: null,
        journal_id: null,
        week_start: weekStart,
        tema: "",
        pilar_karakter: "",
        nilai_karakter: "",
        jurnal: "",
        aktivitas: "",
        pembiasaan: "",
        has_schedule: false,
    };
}
function classContext(classroom: any, raw: unknown, weekStart: string) {
    const root = obj(raw);
    const classroomId = root.classroom_id ?? classroom?.id ?? null;
    const classroomName = text(root.classroom_nama) ||
        text(classroom?.nama_kelas);
    const rows = activityRows(raw);
    return {
        classroom_id: classroomId,
        classroom_name: classroomName,
        week_start: weekStart,
        plan: activityPlan(raw, weekStart),
        holidayMap: activityHolidayMap(raw),
        rows,
        rowMap: new Map(rows.map((row) => [
            `${idKey(row.student_id)}|${row.tanggal}`,
            row,
        ])),
    };
}
function activityStudentBase(student: ReportStudent, fallback?: any) {
    return {
        ...student,
        id: student.id,
        nama_lengkap: student.nama_lengkap ||
            text(fallback?.student_name) ||
            `Siswa #${student.id}`,
        nomor_induk: student.nomor_induk ||
            student.nisn ||
            text(fallback?.student_nisn),
        nisn: student.nisn ||
            student.nomor_induk ||
            text(fallback?.student_nisn),
        classroom_id: student.classroom_id ??
            fallback?.classroom_id ??
            null,
        classroom_name: student.classroom_name ||
            text(fallback?.classroom_name),
        jenis_kelamin: student.jenis_kelamin ||
            text(fallback?.student_gender),
    };
}
export async function fetchWeeklyStudentActivityReportFast(params: {
    week: string;
    classroom_id?: ReportStudentId | "all" | null;
    signal?: AbortSignal;
}) {
    const weekStart = mondayOfActivityInput(params.week);
    if (!weekStart) {
        return {
            week: "",
            dari: "",
            sampai: "",
            items: [],
            total_students: 0,
            total_filled_days: 0,
            total_parent_notes: 0,
            total_teacher_notes: 0,
        };
    }
    const [allStudents, classrooms] = await Promise.all([
        fetchAllReportStudents({
            dari: weekStart,
            sampai: addDays(weekStart, 4),
            signal: params.signal,
        }),
        fetchReportClassrooms(),
    ]);
    const selectedClasses = classrooms.filter((item) => params.classroom_id === undefined ||
        params.classroom_id === null ||
        params.classroom_id === "all" ||
        idKey(item.id) === idKey(params.classroom_id));
    const rawWeeks = await mapActivityConcurrency(selectedClasses, 4, async (classroom) => {
        try {
            const raw = await fetchActivityWeekRaw(classroom.id, weekStart, params.signal);
            return classContext(classroom, raw, weekStart);
        }
        catch (error: any) {
            if (params.signal?.aborted ||
                error?.name === "AbortError") {
                throw error;
            }
            return classContext(classroom, {
                classroom_id: classroom.id,
                classroom_nama: classroom.nama_kelas,
                rencana_mingguan: {},
                days: [],
                items: [],
            }, weekStart);
        }
    });
    const contextsByClass = new Map(rawWeeks.map((context) => [
        idKey(context.classroom_id),
        context,
    ]));
    const globalRows = rawWeeks.flatMap((context) => context.rows);
    const globalRowsByStudent = new Map<string, any[]>();
    globalRows.forEach((row) => {
        const key = idKey(row.student_id);
        const current = globalRowsByStudent.get(key) ?? [];
        current.push(row);
        globalRowsByStudent.set(key, current);
    });
    const sourceStudents = params.classroom_id === undefined ||
        params.classroom_id === null ||
        params.classroom_id === "all"
        ? allStudents
        : allStudents.filter((student) => idKey(student.classroom_id) ===
            idKey(params.classroom_id));
    const items = sourceStudents.map((student) => {
        const historicalRows = globalRowsByStudent.get(idKey(student.id)) ?? [];
        const historicalContext = historicalRows.length
            ? contextsByClass.get(idKey(historicalRows[0].classroom_id))
            : null;
        const currentContext = contextsByClass.get(idKey(student.classroom_id)) ??
            historicalContext ??
            null;
        const plan = currentContext?.plan ??
            emptyActivityPlan(weekStart);
        const base = activityStudentBase(student, historicalRows[0]);
        const days = activityDayNames.map((hari, index) => {
            const tanggal = addDays(weekStart, index);
            const row = globalRows.find((candidate) => idKey(candidate.student_id) ===
                idKey(student.id) &&
                candidate.tanggal === tanggal) ?? null;
            const rowContext = row
                ? contextsByClass.get(idKey(row.classroom_id))
                : currentContext;
            const isHoliday = Boolean(rowContext?.holidayMap.get(tanggal));
            return {
                hari,
                tanggal,
                is_holiday: isHoliday,
                plan: row?.daily_plan ?? rowContext?.plan ?? plan,
                log: {
                    student_id: student.id,
                    nilai_karakter_status: row?.nilai_karakter_status ?? row?.pilar_karakter_status ?? activityCompletionStatus(row?.makanan),
                    pilar_karakter_status: row?.pilar_karakter_status ?? row?.nilai_karakter_status ?? activityCompletionStatus(row?.makanan),
                    jurnal_status: row?.jurnal_status ?? activityCompletionStatus(row?.perasaan),
                    aktivitas_status: row?.aktivitas_status ?? activityCompletionStatus(row?.barang_bawaan),
                    pembiasaan_status: row?.pembiasaan_status ?? activityCompletionStatus(row?.catatan_guru),
                    makanan: row?.makanan ?? "",
                    perasaan: row?.perasaan ?? "",
                    barang_bawaan: row?.barang_bawaan ?? "",
                    catatan_guru: row?.catatan_guru ?? "",
                    catatan_ortu: row?.catatan_ortu ?? "",
                },
                parent_note: "",
                communication_teacher_note: "",
                participation_recorded: !isHoliday && hasActivityValue(row),
            };
        });
        return {
            ...base,
            week: weekStart,
            week_start: weekStart,
            week_end: addDays(weekStart, 4),
            plan,
            days,
            // Catatan guru Aktivitas Harian sudah dipakai sebagai storage
            // kompatibel untuk status Pembiasaan. Rangkuman guru hanya berasal
            // dari Buku Penghubung saat hydration komunikasi dijalankan.
            weekly_teacher_summary: "",
            stats: {
                active_days: days.filter((day) => !day.is_holiday).length,
                holiday_days: days.filter((day) => day.is_holiday).length,
                filled_days: days.filter((day) => day.participation_recorded).length,
                parent_notes: 0,
                teacher_notes: 0,
                meals_recorded: days.filter((day) => text(day.log.makanan)).length,
                feelings_recorded: days.filter((day) => text(day.log.perasaan)).length,
            },
        };
    });
    return {
        week: weekStart,
        dari: weekStart,
        sampai: addDays(weekStart, 4),
        items,
        total_students: items.length,
        total_filled_days: items.reduce((sum, item) => sum + item.stats.filled_days, 0),
        total_parent_notes: 0,
        total_teacher_notes: items.reduce((sum, item) => sum + item.stats.teacher_notes, 0),
    };
}
function mondaysInRange(dari: string, sampai: string) {
    const start = new Date(`${dari}T00:00:00`);
    const end = new Date(`${sampai}T00:00:00`);
    if (Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime()) ||
        start > end) {
        return [];
    }
    const first = new Date(start);
    const day = first.getDay() || 7;
    first.setDate(first.getDate() - day + 1);
    const result: string[] = [];
    const current = new Date(first);
    while (current <= end) {
        result.push(localDateString(current));
        current.setDate(current.getDate() + 7);
    }
    return result;
}
export async function fetchDailyActivityReportFast(params: {
    dari: string;
    sampai: string;
    classroom_id?: ReportStudentId | "all" | null;
    education_state?: "current" | "graduated" | "left" | "all";
    q?: string;
    signal?: AbortSignal;
}) {
    const dari = text(params.dari).slice(0, 10);
    const sampai = text(params.sampai).slice(0, 10);
    const weekStarts = mondaysInRange(dari, sampai);
    if (!dari || !sampai || !weekStarts.length) {
        return {
            dari,
            sampai,
            items: [],
            total_days: 0,
            total_holidays: 0,
            total_student_logs: 0,
            total_filled_students: 0,
        };
    }
    const [students, classrooms] = await Promise.all([
        fetchAllReportStudents({
            dari,
            sampai,
            signal: params.signal,
        }),
        fetchReportClassrooms(),
    ]);
    const selectedClasses = classrooms.filter((item) => params.classroom_id === undefined ||
        params.classroom_id === null ||
        params.classroom_id === "all" ||
        idKey(item.id) === idKey(params.classroom_id));
    const jobs = selectedClasses.flatMap((classroom) => weekStarts.map((weekStart) => ({
        classroom,
        weekStart,
    })));
    const contexts = await mapActivityConcurrency(jobs, 4, async ({ classroom, weekStart }) => {
        try {
            const raw = await fetchActivityWeekRaw(classroom.id, weekStart, params.signal);
            return classContext(classroom, raw, weekStart);
        }
        catch (error: any) {
            if (params.signal?.aborted ||
                error?.name === "AbortError") {
                throw error;
            }
            return null;
        }
    });
    const keyword = text(params.q).toLocaleLowerCase("id");
    const records: any[] = [];
    contexts
        .filter(Boolean)
        .forEach((context: any) => {
        const plan = context.plan;
        const classStudents = students.filter((student) => idKey(student.classroom_id) ===
            idKey(context.classroom_id));
        const rowStudentIds = new Set(context.rows.map((row: any) => idKey(row.student_id)));
        const recordStudentsAll = [
            ...classStudents,
            ...students.filter((student) => rowStudentIds.has(idKey(student.id)) &&
                !classStudents.some((current) => idKey(current.id) ===
                    idKey(student.id))),
        ];
        const recordStudents = params.education_state && params.education_state !== "all"
            ? recordStudentsAll.filter((student) => student.education_state === params.education_state)
            : recordStudentsAll;
        activityDayNames.forEach((_, index) => {
            const tanggal = addDays(context.week_start, index);
            if (tanggal < dari || tanggal > sampai)
                return;
            const dayRows = context.rows.filter((row: any) => row.tanggal === tanggal);
            const isHoliday = Boolean(context.holidayMap.get(tanggal));
            const dailyPlan = dayRows.find((row: any) => row?.daily_plan)?.daily_plan ?? plan;
            const hasPlan = Boolean(dailyPlan.has_schedule ||
                [
                    dailyPlan.tema,
                    dailyPlan.pilar_karakter,
                    dailyPlan.nilai_karakter,
                    dailyPlan.jurnal,
                    dailyPlan.aktivitas,
                    dailyPlan.pembiasaan,
                ]
                    .map(text)
                    .some(Boolean));
            const hasRows = dayRows.some(hasActivityValue);
            if (!isHoliday && !hasPlan && !hasRows)
                return;
            if (params.education_state && params.education_state !== "all" && recordStudents.length === 0)
                return;
            const items = recordStudents.map((student) => {
                const row = dayRows.find((candidate: any) => idKey(candidate.student_id) ===
                    idKey(student.id));
                return {
                    ...student,
                    log: {
                        student_id: student.id,
                        nilai_karakter_status: row?.nilai_karakter_status ?? activityCompletionStatus(row?.makanan),
                        jurnal_status: row?.jurnal_status ?? activityCompletionStatus(row?.perasaan),
                        aktivitas_status: row?.aktivitas_status ?? activityCompletionStatus(row?.barang_bawaan),
                        pembiasaan_status: row?.pembiasaan_status ?? activityCompletionStatus(row?.catatan_guru),
                        makanan: row?.makanan ?? "",
                        perasaan: row?.perasaan ?? "",
                        barang_bawaan: row?.barang_bawaan ?? "",
                        catatan_guru: row?.catatan_guru ?? "",
                    },
                };
            });
            const filteredItems = keyword
                ? items.filter((student) => [
                    student.nama_lengkap,
                    student.nisn,
                    student.nomor_induk,
                    student.log?.catatan_guru,
                ].some((value) => text(value)
                    .toLocaleLowerCase("id")
                    .includes(keyword)))
                : items;
            const planMatch = !keyword ||
                [
                    plan.tema,
                    plan.aktivitas,
                    plan.jurnal,
                    plan.pembiasaan,
                ].some((value) => text(value)
                    .toLocaleLowerCase("id")
                    .includes(keyword));
            if (keyword &&
                !planMatch &&
                filteredItems.length === 0) {
                return;
            }
            const visibleItems = keyword
                ? filteredItems
                : items;
            records.push({
                classroom_id: context.classroom_id,
                classroom_name: context.classroom_name,
                tanggal,
                week_start: context.week_start,
                plan: dailyPlan,
                is_holiday: isHoliday,
                items: visibleItems,
                stats: {
                    total_students: visibleItems.length,
                    filled_students: visibleItems.filter((student) => hasActivityValue(student.log)).length,
                    meals_habis: visibleItems.filter((student) => normalizedActivityValue(student.log?.makanan) === "habis").length,
                    meals_tersisa: visibleItems.filter((student) => normalizedActivityValue(student.log?.makanan).includes("sisa")).length,
                    meals_tidak: visibleItems.filter((student) => {
                        const value = normalizedActivityValue(student.log?.makanan);
                        return (value.includes("tidak") ||
                            value === "belum");
                    }).length,
                    feeling_senang: visibleItems.filter((student) => normalizedActivityValue(student.log?.perasaan).includes("senang")).length,
                    teacher_notes: visibleItems.filter((student) => text(student.log?.catatan_guru)).length,
                },
            });
        });
    });
    records.sort((a, b) => b.tanggal.localeCompare(a.tanggal) ||
        text(a.classroom_name).localeCompare(text(b.classroom_name), "id", { numeric: true }));
    return {
        dari,
        sampai,
        items: records,
        total_days: records.length,
        total_holidays: records.filter((record) => record.is_holiday).length,
        total_student_logs: records.reduce((sum, record) => sum + record.stats.total_students, 0),
        total_filled_students: records.reduce((sum, record) => sum + record.stats.filled_students, 0),
    };
}
function normalizedActivityValue(value: unknown) {
    return text(value).toLocaleLowerCase("id");
}
async function fetchCommunicationWeekRaw(studentId: ReportStudentId, weekStart: string) {
    const cacheKey = `${idKey(studentId)}|${weekStart}`;
    const cached = communicationWeekCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
        return cached.value;
    }
    const raw = await apiGetJson<unknown>(queryUrl("/api/communication-books", {
        student_id: studentId,
        week: weekStart,
        week_start_date: weekStart,
    }));
    communicationWeekCache.set(cacheKey, {
        expiresAt: Date.now() + ACTIVITY_TTL,
        value: raw,
    });
    return raw;
}
function communicationRows(raw: unknown) {
    const root = obj(raw);
    const map = new Map<string, any>();
    [
        ...list(root.days),
        ...list(root.items),
        ...list(root.harian),
    ].forEach((item) => {
        const row = obj(item);
        const tanggal = text(row.tanggal ?? row.date).slice(0, 10);
        if (!tanggal)
            return;
        map.set(tanggal, {
            tanggal,
            catatan_ortu: text(row.catatan_ortu ??
                row.catatan_orangtua ??
                row.parent_note),
            catatan_guru: text(row.catatan_guru ??
                row.teacher_note),
        });
    });
    return map;
}
export async function hydrateWeeklyActivityCommunication(items: any[]) {
    return mapActivityConcurrency(items, 4, async (item) => {
        try {
            const raw = await fetchCommunicationWeekRaw(item.id, item.week_start || item.week);
            const notes = communicationRows(raw);
            const days = (item.days ?? []).map((day: any) => {
                const note = notes.get(day.tanggal);
                return {
                    ...day,
                    parent_note: note?.catatan_ortu ?? "",
                    communication_teacher_note: note?.catatan_guru ?? "",
                };
            });
            return {
                ...item,
                days,
                weekly_teacher_summary: days
                    .map((day: any) => text(day.communication_teacher_note))
                    .filter(Boolean)
                    .join(" · "),
                stats: {
                    ...item.stats,
                    parent_notes: days.filter((day: any) => text(day.parent_note)).length,
                    teacher_notes: days.filter((day: any) => text(day.communication_teacher_note)).length,
                },
            };
        }
        catch {
            return item;
        }
    });
}
export function mergeWeeklyActivityReportStudents(result: any, students: ReportStudent[]) {
    const itemsSource = Array.isArray(result?.items) ? result.items : [];
    const map = new Map(itemsSource.map((item: any) => [idKey(item.id), item]));
    const start = text(result?.week || result?.dari).slice(0, 10);
    const dayNames = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
    const emptyPlan = {
        schedule_id: null,
        journal_id: null,
        week_start: start,
        tema: "",
        pilar_karakter: "",
        nilai_karakter: "",
        jurnal: "",
        aktivitas: "",
        pembiasaan: "",
        has_schedule: false,
    };
    const items = students.map((student) => {
        const existing = map.get(idKey(student.id));
        if (existing)
            return existing;
        return {
            ...student,
            week: start,
            week_start: start,
            week_end: addDays(start, 4),
            plan: emptyPlan,
            days: dayNames.map((hari, index) => ({
                hari,
                tanggal: addDays(start, index),
                is_holiday: false,
                plan: emptyPlan,
                log: {
                    student_id: student.id,
                    nilai_karakter_status: "",
                    jurnal_status: "",
                    aktivitas_status: "",
                    pembiasaan_status: "",
                    makanan: "",
                    perasaan: "",
                    barang_bawaan: "",
                    catatan_guru: "",
                },
                parent_note: "",
                communication_teacher_note: "",
                participation_recorded: false,
            })),
            weekly_teacher_summary: "",
            stats: {
                active_days: 5,
                holiday_days: 0,
                filled_days: 0,
                parent_notes: 0,
                teacher_notes: 0,
                meals_recorded: 0,
                feelings_recorded: 0,
            },
        };
    });
    return {
        ...result,
        items,
        total_students: items.length,
        total_filled_days: items.reduce((sum: number, item: any) => sum + Number(item.stats?.filled_days ?? 0), 0),
        total_parent_notes: items.reduce((sum: number, item: any) => sum + Number(item.stats?.parent_notes ?? 0), 0),
        total_teacher_notes: items.reduce((sum: number, item: any) => sum + Number(item.stats?.teacher_notes ?? 0), 0),
    };
}
