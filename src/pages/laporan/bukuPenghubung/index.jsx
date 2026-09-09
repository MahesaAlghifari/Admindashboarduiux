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
  BookOpenIcon,
  CheckCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchCommunicationBookReport,
  fetchCommunicationBookReportPeriods,
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  fetchSchoolProfile,
} from "../../../api/kegiatan";
import {
  fetchAllReportStudents,
  mergeCommunicationReportStudents,
} from "../../../api/report-students";
import { fetchStaff } from "../../../api/staff";
import { fetchAcademicYearOptions } from "../../../api/academic-periods";
import { CommunicationBookPrintTemplate } from "../../../components/common/CommunicationBookPrintTemplate";
import ReportPageHeading from "../components/ReportPageHeading";
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
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  return { dari: isoDate(monday), sampai: isoDate(friday) };
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
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className={`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${tones[tone] || tones.slate}`}>
        {label}
      </div>
      <div className="mt-2 text-xl font-semibold text-slate-800">{value}</div>
      <div className="mt-0.5 text-xs text-slate-400">{detail}</div>
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
    <div className="fixed right-5 top-5 z-170 w-[min(92vw,390px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${isError ? "bg-rose-50 text-rose-600" : "bg-emerald-50 text-emerald-600"}`}>
          {isError ? <ExclamationTriangleIcon className="h-4 w-4" /> : <CheckCircleIcon className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-slate-800">{notice.title}</div>
          <div className="mt-1 text-xs leading-5 text-slate-500">{notice.message}</div>
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

function DetailPopup({ item, periodLabel, range, onClose, onPrint }) {
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
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-xs font-semiboldr text-slate-400">
              LAPORAN BUKU PENGHUBUNG
            </div>
            <h3 className="mt-1 text-lg font-bold text-slate-900">
              {item.nama_lengkap}
            </h3>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span>{studentNis(item) || "-"}</span>
              <ClassBadge name={item.classroom_name || "-"} educationState={item.education_state} />
              <span>{periodLabel}</span>
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
          <div className="mb-5 grid gap-3 sm:grid-cols-4">
            <SummaryCard label="Minggu" value={item.stats.weeks} detail="Buku tersimpan" />
            <SummaryCard label="Hari Berisi" value={item.stats.filled_days} detail="Hari dengan data" tone="green" />
            <SummaryCard label="Catatan Orang Tua" value={item.stats.parent_notes} detail="Catatan masuk" tone="amber" />
            <SummaryCard label="Catatan Guru" value={item.stats.teacher_notes} detail="Catatan sekolah" tone="blue" />
          </div>

          <div className="space-y-5">
            {item.books.map((book) => (
              <div key={book.week} className="overflow-hidden rounded-xl border border-slate-200">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
                  <div className="text-sm font-semibold text-slate-700">
                    Minggu {book.week}
                  </div>
                  <div className="text-xs text-slate-400">
                    {formatDate(book.days[0]?.tanggal)} s.d. {formatDate(book.days.at(-1)?.tanggal)}
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-[1320px] w-full text-left text-xs">
                    <thead className="bg-white text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-3 py-3">Hari / Tanggal</th>
                        <th className="px-3 py-3">Tahun Ajaran</th>
                        <th className="px-3 py-3">Status Pendidikan</th>
                        <th className="px-3 py-3">Jam Tidur</th>
                        <th className="px-3 py-3">BAB</th>
                        <th className="px-3 py-3">Suhu</th>
                        <th className="px-3 py-3">Menu Sarapan</th>
                        <th className="px-3 py-3">Catatan Orang Tua</th>
                        <th className="px-3 py-3">Catatan Guru</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {book.days.map((day) => (
                        <tr key={`${book.week}-${day.hari}`}>
                          <td className="px-3 py-3 font-semibold text-slate-700">
                            {day.hari}
                            <div className="mt-0.5 font-normal text-slate-400">
                              {formatDate(day.tanggal)}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-600">
                            {fallbackAcademicYear(new Date(`${day.tanggal}T00:00:00`))}
                          </td>
                          <td className="px-3 py-3">
                            <EducationBadge state={item.education_state} />
                          </td>
                          <td className="px-3 py-3 text-slate-600">{day.jam_tidur || "-"}</td>
                          <td className="px-3 py-3 text-slate-600">{day.anak_bab || "-"}</td>
                          <td className="px-3 py-3 text-slate-600">
                            {day.suhu_tubuh ? `${day.suhu_tubuh} °C` : "-"}
                          </td>
                          <td className="px-3 py-3 text-slate-600">{day.menu_sarapan || "-"}</td>
                          <td className="max-w-60 px-3 py-3 leading-5 text-slate-600">
                            {day.catatan_ortu || "-"}
                          </td>
                          <td className="max-w-60 px-3 py-3 leading-5 text-slate-600">
                            {day.catatan_guru || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>

        <footer className="flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between">
          <div className="text-xs text-slate-400">
            {formatDate(range.dari)} s.d. {formatDate(range.sampai)}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={() => onPrint(item)}
              className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700"
            >
              <PrinterIcon className="h-4 w-4" />
              Cetak Buku
            </button>
          </div>
        </footer>
      </section>
    </div>,
    document.body
  );
}

function PrintConfirmPopup({ count, totalBooks, loading, onCancel, onConfirm }) {
  return createPortal(
    <div className="fixed inset-0 z-160 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
          <PrinterIcon className="h-5 w-5" />
        </div>
        <h3 className="mt-4 text-lg font-bold text-slate-900">
          Cetak Laporan Buku Penghubung
        </h3>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          {count} anak didik akan dicetak dengan total {totalBooks} minggu Buku Penghubung.
          Setiap minggu dicetak sebagai satu halaman dokumen.
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
            {loading ? <ArrowPathIcon className="h-4 w-4 animate-spin" /> : <PrinterIcon className="h-4 w-4" />}
            Lanjut Cetak
          </button>
        </div>
      </section>
    </div>,
    document.body
  );
}

export default function LaporanBukuPenghubungView() {
  const [periodType, setPeriodType] = useState("weekly");
  const [selectedYear, setSelectedYear] = useState(() =>
    fallbackAcademicYear()
  );
  const [semester, setSemester] = useState(() => fallbackAcademicSemester());
  const [week, setWeek] = useState(() => isoWeekValue());
  const [month, setMonth] = useState(() => monthValue());
  const [customRange, setCustomRange] = useState(() => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { dari: isoDate(first), sampai: isoDate(now) };
  });
  const [classes, setClasses] = useState([]);
  const [periods, setPeriods] = useState([]);
  const [staffMembers, setStaffMembers] = useState(() => readStaffCache());
  const [profile, setProfile] = useState(null);
  const [selectedClass, setSelectedClass] = useState("all");
  const [educationStatus, setEducationStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [report, setReport] = useState({
    dari: "",
    sampai: "",
    items: [],
    total_books: 0,
    total_days: 0,
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
    if (periodType === "weekly") return weekRange(week);
    if (periodType === "monthly") return monthRange(month);
    if (periodType === "semester") return semesterRange(selectedYear, semester);
    if (periodType === "year") return academicYearRange(selectedYear);
    return customRange;
  }, [periodType, week, month, selectedYear, semester, customRange]);

  const periodLabel = useMemo(() => {
    if (periodType === "weekly") return `Minggu ${week}`;
    if (periodType === "monthly") {
      const [year, monthNumber] = month.split("-").map(Number);
      const date = new Date(year, monthNumber - 1, 1);
      return new Intl.DateTimeFormat("id-ID", {
        month: "long",
        year: "numeric",
      }).format(date);
    }
    if (periodType === "semester") {
      return `Semester ${Number(semester) === 1 ? "I (Ganjil)" : "II (Genap)"} ${selectedYear}`;
    }
    if (periodType === "year") return `Tahun Ajaran ${selectedYear}`;
    return `${formatDate(range.dari)} s.d. ${formatDate(range.sampai)}`;
  }, [periodType, week, month, semester, selectedYear, range]);

  const loadMaster = useCallback(async () => {
    const [classResult, periodResult, officialYearsResult, currentPeriodResult, profileResult, staffResult] =
      await Promise.allSettled([
        fetchKegiatanClassrooms(),
        fetchCommunicationBookReportPeriods(),
        fetchAcademicYearOptions(),
        fetchKegiatanCurrentAcademicPeriod(),
        fetchSchoolProfile(),
        fetchStaff(),
      ]);

    if (classResult.status === "fulfilled") setClasses(classResult.value);
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
      setPeriods([...byYear.values()].sort((a, b) => b.tahun_ajaran.localeCompare(a.tahun_ajaran)));
    }
    if (currentPeriodResult.status === "fulfilled") {
      setSelectedYear(resolveAcademicYear(currentPeriodResult.value));
      setSemester(resolveAcademicSemester(currentPeriodResult.value));
    }
    if (profileResult.status === "fulfilled") setProfile(profileResult.value);
    if (staffResult.status === "fulfilled") {
      setStaffMembers(staffResult.value);
      writeStaffCache(staffResult.value);
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
        total_books: 0,
        total_days: 0,
      });
      return;
    }

    setLoading(true);
    try {
      const [result, students] = await Promise.all([
        fetchCommunicationBookReport({
          dari: range.dari,
          sampai: range.sampai,
          classroom_id: selectedClass,
          q: debouncedSearch,
        }),
        fetchAllReportStudents({
          classroom_id: selectedClass,
          q: debouncedSearch,
          dari: range.dari,
          sampai: range.sampai,
        }),
      ]);
      setReport(mergeCommunicationReportStudents(result, students));
    } catch (error) {
      setReport({
        dari: range.dari,
        sampai: range.sampai,
        items: [],
        total_books: 0,
        total_days: 0,
      });
      setNotice({
        type: "error",
        title: "Gagal memuat Buku Penghubung",
        message: errorOf(error),
      });
    } finally {
      setLoading(false);
    }
  }, [range, selectedClass, debouncedSearch]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
    setDetail(null);
  }, [periodType, week, month, selectedYear, semester, customRange.dari, customRange.sampai, selectedClass, educationStatus, debouncedSearch]);

  const visibleItems = useMemo(
    () =>
      report.items.filter(
        (item) =>
          educationStatus === "all" ||
          item.education_state === educationStatus
      ),
    [educationStatus, report.items]
  );

  const totalPages = Math.max(1, Math.ceil(visibleItems.length / limit));
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () => visibleItems.slice((currentPage - 1) * limit, currentPage * limit),
    [visibleItems, currentPage, limit]
  );
  const pageIds = pageItems.map((item) => keyOf(item.id));
  const allPageSelected =
    pageIds.length > 0 && pageIds.every((id) => selected.has(id));
  const somePageSelected =
    pageIds.some((id) => selected.has(id)) && !allPageSelected;
  const selectedItems = visibleItems.filter((item) =>
    selected.has(keyOf(item.id))
  );

  const totals = useMemo(
    () =>
      visibleItems.reduce(
        (acc, item) => ({
          parent: acc.parent + item.stats.parent_notes,
          teacher: acc.teacher + item.stats.teacher_notes,
          dataPoints: acc.dataPoints + item.stats.data_points,
        }),
        { parent: 0, teacher: 0, dataPoints: 0 }
      ),
    [visibleItems]
  );

  const classById = useMemo(
    () => new Map(classes.map((item) => [keyOf(item.id), item])),
    [classes]
  );

  const homeroomTeachers = useMemo(() => {
    const map = {};
    classes.forEach((classroom) => {
      map[keyOf(classroom.id)] = resolveHomeroomTeacher(
        classroom,
        staffMembers
      );
    });
    return map;
  }, [classes, staffMembers]);

  const toggleItem = (id) => {
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

  const selectAllData = () => {
    setSelected(new Set(visibleItems.map((item) => keyOf(item.id))));
  };

  const requestPrint = (items) => {
    const printableItems = items.filter(
      (item) => Array.isArray(item.books) && item.books.length > 0
    );
    if (!printableItems.length) {
      setNotice({
        type: "error",
        title: "Data belum tersedia",
        message: "Buku Penghubung yang dipilih belum memiliki data tersimpan untuk periode ini.",
      });
      return;
    }

    setPrintRequest({
      items: printableItems,
      totalBooks: printableItems.reduce(
        (sum, item) => sum + Number(item.stats?.weeks ?? item.books.length),
        0
      ),
    });
  };

  const runPrint = () => {
    if (!printRequest?.items?.length) return;
    setPrinting(true);

    const context = {
      items: printRequest.items,
      profile,
      periodLabel,
      dateRange: range,
      homeroomTeachers,
      printedAt: new Date(),
    };

    setPrintContext(context);
    setPrintRequest(null);

    const clear = () => {
      setPrintContext(null);
      setPrinting(false);
    };

    window.addEventListener("afterprint", clear, { once: true });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
  };

  const selectedClassroom =
    selectedClass === "all" ? null : classById.get(keyOf(selectedClass));

  return (
    <div className="min-w-0">
      <style>{`
        @media print {
          body > * { display: none !important; }
          #communication-book-print-root {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
            z-index: 99999;
          }
        }
      `}</style>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ReportPageHeading
          icon={BookOpenIcon}
          title="LAPORAN BUKU PENGHUBUNG"
          description="Rekap komunikasi mingguan antara orang tua dan guru berdasarkan siswa, kelas, dan periode."
        />

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={loading || selectedItems.length === 0}
            onClick={() => requestPrint(selectedItems)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Terpilih ({selectedItems.length})
          </button>
          <button
            type="button"
            disabled={loading || visibleItems.length === 0}
            onClick={() => requestPrint(visibleItems)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e94640] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#d63d38] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Semua
          </button>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 xl:grid-cols-[170px_1fr_190px_220px_250px]">
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Jenis Periode
            </label>
            <select
              value={periodType}
              onChange={(event) => setPeriodType(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#e94640]"
            >
              <option value="weekly">Mingguan</option>
              <option value="monthly">Bulanan</option>
              <option value="semester">Semester</option>
              <option value="year">Tahun Ajaran</option>
              <option value="range">Rentang Tanggal</option>
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Periode
            </label>
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
                    <option key={item.tahun_ajaran} value={item.tahun_ajaran}>
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
                  <option key={item.tahun_ajaran} value={item.tahun_ajaran}>
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Kelas
            </label>
            <select
              value={selectedClass}
              onChange={(event) => setSelectedClass(event.target.value)}
              className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
            >
              <option value="all">Semua Kelas</option>
              {classes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.nama_kelas}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
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
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Cari Anak Didik
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari berdasarkan nama, NIS, atau kelas..."
                className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"
              />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400">
          <CalendarDaysIcon className="h-4 w-4" />
          <span>{periodLabel}</span>
          <span>•</span>
          <span>{formatDate(range.dari)} s.d. {formatDate(range.sampai)}</span>
          {selectedClassroom && (
            <>
              <span>•</span>
              <span>{selectedClassroom.nama_kelas}</span>
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard label="Anak Didik" value={visibleItems.length} detail="Sesuai filter" />
        <SummaryCard label="Buku Mingguan" value={visibleItems.reduce((sum, item) => sum + Number(item.stats?.weeks ?? 0), 0)} detail="Minggu tersimpan" tone="green" />
        <SummaryCard label="Hari Berisi" value={visibleItems.reduce((sum, item) => sum + Number(item.stats?.filled_days ?? 0), 0)} detail="Hari dengan data" tone="blue" />
        <SummaryCard label="Catatan Orang Tua" value={totals.parent} detail="Komunikasi dari rumah" tone="amber" />
        <SummaryCard label="Catatan Guru" value={totals.teacher} detail="Komunikasi sekolah" tone="blue" />
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-sm font-semibold text-slate-800">
              Data Buku Penghubung
            </div>
            <div className="mt-0.5 text-xs text-slate-400">
              Pilih anak didik untuk melihat detail atau mencetak Buku Penghubung.
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={!visibleItems.length}
              onClick={selectAllData}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Pilih Semua Data
            </button>
            {selected.size > 0 && (
              <button
                type="button"
                onClick={() => setSelected(new Set())}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50"
              >
                Hapus Pilihan
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1380px]">
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
                <th className="w-14 px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  Anak Didik
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  NIS
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  Kelas
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  Tahun Ajaran
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  Status Pendidikan
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                  Minggu
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                  Hari
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                  Catatan Ortu
                </th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-slate-400">
                  Catatan Guru
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400">
                  Terakhir
                </th>
                <th className="w-20 px-4 py-3 text-center text-xs font-semibold text-slate-400">
                  Detail
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    <td colSpan={13} className="px-4 py-4">
                      <div className="h-5 animate-pulse rounded bg-slate-100" />
                    </td>
                  </tr>
                ))
              ) : pageItems.length > 0 ? (
                pageItems.map((item, index) => (
                  <tr key={item.id} className="transition hover:bg-slate-50/70">
                    <td className="px-4 py-3 text-center">
                      <Checkbox
                        checked={selected.has(keyOf(item.id))}
                        onChange={() => toggleItem(item.id)}
                        label={`Pilih ${item.nama_lengkap}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-400">
                      {(currentPage - 1) * limit + index + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm font-semibold text-slate-700">
                        {item.nama_lengkap}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-600">
                      {studentNis(item) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <ClassBadge
                        name={item.classroom_name}
                        educationState={item.education_state}
                      />
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-slate-600">
                      {studentAcademicYear(item) || "-"}
                    </td>
                    <td className="px-4 py-3">
                      <EducationBadge state={item.education_state} />
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-slate-700">
                      {item.stats.weeks}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                      {item.stats.filled_days}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-7 justify-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">
                        {item.stats.parent_notes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex min-w-7 justify-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700">
                        {item.stats.teacher_notes}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">
                      {formatDate(item.stats.last_activity)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => setDetail(item)}
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
                  <td colSpan={13} className="px-6 py-14 text-center">
                    <UserGroupIcon className="mx-auto h-9 w-9 text-slate-200" />
                    <div className="mt-3 text-sm font-semibold text-slate-600">
                      Belum ada Buku Penghubung pada periode ini
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
            <span>dari {visibleItems.length} anak didik</span>
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
              onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
              className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {detail && (
        <DetailPopup
          item={detail}
          periodLabel={periodLabel}
          range={range}
          onClose={() => setDetail(null)}
          onPrint={(item) => requestPrint([item])}
        />
      )}

      {printRequest && (
        <PrintConfirmPopup
          count={printRequest.items.length}
          totalBooks={printRequest.totalBooks}
          loading={printing}
          onCancel={() => setPrintRequest(null)}
          onConfirm={runPrint}
        />
      )}

      <NoticePopup notice={notice} onClose={() => setNotice(null)} />

      {typeof document !== "undefined" &&
        printContext &&
        createPortal(
          <div id="communication-book-print-root" style={{ display: "none" }}>
            <CommunicationBookPrintTemplate {...printContext} />
          </div>,
          document.body
        )}
    </div>
  );
}
