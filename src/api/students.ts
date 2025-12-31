import { apiGetJson, apiRequestJson } from "./http";

export interface ApiStudentsResponse {
  status: string;
  data: ApiStudent[];
}

export interface ApiStudent {
  studentid: number;
  schoolyearid?: string | number | null;
  classid?: string | number | null;
  student_number?: string | null;
  fullname?: string | null;
  nickname?: string | null;
  birthplace?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  religion?: string | null;
  nationality?: string | null;
  siblings_full?: string | number | null;
  siblings_step?: string | number | null;
  siblings_adopted?: string | number | null;
  home_language?: string | null;
  address?: string | null;
  living_with?: string | null;
  distance_km?: string | number | null;
  photo?: string | null;
  status?: string | null;
  datejoin?: string | null;
  studentfeeamount?: number | null;
  contract?: string | null;
  contact?: string | null;
  schoolyear?: {
    schoolyearid: number;
    schoolyear?: string | null;
    desc?: string | null;
    is_active?: string | number | boolean | null;
  } | null;
  class?: {
    classid: number;
    classname?: string | null;
    gradelevel?: string | null;
    capacity?: string | number | null;
    isactive?: boolean | null;
  } | null;
  parent?: {
    parentid: number;
    name?: string | null;
    status?: string | null; // father/mother
    contact?: string | null;
    occupation?: string | null;
    education?: string | null;
  } | null;
  physical_records?: {
    physical_recordid: number;
    height_cm?: string | number | null;
    weight_kg?: string | number | null;
    blood_type?: string | null;
    medical_history?: string | null;
  } | null;
}

export async function fetchStudents(): Promise<ApiStudent[]> {
  const res = await apiGetJson<ApiStudentsResponse>("/api/students");
  return Array.isArray(res.data) ? res.data : [];
}

export interface StudentUpsertRequest {
  // NOTE: backend API ini tampaknya menggunakan POST /api/students untuk create maupun update
  // (update ditentukan oleh keberadaan studentid). Field ini optional agar create tetap bersih.
  studentid?: string | number | null;
  schoolyearid?: string | number | null;
  classid?: string | number | null;
  student_number?: string | null;
  fullname?: string | null;
  nickname?: string | null;
  birthplace?: string | null;
  birthdate?: string | null;
  gender?: string | null;
  religion?: string | null;
  nationality?: string | null;
  siblings_full?: string | number | null;
  siblings_step?: string | number | null;
  siblings_adopted?: string | number | null;
  home_language?: string | null;
  address?: string | null;
  living_with?: string | null;
  distance_km?: string | number | null;
  status?: string | null;
  datejoin?: string | null;
  contact?: string | null;
  studentfeeamount?: number | null;
  contract?: string | null;
}

type ApiWriteResponse = {
  status?: "success" | "error" | string;
  message?: string;
  data?: unknown;
};

function assertWriteSuccess(res: ApiWriteResponse) {
  // Beberapa endpoint Laravel sering membalas HTTP 200 walau gagal,
  // dengan payload { status: 'error', message: '...' }.
  if (res && typeof res === "object" && "status" in res) {
    const status = String(res.status ?? "").toLowerCase();
    if (status && status !== "success") {
      throw new Error(res.message || `Request failed (${res.status})`);
    }
  }
  return res;
}

export function uiStatusToApiStatus(value?: string | null) {
  if (!value) return "student";
  const lower = value.toLowerCase();
  if (lower === "aktif") return "student";
  if (lower === "lulus") return "graduated";
  if (lower === "pindah") return "moved";
  if (lower === "keluar") return "out";
  return value;
}

export async function createStudent(payload: StudentUpsertRequest) {
  const res = await apiRequestJson<ApiWriteResponse>("/api/students", {
    method: "POST",
    jsonBody: payload,
  });
  return assertWriteSuccess(res);
}

export async function updateStudent(
  studentId: number | string,
  payload: StudentUpsertRequest
) {
  // Server membalas 405 untuk PUT /api/students dan 404 untuk /api/students/{id}.
  // Jadi kita lakukan upsert via POST /api/students + studentid.
  const res = await apiRequestJson<ApiWriteResponse>("/api/students", {
    method: "POST",
    jsonBody: {
      ...payload,
      studentid: studentId,
    },
  });
  return assertWriteSuccess(res);
}

export async function deleteStudent(studentId: number | string) {
  return apiRequestJson<unknown>(`/api/students/${studentId}`, {
    method: "DELETE",
  });
}

function isoDateToYmd(value?: string | null) {
  if (!value) return "";
  return value.length >= 10 ? value.slice(0, 10) : value;
}

function toStringOrZero(value: unknown) {
  if (value === null || value === undefined || value === "") return "0";
  return String(value);
}

function normalizeStatus(value?: string | null) {
  if (!value) return "Aktif";
  const lower = value.toLowerCase();
  if (lower === "student" || lower === "active" || lower === "aktif")
    return "Aktif";
  if (lower === "graduated" || lower === "lulus") return "Lulus";
  if (lower === "moved" || lower === "pindah") return "Pindah";

  // fallback: capitalize first letter
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function mapStudentToBukuInduk(student: ApiStudent) {
  const parent = student.parent;
  const physical = student.physical_records;

  const classLabel =
    student.class?.gradelevel ||
    student.class?.classname ||
    (student.classid ? `Kelas ${student.classid}` : "-");

  const phone = parent?.contact || student.contact || "";
  const distance =
    student.distance_km === null ||
    student.distance_km === undefined ||
    student.distance_km === ""
      ? ""
      : String(student.distance_km).includes("km")
      ? String(student.distance_km)
      : `${student.distance_km} km`;

  const father = parent?.status?.toLowerCase() === "father" ? parent : null;
  const mother = parent?.status?.toLowerCase() === "mother" ? parent : null;

  return {
    id: String(student.studentid),
    status: normalizeStatus(student.status),
    kelasId: student.classid ? String(student.classid) : "",

    peserta_didik: {
      nama_lengkap: student.fullname ?? "",
      nama_panggilan: student.nickname ?? "",
      jenis_kelamin: student.gender ?? "",
      tempat_lahir: student.birthplace ?? "",
      tanggal_lahir: isoDateToYmd(student.birthdate),
      agama: student.religion ?? "",
      kewarganegaraan: student.nationality ?? "",
      jumlah_saudara: {
        kandung: toStringOrZero(student.siblings_full),
        tiri: toStringOrZero(student.siblings_step),
        angkat: toStringOrZero(student.siblings_adopted),
      },
      bahasa_sehari_hari: student.home_language ?? "",
      keadaan_jasmani: {
        berat_badan: physical?.weight_kg ? String(physical.weight_kg) : "",
        tinggi_badan: physical?.height_cm ? String(physical.height_cm) : "",
        golongan_darah: physical?.blood_type ?? "",
        riwayat_penyakit: physical?.medical_history ?? "",
      },
      alamat_rumah: student.address ?? "",
      telepon_hp: phone,
      status_tempat_tinggal: student.living_with ?? "",
      jarak_ke_sekolah: distance,
      nomor_induk: student.student_number ?? "",
      kelas: classLabel,
    },

    orang_tua: {
      ayah: {
        nama: father?.name ?? "",
        pendidikan: father?.education ?? "",
        pekerjaan: father?.occupation ?? "",
      },
      ibu: {
        nama: mother?.name ?? "",
        pendidikan: mother?.education ?? "",
        pekerjaan: mother?.occupation ?? "",
      },
    },

    wali: {
      nama: "",
      hubungan_keluarga: "",
      pendidikan_tertinggi: "",
      pekerjaan: "",
    },

    perkembangan_peserta_didik: {
      pendidikan_sebelumnya: "",
      masuk_peserta_didik_baru: {
        asal_peserta_didik: "",
        nama_lembaga: "",
        alamat_lembaga: "",
      },
      pindah_dari_lembaga_lain: {
        nama_lembaga_asal: "",
        alamat_lembaga_asal: "",
        dari_kelompok_umur: "",
      },
      diterima_di_lembaga_ini: {
        tanggal_diterima: isoDateToYmd(student.datejoin),
        kelompok_umur: classLabel,
      },
      prestasi_belajar: "",
      keadaan_jasmani_per_tahun: [],
    },

    meninggalkan_lembaga: {
      tamat_belajar: {
        tahun_pelajaran: "",
        nomor_tanggal_surat: "",
        melanjutkan_ke_lembaga: "",
      },
      pindah_lembaga: {
        dari_kelompok_umur: "",
        ke_lembaga: "",
        tingkat_kelompok_umur: "",
        tanggal_pindah: "",
      },
      keluar_lembaga: {
        tanggal: "",
        sebab_alasan: "",
      },
    },

    lain_lain: {
      catatan_penting: "",
    },

    originalApi: student,
  };
}
