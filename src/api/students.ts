import { apiGetJson, apiRequestJson } from "./http";
const BASE = "/api/students";
export type StudentId = number | string;
export type ClassroomId = number | string;
type Obj = Record<string, unknown>;
export interface StudentClassroom {
    id: ClassroomId | null;
    nama_kelas: string;
}
export interface StudentParent {
    nama_ayah: string;
    pekerjaan_ayah: string;
    nama_ibu: string;
    pekerjaan_ibu: string;
    no_hp_ortu: string;
    pendidikan_ayah: string;
    pendidikan_ibu: string;
    nama_wali: string;
    hubungan_keluarga_wali: string;
    pendidikan_wali: string;
    pekerjaan_wali: string;
    kontak_ayah?: string;
    kontak_ibu?: string;
    kontak_wali?: string;
}
export interface StudentDevelopmentHistory {
    tahun: string;
    berat_badan: number;
    tinggi_badan: number;
    penyakit: string;
    kelainan_jiwa: string;
}
export interface StudentDevelopment {
    berat_badan: number;
    tinggi_badan: number;
    catatan_kesehatan: string;
    penyakit: string;
    golongan_darah: string;
    prestasi_belajar: string;
    prestasi_belajar_sebelumnya?: string;
    riwayat_perkembangan: StudentDevelopmentHistory[];
}
export interface StudentStatus {
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
}
export interface StudentPayload {
    nisn: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    agama: string;
    alamat_lengkap: string;
    no_telepon_rumah: string;
    foto: string;
    nama_panggilan: string;
    kewarganegaraan: string;
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
    nik: string;
    nama_lengkap: string;
    classroom_id: ClassroomId | null;
    parent: StudentParent;
    dev: StudentDevelopment;
    status: StudentStatus;
}
export interface Student extends StudentPayload {
    id: StudentId | null;
    classroom: StudentClassroom | null;
}
export interface StudentUpdateRequest {
    nisn: string;
    tempat_lahir: string;
    tanggal_lahir: string;
    jenis_kelamin: string;
    agama: string;
    alamat_lengkap: string;
    no_telepon_rumah: string;
    foto: string;
    nama_panggilan: string;
    kewarganegaraan: string;
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
    nama_lengkap: string;
    parent: {
        nama_ayah: string;
        pekerjaan_ayah: string;
        nama_ibu: string;
        pekerjaan_ibu: string;
        no_hp_ortu: string;
        pendidikan_ayah: string;
        pendidikan_ibu: string;
        nama_wali: string;
        hubungan_keluarga_wali: string;
        pendidikan_wali: string;
        pekerjaan_wali: string;
    };
    dev: {
        berat_badan: number;
        tinggi_badan: number;
        catatan_kesehatan: string;
        penyakit: string;
        golongan_darah: string;
        prestasi_belajar: string;
        riwayat_perkembangan: StudentDevelopmentHistory[];
    };
    status: StudentStatus;
}
export interface StudentCreateRequest extends StudentUpdateRequest {
    nik: string;
}
export interface StudentStatusUpdateInput {
    status_aktif: boolean;
    tanggal_keluar: string;
    alasan_keluar: string;
}
export type StudentEducationState = "current" | "graduated" | "left";
export interface StudentEducationMeta {
    id: StudentId;
    education_state: StudentEducationState;
    tahun_pelajaran: string;
    tanggal_keluar: string;
    alasan_keluar: string;
    tanggal_lahir: string;
    no_telepon_rumah: string;
    parent: StudentParent;
}
const STUDENT_META_TTL = 5 * 60000;
const studentMetaCache = new Map<string, {
    expiresAt: number;
    value: StudentEducationMeta;
}>();
export function invalidateStudentEducationMetaCache(studentIds?: StudentId[]): void {
    if (!studentIds?.length) {
        studentMetaCache.clear();
        return;
    }
    studentIds.forEach((studentId) => {
        studentMetaCache.delete(String(studentId));
    });
}
function cachedStudentEducationMeta(studentId: StudentId): StudentEducationMeta | null {
    const key = String(studentId);
    const cached = studentMetaCache.get(key);
    if (!cached) {
        return null;
    }
    if (cached.expiresAt <= Date.now()) {
        studentMetaCache.delete(key);
        return null;
    }
    return cached.value;
}
function storeStudentEducationMeta(value: StudentEducationMeta): void {
    studentMetaCache.set(String(value.id), {
        expiresAt: Date.now() + STUDENT_META_TTL,
        value,
    });
}
export interface StudentEducationUpdateInput {
    education_state?: StudentEducationState;
    tahun_pelajaran?: string;
    tanggal_keluar?: string;
    alasan_keluar?: string;
}

export interface StudentQuery {
    search?: string | null;
    status_aktif?: boolean | null;
    page?: number | null;
    limit?: number | null;
    signal?: AbortSignal;
}
const objectOf = (value: unknown): Obj => value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
    ? (value as Obj)
    : {};
const rawString = (value: unknown): string => value === null || value === undefined
    ? ""
    : String(value);
const trim = (value: unknown): string => rawString(value).trim();
const firstText = (...values: unknown[]): string => {
    for (const value of values) {
        const normalized = trim(value);
        if (normalized) {
            return normalized;
        }
    }
    return "";
};
const numberOf = (value: unknown): number => {
    if (value === null ||
        value === undefined ||
        value === "") {
        return 0;
    }
    const normalized = Number(value);
    return Number.isFinite(normalized)
        ? normalized
        : 0;
};
const booleanOf = (value: unknown, fallback = true): boolean => {
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
const idOf = (...values: unknown[]): StudentId | null => {
    for (const value of values) {
        if (typeof value === "number" &&
            Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string" &&
            value.trim()) {
            return value.trim();
        }
    }
    return null;
};
const dateOnly = (value: unknown): string => trim(value).slice(0, 10);
const digitsOnly = (value: unknown): string => rawString(value).replace(/\D/g, "");
function listFromResponse(response: unknown): unknown[] {
    if (Array.isArray(response)) {
        return response;
    }
    const root = objectOf(response);
    for (const key of [
        "data",
        "students",
        "items",
        "results",
    ]) {
        if (Array.isArray(root[key])) {
            return root[key] as unknown[];
        }
        const nested = objectOf(root[key]);
        for (const nestedKey of [
            "data",
            "students",
            "items",
            "results",
        ]) {
            if (Array.isArray(nested[nestedKey])) {
                return nested[nestedKey] as unknown[];
            }
        }
    }
    return [];
}
function queryUrl(
    path: string,
    params: Record<string, string | number | boolean | null | undefined>
): string {
    const query = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") {
            return;
        }

        query.set(key, String(value));
    });

    const serialized = query.toString();

    return serialized ? `${path}?${serialized}` : path;
}

async function collectStudents(params: StudentQuery): Promise<Student[]> {
    const requestedPage = Number(params.page);
    const limit = Math.min(100, Math.max(1, Number(params.limit) || 100));

    const loadPage = async (page: number) => {
        const response = await apiGetJson<unknown>(
            queryUrl(BASE, {
                search: trim(params.search),
                status_aktif: params.status_aktif,
                page,
                limit,
            }),
            params.signal ? { signal: params.signal } : undefined
        );

        return listFromResponse(response);
    };

    if (Number.isFinite(requestedPage) && requestedPage > 0) {
        return (await loadPage(Math.floor(requestedPage))).map(normalizeStudent);
    }

    const output: Student[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= 100; page += 1) {
        const rows = await loadPage(page);
        let added = 0;

        rows.forEach((raw, index) => {
            const value = objectOf(raw);
            const key =
                trim(value.id) ||
                trim(value.nisn) ||
                trim(value.nik) ||
                `${page}:${index}`;

            if (seen.has(key)) {
                return;
            }

            seen.add(key);
            output.push(normalizeStudent(raw));
            added += 1;
        });

        if (
            rows.length < limit ||
            added === 0
        ) {
            break;
        }
    }

    return output;
}

function detailFromResponse(response: unknown): unknown | null {
    if (Array.isArray(response)) {
        return response[0] ?? null;
    }
    const root = objectOf(response);
    for (const key of [
        "data",
        "student",
        "item",
        "result",
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
    const status = firstText(root.status).toLowerCase();
    if (root.success === false ||
        ["error", "failed", "fail"].includes(status)) {
        throw new Error(firstText(root.message, root.detail) ||
            "Request gagal diproses.");
    }
    return response;
}
function normalizeClassroom(raw: unknown, fallbackId: unknown = null, fallbackName: unknown = ""): StudentClassroom | null {
    const value = objectOf(raw);
    const id = idOf(value.id, value.classroom_id, fallbackId);
    const nama_kelas = firstText(value.nama_kelas, value.name, fallbackName);
    if (id === null &&
        !nama_kelas) {
        return null;
    }
    return {
        id,
        nama_kelas,
    };
}
function normalizeParent(raw: unknown): StudentParent {
    const parent = objectOf(raw);
    return {
        nama_ayah: firstText(parent.nama_ayah),
        pekerjaan_ayah: firstText(parent.pekerjaan_ayah),
        nama_ibu: firstText(parent.nama_ibu),
        pekerjaan_ibu: firstText(parent.pekerjaan_ibu),
        no_hp_ortu: firstText(parent.no_hp_ortu),
        pendidikan_ayah: firstText(parent.pendidikan_ayah),
        pendidikan_ibu: firstText(parent.pendidikan_ibu),
        nama_wali: firstText(parent.nama_wali),
        hubungan_keluarga_wali: firstText(parent.hubungan_keluarga_wali),
        pendidikan_wali: firstText(parent.pendidikan_wali),
        pekerjaan_wali: firstText(parent.pekerjaan_wali),
        kontak_ayah: firstText(parent.kontak_ayah),
        kontak_ibu: firstText(parent.kontak_ibu),
        kontak_wali: firstText(parent.kontak_wali),
    };
}
function normalizeDevelopment(raw: unknown): StudentDevelopment {
    const development = objectOf(raw);
    const history = Array.isArray(development.riwayat_perkembangan)
        ? development.riwayat_perkembangan
        : [];
    return {
        berat_badan: numberOf(development.berat_badan),
        tinggi_badan: numberOf(development.tinggi_badan),
        catatan_kesehatan: firstText(development.catatan_kesehatan),
        penyakit: firstText(development.penyakit),
        golongan_darah: firstText(development.golongan_darah),
        prestasi_belajar: firstText(development.prestasi_belajar),
        prestasi_belajar_sebelumnya: firstText(development.prestasi_belajar_sebelumnya),
        riwayat_perkembangan: history.map((entry) => {
            const item = objectOf(entry);
            return {
                tahun: firstText(item.tahun),
                berat_badan: numberOf(item.berat_badan),
                tinggi_badan: numberOf(item.tinggi_badan),
                penyakit: firstText(item.penyakit),
                kelainan_jiwa: firstText(item.kelainan_jiwa),
            };
        }),
    };
}
function normalizeStatus(raw: unknown): StudentStatus {
    const status = objectOf(raw);
    return {
        status_aktif: booleanOf(status.status_aktif, true),
        tanggal_masuk: dateOnly(status.tanggal_masuk),
        tanggal_keluar: dateOnly(status.tanggal_keluar),
        alasan_keluar: firstText(status.alasan_keluar),
        kelompok_umur: firstText(status.kelompok_umur),
        tahun_pelajaran: firstText(status.tahun_pelajaran),
        nomor_surat_keterangan: firstText(status.nomor_surat_keterangan),
        lembaga_lanjutan: firstText(status.lembaga_lanjutan),
        tanggal_pindah: dateOnly(status.tanggal_pindah),
        dari_kelompok_umur: firstText(status.dari_kelompok_umur),
        ke_lembaga: firstText(status.ke_lembaga),
        tingkat_kelompok_umur: firstText(status.tingkat_kelompok_umur),
    };
}
export function normalizeStudent(raw: unknown): Student {
    const student = objectOf(raw);
    const pribadi = objectOf(student.pribadi);
    const classroom = normalizeClassroom(student.classroom, student.classroom_id, student.nama_kelas);
    return {
        id: idOf(student.id, student.student_id, student.studentid),
        nisn: firstText(student.nisn),
        tempat_lahir: firstText(student.tempat_lahir),
        tanggal_lahir: dateOnly(student.tanggal_lahir ??
            pribadi.tanggal_lahir),
        jenis_kelamin: firstText(student.jenis_kelamin),
        agama: firstText(student.agama),
        alamat_lengkap: firstText(student.alamat_lengkap),
        no_telepon_rumah: firstText(student.no_telepon_rumah),
        foto: rawString(student.foto),
        nama_panggilan: firstText(student.nama_panggilan),
        kewarganegaraan: firstText(student.kewarganegaraan),
        bahasa_sehari_hari: firstText(student.bahasa_sehari_hari),
        status_tempat_tinggal: firstText(student.status_tempat_tinggal),
        jarak_ke_sekolah: numberOf(student.jarak_ke_sekolah),
        jumlah_saudara_kandung: numberOf(student.jumlah_saudara_kandung),
        jumlah_saudara_tiri: numberOf(student.jumlah_saudara_tiri),
        jumlah_saudara_angkat: numberOf(student.jumlah_saudara_angkat),
        asal_peserta_didik: firstText(student.asal_peserta_didik),
        nama_lembaga: firstText(student.nama_lembaga),
        alamat_lembaga: firstText(student.alamat_lembaga),
        nama_lembaga_asal: firstText(student.nama_lembaga_asal),
        alamat_lembaga_asal: firstText(student.alamat_lembaga_asal),
        kelompok_umur_sebelumnya: firstText(student.kelompok_umur_sebelumnya),
        catatan_penting: firstText(student.catatan_penting),
        nik: firstText(student.nik, pribadi.nik),
        nama_lengkap: firstText(student.nama_lengkap, pribadi.nama_lengkap),
        classroom_id: classroom?.id ??
            idOf(student.classroom_id),
        classroom,
        parent: normalizeParent(student.parent ??
            student.parent_detail),
        dev: normalizeDevelopment(student.dev ??
            student.development),
        status: normalizeStatus(student.status),
    };
}
function parentRequest(parent: StudentParent): StudentUpdateRequest["parent"] {
    return {
        nama_ayah: trim(parent?.nama_ayah),
        pekerjaan_ayah: trim(parent?.pekerjaan_ayah),
        nama_ibu: trim(parent?.nama_ibu),
        pekerjaan_ibu: trim(parent?.pekerjaan_ibu),
        no_hp_ortu: trim(parent?.no_hp_ortu),
        pendidikan_ayah: trim(parent?.pendidikan_ayah),
        pendidikan_ibu: trim(parent?.pendidikan_ibu),
        nama_wali: trim(parent?.nama_wali),
        hubungan_keluarga_wali: trim(parent?.hubungan_keluarga_wali),
        pendidikan_wali: trim(parent?.pendidikan_wali),
        pekerjaan_wali: trim(parent?.pekerjaan_wali),
    };
}
function developmentRequest(development: StudentDevelopment): StudentUpdateRequest["dev"] {
    return {
        berat_badan: numberOf(development?.berat_badan),
        tinggi_badan: numberOf(development?.tinggi_badan),
        catatan_kesehatan: trim(development?.catatan_kesehatan),
        penyakit: trim(development?.penyakit),
        golongan_darah: trim(development?.golongan_darah),
        prestasi_belajar: trim(development?.prestasi_belajar),
        riwayat_perkembangan: (development
            ?.riwayat_perkembangan ??
            []).map((entry) => ({
            tahun: trim(entry?.tahun),
            berat_badan: numberOf(entry?.berat_badan),
            tinggi_badan: numberOf(entry?.tinggi_badan),
            penyakit: trim(entry?.penyakit),
            kelainan_jiwa: trim(entry?.kelainan_jiwa),
        })),
    };
}
function statusRequest(status: StudentStatus): StudentStatus {
    const normalized: StudentStatus = {
        status_aktif: Boolean(status?.status_aktif),
        tanggal_masuk: dateOnly(status?.tanggal_masuk),
        tanggal_keluar: dateOnly(status?.tanggal_keluar),
        alasan_keluar: trim(status?.alasan_keluar),
        kelompok_umur: trim(status?.kelompok_umur),
        tahun_pelajaran: trim(status?.tahun_pelajaran),
        nomor_surat_keterangan: trim(status?.nomor_surat_keterangan),
        lembaga_lanjutan: trim(status?.lembaga_lanjutan),
        tanggal_pindah: dateOnly(status?.tanggal_pindah),
        dari_kelompok_umur: trim(status?.dari_kelompok_umur),
        ke_lembaga: trim(status?.ke_lembaga),
        tingkat_kelompok_umur: trim(status?.tingkat_kelompok_umur),
    };
    const educationState = getStudentEducationState({
        status: normalized,
    });
    if (educationState === "graduated" &&
        !normalized.alasan_keluar) {
        normalized.alasan_keluar =
            "Lulus";
    }
    return normalized;
}
function validateWritableStudent(data: StudentPayload, create: boolean): void {
    const nisn = digitsOnly(data?.nisn);
    if (!/^\d{10}$/.test(nisn))
        throw new Error("NIS harus terdiri dari tepat 10 digit.");
    if (!trim(data?.nama_lengkap))
        throw new Error("Nama lengkap siswa wajib diisi.");
    if (create && !/^\d{16}$/.test(digitsOnly(data?.nik)))
        throw new Error("NIK harus terdiri dari tepat 16 digit.");
}
function updateRequest(data: StudentPayload): StudentUpdateRequest {
    validateWritableStudent(data, false);
    return {
        nisn: digitsOnly(data.nisn),
        tempat_lahir: trim(data.tempat_lahir),
        tanggal_lahir: dateOnly(data.tanggal_lahir),
        jenis_kelamin: trim(data.jenis_kelamin),
        agama: trim(data.agama),
        alamat_lengkap: trim(data.alamat_lengkap),
        no_telepon_rumah: trim(data.no_telepon_rumah),
        foto: rawString(data.foto),
        nama_panggilan: trim(data.nama_panggilan),
        kewarganegaraan: trim(data.kewarganegaraan),
        bahasa_sehari_hari: trim(data.bahasa_sehari_hari),
        status_tempat_tinggal: trim(data.status_tempat_tinggal),
        jarak_ke_sekolah: numberOf(data.jarak_ke_sekolah),
        jumlah_saudara_kandung: numberOf(data.jumlah_saudara_kandung),
        jumlah_saudara_tiri: numberOf(data.jumlah_saudara_tiri),
        jumlah_saudara_angkat: numberOf(data.jumlah_saudara_angkat),
        asal_peserta_didik: trim(data.asal_peserta_didik),
        nama_lembaga: trim(data.nama_lembaga),
        alamat_lembaga: trim(data.alamat_lembaga),
        nama_lembaga_asal: trim(data.nama_lembaga_asal),
        alamat_lembaga_asal: trim(data.alamat_lembaga_asal),
        kelompok_umur_sebelumnya: trim(data.kelompok_umur_sebelumnya),
        catatan_penting: trim(data.catatan_penting),
        nama_lengkap: trim(data.nama_lengkap),
        parent: parentRequest(data.parent),
        dev: developmentRequest(data.dev),
        status: statusRequest(data.status),
    };
}
function createRequest(data: StudentPayload): StudentCreateRequest {
    validateWritableStudent(data, true);
    return { ...updateRequest(data), nik: digitsOnly(data.nik) };
}
function statusUpdateRequest(data: StudentStatusUpdateInput): StudentStatusUpdateInput {
    return {
        status_aktif: Boolean(data?.status_aktif),
        tanggal_keluar: dateOnly(data?.tanggal_keluar),
        alasan_keluar: trim(data?.alasan_keluar),
    };
}
function validId(value: StudentId): boolean {
    if (typeof value === "number") {
        return Number.isFinite(value);
    }
    return Boolean(trim(value));
}
function assertStudentId(studentId: StudentId): void {
    if (!validId(studentId)) {
        throw new Error("ID siswa tidak valid.");
    }
}
export async function fetchStudents(
    params: StudentQuery = {}
): Promise<Student[]> {
    return collectStudents(params);
}
export async function fetchStudentById(studentId: StudentId, signal?: AbortSignal): Promise<Student> {
    assertStudentId(studentId);
    const response = await apiGetJson<unknown>(`${BASE}/${encodeURIComponent(String(studentId))}`, { signal });
    const raw = detailFromResponse(response);
    if (!raw) {
        throw new Error("Data siswa tidak ditemukan.");
    }
    return normalizeStudent(raw);
}
export async function createStudent(data: StudentPayload): Promise<Student | null> {
    const response = ensureSuccess(await apiRequestJson<unknown>(BASE, {
        method: "POST",
        jsonBody: createRequest(data),
    }));
    const raw = detailFromResponse(response);
    return raw
        ? normalizeStudent(raw)
        : null;
}
export async function updateStudent(studentId: StudentId, data: StudentPayload): Promise<Student | null> {
    assertStudentId(studentId);
    const response = ensureSuccess(await apiRequestJson<unknown>(`${BASE}/${encodeURIComponent(String(studentId))}`, {
        method: "PUT",
        jsonBody: updateRequest(data),
    }));
    const raw = detailFromResponse(response);
    invalidateStudentEducationMetaCache([studentId]);
    return raw
        ? normalizeStudent(raw)
        : null;
}
export async function updateStudentAcademicYear(studentId: StudentId, tahunPelajaran: string, currentStudent?: Student | null): Promise<Student> {
    assertStudentId(studentId);
    const year = trim(tahunPelajaran);
    if (!year) {
        throw new Error("Tahun ajaran siswa tidak valid.");
    }
    const current = currentStudent &&
        currentStudent.id !== null &&
        String(currentStudent.id) === String(studentId)
        ? currentStudent
        : await fetchStudentById(studentId);
    if (trim(current.status.tahun_pelajaran) === year) {
        return current;
    }
    const updated = await updateStudent(studentId, {
        ...current,
        status: {
            ...current.status,
            tahun_pelajaran: year,
        },
    });
    if (updated) {
        return updated;
    }
    return fetchStudentById(studentId);
}
export async function deleteStudent(studentId: StudentId): Promise<void> {
    assertStudentId(studentId);
    ensureSuccess(await apiRequestJson<unknown>(`${BASE}/${encodeURIComponent(String(studentId))}`, {
        method: "DELETE",
    }));
    invalidateStudentEducationMetaCache([studentId]);
}
export async function updateStudentStatus(studentId: StudentId, data: StudentStatusUpdateInput): Promise<unknown> {
    assertStudentId(studentId);
    const result = ensureSuccess(await apiRequestJson<unknown>(`${BASE}/${encodeURIComponent(String(studentId))}/status`, {
        method: "PATCH",
        jsonBody: statusUpdateRequest(data),
    }));
    invalidateStudentEducationMetaCache([studentId]);
    return result;
}
export async function fetchStudentParent(studentId: StudentId): Promise<StudentParent> {
    assertStudentId(studentId);
    const response = await apiGetJson<unknown>(`${BASE}/${encodeURIComponent(String(studentId))}/parent`);
    const root = objectOf(response);
    const raw = root.parent ??
        root.parent_detail ??
        objectOf(root.data).parent ??
        objectOf(root.data)
            .parent_detail ??
        root.data ??
        response;
    return normalizeParent(raw);
}
export async function updateStudentParent(studentId: StudentId, data: StudentParent): Promise<unknown> {
    assertStudentId(studentId);
    return ensureSuccess(await apiRequestJson<unknown>(`${BASE}/${encodeURIComponent(String(studentId))}/parent`, {
        method: "PUT",
        jsonBody: parentRequest(data),
    }));
}
export function getStudentEducationState(value: Pick<Student, "status"> | {
    status?: Partial<StudentStatus> | null;
}): StudentEducationState {
    const status = normalizeStatus(value?.status ?? {});
    if (status.status_aktif) {
        return "current";
    }
    const reason = trim(status.alasan_keluar).toLocaleLowerCase("id");
    if (reason.includes("lulus") ||
        reason.includes("tamat")) {
        return "graduated";
    }
    if (reason) {
        return "left";
    }
    if (trim(status.ke_lembaga)) {
        return "left";
    }
    if (trim(status.lembaga_lanjutan) ||
        trim(status.nomor_surat_keterangan)) {
        return "graduated";
    }
    return "graduated";
}
export function studentEducationMeta(student: Student): StudentEducationMeta {
    if (student.id === null) {
        throw new Error("ID siswa tidak valid.");
    }
    return {
        id: student.id,
        education_state: getStudentEducationState(student),
        tahun_pelajaran: trim(student.status.tahun_pelajaran),
        tanggal_keluar: dateOnly(student.status.tanggal_keluar),
        alasan_keluar: trim(student.status.alasan_keluar),
        tanggal_lahir: dateOnly(student.tanggal_lahir),
        no_telepon_rumah: trim(student.no_telepon_rumah),
        parent: student.parent,
    };
}
export async function fetchStudentEducationMetas(studentIds: StudentId[], options: {
    signal?: AbortSignal;
    concurrency?: number;
    fresh?: boolean;
} = {}): Promise<StudentEducationMeta[]> {
    const ids = [
        ...new Set(studentIds.filter(validId).map((value) => String(value))),
    ];
    if (!ids.length) {
        return [];
    }
    const results = new Array<StudentEducationMeta | null>(ids.length).fill(null);
    const pending: Array<{
        id: string;
        index: number;
    }> = [];
    ids.forEach((id, index) => {
        const cached = options.fresh
            ? null
            : cachedStudentEducationMeta(id);
        if (cached) {
            results[index] = cached;
        }
        else {
            pending.push({ id, index });
        }
    });
    if (!pending.length) {
        return results.filter((value): value is StudentEducationMeta => value !== null);
    }
    const concurrency = Math.max(1, Math.min(options.concurrency ?? 3, pending.length));
    let cursor = 0;
    const worker = async () => {
        while (true) {
            if (options.signal?.aborted) {
                return;
            }
            const pendingIndex = cursor;
            cursor += 1;
            if (pendingIndex >= pending.length) {
                return;
            }
            const item = pending[pendingIndex];
            try {
                const student = await fetchStudentById(item.id, options.signal);
                const meta = studentEducationMeta(student);
                storeStudentEducationMeta(meta);
                results[item.index] = meta;
            }
            catch {
                if (options.signal?.aborted) {
                    return;
                }
                results[item.index] = null;
            }
        }
    };
    await Promise.all(Array.from({ length: concurrency }, () => worker()));
    return results.filter((value): value is StudentEducationMeta => value !== null);
}
export async function updateStudentEducation(studentId: StudentId, input: StudentEducationUpdateInput): Promise<Student> {
    const current = await fetchStudentById(studentId);
    const nextStatus: StudentStatus = {
        ...current.status,
    };
    if (input.tahun_pelajaran !== undefined) {
        nextStatus.tahun_pelajaran = trim(input.tahun_pelajaran);
    }
    if (input.education_state === "current") {
        nextStatus.status_aktif = true;
        nextStatus.tanggal_keluar = "";
        nextStatus.alasan_keluar = "";
        nextStatus.ke_lembaga = "";
        nextStatus.lembaga_lanjutan = "";
        nextStatus.nomor_surat_keterangan = "";
    }
    else if (input.education_state ===
        "graduated") {
        nextStatus.status_aktif = false;
        nextStatus.tanggal_keluar =
            dateOnly(input.tanggal_keluar ||
                nextStatus.tanggal_keluar);
        nextStatus.alasan_keluar =
            "Lulus";
        nextStatus.ke_lembaga = "";
        nextStatus.tanggal_pindah = "";
    }
    else if (input.education_state === "left") {
        nextStatus.status_aktif = false;
        nextStatus.tanggal_keluar = dateOnly(input.tanggal_keluar || nextStatus.tanggal_keluar);
        nextStatus.alasan_keluar =
            trim(input.alasan_keluar) ||
                trim(nextStatus.alasan_keluar) ||
                "Pindah / Mengundurkan diri";
        nextStatus.lembaga_lanjutan = "";
        nextStatus.nomor_surat_keterangan = "";
    }
    if (input.education_state &&
        input.education_state !== "current" &&
        !nextStatus.tanggal_keluar) {
        throw new Error("Tanggal keluar wajib diisi untuk status Lulus atau Pindah / Mengundurkan Diri.");
    }
    const updated = await updateStudent(current.id ?? studentId, {
        ...current,
        status: nextStatus,
    });
    if (updated) {
        return updated;
    }
    return fetchStudentById(current.id ?? studentId);
}
