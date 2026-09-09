import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  BookOpenIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAllReportTableRows,
  fetchReportDetailForPrint,
} from "../../../api/report-students";
import {
  fetchAcademicYearOptions,
  fetchCurrentAcademicPeriod,
} from "../../../api/academic-periods";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { adminQueryKeys } from "../../../lib/adminQueryKeys";
import {
  buildAcademicYearOptions,
  fallbackAcademicSemester,
  fallbackAcademicYear,
  resolveAcademicSemester,
  resolveAcademicYear,
} from "../../../lib/academicYear";
import {
  ClassBadge,
  EducationBadge,
  EDUCATION_STATUS_OPTIONS,
  studentAcademicYear,
  studentNis,
} from "../components/StudentEducationMeta";

const STAFF_CACHE_KEY = "ssphere:rapor:staff-actor-cache:v1";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const text = (value) => String(value ?? "").trim();
const keyOf = (value) => String(value ?? "");

const normalized = (value) =>
  text(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

const errorOf = (error) =>
  text(
    error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message
  ) || "Terjadi kesalahan.";

const semesterLabel = (semester) =>
  Number(semester) === 2 ? "Semester II (Genap)" : "Semester I (Ganjil)";

const periodObject = (tahunAjaran, semester) => ({
  tahun_ajaran: tahunAjaran,
  semester: Number(semester) === 2 ? 2 : 1,
  semester_key: Number(semester) === 2 ? "sem2" : "sem1",
  semester_label: semesterLabel(semester),
});

const periodEndDate = (period) => {
  const startYear = Number(String(period?.tahun_ajaran || "").split("/")[0]);

  if (!Number.isFinite(startYear)) return new Date();

  return Number(period?.semester) === 2
    ? new Date(startYear + 1, 5, 30, 23, 59, 59)
    : new Date(startYear, 11, 31, 23, 59, 59);
};

const sameStaff = (staff, teacher) => {
  if (!staff || !teacher) return false;

  if (
    staff.id !== null &&
    staff.id !== undefined &&
    teacher.id !== null &&
    teacher.id !== undefined &&
    String(staff.id) === String(teacher.id)
  ) {
    return true;
  }

  if (
    text(staff.nik) &&
    text(teacher.nik) &&
    text(staff.nik) === text(teacher.nik)
  ) {
    return true;
  }

  return (
    normalized(staff.nama_lengkap) &&
    normalized(staff.nama_lengkap) === normalized(teacher.nama_lengkap)
  );
};

const resolveHomeroomTeacher = (classroom, staffMembers) => {
  const teacher = classroom?.wali_kelas;
  if (!teacher) return null;

  return (
    staffMembers.find((staff) => sameStaff(staff, teacher)) || {
      ...teacher,
      nip: "",
    }
  );
};

const resolveHeadmasterForPeriod = (staffMembers, period) => {
  const end = periodEndDate(period).getTime();

  return (
    staffMembers
      .filter((staff) => normalized(staff.jabatan) === "kepala sekolah")
      .filter((staff) => {
        const joined = text(staff.tanggal_bergabung);
        if (!joined) return true;
        const timestamp = new Date(joined).getTime();
        return Number.isNaN(timestamp) || timestamp <= end;
      })
      .sort((a, b) => {
        const aTime = new Date(text(a.tanggal_bergabung) || 0).getTime() || 0;
        const bTime = new Date(text(b.tanggal_bergabung) || 0).getTime() || 0;
        return bTime - aTime;
      })[0] || null
  );
};

const readStaffCache = () => {
  try {
    const raw = window.localStorage.getItem(STAFF_CACHE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const writeStaffCache = (items) => {
  try {
    window.localStorage.setItem(STAFF_CACHE_KEY, JSON.stringify(items || []));
  } catch {
  }
};

const reportExists = (report) =>
  Boolean(
    report?.status_rapor ||
      report?.created_at ||
      report?.updated_at ||
      report?.history?.length ||
      report?.scores?.length ||
      Number(report?.jumlah_indikator_terisi ?? 0) > 0 ||
      text(report?.catatan)
  );

const expectedIndicatorIds = (report, classroom, period) => {
  const classroomIds = (classroom?.curriculum?.indikator_ids || []).map(keyOf);
  const scoreIds = (report?.scores || []).map((item) => keyOf(item.indicator_id));
  const curriculumYear = text(classroom?.curriculum?.tahun_ajaran);

  if (curriculumYear === period.tahun_ajaran && classroomIds.length > 0) {
    return [...new Set(classroomIds)];
  }

  if (scoreIds.length > 0) return [...new Set(scoreIds)];
  return [...new Set(classroomIds)];
};

const rowStatus = (report, classroom, period, progress) => {
  const expected = new Set(expectedIndicatorIds(report, classroom, period));
  const scoreFilled = new Set(
    (report?.scores || [])
      .map((item) => keyOf(item.indicator_id))
      .filter((id) => expected.size === 0 || expected.has(id))
  ).size;
  const progressFilled = Number(progress?.filled_count ?? 0) || 0;
  const progressTotal = Number(progress?.total_count ?? 0) || 0;
  const filled = Math.max(scoreFilled, progressFilled);
  const total = Math.max(expected.size, progressTotal, filled);
  const hasCatatan =
    Boolean(text(report?.catatan)) || Boolean(progress?.has_catatan);
  const complete = total > 0 && filled >= total && hasCatatan;
  const backendStatus = normalized(progress?.backend_status);
  const isDone =
    backendStatus.includes("sudah") ||
    backendStatus.includes("final") ||
    backendStatus.includes("selesai");
  const isProcess =
    backendStatus.includes("proses") ||
    backendStatus.includes("draft") ||
    backendStatus.includes("draf");

  if (isDone && complete) {
    return {
      label: "Sudah Diisi",
      tone: "success",
      filled,
      total,
      complete: true,
      printable: true,
    };
  }

  if (isDone) {
    return {
      label: "Sudah Diisi · Data Kurang",
      tone: "warning",
      filled,
      total,
      complete: false,
      printable: false,
    };
  }

  if (isProcess || reportExists(report)) {
    return {
      label: complete ? "Proses · Lengkap" : "Proses",
      tone: "warning",
      filled,
      total,
      complete,
      printable: false,
    };
  }

  return {
    label: "Belum Diisi",
    tone: "neutral",
    filled,
    total,
    complete: false,
    printable: false,
  };
};

const buildPrintStudent = (student, report) => ({
  id: report?.student_id ?? student.id,
  class_id: report?.classroom_id ?? student.classroom_id,
  peserta_didik: {
    nomor_induk:
      student.nomor_induk ||
      text(report?.nomor_induk) ||
      text(report?.nis) ||
      text(report?.nisn) ||
      student.nisn ||
      "",
    nama_lengkap:
      text(report?.student_nama) ||
      student.nama_lengkap,
    jenis_kelamin: student.jenis_kelamin,
    keadaan_jasmani: {
      berat_badan: report?.fisik?.berat_badan ?? "",
      tinggi_badan: report?.fisik?.tinggi_badan ?? "",
    },
  },
});

const buildPrintData = (report, indicators, period) => {
  const scoreMap = new Map(
    (report?.scores || []).map((item) => [keyOf(item.indicator_id), item.scale])
  );
  const nilai = Object.fromEntries(
    indicators.map((indicator) => [
      indicator.deskripsi,
      scoreMap.get(keyOf(indicator.id)) || "",
    ])
  );
  const empty = {
    nilai: {},
    catatan: "",
    fisik: { bb: "", tb: "" },
    absen: { s: 0, i: 0, a: 0 },
    komentar_ortu: "",
  };

  return {
    sem1: { ...empty },
    sem2: { ...empty },
    [period.semester_key]: {
      nilai,
      catatan: report?.catatan || "",
      fisik: {
        bb: report?.fisik?.berat_badan ?? "",
        tb: report?.fisik?.tinggi_badan ?? "",
      },
      absen: {
        s: report?.absensi?.sakit ?? 0,
        i: report?.absensi?.izin ?? 0,
        a: report?.absensi?.alpa ?? 0,
      },
      komentar_ortu: "",
    },
  };
};

const resolvePrintIndicators = (report, masterIndicators = []) => {
  const scoreIds = new Set(
    (report?.scores || []).map((item) => keyOf(item.indicator_id))
  );
  const masterById = new Map(
    masterIndicators.map((indicator) => [keyOf(indicator.id), indicator])
  );
  const backendIndicators = Array.isArray(report?.indicators)
    ? report.indicators
    : [];
  const backendById = new Map(
    backendIndicators.map((indicator) => [keyOf(indicator.id), indicator])
  );
  const orderedIds = backendIndicators.length
    ? backendIndicators.map((indicator) => keyOf(indicator.id))
    : (report?.scores || []).map((item) => keyOf(item.indicator_id));

  return [...new Set(orderedIds)]
    .filter((id) => scoreIds.has(id))
    .map((id) => {
      const master = masterById.get(id) || {};
      const backend = backendById.get(id) || {};
      return {
        ...master,
        ...backend,
        id: backend.id ?? master.id ?? id,
        kode: text(backend.kode) || text(master.kode),
        aspek: text(backend.aspek) || text(master.aspek) || "Lainnya",
        sub_aspek:
          text(backend.sub_aspek) || text(master.sub_aspek) || "-",
        deskripsi:
          text(backend.deskripsi) ||
          text(master.deskripsi) ||
          `Indikator ${id}`,
      };
    });
};

const resolvePrintClassroom = (report, row, classMap) => {
  const reportClassId = report?.classroom_id ?? row.student.classroom_id;
  const base =
    classMap.get(keyOf(reportClassId)) ||
    classMap.get(keyOf(row.student.classroom_id)) ||
    row.classroom ||
    {};
  const curriculumBase = base?.curriculum || {};
  const hasReportCurriculum =
    (report?.curriculum_id !== null &&
      report?.curriculum_id !== undefined) ||
    Boolean(text(report?.curriculum_nama));

  return {
    ...base,
    id: reportClassId ?? base?.id ?? null,
    nama_kelas:
      text(report?.classroom_nama) ||
      text(base?.nama_kelas) ||
      row.student.classroom_name ||
      "",
    curriculum: hasReportCurriculum
      ? {
          ...curriculumBase,
          id: report?.curriculum_id ?? curriculumBase?.id ?? null,
          nama_kurikulum:
            text(report?.curriculum_nama) ||
            text(curriculumBase?.nama_kurikulum),
          tahun_ajaran:
            text(report?.tahun_ajaran) ||
            text(curriculumBase?.tahun_ajaran),
        }
      : base?.curriculum || null,
  };
};

const dateTimeLabel = (value) => {
  if (!text(value)) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

function StatusBadge({ status }) {
  const tones = {
    success: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    warning: "bg-amber-50 text-amber-700 ring-amber-100",
    neutral: "bg-slate-100 text-slate-500 ring-slate-200",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset ${
        tones[status.tone] || tones.neutral
      }`}
    >
      {status.label}
    </span>
  );
}


function NoticePopup({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;

    const timer = window.setTimeout(onClose, 3600);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;

  const isError = notice.type === "error";

  return createPortal(
    <div className="fixed right-5 top-5 z-[150] w-[min(92vw,380px)] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            isError
              ? "bg-rose-50 text-rose-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {isError ? (
            <ExclamationTriangleIcon className="h-4 w-4" />
          ) : (
            <CheckCircleIcon className="h-4 w-4" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800">
            {notice.title}
          </div>
          <div className="mt-1 text-xs leading-5 text-slate-500">
            {notice.message}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
          aria-label="Tutup notifikasi"
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

function PrintConfirmPopup({
  rows,
  period,
  mode,
  onModeChange,
  onCancel,
  onConfirm,
  busy,
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event) => event.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
    };
  }, [busy, onCancel]);

  return createPortal(
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="border-b border-slate-100 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Cetak Rapor Secara Massal</h3>
              <p className="mt-1 text-xs leading-5 text-slate-500">
                {period.semester_label} · {period.tahun_ajaran}
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={onCancel}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Jenis Dokumen
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => onModeChange("report")}
                className={`rounded-xl border p-4 text-left transition disabled:opacity-50 ${
                  mode === "report"
                    ? "border-[#e94640] bg-red-50/60 ring-1 ring-[#e94640]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className={`h-5 w-5 ${mode === "report" ? "text-[#e94640]" : "text-slate-400"}`} />
                  <span className="text-sm font-semibold text-slate-800">Rapor Saja</span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  Langsung mencetak halaman Rapor perkembangan siswa.
                </p>
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => onModeChange("complete")}
                className={`rounded-xl border p-4 text-left transition disabled:opacity-50 ${
                  mode === "complete"
                    ? "border-[#e94640] bg-red-50/60 ring-1 ring-[#e94640]/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-2">
                  <BookOpenIcon className={`h-5 w-5 ${mode === "complete" ? "text-[#e94640]" : "text-slate-400"}`} />
                  <span className="text-sm font-semibold text-slate-800">Dokumen Lengkap</span>
                </div>
                <p className="mt-2 text-[10px] leading-4 text-slate-500">
                  Cover, petunjuk, identitas sekolah, identitas anak, lalu Rapor.
                </p>
              </button>
            </div>
          </div>

          <div className="rounded-xl bg-slate-50 p-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Rapor yang akan dicetak</span>
              <span className="font-bold text-slate-800">{rows.length} siswa</span>
            </div>
          </div>


          <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200">
            {rows.map((row, index) => (
              <div
                key={row.student.id}
                className="flex items-center justify-between gap-4 border-b border-slate-100 px-4 py-3 last:border-b-0"
              >
                <div className="min-w-0">
                  <div className="truncate text-xs font-semibold text-slate-700">
                    {index + 1}. {row.student.nama_lengkap}
                  </div>
                  <div className="mt-0.5 text-[10px] text-slate-400">
                    {row.student.classroom_name || "Tanpa kelas"}
                  </div>
                </div>
                <StatusBadge status={row.status} />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
          >
            {busy ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PrinterIcon className="h-4 w-4" />
            )}
            {busy
              ? "Menyiapkan..."
              : mode === "complete"
                ? `Cetak ${rows.length} Dokumen Lengkap`
                : `Cetak ${rows.length} Rapor`}
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}


const dateOnly = (value) => text(value).slice(0, 10);

async function mapWithConcurrency(items, limit, mapper) {
  const output = new Array(items.length);
  let cursor = 0;

  const workers = Array.from(
    {
      length: Math.min(
        Math.max(1, limit),
        Math.max(1, items.length)
      ),
    },
    async () => {
      while (cursor < items.length) {
        const index = cursor++;
        output[index] = await mapper(items[index], index);
      }
    }
  );

  await Promise.all(workers);
  return output;
}

function buildPrintIdentity(student, row, classroom) {
  const parent =
    student?.parent ??
    student?.parent_detail ??
    {};

  return {
    id: student?.id ?? row.student.id,
    nama_lengkap:
      text(student?.nama_lengkap) ||
      row.student.nama_lengkap,
    nama_panggilan: text(student?.nama_panggilan),
    nomor_induk:
      text(student?.nomor_induk) ||
      text(student?.nis) ||
      row.student.nomor_induk ||
      text(student?.nisn) ||
      row.student.nisn ||
      "",
    nisn:
      text(student?.nisn) ||
      row.student.nisn ||
      row.student.nomor_induk ||
      "",
    nik: text(student?.nik),
    tempat_lahir: text(student?.tempat_lahir),
    tanggal_lahir: dateOnly(student?.tanggal_lahir),
    jenis_kelamin:
      text(student?.jenis_kelamin) ||
      row.student.jenis_kelamin ||
      "",
    agama: text(student?.agama),
    kewarganegaraan: text(student?.kewarganegaraan),
    alamat_lengkap: text(student?.alamat_lengkap),
    no_telepon_rumah: text(student?.no_telepon_rumah),
    bahasa_sehari_hari: text(student?.bahasa_sehari_hari),
    status_tempat_tinggal: text(
      student?.status_tempat_tinggal
    ),
    jarak_ke_sekolah:
      Number(student?.jarak_ke_sekolah) || 0,
    jumlah_saudara_kandung:
      Number(student?.jumlah_saudara_kandung) || 0,
    jumlah_saudara_tiri:
      Number(student?.jumlah_saudara_tiri) || 0,
    jumlah_saudara_angkat:
      Number(student?.jumlah_saudara_angkat) || 0,
    asal_peserta_didik: text(student?.asal_peserta_didik),
    nama_lembaga: text(student?.nama_lembaga),
    alamat_lembaga: text(student?.alamat_lembaga),
    nama_lembaga_asal: text(student?.nama_lembaga_asal),
    alamat_lembaga_asal: text(
      student?.alamat_lembaga_asal
    ),
    kelompok_umur_sebelumnya: text(
      student?.kelompok_umur_sebelumnya
    ),
    catatan_penting: text(student?.catatan_penting),
    classroom_id:
      row.student.classroom_id ??
      classroom?.id ??
      null,
    classroom_name:
      text(row.student.classroom_name) ||
      text(classroom?.nama_kelas),
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
      hubungan_keluarga_wali: text(
        parent.hubungan_keluarga_wali
      ),
      kontak_wali: text(parent.kontak_wali),
      no_hp_ortu: text(parent.no_hp_ortu),
    },
    status: {
      status_aktif: student?.status?.status_aktif !== false,
      tanggal_masuk: dateOnly(
        student?.status?.tanggal_masuk
      ),
      tanggal_keluar: dateOnly(
        student?.status?.tanggal_keluar
      ),
      alasan_keluar: text(
        student?.status?.alasan_keluar
      ),
      kelompok_umur: text(
        student?.status?.kelompok_umur
      ),
      tahun_pelajaran:
        text(student?.status?.tahun_pelajaran) ||
        row.student.tahun_ajaran ||
        "",
      nomor_surat_keterangan: text(
        student?.status?.nomor_surat_keterangan
      ),
      lembaga_lanjutan: text(
        student?.status?.lembaga_lanjutan
      ),
      tanggal_pindah: dateOnly(
        student?.status?.tanggal_pindah
      ),
      dari_kelompok_umur: text(
        student?.status?.dari_kelompok_umur
      ),
      ke_lembaga: text(student?.status?.ke_lembaga),
      tingkat_kelompok_umur: text(
        student?.status?.tingkat_kelompok_umur
      ),
    },
  };
}

export default function RaporView() {
  const initialYear = fallbackAcademicYear();

  const [selectedYear, setSelectedYear] =
    useState(initialYear);
  const [selectedSemester, setSelectedSemester] =
    useState(fallbackAcademicSemester());
  const currentPeriodQuery = useQuery({
    queryKey: adminQueryKeys.academicPeriod,
    queryFn: ({ signal }) => fetchCurrentAcademicPeriod(signal),
    staleTime: 5 * 60_000,
  });

  const academicYearsQuery = useQuery({
    queryKey: ["admin", "academic-periods", "years"],
    queryFn: ({ signal }) => fetchAcademicYearOptions(signal),
    staleTime: 5 * 60_000,
  });
  const periodSyncedRef = useRef(false);

  const [selectedClass, setSelectedClass] =
    useState("all");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [educationStatus, setEducationStatus] =
    useState("all");
  const [selected, setSelected] = useState(
    new Set()
  );
  const [filtersOpen, setFiltersOpen] =
    useState(false);
  const [selectionMode, setSelectionMode] =
    useState(false);
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState({
    done: 0,
    total: 0,
  });
  const [printBatch, setPrintBatch] = useState([]);
  const [printComponents, setPrintComponents] = useState(null);
  const [printMode, setPrintMode] =
    useState("report");
  const [confirmRows, setConfirmRows] =
    useState(null);
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] =
    useState(20);

  const printRequestedRef = useRef(false);
  const printMasterRef = useRef(null);
  const reportDetailCacheRef = useRef(new Map());
  const studentDetailCacheRef = useRef(new Map());
  const deferredSearch = useDeferredValue(search);

  useEffect(() => {
    if (periodSyncedRef.current || !currentPeriodQuery.data) return;
    periodSyncedRef.current = true;
    setSelectedYear(resolveAcademicYear(currentPeriodQuery.data));
    setSelectedSemester(resolveAcademicSemester(currentPeriodQuery.data));
  }, [currentPeriodQuery.data]);

  const period = useMemo(
    () =>
      periodObject(
        selectedYear,
        selectedSemester
      ),
    [selectedYear, selectedSemester]
  );

  const rowsQuery = useQuery({
    queryKey: [
      "reports",
      "rapor",
      "table",
      selectedYear,
      Number(selectedSemester) === 2 ? 2 : 1,
    ],
    queryFn: ({ signal }) =>
      fetchAllReportTableRows({
        tahun_ajaran: selectedYear,
        semester:
          Number(selectedSemester) === 2 ? 2 : 1,
        signal,
      }),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (previous) => previous,
  });

  const rawRows = rowsQuery.data ?? [];

  const rows = useMemo(
    () =>
      rawRows.map((row) => ({
        ...row,
        status: rowStatus(
          row.report,
          row.classroom,
          period,
          row.progress
        ),
      })),
    [period, rawRows]
  );

  const classes = useMemo(() => {
    const map = new Map();

    rows.forEach((row) => {
      const id = row.student.classroom_id;
      const name =
        text(row.student.classroom_name) ||
        text(row.classroom?.nama_kelas);

      if (
        id !== null &&
        id !== undefined &&
        name
      ) {
        map.set(keyOf(id), {
          id,
          nama_kelas: name,
        });
      }
    });

    return [...map.values()].sort((a, b) =>
      a.nama_kelas.localeCompare(
        b.nama_kelas,
        "id",
        {
          numeric: true,
          sensitivity: "base",
        }
      )
    );
  }, [rows]);

  const yearOptions = useMemo(() => {
    const activeYear = resolveAcademicYear(currentPeriodQuery.data);
    const years = new Set(
      academicYearsQuery.data?.length
        ? academicYearsQuery.data
        : buildAcademicYearOptions(activeYear, 8)
    );

    rows.forEach((row) => {
      if (text(row.student.tahun_ajaran)) {
        years.add(row.student.tahun_ajaran);
      }
    });

    years.add(selectedYear);

    return [...years].sort((a, b) => {
      const yearA =
        Number(String(a).split("/")[0]) || 0;
      const yearB =
        Number(String(b).split("/")[0]) || 0;
      return yearB - yearA;
    });
  }, [academicYearsQuery.data, currentPeriodQuery.data, rows, selectedYear]);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
  }, [selectedYear, selectedSemester]);

  useEffect(() => {
    setPage(1);
  }, [
    deferredSearch,
    selectedClass,
    statusFilter,
    educationStatus,
  ]);

  const filteredRows = useMemo(() => {
    const query = normalized(deferredSearch);

    return rows.filter((row) => {
      const matchClass =
        selectedClass === "all" ||
        keyOf(row.student.classroom_id) ===
          selectedClass;

      const matchSearch =
        !query ||
        normalized(
          row.student.nama_lengkap
        ).includes(query) ||
        normalized(
          row.student.nomor_induk
        ).includes(query) ||
        normalized(row.student.nisn).includes(
          query
        );

      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "final" &&
          row.status.printable) ||
        (statusFilter === "draft" &&
          reportExists(row.report) &&
          !row.status.printable) ||
        (statusFilter === "empty" &&
          !reportExists(row.report));

      const matchEducation =
        educationStatus === "all" ||
        row.student.education_state === educationStatus;

      return (
        matchClass &&
        matchSearch &&
        matchStatus &&
        matchEducation
      );
    });
  }, [
    deferredSearch,
    rows,
    selectedClass,
    statusFilter,
    educationStatus,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      filteredRows.length / pageSize
    )
  );
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (safePage - 1) * pageSize,
    safePage * pageSize
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const selectedRows = useMemo(
    () =>
      rows.filter(
        (row) =>
          selected.has(
            keyOf(row.student.id)
          ) && row.status.printable
      ),
    [rows, selected]
  );

  const visiblePrintable = pageRows.filter(
    (row) => row.status.printable
  );

  const allVisibleSelected =
    visiblePrintable.length > 0 &&
    visiblePrintable.every((row) =>
      selected.has(keyOf(row.student.id))
    );

  const someVisibleSelected =
    visiblePrintable.some((row) =>
      selected.has(keyOf(row.student.id))
    ) && !allVisibleSelected;

  const selectAllRef = useRef(null);

  useEffect(() => {
    if (selectAllRef.current) {
      selectAllRef.current.indeterminate =
        someVisibleSelected;
    }
  }, [someVisibleSelected]);

  const toggleRow = (row) => {
    if (!row.status.printable) return;

    const id = keyOf(row.student.id);

    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleVisible = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      const remove =
        visiblePrintable.length > 0 &&
        visiblePrintable.every((row) =>
          next.has(keyOf(row.student.id))
        );

      visiblePrintable.forEach((row) => {
        const id = keyOf(row.student.id);
        if (remove) next.delete(id);
        else next.add(id);
      });

      return next;
    });
  };

  const selectAllReady = () => {
    setSelected(
      new Set(
        filteredRows
          .filter((row) => row.status.printable)
          .map((row) =>
            keyOf(row.student.id)
          )
      )
    );
  };

  const clearSelection = () =>
    setSelected(new Set());

  const toggleSelectionMode = () => {
    setSelectionMode((current) => {
      if (current) clearSelection();
      return !current;
    });
  };

  const requestPrint = (targets) => {
    const printable = targets.filter(
      (row) => row.status.printable
    );

    if (printable.length === 0) {
      setNotice({
        type: "error",
        title:
          "Belum ada rapor yang siap dicetak",
        message:
          "Rapor harus berstatus Sudah Diisi dan memiliki nilai indikator serta Catatan Guru yang lengkap.",
      });
      return;
    }

    setConfirmRows(printable);
  };

  const loadPrintMaster = async () => {
    if (printMasterRef.current) {
      return printMasterRef.current;
    }

    printMasterRef.current = Promise.all([
      import("../../../api/kegiatan"),
      import("../../../api/staff"),
      import("../../../components/common/RaporPrintTemplate"),
      import("../../../components/common/RaporCompleteDocument"),
    ])
      .then(async ([
        kegiatanApi,
        staffApi,
        raporPrintModule,
        completeModule,
      ]) => {
        const [
          classroomItems,
          indicatorItems,
          profile,
          staffItems,
        ] = await Promise.all([
          kegiatanApi.fetchKegiatanClassrooms(),
          kegiatanApi.fetchReportIndicators({
            include_inactive: true,
          }),
          kegiatanApi.fetchSchoolProfile(),
          staffApi.fetchStaff(),
        ]);

        writeStaffCache(staffItems);

        setPrintComponents({
          RaporPrintTemplate:
            raporPrintModule.RaporPrintTemplate,
          RaporCompleteDocument:
            completeModule.RaporCompleteDocument,
        });

        return {
          classes: classroomItems,
          indicators: indicatorItems,
          schoolProfile: profile,
          staffMembers: staffItems,
        };
      })
      .catch((error) => {
        printMasterRef.current = null;
        throw error;
      });

    return printMasterRef.current;
  };

  const loadReportDetail = async (row) => {
    const cacheKey = `${row.student.id}_${period.tahun_ajaran}_${period.semester}`;
    const cached =
      reportDetailCacheRef.current.get(
        cacheKey
      );

    if (cached) return cached;

    const report =
      await fetchReportDetailForPrint({
        student_id: row.student.id,
        tahun_ajaran: period.tahun_ajaran,
        semester: period.semester,
      });

    reportDetailCacheRef.current.set(
      cacheKey,
      report
    );

    return report;
  };

  const loadStudentDetail = async (row) => {
    const cacheKey = keyOf(row.student.id);
    const cached =
      studentDetailCacheRef.current.get(
        cacheKey
      );

    if (cached) return cached;

    const { fetchStudentById } = await import("../../../api/students");
    const detail = await fetchStudentById(row.student.id);

    studentDetailCacheRef.current.set(
      cacheKey,
      detail
    );

    return detail;
  };

  const preparePrint = async () => {
    if (
      !confirmRows?.length ||
      printing
    ) {
      return;
    }

    setPrinting(true);
    setPrintProgress({
      done: 0,
      total: confirmRows.length,
    });

    try {
      const master = await loadPrintMaster();
      const classMap = new Map(
        master.classes.map((item) => [
          keyOf(item.id),
          item,
        ])
      );

      const headmaster =
        resolveHeadmasterForPeriod(
          master.staffMembers,
          period
        );
      const printedAt = new Date();
      let completed = 0;

      const contexts =
        await mapWithConcurrency(
          confirmRows,
          4,
          async (row) => {
            const report =
              await loadReportDetail(row);

            const reportIndicators =
              resolvePrintIndicators(
                report,
                master.indicators
              );

            const classroom =
              resolvePrintClassroom(
                report,
                row,
                classMap
              );

            const detail =
              printMode === "complete"
                ? await loadStudentDetail(row)
                : null;

            const identity = detail
              ? buildPrintIdentity(
                  detail,
                  row,
                  classroom
                )
              : {
                  id: row.student.id,
                  nama_lengkap:
                    text(report?.student_nama) ||
                    row.student.nama_lengkap,
                  nomor_induk:
                    row.student.nomor_induk ||
                    text(report?.nomor_induk) ||
                    text(report?.nis) ||
                    text(report?.nisn) ||
                    row.student.nisn ||
                    "",
                  nisn:
                    text(report?.nisn) ||
                    row.student.nisn ||
                    row.student.nomor_induk ||
                    "",
                  classroom_id:
                    report?.classroom_id ??
                    row.student.classroom_id,
                  classroom_name:
                    text(report?.classroom_nama) ||
                    row.student
                      .classroom_name ||
                    classroom?.nama_kelas ||
                    "",
                  parent: {},
                  status: {},
                };

            completed += 1;
            setPrintProgress({
              done: completed,
              total: confirmRows.length,
            });

            return {
              key: `${row.student.id}_${period.tahun_ajaran}_${period.semester}`,
              printMode,
              identity,
              student: buildPrintStudent(
                row.student,
                report
              ),
              data: buildPrintData(
                report,
                reportIndicators,
                period
              ),
              report,
              indicators:
                reportIndicators,
              curriculum:
                classroom?.curriculum ||
                null,
              classroom,
              period,
              headmaster,
              homeroomTeacher:
                resolveHomeroomTeacher(
                  classroom,
                  master.staffMembers
                ),
              printedAt,
              schoolProfile:
                master.schoolProfile,
            };
          }
        );

      setPrintBatch(contexts);
      setConfirmRows(null);
      printRequestedRef.current = true;
    } catch (error) {
      setNotice({
        type: "error",
        title:
          "Gagal menyiapkan dokumen cetak",
        message: errorOf(error),
      });
    } finally {
      setPrinting(false);
      setPrintProgress({
        done: 0,
        total: 0,
      });
    }
  };

  useEffect(() => {
    if (
      !printRequestedRef.current ||
      printBatch.length === 0 ||
      !printComponents
    ) {
      return undefined;
    }

    printRequestedRef.current = false;

    const first =
      window.requestAnimationFrame(() => {
        const second =
          window.requestAnimationFrame(() => {
            window.print();
          });

        return () =>
          window.cancelAnimationFrame(second);
      });

    return () =>
      window.cancelAnimationFrame(first);
  }, [printBatch, printComponents]);

  const reportCount = rows.filter(
    (row) => reportExists(row.report)
  ).length;

  const loading =
    rowsQuery.isPending &&
    !rowsQuery.data;
  const refreshing =
    rowsQuery.isFetching && !loading;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <style>{`
        @media print {
          body > * { display: none !important; }
          #laporan-rapor-print-root {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
            z-index: 99999;
          }
          .laporan-rapor-print-item {
            break-after: page;
            page-break-after: always;
          }
          .laporan-rapor-print-item:last-child {
            break-after: auto;
            page-break-after: auto;
          }
        }
      `}</style>

      <SectionHeader
        icon={PrinterIcon}
        title="Cetak Rapor"
        description="Cetak rapor siswa secara individual atau massal berdasarkan tahun ajaran, semester, kelas, dan status pengisian."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              {refreshing && (
                <ArrowPathIcon className="mr-1 inline h-3.5 w-3.5 animate-spin" />
              )}
              {period.semester_label} ·{" "}
              <b className="font-semibold text-slate-600">
                {period.tahun_ajaran}
              </b>
            </span>

            <button
              type="button"
              onClick={() =>
                setFiltersOpen(
                  (value) => !value
                )
              }
              className={`ui-toolbar-button ${
                filtersOpen
                  ? "is-active"
                  : ""
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>

            <button
              type="button"
              onClick={toggleSelectionMode}
              disabled={printing}
              className={`ui-toolbar-button ${
                selectionMode
                  ? "is-active"
                  : ""
              }`}
            >
              {selectionMode ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <UserGroupIcon className="h-4 w-4" />
              )}
              {selectionMode
                ? "Selesai Pilih"
                : "Pilih Rapor"}
            </button>

            {selectionMode ? (
              <button
                type="button"
                onClick={() =>
                  requestPrint(selectedRows)
                }
                disabled={
                  selectedRows.length === 0 ||
                  printing
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {printing ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PrinterIcon className="h-4 w-4" />
                )}
                {printing
                  ? `Menyiapkan ${printProgress.done}/${printProgress.total}`
                  : `Cetak Terpilih${
                      selectedRows.length
                        ? ` (${selectedRows.length})`
                        : ""
                    }`}
              </button>
            ) : (
              <button
                type="button"
                onClick={() =>
                  requestPrint(filteredRows)
                }
                disabled={
                  filteredRows.every(
                    (row) =>
                      !row.status.printable
                  ) || printing
                }
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {printing ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <PrinterIcon className="h-4 w-4" />
                )}
                Cetak Semua Siap
              </button>
            )}
          </>
        }
      />

      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedYear}
              onChange={(event) => {
                setSelectedYear(
                  event.target.value
                );
              }}
              className="ui-compact-control min-w-36"
            >
              {yearOptions.map((year) => (
                <option
                  key={year}
                  value={year}
                >
                  {year}
                </option>
              ))}
            </select>

            <select
              value={selectedSemester}
              onChange={(event) =>
                setSelectedSemester(
                  Number(event.target.value)
                )
              }
              className="ui-compact-control min-w-44"
            >
              <option value={1}>
                Semester I (Ganjil)
              </option>
              <option value={2}>
                Semester II (Genap)
              </option>
            </select>

            <select
              value={selectedClass}
              onChange={(event) =>
                setSelectedClass(
                  event.target.value
                )
              }
              className="ui-compact-control min-w-40"
            >
              <option value="all">
                Semua Kelas
              </option>
              {classes.map((item) => (
                <option
                  key={item.id}
                  value={keyOf(item.id)}
                >
                  {item.nama_kelas}
                </option>
              ))}
            </select>

            <select
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
              className="ui-compact-control min-w-48"
            >
              <option value="all">
                Semua Status
              </option>
              <option value="final">
                Sudah Diisi / Siap Cetak
              </option>
              <option value="draft">
                Proses / Belum Lengkap
              </option>
              <option value="empty">
                Belum Diisi
              </option>
            </select>

            <select
              value={educationStatus}
              onChange={(event) =>
                setEducationStatus(event.target.value)
              }
              className="ui-compact-control min-w-52"
            >
              {EDUCATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() =>
                rowsQuery.refetch()
              }
              disabled={rowsQuery.isFetching}
              className="ui-toolbar-button"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${
                  rowsQuery.isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
              Muat Ulang
            </button>
          </div>

          <div className="relative w-full xl:w-64">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nama atau NIS..."
              className="ui-compact-control w-full pl-9"
            />
          </div>
        </div>
      )}

      {selectionMode && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-700">
              Mode pilih rapor aktif
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Hanya rapor berstatus Sudah Diisi dan lengkap yang dapat dipilih. Detail lengkap baru dimuat saat dicetak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedRows.length > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="h-8 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 hover:bg-white"
              >
                Kosongkan
              </button>
            )}

            <button
              type="button"
              onClick={selectAllReady}
              disabled={filteredRows.every(
                (row) =>
                  !row.status.printable
              )}
              className="h-8 rounded-lg border border-red-100 bg-white px-2.5 text-[10px] font-semibold text-[#ef4d45] disabled:opacity-40"
            >
              Pilih Semua Siap
            </button>

            <span className="text-[10px] text-slate-500">
              <b className="font-semibold text-[#ef4d45]">
                {selectedRows.length}
              </b>{" "}
              dipilih
            </span>
          </div>
        </div>
      )}

      {rowsQuery.isError ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-[11px] font-medium text-rose-600">
            Data rapor gagal dimuat.{" "}
            {rowsQuery.error?.message}
          </p>

          <button
            type="button"
            onClick={() =>
              rowsQuery.refetch()
            }
            className="ui-toolbar-button mt-3"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Muat Ulang
          </button>
        </div>
      ) : (
        <div className="ui-table-card overflow-hidden">
          <div className="flex flex-col gap-2 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[11px] font-semibold text-slate-700">
                Daftar Rapor Siswa
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                {period.semester_label} ·{" "}
                {period.tahun_ajaran} · Arsip{" "}
                {reportCount} rapor
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400">
              <span>
                <b className="font-semibold text-emerald-600">
                  {
                    rows.filter(
                      (row) =>
                        row.status.printable
                    ).length
                  }
                </b>{" "}
                siap cetak
              </span>

              <span>
                <b className="font-semibold text-amber-600">
                  {
                    rows.filter(
                      (row) =>
                        reportExists(
                          row.report
                        ) &&
                        !row.status.printable
                    ).length
                  }
                </b>{" "}
                proses
              </span>

              <span>
                <b className="font-semibold text-slate-600">
                  {
                    rows.filter(
                      (row) =>
                        !reportExists(
                          row.report
                        )
                    ).length
                  }
                </b>{" "}
                belum diisi
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-300">
              <thead className="bg-slate-50/60">
                <tr className="border-b border-slate-100">
                  <th className="w-20 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <input
                          ref={selectAllRef}
                          type="checkbox"
                          checked={
                            allVisibleSelected
                          }
                          onChange={
                            toggleVisible
                          }
                          disabled={
                            visiblePrintable.length ===
                            0
                          }
                          className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#ef4d45] disabled:cursor-not-allowed disabled:opacity-30"
                          aria-label="Pilih semua rapor siap pada halaman ini"
                        />
                      )}
                      <span>No.</span>
                    </div>
                  </th>

                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Nama Siswa
                  </th>

                  <th className="w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    NIS
                  </th>

                  <th className="w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kelas
                  </th>

                  <th className="w-32 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Tahun Ajaran
                  </th>

                  <th className="w-48 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status Pendidikan
                  </th>

                  <th className="w-40 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status Rapor
                  </th>

                  <th className="w-44 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kelengkapan
                  </th>

                  <th className="w-24 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from(
                    { length: 6 },
                    (_, index) => (
                      <tr key={index}>
                        {Array.from(
                          { length: 9 },
                          (_, cell) => (
                            <td
                              key={cell}
                              className="px-3 py-3"
                            >
                              <div className="h-3 animate-pulse rounded bg-slate-100" />
                            </td>
                          )
                        )}
                      </tr>
                    )
                  )
                ) : pageRows.length > 0 ? (
                  pageRows.map(
                    (row, index) => {
                      const id = keyOf(
                        row.student.id
                      );
                      const checked =
                        selected.has(id);

                      return (
                        <tr
                          key={id}
                          className={`hover:bg-slate-50/60 ${
                            checked
                              ? "bg-red-50/30"
                              : ""
                          }`}
                        >
                          <td className="px-3 py-2.5">
                            <div className="flex items-center gap-2">
                              {selectionMode && (
                                <input
                                  type="checkbox"
                                  checked={
                                    checked
                                  }
                                  disabled={
                                    !row.status
                                      .printable
                                  }
                                  onChange={() =>
                                    toggleRow(
                                      row
                                    )
                                  }
                                  className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#ef4d45] disabled:cursor-not-allowed disabled:opacity-30"
                                  aria-label={`Pilih rapor ${row.student.nama_lengkap}`}
                                />
                              )}

                              <span className="text-[11px] text-slate-400">
                                {(safePage -
                                  1) *
                                  pageSize +
                                  index +
                                  1}
                              </span>
                            </div>
                          </td>

                          <td className="px-3 py-2.5">
                            <p className="max-w-64 truncate text-[12px] font-semibold text-slate-800">
                              {
                                row.student
                                  .nama_lengkap
                              }
                            </p>
                          </td>

                          <td className="px-3 py-2.5 text-[11px] text-slate-600">
                            {studentNis(row.student) || "-"}
                          </td>

                          <td className="px-3 py-2.5">
                            <ClassBadge
                              name={
                                row.student.classroom_name ||
                                row.classroom?.nama_kelas
                              }
                              educationState={row.student.education_state}
                            />
                          </td>

                          <td className="px-3 py-2.5 text-[11px] font-medium text-slate-600">
                            {studentAcademicYear(row.student) || "-"}
                          </td>

                          <td className="px-3 py-2.5">
                            <EducationBadge state={row.student.education_state} />
                          </td>

                          <td className="px-3 py-2.5">
                            <StatusBadge
                              status={
                                row.status
                              }
                            />
                          </td>

                          <td className="px-3 py-2.5">
                            <p className="text-[11px] font-medium text-slate-600">
                              {
                                row.status
                                  .filled
                              }
                              /
                              {row.status
                                .total || 0}{" "}
                              indikator
                            </p>
                            <p className="mt-0.5 text-[10px] text-slate-400">
                              Catatan guru{" "}
                              {text(
                                row.report
                                  ?.catatan
                              )
                                ? "tersedia"
                                : "belum ada"}
                            </p>
                          </td>

                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              disabled={
                                !row.status
                                  .printable ||
                                printing
                              }
                              onClick={() =>
                                requestPrint([
                                  row,
                                ])
                              }
                              className="ui-action-button"
                            >
                              <PrinterIcon className="h-3.5 w-3.5" />
                              Cetak
                            </button>
                          </td>
                        </tr>
                      );
                    }
                  )
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center"
                    >
                      <UserGroupIcon className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-[11px] font-semibold text-slate-600">
                        Rapor tidak ditemukan
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Ubah periode,
                        kelas, status, atau
                        pencarian yang
                        digunakan.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            filteredRows.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-slate-400">
                  Menampilkan{" "}
                  <b className="font-semibold text-slate-600">
                    {(safePage - 1) *
                      pageSize +
                      1}
                  </b>
                  –
                  <b className="font-semibold text-slate-600">
                    {Math.min(
                      safePage *
                        pageSize,
                      filteredRows.length
                    )}
                  </b>{" "}
                  dari{" "}
                  <b className="font-semibold text-slate-600">
                    {
                      filteredRows.length
                    }
                  </b>{" "}
                  siswa
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={pageSize}
                    onChange={(event) => {
                      setPageSize(
                        Number(
                          event.target.value
                        )
                      );
                      setPage(1);
                    }}
                    className="ui-compact-control h-8 min-w-28"
                  >
                    {PAGE_SIZE_OPTIONS.map(
                      (size) => (
                        <option
                          key={size}
                          value={size}
                        >
                          {size} / halaman
                        </option>
                      )
                    )}
                  </select>

                  <button
                    type="button"
                    disabled={
                      safePage <= 1
                    }
                    onClick={() =>
                      setPage((value) =>
                        Math.max(
                          1,
                          value - 1
                        )
                      )
                    }
                    className="ui-toolbar-button h-8"
                  >
                    Sebelumnya
                  </button>

                  <span className="px-1 text-[10px] font-semibold text-slate-500">
                    {safePage} /{" "}
                    {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      safePage >=
                      totalPages
                    }
                    onClick={() =>
                      setPage((value) =>
                        Math.min(
                          totalPages,
                          value + 1
                        )
                      )
                    }
                    className="ui-toolbar-button h-8"
                  >
                    Selanjutnya
                  </button>
                </div>
              </div>
            )}
        </div>
      )}

      {confirmRows && (
        <PrintConfirmPopup
          rows={confirmRows}
          period={period}
          mode={printMode}
          onModeChange={setPrintMode}
          busy={printing}
          onCancel={() =>
            !printing &&
            setConfirmRows(null)
          }
          onConfirm={preparePrint}
        />
      )}

      <NoticePopup
        notice={notice}
        onClose={() => setNotice(null)}
      />

      {printComponents &&
        createPortal(
          <div
            id="laporan-rapor-print-root"
            style={{ display: "none" }}
          >
            {printBatch.map((context) => {
              const RaporPrintTemplate =
                printComponents.RaporPrintTemplate;
              const RaporCompleteDocument =
                printComponents.RaporCompleteDocument;

              return (
                <div
                  key={context.key}
                  className="laporan-rapor-print-item"
                >
                  {context.printMode === "complete" ? (
                    <RaporCompleteDocument
                      schoolProfile={context.schoolProfile}
                      identity={context.identity}
                      period={context.period}
                    >
                      <RaporPrintTemplate
                        student={context.student}
                        data={context.data}
                        report={context.report}
                        indicators={context.indicators}
                        curriculum={context.curriculum}
                        classroom={context.classroom}
                        period={context.period}
                        headmaster={context.headmaster}
                        homeroomTeacher={context.homeroomTeacher}
                        printedAt={context.printedAt}
                        schoolProfile={context.schoolProfile}
                      />
                    </RaporCompleteDocument>
                  ) : (
                    <RaporPrintTemplate
                      student={context.student}
                      data={context.data}
                      report={context.report}
                      indicators={context.indicators}
                      curriculum={context.curriculum}
                      classroom={context.classroom}
                      period={context.period}
                      headmaster={context.headmaster}
                      homeroomTeacher={context.homeroomTeacher}
                      printedAt={context.printedAt}
                      schoolProfile={context.schoolProfile}
                    />
                  )}
                </div>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}
