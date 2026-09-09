import { apiGetJson, apiRequestJson } from "./http";
const BASE = "/api/classrooms";
type Obj = Record<string, unknown>;
export type ClassroomId = number | string;
export interface ClassroomCurriculum {
    id: ClassroomId | null;
    nama_kurikulum: string;
    tahun_ajaran: string;
    deskripsi: string;
    status_aktif: boolean;
    mata_pelajaran: unknown[];
    indikator_ids: unknown[];
}
export interface ClassroomTeacher {
    id: ClassroomId | null;
    nik: string;
    nama_lengkap: string;
    jabatan: string;
}
export interface ClassroomStudent {
    id: ClassroomId | null;
    nama_lengkap: string;
    nisn: string;
}
export interface Classroom {
    id: ClassroomId | null;
    nama_kelas: string;
    jumlah_siswa: number;
    curriculum: ClassroomCurriculum | null;
    wali_kelas: ClassroomTeacher | null;
    students: ClassroomStudent[];
}
export interface ClassroomPage {
    items: Classroom[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
export interface ClassroomOption {
    id: ClassroomId;
    nama_kelas: string;
    jumlah_siswa: number;
    wali_kelas: ClassroomTeacher | null;
    curriculum_id: ClassroomId | null;
    tahun_ajaran: string;
}
export interface AvailableStudent {
    id: ClassroomId | null;
    nama_lengkap: string;
    nisn: string;
}
export interface AvailableStudentPage {
    items: AvailableStudent[];
    total: number;
    page: number;
    per_page: number;
    total_pages: number;
}
export interface ClassroomPayload {
    nama_kelas: string;
    wali_kelas_id: ClassroomId;
    curriculum_id: ClassroomId;
    student_ids: ClassroomId[];
}
const obj = (value: unknown): Obj => value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as Obj)
    : {};
const text = (value: unknown) => String(value ?? "").trim();
const num = (value: unknown) => {
    const number = Number(value);
    return Number.isFinite(number) ? number : 0;
};
const bool = (value: unknown, fallback = false) => {
    if (typeof value === "boolean")
        return value;
    if (value === 1 || value === "1" || value === "true")
        return true;
    if (value === 0 || value === "0" || value === "false")
        return false;
    return fallback;
};
const idOf = (value: unknown): ClassroomId | null => typeof value === "number" || typeof value === "string" ? value : null;
const detail = (raw: unknown): unknown | null => {
    if (Array.isArray(raw))
        return raw[0] ?? null;
    const root = obj(raw);
    for (const key of ["data", "item", "result", "classroom"]) {
        const value = root[key];
        if (Array.isArray(value))
            return value[0] ?? null;
        const nested = obj(value);
        if (Object.keys(nested).length)
            return nested;
    }
    return Object.keys(root).length ? root : null;
};
const queryUrl = (path: string, params: Record<string, string | number | null | undefined>) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "")
            return;
        query.set(key, String(value));
    });
    const serialized = query.toString();
    return serialized ? `${path}?${serialized}` : path;
};
async function collectRemainingPages<T>(totalPages: number, fetchPage: (page: number) => Promise<T[]>, concurrency = 4): Promise<T[]> {
    if (totalPages <= 1)
        return [];
    const pages = Array.from({ length: totalPages - 1 }, (_value, index) => index + 2);
    const results: T[][] = new Array(pages.length);
    let cursor = 0;
    const worker = async (): Promise<void> => {
        while (true) {
            const index = cursor;
            cursor += 1;
            if (index >= pages.length)
                return;
            results[index] = await fetchPage(pages[index]);
        }
    };
    await Promise.all(Array.from({ length: Math.min(Math.max(1, concurrency), pages.length) }, () => worker()));
    return results.flat();
}
function normalizeCurriculum(raw: unknown): ClassroomCurriculum | null {
    const value = obj(raw);
    if (!Object.keys(value).length)
        return null;
    return {
        id: idOf(value.id),
        nama_kurikulum: text(value.nama_kurikulum),
        tahun_ajaran: text(value.tahun_ajaran),
        deskripsi: text(value.deskripsi),
        status_aktif: bool(value.status_aktif),
        mata_pelajaran: Array.isArray(value.mata_pelajaran)
            ? value.mata_pelajaran
            : [],
        indikator_ids: Array.isArray(value.indikator_ids)
            ? value.indikator_ids
            : [],
    };
}
function normalizeTeacher(raw: unknown): ClassroomTeacher | null {
    const value = obj(raw);
    if (!Object.keys(value).length)
        return null;
    return {
        id: idOf(value.id),
        nik: text(value.nik),
        nama_lengkap: text(value.nama_lengkap),
        jabatan: text(value.jabatan),
    };
}
export function normalizeAvailableStudent(raw: unknown): AvailableStudent {
    const value = obj(raw);
    return {
        id: idOf(value.id ?? value.student_id),
        nama_lengkap: text(value.nama_lengkap ?? value.nama),
        nisn: text(value.nisn ?? value.nis ?? value.nomor_induk),
    };
}
export function normalizeClassroomStudent(raw: unknown): ClassroomStudent {
    if (typeof raw === "number" || typeof raw === "string") {
        return {
            id: raw,
            nama_lengkap: "",
            nisn: "",
        };
    }
    return normalizeAvailableStudent(raw);
}
export function normalizeClassroom(raw: unknown): Classroom {
    const value = obj(raw);
    const students = Array.isArray(value.students)
        ? value.students.map(normalizeClassroomStudent)
        : [];
    return {
        id: idOf(value.id),
        nama_kelas: text(value.nama_kelas),
        jumlah_siswa: num(value.jumlah_siswa) || students.length,
        curriculum: normalizeCurriculum(value.curriculum),
        wali_kelas: normalizeTeacher(value.wali_kelas),
        students,
    };
}
export function normalizeClassroomPage(raw: unknown): ClassroomPage {
    if (Array.isArray(raw)) {
        const items = raw.map(normalizeClassroom);
        return {
            items,
            total: items.length,
            page: 1,
            per_page: items.length || 1,
            total_pages: 1,
        };
    }
    const value = obj(raw);
    const items = Array.isArray(value.items)
        ? value.items.map(normalizeClassroom)
        : Array.isArray(value.data)
            ? value.data.map(normalizeClassroom)
            : [];
    const total = num(value.total) || items.length;
    const perPage = num(value.per_page) || items.length || 1;
    const page = num(value.page) || 1;
    const totalPages = num(value.total_pages) || Math.max(1, Math.ceil(total / perPage));
    return {
        items,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
    };
}
export function normalizeAvailableStudentPage(raw: unknown): AvailableStudentPage {
    if (Array.isArray(raw)) {
        const items = raw.map(normalizeAvailableStudent);
        return {
            items,
            total: items.length,
            page: 1,
            per_page: items.length || 1,
            total_pages: 1,
        };
    }
    const value = obj(raw);
    const items = Array.isArray(value.items)
        ? value.items.map(normalizeAvailableStudent)
        : Array.isArray(value.data)
            ? value.data.map(normalizeAvailableStudent)
            : [];
    const total = num(value.total) || items.length;
    const perPage = num(value.per_page) || items.length || 1;
    const page = num(value.page) || 1;
    const totalPages = num(value.total_pages) || Math.max(1, Math.ceil(total / perPage));
    return {
        items,
        total,
        page,
        per_page: perPage,
        total_pages: totalPages,
    };
}
function serializePayload(payload: ClassroomPayload) {
    const waliKelasId = Number(payload.wali_kelas_id);
    const curriculumId = Number(payload.curriculum_id);
    const studentIds = payload.student_ids
        .map((value) => Number(value))
        .filter(Number.isFinite);
    if (!text(payload.nama_kelas)) {
        throw new Error("Nama kelas wajib diisi.");
    }
    if (!Number.isFinite(waliKelasId) || waliKelasId <= 0) {
        throw new Error("Wali kelas wajib dipilih.");
    }
    if (!Number.isFinite(curriculumId) || curriculumId <= 0) {
        throw new Error("Kurikulum aktif belum tersedia.");
    }
    return {
        nama_kelas: text(payload.nama_kelas),
        wali_kelas_id: waliKelasId,
        curriculum_id: curriculumId,
        student_ids: studentIds,
    };
}
export async function fetchClassrooms(page = 1, perPage = 100, q = "", signal?: AbortSignal): Promise<ClassroomPage> {
    const raw = await apiGetJson<unknown>(queryUrl(BASE, {
        q: text(q),
        page: Math.max(1, page),
        per_page: Math.min(100, Math.max(1, perPage)),
    }), { signal });
    return normalizeClassroomPage(raw);
}
export async function fetchAllClassrooms(perPage = 100, signal?: AbortSignal): Promise<Classroom[]> {
    const first = await fetchClassrooms(1, perPage, "", signal);
    if (first.total_pages <= 1)
        return first.items;
    const rest = await collectRemainingPages<Classroom>(first.total_pages, async (page) => (await fetchClassrooms(page, perPage, "", signal)).items);
    const items = [...first.items, ...rest];
    const map = new Map<string, Classroom>();
    items.forEach((item) => {
        if (item.id !== null)
            map.set(String(item.id), item);
    });
    return [...map.values()].sort((a, b) => a.nama_kelas.localeCompare(b.nama_kelas, "id", {
        numeric: true,
        sensitivity: "base",
    }));
}
export async function fetchClassroomOptions(signal?: AbortSignal): Promise<ClassroomOption[]> {
    const items = await fetchAllClassrooms(100, signal);
    return items
        .filter((item): item is Classroom & {
        id: ClassroomId;
    } => item.id !== null && Boolean(item.nama_kelas))
        .map((item) => ({
        id: item.id,
        nama_kelas: item.nama_kelas,
        jumlah_siswa: item.jumlah_siswa,
        wali_kelas: item.wali_kelas,
        curriculum_id: item.curriculum?.id ?? null,
        tahun_ajaran: item.curriculum?.tahun_ajaran ?? "",
    }));
}
export async function fetchAvailableStudents(params: {
    q?: string;
    page?: number;
    per_page?: number;
    signal?: AbortSignal;
} = {}): Promise<AvailableStudentPage> {
    const raw = await apiGetJson<unknown>(queryUrl(`${BASE}/available-students`, {
        q: text(params.q),
        page: Math.max(1, params.page ?? 1),
        per_page: Math.min(100, Math.max(1, params.per_page ?? 100)),
    }), { signal: params.signal });
    return normalizeAvailableStudentPage(raw);
}
export async function fetchAllAvailableStudents(q = "", perPage = 100, signal?: AbortSignal): Promise<AvailableStudent[]> {
    const first = await fetchAvailableStudents({ q, page: 1, per_page: perPage, signal });
    const rest = await collectRemainingPages<AvailableStudent>(first.total_pages, async (page) => (await fetchAvailableStudents({ q, page, per_page: perPage, signal })).items);
    const items = [...first.items, ...rest];
    const map = new Map<string, AvailableStudent>();
    items.forEach((item) => {
        if (item.id !== null)
            map.set(String(item.id), item);
    });
    return [...map.values()].sort((a, b) => a.nama_lengkap.localeCompare(b.nama_lengkap, "id", {
        sensitivity: "base",
    }));
}
export async function createClassroom(payload: ClassroomPayload): Promise<Classroom | null> {
    const raw = await apiRequestJson<unknown>(BASE, {
        method: "POST",
        jsonBody: serializePayload(payload),
    });
    const value = detail(raw);
    return value ? normalizeClassroom(value) : null;
}
export async function updateClassroom(id: ClassroomId, payload: ClassroomPayload): Promise<Classroom | null> {
    if (id === null || id === undefined || String(id).trim() === "") {
        throw new Error("ID kelas tidak valid.");
    }
    const raw = await apiRequestJson<unknown>(`${BASE}/${encodeURIComponent(String(id))}`, {
        method: "PUT",
        jsonBody: serializePayload(payload),
    });
    const value = detail(raw);
    return value ? normalizeClassroom(value) : null;
}
export async function deleteClassroom(id: ClassroomId): Promise<void> {
    if (id === null || id === undefined || String(id).trim() === "") {
        throw new Error("ID kelas tidak valid.");
    }
    await apiRequestJson<unknown>(`${BASE}/${encodeURIComponent(String(id))}`, {
        method: "DELETE",
    });
}
