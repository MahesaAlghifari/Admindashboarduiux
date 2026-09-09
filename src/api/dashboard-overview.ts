import { apiGetJson } from "./http";
import {
    fetchStudentById,
    fetchStudents,
    getStudentEducationState,
} from "./students";
import { fetchStaffUsers } from "./users";
export type DashboardId = number | string;
type Obj = Record<string, any>;
export interface DashboardStudentStats {
    total: number;
    active: number;
    graduated: number;
    left: number;
}
export interface DashboardStaffStats {
    total: number;
    active: number;
    teachers: number;
    staff: number;
}
export interface DashboardAcademicPeriod {
    id: DashboardId | null;
    tahun_ajaran: string;
    semester: number;
    nama_periode: string;
    tanggal_mulai: string;
    tanggal_selesai: string;
    is_active: boolean;
    total_learning_days: number;
    elapsed_learning_days: number;
    remaining_learning_days: number;
    progress_percent: number;
}
export interface DashboardCurriculum {
    id: DashboardId | null;
    nama_kurikulum: string;
    tahun_ajaran: string;
    deskripsi: string;
    status_aktif: boolean;
    mata_pelajaran: unknown[];
    indikator_ids: unknown[];
}
export interface DashboardAnnouncement {
    id: DashboardId | null;
    judul: string;
    isi: string;
    tanggal_terbit: string;
    tipe: string;
    target_audien: string;
}
export interface DashboardPayment {
    id: DashboardId | null;
    nomor_transaksi: string;
    student_name: string;
    student_nisn: string;
    category: string;
    description: string;
    amount: number;
    date: string;
    invoice_number: string;
}
export interface DashboardClassroomSeed {
    id: DashboardId;
    nama_kelas: string;
    student_ids: DashboardId[];
}
export interface DashboardOperationalSeed {
    school_day: boolean;
    day_label: string;
    day_description: string;
    today: string;
    week_start: string;
    classrooms: DashboardClassroomSeed[];
    expected_student_ids: DashboardId[];
    scope_label: string;
    teacher_scope: boolean;
}
export interface DashboardCore {
    students: DashboardStudentStats;
    staff: DashboardStaffStats;
    period: DashboardAcademicPeriod | null;
    curriculum: DashboardCurriculum | null;
    announcements: DashboardAnnouncement[];
    payments: DashboardPayment[];
    operational: DashboardOperationalSeed;
    warnings: string[];
}
export interface DashboardContext {
    period: DashboardAcademicPeriod | null;
    curriculum: DashboardCurriculum | null;
    announcements: DashboardAnnouncement[];
    operational: DashboardOperationalSeed;
    warnings: string[];
}
export type ReminderState = "complete" | "incomplete" | "unchecked" | "not-required" | "error";
export interface DashboardReminderItem {
    id: "attendance" | "activity" | "communication";
    label: string;
    state: ReminderState;
    completed: number;
    expected: number;
    missing: number;
    detail: string;
}
export interface DashboardReminders {
    items: DashboardReminderItem[];
    checked_at: string;
}
const text = (value: unknown) => String(value ?? "").trim();
const obj = (value: unknown): Obj => value &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Obj)
    : {};
const list = (value: unknown): Obj[] => {
    if (Array.isArray(value)) {
        return value.filter((item) => item &&
            typeof item === "object" &&
            !Array.isArray(item)) as Obj[];
    }
    const root = obj(value);
    for (const key of [
        "items",
        "data",
        "results",
        "rows",
    ]) {
        if (Array.isArray(root[key])) {
            return list(root[key]);
        }
    }
    return [];
};
const idOf = (value: unknown): DashboardId | null => typeof value === "number" ||
    (typeof value === "string" &&
        value.trim())
    ? (value as DashboardId)
    : null;
const bool = (value: unknown, fallback = false) => {
    if (typeof value === "boolean")
        return value;
    if (value === 1 ||
        value === "1" ||
        value === "true") {
        return true;
    }
    if (value === 0 ||
        value === "0" ||
        value === "false") {
        return false;
    }
    return fallback;
};
const num = (value: unknown) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};
const dateOnly = (value: unknown) => text(value).slice(0, 10);
const keyOf = (value: unknown) => String(value ?? "");
const queryUrl = (path: string, params: Record<string, unknown>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === undefined ||
            value === null ||
            value === "") {
            return;
        }
        query.set(key, String(value));
    });
    const serialized = query.toString();
    return serialized
        ? `${path}?${serialized}`
        : path;
};
const localIsoDate = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
const parseLocalDate = (value: string) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateOnly(value));
    if (!match)
        return null;
    const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return Number.isNaN(date.getTime())
        ? null
        : date;
};
const addDays = (value: string, amount: number) => {
    const date = parseLocalDate(value);
    if (!date)
        return "";
    date.setDate(date.getDate() + amount);
    return localIsoDate(date);
};
const mondayOf = (value: string) => {
    const date = parseLocalDate(value);
    if (!date)
        return "";
    const day = date.getDay() || 7;
    date.setDate(date.getDate() - day + 1);
    return localIsoDate(date);
};
const isWeekend = (value: string) => {
    const date = parseLocalDate(value);
    if (!date)
        return false;
    return (date.getDay() === 0 ||
        date.getDay() === 6);
};
const dateDiffDays = (from: string, to: string) => {
    const start = parseLocalDate(from);
    const end = parseLocalDate(to);
    if (!start || !end)
        return 0;
    return Math.floor((end.getTime() - start.getTime()) /
        86400000);
};
async function mapConcurrency<T, R>(items: T[], limit: number, mapper: (item: T) => Promise<R>): Promise<R[]> {
    const output = new Array<R>(items.length);
    let cursor = 0;
    const workers = Array.from({
        length: Math.min(Math.max(1, limit), Math.max(1, items.length)),
    }, async () => {
        while (cursor < items.length) {
            const index = cursor++;
            output[index] = await mapper(items[index]);
        }
    });
    await Promise.all(workers);
    return output;
}
async function fetchPaged(path: string, params: Record<string, unknown>, signal?: AbortSignal) {
    const first = await apiGetJson<unknown>(queryUrl(path, {
        ...params,
        page: 1,
        per_page: 100,
    }), { signal });
    const firstRows = list(first);
    const root = obj(first);
    const totalPages = Math.max(1, num(root.total_pages) || 1);
    if (totalPages <= 1) {
        return firstRows;
    }
    const rest = await Promise.all(Array.from({ length: totalPages - 1 }, (_, index) => apiGetJson<unknown>(queryUrl(path, {
        ...params,
        page: index + 2,
        per_page: 100,
    }), { signal })));
    return [
        ...firstRows,
        ...rest.flatMap(list),
    ];
}
const normalizePeriod = (raw: unknown): DashboardAcademicPeriod => {
    const row = obj(raw);
    return {
        id: idOf(row.id),
        tahun_ajaran: text(row.tahun_ajaran),
        semester: num(row.semester),
        nama_periode: text(row.nama_periode),
        tanggal_mulai: dateOnly(row.tanggal_mulai),
        tanggal_selesai: dateOnly(row.tanggal_selesai),
        is_active: bool(row.is_active),
        total_learning_days: 0,
        elapsed_learning_days: 0,
        remaining_learning_days: 0,
        progress_percent: 0,
    };
};
const normalizeAnnouncement = (raw: unknown): DashboardAnnouncement => {
    const row = obj(raw);
    return {
        id: idOf(row.id),
        judul: text(row.judul),
        isi: text(row.isi),
        tanggal_terbit: dateOnly(row.tanggal_terbit),
        tipe: text(row.tipe) || "Info",
        target_audien: text(row.target_audien) || "Semua",
    };
};
const normalizeCurriculum = (raw: unknown): DashboardCurriculum => {
    const row = obj(raw);
    return {
        id: idOf(row.id),
        nama_kurikulum: text(row.nama_kurikulum),
        tahun_ajaran: text(row.tahun_ajaran),
        deskripsi: text(row.deskripsi),
        status_aktif: bool(row.status_aktif),
        mata_pelajaran: Array.isArray(row.mata_pelajaran)
            ? row.mata_pelajaran
            : [],
        indikator_ids: Array.isArray(row.indikator_ids)
            ? row.indikator_ids
            : [],
    };
};
function effectiveDays(period: DashboardAcademicPeriod, announcements: DashboardAnnouncement[], today: string) {
    const start = period.tanggal_mulai;
    const end = period.tanggal_selesai;
    if (!parseLocalDate(start) ||
        !parseLocalDate(end) ||
        end < start) {
        return {
            total: 0,
            elapsed: 0,
            remaining: 0,
            progress: 0,
        };
    }
    const holidayDates = new Set(announcements
        .filter((item) => item.tipe.toLowerCase() ===
        "libur" &&
        item.tanggal_terbit)
        .map((item) => item.tanggal_terbit));
    let total = 0;
    let elapsed = 0;
    for (let value = start; value <= end; value = addDays(value, 1)) {
        if (isWeekend(value) ||
            holidayDates.has(value)) {
            continue;
        }
        total += 1;
        if (value <= today) {
            elapsed += 1;
        }
    }
    return {
        total,
        elapsed: Math.min(total, elapsed),
        remaining: Math.max(0, total - elapsed),
        progress: total
            ? Math.min(100, Math.max(0, Math.round((elapsed / total) * 100)))
            : 0,
    };
}
function schoolDayInfo(period: DashboardAcademicPeriod | null, announcements: DashboardAnnouncement[], today: string) {
    if (!period) {
        return {
            school_day: false,
            label: "Periode belum aktif",
            description: "Aktifkan periode akademik untuk menentukan hari operasional.",
        };
    }
    if (today < period.tanggal_mulai ||
        today > period.tanggal_selesai) {
        return {
            school_day: false,
            label: "Di luar periode",
            description: "Hari ini berada di luar rentang periode akademik aktif.",
        };
    }
    const holiday = announcements.find((item) => item.tanggal_terbit === today &&
        item.tipe.toLowerCase() === "libur");
    if (holiday) {
        return {
            school_day: false,
            label: holiday.judul || "Hari Libur",
            description: holiday.isi ||
                "Tidak ada pengisian operasional pada hari libur.",
        };
    }
    if (isWeekend(today)) {
        return {
            school_day: false,
            label: "Akhir Pekan",
            description: "Tidak ada pengisian operasional pada akhir pekan.",
        };
    }
    return {
        school_day: true,
        label: "Hari Efektif",
        description: "Presensi, aktivitas, dan Buku Penghubung perlu diperiksa hari ini.",
    };
}
function educationReason(status: unknown) {
    const value = obj(status);
    return [
        value.alasan_keluar,
        value.ke_lembaga,
        value.lembaga_lanjutan,
        value.nomor_surat_keterangan,
    ]
        .map(text)
        .filter(Boolean)
        .join(" ");
}
function educationState(status: unknown): "current" | "graduated" | "left" {
    return getStudentEducationState({
        status: obj(status),
    });
}
export async function fetchDashboardStudentStats(
    signal?: AbortSignal
): Promise<DashboardStudentStats> {
    const rows = await fetchStudents({
        signal,
    });

    const inactive = rows.filter(
        (student) => !student.status.status_aktif
    );

    const incompleteInactive = inactive.filter(
        (student) =>
            !educationReason(student.status) &&
            student.id !== null
    );

    const detailRows = await mapConcurrency(
        incompleteInactive,
        6,
        async (student) => {
            try {
                return await fetchStudentById(
                    student.id,
                    signal
                );
            } catch {
                return student;
            }
        }
    );

    const detailsById = new Map(
        detailRows.map((student) => [
            keyOf(student.id),
            student,
        ])
    );

    let active = 0;
    let graduated = 0;
    let left = 0;

    rows.forEach((student) => {
        const detail =
            detailsById.get(
                keyOf(student.id)
            ) ?? student;

        const state = educationState(
            detail.status
        );

        if (state === "current") {
            active += 1;
        } else if (
            state === "graduated"
        ) {
            graduated += 1;
        } else {
            left += 1;
        }
    });

    return {
        total: rows.length,
        active,
        graduated,
        left,
    };
}

export async function fetchDashboardStaffStats(
    signal?: AbortSignal
): Promise<DashboardStaffStats> {
    const rows = await fetchStaffUsers({
        signal,
    });

    const activeRows = rows.filter(
        (item) => item.izin_login
    );

    const teachers = activeRows.filter(
        (item) =>
            text(item.jabatan)
                .toLowerCase()
                .includes("guru")
    ).length;

    return {
        total: rows.length,
        active: activeRows.length,
        teachers,
        staff: Math.max(
            0,
            activeRows.length - teachers
        ),
    };
}

async function fetchAnnouncements(signal?: AbortSignal) {
    const rows = await fetchPaged("/api/announcements", {}, signal);
    return rows
        .map(normalizeAnnouncement)
        .filter((item) => item.tanggal_terbit);
}
async function fetchCurriculums(signal?: AbortSignal) {
    const rows = await fetchPaged("/api/curriculums", {
        status_aktif: true,
    }, signal);
    return rows.map(normalizeCurriculum);
}
async function fetchClassrooms(signal?: AbortSignal) {
    return fetchPaged("/api/classrooms", {}, signal);
}
export async function fetchDashboardRecentPayments(signal?: AbortSignal): Promise<DashboardPayment[]> {
    const [transactionsRaw, invoicesRaw] = await Promise.all([
        apiGetJson<unknown>("/api/finance/transactions", { signal }),
        apiGetJson<unknown>("/api/finance/invoices", { signal }),
    ]);
    const invoices = list(invoicesRaw);
    const invoicesById = new Map(invoices.map((invoice) => [
        keyOf(invoice.id),
        invoice,
    ]));
    return list(transactionsRaw)
        .filter((item) => {
        const type = text(item.tipe_transaksi).toLowerCase();
        const category = text(item.kategori).toLowerCase();
        return (type.includes("masuk") ||
            type.includes("pemasukan") ||
            type.includes("income") ||
            item.invoice_id !== null &&
                item.invoice_id !== undefined ||
            category.includes("spp") ||
            category.includes("pembayaran"));
    })
        .sort((a, b) => dateOnly(b.tanggal_transaksi).localeCompare(dateOnly(a.tanggal_transaksi)))
        .slice(0, 6)
        .map((item) => {
        const invoice = invoicesById.get(keyOf(item.invoice_id)) ?? {};
        const student = obj(invoice.student);
        return {
            id: idOf(item.id),
            nomor_transaksi: text(item.nomor_transaksi) ||
                `TRX-${item.id ?? ""}`,
            student_name: text(student.nama_lengkap) ||
                text(item.nama_siswa) ||
                "Pembayaran",
            student_nisn: text(student.nisn),
            category: text(item.kategori) ||
                "Pembayaran",
            description: text(item.deskripsi),
            amount: num(item.jumlah),
            date: dateOnly(item.tanggal_transaksi),
            invoice_number: text(invoice.nomor_tagihan),
        };
    });
}
function selectOperationalClassrooms(rawClassrooms: Obj[], period: DashboardAcademicPeriod | null, curriculum: DashboardCurriculum | null, userNik: string) {
    const current = rawClassrooms.filter((classroom) => {
        const classCurriculum = obj(classroom.curriculum);
        if (curriculum?.id !== null &&
            curriculum?.id !== undefined &&
            idOf(classCurriculum.id) !== null) {
            return (keyOf(classCurriculum.id) ===
                keyOf(curriculum.id));
        }
        if (period?.tahun_ajaran) {
            return (text(classCurriculum.tahun_ajaran) === period.tahun_ajaran);
        }
        return true;
    });
    const base = period?.tahun_ajaran || curriculum
        ? current
        : rawClassrooms;
    const teacherClasses = userNik
        ? base.filter((classroom) => text(obj(classroom.wali_kelas).nik) === userNik)
        : [];
    const selected = teacherClasses.length > 0
        ? teacherClasses
        : base;
    const classrooms = selected
        .map((classroom) => ({
        id: idOf(classroom.id),
        nama_kelas: text(classroom.nama_kelas),
        student_ids: list(classroom.students)
            .map((student) => idOf(student.id))
            .filter((value): value is DashboardId => value !== null),
    }))
        .filter((classroom): classroom is DashboardClassroomSeed => classroom.id !== null);
    const expected = [
        ...new Map(classrooms
            .flatMap((classroom) => classroom.student_ids.map((id) => [
            keyOf(id),
            id,
        ]))).values(),
    ];
    return {
        classrooms,
        expected,
        teacher_scope: teacherClasses.length > 0,
        scope_label: teacherClasses.length > 0
            ? teacherClasses
                .map((item) => text(item.nama_kelas))
                .filter(Boolean)
                .join(", ")
            : "Seluruh kelas aktif",
    };
}
export async function fetchDashboardContext(userNik = "", signal?: AbortSignal): Promise<DashboardContext> {
    const today = localIsoDate();
    const [periodResult, announcementResult, curriculumResult, classroomResult,] = await Promise.allSettled([
        apiGetJson<unknown>("/api/academic-periods/current", { signal }),
        fetchAnnouncements(signal),
        fetchCurriculums(signal),
        fetchClassrooms(signal),
    ]);
    const warnings: string[] = [];
    let period: DashboardAcademicPeriod | null = periodResult.status === "fulfilled"
        ? normalizePeriod(periodResult.value)
        : null;
    if (periodResult.status === "rejected") {
        warnings.push("Periode akademik");
    }
    const announcements = announcementResult.status === "fulfilled"
        ? announcementResult.value
        : [];
    if (announcementResult.status === "rejected") {
        warnings.push("Kalender pengumuman");
    }
    const curriculums = curriculumResult.status === "fulfilled"
        ? curriculumResult.value
        : [];
    if (curriculumResult.status === "rejected") {
        warnings.push("Kurikulum");
    }
    const curriculum = curriculums.find((item) => period?.tahun_ajaran &&
        item.tahun_ajaran === period.tahun_ajaran) ??
        null;
    if (period) {
        const learning = effectiveDays(period, announcements, today);
        period = {
            ...period,
            total_learning_days: learning.total,
            elapsed_learning_days: learning.elapsed,
            remaining_learning_days: learning.remaining,
            progress_percent: learning.progress,
        };
    }
    const rawClassrooms = classroomResult.status === "fulfilled"
        ? classroomResult.value
        : [];
    if (classroomResult.status === "rejected") {
        warnings.push("Data kelas");
    }
    if (period?.tahun_ajaran && !curriculum) {
        warnings.push(`Kurikulum ${period.tahun_ajaran} belum tersedia`);
    }
    const operationalClasses = selectOperationalClassrooms(rawClassrooms, period, curriculum, text(userNik));
    if (period?.tahun_ajaran && rawClassrooms.length > 0 && operationalClasses.classrooms.length === 0) {
        warnings.push(`Kelas untuk ${period.tahun_ajaran} belum dikonfigurasi`);
    }
    const day = schoolDayInfo(period, announcements, today);
    const upcoming = announcements
        .filter((item) => item.tanggal_terbit >= today)
        .sort((a, b) => a.tanggal_terbit.localeCompare(b.tanggal_terbit))
        .slice(0, 5);
    return {
        period,
        curriculum,
        announcements: upcoming,
        operational: {
            school_day: day.school_day,
            day_label: day.label,
            day_description: day.description,
            today,
            week_start: mondayOf(today),
            classrooms: operationalClasses.classrooms,
            expected_student_ids: operationalClasses.expected,
            scope_label: operationalClasses.scope_label,
            teacher_scope: operationalClasses.teacher_scope,
        },
        warnings,
    };
}
export async function fetchDashboardCore(userNik = "", signal?: AbortSignal): Promise<DashboardCore> {
    const today = localIsoDate();
    const [studentResult, staffResult, periodResult, announcementResult, curriculumResult, classroomResult, paymentResult,] = await Promise.allSettled([
        fetchDashboardStudentStats(signal),
        fetchDashboardStaffStats(signal),
        apiGetJson<unknown>("/api/academic-periods/current", { signal }),
        fetchAnnouncements(signal),
        fetchCurriculums(signal),
        fetchClassrooms(signal),
        fetchDashboardRecentPayments(signal),
    ]);
    const warnings: string[] = [];
    const students = studentResult.status === "fulfilled"
        ? studentResult.value
        : {
            total: 0,
            active: 0,
            graduated: 0,
            left: 0,
        };
    if (studentResult.status === "rejected") {
        warnings.push("Data siswa");
    }
    const staff = staffResult.status === "fulfilled"
        ? staffResult.value
        : {
            total: 0,
            active: 0,
            teachers: 0,
            staff: 0,
        };
    if (staffResult.status === "rejected") {
        warnings.push("Data staff");
    }
    let period: DashboardAcademicPeriod | null = periodResult.status === "fulfilled"
        ? normalizePeriod(periodResult.value)
        : null;
    if (periodResult.status === "rejected") {
        warnings.push("Periode akademik");
    }
    const announcements = announcementResult.status === "fulfilled"
        ? announcementResult.value
        : [];
    if (announcementResult.status === "rejected") {
        warnings.push("Kalender pengumuman");
    }
    const curriculums = curriculumResult.status === "fulfilled"
        ? curriculumResult.value
        : [];
    if (curriculumResult.status === "rejected") {
        warnings.push("Kurikulum");
    }
    const curriculum = curriculums.find((item) => period?.tahun_ajaran &&
        item.tahun_ajaran === period.tahun_ajaran) ??
        null;
    if (period) {
        const learning = effectiveDays(period, announcements, today);
        period = {
            ...period,
            total_learning_days: learning.total,
            elapsed_learning_days: learning.elapsed,
            remaining_learning_days: learning.remaining,
            progress_percent: learning.progress,
        };
    }
    const rawClassrooms = classroomResult.status === "fulfilled"
        ? classroomResult.value
        : [];
    if (classroomResult.status === "rejected") {
        warnings.push("Data kelas");
    }
    if (period?.tahun_ajaran && !curriculum) {
        warnings.push(`Kurikulum ${period.tahun_ajaran} belum tersedia`);
    }
    const operationalClasses = selectOperationalClassrooms(rawClassrooms, period, curriculum, text(userNik));
    if (period?.tahun_ajaran && rawClassrooms.length > 0 && operationalClasses.classrooms.length === 0) {
        warnings.push(`Kelas untuk ${period.tahun_ajaran} belum dikonfigurasi`);
    }
    const day = schoolDayInfo(period, announcements, today);
    const upcoming = announcements
        .filter((item) => item.tanggal_terbit >= today)
        .sort((a, b) => a.tanggal_terbit.localeCompare(b.tanggal_terbit))
        .slice(0, 5);
    const payments = paymentResult.status === "fulfilled"
        ? paymentResult.value
        : [];
    if (paymentResult.status === "rejected") {
        warnings.push("Transaksi pembayaran");
    }
    return {
        students,
        staff,
        period,
        curriculum,
        announcements: upcoming,
        payments,
        operational: {
            school_day: day.school_day,
            day_label: day.label,
            day_description: day.description,
            today,
            week_start: mondayOf(today),
            classrooms: operationalClasses.classrooms,
            expected_student_ids: operationalClasses.expected,
            scope_label: operationalClasses.scope_label,
            teacher_scope: operationalClasses.teacher_scope,
        },
        warnings,
    };
}
function uniquePersistedStudentIds(rows: Obj[], today: string) {
    return new Set(rows
        .filter((item) => dateOnly(item.tanggal ?? item.date) === today)
        .map((item) => idOf(item.student_id ??
        item.siswa_id ??
        obj(item.student).id))
        .filter((value): value is DashboardId => value !== null)
        .map(keyOf));
}
async function attendanceReminder(seed: DashboardOperationalSeed, signal?: AbortSignal): Promise<DashboardReminderItem> {
    const expected = new Set(seed.expected_student_ids.map(keyOf));
    if (!seed.school_day) {
        return {
            id: "attendance",
            label: "Presensi",
            state: "not-required",
            completed: 0,
            expected: expected.size,
            missing: 0,
            detail: "Tidak perlu diisi pada hari non-efektif.",
        };
    }
    if (!expected.size) {
        return {
            id: "attendance",
            label: "Presensi",
            state: "complete",
            completed: 0,
            expected: 0,
            missing: 0,
            detail: "Tidak ada siswa pada scope kelas aktif.",
        };
    }
    try {
        const raw = await apiGetJson<unknown>(queryUrl("/api/attendances/recap", {
            dari: seed.today,
            sampai: seed.today,
        }), { signal });
        const recorded = new Set(list(raw)
            .map((item) => idOf(item.student_id))
            .filter((value): value is DashboardId => value !== null &&
            expected.has(keyOf(value)))
            .map(keyOf));
        const missing = Math.max(0, expected.size - recorded.size);
        return {
            id: "attendance",
            label: "Presensi",
            state: missing === 0
                ? "complete"
                : "incomplete",
            completed: recorded.size,
            expected: expected.size,
            missing,
            detail: missing === 0
                ? "Presensi seluruh siswa sudah tercatat."
                : `${missing} siswa belum memiliki presensi hari ini.`,
        };
    }
    catch {
        return {
            id: "attendance",
            label: "Presensi",
            state: "error",
            completed: 0,
            expected: expected.size,
            missing: expected.size,
            detail: "Status presensi belum dapat diperiksa.",
        };
    }
}
async function activityReminder(seed: DashboardOperationalSeed, signal?: AbortSignal): Promise<DashboardReminderItem> {
    const expected = new Set(seed.expected_student_ids.map(keyOf));
    if (!seed.school_day) {
        return {
            id: "activity",
            label: "Aktivitas Harian",
            state: "not-required",
            completed: 0,
            expected: expected.size,
            missing: 0,
            detail: "Tidak perlu diisi pada hari non-efektif.",
        };
    }
    if (!expected.size) {
        return {
            id: "activity",
            label: "Aktivitas Harian",
            state: "complete",
            completed: 0,
            expected: 0,
            missing: 0,
            detail: "Tidak ada siswa pada scope kelas aktif.",
        };
    }
    try {
        const rawWeeks = await mapConcurrency(seed.classrooms, 4, (classroom) => apiGetJson<unknown>(queryUrl("/api/daily-activities/week", {
            classroom_id: classroom.id,
            week_start_date: seed.week_start,
        }), { signal }));
        const recorded = new Set<string>();
        rawWeeks.forEach((raw) => {
            const root = obj(raw);
            const source = [
                ...list(root.students_activities),
                ...list(root.items),
                ...list(root.activities),
            ];
            uniquePersistedStudentIds(source, seed.today).forEach((id) => {
                if (expected.has(id)) {
                    recorded.add(id);
                }
            });
        });
        const missing = Math.max(0, expected.size - recorded.size);
        return {
            id: "activity",
            label: "Aktivitas Harian",
            state: missing === 0
                ? "complete"
                : "incomplete",
            completed: recorded.size,
            expected: expected.size,
            missing,
            detail: missing === 0
                ? "Aktivitas seluruh siswa sudah tersimpan."
                : `${missing} siswa belum memiliki aktivitas tersimpan hari ini.`,
        };
    }
    catch {
        return {
            id: "activity",
            label: "Aktivitas Harian",
            state: "error",
            completed: 0,
            expected: expected.size,
            missing: expected.size,
            detail: "Status aktivitas belum dapat diperiksa.",
        };
    }
}
function communicationDates(raw: unknown) {
    const root = obj(raw);
    return new Set([
        ...list(root.days),
        ...list(root.items),
        ...list(root.harian),
    ]
        .map((item) => dateOnly(item.tanggal ?? item.date))
        .filter(Boolean));
}
async function communicationReminder(seed: DashboardOperationalSeed, force: boolean, signal?: AbortSignal): Promise<DashboardReminderItem> {
    const expected = seed.expected_student_ids;
    if (!seed.school_day) {
        return {
            id: "communication",
            label: "Buku Penghubung",
            state: "not-required",
            completed: 0,
            expected: expected.length,
            missing: 0,
            detail: "Tidak perlu diisi pada hari non-efektif.",
        };
    }
    if (!expected.length) {
        return {
            id: "communication",
            label: "Buku Penghubung",
            state: "complete",
            completed: 0,
            expected: 0,
            missing: 0,
            detail: "Tidak ada siswa pada scope kelas aktif.",
        };
    }
    const autoLimit = seed.teacher_scope ? 45 : 30;
    if (expected.length > autoLimit &&
        !force) {
        return {
            id: "communication",
            label: "Buku Penghubung",
            state: "unchecked",
            completed: 0,
            expected: expected.length,
            missing: 0,
            detail: "Pengecekan massal ditunda agar dashboard tetap ringan.",
        };
    }
    try {
        const rows = await mapConcurrency(expected, 4, async (studentId) => {
            try {
                const raw = await apiGetJson<unknown>(queryUrl("/api/communication-books", {
                    student_id: studentId,
                    week: seed.week_start,
                }), { signal });
                return communicationDates(raw).has(seed.today);
            }
            catch {
                return false;
            }
        });
        const completed = rows.filter(Boolean).length;
        const missing = Math.max(0, expected.length - completed);
        return {
            id: "communication",
            label: "Buku Penghubung",
            state: missing === 0
                ? "complete"
                : "incomplete",
            completed,
            expected: expected.length,
            missing,
            detail: missing === 0
                ? "Buku Penghubung seluruh siswa sudah tersimpan."
                : `${missing} siswa belum memiliki Buku Penghubung tersimpan hari ini.`,
        };
    }
    catch {
        return {
            id: "communication",
            label: "Buku Penghubung",
            state: "error",
            completed: 0,
            expected: expected.length,
            missing: expected.length,
            detail: "Status Buku Penghubung belum dapat diperiksa.",
        };
    }
}
export async function fetchDashboardPriorityReminders(seed: DashboardOperationalSeed, signal?: AbortSignal): Promise<DashboardReminders> {
    const [attendance, activity] = await Promise.all([
        attendanceReminder(seed, signal),
        activityReminder(seed, signal),
    ]);
    return {
        items: [attendance, activity],
        checked_at: new Date().toISOString(),
    };
}
export async function fetchDashboardCommunicationReminder(seed: DashboardOperationalSeed, options: {
    force?: boolean;
    signal?: AbortSignal;
} = {}): Promise<DashboardReminderItem> {
    return communicationReminder(seed, Boolean(options.force), options.signal);
}
export async function fetchDashboardReminders(seed: DashboardOperationalSeed, options: {
    forceCommunication?: boolean;
    signal?: AbortSignal;
} = {}): Promise<DashboardReminders> {
    const [attendance, activity, communication,] = await Promise.all([
        attendanceReminder(seed, options.signal),
        activityReminder(seed, options.signal),
        communicationReminder(seed, Boolean(options.forceCommunication), options.signal),
    ]);
    return {
        items: [
            attendance,
            activity,
            communication,
        ],
        checked_at: new Date().toISOString(),
    };
}
