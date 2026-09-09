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
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  SparklesIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchDailyActivityReportFast,
  fetchReportClassrooms,
} from "../../../api/report-students";
import { fetchKegiatanCurrentAcademicPeriod } from "../../../api/kegiatan";
import { fetchAcademicYearOptions } from "../../../api/academic-periods";
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
  StudentEducationSummary,
  studentAcademicYear,
  studentNis,
} from "../components/StudentEducationMeta";

const STAFF_CACHE_KEY = "ssphere:rapor:staff-actor-cache:v1";
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const text = (value) => String(value ?? "").trim();
const keyOf = (value) => String(value ?? "");
const normalized = (value) => text(value).toLowerCase().replace(/\s+/g, " ");

const participationLabel = (value) => {
  const status = normalized(value);
  if (["dilakukan", "ya", "yes", "true", "1", "berpartisipasi"].includes(status)) {
    return "Dilakukan";
  }
  if (["tidak dilakukan", "tidak", "no", "false", "0", "tidak berpartisipasi"].includes(status)) {
    return "Tidak Dilakukan";
  }
  return "-";
};

const errorOf = (error) =>
  text(
    error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message
  ) || "Terjadi kesalahan.";

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const reportYearOptions = (anchorYear = fallbackAcademicYear()) =>
  buildAcademicYearOptions(anchorYear, 8).map((tahun_ajaran) => ({
    tahun_ajaran,
    total_days: 0,
    dari: "",
    sampai: "",
  }));

const monthValue = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const isoWeekValue = (source = new Date()) => {
  const date = new Date(
    Date.UTC(source.getFullYear(), source.getMonth(), source.getDate())
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(
    (((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7
  );
  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const weekRange = (value) => {
  const match = /^(\d{4})-W(\d{2})$/.exec(text(value));
  if (!match) return { dari: "", sampai: "" };

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(year, 0, 4);
  const day = januaryFourth.getDay() || 7;
  const monday = new Date(januaryFourth);
  monday.setDate(januaryFourth.getDate() - day + 1 + (week - 1) * 7);
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  return {
    dari: localDate(monday),
    sampai: localDate(friday),
  };
};

const monthRange = (value) => {
  const match = /^(\d{4})-(\d{2})$/.exec(text(value));
  if (!match) return { dari: "", sampai: "" };

  const year = Number(match[1]);
  const month = Number(match[2]);

  return {
    dari: localDate(new Date(year, month - 1, 1)),
    sampai: localDate(new Date(year, month, 0)),
  };
};

const semesterRange = (tahunAjaran, semester) => {
  const startYear = Number(text(tahunAjaran).split("/")[0]);
  if (!Number.isFinite(startYear)) return { dari: "", sampai: "" };

  return Number(semester) === 2
    ? {
        dari: `${startYear + 1}-01-01`,
        sampai: `${startYear + 1}-06-30`,
      }
    : {
        dari: `${startYear}-07-01`,
        sampai: `${startYear}-12-31`,
      };
};

const yearRange = (tahunAjaran) => {
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

const dayName = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
  }).format(date);
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

const resolveHeadmaster = (staffMembers) =>
  staffMembers.find(
    (staff) => normalized(staff?.jabatan) === "kepala sekolah"
  ) || null;

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
    blue: "bg-blue-50 text-blue-700",
    amber: "bg-amber-50 text-amber-700",
    green: "bg-emerald-50 text-emerald-700",
    violet: "bg-violet-50 text-violet-700",
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div
        className={`inline-flex rounded-lg px-2 py-1 text-[10px] font-semibold ${
          tones[tone] || tones.slate
        }`}
      >
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

  const error = notice.type === "error";

  return createPortal(
    <div className="fixed right-5 top-5 z-180 w-[min(92vw,390px)] rounded-xl border border-slate-200 bg-white p-4 shadow-2xl">
      <div className="flex items-start gap-3">
        <div
          className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            error
              ? "bg-rose-50 text-rose-600"
              : "bg-emerald-50 text-emerald-600"
          }`}
        >
          {error ? (
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
        >
          <XMarkIcon className="h-4 w-4" />
        </button>
      </div>
    </div>,
    document.body
  );
}

function PlanGrid({ plan }) {
  const fields = [
    ["Tema", plan?.tema],
    ["Pilar Karakter", plan?.pilar_karakter],
    ["Nilai Karakter", plan?.nilai_karakter],
    ["Jurnal", plan?.jurnal],
    ["Aktivitas", plan?.aktivitas],
    ["Pembiasaan", plan?.pembiasaan],
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {fields.map(([label, value]) => (
        <div
          key={label}
          className="rounded-lg border border-slate-100 bg-slate-50/70 px-3 py-3"
        >
          <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {label}
          </div>
          <div className="mt-1 text-xs font-semibold leading-5 text-slate-700">
            {text(value) || "-"}
          </div>
        </div>
      ))}
    </div>
  );
}

function DetailPopup({ record, onClose, onPrint }) {
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

  return createPortal(
    <div className="fixed inset-0 z-160 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
              LAPORAN AKTIVITAS HARIAN
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {dayName(record.tanggal)}, {formatDate(record.tanggal)}
            </h3>
            <div className="mt-2">
              <ClassBadge
                name={record.classroom_name}
                educationState={
                  record.items?.length &&
                  record.items.every((student) => student.education_state === "graduated")
                    ? "graduated"
                    : "current"
                }
              />
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          {record.is_holiday ? (
            <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-4 text-amber-700">
              <SparklesIcon className="h-6 w-6 shrink-0" />
              <div>
                <div className="text-sm font-bold">Hari Libur</div>
                <div className="mt-0.5 text-xs">
                  Tidak ada aktivitas dan penilaian siswa pada tanggal ini.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-5">
                <div className="mb-3 flex items-center gap-2">
                  <ClipboardDocumentListIcon className="h-4 w-4 text-[#e94640]" />
                  <h4 className="text-sm font-bold text-slate-800">
                    Rencana Harian Kelas
                  </h4>
                </div>
                <PlanGrid plan={record.plan} />
              </div>

              <div className="grid gap-3 sm:grid-cols-4">
                <SummaryCard
                  label="Siswa"
                  value={record.stats.total_students}
                  detail="Tercatat"
                />
                <SummaryCard
                  label="Data Aktivitas Terisi"
                  value={record.stats.filled_students}
                  detail="Memiliki data aktivitas"
                  tone="green"
                />
                <SummaryCard
                  label="Nilai Karakter"
                  value={record.items.filter((student) => student.log?.nilai_karakter_status === "Dilakukan").length}
                  detail="Dilakukan"
                  tone="amber"
                />
                <SummaryCard
                  label="Pembiasaan"
                  value={record.items.filter((student) => student.log?.pembiasaan_status === "Dilakukan").length}
                  detail="Dilakukan"
                  tone="blue"
                />
              </div>

              <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-[100rem] w-full">
                    <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-400">
                      <tr>
                        <th className="px-3 py-3 text-left">No</th>
                        <th className="px-3 py-3 text-left">Anak Didik</th>
                        <th className="px-3 py-3 text-left">NIS</th>
                        <th className="px-3 py-3 text-left">Tahun Ajaran</th>
                        <th className="px-3 py-3 text-left">Status Pendidikan</th>
                        <th className="px-3 py-3 text-center">Nilai Karakter</th>
                        <th className="px-3 py-3 text-center">Jurnal</th>
                        <th className="px-3 py-3 text-center">Aktivitas</th>
                        <th className="px-3 py-3 text-center">Pembiasaan</th>
                        <th className="px-3 py-3 text-center">Makananku</th>
                        <th className="px-3 py-3 text-center">Perasaan</th>
                        <th className="px-3 py-3 text-left">Barang Besok</th>
                        <th className="px-3 py-3 text-left">Catatan Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {record.items.map((student, index) => (
                        <tr key={student.id}>
                          <td className="px-3 py-3 text-xs text-slate-400">
                            {index + 1}
                          </td>
                          <td className="px-3 py-3">
                            <div className="text-xs font-semibold text-slate-700">
                              {student.nama_lengkap}
                            </div>
                          </td>
                          <td className="px-3 py-3 text-xs text-slate-600">
                            {studentNis(student) || "-"}
                          </td>
                          <td className="px-3 py-3 text-xs font-medium text-slate-600">
                            {studentAcademicYear(student) || "-"}
                          </td>
                          <td className="px-3 py-3">
                            <EducationBadge state={student.education_state} />
                          </td>
                          <td className="px-3 py-3 text-center text-xs text-slate-600">{participationLabel(student.log?.nilai_karakter_status)}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-600">{participationLabel(student.log?.jurnal_status)}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-600">{participationLabel(student.log?.aktivitas_status)}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-600">{participationLabel(student.log?.pembiasaan_status)}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-600">{student.log?.makanan || "-"}</td>
                          <td className="px-3 py-3 text-center text-xs text-slate-600">{student.log?.perasaan || "-"}</td>
                          <td className="max-w-48 px-3 py-3 text-xs leading-5 text-slate-600">{student.log?.barang_bawaan || "-"}</td>
                          <td className="max-w-56 px-3 py-3 text-xs leading-5 text-slate-600">{student.log?.catatan_guru || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={() => onPrint([record])}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Laporan
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

function PrintConfirmPopup({ count, loading, onCancel, onConfirm }) {
  return createPortal(
    <div className="fixed inset-0 z-170 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-[#e94640]">
          <PrinterIcon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          Cetak LAPORAN AKTIVITAS HARIAN
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {count} laporan aktivitas harian akan dimasukkan ke dokumen cetak.
          Setiap tanggal dan kelas menjadi bagian laporan tersendiri.
        </p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-lg bg-[#e94640] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#d63d38] disabled:opacity-50"
          >
            {loading ? (
              <ArrowPathIcon className="h-4 w-4 animate-spin" />
            ) : (
              <PrinterIcon className="h-4 w-4" />
            )}
            Lanjut Cetak
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default function DailyClassActivityView({ typeTabs }) {
  const [periodType, setPeriodType] = useState("weekly");
  const [selectedDate, setSelectedDate] = useState(() => localDate(new Date()));
  const [week, setWeek] = useState(() => isoWeekValue());
  const [month, setMonth] = useState(() => monthValue());
  const [selectedYear, setSelectedYear] = useState(() =>
    fallbackAcademicYear()
  );
  const [semester, setSemester] = useState(() => fallbackAcademicSemester());
  const [customRange, setCustomRange] = useState(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return {
      dari: localDate(first),
      sampai: localDate(now),
    };
  });
  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState(() => reportYearOptions());
  const [profile, setProfile] = useState(null);
  const [staffMembers, setStaffMembers] = useState(() => readStaffCache());
  const [printModule, setPrintModule] = useState(null);
  const [selectedClass, setSelectedClass] = useState("all");
  const [educationStatus, setEducationStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [report, setReport] = useState({
    dari: "",
    sampai: "",
    items: [],
    total_days: 0,
    total_holidays: 0,
    total_student_logs: 0,
    total_filled_students: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detail, setDetail] = useState(null);
  const [notice, setNotice] = useState(null);
  const [printRequest, setPrintRequest] = useState(null);
  const [printContext, setPrintContext] = useState(null);
  const [printing, setPrinting] = useState(false);

  const range = useMemo(() => {
    if (periodType === "daily") {
      return {
        dari: selectedDate,
        sampai: selectedDate,
      };
    }
    if (periodType === "weekly") return weekRange(week);
    if (periodType === "monthly") return monthRange(month);
    if (periodType === "semester") {
      return semesterRange(selectedYear, semester);
    }
    if (periodType === "year") return yearRange(selectedYear);
    return customRange;
  }, [
    periodType,
    selectedDate,
    week,
    month,
    selectedYear,
    semester,
    customRange,
  ]);

  const periodLabel = useMemo(() => {
    if (periodType === "daily") {
      return `${dayName(selectedDate)}, ${formatDate(selectedDate)}`;
    }
    if (periodType === "weekly") return `Minggu ${week}`;
    if (periodType === "monthly") {
      const [year, monthNumber] = month.split("-").map(Number);
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(new Date(year, monthNumber - 1, 1));
    }
    if (periodType === "semester") {
      return `Semester ${
        Number(semester) === 1 ? "I (Ganjil)" : "II (Genap)"
      } ${selectedYear}`;
    }
    if (periodType === "year") {
      return `Tahun Ajaran ${selectedYear}`;
    }
    return `${formatDate(range.dari)} s.d. ${formatDate(range.sampai)}`;
  }, [
    periodType,
    selectedDate,
    week,
    month,
    selectedYear,
    semester,
    range,
  ]);

  const loadMaster = useCallback(async () => {
    const [classResult, periodResult, officialYearsResult] = await Promise.allSettled([
      fetchReportClassrooms(),
      fetchKegiatanCurrentAcademicPeriod(),
      fetchAcademicYearOptions(),
    ]);

    setClasses(classResult.status === "fulfilled" ? classResult.value : []);

    if (periodResult.status === "fulfilled") {
      const year = resolveAcademicYear(periodResult.value);
      setSelectedYear(year);
      setSemester(resolveAcademicSemester(periodResult.value));
      const officialYears =
        officialYearsResult.status === "fulfilled" ? officialYearsResult.value : [];
      const values = officialYears.length
        ? officialYears.map((tahun_ajaran) => ({ tahun_ajaran }))
        : reportYearOptions(year);
      if (!values.some((item) => item.tahun_ajaran === year)) {
        values.unshift({ tahun_ajaran: year });
      }
      setPeriods(values);
    }
  }, []);

  useEffect(() => {
    loadMaster();
  }, [loadMaster]);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  const loadReport = useCallback(async () => {
    if (!range.dari || !range.sampai || range.dari > range.sampai) {
      setReport({
        dari: range.dari,
        sampai: range.sampai,
        items: [],
        total_days: 0,
        total_holidays: 0,
        total_student_logs: 0,
        total_filled_students: 0,
      });
      return;
    }

    setLoading(true);

    try {
      const result = await fetchDailyActivityReportFast({
        dari: range.dari,
        sampai: range.sampai,
        classroom_id: selectedClass,
        education_state: educationStatus,
        q: debouncedSearch,
      });
      setReport(result);
    } catch (error) {
      setReport({
        dari: range.dari,
        sampai: range.sampai,
        items: [],
        total_days: 0,
        total_holidays: 0,
        total_student_logs: 0,
        total_filled_students: 0,
      });
      setNotice({
        type: "error",
        title: "Gagal memuat Aktivitas",
        message: errorOf(error),
      });
    } finally {
      setLoading(false);
    }
  }, [range, selectedClass, educationStatus, debouncedSearch]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
    setDetail(null);
  }, [
    periodType,
    selectedDate,
    week,
    month,
    selectedYear,
    semester,
    customRange.dari,
    customRange.sampai,
    selectedClass,
    educationStatus,
    debouncedSearch,
  ]);

  const totalPages = Math.max(1, Math.ceil(report.items.length / limit));
  const currentPage = Math.min(page, totalPages);

  const pageItems = useMemo(
    () => report.items.slice((currentPage - 1) * limit, currentPage * limit),
    [report.items, currentPage, limit]
  );

  const recordKey = (record) =>
    `${record.tanggal}_${keyOf(record.classroom_id)}`;

  const pageKeys = pageItems.map(recordKey);
  const allPageSelected =
    pageKeys.length > 0 && pageKeys.every((value) => selected.has(value));
  const somePageSelected =
    pageKeys.some((value) => selected.has(value)) && !allPageSelected;

  const selectedItems = report.items.filter((record) =>
    selected.has(recordKey(record))
  );

  const activeDays = report.total_days - report.total_holidays;
  const completion =
    report.total_student_logs > 0
      ? Math.round(
          (report.total_filled_students / report.total_student_logs) * 100
        )
      : 0;

  const homeroomTeachers = useMemo(() => {
    const result = {};

    classes.forEach((classroom) => {
      result[keyOf(classroom.id)] = resolveHomeroomTeacher(
        classroom,
        staffMembers
      );
    });

    return result;
  }, [classes, staffMembers]);

  const headmaster = useMemo(
    () => resolveHeadmaster(staffMembers),
    [staffMembers]
  );

  const toggleRecord = (record) => {
    const value = recordKey(record);

    setSelected((previous) => {
      const next = new Set(previous);
      next.has(value) ? next.delete(value) : next.add(value);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      const remove = pageKeys.every((value) => next.has(value));

      pageKeys.forEach((value) => {
        remove ? next.delete(value) : next.add(value);
      });

      return next;
    });
  };

  const selectAll = () => {
    setSelected(new Set(report.items.map(recordKey)));
  };

  const requestPrint = (records) => {
    if (!records.length) {
      setNotice({
        type: "error",
        title: "Data belum tersedia",
        message: "Pilih minimal satu laporan aktivitas yang akan dicetak.",
      });
      return;
    }

    setPrintRequest(records);
  };

  const runPrint = async () => {
    if (!printRequest?.length || printing) return;

    setPrinting(true);

    try {
      const [kegiatanApi, staffApi, templateModule] =
        await Promise.all([
          import("../../../api/kegiatan"),
          import("../../../api/staff"),
          import("../../../components/common/DailyActivityPrintTemplate"),
        ]);

      const [profileValue, staffValue] = await Promise.all([
        kegiatanApi.fetchSchoolProfile(),
        staffApi.fetchStaff(),
      ]);

      writeStaffCache(staffValue);
      setProfile(profileValue);
      setStaffMembers(staffValue);
      setPrintModule(templateModule);

      const teacherMap = {};
      classes.forEach((classroom) => {
        teacherMap[keyOf(classroom.id)] =
          resolveHomeroomTeacher(classroom, staffValue);
      });

      setPrintContext({
        records: printRequest,
        profile: profileValue,
        periodLabel,
        homeroomTeachers: teacherMap,
        headmaster: resolveHeadmaster(staffValue),
        printedAt: new Date(),
      });
      setPrintRequest(null);

      const clear = () => {
        setPrintContext(null);
        setPrinting(false);
      };

      window.addEventListener("afterprint", clear, {
        once: true,
      });

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.print();
        });
      });
    } catch (error) {
      setPrinting(false);
      setNotice({
        type: "error",
        title: "Gagal menyiapkan cetak",
        message: errorOf(error),
      });
    }
  };

  return (
    <div className="min-w-0">
      <style>{`
        @media print {
          body > * {
            display: none !important;
          }

          #daily-activity-print-root {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
            z-index: 99999;
          }
        }
      `}</style>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {typeTabs}

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">
            <b className="font-semibold text-slate-600">
              {report.items.length}
            </b>{" "}
            laporan kelas
          </span>
          <span className="text-xs text-slate-400">
            <b className="font-semibold text-emerald-600">
              {report.total_filled_students}
            </b>{" "}
            data siswa terisi
          </span>
          <button
            type="button"
            disabled={loading || selectedItems.length === 0}
            onClick={() => requestPrint(selectedItems)}
            className="ui-toolbar-button"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Terpilih
            {selectedItems.length
              ? ` (${selectedItems.length})`
              : ""}
          </button>

          <button
            type="button"
            disabled={loading || report.items.length === 0}
            onClick={() => requestPrint(report.items)}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Semua Data
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-xl border border-slate-100 bg-slate-50/40 p-3">
        <div className="grid gap-4 xl:grid-cols-[170px_1fr_190px_220px_250px]">
          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Jenis Periode
            </label>
            <select
              value={periodType}
              onChange={(event) => setPeriodType(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#e94640]"
            >
              <option value="daily">Harian</option>
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="semester">Semester</option>
              <option value="year">Tahun Ajaran</option>
              <option value="range">Rentang Tanggal</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Periode
            </label>

            {periodType === "daily" && (
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
              />
            )}

            {periodType === "weekly" && (
              <input
                type="week"
                value={week}
                onChange={(event) => setWeek(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
              />
            )}

            {periodType === "monthly" && (
              <input
                type="month"
                value={month}
                onChange={(event) => setMonth(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
              />
            )}

            {periodType === "semester" && (
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
                >
                  {periods.map((item) => (
                    <option
                      key={item.tahun_ajaran}
                      value={item.tahun_ajaran}
                    >
                      {item.tahun_ajaran}
                    </option>
                  ))}
                </select>
                <select
                  value={semester}
                  onChange={(event) => setSemester(Number(event.target.value))}
                  className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
                >
                  <option value={1}>Semester I</option>
                  <option value={2}>Semester II</option>
                </select>
              </div>
            )}

            {periodType === "year" && (
              <select
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
                className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
              >
                {periods.map((item) => (
                  <option
                    key={item.tahun_ajaran}
                    value={item.tahun_ajaran}
                  >
                    {item.tahun_ajaran}
                  </option>
                ))}
              </select>
            )}

            {periodType === "range" && (
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={customRange.dari}
                  onChange={(event) =>
                    setCustomRange((previous) => ({
                      ...previous,
                      dari: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
                />
                <input
                  type="date"
                  value={customRange.sampai}
                  onChange={(event) =>
                    setCustomRange((previous) => ({
                      ...previous,
                      sampai: event.target.value,
                    }))
                  }
                  className="h-10 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
                />
              </div>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((classroom) => (
                <option key={classroom.id} value={classroom.id}>
                  {classroom.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Status Pendidikan
            </label>
            <select
              value={educationStatus}
              onChange={(event) => setEducationStatus(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
            >
              {EDUCATION_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Cari
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Tema, aktivitas, siswa..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>{periodLabel}</span>
          <span>•</span>
          <span>
            {formatDate(range.dari)} s.d. {formatDate(range.sampai)}
          </span>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard
          label="Laporan Per Kelas"
          value={report.total_days}
          detail="Tanggal dan kelas"
        />
        <SummaryCard
          label="Hari Aktif"
          value={activeDays}
          detail="Ada kegiatan"
          tone="green"
        />
        <SummaryCard
          label="Hari Libur"
          value={report.total_holidays}
          detail="Tersimpan sebagai libur"
          tone="amber"
        />
        <SummaryCard
          label="Data Aktivitas Terisi"
          value={report.total_filled_students}
          detail={`${completion}% dari data siswa`}
          tone="blue"
        />
        <SummaryCard
          label="Data Siswa"
          value={report.total_student_logs}
          detail="Siswa dalam laporan"
          tone="violet"
        />
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              LAPORAN AKTIVITAS HARIAN
            </div>
            <div className="mt-0.5 text-[10px] text-slate-400">
              Satu baris mewakili laporan satu kelas pada satu tanggal kegiatan.
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!report.items.length}
              onClick={selectAll}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Pilih Semua Data
            </button>

            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[10px] font-semibold text-slate-500 hover:bg-slate-50"
              >
                Hapus Pilihan
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-330">
            <thead className="bg-slate-50/70">
              <tr>
                <th className="w-12 px-4 py-3 text-center">
                  <Checkbox
                    checked={allPageSelected}
                    indeterminate={somePageSelected}
                    onChange={togglePage}
                    label="Pilih semua pada halaman"
                  />
                </th>
                <th className="w-14 px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  No
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Tanggal
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Kelas
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Tahun Ajaran
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Status Pendidikan
                </th>
                <th className="px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Tema / Aktivitas
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Data Terisi
                </th>
                <th className="px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Pembiasaan Dilakukan
                </th>
                <th className="w-20 px-4 py-3 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Detail
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    <td colSpan={11} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length > 0 ? (
                pageItems.map((record, index) => (
                  <tr
                    key={recordKey(record)}
                    className="transition hover:bg-slate-50/70"
                  >
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        checked={selected.has(recordKey(record))}
                        onChange={() => toggleRecord(record)}
                        label={`Pilih ${formatDate(record.tanggal)} ${record.classroom_name}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold text-slate-700">
                        {dayName(record.tanggal)}
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-400">
                        {formatDate(record.tanggal)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <ClassBadge
                        name={record.classroom_name}
                        educationState={
                          record.items?.length &&
                          record.items.every((student) => student.education_state === "graduated")
                            ? "graduated"
                            : "current"
                        }
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {fallbackAcademicYear(new Date(`${record.tanggal}T00:00:00`))}
                    </td>
                    <td className="px-4 py-3">
                      <StudentEducationSummary students={record.items} />
                    </td>
                    <td className="max-w-82.5 px-4 py-3">
                      <div className="truncate text-xs font-semibold text-slate-700">
                        {record.plan?.tema || "-"}
                      </div>
                      <div className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">
                        {record.plan?.aktivitas ||
                          record.plan?.jurnal ||
                          record.plan?.pembiasaan ||
                          "-"}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {record.is_holiday ? (
                        <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-700">
                          Libur
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-700">
                          Aktif
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-xs font-semibold text-slate-700">
                      {record.is_holiday
                        ? "-"
                        : `${record.stats.filled_students}/${record.stats.total_students}`}
                    </td>
                    <td className="px-4 py-3 text-center text-xs text-slate-600">
                      {record.is_holiday
                        ? "-"
                        : record.items.filter((student) => student.log?.pembiasaan_status === "Dilakukan").length}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setDetail(record)}
                        className="rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#e94640]"
                        title="Lihat detail"
                      >
                        <EyeIcon className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-6 py-14 text-center">
                    <UserGroupIcon className="mx-auto h-9 w-9 text-slate-200" />
                    <div className="mt-3 text-sm font-semibold text-slate-600">
                      Belum ada aktivitas pada periode ini
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      Ubah periode, kelas, atau pencarian yang digunakan.
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span>Tampilkan</span>
            <select
              value={limit}
              onChange={(event) => {
                setLimit(Number(event.target.value));
                setPage(1);
              }}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
            <span>dari {report.items.length} laporan</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setPage((value) => Math.max(1, value - 1))}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="min-w-20 text-center text-xs text-slate-500">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() =>
                setPage((value) => Math.min(totalPages, value + 1))
              }
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <DetailPopup
          record={detail}
          onClose={() => setDetail(null)}
          onPrint={requestPrint}
        />
      )}

      {printRequest && (
        <PrintConfirmPopup
          count={printRequest.length}
          loading={printing}
          onCancel={() => setPrintRequest(null)}
          onConfirm={runPrint}
        />
      )}

      <NoticePopup
        notice={notice}
        onClose={() => setNotice(null)}
      />

      {typeof document !== "undefined" &&
        printContext &&
        printModule &&
        createPortal(
          <div
            id="daily-activity-print-root"
            style={{ display: "none" }}
          >
            <printModule.DailyActivityPrintTemplate {...printContext} />
          </div>,
          document.body
        )}
    </div>
  );
}
