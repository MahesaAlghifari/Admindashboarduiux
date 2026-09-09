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
  CheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchReportClassrooms,
  fetchWeeklyStudentActivityReportFast,
  hydrateWeeklyActivityCommunication,
} from "../../../api/report-students";
import { fallbackAcademicYear } from "../../../lib/academicYear";
import {
  ClassBadge,
  EDUCATION_STATUS_OPTIONS,
  studentAcademicYear,
  studentNis,
} from "../components/StudentEducationMeta";

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

const text = (value) => String(value ?? "").trim();
const keyOf = (value) => String(value ?? "");
const normalized = (value) =>
  text(value).toLocaleLowerCase("id").replace(/\s+/g, " ");

const errorOf = (error) =>
  text(
    error?.response?.data?.detail ||
      error?.response?.data?.message ||
      error?.message
  ) || "Terjadi kesalahan.";

const isoWeekValue = (source = new Date()) => {
  const date = new Date(
    Date.UTC(
      source.getFullYear(),
      source.getMonth(),
      source.getDate()
    )
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1)
  );
  const week = Math.ceil(
    ((date.getTime() - yearStart.getTime()) /
      86400000 +
      1) /
      7
  );

  return `${date.getUTCFullYear()}-W${String(
    week
  ).padStart(2, "0")}`;
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

const educationConfig = {
  current: {
    label: "Masih di Lembaga",
    className:
      "border-emerald-100 bg-emerald-50 text-emerald-600",
  },
  graduated: {
    label: "Sudah Lulus",
    className:
      "border-slate-950 bg-slate-950 text-white",
  },
  left: {
    label: "Mengundurkan Diri / Pindah",
    className:
      "border-amber-100 bg-amber-50 text-amber-600",
  },
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
    normalized(staff.nama_lengkap) ===
      normalized(teacher.nama_lengkap)
  );
};

const resolveHomeroomTeacher = (
  classroom,
  staffMembers
) => {
  const teacher = classroom?.wali_kelas;
  if (!teacher) return null;

  return (
    staffMembers.find((staff) =>
      sameStaff(staff, teacher)
    ) || {
      ...teacher,
      nip: "",
    }
  );
};

const resolveHeadmaster = (staffMembers) =>
  staffMembers.find(
    (staff) =>
      normalized(staff?.jabatan) ===
      "kepala sekolah"
  ) || null;

const teacherNote = (day) => {
  const activity = text(day?.log?.catatan_guru);
  const communication = text(
    day?.communication_teacher_note
  );

  if (
    activity &&
    communication &&
    normalized(activity) !== normalized(communication)
  ) {
    return `${activity} · ${communication}`;
  }

  return activity || communication;
};

function Checkbox({
  checked,
  indeterminate = false,
  onChange,
  label,
}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.indeterminate = indeterminate;
    }
  }, [indeterminate]);

  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="h-3.5 w-3.5 cursor-pointer rounded border-slate-300 accent-[#ef4d45]"
    />
  );
}

function EducationBadge({ state }) {
  const config =
    educationConfig[state] ?? educationConfig.current;

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
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
    <div className="fixed right-5 top-5 z-180 w-[min(92vw,390px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl">
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

function DetailPopup({
  item,
  loading,
  onClose,
  onPrint,
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener(
        "keydown",
        handleKey
      );
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-160 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section className="flex max-h-[92vh] w-full max-w-6xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
              Aktivitas Mingguan Per Anak
            </div>
            <h3 className="mt-1 text-lg font-semibold text-slate-800">
              {item.nama_lengkap}
            </h3>
            <div className="mt-1 text-[10px] text-slate-400">
              {studentNis(item) || "-"} ·{" "}
              {item.classroom_name || "-"} ·{" "}
              {formatDate(item.week_start)} s.d.{" "}
              {formatDate(item.week_end)}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"
            aria-label="Tutup detail"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </header>

        <div className="overflow-y-auto p-5">
          {loading && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-[10px] text-slate-500">
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              Mengambil catatan guru dari Buku Penghubung...
            </div>
          )}

          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Tema", item.plan?.tema],
              ["Pilar Karakter", item.plan?.pilar_karakter],
              ["Nilai Karakter", item.plan?.nilai_karakter],
              ["Jurnal", item.plan?.jurnal],
              ["Aktivitas", item.plan?.aktivitas],
              ["Pembiasaan", item.plan?.pembiasaan],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5"
              >
                <div className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </div>
                <div className="mt-1 text-[11px] font-medium leading-5 text-slate-600">
                  {text(value) || "-"}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 overflow-hidden rounded-xl border border-slate-100">
            <div className="overflow-x-auto">
              <table className="w-full min-w-300">
                <thead className="bg-slate-50/70">
                  <tr>
                    {[
                      "Hari",
                      "Tahun Ajaran",
                      "Status Pendidikan",
                      "Nilai Karakter",
                      "Jurnal",
                      "Aktivitas",
                      "Pembiasaan",
                      "Makananku",
                      "Perasaan",
                      "Barang Besok",
                      "Catatan Guru",
                    ].map((label) => (
                      <th
                        key={label}
                        className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400"
                      >
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100 bg-white">
                  {item.days.map((day) => (
                    <tr
                      key={day.tanggal}
                      className="hover:bg-slate-50/60"
                    >
                      <td className="px-3 py-2.5">
                        <div className="text-[11px] font-semibold text-slate-600">
                          {day.hari}
                        </div>
                        <div className="text-[9px] text-slate-400">
                          {formatDate(day.tanggal)}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-[11px] font-medium text-slate-600">
                        {fallbackAcademicYear(new Date(`${day.tanggal}T00:00:00`))}
                      </td>
                      <td className="px-3 py-2.5">
                        <EducationBadge state={item.education_state} />
                      </td>

                      {day.is_holiday ? (
                        <td
                          colSpan={8}
                          className="px-3 py-2.5 text-center text-[10px] font-semibold text-amber-600"
                        >
                          Hari Libur
                        </td>
                      ) : (
                        <>
                          <td className="px-3 py-2.5 text-[11px] text-slate-600">
                            {day.log?.nilai_karakter_status || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-600">
                            {day.log?.jurnal_status || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-600">
                            {day.log?.aktivitas_status || "-"}
                          </td>
                          <td className="max-w-64 px-3 py-2.5 text-[11px] leading-5 text-slate-600">
                            {day.log?.pembiasaan_status || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-600">
                            {day.log?.makanan || "-"}
                          </td>
                          <td className="px-3 py-2.5 text-[11px] text-slate-600">
                            {day.log?.perasaan || "-"}
                          </td>
                          <td className="max-w-64 px-3 py-2.5 text-[11px] leading-5 text-slate-600">
                            {day.log?.barang_bawaan || "-"}
                          </td>
                          <td className="max-w-64 px-3 py-2.5 text-[11px] leading-5 text-slate-600">
                            {teacherNote(day) || "-"}
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50 px-5 py-3">
          <button
            type="button"
            onClick={onClose}
            className="ui-toolbar-button"
          >
            Tutup
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={() => onPrint([item])}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak 2 Lembar
          </button>
        </footer>
      </section>
    </div>,
    document.body
  );
}

function PrintConfirmPopup({
  count,
  loading,
  progress,
  onCancel,
  onConfirm,
}) {
  return createPortal(
    <div className="fixed inset-0 z-170 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <section className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-5 shadow-xl">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-[#ef4d45]">
          <PrinterIcon className="h-5 w-5" />
        </div>

        <h3 className="mt-4 text-base font-semibold text-slate-800">
          Cetak Aktivitas Mingguan
        </h3>

        <p className="mt-2 text-xs leading-5 text-slate-500">
          {count} siswa akan dicetak. Setiap siswa menggunakan
          format cetak 2 lembar.
        </p>

        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2.5 text-[10px] leading-5 text-blue-700">
          Catatan Guru dari Buku Penghubung dimuat saat proses
          cetak agar data refleksi tetap lengkap.
        </div>

        {loading && progress.total > 0 && (
          <div className="mt-3 text-[10px] text-slate-500">
            Menyiapkan {progress.done}/{progress.total} siswa...
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            disabled={loading}
            onClick={onCancel}
            className="ui-toolbar-button"
          >
            Batal
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={onConfirm}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:opacity-50"
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

export default function WeeklyStudentActivityView({ typeTabs }) {
  const [week, setWeek] = useState(() =>
    isoWeekValue()
  );
  const [selectedClass, setSelectedClass] =
    useState("all");
  const [educationStatus, setEducationStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] =
    useState(false);
  const [selectionMode, setSelectionMode] =
    useState(false);
  const [selected, setSelected] = useState(
    new Set()
  );
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] =
    useState(false);
  const [notice, setNotice] = useState(null);
  const [printRequest, setPrintRequest] =
    useState(null);
  const [printContext, setPrintContext] =
    useState(null);
  const [printModule, setPrintModule] =
    useState(null);
  const [printing, setPrinting] =
    useState(false);
  const [printProgress, setPrintProgress] =
    useState({ done: 0, total: 0 });

  const deferredSearch = useDeferredValue(search);

  const classesQuery = useQuery({
    queryKey: ["reports", "activity", "classes"],
    queryFn: () => fetchReportClassrooms(),
    staleTime: 10 * 60_000,
  });

  const reportQuery = useQuery({
    queryKey: [
      "reports",
      "activity",
      "weekly",
      week,
      selectedClass,
    ],
    queryFn: ({ signal }) =>
      fetchWeeklyStudentActivityReportFast({
        week,
        classroom_id: selectedClass,
        signal,
      }),
    staleTime: 2 * 60_000,
    gcTime: 10 * 60_000,
    placeholderData: (previous) => previous,
  });

  const classes = classesQuery.data ?? [];
  const report = reportQuery.data ?? {
    week: "",
    dari: "",
    sampai: "",
    items: [],
    total_students: 0,
    total_filled_days: 0,
    total_parent_notes: 0,
    total_teacher_notes: 0,
  };

  const filteredItems = useMemo(() => {
    const query = normalized(deferredSearch);

    return report.items.filter((item) => {
      const educationMatch =
        educationStatus === "all" ||
        item.education_state === educationStatus;
      const searchMatch =
        !query ||
        [
          item.nama_lengkap,
          item.nomor_induk,
          item.nisn,
          item.classroom_name,
          item.plan?.tema,
          item.plan?.aktivitas,
          item.weekly_teacher_summary,
        ].some((value) => normalized(value).includes(query));

      return educationMatch && searchMatch;
    });
  }, [deferredSearch, educationStatus, report.items]);

  useEffect(() => {
    setSelected(new Set());
    setPage(1);
    setDetail(null);
  }, [week, selectedClass]);

  useEffect(() => {
    setPage(1);
  }, [deferredSearch, educationStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredItems.length / limit)
  );
  const currentPage = Math.min(page, totalPages);
  const pageItems = useMemo(
    () =>
      filteredItems.slice(
        (currentPage - 1) * limit,
        currentPage * limit
      ),
    [currentPage, filteredItems, limit]
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageKeys = pageItems.map((item) =>
    keyOf(item.id)
  );
  const allPageSelected =
    pageKeys.length > 0 &&
    pageKeys.every((value) =>
      selected.has(value)
    );
  const somePageSelected =
    pageKeys.some((value) =>
      selected.has(value)
    ) && !allPageSelected;

  const selectedItems = filteredItems.filter(
    (item) => selected.has(keyOf(item.id))
  );

  const totalActiveDays = filteredItems.reduce(
    (sum, item) =>
      sum + Number(item.stats.active_days || 0),
    0
  );
  const totalFilledDays = filteredItems.reduce(
    (sum, item) =>
      sum + Number(item.stats.filled_days || 0),
    0
  );
  const completion = totalActiveDays
    ? Math.round(
        (totalFilledDays / totalActiveDays) * 100
      )
    : 0;

  const toggleItem = (item) => {
    const value = keyOf(item.id);

    setSelected((previous) => {
      const next = new Set(previous);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const togglePage = () => {
    setSelected((previous) => {
      const next = new Set(previous);
      const remove = pageKeys.every((value) =>
        next.has(value)
      );

      pageKeys.forEach((value) => {
        if (remove) next.delete(value);
        else next.add(value);
      });

      return next;
    });
  };

  const selectAllFiltered = () => {
    const ids = filteredItems.map((item) =>
      keyOf(item.id)
    );

    setSelected((previous) => {
      const next = new Set(previous);
      const remove =
        ids.length > 0 &&
        ids.every((value) => next.has(value));

      ids.forEach((value) => {
        if (remove) next.delete(value);
        else next.add(value);
      });

      return next;
    });
  };

  const toggleSelectionMode = () => {
    setSelectionMode((current) => {
      if (current) setSelected(new Set());
      return !current;
    });
  };

  const openDetail = async (item) => {
    setDetail(item);
    setDetailLoading(true);

    try {
      const [hydrated] =
        await hydrateWeeklyActivityCommunication([
          item,
        ]);
      setDetail(hydrated);
    } finally {
      setDetailLoading(false);
    }
  };

  const requestPrint = (items) => {
    if (!items.length) {
      setNotice({
        type: "error",
        title: "Data belum tersedia",
        message:
          "Pilih minimal satu siswa yang akan dicetak.",
      });
      return;
    }

    setPrintRequest(items);
  };

  const runPrint = async () => {
    if (!printRequest?.length || printing) return;

    setPrinting(true);
    setPrintProgress({
      done: 0,
      total: printRequest.length,
    });

    try {
      let completed = 0;
      const hydrated = [];

      for (let index = 0; index < printRequest.length; index += 4) {
        const batch = printRequest.slice(
          index,
          index + 4
        );
        const result =
          await hydrateWeeklyActivityCommunication(
            batch
          );
        hydrated.push(...result);
        completed += result.length;
        setPrintProgress({
          done: completed,
          total: printRequest.length,
        });
      }

      const [
        kegiatanApi,
        staffApi,
        templateModule,
      ] = await Promise.all([
        import("../../../api/kegiatan"),
        import("../../../api/staff"),
        import(
          "../../../components/common/WeeklyStudentActivityPrintTemplate"
        ),
      ]);

      const [profile, staffMembers] =
        await Promise.all([
          kegiatanApi.fetchSchoolProfile(),
          staffApi.fetchStaff(),
        ]);

      const homeroomTeachers = {};
      classes.forEach((classroom) => {
        homeroomTeachers[keyOf(classroom.id)] =
          resolveHomeroomTeacher(
            classroom,
            staffMembers
          );
      });

      setPrintModule(templateModule);
      setPrintContext({
        items: hydrated,
        profile,
        homeroomTeachers,
        headmaster:
          resolveHeadmaster(staffMembers),
        printedAt: new Date(),
      });
      setPrintRequest(null);

      const clear = () => {
        setPrintContext(null);
        setPrinting(false);
        setPrintProgress({
          done: 0,
          total: 0,
        });
      };

      window.addEventListener(
        "afterprint",
        clear,
        { once: true }
      );

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
          window.print();
        });
      });
    } catch (error) {
      setPrinting(false);
      setPrintProgress({
        done: 0,
        total: 0,
      });
      setNotice({
        type: "error",
        title: "Gagal menyiapkan cetak",
        message: errorOf(error),
      });
    }
  };

  const loading =
    reportQuery.isPending && !reportQuery.data;
  const refreshing =
    reportQuery.isFetching && !loading;

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <style>{`
        @media print {
          body > * {
            display: none !important;
          }
          #weekly-student-activity-print-root {
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
            {refreshing && (
              <ArrowPathIcon className="mr-1 inline h-3.5 w-3.5 animate-spin" />
            )}
            <b className="font-semibold text-slate-600">
              {filteredItems.length}
            </b>{" "}
            siswa
          </span>
          <span className="text-xs text-slate-400">
            <b className="font-semibold text-emerald-600">
              {completion}%
            </b>{" "}
            terisi
          </span>
          <button
            type="button"
            onClick={() =>
              setFiltersOpen((value) => !value)
            }
            className={`ui-toolbar-button ${
              filtersOpen ? "is-active" : ""
            }`}
          >
            <FunnelIcon className="h-4 w-4" />
            Filter
          </button>

          <button
            type="button"
            onClick={toggleSelectionMode}
            className={`ui-toolbar-button ${
              selectionMode ? "is-active" : ""
            }`}
          >
            {selectionMode ? (
              <CheckIcon className="h-4 w-4" />
            ) : (
              <UserGroupIcon className="h-4 w-4" />
            )}
            {selectionMode
              ? "Selesai Pilih"
              : "Pilih Siswa"}
          </button>

          <button
            type="button"
            disabled={
              loading ||
              printing ||
              (selectionMode
                ? selectedItems.length === 0
                : filteredItems.length === 0)
            }
            onClick={() =>
              requestPrint(
                selectionMode
                  ? selectedItems
                  : filteredItems
              )
            }
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" />
            {selectionMode
              ? `Cetak Terpilih${
                  selectedItems.length
                    ? ` (${selectedItems.length})`
                    : ""
                }`
              : "Cetak Hasil Filter"}
          </button>
        </div>
      </div>

      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-end xl:justify-between">
          <div className="flex flex-wrap items-end gap-2">
            <label className="min-w-40">
              <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                Minggu
              </span>
              <input
                type="week"
                value={week}
                onChange={(event) =>
                  setWeek(event.target.value)
                }
                className="ui-compact-control w-full"
              />
            </label>

            <label className="min-w-44">
              <span className="mb-1 block text-[10px] font-semibold text-slate-500">
                Kelas
              </span>
              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(
                    event.target.value
                  )
                }
                className="ui-compact-control w-full"
              >
                <option value="all">
                  Semua Kelas
                </option>
                {classes.map((classroom) => (
                  <option
                    key={classroom.id}
                    value={classroom.id}
                  >
                    {classroom.nama_kelas}
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
              disabled={reportQuery.isFetching}
              onClick={() =>
                reportQuery.refetch()
              }
              className="ui-toolbar-button"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${
                  reportQuery.isFetching
                    ? "animate-spin"
                    : ""
                }`}
              />
              Muat Ulang
            </button>
          </div>

          <div className="relative w-full xl:w-72">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Nama, NIS, kelas, catatan..."
              className="ui-compact-control w-full pl-9"
            />
          </div>

          <div className="basis-full border-t border-slate-100 pt-2 text-[10px] text-slate-400 xl:mt-0">
            {formatDate(report.dari)} s.d.{" "}
            {formatDate(report.sampai)} · 2 lembar per
            siswa
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
              Pilih siswa yang ingin dicetak. Catatan Guru
              dimuat ketika Detail/Cetak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedItems.length > 0 && (
              <button
                type="button"
                onClick={() =>
                  setSelected(new Set())
                }
                className="h-8 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 hover:bg-white"
              >
                Kosongkan
              </button>
            )}

            <button
              type="button"
              disabled={!filteredItems.length}
              onClick={selectAllFiltered}
              className="h-8 rounded-lg border border-red-100 bg-white px-2.5 text-[10px] font-semibold text-[#ef4d45] disabled:opacity-40"
            >
              {filteredItems.length > 0 &&
              filteredItems.every((item) =>
                selected.has(keyOf(item.id))
              )
                ? "Batal Pilih Semua"
                : "Pilih Semua Hasil"}
            </button>

            <span className="text-[10px] text-slate-500">
              <b className="font-semibold text-[#ef4d45]">
                {selectedItems.length}
              </b>{" "}
              dipilih
            </span>
          </div>
        </div>
      )}

      {reportQuery.isError ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-[11px] font-medium text-rose-600">
            Laporan aktivitas gagal dimuat.{" "}
            {errorOf(reportQuery.error)}
          </p>

          <button
            type="button"
            onClick={() =>
              reportQuery.refetch()
            }
            className="ui-toolbar-button mt-3"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Muat Ulang
          </button>
        </div>
      ) : (
        <div className="ui-table-card overflow-hidden">
          <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[11px] font-semibold text-slate-700">
                Daftar Aktivitas Mingguan
              </h2>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Semua status pendidikan tetap ditampilkan.
              </p>
            </div>

            <div className="flex flex-wrap gap-3 text-[10px] text-slate-400">
              <span>
                Penilaian{" "}
                <b className="font-semibold text-emerald-600">
                  {totalFilledDays}
                </b>
              </span>
              <span>
                Pembiasaan dilakukan{" "}
                <b className="font-semibold text-blue-600">
                  {filteredItems.reduce(
                    (sum, item) =>
                      sum +
                      item.days.filter((day) => day.log?.pembiasaan_status === "Dilakukan").length,
                    0
                  )}
                </b>
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
                        <Checkbox
                          checked={
                            allPageSelected
                          }
                          indeterminate={
                            somePageSelected
                          }
                          onChange={togglePage}
                          label="Pilih semua pada halaman"
                        />
                      )}
                      <span>No.</span>
                    </div>
                  </th>
                  <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Nama Siswa
                  </th>
                  <th className="w-32 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    NIS
                  </th>
                  <th className="w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kelas
                  </th>
                  <th className="w-32 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Tahun Ajaran
                  </th>
                  <th className="w-44 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status Pendidikan
                  </th>
                  <th className="w-24 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Penilaian
                  </th>
                  <th className="w-20 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Nilai Karakter
                  </th>
                  <th className="w-20 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Jurnal
                  </th>
                  <th className="w-20 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Aktivitas
                  </th>
                  <th className="w-24 px-3 py-2.5 text-center text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Pembiasaan
                  </th>
                  <th className="w-32 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from(
                    { length: 7 },
                    (_, index) => (
                      <tr key={index}>
                        {Array.from(
                          { length: 12 },
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
                ) : pageItems.length ? (
                  pageItems.map((item, index) => {
                    const checked = selected.has(
                      keyOf(item.id)
                    );

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-slate-50/60 ${
                          checked
                            ? "bg-red-50/30"
                            : ""
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {selectionMode && (
                              <Checkbox
                                checked={checked}
                                onChange={() =>
                                  toggleItem(item)
                                }
                                label={`Pilih ${item.nama_lengkap}`}
                              />
                            )}
                            <span className="text-[11px] text-slate-400">
                              {(currentPage -
                                1) *
                                limit +
                                index +
                                1}
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
                          <EducationBadge
                            state={
                              item.education_state
                            }
                          />
                        </td>

                        <td className="px-3 py-2.5 text-center text-[11px] font-semibold text-emerald-600">
                          {item.stats.filled_days}/
                          {item.stats.active_days}
                        </td>

                        <td className="px-3 py-2.5 text-center text-[11px] text-slate-600">
                          {
                            item.stats
                              .meals_recorded
                          }
                          /{item.stats.active_days}
                        </td>

                        <td className="px-3 py-2.5 text-center text-[11px] text-slate-600">
                          {
                            item.stats
                              .feelings_recorded
                          }
                          /{item.stats.active_days}
                        </td>

                        <td className="px-3 py-2.5 text-center text-[11px] text-slate-600">
                          {item.days.filter((day) => text(day.log?.aktivitas_status)).length}
                          /{item.stats.active_days}
                        </td>

                        <td className="px-3 py-2.5 text-center text-[11px] font-semibold text-blue-600">
                          {item.days.filter((day) => text(day.log?.pembiasaan_status)).length}
                          /{item.stats.active_days}
                        </td>

                        <td className="px-3 py-2.5">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                openDetail(item)
                              }
                              className="ui-action-button"
                            >
                              <EyeIcon className="h-3.5 w-3.5" />
                              Detail
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                requestPrint([
                                  item,
                                ])
                              }
                              className="ui-action-button"
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
                    <td
                      colSpan={11}
                      className="px-4 py-10 text-center"
                    >
                      <UserGroupIcon className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-[11px] font-semibold text-slate-600">
                        Tidak ada siswa
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Ubah minggu, kelas, atau
                        pencarian yang digunakan.
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            filteredItems.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-slate-400">
                  Menampilkan{" "}
                  <b className="font-semibold text-slate-600">
                    {(currentPage - 1) *
                      limit +
                      1}
                  </b>
                  –
                  <b className="font-semibold text-slate-600">
                    {Math.min(
                      currentPage * limit,
                      filteredItems.length
                    )}
                  </b>{" "}
                  dari{" "}
                  <b className="font-semibold text-slate-600">
                    {filteredItems.length}
                  </b>{" "}
                  siswa
                </p>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={limit}
                    onChange={(event) => {
                      setLimit(
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
                      currentPage <= 1
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

                  <span className="min-w-14 text-center text-[10px] font-semibold text-slate-500">
                    {currentPage}/{totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={
                      currentPage >= totalPages
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

      {detail && (
        <DetailPopup
          item={detail}
          loading={detailLoading}
          onClose={() => setDetail(null)}
          onPrint={requestPrint}
        />
      )}

      {printRequest && (
        <PrintConfirmPopup
          count={printRequest.length}
          loading={printing}
          progress={printProgress}
          onCancel={() =>
            !printing &&
            setPrintRequest(null)
          }
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
            id="weekly-student-activity-print-root"
            style={{ display: "none" }}
          >
            <printModule.WeeklyStudentActivityPrintTemplate
              {...printContext}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
