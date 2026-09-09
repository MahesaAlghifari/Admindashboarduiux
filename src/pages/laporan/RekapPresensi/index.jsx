import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardDocumentCheckIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAttendanceReportPeriods,
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  fetchSchoolProfile,
  fetchStudentAttendanceHistory,
} from "../../../api/kegiatan";
import { fetchAllStudentAttendanceReport } from "../../../api/report-students";
import { fetchAcademicYearOptions } from "../../../api/academic-periods";
import { fetchStaff } from "../../../api/staff";
import { AttendancePrintTemplate } from "../../../components/common/AttendancePrintTemplate";
import { SectionHeader } from "../../../components/common/DesignSystem";
import {
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

const isoDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const monthValue = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const isoWeekValue = (source = new Date()) => {
  const date = new Date(source.getFullYear(), source.getMonth(), source.getDate());
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  const week =
    1 +
    Math.round(
      ((date.getTime() - week1.getTime()) / 86400000 -
        3 +
        ((week1.getDay() + 6) % 7)) /
        7
    );
  return `${date.getFullYear()}-W${String(week).padStart(2, "0")}`;
};

const weekRange = (weekValue) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(text(weekValue));
  if (!match) return { dari: "", sampai: "" };
  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(year, 0, 4);
  const day = januaryFourth.getDay() || 7;
  const monday = new Date(januaryFourth);
  monday.setDate(januaryFourth.getDate() - day + 1 + (week - 1) * 7);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { dari: isoDate(monday), sampai: isoDate(sunday) };
};

const monthRange = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(text(value));
  if (!match) return { dari: "", sampai: "" };
  const year = Number(match[1]);
  const month = Number(match[2]);
  return {
    dari: isoDate(new Date(year, month - 1, 1)),
    sampai: isoDate(new Date(year, month, 0)),
  };
};

const semesterRange = (tahunAjaran, semester) => {
  const startYear = Number(text(tahunAjaran).split("/")[0]);
  if (!Number.isFinite(startYear)) return { dari: "", sampai: "" };
  return Number(semester) === 2
    ? { dari: `${startYear + 1}-01-01`, sampai: `${startYear + 1}-06-30` }
    : { dari: `${startYear}-07-01`, sampai: `${startYear}-12-31` };
};

const academicYearRange = (tahunAjaran) => {
  const startYear = Number(text(tahunAjaran).split("/")[0]);
  if (!Number.isFinite(startYear)) return { dari: "", sampai: "" };
  return {
    dari: `${startYear}-07-01`,
    sampai: `${startYear + 1}-06-30`,
  };
};

const formatDate = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

const formatDay = (value) => {
  const raw = text(value);
  if (!raw) return "-";
  const date = new Date(`${raw.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
};


const sameStaff = (staff, teacher) => {
  if (!staff || !teacher) return false;
  if (
    staff.id !== null &&
    staff.id !== undefined &&
    teacher.id !== null &&
    teacher.id !== undefined &&
    keyOf(staff.id) === keyOf(teacher.id)
  ) {
    return true;
  }
  if (text(staff.nik) && text(teacher.nik) && text(staff.nik) === text(teacher.nik)) {
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

const resolveHeadmaster = (staffMembers, sampai) => {
  const end = new Date(`${text(sampai)}T23:59:59`).getTime();
  return (
    staffMembers
      .filter((staff) => normalized(staff.jabatan) === "kepala sekolah")
      .filter((staff) => {
        const joined = text(staff.tanggal_bergabung);
        if (!joined) return true;
        const timestamp = new Date(joined).getTime();
        return Number.isNaN(timestamp) || Number.isNaN(end) || timestamp <= end;
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

const statusTone = (status) =>
  ({
    H: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    S: "bg-blue-50 text-blue-700 ring-blue-100",
    I: "bg-amber-50 text-amber-700 ring-amber-100",
    A: "bg-rose-50 text-rose-700 ring-rose-100",
  }[status] || "bg-slate-100 text-slate-600 ring-slate-200");

function Checkbox({ checked, indeterminate = false, onChange, label }) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#e94640]"
    />
  );
}

function SummaryCard({ label, value, detail, tone = "slate" }) {
  const tones = {
    slate: "bg-slate-50 text-slate-700",
    green: "bg-emerald-50 text-emerald-700",
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    rose: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-semibold ${tones[tone] || tones.slate}`}>
        {label}
      </div>
      <div className="mt-2 text-xl font-bold text-slate-800">{value}</div>
      <div className="mt-0.5 text-[10px] text-slate-400">{detail}</div>
    </div>
  );
}

function NoticePopup({ notice, onClose }) {
  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(onClose, 3800);
    return () => window.clearTimeout(timer);
  }, [notice, onClose]);

  if (!notice) return null;
  const isError = notice.type === "error";

  return createPortal(
    <div className="fixed right-5 top-5 z-170 w-[min(92vw,390px)] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isError ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
          {isError ? <ExclamationTriangleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800">{notice.title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{notice.message}</div>
        </div>
        <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

function DetailPopup({ item, range, periodLabel, loading, error, onClose, onPrint, onRetry }) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const key = (event) => event.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", key);
    };
  }, [onClose]);

  const history = [...(item?.history || [])].sort((a, b) =>
    b.tanggal.localeCompare(a.tanggal)
  );

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <section className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Detail Presensi</h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{item.nama_lengkap}</span>
              <ClassBadge name={item.classroom_name || "Tanpa kelas"} educationState={item.education_state} />
            </div>
            <p className="mt-1 text-[10px] text-slate-400">
              {periodLabel} · {formatDate(range.dari)} s.d. {formatDate(range.sampai)}
            </p>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            <SummaryCard label="Hadir" value={item.stats.h} detail="hari" tone="green" />
            <SummaryCard label="Sakit" value={item.stats.s} detail="hari" tone="blue" />
            <SummaryCard label="Izin" value={item.stats.i} detail="hari" tone="amber" />
            <SummaryCard label="Alpa" value={item.stats.a} detail="hari" tone="rose" />
            <SummaryCard label="Kehadiran" value={`${item.stats.percentage}%`} detail={`${item.stats.total} catatan`} />
          </div>

          <div className="mt-5 overflow-hidden rounded-xl border border-slate-100">
            <div className="max-h-[42vh] overflow-auto">
              <table className="min-w-full divide-y divide-slate-100">
                <thead className="sticky top-0 z-10 bg-slate-50">
                  <tr>
                    <th className="w-14 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      No.
                    </th>
                    <th className="w-32 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Tanggal
                    </th>
                    <th className="w-28 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Hari
                    </th>
                    <th className="w-32 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Tahun Ajaran
                    </th>
                    <th className="w-40 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status Pendidikan
                    </th>
                    <th className="w-24 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Keterangan
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loading ? (
                    Array.from({ length: 5 }, (_, index) => (
                      <tr key={index}>
                        {Array.from({ length: 7 }, (_, cell) => (
                          <td key={cell} className="px-3 py-3">
                            <div className="h-3 animate-pulse rounded bg-slate-100" />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : error ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <ExclamationTriangleIcon className="mx-auto h-6 w-6 text-rose-300" />
                        <p className="mt-2 text-[11px] font-semibold text-slate-600">
                          Riwayat presensi gagal dimuat
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          {error}
                        </p>
                        <button
                          type="button"
                          onClick={onRetry}
                          className="ui-toolbar-button mt-3"
                        >
                          <ArrowPathIcon className="h-4 w-4" />
                          Muat Ulang
                        </button>
                      </td>
                    </tr>
                  ) : history.length ? (
                    history.map((record, index) => (
                      <tr key={`${record.tanggal}-${index}`} className="hover:bg-slate-50/60">
                        <td className="px-3 py-2.5 text-center text-[11px] text-slate-400">
                          {index + 1}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] font-medium text-slate-600">
                          {formatDate(record.tanggal)}
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-500">
                          {formatDay(record.tanggal)}
                        </td>
                        <td className="whitespace-nowrap px-3 py-2.5 text-[11px] font-medium text-slate-600">
                          {fallbackAcademicYear(new Date(`${record.tanggal}T00:00:00`))}
                        </td>
                        <td className="px-3 py-2.5">
                          <EducationBadge state={item.education_state} />
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span
                            className={`inline-flex min-w-7 items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusTone(record.status)}`}
                          >
                            {record.status}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-[11px] text-slate-500">
                          {text(record.keterangan) || "-"}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center">
                        <CalendarDaysIcon className="mx-auto h-6 w-6 text-slate-300" />
                        <p className="mt-2 text-[11px] font-semibold text-slate-600">
                          Belum ada riwayat harian
                        </p>
                        <p className="mt-1 text-[10px] text-slate-400">
                          Rekap tersedia, tetapi tidak ditemukan catatan presensi harian pada periode ini.
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" onClick={onClose} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            Tutup
          </button>
          <button
            type="button"
            onClick={onPrint}
            disabled={loading || Boolean(error) || history.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 text-xs font-semibold text-white hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" /> Cetak Detail
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

function PrintPopup({
  mode,
  onModeChange,
  filteredCount,
  selectedCount,
  periodLabel,
  range,
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

  const count = mode === "detail" ? selectedCount : filteredCount;

  return createPortal(
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <h3 className="text-base font-bold text-slate-900">Cetak Presensi</h3>
            <p className="mt-1 text-xs text-slate-500">{periodLabel}</p>
            <p className="mt-1 text-[10px] text-slate-400">{formatDate(range.dari)} s.d. {formatDate(range.sampai)}</p>
          </div>
          <button type="button" disabled={busy} onClick={onCancel} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 disabled:opacity-40">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="space-y-4 px-6 py-5">
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              type="button"
              disabled={busy || filteredCount === 0}
              onClick={() => onModeChange("recap")}
              className={`rounded-xl border p-4 text-left transition disabled:opacity-40 ${mode === "recap" ? "border-[#e94640] bg-red-50/60 ring-1 ring-[#e94640]/20" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <ClipboardDocumentCheckIcon className={`h-5 w-5 ${mode === "recap" ? "text-[#e94640]" : "text-slate-400"}`} />
              <div className="mt-2 text-sm font-semibold text-slate-800">Rekap Presensi</div>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">Satu laporan tabel rekap untuk {filteredCount} siswa yang sedang tampil.</p>
            </button>

            <button
              type="button"
              disabled={busy || selectedCount === 0}
              onClick={() => onModeChange("detail")}
              className={`rounded-xl border p-4 text-left transition disabled:opacity-40 ${mode === "detail" ? "border-[#e94640] bg-red-50/60 ring-1 ring-[#e94640]/20" : "border-slate-200 hover:bg-slate-50"}`}
            >
              <UserGroupIcon className={`h-5 w-5 ${mode === "detail" ? "text-[#e94640]" : "text-slate-400"}`} />
              <div className="mt-2 text-sm font-semibold text-slate-800">Detail Siswa</div>
              <p className="mt-1 text-[10px] leading-4 text-slate-500">Cetak detail harian massal untuk {selectedCount} siswa terpilih.</p>
            </button>
          </div>

          <div className="rounded-xl bg-slate-50 px-4 py-3">
            <div className="flex items-center justify-between gap-4 text-xs">
              <span className="text-slate-500">Dokumen yang akan dicetak</span>
              <span className="font-bold text-slate-800">{count} {mode === "detail" ? "siswa" : "baris rekap"}</span>
            </div>
          </div>

          {selectedCount === 0 && (
            <div className="rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
              Centang siswa pada tabel jika ingin menggunakan mode Detail Siswa.
            </div>
          )}
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button type="button" disabled={busy} onClick={onCancel} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Batal
          </button>
          <button type="button" disabled={busy || count === 0} onClick={onConfirm} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-slate-800 px-5 text-xs font-semibold text-white hover:bg-slate-700 disabled:opacity-50">
            {busy ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PrinterIcon className="h-4 w-4" />}
            {busy ? "Menyiapkan..." : mode === "detail" ? `Cetak ${count} Detail` : "Cetak Rekap"}
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

export default function RekapPresensiView() {
  const now = new Date();
  const initialYear = fallbackAcademicYear();
  const [periodType, setPeriodType] = useState("month");
  const [selectedWeek, setSelectedWeek] = useState(() => isoWeekValue(now));
  const [selectedMonth, setSelectedMonth] = useState(() => monthValue(now));
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedSemester, setSelectedSemester] = useState(fallbackAcademicSemester());
  const [customFrom, setCustomFrom] = useState(() => monthRange(monthValue(now)).dari);
  const [customTo, setCustomTo] = useState(() => monthRange(monthValue(now)).sampai);
  const [periods, setPeriods] = useState([]);
  const [classes, setClasses] = useState([]);
  const [staffMembers, setStaffMembers] = useState(() => readStaffCache());
  const [schoolProfile, setSchoolProfile] = useState(null);
  const [rows, setRows] = useState([]);
  const [selectedClass, setSelectedClass] = useState("all");
  const [educationStatus, setEducationStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(new Set());
  const [filtersOpen, setFiltersOpen] = useState(true);
  const [selectionMode, setSelectionMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMaster, setLoadingMaster] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailError, setDetailError] = useState("");
  const [printOpen, setPrintOpen] = useState(false);
  const [printMode, setPrintMode] = useState("recap");
  const [printing, setPrinting] = useState(false);
  const [printBatch, setPrintBatch] = useState(null);
  const [notice, setNotice] = useState(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const range = useMemo(() => {
    if (periodType === "week") return weekRange(selectedWeek);
    if (periodType === "month") return monthRange(selectedMonth);
    if (periodType === "semester") return semesterRange(selectedYear, selectedSemester);
    if (periodType === "year") return academicYearRange(selectedYear);
    return { dari: customFrom, sampai: customTo };
  }, [periodType, selectedWeek, selectedMonth, selectedYear, selectedSemester, customFrom, customTo]);

  const periodLabel = useMemo(() => {
    if (periodType === "week") return `Mingguan ${selectedWeek}`;
    if (periodType === "month") {
      const match = /^(\d{4})-(\d{2})$/.exec(selectedMonth);
      if (!match) return "Bulanan";
      const date = new Date(Number(match[1]), Number(match[2]) - 1, 1);
      return `Bulanan ${new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date)}`;
    }
    if (periodType === "semester") {
      return `${Number(selectedSemester) === 2 ? "Semester II (Genap)" : "Semester I (Ganjil)"} · ${selectedYear}`;
    }
    if (periodType === "year") return `Tahun Ajaran ${selectedYear}`;
    return "Rentang Tanggal";
  }, [periodType, selectedWeek, selectedMonth, selectedSemester, selectedYear]);

  const loadMaster = useCallback(async () => {
    setLoadingMaster(true);
    const [periodResult, officialYearsResult, currentPeriodResult, classResult, profileResult, staffResult] = await Promise.allSettled([
      fetchAttendanceReportPeriods(),
      fetchAcademicYearOptions(),
      fetchKegiatanCurrentAcademicPeriod(),
      fetchKegiatanClassrooms(),
      fetchSchoolProfile(),
      fetchStaff(),
    ]);

    if (periodResult.status === "fulfilled" || officialYearsResult.status === "fulfilled") {
      const byYear = new Map();
      if (periodResult.status === "fulfilled") {
        periodResult.value.forEach((item) => {
          if (item?.tahun_ajaran) byYear.set(item.tahun_ajaran, item);
        });
      }
      if (officialYearsResult.status === "fulfilled") {
        officialYearsResult.value.forEach((tahun_ajaran) => {
          if (!byYear.has(tahun_ajaran)) byYear.set(tahun_ajaran, { tahun_ajaran });
        });
      }
      setPeriods([...byYear.values()]);
    }
    if (currentPeriodResult.status === "fulfilled") {
      setSelectedYear(resolveAcademicYear(currentPeriodResult.value));
      setSelectedSemester(resolveAcademicSemester(currentPeriodResult.value));
    }
    if (classResult.status === "fulfilled") setClasses(classResult.value);
    if (profileResult.status === "fulfilled") setSchoolProfile(profileResult.value);
    if (staffResult.status === "fulfilled") {
      setStaffMembers(staffResult.value);
      writeStaffCache(staffResult.value);
    }
    setLoadingMaster(false);
  }, []);

  useEffect(() => {
    loadMaster();
  }, [loadMaster]);

  const loadRows = useCallback(async () => {
    if (!range.dari || !range.sampai || range.dari > range.sampai) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const result = await fetchAllStudentAttendanceReport({
        dari: range.dari,
        sampai: range.sampai,
      });
      setRows(result.items);
    } catch (error) {
      setRows([]);
      setNotice({
        type: "error",
        title: "Gagal memuat Presensi",
        message: errorOf(error),
      });
    } finally {
      setLoading(false);
    }
  }, [range.dari, range.sampai]);

  useEffect(() => {
    loadRows();
    setSelected(new Set());
    setPage(1);
  }, [loadRows]);

  const classOptions = useMemo(() => {
    const map = new Map();
    classes.forEach((item) => map.set(keyOf(item.id), { id: item.id, name: item.nama_kelas }));
    rows.forEach((item) => {
      if (item.classroom_id !== null && item.classroom_id !== undefined) {
        const key = keyOf(item.classroom_id);
        if (!map.has(key)) map.set(key, { id: item.classroom_id, name: item.classroom_name || `Kelas ${item.classroom_id}` });
      }
    });
    return [...map.values()].sort((a, b) => text(a.name).localeCompare(text(b.name), "id", { numeric: true, sensitivity: "base" }));
  }, [classes, rows]);

  const filteredRows = useMemo(() => {
    const q = normalized(search);
    return rows.filter((item) => {
      const classMatch = selectedClass === "all" || keyOf(item.classroom_id) === keyOf(selectedClass);
      const searchMatch = !q || [item.nama_lengkap, item.nomor_induk, item.nisn, item.classroom_name].some((value) => normalized(value).includes(q));
      const educationMatch = educationStatus === "all" || item.education_state === educationStatus;
      return classMatch && searchMatch && educationMatch;
    });
  }, [rows, selectedClass, educationStatus, search]);

  useEffect(() => {
    setPage(1);
  }, [selectedClass, educationStatus, search, pageSize]);

  const totals = useMemo(() => {
    const value = filteredRows.reduce(
      (acc, item) => ({
        h: acc.h + item.stats.h,
        s: acc.s + item.stats.s,
        i: acc.i + item.stats.i,
        a: acc.a + item.stats.a,
        total: acc.total + item.stats.total,
      }),
      { h: 0, s: 0, i: 0, a: 0, total: 0 }
    );
    return {
      ...value,
      percentage: value.total > 0 ? Math.round((value.h / value.total) * 100) : 0,
    };
  }, [filteredRows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const pageIds = pageRows.map((item) => keyOf(item.id));
  const allPage = pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePage = pageIds.some((id) => selected.has(id)) && !allPage;
  const selectedRows = rows.filter((item) => selected.has(keyOf(item.id)));

  const selectedClassroom = selectedClass === "all" ? null : classes.find((item) => keyOf(item.id) === keyOf(selectedClass)) || null;
  const homeroomTeacher = resolveHomeroomTeacher(selectedClassroom, staffMembers);
  const headmaster = resolveHeadmaster(staffMembers, range.sampai);
  const classroomLabel = selectedClass === "all" ? "Semua Kelas" : classOptions.find((item) => keyOf(item.id) === keyOf(selectedClass))?.name || "Kelas";

  const toggleSelected = (id) => {
    const key = keyOf(id);
    setSelected((previous) => {
      const next = new Set(previous);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      const remove = pageIds.every((id) => next.has(id));
      pageIds.forEach((id) => (remove ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectAllFiltered = () => {
    const ids = filteredRows.map((item) => keyOf(item.id));
    const allSelected = ids.length > 0 && ids.every((id) => selected.has(id));
    setSelected((previous) => {
      const next = new Set(previous);
      ids.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode((current) => {
      if (current) setSelected(new Set());
      return !current;
    });
  };


  const loadStudentHistory = useCallback(
    async (item) => {
      const history = await fetchStudentAttendanceHistory({
        student_id: item.id,
        dari: range.dari,
        sampai: range.sampai,
        expected_total: item.stats?.total ?? 0,
        candidate_dates: Array.isArray(item.history)
          ? item.history.map((record) => record.tanggal)
          : [],
        preferred_classroom_id: item.classroom_id,
      });

      return { ...item, history };
    },
    [range.dari, range.sampai]
  );

  const loadHistories = useCallback(
    async (items, concurrency = 3) => {
      const output = new Array(items.length);
      let cursor = 0;

      const workers = Array.from(
        { length: Math.min(Math.max(1, concurrency), Math.max(items.length, 1)) },
        async () => {
          while (cursor < items.length) {
            const index = cursor++;
            output[index] = await loadStudentHistory(items[index]);
          }
        }
      );

      await Promise.all(workers);
      return output;
    },
    [loadStudentHistory]
  );

  const openDetail = useCallback(
    async (item) => {
      setDetail({ ...item, history: Array.isArray(item.history) ? item.history : [] });
      setDetailLoading(true);
      setDetailError("");

      try {
        const hydrated = await loadStudentHistory(item);
        setDetail(hydrated);
      } catch (error) {
        setDetailError(errorOf(error));
      } finally {
        setDetailLoading(false);
      }
    },
    [loadStudentHistory]
  );

  const queuePrint = useCallback((batch) => {
    setPrintBatch(batch);
    const clear = () => setPrintBatch(null);
    window.addEventListener("afterprint", clear, { once: true });
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.print());
    });
  }, []);

  const handleConfirmPrint = async () => {
    const items = printMode === "detail" ? selectedRows : filteredRows;
    if (!items.length) {
      setNotice({
        type: "error",
        title: "Data tidak tersedia",
        message:
          printMode === "detail"
            ? "Pilih minimal satu siswa untuk mencetak detail presensi."
            : "Tidak ada data presensi pada filter saat ini.",
      });
      return;
    }

    setPrinting(true);

    try {
      const printableItems =
        printMode === "detail" ? await loadHistories(items, 3) : items;

      setPrintOpen(false);
      queuePrint({
        mode: printMode,
        items: printableItems,
        printedAt: new Date(),
      });
    } catch (error) {
      setNotice({
        type: "error",
        title: "Gagal menyiapkan detail presensi",
        message: errorOf(error),
      });
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintSingle = async (item) => {
    setPrintMode("detail");
    setSelected(new Set([keyOf(item.id)]));
    setPrinting(true);

    try {
      const hydrated = await loadStudentHistory(item);
      setDetail(null);
      queuePrint({
        mode: "detail",
        items: [hydrated],
        printedAt: new Date(),
      });
    } catch (error) {
      setNotice({
        type: "error",
        title: "Gagal menyiapkan detail presensi",
        message: errorOf(error),
      });
    } finally {
      setPrinting(false);
    }
  };

  const yearOptions = useMemo(() => {
    const values = new Set(periods.map((item) => item.tahun_ajaran).filter(Boolean));
    if (!values.size) values.add(initialYear);
    if (selectedYear) values.add(selectedYear);
    return [...values].sort((a, b) => b.localeCompare(a));
  }, [periods, initialYear, selectedYear]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <style>{`
        @media print {
          body > * { display: none !important; }
          #attendance-print-root { display: block !important; position: absolute; inset: 0 auto auto 0; width: 100%; min-height: 100%; z-index: 99999; background: white; }
        }
      `}</style>

      <SectionHeader
        icon={ClipboardDocumentCheckIcon}
        title="Cetak Rekap Presensi"
        description="Cetak rekap kehadiran kelas atau detail presensi siswa berdasarkan periode dan data presensi yang tersimpan."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {filteredRows.length}
              </b>{" "}
              siswa ·{" "}
              <b className="font-semibold text-emerald-600">
                {totals.percentage}%
              </b>{" "}
              hadir
            </span>

            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className={`ui-toolbar-button ${filtersOpen ? "is-active" : ""}`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>

            <button
              type="button"
              onClick={toggleSelectionMode}
              className={`ui-toolbar-button ${selectionMode ? "is-active" : ""}`}
            >
              {selectionMode ? (
                <CheckCircleIcon className="h-4 w-4" />
              ) : (
                <UserGroupIcon className="h-4 w-4" />
              )}
              {selectionMode ? "Selesai Pilih" : "Pilih Siswa"}
            </button>

            {selectionMode ? (
              <button
                type="button"
                disabled={!selectedRows.length}
                onClick={() => {
                  setPrintMode("detail");
                  setPrintOpen(true);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PrinterIcon className="h-4 w-4" />
                Cetak Terpilih
                {selectedRows.length > 0 ? ` (${selectedRows.length})` : ""}
              </button>
            ) : (
              <button
                type="button"
                disabled={loading || filteredRows.length === 0}
                onClick={() => {
                  setPrintMode("recap");
                  setPrintOpen(true);
                }}
                className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
              >
                <PrinterIcon className="h-4 w-4" />
                Cetak Rekap
              </button>
            )}
          </>
        }
      />

      {filtersOpen && (
        <div className="rounded-xl border border-slate-100 bg-slate-50/40 p-3">
          <div className="flex flex-col gap-2 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-1 flex-wrap items-end gap-2">
              <label className="min-w-36">
                <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                  Periode
                </span>
                <select
                  value={periodType}
                  onChange={(event) => setPeriodType(event.target.value)}
                  className="ui-compact-control w-full"
                >
                  <option value="week">Mingguan</option>
                  <option value="month">Bulanan</option>
                  <option value="semester">Semester</option>
                  <option value="year">Tahun Ajaran</option>
                  <option value="custom">Rentang Tanggal</option>
                </select>
              </label>

              {periodType === "week" && (
                <label className="min-w-40">
                  <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                    Minggu
                  </span>
                  <input
                    type="week"
                    value={selectedWeek}
                    onChange={(event) => setSelectedWeek(event.target.value)}
                    className="ui-compact-control w-full"
                  />
                </label>
              )}

              {periodType === "month" && (
                <label className="min-w-40">
                  <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                    Bulan
                  </span>
                  <input
                    type="month"
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    className="ui-compact-control w-full"
                  />
                </label>
              )}

              {(periodType === "semester" || periodType === "year") && (
                <label className="min-w-40">
                  <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                    Tahun Ajaran
                  </span>
                  <select
                    value={selectedYear}
                    onChange={(event) => setSelectedYear(event.target.value)}
                    className="ui-compact-control w-full"
                  >
                    {yearOptions.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              {periodType === "semester" && (
                <label className="min-w-44">
                  <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                    Semester
                  </span>
                  <select
                    value={selectedSemester}
                    onChange={(event) =>
                      setSelectedSemester(Number(event.target.value))
                    }
                    className="ui-compact-control w-full"
                  >
                    <option value={1}>Semester I (Ganjil)</option>
                    <option value={2}>Semester II (Genap)</option>
                  </select>
                </label>
              )}

              {periodType === "custom" && (
                <>
                  <label className="min-w-40">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                      Dari
                    </span>
                    <input
                      type="date"
                      value={customFrom}
                      onChange={(event) => setCustomFrom(event.target.value)}
                      className="ui-compact-control w-full"
                    />
                  </label>
                  <label className="min-w-40">
                    <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                      Sampai
                    </span>
                    <input
                      type="date"
                      value={customTo}
                      onChange={(event) => setCustomTo(event.target.value)}
                      className="ui-compact-control w-full"
                    />
                  </label>
                </>
              )}

              <label className="min-w-44">
                <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                  Kelas
                </span>
                <select
                  value={selectedClass}
                  onChange={(event) => setSelectedClass(event.target.value)}
                  className="ui-compact-control w-full"
                >
                  <option value="all">Semua Kelas</option>
                  {classOptions.map((item) => (
                    <option key={keyOf(item.id)} value={keyOf(item.id)}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </label>

              <label className="min-w-52">
                <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                  Status Pendidikan
                </span>
                <select
                  value={educationStatus}
                  onChange={(event) => setEducationStatus(event.target.value)}
                  className="ui-compact-control w-full"
                >
                  {EDUCATION_STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <button
                type="button"
                onClick={() => {
                  loadMaster();
                  loadRows();
                }}
                disabled={loading || loadingMaster}
                className="ui-toolbar-button"
              >
                <ArrowPathIcon
                  className={`h-4 w-4 ${
                    loading || loadingMaster ? "animate-spin" : ""
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
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama, NIS, atau kelas..."
                className="ui-compact-control w-full pl-9"
              />
            </div>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            <span>
              <CalendarDaysIcon className="mr-1 inline h-3.5 w-3.5" />
              {periodLabel}
            </span>
            <span>
              {formatDate(range.dari)} s.d. {formatDate(range.sampai)}
            </span>
            <span>
              H <b className="font-semibold text-emerald-600">{totals.h}</b>
            </span>
            <span>
              S <b className="font-semibold text-blue-600">{totals.s}</b>
            </span>
            <span>
              I <b className="font-semibold text-amber-600">{totals.i}</b>
            </span>
            <span>
              A <b className="font-semibold text-rose-600">{totals.a}</b>
            </span>
          </div>
        </div>
      )}

      {selectionMode && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold text-slate-700">
              Mode pilih siswa aktif
            </p>
            <p className="mt-0.5 text-[10px] text-slate-400">
              Pilih siswa untuk mencetak detail presensi secara massal.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedRows.length > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="h-8 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 hover:bg-white"
              >
                Kosongkan
              </button>
            )}
            <button
              type="button"
              disabled={!filteredRows.length}
              onClick={selectAllFiltered}
              className="h-8 rounded-lg border border-red-100 bg-white px-2.5 text-[10px] font-semibold text-[#ef4d45] disabled:opacity-40"
            >
              {filteredRows.length > 0 &&
              filteredRows.every((item) =>
                selected.has(keyOf(item.id))
              )
                ? "Batal Pilih Semua"
                : "Pilih Semua Hasil"}
            </button>
            <span className="text-[10px] text-slate-500">
              <b className="font-semibold text-[#ef4d45]">
                {selectedRows.length}
              </b>{" "}
              siswa dipilih
            </span>
          </div>
        </div>
      )}

      <div className="ui-table-card overflow-hidden">
        <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-[11px] font-semibold text-slate-700">
              Rekap Kehadiran Siswa
            </h2>
            <p className="mt-0.5 text-[10px] text-slate-400">
              {classroomLabel} · {periodLabel}
            </p>
          </div>
          <p className="text-[10px] text-slate-400">
            <b className="font-semibold text-slate-600">
              {filteredRows.length}
            </b>{" "}
            siswa ·{" "}
            <b className="font-semibold text-emerald-600">
              {totals.percentage}%
            </b>{" "}
            kehadiran
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-300">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                <th className="w-20 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  <div className="flex items-center gap-2">
                    {selectionMode && (
                      <Checkbox
                        checked={allPage}
                        indeterminate={somePage}
                        onChange={togglePage}
                        label="Pilih semua siswa di halaman"
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
                <th className="w-14 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  H
                </th>
                <th className="w-14 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  S
                </th>
                <th className="w-14 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  I
                </th>
                <th className="w-14 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  A
                </th>
                <th className="w-20 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Total
                </th>
                <th className="w-24 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Kehadiran
                </th>
                <th className="w-32 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 13 }, (_, cell) => (
                      <td key={cell} className="px-3 py-3">
                        <div className="h-3 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : pageRows.length ? (
                pageRows.map((item, index) => {
                  const checked = selected.has(keyOf(item.id));

                  return (
                    <tr
                      key={keyOf(item.id)}
                      className={`transition hover:bg-slate-50/60 ${
                        checked ? "bg-red-50/30" : ""
                      }`}
                    >
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          {selectionMode && (
                            <Checkbox
                              checked={checked}
                              onChange={() => toggleSelected(item.id)}
                              label={`Pilih ${item.nama_lengkap}`}
                            />
                          )}
                          <span className="text-[11px] text-slate-400">
                            {(currentPage - 1) * pageSize + index + 1}
                          </span>
                        </div>
                      </td>

                      <td className="px-3 py-2.5">
                        <p className="max-w-64 truncate text-[12px] font-semibold text-slate-800">
                          {item.nama_lengkap}
                        </p>
                      </td>

                      <td className="px-3 py-2.5 text-[11px] text-slate-600">
                        {studentNis(item) || "-"}
                      </td>

                      <td className="px-3 py-2.5">
                        <ClassBadge
                          name={item.classroom_name}
                          educationState={item.education_state}
                        />
                      </td>

                      <td className="px-3 py-2.5 text-[11px] font-medium text-slate-600">
                        {studentAcademicYear(item) || "-"}
                      </td>

                      <td className="px-3 py-2.5">
                        <EducationBadge state={item.education_state} />
                      </td>

                      <td className="px-3 py-2.5 text-center text-[11px] font-semibold text-emerald-600">
                        {item.stats.h}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[11px] text-blue-600">
                        {item.stats.s}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[11px] text-amber-600">
                        {item.stats.i}
                      </td>
                      <td className="px-3 py-2.5 text-center text-[11px] text-rose-600">
                        {item.stats.a}
                      </td>

                      <td className="px-3 py-2.5 text-center text-[11px] font-semibold text-slate-600">
                        {item.stats.total}
                      </td>

                      <td className="px-3 py-2.5 text-center">
                        <span className="inline-flex min-w-12 items-center justify-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                          {item.stats.percentage}%
                        </span>
                      </td>

                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => openDetail(item)}
                            className="ui-action-button"
                            title="Lihat detail presensi"
                          >
                            <EyeIcon className="h-3.5 w-3.5" />
                            Detail
                          </button>
                          <button
                            type="button"
                            onClick={() => handlePrintSingle(item)}
                            className="ui-action-button"
                            title="Cetak detail siswa"
                          >
                            <PrinterIcon className="h-3.5 w-3.5" />
                            Cetak
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={11} className="px-3 py-10 text-center">
                    <FunnelIcon className="mx-auto h-6 w-6 text-slate-300" />
                    <p className="mt-2 text-[11px] font-semibold text-slate-600">
                      Belum ada data presensi
                    </p>
                    <p className="mt-1 text-[10px] text-slate-400">
                      Ubah periode, kelas, atau pencarian untuk melihat data lain.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {!loading && filteredRows.length > 0 && (
          <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-[10px] text-slate-400">
              Menampilkan{" "}
              <b className="font-semibold text-slate-600">
                {(currentPage - 1) * pageSize + 1}
              </b>
              –
              <b className="font-semibold text-slate-600">
                {Math.min(currentPage * pageSize, filteredRows.length)}
              </b>{" "}
              dari{" "}
              <b className="font-semibold text-slate-600">
                {filteredRows.length}
              </b>{" "}
              siswa
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <select
                value={pageSize}
                onChange={(event) => setPageSize(Number(event.target.value))}
                className="ui-compact-control h-8 min-w-28"
              >
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <option key={size} value={size}>
                    {size} / halaman
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={() => setPage((value) => Math.max(1, value - 1))}
                className="ui-toolbar-button h-8"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>

              <span className="min-w-16 text-center text-[10px] font-semibold text-slate-500">
                {currentPage} / {totalPages}
              </span>

              <button
                type="button"
                disabled={currentPage >= totalPages}
                onClick={() =>
                  setPage((value) => Math.min(totalPages, value + 1))
                }
                className="ui-toolbar-button h-8"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {detail && (
        <DetailPopup
          item={detail}
          range={range}
          periodLabel={periodLabel}
          loading={detailLoading}
          error={detailError}
          onClose={() => {
            setDetail(null);
            setDetailError("");
          }}
          onRetry={() => openDetail(detail)}
          onPrint={() => handlePrintSingle(detail)}
        />
      )}

      {printOpen && (
        <PrintPopup
          mode={printMode}
          onModeChange={setPrintMode}
          filteredCount={filteredRows.length}
          selectedCount={selectedRows.length}
          periodLabel={periodLabel}
          range={range}
          onCancel={() => setPrintOpen(false)}
          onConfirm={handleConfirmPrint}
          busy={printing}
        />
      )}

      <NoticePopup notice={notice} onClose={() => setNotice(null)} />

      {typeof document !== "undefined" && printBatch && createPortal(
        <div id="attendance-print-root" style={{ display: "none" }}>
          <AttendancePrintTemplate
            mode={printBatch.mode}
            items={printBatch.items}
            schoolProfile={schoolProfile}
            periodLabel={periodLabel}
            dateRange={range}
            classroom={selectedClassroom}
            classroomLabel={classroomLabel}
            headmaster={headmaster}
            homeroomTeacher={homeroomTeacher}
            printedAt={printBatch.printedAt}
          />
        </div>,
        document.body
      )}
    </div>
  );
}
