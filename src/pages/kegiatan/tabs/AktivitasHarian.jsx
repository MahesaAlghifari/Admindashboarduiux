import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ClipboardDocumentListIcon,
  DocumentTextIcon,
  MagnifyingGlassIcon,
  PauseCircleIcon,
  SparklesIcon,
  UserCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import {
  fetchDailyActivityWeek,
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  saveDailyActivity,
} from "../../../api/kegiatan";
import { fetchAllJournals } from "../../../api/administrasi";
import {SectionHeader} from "../../../components/common/DesignSystem";
import {apiErrorMessage} from "../../../lib/apiError";
import {KegiatanDialog,useKegiatanDialog} from "../components/KegiatanDialog";
import { useAuth } from "../../../auth/useAuth";
import { classroomScopeForUser, isTeacherAccount, resolveSelectedClass } from "../classroomScope";

const ALL_CLASSES = "all";

const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
];

const PLAN_FIELDS = [
  {
    key: "tema",
    label: "Tema",
    placeholder: "Isi tema...",
  },
  {
    key: "pilar_karakter",
    label: "Pilar Karakter",
    placeholder: "Isi pilar karakter...",
  },
  {
    key: "nilai_karakter",
    label: "Nilai Karakter",
    placeholder: "Isi nilai karakter...",
  },
  {
    key: "jurnal",
    label: "Jurnal",
    placeholder: "Isi jurnal...",
  },
  {
    key: "aktivitas",
    label: "Aktivitas",
    placeholder: "Isi aktivitas...",
  },
  {
    key: "pembiasaan",
    label: "Pembiasaan",
    placeholder: "Isi pembiasaan...",
  },
];

const STATUS_OPTIONS = [
  {
    id: "Dilakukan",
    label: "Ya",
    icon: CheckCircleIcon,
    base: "border-slate-200 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
    active: "border-emerald-300 bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100",
  },
  {
    id: "Tidak Dilakukan",
    label: "Tidak",
    icon: XCircleIcon,
    base: "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:bg-rose-50 hover:text-rose-700",
    active: "border-rose-300 bg-rose-50 text-rose-700 ring-1 ring-rose-100",
  },
];

const STUDENT_ASSESSMENTS = [
  { key: "jurnal_status", planKey: "jurnal", label: "Jurnal" },
  { key: "pilar_karakter_status", planKey: "nilai_karakter", label: "Nilai Karakter" },
  { key: "aktivitas_status", planKey: "aktivitas", label: "Aktivitas" },
  { key: "pembiasaan_status", planKey: "pembiasaan", label: "Pembiasaan" },
];

const FOOD_OPTIONS = ["Habis", "Tersisa", "Tidak Makan"];
const MOOD_OPTIONS = ["Senang", "Sedih", "Lelah", "Lainnya"];

const studentKeyOf = (student) =>
  `${String(student?.classroom_id ?? "kelas")}:${String(student?.id ?? "")}`;

const hasStudentLogValue = (log) =>
  Boolean(
    log &&
      [
        log.jurnal_status,
        log.pilar_karakter_status ?? log.nilai_karakter_status,
        log.aktivitas_status,
        log.pembiasaan_status,
        log.makanan,
        log.perasaan,
        log.barang_bawaan,
        log.catatan_guru,
      ].some((value) => String(value ?? "").trim())
  );

const moodSelection = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return { selected: "", other: "" };
  if (["Senang", "Sedih", "Lelah"].includes(raw)) {
    return { selected: raw, other: "" };
  }
  if (raw.toLowerCase().startsWith("lainnya:")) {
    return { selected: "Lainnya", other: raw.slice(raw.indexOf(":") + 1).trim() };
  }
  return { selected: "Lainnya", other: raw };
};

const text = (value) =>
  String(value ?? "").trim();

const errorOf=error=>apiErrorMessage(error,{action:"memproses",subject:"data kegiatan"});

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

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
    Date.UTC(date.getUTCFullYear(), 0, 1)
  );

  const week = Math.ceil(
    (((date - yearStart) / 86400000) + 1) /
      7
  );

  return `${date.getUTCFullYear()}-W${String(
    week
  ).padStart(2, "0")}`;
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

const preferredPeriodDate = (period) => {
  const today = localDate(new Date());
  const start = text(period?.tanggal_mulai).slice(0, 10);
  const end = text(period?.tanggal_selesai).slice(0, 10);

  if (!start || !end) return today;
  if (today < start) return start;
  if (today > end) return end;
  return today;
};

const getDatesOfWeek = (weekString) => {
  const match =
    /^(\d{4})-W(\d{2})$/.exec(
      weekString || ""
    );

  if (!match) return {};

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(
    year,
    0,
    4
  );
  const day =
    januaryFourth.getDay() || 7;
  const monday = new Date(
    januaryFourth
  );

  monday.setDate(
    januaryFourth.getDate() -
      day +
      1 +
      (week - 1) * 7
  );

  return DAYS.reduce(
    (result, dayName, index) => {
      const date = new Date(monday);
      date.setDate(
        monday.getDate() + index
      );
      result[dayName] =
        localDate(date);
      return result;
    },
    {}
  );
};

const formatDisplayDate = (
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
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "id-ID",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
};

const emptyPlan = (weekStart) => ({
  schedule_id: null,
  journal_id: null,
  week_start: weekStart,
  tema: "",
  pilar_karakter: "",
  nilai_karakter: "",
  jurnal: "",
  aktivitas: "",
  pembiasaan: "",
  has_schedule: false,
});

const emptySheet = (
  classroomId,
  tanggal
) => ({
  classroom_id: classroomId,
  tanggal,
  plan: emptyPlan(tanggal),
  is_holiday: false,
  items: [],
});

export default function AktivitasHarian() {
  const { user } = useAuth();
  const teacherMode = isTeacherAccount(user);
  const [
    selectedWeek,
    setSelectedWeek,
  ] = useState(getCurrentIsoWeek);
  const [
    selectedClass,
    setSelectedClass,
  ] = useState(() => teacherMode ? "" : ALL_CLASSES);
  const [
    searchSiswa,
    setSearchSiswa,
  ] = useState("");
  const [
    selectedDay,
    setSelectedDay,
  ] = useState("Senin");
  const [selectedStudentKey, setSelectedStudentKey] = useState("");
  const [classes, setClasses] =
    useState([]);
  const [planningOptions, setPlanningOptions] =
    useState([]);
  const [selectedPlanningId, setSelectedPlanningId] =
    useState("");
  const [planningLoading, setPlanningLoading] =
    useState(false);
  const [activePeriod, setActivePeriod] =
    useState(null);
  const [weeklySheets, setWeeklySheets] =
    useState({});
  const [classWeeklySheets, setClassWeeklySheets] =
    useState({});
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const {dialog,notify,close}=useKegiatanDialog();

  const weekDates = useMemo(
    () => getDatesOfWeek(selectedWeek),
    [selectedWeek]
  );

  const selectedDate =
    weekDates[selectedDay] || "";

  const selectedDateAllowed =
    dateInPeriod(selectedDate, activePeriod);
  const minWeek = dateToIsoWeek(
    text(activePeriod?.tanggal_mulai).slice(0, 10)
  );
  const maxWeek = dateToIsoWeek(
    text(activePeriod?.tanggal_selesai).slice(0, 10)
  );

  const currentSheet =
    weeklySheets[selectedDay] ||
    emptySheet(
      selectedClass,
      selectedDate
    );

  const loadClasses =
    useCallback(async () => {
      try {
        const [items, period] =
          await Promise.all([
            fetchKegiatanClassrooms(),
            fetchKegiatanCurrentAcademicPeriod(),
          ]);

        const scope = classroomScopeForUser(user, items);
        setClasses(scope.classes);
        setActivePeriod(period);

        const anchorDate =
          preferredPeriodDate(period);
        setSelectedWeek(
          dateToIsoWeek(anchorDate)
        );

        setSelectedClass((current) =>
          resolveSelectedClass(current, scope, ALL_CLASSES)
        );
      } catch (loadError) {
        setClasses([]);
        setActivePeriod(null);
        setError(errorOf(loadError));
      }
    }, [user]);

  const loadPlanningOptions = useCallback(async () => {
    try {
      const items = await fetchAllJournals(100);
      setPlanningOptions(items);
    } catch {
      // Perencanaan adalah sumber opsional. Gagal memuatnya tidak boleh
      // memblokir pengisian Aktivitas Harian secara manual.
      setPlanningOptions([]);
    }
  }, []);

  const loadWeek =
    useCallback(async () => {
      const dates =
        getDatesOfWeek(
          selectedWeek
        );
      const tanggalList =
        DAYS.map((day) => dates[day]).filter(Boolean);

      if (
        !selectedWeek ||
        selectedClass === "" ||
        tanggalList.length === 0
      ) {
        setWeeklySheets({});
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        if (selectedClass === ALL_CLASSES) {
          const results = await Promise.all(
            classes.map(async (classroom) => ({
              classroom,
              sheets: await fetchDailyActivityWeek({
                classroom_id: classroom.id,
                tanggal_list: tanggalList,
              }),
            }))
          );

          const byClass = {};
          results.forEach(({ classroom, sheets }) => {
            const byDate = new Map(sheets.map((sheet) => [sheet.tanggal, sheet]));
            const classDays = {};
            DAYS.forEach((day) => {
              const tanggal = dates[day];
              classDays[day] =
                byDate.get(tanggal) || emptySheet(classroom.id, tanggal);
            });
            byClass[String(classroom.id)] = classDays;
          });

          const next = {};
          DAYS.forEach((day) => {
            const tanggal = dates[day];
            const dayEntries = results.map(({ classroom }) => ({
              classroom,
              sheet: byClass[String(classroom.id)]?.[day] ||
                emptySheet(classroom.id, tanggal),
            }));
            const statusSource = dayEntries.find(({ sheet }) => sheet.is_holiday)
              || dayEntries[0];

            next[day] = {
              ...emptySheet(ALL_CLASSES, tanggal),
              classroom_name: "Semua Kelas",
              is_holiday: Boolean(statusSource?.sheet?.is_holiday),
              holiday_label: statusSource?.sheet?.holiday_label || "",
              holiday_description: statusSource?.sheet?.holiday_description || "",
              items: dayEntries.flatMap(({ classroom, sheet }) =>
                (sheet.items || []).map((student) => ({
                  ...student,
                  classroom_id: student.classroom_id ?? classroom.id,
                  classroom_name: student.classroom_name || classroom.nama_kelas,
                }))
              ),
            };
          });

          setClassWeeklySheets(byClass);
          setWeeklySheets(next);
        } else {
          const sheets = await fetchDailyActivityWeek({
            classroom_id: selectedClass,
            tanggal_list: tanggalList,
          });

          const byDate = new Map(
            sheets.map((sheet) => [sheet.tanggal, sheet])
          );
          const next = {};

          DAYS.forEach((day) => {
            const tanggal = dates[day];
            next[day] =
              byDate.get(tanggal) || emptySheet(selectedClass, tanggal);
          });

          setClassWeeklySheets({});
          setWeeklySheets(next);
        }
      } catch (loadError) {
        setWeeklySheets({});
        setError(errorOf(loadError));
      } finally {
        setLoading(false);
      }
    }, [
      activePeriod,
      classes,
      selectedClass,
      selectedWeek,
    ]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadPlanningOptions();
    }, 250);

    return () => window.clearTimeout(timer);
  }, [loadPlanningOptions]);

  useEffect(() => {
    loadWeek();
  }, [loadWeek]);

  const filteredSiswa = useMemo(() => {
    const query = searchSiswa.trim().toLowerCase();
    const items = currentSheet.items || [];
    if (!query) return items;

    return items.filter((student) =>
      [student.nama_lengkap, student.nomor_induk, student.nisn, student.classroom_name]
        .some((value) => String(value ?? "").toLowerCase().includes(query))
    );
  }, [currentSheet.items, searchSiswa]);

  const selectedStudent = useMemo(() => {
    const items = currentSheet.items || [];
    return items.find((student) => studentKeyOf(student) === selectedStudentKey) || null;
  }, [currentSheet.items, selectedStudentKey]);

  useEffect(() => {
    const items = currentSheet.items || [];
    if (items.length === 0) {
      setSelectedStudentKey("");
      return;
    }
    if (!items.some((student) => studentKeyOf(student) === selectedStudentKey)) {
      setSelectedStudentKey(studentKeyOf(items[0]));
    }
  }, [currentSheet.items, selectedStudentKey]);

  const selectedStudentClassId = selectedStudent?.classroom_id ??
    (selectedClass === ALL_CLASSES ? null : selectedClass);

  const targetPlanClassId =
    selectedClass === ALL_CLASSES
      ? selectedStudentClassId
      : selectedClass;

  const selectedStudentClassName =
    selectedStudent?.classroom_name ||
    text(classes.find((item) => String(item.id) === String(selectedStudentClassId))?.nama_kelas);

  const selectedStudentSheet = useMemo(() => {
    if (selectedClass !== ALL_CLASSES || selectedStudentClassId === null) return currentSheet;
    return classWeeklySheets[String(selectedStudentClassId)]?.[selectedDay] || currentSheet;
  }, [classWeeklySheets, currentSheet, selectedClass, selectedDay, selectedStudentClassId]);

  const displayPlan = selectedStudentSheet?.plan || currentSheet.plan || emptyPlan(weekDates.Senin || selectedDate);

  const selectedStudentLog = selectedStudent?.log || {};
  const selectedMood = moodSelection(selectedStudentLog.perasaan);

  useEffect(() => {
    const journalId = displayPlan?.journal_id;
    setSelectedPlanningId(
      journalId === null || journalId === undefined || journalId === ""
        ? ""
        : String(journalId)
    );
  }, [displayPlan?.journal_id, targetPlanClassId, selectedWeek]);

  const studentForDay = useCallback((day) => {
    const sheet = weeklySheets[day];
    if (!sheet || !selectedStudentKey) return null;
    return (sheet.items || []).find((student) => studentKeyOf(student) === selectedStudentKey) || null;
  }, [selectedStudentKey, weeklySheets]);

  const scopedSheetsForClass = useCallback((classId) => {
    const original = classWeeklySheets[String(classId)] || {};
    const scoped = {};
    DAYS.forEach((day) => {
      const tanggal = weekDates[day] || "";
      const base = {
        ...emptySheet(classId, tanggal),
        ...original[day],
      };
      const aggregateItems = (weeklySheets[day]?.items || []).filter(
        (student) => String(student.classroom_id) === String(classId)
      );
      scoped[day] = {
        ...base,
        items: aggregateItems.length > 0 ? aggregateItems : base.items,
      };
    });
    return scoped;
  }, [classWeeklySheets, weekDates, weeklySheets]);

  const updatePlanForDay = (classId, day, patch) => {
    if (classId === null || classId === undefined || classId === "" || !day) return;

    const tanggal = weekDates[day] || "";
    const updateDays = (previousDays) => {
      const sheet = {
        ...emptySheet(classId, tanggal),
        ...previousDays?.[day],
      };
      return {
        ...previousDays,
        [day]: {
          ...sheet,
          plan: {
            ...emptyPlan(weekDates.Senin || tanggal),
            ...sheet.plan,
            ...patch,
            week_start: weekDates.Senin || tanggal,
          },
        },
      };
    };

    if (selectedClass === ALL_CLASSES) {
      setClassWeeklySheets((previous) => ({
        ...previous,
        [String(classId)]: updateDays(previous[String(classId)] || {}),
      }));
      return;
    }

    setWeeklySheets((previous) => updateDays(previous));
  };

  const applyPlanToAllDays = (classId, sourcePlan) => {
    if (classId === null || classId === undefined || classId === "") return;

    const copyToDays = (previousDays) => {
      const next = { ...previousDays };
      DAYS.forEach((day) => {
        const tanggal = weekDates[day] || "";
        const sheet = {
          ...emptySheet(classId, tanggal),
          ...previousDays?.[day],
        };
        next[day] = {
          ...sheet,
          plan: {
            ...emptyPlan(weekDates.Senin || tanggal),
            ...sourcePlan,
            week_start: weekDates.Senin || tanggal,
          },
        };
      });
      return next;
    };

    if (selectedClass === ALL_CLASSES) {
      setClassWeeklySheets((previous) => ({
        ...previous,
        [String(classId)]: copyToDays(previous[String(classId)] || {}),
      }));
      return;
    }

    setWeeklySheets((previous) => copyToDays(previous));
  };

  const handlePlanChange = (field, value) => {
    if (!targetPlanClassId) return;
    updatePlanForDay(targetPlanClassId, selectedDay, { [field]: value });
  };

  const handleCopyPlanToWeek = () => {
    if (!targetPlanClassId) return;
    applyPlanToAllDays(targetPlanClassId, displayPlan);
    notify({
      type: "success",
      title: "Rencana Disalin",
      message: `Rencana ${selectedDay} disalin ke seluruh hari pada minggu ini. Setiap hari tetap bisa diedit lagi.`,
    });
  };

  const handleClearPlanDay = () => {
    if (!targetPlanClassId) return;
    updatePlanForDay(targetPlanClassId, selectedDay, {
      schedule_id: null,
      journal_id: null,
      tema: "",
      pilar_karakter: "",
      nilai_karakter: "",
      jurnal: "",
      aktivitas: "",
      pembiasaan: "",
      has_schedule: false,
    });
    setSelectedPlanningId("");
    notify({
      type: "info",
      title: "Rencana Dikosongkan",
      message: `Rencana ${selectedDay} dikosongkan. Perubahan akan tersimpan saat Anda menekan Simpan Minggu Siswa.`,
    });
  };

  const handleApplyPlanning = async () => {
    if (!targetPlanClassId) {
      notify({
        type: "warning",
        title: "Kelas Belum Tersedia",
        message: "Pilih siswa atau kelas terlebih dahulu sebelum mengambil perencanaan.",
      });
      return;
    }

    const planning = planningOptions.find(
      (item) => String(item.id) === String(selectedPlanningId)
    );

    if (!planning) {
      notify({
        type: "warning",
        title: "Perencanaan Belum Dipilih",
        message: `Pilih perencanaan yang ingin diterapkan untuk ${selectedDay}.`,
      });
      return;
    }

    setPlanningLoading(true);
    try {
      updatePlanForDay(targetPlanClassId, selectedDay, {
        journal_id: planning.id,
        tema: planning.tema || "",
        pilar_karakter: planning.pilar_karakter || "",
        nilai_karakter: planning.nilai_karakter || "",
        jurnal: planning.isi_jurnal || "",
        aktivitas: planning.aktivitas || "",
        pembiasaan: planning.pembiasaan || "",
      });

      notify({
        type: "success",
        title: "Perencanaan Diterapkan",
        message: `Perencanaan diterapkan untuk ${selectedDay}. Hari lain tidak berubah dan tetap bisa diatur berbeda.`,
      });
    } finally {
      setPlanningLoading(false);
    }
  };

  const handlePersonalChange = (
    studentId,
    field,
    value,
    classroomId = null
  ) => {
    setWeeklySheets(
      (previous) => {
        const sheet = {
          ...emptySheet(
            selectedClass,
            selectedDate
          ),
          ...previous[selectedDay],
        };

        return {
          ...previous,
          [selectedDay]: {
            ...sheet,
            items: sheet.items.map(
              (student) =>
                String(student.id) === String(studentId) &&
                (classroomId === null || String(student.classroom_id) === String(classroomId)) &&
                student.log?.activity_readonly !== true
                  ? {
                      ...student,
                      log: {
                        ...student.log,
                        [field]: value,
                        ...(field === "pilar_karakter_status"
                          ? { nilai_karakter_status: value }
                          : {}),
                      },
                    }
                  : student
            ),
          },
        };
      }
    );
  };

  const copySelectedStudentFieldToAllDays = (field, value) => {
    if (!selectedStudent || selectedStudentReadonly) return;

    setWeeklySheets((previous) => {
      const next = { ...previous };

      DAYS.forEach((day) => {
        const sheet = previous[day];
        if (!sheet) return;

        next[day] = {
          ...sheet,
          items: (sheet.items || []).map((student) =>
            studentKeyOf(student) === selectedStudentKey &&
            student.log?.activity_readonly !== true
              ? {
                  ...student,
                  log: {
                    ...student.log,
                    [field]: value,
                  },
                }
              : student
          ),
        };
      });

      return next;
    });

    notify({
      type: "success",
      title: "Barang Disalin",
      message: value
        ? "Barang yang dibawa besok disalin ke semua hari pada minggu ini."
        : "Barang yang dibawa besok dikosongkan untuk semua hari pada minggu ini.",
    });
  };

  const handleEditPreviousActivity = () => {
    if (!selectedStudent || !selectedStudentKey) return;

    setWeeklySheets((previous) => {
      const next = { ...previous };

      DAYS.forEach((day) => {
        const sheet = previous[day];
        if (!sheet) return;

        next[day] = {
          ...sheet,
          items: (sheet.items || []).map((student) =>
            studentKeyOf(student) === selectedStudentKey
              ? {
                  ...student,
                  log: {
                    ...student.log,
                    activity_readonly: false,
                    activity_source_classroom_id:
                      student.classroom_id ?? student.log?.classroom_id ?? null,
                    activity_source_classroom_name:
                      student.classroom_name ?? student.log?.classroom_name ?? "",
                  },
                }
              : student
          ),
        };
      });

      return next;
    });

    notify({
      type: "info",
      title: "Aktivitas Dibuka Kembali",
      message: `Lembar mingguan ${selectedStudent.nama_lengkap} dapat diedit dan disimpan kembali.`,
    });
  };

  const buildPayload = (
    sheet,
    classroomId = selectedClass,
    sourceWeeklySheets = weeklySheets
  ) => {
    const classroomName = text(
      classes.find(
        (item) => String(item.id) === String(classroomId)
      )?.nama_kelas
    );

    const mapItems = (sourceSheet) =>
      (sourceSheet.items || [])
        .filter((student) => student.log?.activity_readonly !== true)
        .map((student) => ({
          student_id: student.id,
          pilar_karakter_status:
            student.log?.pilar_karakter_status || student.log?.nilai_karakter_status || "",
          nilai_karakter_status:
            student.log?.pilar_karakter_status || student.log?.nilai_karakter_status || "",
          jurnal_status: student.log?.jurnal_status || "",
          aktivitas_status: student.log?.aktivitas_status || "",
          pembiasaan_status: student.log?.pembiasaan_status || "",
          makanan: student.log?.makanan || "",
          perasaan: student.log?.perasaan || "",
          barang_bawaan: student.log?.barang_bawaan || "",
          catatan_guru: student.log?.catatan_guru || "",
          daily_plan: {
            ...emptyPlan(weekDates.Senin || sourceSheet.tanggal || selectedDate),
            ...sourceSheet.plan,
            week_start: weekDates.Senin || sourceSheet.tanggal || selectedDate,
          },
          student_name: student.nama_lengkap || student.log?.student_name || "",
          student_nisn: student.nisn || student.log?.student_nisn || "",
          student_gender: student.jenis_kelamin || student.log?.student_gender || "",
          classroom_id: student.classroom_id ?? classroomId,
          classroom_name: student.classroom_name || classroomName,
        }));

    const weekSheets = DAYS.map((day) => {
      const tanggal = weekDates[day] || "";
      const sourceSheet =
        day === selectedDay
          ? sheet
          : {
              ...emptySheet(classroomId, tanggal),
              ...sourceWeeklySheets[day],
            };

      return {
        tanggal,
        is_holiday: Boolean(sourceSheet.is_holiday),
        items: mapItems(sourceSheet),
      };
    }).filter((item) => Boolean(item.tanggal));

    return {
      classroom_id: classroomId,
      classroom_name: classroomName,
      tanggal: selectedDate,
      week_start: weekDates.Senin || selectedDate,
      plan: {
        ...emptyPlan(weekDates.Senin || selectedDate),
        ...sheet.plan,
        week_start: weekDates.Senin || selectedDate,
      },
      is_holiday: Boolean(sheet.is_holiday),
      items: mapItems(sheet),
      week_sheets: weekSheets,
    };
  };

  const saveCurrentSheet =
    async (showSuccess = true) => {
      if (
        saving ||
        selectedClass === "" ||
        !selectedDate ||
        !selectedDateAllowed
      ) {
        return null;
      }

      if (selectedClass === ALL_CLASSES) {
        if (!selectedStudent || selectedStudentClassId === null) {
          notify({
            type: "warning",
            title: "Pilih Siswa",
            message: "Pilih satu siswa sebelum menyimpan lembar aktivitas mingguan.",
          });
          return null;
        }

        const classId = selectedStudentClassId;
        const sourceSheets = scopedSheetsForClass(classId);
        const classSheet = sourceSheets[selectedDay] ||
          emptySheet(classId, selectedDate);

        setSaving(true);
        try {
          await saveDailyActivity(buildPayload(classSheet, classId, sourceSheets));
          setClassWeeklySheets((previous) => ({
            ...previous,
            [String(classId)]: sourceSheets,
          }));

          if (showSuccess) {
            notify({
              type: "success",
              title: "Aktivitas Mingguan Tersimpan",
              message: `Rencana per hari dan lembar aktivitas ${selectedStudent.nama_lengkap} untuk minggu ini berhasil disimpan.`,
            });
          }
          return classSheet;
        } catch (saveError) {
          notify({ type: "error", title: "Aktivitas Gagal Disimpan", message: errorOf(saveError) });
          return null;
        } finally {
          setSaving(false);
        }
      }

      const sheet = {
        ...emptySheet(
          selectedClass,
          selectedDate
        ),
        ...currentSheet,
      };

      setSaving(true);

      try {
        const saved =
          await saveDailyActivity(
            buildPayload(sheet)
          );

        setWeeklySheets(
          (previous) => {
            const next = {};
            const savedSheet = {
              ...sheet,
              ...saved,
              // Backend hanya mengembalikan satu rencana_mingguan. Rencana
              // harian lokal adalah sumber kebenaran untuk hari yang dipilih.
              plan: sheet.plan,
              // saveDailyActivity tidak lagi melakukan GET setelah PUT.
              // Pertahankan daftar siswa dari state yang baru saja disimpan.
              items:
                Array.isArray(saved.items) && saved.items.length > 0
                  ? saved.items
                  : sheet.items,
            };

            DAYS.forEach((day) => {
              if (day === selectedDay) {
                next[day] = savedSheet;
                return;
              }

              const tanggal = weekDates[day] || "";
              next[day] = {
                ...emptySheet(selectedClass, tanggal),
                ...previous[day],
              };
            });

            return {
              ...previous,
              ...next,
            };
          }
        );

        if (showSuccess) {
          notify({
            type: "success",
            title: "Aktivitas Mingguan Tersimpan",
            message: selectedStudent
              ? `Rencana per hari dan lembar aktivitas ${selectedStudent.nama_lengkap} berhasil disimpan.`
              : "Data aktivitas mingguan berhasil disimpan.",
          });
        }

        return saved;
      } catch (saveError) {
        notify({type:"error",title:"Aktivitas Gagal Disimpan",message:errorOf(saveError)});
        return null;
      } finally {
        setSaving(false);
      }
    };

  const handleSave = async () => {
    await saveCurrentSheet(true);
  };

  const isCurrentDayHoliday = Boolean(selectedStudentSheet?.is_holiday ?? currentSheet.is_holiday);
  const selectedStudentReadonly = selectedStudentLog.activity_readonly === true;
  const weekNumber = selectedWeek.split("-W")[1] || "-";
  const weekEnd = weekDates.Jumat || "";

  const setSelectedField = (field, value) => {
    if (!selectedStudent || selectedStudentReadonly) return;
    handlePersonalChange(
      selectedStudent.id,
      field,
      value,
      selectedStudent.classroom_id ?? null
    );
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <SectionHeader
        icon={ClipboardDocumentListIcon}
        title="Aktivitas Harian"
        description="Satu lembar aktivitas mingguan untuk setiap siswa, mengikuti format partisipasi dan refleksi harian sekolah."
      />

      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <CalendarDaysIcon className="h-4 w-4 text-[#ef4d45]" />
          <span className="font-semibold text-slate-700">Minggu {weekNumber}</span>
          <span className="text-slate-300">•</span>
          <span>{weekDates.Senin ? formatDisplayDate(weekDates.Senin) : "-"}</span>
          <span>–</span>
          <span>{weekEnd ? formatDisplayDate(weekEnd) : "-"}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="week"
            value={selectedWeek}
            min={minWeek || undefined}
            max={maxWeek || undefined}
            onChange={(event) => setSelectedWeek(event.target.value)}
            className="ui-compact-control"
          />

        </div>
      </div>

      {loading ? (
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-12 flex items-center justify-center">
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Memuat aktivitas mingguan...
          </span>
        </div>
      ) : error ? (
        <div className="mt-4 rounded-xl border border-rose-100 bg-rose-50 p-8 flex flex-col items-center justify-center">
          <p className="text-sm text-rose-600">{error}</p>
          <button
            type="button"
            onClick={loadWeek}
            className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]"
          >
            Muat ulang
          </button>
        </div>
      ) : (
        <>
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
            <div className="flex flex-col gap-3 border-b border-slate-100 pb-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex items-center gap-2">
                <div className="rounded-lg bg-red-50 p-1.5 text-[#e94640]">
                  <ClipboardDocumentListIcon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wide text-slate-800">Rencana Harian</h3>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Atur Tema, Pilar Karakter, Nilai Karakter, Jurnal, Aktivitas, dan Pembiasaan untuk hari yang sedang dibuka.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-end">
                <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] font-semibold text-slate-600">
                  {selectedDay} • {formatDisplayDate(selectedDate)}
                </div>
                {selectedClass === ALL_CLASSES && selectedStudent && (
                  <div className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-[11px] font-medium text-blue-700">
                    {selectedStudentClassName || "Kelas siswa"}
                  </div>
                )}
                <select
                  value={selectedPlanningId}
                  onChange={(event) => setSelectedPlanningId(event.target.value)}
                  disabled={!targetPlanClassId || selectedStudentReadonly || planningLoading}
                  className="ui-compact-control min-w-56 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <option value="">Pilih Perencanaan</option>
                  {planningOptions.map((item) => (
                    <option key={item.id ?? `${item.tema}-${item.pilar_karakter}`} value={item.id ?? ""}>
                      {item.tema || "Tanpa Tema"}{item.pilar_karakter ? ` • ${item.pilar_karakter}` : ""}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={handleApplyPlanning}
                  disabled={!targetPlanClassId || !selectedPlanningId || selectedStudentReadonly || planningLoading}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-red-100 bg-red-50 px-3 text-[11px] font-semibold text-[#e94640] transition-colors hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {planningLoading ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )}
                  Ambil untuk Hari Ini
                </button>
                <button
                  type="button"
                  onClick={handleCopyPlanToWeek}
                  disabled={!targetPlanClassId || selectedStudentReadonly}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <DocumentTextIcon className="h-4 w-4" />
                  Salin ke Semua Hari
                </button>
                <button
                  type="button"
                  onClick={handleClearPlanDay}
                  disabled={!targetPlanClassId || selectedStudentReadonly}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 text-[11px] font-semibold text-rose-600 transition-colors hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Kosongkan Hari Ini
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {DAYS.map((day) => {
                const active = selectedDay === day;
                return (
                  <button
                    type="button"
                    key={`plan-${day}`}
                    onClick={() => setSelectedDay(day)}
                    className={`rounded-lg border px-3 py-2 text-[11px] font-semibold transition-all ${
                      active
                        ? "border-red-200 bg-red-50 text-[#e94640]"
                        : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {PLAN_FIELDS.map((field) => (
                <div key={field.key}>
                  <label className="mb-1.5 ml-1 block text-[10px] font-bold uppercase text-slate-400">
                    {field.label}
                  </label>
                  <input
                    type="text"
                    disabled={!targetPlanClassId || selectedStudentReadonly}
                    value={displayPlan?.[field.key] || ""}
                    onChange={(event) => handlePlanChange(field.key, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition-all placeholder-slate-300 hover:border-slate-300 focus:border-[#e94640] focus:ring-1 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-500"
                  />
                </div>
              ))}
            </div>

          </div>

          <div className="mt-4 grid min-h-[620px] grid-cols-1 overflow-hidden rounded-xl border border-slate-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-slate-200 bg-slate-50/50 lg:border-b-0 lg:border-r">
              <div className="border-b border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2">
                  <UserCircleIcon className="h-5 w-5 text-slate-400" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">Daftar Siswa</h3>
                    <p className="text-[10px] text-slate-400">Pilih siswa untuk membuka lembar mingguannya</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-2">
                  <select
                    value={selectedClass}
                    onChange={(event) => setSelectedClass(event.target.value)}
                    disabled={teacherMode && classes.length <= 1}
                    className="ui-compact-control w-full disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {!teacherMode && <option value={ALL_CLASSES}>Semua Kelas</option>}
                    {teacherMode && classes.length === 0 && (
                      <option value="">Belum ada kelas yang ditugaskan</option>
                    )}
                    {classes.map((classroom) => (
                      <option key={classroom.id} value={classroom.id}>
                        {classroom.nama_kelas}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Cari nama / NIS..."
                    value={searchSiswa}
                    onChange={(event) => setSearchSiswa(event.target.value)}
                    className="ui-compact-control w-full pl-9"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                </div>
              </div>

              <div className="max-h-[720px] overflow-y-auto p-2">
                {filteredSiswa.map((student) => {
                  const key = studentKeyOf(student);
                  const active = key === selectedStudentKey;
                  const dayStudent = (weeklySheets[selectedDay]?.items || []).find(
                    (candidate) => studentKeyOf(candidate) === key
                  );
                  const recorded = hasStudentLogValue(dayStudent?.log || student.log);
                  return (
                    <button
                      type="button"
                      key={key}
                      onClick={() => setSelectedStudentKey(key)}
                      className={`mb-1 w-full rounded-lg border px-3 py-2.5 text-left transition-all ${
                        active
                          ? "border-red-200 bg-red-50 shadow-sm"
                          : "border-transparent bg-transparent hover:border-slate-200 hover:bg-white"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className={`truncate text-xs font-bold ${active ? "text-[#e94640]" : "text-slate-700"}`}>
                            {student.nama_lengkap}
                          </div>
                          <div className="mt-0.5 truncate text-[10px] text-slate-400">
                            {student.nisn || student.nomor_induk || "-"}
                            {selectedClass === ALL_CLASSES && student.classroom_name
                              ? ` • ${student.classroom_name}`
                              : ""}
                          </div>
                        </div>
                        {recorded && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-emerald-400" title="Sudah ada data" />}
                      </div>
                    </button>
                  );
                })}
                {filteredSiswa.length === 0 && (
                  <div className="px-4 py-10 text-center text-xs text-slate-400">Tidak ada siswa ditemukan.</div>
                )}
              </div>
            </aside>

            <main className="min-w-0">
              {!selectedStudent ? (
                <div className="flex h-full min-h-[520px] flex-col items-center justify-center p-8 text-center">
                  <UserCircleIcon className="h-12 w-12 text-slate-200" />
                  <h3 className="mt-3 text-sm font-bold text-slate-700">Pilih siswa</h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-400">Pilih satu siswa di sebelah kiri untuk mengisi lembar aktivitas mingguannya.</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-200 bg-white px-5 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h2 className="text-base font-bold text-slate-800">{selectedStudent.nama_lengkap}</h2>
                        <p className="mt-0.5 text-xs text-slate-400">
                          {selectedStudent.nisn || selectedStudent.nomor_induk || "NIS -"}
                          {selectedStudentClassName ? ` • ${selectedStudentClassName}` : ""}
                          {` • Minggu ${weekNumber}`}
                        </p>
                      </div>
                      {selectedStudentReadonly && (
                        <button
                          type="button"
                          onClick={handleEditPreviousActivity}
                          className="inline-flex h-9 items-center justify-center rounded-lg border border-amber-200 bg-amber-50 px-3 text-[10px] font-semibold text-amber-700 transition-colors hover:border-amber-300 hover:bg-amber-100"
                        >
                          Edit kembali
                        </button>
                      )}
                    </div>

                    <div className="mt-4 flex min-w-0 gap-2 overflow-x-auto no-scrollbar">
                      {DAYS.map((day) => {
                        const sheet = weeklySheets[day];
                        const dayAllowed = dateInPeriod(weekDates[day], activePeriod);
                        const active = selectedDay === day;
                        const studentOnDay = studentForDay(day);
                        const recorded = hasStudentLogValue(studentOnDay?.log);
                        const classId = studentOnDay?.classroom_id ?? selectedStudentClassId;
                        const classSheet = selectedClass === ALL_CLASSES && classId !== null
                          ? classWeeklySheets[String(classId)]?.[day]
                          : sheet;
                        const holiday = Boolean(classSheet?.is_holiday ?? sheet?.is_holiday);
                        return (
                          <button
                            type="button"
                            key={day}
                            disabled={!weekDates[day] || !dayAllowed}
                            onClick={() => setSelectedDay(day)}
                            className={`relative inline-flex h-10 shrink-0 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-35 ${
                              active
                                ? holiday
                                  ? "border-amber-200 bg-amber-50 text-amber-700"
                                  : "border-red-200 bg-red-50 text-[#ef4d45]"
                                : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                            }`}
                          >
                            {day}
                            {holiday ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            ) : recorded ? (
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            ) : null}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {isCurrentDayHoliday ? (
                    <div className="flex min-h-[430px] flex-col items-center justify-center p-8 text-center">
                      <div className="rounded-full bg-amber-50 p-4">
                        <SparklesIcon className="h-9 w-9 text-amber-400" />
                      </div>
                      <h3 className="mt-4 text-base font-bold text-slate-700">{selectedStudentSheet?.holiday_label || "Hari Libur"}</h3>
                      <p className="mt-1 max-w-md text-xs text-slate-400">Tidak ada input aktivitas untuk {selectedDay}, {formatDisplayDate(selectedDate)}.</p>
                    </div>
                  ) : (
                    <div className="p-5">
                      <div className="mb-5 flex items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-slate-800">{selectedDay}, {formatDisplayDate(selectedDate)}</h3>
                          <p className="mt-0.5 text-[11px] text-slate-400">Isi partisipasi dan refleksi siswa untuk hari ini.</p>
                        </div>
                        <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-[10px] font-medium text-slate-500">
                          Partisipasi: Ya / Tidak
                        </div>
                      </div>

                      <section>
                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Partisipasi Anak</h4>
                        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                          {STUDENT_ASSESSMENTS.map((assessment) => {
                            const statusValue = assessment.key === "pilar_karakter_status"
                              ? selectedStudentLog.pilar_karakter_status || selectedStudentLog.nilai_karakter_status || ""
                              : selectedStudentLog[assessment.key] || "";
                            return (
                              <div key={assessment.key} className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex min-h-14 items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className="text-[10px] font-bold uppercase text-slate-400">{assessment.label}</div>
                                    <div className="mt-1 text-sm font-semibold leading-5 text-slate-700">
                                      {displayPlan?.[assessment.planKey] || "Belum ada rencana"}
                                    </div>
                                  </div>
                                </div>
                                <div className="mt-3 grid grid-cols-2 gap-2">
                                  {STATUS_OPTIONS.map((option) => {
                                    const Icon = option.icon;
                                    const active = statusValue === option.id;
                                    return (
                                      <button
                                        type="button"
                                        key={option.id}
                                        disabled={selectedStudentReadonly}
                                        onClick={() => setSelectedField(assessment.key, option.id)}
                                        aria-pressed={active}
                                        className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg border text-xs font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${active ? option.active : option.base}`}
                                      >
                                        <Icon className="h-4 w-4" />
                                        {option.label}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </section>

                      <section className="mt-6 border-t border-slate-100 pt-5">
                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Refleksi Harian</h4>
                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                          <div className="rounded-xl border border-slate-200 p-4">
                            <label className="text-xs font-bold text-slate-700">Makananku</label>
                            <div className="mt-3 grid grid-cols-3 gap-2">
                              {FOOD_OPTIONS.map((option) => {
                                const active = selectedStudentLog.makanan === option;
                                return (
                                  <button
                                    type="button"
                                    key={option}
                                    disabled={selectedStudentReadonly}
                                    onClick={() => setSelectedField("makanan", option)}
                                    className={`h-10 rounded-lg border px-2 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-red-200 bg-red-50 text-[#e94640]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="rounded-xl border border-slate-200 p-4">
                            <label className="text-xs font-bold text-slate-700">Perasaanku Hari Ini</label>
                            <div className="mt-3 grid grid-cols-4 gap-2">
                              {MOOD_OPTIONS.map((option) => {
                                const active = selectedMood.selected === option;
                                return (
                                  <button
                                    type="button"
                                    key={option}
                                    disabled={selectedStudentReadonly}
                                    onClick={() => setSelectedField("perasaan", option === "Lainnya" ? "Lainnya:" : option)}
                                    className={`h-10 rounded-lg border px-2 text-[11px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${active ? "border-red-200 bg-red-50 text-[#e94640]" : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}
                                  >
                                    {option}
                                  </button>
                                );
                              })}
                            </div>
                            {selectedMood.selected === "Lainnya" && (
                              <input
                                type="text"
                                disabled={selectedStudentReadonly}
                                value={selectedMood.other}
                                onChange={(event) => setSelectedField("perasaan", `Lainnya: ${event.target.value}`)}
                                placeholder="Tuliskan perasaan lainnya..."
                                className="mt-3 w-full rounded-lg border border-slate-200 px-3 py-2 text-xs text-slate-700 outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 disabled:bg-slate-50"
                              />
                            )}
                          </div>

                          <div className="rounded-xl border border-slate-200 p-4 xl:col-span-2">
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <label className="text-xs font-bold text-slate-700">Barang yang dibawa besok</label>
                              <button
                                type="button"
                                disabled={selectedStudentReadonly}
                                onClick={() =>
                                  copySelectedStudentFieldToAllDays(
                                    "barang_bawaan",
                                    selectedStudentLog.barang_bawaan || ""
                                  )
                                }
                                className="inline-flex h-8 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-[10px] font-semibold text-slate-600 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-[#e94640] disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                Salin ke Semua Hari
                              </button>
                            </div>
                            <input
                              type="text"
                              disabled={selectedStudentReadonly}
                              value={selectedStudentLog.barang_bawaan || ""}
                              onChange={(event) => setSelectedField("barang_bawaan", event.target.value)}
                              placeholder="Contoh: topi, buku gambar, botol minum..."
                              className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-xs text-slate-700 outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 disabled:bg-slate-50"
                            />
                          </div>
                        </div>
                      </section>

                      <section className="mt-6 border-t border-slate-100 pt-5">
                        <h4 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-slate-500">Catatan</h4>
                        <div>
                          <label className="text-xs font-bold text-slate-700">Catatan Guru</label>
                          <textarea
                            rows={5}
                            disabled={selectedStudentReadonly}
                            value={selectedStudentLog.catatan_guru || ""}
                            onChange={(event) => setSelectedField("catatan_guru", event.target.value)}
                            placeholder="Catatan guru untuk siswa..."
                            className="mt-2 w-full resize-y rounded-lg border border-slate-200 px-3 py-2.5 text-xs leading-5 text-slate-700 outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 disabled:bg-slate-50"
                          />
                        </div>
                      </section>
                    </div>
                  )}

                  <div className="sticky bottom-0 z-20 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] text-slate-400">
                      Simpan akan menyimpan rencana setiap hari dan data siswa ini untuk satu minggu.
                    </div>
                    <button
                      type="button"
                      onClick={handleSave}
                      disabled={
                        saving ||
                        selectedClass === "" ||
                        !selectedDateAllowed ||
                        !selectedStudent ||
                        selectedStudentReadonly
                      }
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-5 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {saving ? (
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      ) : (
                        <DocumentTextIcon className="h-4 w-4" />
                      )}
                      {saving ? "Menyimpan..." : "Simpan Minggu Siswa"}
                    </button>
                  </div>
                </>
              )}
            </main>
          </div>
        </>
      )}

      <KegiatanDialog dialog={dialog} onClose={close} />
    </div>
  );

}