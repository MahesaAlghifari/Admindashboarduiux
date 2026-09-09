import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  AcademicCapIcon,
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ClockIcon,
  DocumentTextIcon,
  ExclamationCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  EyeIcon,
  InformationCircleIcon,
  LockClosedIcon,
  LockOpenIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchKegiatanClassrooms,
  fetchKegiatanStudents,
  fetchReportCurriculumContext,
  fetchSchoolProfile,
  fetchStudentReport,
  fetchStudentReportProgressList,
  finalizeStudentReport,
  reopenStudentReport,
  saveStudentReport,
} from "../../../api/kegiatan";
import { RaporPrintTemplate } from "../../../components/common/RaporPrintTemplate";
import { fetchStaff } from "../../../api/staff";
import { getMe } from "../../../api/auth";
import { getAuthSession } from "../../../auth/session";
import {SectionHeader} from "../../../components/common/DesignSystem";
import Pagination from "../../../components/common/Pagination";
import {apiErrorMessage} from "../../../lib/apiError";
import { useAuth } from "../../../auth/useAuth";
import { classroomScopeForUser, isTeacherAccount, resolveSelectedClass } from "../classroomScope";
import { studentClassroomMeta, studentGenderLabel } from "../tableUtils";

const SCALES = ["BB", "MB", "BSH", "BSB"];

const text = (value) => String(value ?? "").trim();

const normalized = (value) =>
  text(value)
    .toLowerCase()
    .replace(/\s+/g, " ");

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
    normalized(staff.nama_lengkap) ===
      normalized(teacher.nama_lengkap)
  );
};

const errorOf=error=>apiErrorMessage(error,{action:"memproses",subject:"data kegiatan"});

const emptyReport = (studentId, period) => ({
  student_id: studentId,
  tahun_ajaran: period.tahun_ajaran,
  semester: period.semester,
  scores: [],
  catatan: "",
  fisik: {
    berat_badan: null,
    tinggi_badan: null,
  },
  absensi: {
    sakit: 0,
    izin: 0,
    alpa: 0,
  },
  komentar_ortu: "",
  report_status: "DRAFT",
  created_at: "",
  created_by: "",
  updated_at: "",
  updated_by: "",
  finalized_at: "",
  finalized_by: "",
  history: [],
});

const groupIndicators = (indicators) => {
  const aspects = new Map();

  indicators.forEach((indicator) => {
    const aspectName = text(indicator.aspek) || "Tanpa Aspek";
    const subAspectName = text(indicator.sub_aspek) || "Tanpa Subaspek";

    if (!aspects.has(aspectName)) {
      aspects.set(aspectName, new Map());
    }

    const subAspects = aspects.get(aspectName);
    if (!subAspects.has(subAspectName)) {
      subAspects.set(subAspectName, []);
    }

    subAspects.get(subAspectName).push(indicator);
  });

  return Array.from(aspects.entries()).map(([aspect, subAspects]) => ({
    aspect,
    sub_aspects: Array.from(subAspects.entries()).map(([name, items]) => ({
      name,
      items,
    })),
  }));
};

const scoreMapFrom = (report) =>
  new Map(
    (report?.scores || []).map((item) => [String(item.indicator_id), item.scale])
  );

const resolveHomeroomTeacher = (classroom, staffMembers) => {
  const classroomTeacher = classroom?.wali_kelas;

  if (!classroomTeacher) return null;

  return (
    staffMembers.find((staff) => sameStaff(staff, classroomTeacher)) || {
      ...classroomTeacher,
      nip: "",
    }
  );
};

const buildPrintStudent = (student, report) => {
  if (!student || !report) return null;

  return {
    id: report.student_id ?? student.id,
    class_id: report.classroom_id ?? student.classroom_id,
    peserta_didik: {
      nomor_induk:
        text(report.nisn) ||
        student.nomor_induk ||
        student.nisn ||
        "",
      nama_lengkap:
        text(report.student_nama) ||
        student.nama_lengkap,
      jenis_kelamin: student.jenis_kelamin,
      keadaan_jasmani: {
        berat_badan: report.fisik?.berat_badan ?? "",
        tinggi_badan: report.fisik?.tinggi_badan ?? "",
      },
    },
  };
};

const buildPrintData = (report, indicators, period) => {
  if (!report) return null;

  const scores = scoreMapFrom(report);
  const nilai = Object.fromEntries(
    indicators.map((indicator) => [
      indicator.deskripsi,
      scores.get(String(indicator.id)) || "",
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
      catatan: report.catatan,
      fisik: {
        bb: report.fisik?.berat_badan ?? "",
        tb: report.fisik?.tinggi_badan ?? "",
      },
      absen: {
        s: report.absensi?.sakit ?? 0,
        i: report.absensi?.izin ?? 0,
        a: report.absensi?.alpa ?? 0,
      },
      komentar_ortu: report.komentar_ortu || "",
    },
  };
};

const progressStatus = (progress, allowedIndicatorIds) => {
  const allowed = new Set(allowedIndicatorIds.map((id) => String(id)));
  const backendFilled = Number(progress?.filled_count);
  const backendTotal = Number(progress?.total_count);
  const fallbackFilled = new Set(
    (progress?.indicator_ids || [])
      .map((id) => String(id))
      .filter((id) => allowed.size === 0 || allowed.has(id))
  ).size;

  const filled = Number.isFinite(backendFilled)
    ? Math.max(0, backendFilled)
    : fallbackFilled;
  const total = allowed.size > 0
    ? allowed.size
    : Number.isFinite(backendTotal)
      ? Math.max(0, backendTotal)
      : 0;
  const hasNote = Boolean(progress?.has_catatan);
  const hasDevelopment = Boolean(progress?.has_development);
  const indicatorsComplete = total > 0 && filled >= total;
  const complete = indicatorsComplete && hasNote && hasDevelopment;
  const backendStatus = text(progress?.backend_status).toLowerCase();
  const reportStarted =
    filled > 0 ||
    hasNote ||
    (backendStatus && !backendStatus.includes("belum"));
  const missing = [];

  if (!indicatorsComplete) {
    missing.push(total > 0 ? `Indikator ${filled}/${total}` : "Indikator belum tersedia");
  }
  if (!hasNote) missing.push("Catatan Guru");
  if (!hasDevelopment) missing.push("Perkembangan");

  if (complete) {
    return {
      status: "Lengkap",
      filled,
      total,
      hasNote,
      hasDevelopment,
      complete: true,
      missing: [],
      lifecycle: "DRAFT",
    };
  }

  if (!reportStarted) {
    return {
      status: "Belum diisi",
      filled,
      total,
      hasNote,
      hasDevelopment,
      complete: false,
      missing,
      lifecycle: "DRAFT",
    };
  }

  return {
    status: "Belum Lengkap",
    filled,
    total,
    hasNote,
    hasDevelopment,
    complete: false,
    missing,
    lifecycle: "DRAFT",
  };
};

const periodEndDate = (period) => {
  const startYear = Number(String(period?.tahun_ajaran || "").split("/")[0]);

  if (!Number.isFinite(startYear)) {
    return new Date();
  }

  return Number(period?.semester) === 2
    ? new Date(startYear + 1, 5, 30, 23, 59, 59)
    : new Date(startYear, 11, 31, 23, 59, 59);
};

const resolveHeadmasterForPeriod = (staffMembers, period) => {
  const end = periodEndDate(period).getTime();

  const candidates = staffMembers
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
    });

  return candidates[0] || null;
};

const actorLabel = (user) =>
  text(
    user?.nama_lengkap ||
      user?.fullname ||
      user?.name ||
      user?.profile?.nama_lengkap ||
      user?.staff?.nama_lengkap ||
      user?.username ||
      user?.nik
  ) || "Akun tidak diketahui";

const resolveActorName = (user, staffMembers) => {
  if (!user) return "Akun tidak diketahui";

  const directName = text(
    user?.nama_lengkap ||
      user?.fullname ||
      user?.name ||
      user?.profile?.nama_lengkap ||
      user?.staff?.nama_lengkap
  );

  if (directName) return directName;

  const userId =
    user?.staff_id ??
    user?.staffid ??
    user?.id ??
    user?.user_id ??
    null;
  const userNik = text(
    user?.nik ||
      user?.profile?.nik ||
      user?.staff?.nik
  );

  const matchedStaff = (staffMembers || []).find((staff) => {
    if (
      userId !== null &&
      userId !== undefined &&
      staff?.id !== null &&
      staff?.id !== undefined &&
      String(staff.id) === String(userId)
    ) {
      return true;
    }

    return Boolean(
      userNik &&
        text(staff?.nik) &&
        userNik === text(staff.nik)
    );
  });

  return text(matchedStaff?.nama_lengkap) || actorLabel(user);
};

const sessionUser = () => getAuthSession()?.user || null;

const historyLabel = (action) => {
  if (action === "CREATED") return "Draf dibuat";
  if (action === "FINALIZED") return "Rapor difinalisasi";
  if (action === "REOPENED") return "Rapor dibuka kembali";
  return "Draf diperbarui";
};

const dateTimeLabel = (value) => {
  if (!text(value)) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return text(value);

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};


const notificationConfig = {
  success: {
    icon: CheckCircleIcon,
    iconClass: "text-emerald-600 bg-emerald-50 border-emerald-100",
    buttonClass: "bg-emerald-600 hover:bg-emerald-700",
  },
  error: {
    icon: XCircleIcon,
    iconClass: "text-rose-600 bg-rose-50 border-rose-100",
    buttonClass: "bg-rose-600 hover:bg-rose-700",
  },
  warning: {
    icon: ExclamationTriangleIcon,
    iconClass: "text-amber-600 bg-amber-50 border-amber-100",
    buttonClass: "bg-amber-600 hover:bg-amber-700",
  },
  info: {
    icon: InformationCircleIcon,
    iconClass: "text-blue-600 bg-blue-50 border-blue-100",
    buttonClass: "bg-blue-600 hover:bg-blue-700",
  },
};

export default function Rapor() {
  const { user: authUser } = useAuth();
  const teacherMode = isTeacherAccount(authUser);
  const [viewMode, setViewMode] = useState("list");
  const [selectedClass, setSelectedClass] = useState(() => teacherMode ? "" : "all");
  const [searchSiswa, setSearchSiswa] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentStudent, setCurrentStudent] = useState(null);
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [allIndicators, setAllIndicators] = useState([]);
  const [reportCurriculum, setReportCurriculum] = useState(null);
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [report, setReport] = useState(null);
  const [statuses, setStatuses] = useState({});
  const [, setLoadingClasses] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingIndicators, setLoadingIndicators] = useState(true);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [loadingReport, setLoadingReport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [listError, setListError] = useState("");
  const [reportError, setReportError] = useState("");
  const [notification, setNotification] = useState(null);
  const [staffMembers, setStaffMembers] = useState([]);
  const [quickPrint, setQuickPrint] = useState(null);
  const [printingStudentId, setPrintingStudentId] = useState(null);
  const [previewContext, setPreviewContext] = useState(null);
  const [_confirmAction, setConfirmAction] = useState(null);
  const [currentUser, setCurrentUser] = useState(() => sessionUser());
  const [currentActor, setCurrentActor] = useState(() => actorLabel(sessionUser()));
  const [schoolProfile, setSchoolProfile] = useState({
    nama_sekolah: "",
    alamat: "",
  });
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = Math.max(1, Math.ceil(students.length / pageSize));
  const pagedStudents = useMemo(() => {
    const start = (page - 1) * pageSize;
    return students.slice(start, start + pageSize);
  }, [page, pageSize, students]);

  const showNotification = useCallback((type, title, message) => {
    setNotification({ type, title, message });
  }, []);

  const currentClassroom = useMemo(
    () =>
      classes.find(
        (classroom) =>
          currentStudent &&
          String(classroom.id) === String(currentStudent.classroom_id)
      ) || null,
    [classes, currentStudent]
  );

  const currentIndicators = useMemo(
    () => allIndicators,
    [allIndicators]
  );

  const groupedIndicators = useMemo(
    () => groupIndicators(currentIndicators),
    [currentIndicators]
  );

  const scoreMap = useMemo(() => scoreMapFrom(report), [report]);

  const currentProgress = useMemo(
    () =>
      progressStatus(
        {
          indicator_ids: (report?.scores || []).map((item) => item.indicator_id),
          has_catatan: Boolean(text(report?.catatan)),
          has_development: Boolean(
            currentStudent && statuses[String(currentStudent.id)]?.hasDevelopment
          ),
          report_status: report?.report_status,
        },
        currentIndicators.map((item) => item.id)
      ),
    [currentIndicators, currentStudent, report, statuses]
  );

  const isCurrentReportReady = currentProgress.complete;
  const isCurrentReportFinal = false;

  const loadClasses = useCallback(async () => {
    setLoadingClasses(true);

    try {
      const items = await fetchKegiatanClassrooms();
      const scope = classroomScopeForUser(authUser, items);
      setClasses(scope.classes);
      setSelectedClass((current) => resolveSelectedClass(current, scope, "all"));
    } catch (error) {
      const message = errorOf(error);
      setClasses([]);
      setListError(message);
      showNotification("error", "Gagal memuat Kelas", message);
    } finally {
      setLoadingClasses(false);
    }
  }, [authUser, showNotification]);

  const loadIndicators = useCallback(async () => {
    setLoadingIndicators(true);

    try {
      const context = await fetchReportCurriculumContext();
      setAllIndicators(context.indicators);
      setReportCurriculum(context.curriculum);
      setCurrentPeriod(context.period);
    } catch (error) {
      const message = errorOf(error);
      setAllIndicators([]);
      setReportCurriculum(null);
      setCurrentPeriod(null);
      showNotification("error", "Gagal memuat Kurikulum Rapor", message);
    } finally {
      setLoadingIndicators(false);
    }
  }, [showNotification]);

  const loadStaffMembers = useCallback(async () => {
    try {
      const items = await fetchStaff();
      setStaffMembers(items);
    } catch (error) {
      setStaffMembers([]);
    }
  }, []);

  const loadCurrentActor = useCallback(async () => {
    const storedUser = sessionUser();

    if (storedUser) {
      setCurrentUser(storedUser);
      setCurrentActor(actorLabel(storedUser));
    }

    try {
      const apiUser = await getMe();
      const mergedUser = {
        ...(storedUser || {}),
        ...(apiUser || {}),
      };
      setCurrentUser(mergedUser);
    } catch (error) {
      if (!storedUser) {
        setCurrentUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const storedUser = currentUser || sessionUser();
    if (!storedUser) return;
    setCurrentActor(resolveActorName(storedUser, staffMembers));
  }, [currentUser, staffMembers]);

  const loadSchoolProfile = useCallback(async () => {
    try {
      const profile = await fetchSchoolProfile();
      setSchoolProfile(profile);
    } catch (error) {
      setSchoolProfile({
        nama_sekolah: "",
        alamat: "",
      });
    }
  }, []);

  const loadStudents = useCallback(async () => {
    if (selectedClass === "") {
      setStudents([]);
      setLoadingStudents(false);
      return;
    }

    setLoadingStudents(true);
    setListError("");

    try {
      const items = await fetchKegiatanStudents({
        classroom_id: selectedClass,
        q: debouncedSearch,
      });
      setStudents(items);
    } catch (error) {
      const message = errorOf(error);
      setStudents([]);
      setListError(message);
      showNotification("error", "Gagal memuat Siswa", message);
    } finally {
      setLoadingStudents(false);
    }
  }, [debouncedSearch, selectedClass, showNotification]);

  const loadStatuses = useCallback(async () => {
    if (students.length === 0 || loadingIndicators || !currentPeriod) {
      setStatuses({});
      return;
    }

    setLoadingStatuses(true);

    try {
      const progressRows = await fetchStudentReportProgressList({
        classroom_id: selectedClass === "all" ? null : selectedClass,
        tahun_ajaran: currentPeriod.tahun_ajaran,
        semester: currentPeriod.semester,
      });
      const progressMap = new Map(
        progressRows.map((progress) => [String(progress.student_id), progress])
      );
      const allowedIds = allIndicators.map((indicator) => indicator.id);

      const entries = students.map((student) => {
        const progress = progressMap.get(String(student.id)) ?? {
          student_id: student.id,
          tahun_ajaran: currentPeriod.tahun_ajaran,
          semester: currentPeriod.semester,
          indicator_ids: [],
          has_catatan: false,
          has_komentar_ortu: false,
          has_development: false,
          report_status: "DRAFT",
          backend_status: "Belum diisi",
          filled_count: 0,
          total_count: allowedIds.length,
        };

        return [String(student.id), progressStatus(progress, allowedIds)];
      });

      setStatuses(Object.fromEntries(entries));
    } catch (error) {
      showNotification("error", "Gagal memuat Status Rapor", errorOf(error));
    } finally {
      setLoadingStatuses(false);
    }
  }, [
    allIndicators,
    currentPeriod,
    loadingIndicators,
    selectedClass,
    showNotification,
    students,
  ]);

  const loadReport = useCallback(async () => {
    if (!currentStudent || !currentPeriod) return;

    setLoadingReport(true);
    setReportError("");

    try {
      const data = await fetchStudentReport({
        student_id: currentStudent.id,
        tahun_ajaran: currentPeriod.tahun_ajaran,
        semester: currentPeriod.semester,
        classroom_id: currentStudent.classroom_id,
      });
      setReport(data);
    } catch (error) {
      const message = errorOf(error);
      setReport(emptyReport(currentStudent.id, currentPeriod));
      setReportError(message);
      showNotification("error", "Gagal memuat Rapor", message);
    } finally {
      setLoadingReport(false);
    }
  }, [currentPeriod, currentStudent, showNotification]);

  useEffect(() => {
    loadClasses();
    loadIndicators();
  }, [loadClasses, loadIndicators]);

  useEffect(() => {
    if (viewMode !== "detail") return;
    loadStaffMembers();
    loadCurrentActor();
    loadSchoolProfile();
  }, [
    loadCurrentActor,
    loadSchoolProfile,
    loadStaffMembers,
    viewMode,
  ]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedSearch(searchSiswa.trim());
    }, 250);

    return () => window.clearTimeout(timer);
  }, [searchSiswa]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedClass]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    if (viewMode === "list") loadStudents();
  }, [loadStudents, viewMode]);

  useEffect(() => {
    if (viewMode === "list") loadStatuses();
  }, [loadStatuses, viewMode]);

  useEffect(() => {
    if (viewMode === "detail") loadReport();
  }, [loadReport, viewMode]);

  const handleOpenDetail = (student) => {
    if (!currentPeriod) {
      showNotification(
        "warning",
        "Periode Akademik Belum Tersedia",
        "Periode akademik aktif belum berhasil dimuat."
      );
      return;
    }

    setCurrentStudent(student);
    setReport(emptyReport(student.id, currentPeriod));
    setReportError("");
    setViewMode("detail");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleBack = () => {
    if (saving) return;
    setViewMode("list");
    setCurrentStudent(null);
    setReport(null);
    setReportError("");
  };

  const updateNilai = (indicatorId, scale) => {
    setReport((current) => {
      if (!current || current.report_status === "FINAL") return current;

      const nextScores = current.scores.filter(
        (item) => String(item.indicator_id) !== String(indicatorId)
      );
      nextScores.push({ indicator_id: indicatorId, scale });

      return { ...current, scores: nextScores };
    });
  };

  const updateField = (field, value) => {
    setReport((current) =>
      current && current.report_status !== "FINAL"
        ? { ...current, [field]: value }
        : current
    );
  };

  const filteredCurrentScores = useCallback(
    (sourceReport) => {
      const allowedIds = new Set(
        currentIndicators.map((item) => String(item.id))
      );

      return (sourceReport?.scores || []).filter((score) =>
        allowedIds.has(String(score.indicator_id))
      );
    },
    [currentIndicators]
  );

  const validateDraf = useCallback(
    (sourceReport, requireComplete = false) => {
      if (!reportCurriculum) {
        showNotification(
          "warning",
          "Kurikulum Belum Dipilih",
          "Belum ada kurikulum aktif untuk periode akademik ini. Tetapkan kurikulum di Administrasi → Kurikulum."
        );
        return null;
      }

      if (currentIndicators.length === 0) {
        showNotification(
          "warning",
          "Indikator Kurikulum Kosong",
          `Kurikulum ${reportCurriculum.nama_kurikulum} belum memiliki indikator aktif.`
        );
        return null;
      }

      const scores = filteredCurrentScores(sourceReport);

      if (scores.length === 0) {
        showNotification(
          "warning",
          "Penilaian Belum diisi",
          "Isi minimal satu penilaian indikator sebelum menyimpan rapor."
        );
        return null;
      }

      if (requireComplete) {
        const developmentReady = Boolean(
          currentStudent && statuses[String(currentStudent.id)]?.hasDevelopment
        );
        const missing = [];
        if (scores.length < currentIndicators.length) {
          missing.push(`Indikator ${scores.length}/${currentIndicators.length}`);
        }
        if (!text(sourceReport?.catatan)) missing.push("Catatan Guru");
        if (!developmentReady) missing.push("Perkembangan");

        if (missing.length > 0) {
          showNotification(
            "warning",
            "Rapor Belum Lengkap",
            `Finalisasi belum dapat dilakukan. Lengkapi: ${missing.join(", ")}.`
          );
          return null;
        }
      }

      return scores;
    },
    [
      reportCurriculum,
      currentIndicators,
      filteredCurrentScores,
      currentStudent,
      statuses,
      showNotification,
    ]
  );

  const updateCurrentStatus = useCallback(
    (saved) => {
      if (!currentStudent) return;

      const studentKey = String(currentStudent.id);
      setStatuses((current) => {
        const status = progressStatus(
          {
            indicator_ids: saved.scores.map((item) => item.indicator_id),
            has_catatan: Boolean(text(saved.catatan)),
            has_development: Boolean(current[studentKey]?.hasDevelopment),
            report_status: saved.report_status,
          },
          currentIndicators.map((item) => item.id)
        );

        return {
          ...current,
          [studentKey]: status,
        };
      });
    },
    [currentIndicators, currentStudent]
  );

  const handleSave = async () => {
    if (!currentStudent || !report || saving) return;

    if (report.report_status === "FINAL") {
      showNotification(
        "warning",
        "Rapor Sudah Final",
        "Buka kembali rapor terlebih dahulu sebelum melakukan perubahan."
      );
      return;
    }

    const filteredScores = validateDraf(report);
    if (!filteredScores) return;

    setSaving(true);

    try {
      const saved = await saveStudentReport(
        {
          ...report,
          komentar_ortu: report.komentar_ortu || "",
          scores: filteredScores,
        },
        currentActor
      );

      setReport((current) => ({
        ...current,
        ...saved,
        fisik: saved.fisik ?? current?.fisik ?? report.fisik,
        absensi: saved.absensi ?? current?.absensi ?? report.absensi,
        komentar_ortu: saved.komentar_ortu ?? current?.komentar_ortu ?? report.komentar_ortu ?? "",
      }));
      updateCurrentStatus(saved);

      showNotification(
        "success",
        "Rapor Berhasil Disimpan",
        `Rapor ${currentStudent.nama_lengkap} berhasil disimpan dan diverifikasi oleh sistem.`
      );
    } catch (error) {
      showNotification(
        "error",
        "Gagal Menyimpan Rapor",
        errorOf(error)
      );
    } finally {
      setSaving(false);
    }
  };

  const _handleFinalize = async () => {
    if (!currentStudent || !report || saving) return;

    const filteredScores = validateDraf(report, true);
    if (!filteredScores) return;

    setSaving(true);

    try {
      await saveStudentReport(
        {
          ...report,
          komentar_ortu: report.komentar_ortu || "",
          scores: filteredScores,
        },
        currentActor
      );

      const finalized = await finalizeStudentReport({
        student_id: currentStudent.id,
        tahun_ajaran: currentPeriod.tahun_ajaran,
        semester: currentPeriod.semester,
        actor: currentActor,
      });

      setReport((current) => ({
        ...current,
        ...finalized,
        fisik: finalized.fisik ?? current?.fisik ?? report.fisik,
        absensi: finalized.absensi ?? current?.absensi ?? report.absensi,
        komentar_ortu: finalized.komentar_ortu ?? current?.komentar_ortu ?? report.komentar_ortu ?? "",
      }));
      updateCurrentStatus(finalized);

      showNotification(
        "success",
        "Rapor Berhasil Difinalisasi",
        `Rapor ${currentStudent.nama_lengkap} sekarang berstatus Final dan terkunci dari perubahan.`
      );
    } catch (error) {
      showNotification(
        "error",
        "Gagal Finalisasi Rapor",
        errorOf(error)
      );
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const _handleReopen = async () => {
    if (!currentStudent || !report || saving) return;

    setSaving(true);

    try {
      const reopened = await reopenStudentReport({
        student_id: currentStudent.id,
        tahun_ajaran: currentPeriod.tahun_ajaran,
        semester: currentPeriod.semester,
        actor: currentActor,
      });

      setReport((current) => ({
        ...current,
        ...reopened,
        fisik: reopened.fisik ?? current?.fisik ?? report.fisik,
        absensi: reopened.absensi ?? current?.absensi ?? report.absensi,
        komentar_ortu: reopened.komentar_ortu ?? current?.komentar_ortu ?? report.komentar_ortu ?? "",
      }));
      updateCurrentStatus(reopened);

      showNotification(
        "success",
        "Rapor Dibuka Kembali",
        `Rapor ${currentStudent.nama_lengkap} kembali menjadi Draf dan dapat diedit.`
      );
    } catch (error) {
      showNotification(
        "error",
        "Gagal membuka Rapor",
        errorOf(error)
      );
    } finally {
      setSaving(false);
      setConfirmAction(null);
    }
  };

  const printContextFor = useCallback(
    ({
      student,
      reportData,
      indicators,
      classroom,
      period,
    }) => {
      const now = new Date();
      const sanitizedReport = {
        ...reportData,
        komentar_ortu: reportData?.komentar_ortu || "",
      };
      const printCurriculum =
        ((sanitizedReport?.curriculum_id !== null &&
          sanitizedReport?.curriculum_id !== undefined) ||
          Boolean(text(sanitizedReport?.curriculum_nama)))
          ? {
              ...(reportCurriculum || {}),
              id:
                sanitizedReport.curriculum_id ??
                reportCurriculum?.id ??
                null,
              nama_kurikulum:
                text(sanitizedReport.curriculum_nama) ||
                text(reportCurriculum?.nama_kurikulum),
              tahun_ajaran:
                text(sanitizedReport.tahun_ajaran) ||
                text(reportCurriculum?.tahun_ajaran),
            }
          : reportCurriculum || null;
      const printClassroom = {
        ...(classroom || {}),
        id:
          sanitizedReport?.classroom_id ??
          classroom?.id ??
          student?.classroom_id ??
          null,
        nama_kelas:
          text(sanitizedReport?.classroom_nama) ||
          text(classroom?.nama_kelas),
        curriculum:
          printCurriculum ||
          classroom?.curriculum ||
          null,
      };

      return {
        student: buildPrintStudent(student, sanitizedReport),
        data: buildPrintData(sanitizedReport, indicators, period),
        report: sanitizedReport,
        indicators,
        curriculum: printCurriculum,
        classroom: printClassroom,
        period,
        headmaster: resolveHeadmasterForPeriod(staffMembers, period),
        homeroomTeacher: resolveHomeroomTeacher(printClassroom, staffMembers),
        printedAt: now,
        schoolProfile,
      };
    },
    [reportCurriculum, schoolProfile, staffMembers]
  );

  const queuePrint = useCallback((context) => {
    setQuickPrint(context);

    const clearQuickPrint = () => {
      setQuickPrint(null);
    };

    window.addEventListener("afterprint", clearQuickPrint, { once: true });

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print();
      });
    });
  }, []);

  const openPreviewForStudent = useCallback(
    async (student) => {
      if (!student || printingStudentId !== null) return;

      const classroom =
        classes.find(
          (item) => String(item.id) === String(student.classroom_id)
        ) || null;
      const period = currentPeriod;
      const indicators = currentIndicators;

      if (!period || !reportCurriculum) {
        showNotification(
          "warning",
          "Kurikulum Belum Dipilih",
          "Kurikulum aktif Administrasi atau periode akademik belum tersedia sehingga rapor belum dapat dipreview."
        );
        return;
      }

      if (indicators.length === 0) {
        showNotification(
          "warning",
          "Indikator Kurikulum Kosong",
          "Kurikulum aktif Administrasi belum memiliki indikator aktif."
        );
        return;
      }

      setPrintingStudentId(String(student.id));

      try {
        const reportData = await fetchStudentReport({
          student_id: student.id,
          tahun_ajaran: period.tahun_ajaran,
          semester: period.semester,
          classroom_id: student.classroom_id,
        });

        const completion = progressStatus(
          {
            indicator_ids: reportData.scores.map((item) => item.indicator_id),
            has_catatan: Boolean(text(reportData.catatan)),
            has_development: Boolean(statuses[String(student.id)]?.hasDevelopment),
            report_status: reportData.report_status,
          },
          indicators.map((item) => item.id)
        );

        setStatuses((current) => ({
          ...current,
          [String(student.id)]: completion,
        }));

        if (!completion.complete) {
          showNotification(
            "warning",
            "Rapor Belum Lengkap",
            `Masih belum lengkap: ${completion.missing.join(", ") || "data rapor"}.`
          );
          return;
        }

        const context = printContextFor({
          student,
          reportData,
          indicators,
          classroom,
          period,
        });

        setPreviewContext(context);
      } catch (error) {
        showNotification(
          "error",
          "Gagal Menyiapkan Preview Rapor",
          errorOf(error)
        );
      } finally {
        setPrintingStudentId(null);
      }
    },
    [
      classes,
      currentIndicators,
      currentPeriod,
      printContextFor,
      printingStudentId,
      reportCurriculum,
      showNotification,
    ]
  );

  const handlePrint = async () => {
    if (
      !report ||
      !currentStudent ||
      !currentPeriod
    ) {
      showNotification(
        "warning",
        "Rapor Belum Siap",
        "Data rapor atau periode akademik aktif belum selesai dimuat."
      );
      return;
    }

    if (!isCurrentReportReady) {
      showNotification(
        "warning",
        "Rapor Belum Siap Dicetak",
        `Masih belum lengkap: ${currentProgress.missing.join(", ") || "data rapor"}.`
      );
      return;
    }

    setPrintingStudentId(
      String(currentStudent.id)
    );

    try {
      const freshReport =
        await fetchStudentReport({
          student_id:
            currentStudent.id,
          tahun_ajaran:
            currentPeriod.tahun_ajaran,
          semester:
            currentPeriod.semester,
          classroom_id:
            currentStudent.classroom_id,
        });

      const completion =
        progressStatus(
          {
            indicator_ids:
              freshReport.scores.map(
                (item) =>
                  item.indicator_id
              ),
            has_catatan:
              Boolean(
                text(
                  freshReport.catatan
                )
              ),
            has_development: Boolean(
              statuses[String(currentStudent.id)]?.hasDevelopment
            ),
            report_status:
              freshReport.report_status,
          },
          currentIndicators.map(
            (item) => item.id
          )
        );

      if (!completion.complete) {
        showNotification(
          "warning",
          "Rapor Belum Siap Dicetak",
          `Masih belum lengkap: ${completion.missing.join(", ") || "data rapor"}.`
        );
        return;
      }

      setReport(freshReport);

      const context =
        printContextFor({
          student:
            currentStudent,
          reportData:
            freshReport,
          indicators:
            currentIndicators,
          classroom:
            currentClassroom,
          period:
            currentPeriod,
        });

      setPreviewContext(
        context
      );
    } catch (error) {
      showNotification(
        "error",
        "Rapor Tidak Dapat Dicetak",
        errorOf(error)
      );
    } finally {
      setPrintingStudentId(
        null
      );
    }
  };

  const handlePreviewPrint = () => {
    if (!previewContext) return;
    queuePrint({
      ...previewContext,
      printedAt: new Date(),
    });
  };

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <style>{`
        @media print {
          body > * { display: none !important; }
          #print-root { display: block !important; position: absolute; top: 0; left: 0; width: 100%; height: auto; z-index: 9999; background: white; }
        }
      `}</style>

      {viewMode === "list" && (
        <>
          <SectionHeader icon={DocumentTextIcon} title="Rapor Siswa" description="Penilaian perkembangan siswa berdasarkan kurikulum dan periode akademik aktif." actions={<button type="button" onClick={()=>setFiltersOpen(value=>!value)} className={`ui-toolbar-button ${filtersOpen?"is-active":""}`}><FunnelIcon className="h-4 w-4"/>Filter</button>}/>
          {filtersOpen&&<div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between">
            <select value={selectedClass} onChange={event=>setSelectedClass(event.target.value)} disabled={teacherMode&&classes.length<=1} className="ui-compact-control min-w-40 disabled:cursor-not-allowed disabled:bg-slate-100">{!teacherMode&&<option value="all">Semua Kelas</option>}{teacherMode&&classes.length===0&&<option value="">Belum ada kelas yang ditugaskan</option>}{classes.map(classroom=><option key={classroom.id} value={classroom.id}>{classroom.nama_kelas}</option>)}</select>
            <div className="relative w-full xl:w-64"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input type="text" placeholder="Cari nama siswa..." value={searchSiswa} onChange={event=>setSearchSiswa(event.target.value)} className="ui-compact-control w-full pl-9"/></div>
          </div>}

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
                    <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-44">Kurikulum</th>
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-48">Status Rapor</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-52">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingStudents ? (
                    <tr><td colSpan="9" className="py-14 text-center text-slate-400"><span className="inline-flex items-center gap-2 text-sm"><ArrowPathIcon className="h-4 w-4 animate-spin"/>Memuat siswa...</span></td></tr>
                  ) : listError ? (
                    <tr><td colSpan="9" className="py-14 text-center"><p className="text-sm text-rose-500">{listError}</p><button type="button" onClick={loadStudents} className="mt-3 text-xs font-semibold text-[#e94640]">Muat ulang</button></td></tr>
                  ) : pagedStudents.length ? (
                    pagedStudents.map((student, index) => {
                      const status = statuses[String(student.id)] || { status: "Belum diisi", filled: 0, total: currentIndicators.length };
                      const meta = studentClassroomMeta(classes, student);
                      return (
                        <tr key={student.id} className="group transition-colors hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-center text-sm font-mono text-slate-500">{(page - 1) * pageSize + index + 1}</td>
                          <td className="px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#e94640]">{student.nama_lengkap || "-"}</td>
                          <td className="px-3 py-2.5 text-sm font-mono text-slate-500 whitespace-nowrap">{student.nomor_induk || student.nisn || "-"}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">{studentGenderLabel(student.jenis_kelamin)}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.classroomName}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.homeroomTeacherName}</td>
                          <td className="px-3 py-2.5">{reportCurriculum ? <div><div className="text-sm font-medium text-slate-700">{reportCurriculum.nama_kurikulum}</div><div className="mt-0.5 text-[11px] text-slate-400">{reportCurriculum.tahun_ajaran || "-"}</div></div> : <span className="text-xs font-medium text-rose-500">Belum dipilih</span>}</td>
                          <td className="px-3 py-2.5 text-center">{loadingStatuses ? <ArrowPathIcon className="mx-auto h-4 w-4 animate-spin text-slate-300"/> : <StatusBadge progress={status}/>}</td>
                          <td className="px-3 py-2.5 text-right">
                            {status.status === "Final" ? (
                              <div className="inline-flex items-center justify-end gap-2">
                                <button type="button" onClick={() => openPreviewForStudent(student)} disabled={printingStudentId !== null} className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-slate-800 px-3 text-[10px] font-semibold text-white hover:bg-slate-700 disabled:opacity-50">{printingStudentId === String(student.id) ? <ArrowPathIcon className="h-4 w-4 shrink-0 animate-spin"/> : <EyeIcon className="h-4 w-4 shrink-0"/>}{printingStudentId === String(student.id) ? "Menyiapkan..." : "Preview / Cetak"}</button>
                                <button type="button" onClick={() => handleOpenDetail(student)} disabled={printingStudentId !== null} className="ui-action-button whitespace-nowrap disabled:opacity-50"><DocumentTextIcon className="h-4 w-4 shrink-0"/>Lihat</button>
                              </div>
                            ) : (
                              <button type="button" onClick={() => handleOpenDetail(student)} className="ui-action-button whitespace-nowrap"><DocumentTextIcon className="h-4 w-4 shrink-0"/>{status.status === "Belum diisi" ? "Isi Rapor" : "Edit Rapor"}</button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="9" className="py-14 text-center text-slate-400"><FunnelIcon className="mx-auto mb-3 h-10 w-10 opacity-20"/><span className="text-sm">Tidak ada siswa ditemukan.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={students.length} itemsPerPage={pageSize} onPageChange={setPage} onLimitChange={(value) => { setPageSize(value); setPage(1); }} limitOptions={[10, 20, 50, 100]} className="!px-3 !py-2.5"/>
          </div>
        </>
      )}

      {viewMode === "detail" && currentStudent && (
        <div className="animate-in fade-in zoom-in-95 duration-200 space-y-6">
          <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4 w-full lg:w-auto">
              <button
                type="button"
                onClick={handleBack}
                disabled={saving}
                className="rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50"
                title="Kembali"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h2 className="text-lg font-bold text-slate-800">{currentStudent.nama_lengkap}</h2>
                <div className="flex flex-wrap items-center gap-2 mt-0.5">
                  <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {currentStudent.nomor_induk || currentStudent.nisn || "-"}
                  </span>
                  <span className="text-xs text-[#e94640] font-bold uppercase tracking-wide">{currentPeriod.semester_label}</span>
                  <span className="text-xs text-slate-400">{currentPeriod.tahun_ajaran}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 justify-end w-full lg:w-auto">
              {reportCurriculum ? (
                <div className="flex bg-violet-50 px-4 py-2 rounded-xl text-violet-700 font-bold text-sm items-center gap-2 border border-violet-100">
                  <AcademicCapIcon className="h-5 w-5" />
                  {reportCurriculum.nama_kurikulum}
                </div>
              ) : (
                <div className="flex bg-rose-50 px-4 py-2 rounded-xl text-rose-700 font-bold text-sm items-center gap-2 border border-rose-100">
                  <ExclamationTriangleIcon className="h-5 w-5" /> Kurikulum Aktif Belum Tersedia
                </div>
              )}
            </div>
          </div>

          {!loadingReport && report && (
            <div
              className={`rounded-xl border px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                isCurrentReportReady
                  ? "bg-emerald-50 border-emerald-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <ClockIcon
                  className={`h-5 w-5 mt-0.5 shrink-0 ${
                    isCurrentReportReady ? "text-emerald-600" : "text-amber-600"
                  }`}
                />
                <div>
                  <div className="text-sm font-bold text-slate-800">
                    {isCurrentReportReady ? "Rapor Sudah Diisi" : "Proses Pengisian Rapor"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {isCurrentReportReady
                      ? "Semua indikator dan Catatan Guru sudah lengkap. Data tetap dapat diperbarui melalui Simpan Rapor."
                      : `Progress penilaian ${currentProgress.filled}/${currentProgress.total}. Lengkapi indikator dan Catatan Guru lalu simpan.`}
                  </p>
                </div>
              </div>
              <StatusBadge progress={currentProgress} />
            </div>
          )}

          {loadingReport ? (
            <div className="min-h-90 flex items-center justify-center text-slate-400 border border-slate-200 rounded-xl">
              <span className="inline-flex items-center gap-2 text-sm">
                <ArrowPathIcon className="h-4 w-4 animate-spin" /> Memuat rapor...
              </span>
            </div>
          ) : reportError ? (
            <div className="min-h-90 flex flex-col items-center justify-center text-center border border-rose-100 bg-rose-50 rounded-xl p-6">
              <p className="text-sm text-rose-600">{reportError}</p>
              <button type="button" onClick={loadReport} className="mt-3 text-xs font-semibold text-[#e94640]">
                Muat ulang
              </button>
            </div>
          ) : report ? (
            <>
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Penilaian Kurikulum</h3>
                    <p className="text-xs text-slate-500">Aspek → Subaspek → Indikator mengikuti kurikulum aktif yang ditetapkan di Administrasi → Kurikulum.</p>
                  </div>
                  {reportCurriculum && (
                    <span className="text-xs font-semibold text-violet-600">
                      {currentIndicators.length} indikator terpilih
                    </span>
                  )}
                </div>

                {loadingIndicators ? (
                  <div className="py-16 text-center text-slate-400">
                    <ArrowPathIcon className="h-5 w-5 animate-spin mx-auto" />
                  </div>
                ) : !reportCurriculum ? (
                  <EmptyIndicatorState text="Tetapkan kurikulum untuk periode aktif di Administrasi → Kurikulum terlebih dahulu." />
                ) : currentIndicators.length === 0 ? (
                  <EmptyIndicatorState text="Kurikulum aktif belum memiliki indikator terpilih." />
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 border-collapse">
                      <thead className="bg-slate-100 text-xs font-bold text-slate-600 uppercase">
                        <tr>
                          <th className="px-6 py-4 text-left border-r border-slate-200 w-[60%]">Aspek / Subaspek / Indikator</th>
                          <th className="px-2 py-2 text-center w-[40%] bg-violet-50 text-violet-700">
                            Pencapaian
                            <div className="grid grid-cols-4 mt-1 text-[10px] text-violet-400/80">
                              {SCALES.map((scale) => <span key={scale}>{scale}</span>)}
                            </div>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {groupedIndicators.map((aspect) => (
                          <Fragment key={aspect.aspect}>
                            <tr className="bg-slate-100/80">
                              <td colSpan="2" className="px-6 py-3 font-bold text-slate-800 uppercase border-b border-slate-200">
                                {aspect.aspect}
                              </td>
                            </tr>
                            {aspect.sub_aspects.map((subAspect) => (
                              <Fragment key={`${aspect.aspect}-${subAspect.name}`}>
                                <tr className="bg-violet-50/40">
                                  <td colSpan="2" className="px-8 py-2.5 text-xs font-bold text-violet-700 border-b border-violet-100">
                                    {subAspect.name}
                                  </td>
                                </tr>
                                {subAspect.items.map((indicator) => (
                                  <tr key={indicator.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-10 py-3 border-r border-slate-100 text-slate-600">
                                      <div className="font-medium">{indicator.deskripsi}</div>
                                      {indicator.kode && (
                                        <div className="text-[10px] font-mono text-slate-400 mt-1">{indicator.kode}</div>
                                      )}
                                    </td>
                                    <td className="px-2 py-3">
                                      <div className="grid grid-cols-4 place-items-center">
                                        {SCALES.map((scale) => (
                                          <label key={scale} className="cursor-pointer flex items-center justify-center w-full h-full py-2 hover:bg-violet-50 rounded">
                                            <input
                                              type="radio"
                                              name={`indicator-${indicator.id}`}
                                              checked={scoreMap.get(String(indicator.id)) === scale}
                                              onChange={() => updateNilai(indicator.id, scale)}
                                              disabled={isCurrentReportFinal}
                                              className="w-4 h-4 text-[#e94640] border-slate-300 focus:ring-[#e94640] cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                                            />
                                          </label>
                                        ))}
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </Fragment>
                            ))}
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden flex flex-col">
                  <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50">
                    <h4 className="text-sm font-bold text-slate-800 uppercase">Catatan Guru</h4>
                  </div>
                  <div className="p-4 flex-1">
                    <textarea
                      value={report.catatan}
                      onChange={(event) => updateField("catatan", event.target.value)}
                      readOnly={isCurrentReportFinal}
                      className="w-full h-full min-h-[180px] border border-slate-200 rounded-lg p-3 text-sm outline-none resize-none focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640]/20 transition-all placeholder-slate-300 read-only:bg-slate-50 read-only:text-slate-500"
                      placeholder="Tulis deskripsi capaian dan saran perkembangan anak di sini..."
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <ReadOnlyPhysical
                    physical={report.fisik}
                    period={currentPeriod}
                  />
                  <ReadOnlyAttendance
                    attendance={report.absensi}
                    period={currentPeriod}
                  />
                </div>
              </div>


              <div className="flex flex-col-reverse md:flex-row justify-end gap-3 pb-10 border-t border-slate-200 pt-6">
                <button
                  type="button"
                  onClick={handleBack}
                  disabled={saving}
                  className="ui-toolbar-button disabled:opacity-50"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="ui-toolbar-button disabled:opacity-50"
                >
                  {saving ? (
                    <ArrowPathIcon className="h-5 w-5 animate-spin" />
                  ) : (
                    <ArrowDownTrayIcon className="h-5 w-5" />
                  )}
                  {saving ? "Menyimpan..." : "Simpan Rapor"}
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  disabled={saving || !isCurrentReportReady}
                  title={
                    isCurrentReportReady
                      ? "Preview dan cetak rapor"
                      : `Masih belum lengkap: ${currentProgress.missing.join(", ") || "data rapor"}`
                  }
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <EyeIcon className="h-5 w-5" />
                  {isCurrentReportReady
                    ? "Preview / Cetak"
                    : `Belum Lengkap ${currentProgress.filled}/${currentProgress.total}`}
                </button>
              </div>
            </>
          ) : null}

        </div>
      )}

      {typeof document !== "undefined" && quickPrint &&
        createPortal(
          <div id="print-root" style={{ display: "none" }}>
            <RaporPrintTemplate
              student={quickPrint.student}
              data={quickPrint.data}
              report={quickPrint.report}
              indicators={quickPrint.indicators}
              curriculum={quickPrint.curriculum}
              classroom={quickPrint.classroom}
              period={quickPrint.period}
              headmaster={quickPrint.headmaster}
              homeroomTeacher={quickPrint.homeroomTeacher}
              printedAt={quickPrint.printedAt}
              schoolProfile={quickPrint.schoolProfile}
            />
          </div>,
          document.body
        )}

      {previewContext && (
        <PrintPreviewModal
          context={previewContext}
          onClose={() => setPreviewContext(null)}
          onPrint={handlePreviewPrint}
        />
      )}


      <NotificationPopup notification={notification} onClose={() => setNotification(null)} />
    </div>
  );
}

function PrintPreviewModal({
  context,
  onClose,
  onPrint,
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-[90] bg-slate-900/60 backdrop-blur-sm flex flex-col">
      <div className="bg-white border-b border-slate-200 px-4 md:px-6 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-bold text-slate-800">
            Preview Rapor
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Periksa dokumen sebelum membuka dialog cetak browser.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="px-4 py-2 rounded-lg bg-slate-800 text-white text-sm font-semibold hover:bg-slate-700 inline-flex items-center gap-2"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-8">
        <div className="mx-auto bg-white shadow-2xl w-[210mm] min-h-[297mm]">
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
        </div>
      </div>
    </div>,
    document.body
  );
}

function HistoryPopup({
  history,
  onClose,
}) {
  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKey = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  const items = [...(history || [])].reverse();

  return createPortal(
    <div className="fixed inset-0 z-100 flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[2px]">
      <div className="flex max-h-[80vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-500">
                <ClockIcon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Riwayat Perubahan Rapor
                </h3>
                <p className="mt-0.5 text-xs text-slate-500">
                  {items.length} aktivitas tersimpan
                </p>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
            title="Tutup"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {items.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {items.map((item, index) => (
                <div
                  key={`${item.action}-${item.at}-${index}`}
                  className="flex flex-col gap-2 px-6 py-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-700">
                      {historyLabel(item.action)}
                    </div>
                    <div className="mt-1 text-xs text-slate-400">
                      oleh {item.by || "-"}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-medium text-slate-500">
                    {dateTimeLabel(item.at)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-6 py-12 text-center">
              <ClockIcon className="mx-auto h-9 w-9 text-slate-300" />
              <p className="mt-3 text-sm font-medium text-slate-500">
                Belum ada riwayat perubahan
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Riwayat akan muncul setelah Draf pertama disimpan.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end border-t border-slate-100 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-slate-800 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

function ConfirmLifecyclePopup({
  action,
  loading,
  onCancel,
  onConfirm,
}) {
  const isFinalize = action === "FINALIZE";

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/35 backdrop-blur-[2px]">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div
              className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${
                isFinalize
                  ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                  : "bg-amber-50 text-amber-600 border-amber-100"
              }`}
            >
              {isFinalize ? (
                <LockClosedIcon className="h-6 w-6" />
              ) : (
                <LockOpenIcon className="h-6 w-6" />
              )}
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">
                {isFinalize ? "Finalisasi Rapor?" : "Buka Kembali Rapor?"}
              </h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {isFinalize
                  ? "Setelah Final, data rapor akan dikunci. Perubahan hanya dapat dilakukan setelah rapor dibuka kembali."
                  : "Rapor akan kembali menjadi Draf sehingga nilai dan Catatan Guru dapat diedit lagi."}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-2 rounded-lg text-sm font-semibold text-white inline-flex items-center gap-2 disabled:opacity-50 ${
              isFinalize
                ? "bg-emerald-600 hover:bg-emerald-700"
                : "bg-amber-600 hover:bg-amber-700"
            }`}
          >
            {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {isFinalize ? "Ya, Finalisasi" : "Ya, Buka Kembali"}
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ progress }) {
  const missingText = (progress?.missing || []).join(" · ");

  if (progress.status === "Final") {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
        <LockClosedIcon className="h-3.5 w-3.5" /> Final
      </span>
    );
  }

  if (progress.status === "Lengkap" || progress.status === "Siap Finalisasi") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircleIcon className="h-3.5 w-3.5" /> Lengkap
        </span>
        <span className="text-[10px] font-medium text-emerald-600">Semua data tersedia</span>
      </div>
    );
  }

  if (progress.status === "Belum Lengkap" || progress.status === "Draf") {
    return (
      <div className="flex flex-col items-center gap-1">
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
          <ClockIcon className="h-3.5 w-3.5" /> Belum Lengkap
        </span>
        {missingText && (
          <span title={missingText} className="max-w-48 whitespace-normal text-center text-[10px] leading-4 text-amber-600">
            {missingText}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-50 text-slate-500 border border-slate-200">
        <ExclamationCircleIcon className="h-3.5 w-3.5" /> Belum diisi
      </span>
      {missingText && (
        <span title={missingText} className="max-w-48 whitespace-normal text-center text-[10px] leading-4 text-slate-400">
          {missingText}
        </span>
      )}
    </div>
  );
}


function EmptyIndicatorState({ text: message }) {
  return (
    <div className="py-16 text-center text-slate-400">
      <ExclamationCircleIcon className="h-10 w-10 mx-auto mb-3 opacity-30" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ReadOnlyPhysical({
  physical,
  period,
}) {
  const hasData = physical.berat_badan !== null || physical.tinggi_badan !== null;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
        <h4 className="text-sm font-bold text-slate-800 uppercase">Data Fisik</h4>
        <div className="text-right">
          <span className="block text-[10px] font-semibold text-emerald-600 uppercase">
            Data diambil dari Perkembangan
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            {period.semester_label} • {period.tahun_ajaran}
          </span>
        </div>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4">
        <ReadOnlyValue label="Berat Badan (kg)" value={physical.berat_badan ?? "-"} />
        <ReadOnlyValue label="Tinggi Badan (cm)" value={physical.tinggi_badan ?? "-"} />
      </div>
      {!hasData && (
        <div className="px-6 pb-5 text-xs text-amber-600">Belum ada data fisik pada Perkembangan untuk semester ini.</div>
      )}
    </div>
  );
}

function ReadOnlyAttendance({
  attendance,
  period,
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center gap-3">
        <h4 className="text-sm font-bold text-slate-800 uppercase">Kehadiran (Hari)</h4>
        <div className="text-right">
          <span className="block text-[10px] font-semibold text-blue-600 uppercase">
            Data diambil dari Rekap Presensi
          </span>
          <span className="block text-[10px] text-slate-400 mt-0.5">
            {period.semester_label} • {period.tahun_ajaran}
          </span>
        </div>
      </div>
      <div className="p-6 grid grid-cols-3 gap-4">
        <ReadOnlyValue label="Sakit" value={attendance.sakit ?? 0} centered />
        <ReadOnlyValue label="Izin" value={attendance.izin ?? 0} centered />
        <ReadOnlyValue label="Alfa" value={attendance.alpa ?? 0} centered />
      </div>
    </div>
  );
}

function ReadOnlyValue({ label, value, centered = false }) {
  return (
    <div>
      <label className={`text-xs text-slate-500 block mb-1.5 ${centered ? "text-center" : "font-bold ml-1"}`}>{label}</label>
      <div className={`w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm bg-slate-50 text-slate-700 font-semibold ${centered ? "text-center" : ""}`}>
        {value}
      </div>
    </div>
  );
}

function NotificationPopup({ notification, onClose }) {
  if (!notification) return null;

  const config = notificationConfig[notification.type] || notificationConfig.info;
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-11 h-11 rounded-xl border flex items-center justify-center shrink-0 ${config.iconClass}`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-bold text-slate-900">{notification.title}</h3>
              <p className="text-sm text-slate-500 mt-1 leading-relaxed wrap-break-word">{notification.message}</p>
            </div>
            <button type="button" onClick={onClose} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Tutup">
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button type="button" onClick={onClose} className={`px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${config.buttonClass}`}>
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
