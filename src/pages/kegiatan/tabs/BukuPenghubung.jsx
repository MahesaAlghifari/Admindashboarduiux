import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ChatBubbleBottomCenterTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchCommunicationBook,
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  fetchKegiatanStudents,
  saveCommunicationBook,
} from "../../../api/kegiatan";
import {SectionHeader} from "../../../components/common/DesignSystem";
import Pagination from "../../../components/common/Pagination";
import {apiErrorMessage} from "../../../lib/apiError";
import { useAuth } from "../../../auth/useAuth";
import { classroomScopeForUser, isTeacherAccount, resolveSelectedClass } from "../classroomScope";
import { studentClassroomMeta, studentGenderLabel } from "../tableUtils";

const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
];

const METRICS = [
  {
    key: "jam_tidur",
    label: "Jam Tidur",
    type: "text",
    placeholder: "21.00 - 05.00",
    unit: "",
  },
  {
    key: "anak_bab",
    label: "Anak BAB ?",
    type: "select",
    options: ["Tidak", "Ya"],
  },
  {
    key: "suhu_tubuh",
    label: "Suhu Tubuh",
    type: "number",
    placeholder: "36",
    unit: "°C",
    min: 30,
    max: 45,
    step: 0.1,
  },
  {
    key: "menu_sarapan",
    label: "Menu Sarapan",
    type: "text",
    placeholder: "Nasi Goreng",
    unit: "",
  },
];

const text = (value) =>
  String(value ?? "").trim();

const errorOf=error=>apiErrorMessage(error,{action:"memproses",subject:"data kegiatan"});

const getCurrentIsoWeek = () => {
  const now = new Date();
  const date = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
  );
  const day = date.getUTCDay() || 7;

  date.setUTCDate(
    date.getUTCDate() + 4 - day
  );

  const yearStart = new Date(
    Date.UTC(
      date.getUTCFullYear(),
      0,
      1
    )
  );

  const week = Math.ceil(
    (((date - yearStart) / 86400000) +
      1) /
      7
  );

  return `${date.getUTCFullYear()}-W${String(
    week
  ).padStart(2, "0")}`;
};

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const dateToIsoWeek = (dateString) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateString || "")) return "";

  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  const weekDay = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - weekDay);

  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const dateInPeriod = (dateString, period) => {
  const value = text(dateString).slice(0, 10);
  const start = text(period?.tanggal_mulai).slice(0, 10);
  const end = text(period?.tanggal_selesai).slice(0, 10);

  if (!value || !start || !end) return false;
  return value >= start && value <= end;
};

const preferredPeriodWeek = (period) => {
  const today = localDate(new Date());
  const start = text(period?.tanggal_mulai).slice(0, 10);
  const end = text(period?.tanggal_selesai).slice(0, 10);

  if (!start || !end) return getCurrentIsoWeek();
  if (today < start) return dateToIsoWeek(start);
  if (today > end) return dateToIsoWeek(end);
  return dateToIsoWeek(today);
};

const formatBookDate = (
  dateString
) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString || ""
    )
  ) {
    return "-";
  }

  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "short",
    }
  );
};

const getDayData = (
  book,
  day
) =>
  book?.days?.find(
    (item) =>
      item.hari === day
  ) || null;

const updateBookDay = (
  book,
  day,
  field,
  value
) => {
  if (!book) return book;

  return {
    ...book,
    days: book.days.map(
      (item) =>
        item.hari === day
          ? {
              ...item,
              [field]: value,
            }
          : item
    ),
  };
};

const communicationBookStatus = (book, period) => {
  const effectiveDays = (book?.days || []).filter(
    (day) =>
      dateInPeriod(day.tanggal, period) &&
      !day.is_holiday
  );

  if (!effectiveDays.length) {
    return {
      key: "holiday",
      label: "Libur",
      filled: 0,
      total: 0,
      percentage: 0,
    };
  }

  const filled = effectiveDays.filter(
    (day) => day.persisted === true
  ).length;
  const percentage = Math.round(
    (filled / effectiveDays.length) * 100
  );

  return {
    key:
      percentage >= 100
        ? "filled"
        : percentage > 0
          ? "progress"
          : "empty",
    label:
      percentage >= 100
        ? "Sudah Diisi"
        : percentage > 0
          ? "Proses"
          : "Belum diisi",
    filled,
    total: effectiveDays.length,
    percentage,
  };
};

async function mapWithConcurrency(items, limit, worker) {
  if (!items.length) return [];

  const results = new Array(items.length);
  let cursor = 0;

  const runners = Array.from(
    { length: Math.min(Math.max(1, limit), items.length) },
    async () => {
      while (true) {
        const index = cursor;
        cursor += 1;

        if (index >= items.length) return;

        try {
          results[index] = {
            status: "fulfilled",
            value: await worker(items[index], index),
          };
        } catch (reason) {
          results[index] = {
            status: "rejected",
            reason,
          };
        }
      }
    }
  );

  await Promise.all(runners);
  return results;
}

const notificationConfig = {
  success: {
    icon: CheckCircleIcon,
    iconClass:
      "text-emerald-600 bg-emerald-50 border-emerald-100",
    buttonClass:
      "bg-emerald-600 hover:bg-emerald-700",
  },
  error: {
    icon: XCircleIcon,
    iconClass:
      "text-rose-600 bg-rose-50 border-rose-100",
    buttonClass:
      "bg-rose-600 hover:bg-rose-700",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconClass:
      "text-amber-600 bg-amber-50 border-amber-100",
    buttonClass:
      "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: InformationCircleIcon,
    iconClass:
      "text-blue-600 bg-blue-50 border-blue-100",
    buttonClass:
      "bg-blue-600 hover:bg-blue-700",
  },
};

export default function BukuPenghubung() {
  const { user } = useAuth();
  const teacherMode = isTeacherAccount(user);
  const [
    viewMode,
    setViewMode,
  ] = useState("list");
  const [
    selectedClass,
    setSelectedClass,
  ] = useState(() => teacherMode ? "" : "all");
  const [
    searchSiswa,
    setSearchSiswa,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);
  const [
    selectedWeek,
    setSelectedWeek,
  ] = useState(
    getCurrentIsoWeek
  );
  const [classes, setClasses] =
    useState([]);
  const [activePeriod, setActivePeriod] =
    useState(null);
  const [students, setStudents] =
    useState([]);
  const [bookStatuses, setBookStatuses] =
    useState({});
  const [loadingStatuses, setLoadingStatuses] =
    useState(false);
  const [book, setBook] =
    useState(null);
  const [
    ,
    setLoadingClasses,
  ] = useState(true);
  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(true);
  const [
    loadingBook,
    setLoadingBook,
  ] = useState(false);
  const [saving, setSaving] =
    useState(false);
  const [
    studentError,
    setStudentError,
  ] = useState("");
  const [
    bookError,
    setBookError,
  ] = useState("");
  const [
    notification,
    setNotification,
  ] = useState(null);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const minWeek = dateToIsoWeek(
    text(activePeriod?.tanggal_mulai).slice(0, 10)
  );
  const maxWeek = dateToIsoWeek(
    text(activePeriod?.tanggal_selesai).slice(0, 10)
  );

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [page, pageSize, students]);

  const showNotification =
    useCallback(
      (
        type,
        title,
        message
      ) => {
        setNotification({
          type,
          title,
          message,
        });
      },
      []
    );

  const closeNotification =
    () => {
      setNotification(null);
    };

  const loadClasses =
    useCallback(async () => {
      setLoadingClasses(true);

      try {
        const [items, period] =
          await Promise.all([
            fetchKegiatanClassrooms(),
            fetchKegiatanCurrentAcademicPeriod(),
          ]);

        const scope = classroomScopeForUser(user, items);
        setClasses(scope.classes);
        setSelectedClass((current) => resolveSelectedClass(current, scope, "all"));
        setActivePeriod(period);
        setSelectedWeek(
          preferredPeriodWeek(period)
        );
      } catch (error) {
        const message =
          errorOf(error);

        setClasses([]);
        setActivePeriod(null);
        setStudentError(message);
        showNotification(
          "error",
          "Gagal memuat Kelas",
          message
        );
      } finally {
        setLoadingClasses(false);
      }
    }, [showNotification, user]);

  const loadStudents =
    useCallback(async () => {
      if (selectedClass === "") {
        setStudents([]);
        setLoadingStudents(false);
        return;
      }

      setLoadingStudents(true);
      setStudentError("");

      try {
        const items =
          await fetchKegiatanStudents({
            classroom_id:
              selectedClass,
            q: debouncedSearch,
          });

        setStudents(items);
      } catch (error) {
        const message =
          errorOf(error);

        setStudents([]);
        setStudentError(message);
        showNotification(
          "error",
          "Gagal memuat Siswa",
          message
        );
      } finally {
        setLoadingStudents(false);
      }
    }, [
      debouncedSearch,
      selectedClass,
      showNotification,
    ]);

  const loadStatuses =
    useCallback(async () => {
      if (
        viewMode !== "list" ||
        !selectedWeek ||
        pagedStudents.length === 0
      ) {
        setBookStatuses({});
        setLoadingStatuses(false);
        return;
      }

      setLoadingStatuses(true);
      let cursor = 0;
      const concurrency = Math.min(3, pagedStudents.length);
      const workers = Array.from({ length: concurrency }, async () => {
        while (cursor < pagedStudents.length) {
          const student = pagedStudents[cursor++];
          const studentId = String(student.id);

          try {
            const data = await fetchCommunicationBook({
              student_id: student.id,
              week: selectedWeek,
            });
            const status = communicationBookStatus(data, activePeriod);
            setBookStatuses((current) => ({
              ...current,
              [studentId]: status,
            }));
          } catch {
            setBookStatuses((current) => ({
              ...current,
              [studentId]: {
                key: "error",
                label: "Gagal Cek",
                filled: 0,
                total: 0,
                percentage: 0,
              },
            }));
          }
        }
      });

      await Promise.all(workers);
      setLoadingStatuses(false);
    }, [
      activePeriod,
      selectedWeek,
      pagedStudents,
      viewMode,
    ]);

  const loadBook =
    useCallback(async () => {
      if (
        !selectedStudent ||
        !selectedWeek
      ) {
        setBook(null);
        return;
      }

      setLoadingBook(true);
      setBookError("");

      try {
        const data =
          await fetchCommunicationBook({
            student_id:
              selectedStudent.id,
            week: selectedWeek,
          });

        setBook(data);
      } catch (error) {
        const message =
          errorOf(error);

        setBook(null);
        setBookError(message);
        showNotification(
          "error",
          "Gagal memuat Buku Penghubung",
          message
        );
      } finally {
        setLoadingBook(false);
      }
    }, [
      selectedStudent,
      selectedWeek,
      showNotification,
    ]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    const timer =
      window.setTimeout(() => {
        setDebouncedSearch(
          searchSiswa.trim()
        );
      }, 250);

    return () =>
      window.clearTimeout(timer);
  }, [searchSiswa]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedClass]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setBookStatuses({});
  }, [debouncedSearch, selectedClass, selectedWeek]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => {
    if (viewMode !== "list") return;
    const timer = window.setTimeout(() => {
      loadStatuses();
    }, 180);

    return () => window.clearTimeout(timer);
  }, [loadStatuses, viewMode]);

  useEffect(() => {
    if (
      viewMode === "detail"
    ) {
      loadBook();
    }
  }, [loadBook, viewMode]);

  const handleOpenDetail = (
    student
  ) => {
    setSelectedStudent(student);
    setBook(null);
    setBookError("");
    setViewMode("detail");
  };

  const handleBackToList =
    () => {
      if (saving) return;

      setViewMode("list");
      setSelectedStudent(null);
      setBook(null);
      setBookError("");
    };

  const handleBookChange = (
    day,
    field,
    value
  ) => {
    const selected = book?.days?.find((item) => item.hari === day);
    if (selected?.is_holiday) return;

    setBook((current) =>
      updateBookDay(
        current,
        day,
        field,
        value
      )
    );
  };

  const handleSave =
    async () => {
      if (
        !selectedStudent ||
        !book ||
        saving
      ) {
        showNotification(
          "warning",
          "Data Belum Siap",
          "Pilih siswa dan pastikan data Buku Penghubung sudah selesai dimuat."
        );
        return;
      }

      const invalidTemperature =
        book.days.find(
          (day) => {
            if (day.is_holiday) return false;
            if (
              day.suhu_tubuh ===
              ""
            ) {
              return false;
            }

            const value = Number(
              day.suhu_tubuh
            );

            return (
              !Number.isFinite(
                value
              ) ||
              value < 30 ||
              value > 45
            );
          }
        );

      if (
        invalidTemperature
      ) {
        showNotification(
          "warning",
          "Suhu Tubuh Tidak Valid",
          `Suhu tubuh ${invalidTemperature.hari} harus berada antara 30°C sampai 45°C.`
        );
        return;
      }

      setSaving(true);

      try {
        const saved =
          await saveCommunicationBook(
            book
          );

        setBook(saved);
        setBookStatuses((current) => ({
          ...current,
          [String(selectedStudent.id)]:
            communicationBookStatus(
              saved,
              activePeriod
            ),
        }));
        showNotification(
          "success",
          "Berhasil Disimpan",
          `Data Buku Penghubung ${selectedStudent.nama_lengkap} berhasil disimpan.`
        );
      } catch (error) {
        showNotification(
          "error",
          "Gagal Menyimpan",
          `Gagal menyimpan Buku Penghubung: ${errorOf(
            error
          )}`
        );
      } finally {
        setSaving(false);
      }
    };

  const hasWritableDay = Boolean(
    book?.days?.some(
      (day) =>
        dateInPeriod(day.tanggal, activePeriod) &&
        !day.is_holiday
    )
  );

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      {viewMode === "list" && (
        <>
          <SectionHeader icon={ChatBubbleBottomCenterTextIcon} title="Buku Penghubung" description="Komunikasi harian orang tua dan guru untuk pemantauan kondisi siswa." actions={<button type="button" onClick={()=>setFiltersOpen(value=>!value)} className={`ui-toolbar-button ${filtersOpen?"is-active":""}`}><FunnelIcon className="h-4 w-4"/>Filter</button>}/>
          {filtersOpen&&<div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="flex flex-wrap items-center gap-2">
              <select value={selectedClass} onChange={event=>setSelectedClass(event.target.value)} disabled={teacherMode&&classes.length<=1} className="ui-compact-control min-w-40 disabled:cursor-not-allowed disabled:bg-slate-100">{!teacherMode&&<option value="all">Semua Kelas</option>}{teacherMode&&classes.length===0&&<option value="">Belum ada kelas yang ditugaskan</option>}{classes.map(classroom=><option key={classroom.id} value={classroom.id}>{classroom.nama_kelas}</option>)}</select>
              <input type="week" value={selectedWeek} min={minWeek||undefined} max={maxWeek||undefined} onChange={event=>setSelectedWeek(event.target.value)} className="ui-compact-control" aria-label="Minggu Buku Penghubung"/>
            </div>
            <div className="relative w-full xl:w-64"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input type="text" placeholder="Cari nama siswa..." value={searchSiswa} onChange={event=>setSearchSiswa(event.target.value)} className="ui-compact-control w-full pl-9"/></div>
          </div>}

          <StudentList
            students={pagedStudents}
            classes={classes}
            statuses={bookStatuses}
            loadingStatuses={loadingStatuses}
            onOpen={
              handleOpenDetail
            }
            loading={
              loadingStudents
            }
            error={
              studentError
            }
            onRetry={
              loadStudents
            }
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalItems={students.length}
            onPageChange={setPage}
            onPageSizeChange={(value) => { setPageSize(value); setPage(1); }}
          />
        </>
      )}

      {viewMode === "detail" &&
        selectedStudent && (
          <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full space-y-6">
            <StudentHeader
              student={
                selectedStudent
              }
              onBack={
                handleBackToList
              }
            />

            <div className="mt-4 flex flex-1 flex-col overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                      Input Data Mingguan
                    </h3>
                    <p className="text-xs text-slate-500">
                      Isi indikator harian dan catatan komunikasi.
                    </p>
                  </div>

                  <div className="h-8 w-px bg-slate-200 hidden md:block" />

                  <div className="flex items-center gap-2">
                    <CalendarDaysIcon className="h-5 w-5 text-slate-400" />
                    <input
                      type="week"
                      value={
                        selectedWeek
                      }
                      min={
                        minWeek ||
                        undefined
                      }
                      max={
                        maxWeek ||
                        undefined
                      }
                      onChange={(
                        event
                      ) =>
                        setSelectedWeek(
                          event
                            .target
                            .value
                        )
                      }
                      disabled={
                        saving
                      }
                      className="ui-compact-control disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                    />
                  </div>
                </div>
              </div>

              {book?.days?.some((day) => day.is_holiday) && (
                <div className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                  Hari bertanda <span className="font-bold">Libur</span> mengikuti data Administrasi → Pengumuman dan rentang Periode Akademik.
                </div>
              )}

              {loadingBook ? (
                <div className="flex-1 min-h-90 flex items-center justify-center text-slate-400">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Memuat buku penghubung...
                  </span>
                </div>
              ) : bookError ? (
                <div className="flex-1 min-h-90 flex flex-col items-center justify-center text-center px-6">
                  <p className="text-sm text-rose-500">
                    {bookError}
                  </p>
                  <button
                    type="button"
                    onClick={
                      loadBook
                    }
                    className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]"
                  >
                    Muat ulang
                  </button>
                </div>
              ) : book ? (
                <WeeklyJournalTable
                  book={book}
                  activePeriod={
                    activePeriod
                  }
                  onChange={
                    handleBookChange
                  }
                  disabled={
                    saving
                  }
                />
              ) : null}

              <div className="sticky bottom-0 z-20 flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
                <button
                  type="button"
                  onClick={
                    handleBackToList
                  }
                  disabled={saving}
                  className="ui-toolbar-button disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XMarkIcon className="h-4 w-4" />
                  Batal
                </button>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    loadingBook ||
                    !book ||
                    !hasWritableDay
                  }
                  className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {saving ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  )}
                  {saving
                    ? "Menyimpan..."
                    : "Simpan Data"}
                </button>
              </div>
            </div>
          </div>
        )}

      <NotificationPopup
        notification={
          notification
        }
        onClose={
          closeNotification
        }
      />
    </div>
  );
}

function StudentList({
  students,
  classes = [],
  statuses = {},
  loadingStatuses = false,
  onOpen,
  loading = false,
  error = "",
  onRetry,
  page = 1,
  pageSize = 10,
  totalPages = 1,
  totalItems = 0,
  onPageChange,
  onPageSizeChange,
}) {
  return (
    <div className="ui-table-card mt-4 flex-1 relative">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="sticky top-0 z-10 bg-slate-50/80">
            <tr>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-12">No</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-48">Nama Siswa</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">NIS</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-14">L/P</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">Kelas</th>
              <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-40">Wali Kelas</th>
              <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-32">Status</th>
              <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-32">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (
              <tr><td colSpan="8" className="py-14 text-center text-slate-400"><span className="inline-flex items-center gap-2 text-sm"><ArrowPathIcon className="h-4 w-4 animate-spin"/>Memuat siswa...</span></td></tr>
            ) : error ? (
              <tr><td colSpan="8" className="py-14 text-center"><p className="text-sm text-rose-500">{error}</p><button type="button" onClick={onRetry} className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]">Muat ulang</button></td></tr>
            ) : students.length ? (
              students.map((student, index) => {
                const meta = studentClassroomMeta(classes, student);
                return (
                  <tr key={student.id} className="group transition-colors hover:bg-slate-50">
                    <td className="px-3 py-2.5 text-center text-sm font-mono tabular-nums text-slate-500">{(page - 1) * pageSize + index + 1}</td>
                    <td className="px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#e94640]">{student.nama_lengkap || "-"}</td>
                    <td className="px-3 py-2.5 text-sm font-mono text-slate-500 whitespace-nowrap">{student.nomor_induk || student.nisn || "-"}</td>
                    <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">{studentGenderLabel(student.jenis_kelamin)}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.classroomName}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.homeroomTeacherName}</td>
                    <td className="px-3 py-2.5 text-center whitespace-nowrap"><BookStatusBadge status={statuses[String(student.id)]} loading={loadingStatuses && !statuses[String(student.id)]}/></td>
                    <td className="px-3 py-2.5 text-right whitespace-nowrap"><button type="button" onClick={() => onOpen(student)} className="ui-action-button whitespace-nowrap"><PencilSquareIcon className="h-4 w-4 shrink-0"/>Input Jurnal</button></td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan="8" className="py-14 text-center text-slate-400"><FunnelIcon className="mx-auto mb-3 h-10 w-10 opacity-20"/><span className="text-sm">Tidak ada siswa ditemukan.</span></td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={pageSize} onPageChange={onPageChange} onLimitChange={onPageSizeChange} limitOptions={[10, 20, 50, 100]} className="!px-3 !py-2.5"/>
    </div>
  );
}

function BookStatusBadge({ status, loading }) {
  if (loading && !status) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
        <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
        Mengecek
      </span>
    );
  }

  if (status?.key === "holiday") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">
        <CalendarDaysIcon className="h-3.5 w-3.5" />
        Libur
      </span>
    );
  }

  if (status?.key === "error") {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-[10px] font-bold text-rose-600">
        <ExclamationTriangleIcon className="h-3.5 w-3.5" />
        Gagal Cek
      </span>
    );
  }

  const percentage = Math.max(
    0,
    Math.min(100, Number(status?.percentage) || 0)
  );
  const filled = Number(status?.filled) || 0;
  const total = Number(status?.total) || 0;
  const complete = percentage >= 100;
  const inProgress = percentage > 0 && percentage < 100;

  return (
    <div
      className="mx-auto w-28"
      title={
        total
          ? `${filled}/${total} hari efektif sudah diisi`
          : "Belum ada hari efektif yang diisi"
      }
    >
      <div className="flex items-center justify-between gap-2 text-[10px] font-bold">
        <span
          className={
            complete
              ? "text-emerald-700"
              : inProgress
                ? "text-amber-700"
                : "text-slate-500"
          }
        >
          {percentage}%
        </span>
        <span className="text-[9px] font-semibold text-slate-400">
          {filled}/{total || 0}
        </span>
      </div>

      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full transition-[width] duration-300 ${
            complete
              ? "bg-emerald-500"
              : inProgress
                ? "bg-amber-500"
                : "bg-slate-300"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div
        className={`mt-1 text-center text-[9px] font-semibold ${
          complete
            ? "text-emerald-600"
            : inProgress
              ? "text-amber-600"
              : "text-slate-400"
        }`}
      >
        {complete
          ? "Sudah Diisi"
          : inProgress
            ? "Proses"
            : "Belum diisi"}
      </div>
    </div>
  );
}

function StudentHeader({
  student,
  onBack,
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <button
          type="button"
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700 transition-all"
          title="Kembali"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {
              student.nama_lengkap
            }
          </h2>
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
              {student.nomor_induk ||
                student.nisn ||
                "-"}
            </span>

            {student.classroom_name && (
              <>
                <span className="text-xs text-slate-400">
                  •
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {
                    student.classroom_name
                  }
                </span>
              </>
            )}

            <span className="text-xs text-slate-400">
              •
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Buku Penghubung Digital
            </span>
          </div>
        </div>
      </div>

      <div className="flex bg-blue-50 px-3 py-1.5 rounded-lg text-blue-700 font-medium text-xs items-center gap-2 border border-blue-100">
        <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
        Jurnal Harian
      </div>
    </div>
  );
}

function WeeklyJournalTable({
  book,
  activePeriod,
  onChange,
  disabled = false,
}) {
  return (
    <div className="overflow-auto flex-1">
      <table className="min-w-full divide-y divide-slate-200 border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 border-r border-slate-200 w-28 text-center text-xs font-bold text-slate-500 uppercase">
              Hari
            </th>
            <th className="px-4 py-3 border-r border-slate-200 w-48 text-left text-xs font-bold text-slate-500 uppercase">
              Indikator
            </th>
            <th className="px-4 py-3 border-r border-slate-200 w-64 text-left text-xs font-bold text-slate-500 uppercase">
              Hasil / Nilai
            </th>
            <th className="px-4 py-3 border-r border-slate-200 bg-amber-50 text-amber-700 text-left text-xs font-bold uppercase min-w-65">
              Catatan Orang Tua
            </th>
            <th className="px-4 py-3 bg-blue-50 text-blue-700 text-left text-xs font-bold uppercase min-w-65">
              Catatan Guru
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-sm">
          {DAYS.map(
            (day) => {
              const dayData =
                getDayData(
                  book,
                  day
                ) || {};
              const dayDisabled =
                disabled ||
                Boolean(dayData.is_holiday) ||
                !dateInPeriod(
                  dayData.tanggal,
                  activePeriod
                );

              return (
                <Fragment
                  key={day}
                >
                  {METRICS.map(
                    (
                      metric,
                      index
                    ) => (
                      <tr
                        key={`${day}-${metric.key}`}
                        className="hover:bg-slate-50 group"
                      >
                        {index ===
                          0 && (
                          <td
                            rowSpan={
                              METRICS.length
                            }
                            className="px-4 py-4 font-bold text-slate-700 text-center border-r border-slate-200 bg-slate-50/30 align-middle"
                          >
                            <div>
                              {day}
                            </div>
                            <div className="text-[10px] font-medium text-slate-400 mt-1">
                              {formatBookDate(
                                dayData.tanggal
                              )}
                            </div>
                            {dayData.is_holiday && (
                              <div className="mt-2 rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-bold text-amber-700">
                                {dayData.holiday_label || "Libur"}
                              </div>
                            )}
                          </td>
                        )}

                        <td className="px-4 py-2 border-r border-slate-200 text-slate-600 font-medium">
                          {
                            metric.label
                          }
                        </td>

                        <td className="px-2 py-1 border-r border-slate-200">
                          <MetricInput
                            metric={
                              metric
                            }
                            value={
                              dayData[
                                metric
                                  .key
                              ]
                            }
                            onChange={(
                              value
                            ) =>
                              onChange(
                                day,
                                metric.key,
                                value
                              )
                            }
                            disabled={
                              dayDisabled
                            }
                          />
                        </td>

                        {index ===
                          0 && (
                          <>
                            <td
                              rowSpan={
                                METRICS.length
                              }
                              className="p-2 border-r border-slate-200 align-top bg-amber-50/20"
                            >
                              <NotesTextarea
                                value={
                                  dayData.catatan_ortu
                                }
                                onChange={(
                                  value
                                ) =>
                                  onChange(
                                    day,
                                    "catatan_ortu",
                                    value
                                  )
                                }
                                placeholder="Tulis pesan dari rumah..."
                                color="amber"
                                disabled={
                                  dayDisabled
                                }
                              />
                            </td>

                            <td
                              rowSpan={
                                METRICS.length
                              }
                              className="p-2 align-top bg-blue-50/20"
                            >
                              <NotesTextarea
                                value={
                                  dayData.catatan_guru
                                }
                                onChange={(
                                  value
                                ) =>
                                  onChange(
                                    day,
                                    "catatan_guru",
                                    value
                                  )
                                }
                                placeholder="Tulis pesan dari sekolah..."
                                color="blue"
                                disabled={
                                  dayDisabled
                                }
                              />
                            </td>
                          </>
                        )}
                      </tr>
                    )
                  )}

                  <tr>
                    <td
                      colSpan="5"
                      className="bg-slate-100 h-2 border-t border-slate-200"
                    />
                  </tr>
                </Fragment>
              );
            }
          )}
        </tbody>
      </table>
    </div>
  );
}

function MetricInput({
  metric,
  value,
  onChange,
  disabled = false,
}) {
  if (
    metric.type === "select"
  ) {
    return (
      <select
        value={value || ""}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        disabled={disabled}
        className="w-full bg-white border border-slate-200 rounded p-1.5 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 text-sm transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      >
        <option value="">
          - Pilih -
        </option>
        {metric.options.map(
          (option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          )
        )}
      </select>
    );
  }

  return (
    <div className="relative">
      <input
        type={
          metric.type || "text"
        }
        value={value || ""}
        min={metric.min}
        max={metric.max}
        step={metric.step}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
        placeholder={
          metric.placeholder ||
          "..."
        }
        disabled={disabled}
        className="w-full bg-white border border-slate-200 rounded p-1.5 pr-10 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 text-sm placeholder-slate-300 transition-all disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed"
      />

      {metric.unit && (
        <span className="absolute right-3 top-1.5 text-xs text-slate-400 pointer-events-none">
          {metric.unit}
        </span>
      )}
    </div>
  );
}

function NotesTextarea({
  value,
  onChange,
  placeholder,
  color = "amber",
  disabled = false,
  compact = false,
}) {
  const styles = {
    amber:
      "bg-amber-50/20 border-amber-100 focus:border-amber-300 focus:ring-amber-200",
    blue:
      "bg-blue-50/20 border-blue-100 focus:border-blue-300 focus:ring-blue-200",
  };

  return (
    <textarea
      value={value || ""}
      onChange={(event) =>
        onChange(
          event.target.value
        )
      }
      placeholder={placeholder}
      disabled={disabled}
      className={`w-full h-full ${compact ? "min-h-28" : "min-h-40"} p-3 bg-white/60 border rounded-lg resize-none focus:outline-none focus:ring-1 transition-all text-xs placeholder-slate-400 leading-relaxed disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed ${
        styles[color]
      }`}
    />
  );
}

function NotificationPopup({
  notification,
  onClose,
}) {
  if (!notification) {
    return null;
  }

  const config =
    notificationConfig[
      notification.type
    ] ||
    notificationConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${config.iconClass}`}
            >
              <Icon className="h-6 w-6" />
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">
                {
                  notification.title
                }
              </h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed wrap-break-word">
                {
                  notification.message
                }
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              title="Tutup"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${config.buttonClass}`}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
