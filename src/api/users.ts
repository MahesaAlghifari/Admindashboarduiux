import { apiGetJson, apiRequestJson } from "./http";
const STUDENTS = "/api/users/students";
const STAFF = "/api/users/staff";
export interface StudentUserQuery {
    status_aktif?: boolean | null;
    classroom_id?: number | string | null;
    izin_login?: boolean | null;
    search?: string | null;
    page?: number | null;
    limit?: number | null;
    signal?: AbortSignal;
}
export interface StaffUserQuery {
    jabatan?: string | null;
    izin_login?: boolean | null;
    search?: string | null;
    page?: number | null;
    limit?: number | null;
    signal?: AbortSignal;
}
export type UserId = number | string;
type Obj = Record<string, unknown>;
export interface StudentUser {
    id: UserId | null;
    nama_lengkap: string;
    nisn: string;
    nik: string;
    username: string;
    izin_login: boolean;
    status_aktif: boolean;
    classroom_id: number | null;
    nama_kelas: string;
}
export interface StaffUser {
    id: UserId | null;
    nama_lengkap: string;
    nik: string;
    nip: string;
    jabatan: string;
    username: string;
    izin_login: boolean;
}
export interface StudentUserUpdateInput {
    username?: string | null;
    password?: string | null;
    izin_login: boolean;
    classroom_id: number | string | null;
    status_aktif: boolean;
    nik?: string | null;
    nisn?: string | null;
}
export interface StaffUserUpdateInput {
    username: string;
    password?: string | null;
    izin_login: boolean;
}
const objectOf = (value: unknown): Obj => value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Obj)
    : {};
const rawString = (value: unknown): string => value === null || value === undefined
    ? ""
    : String(value);
const text = (value: unknown): string => rawString(value).trim();
const booleanOf = (value: unknown, fallback = false): boolean => {
    if (typeof value === "boolean") {
        return value;
    }
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
const idOf = (value: unknown): UserId | null => {
    if (typeof value === "number" &&
        Number.isFinite(value)) {
        return value;
    }
    if (typeof value === "string" &&
        value.trim()) {
        return value.trim();
    }
    return null;
};
const classroomIdFromResponse = (value: unknown): number | null => {
    if (value === null ||
        value === undefined ||
        value === "") {
        return null;
    }
    const normalized = Number(value);
    if (!Number.isFinite(normalized) ||
        !Number.isInteger(normalized) ||
        normalized <= 0) {
        return null;
    }
    return normalized;
};
const classroomIdForRequest = (value: unknown): number => {
    if (value === null ||
        value === undefined ||
        value === "") {
        return 0;
    }
    const normalized = Number(value);
    if (!Number.isFinite(normalized) ||
        !Number.isInteger(normalized) ||
        normalized < 0) {
        throw new Error("ID kelas tidak valid.");
    }
    return normalized;
};
const assertUserId = (userId: UserId): void => {
    if (typeof userId === "number") {
        if (!Number.isFinite(userId)) {
            throw new Error("ID pengguna tidak valid.");
        }
        return;
    }
    if (!text(userId)) {
        throw new Error("ID pengguna tidak valid.");
    }
};
function listFromResponse(response: unknown): unknown[] {
    if (Array.isArray(response)) {
        return response;
    }
    const root = objectOf(response);
    for (const key of [
        "data",
        "items",
        "results",
        "students",
        "staff",
        "users",
    ]) {
        if (Array.isArray(root[key])) {
            return root[key] as unknown[];
        }
        const nested = objectOf(root[key]);
        for (const nestedKey of [
            "data",
            "items",
            "results",
            "students",
            "staff",
            "users",
        ]) {
            if (Array.isArray(nested[nestedKey])) {
                return nested[nestedKey] as unknown[];
            }
        }
    }
    return [];
}
function detailFromResponse(response: unknown): unknown | null {
    if (Array.isArray(response)) {
        return response[0] ?? null;
    }
    const root = objectOf(response);
    for (const key of [
        "data",
        "item",
        "result",
        "student",
        "staff",
        "user",
    ]) {
        const value = root[key];
        if (Array.isArray(value)) {
            return value[0] ?? null;
        }
        const nested = objectOf(value);
        if (Object.keys(nested).length) {
            return nested;
        }
    }
    return Object.keys(root).length
        ? root
        : null;
}
function ensureSuccess<T>(response: T): T {
    const root = objectOf(response);
    const status = text(root.status).toLowerCase();
    if (root.success === false ||
        ["error", "failed", "fail"].includes(status)) {
        throw new Error(text(root.message) ||
            text(root.detail) ||
            "Request gagal diproses.");
    }
    return response;
}
function queryUrl(path: string, params: Record<string, string | number | boolean | null | undefined>): string {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value === null ||
            value === undefined ||
            value === "") {
            return;
        }
        query.set(key, String(value));
    });
    const serialized = query.toString();
    return serialized
        ? `${path}?${serialized}`
        : path;
}
async function collectUserDirectory<T>(
    path: string,
    normalize: (raw: unknown) => T,
    params: Record<string, string | number | boolean | null | undefined>,
    signal?: AbortSignal
): Promise<T[]> {
    const requestedPage = Number(params.page);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 100));
    if (Number.isFinite(requestedPage) &&
        requestedPage > 0) {
        const response = await apiGetJson<unknown>(
            queryUrl(path, {
                ...params,
                page: Math.floor(requestedPage),
                limit,
            }),
            signal ? { signal } : undefined
        );
        return listFromResponse(response).map(normalize);
    }
    const output: T[] = [];
    const seen = new Set<string>();
    for (let page = 1; page <= 100; page += 1) {
        const response = await apiGetJson<unknown>(
            queryUrl(path, {
                ...params,
                page,
                limit,
            }),
            signal ? { signal } : undefined
        );
        const rows = listFromResponse(response);
        let added = 0;
        rows.forEach((raw) => {
            const value = normalize(raw);
            const record = value as Record<string, unknown>;
            const key = text(record.id) ||
                text(record.nik) ||
                text(record.username) ||
                `${page}:${output.length}`;
            if (seen.has(key)) {
                return;
            }
            seen.add(key);
            output.push(value);
            added += 1;
        });
        if (
            rows.length === 0 ||
            added === 0
        ) {
            break;
        }
    }
    return output;
}
export function normalizeStudentUser(raw: unknown): StudentUser {
    const value = objectOf(raw);
    return {
        id: idOf(value.id ??
            value.user_id ??
            value.student_id),
        nama_lengkap: text(value.nama_lengkap ??
            value.fullname),
        nisn: text(value.nisn),
        nik: text(value.nik),
        username: text(value.username) ||
            text(value.nik) ||
            text(value.nisn),
        izin_login: booleanOf(value.izin_login, true),
        status_aktif: booleanOf(value.status_aktif, true),
        classroom_id: classroomIdFromResponse(value.classroom_id),
        nama_kelas: text(value.nama_kelas ??
            value.classroom_name),
    };
}
export function normalizeStaffUser(raw: unknown): StaffUser {
    const value = objectOf(raw);
    return {
        id: idOf(value.id ??
            value.user_id ??
            value.staff_id),
        nama_lengkap: text(value.nama_lengkap ??
            value.fullname),
        nik: text(value.nik),
        nip: text(value.nip),
        jabatan: text(value.jabatan ??
            value.position),
        username: text(value.username) ||
            text(value.nik) ||
            text(value.nisn),
        izin_login: booleanOf(value.izin_login, true),
    };
}
function studentUpdatePayload(data: StudentUserUpdateInput) {
    const username = text(data.username) ||
        text(data.nik) ||
        text(data.nisn);
    if (!username) {
        throw new Error("Username akun siswa tidak dapat dibuat otomatis karena username, NIK, dan NIS semuanya kosong.");
    }
    const payload: {
        username: string;
        password?: string;
        izin_login: boolean;
        classroom_id: number;
        status_aktif: boolean;
    } = {
        username,
        izin_login: Boolean(data.izin_login),
        classroom_id: classroomIdForRequest(data.classroom_id),
        status_aktif: Boolean(data.status_aktif),
    };
    const password = rawString(data.password);
    if (password.trim()) {
        payload.password = password;
    }
    return payload;
}
function staffUpdatePayload(data: StaffUserUpdateInput) {
    const username = text(data.username);
    if (!username)
        throw new Error("Username akun staff kosong.");
    const payload: {
        username: string;
        password?: string;
        izin_login: boolean;
    } = { username, izin_login: Boolean(data.izin_login) };
    const password = rawString(data.password);
    if (password.trim())
        payload.password = password;
    return payload;
}
export async function fetchStudentUsers(
    params: StudentUserQuery = {}
): Promise<StudentUser[]> {
    return collectUserDirectory(
        STUDENTS,
        normalizeStudentUser,
        {
            status_aktif: params.status_aktif,
            classroom_id: params.classroom_id,
            izin_login: params.izin_login,
            search: text(params.search),
            page: params.page,
            limit: params.limit,
        },
        params.signal
    );
}
export async function fetchStaffUsers(
    params: StaffUserQuery = {}
): Promise<StaffUser[]> {
    return collectUserDirectory(
        STAFF,
        normalizeStaffUser,
        {
            jabatan: text(params.jabatan),
            izin_login: params.izin_login,
            search: text(params.search),
            page: params.page,
            limit: params.limit,
        },
        params.signal
    );
}
export async function updateStudentUser(userId: UserId, data: StudentUserUpdateInput): Promise<StudentUser | null> {
    assertUserId(userId);
    const response = ensureSuccess(await apiRequestJson<unknown>(`${STUDENTS}/${encodeURIComponent(String(userId))}`, {
        method: "PUT",
        jsonBody: studentUpdatePayload(data),
    }));
    const raw = detailFromResponse(response);
    return raw
        ? normalizeStudentUser(raw)
        : null;
}
export async function updateStaffUser(userId: UserId, data: StaffUserUpdateInput): Promise<StaffUser | null> {
    assertUserId(userId);
    const response = ensureSuccess(await apiRequestJson<unknown>(`${STAFF}/${encodeURIComponent(String(userId))}`, {
        method: "PUT",
        jsonBody: staffUpdatePayload(data),
    }));
    const raw = detailFromResponse(response);
    return raw
        ? normalizeStaffUser(raw)
        : null;
}
