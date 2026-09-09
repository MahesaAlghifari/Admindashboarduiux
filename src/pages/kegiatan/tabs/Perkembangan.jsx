import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownTrayIcon,
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  UserIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  fetchKegiatanStudents,
  fetchStudentDevelopments,
  fetchStudentDevelopmentsList,
  saveStudentDevelopment,
} from "../../../api/kegiatan";
import {SectionHeader} from "../../../components/common/DesignSystem";
import Pagination from "../../../components/common/Pagination";
import {apiErrorMessage} from "../../../lib/apiError";
import { useAuth } from "../../../auth/useAuth";
import { classroomScopeForUser, isTeacherAccount, resolveSelectedClass } from "../classroomScope";
import { studentClassroomMeta, studentGenderLabel } from "../tableUtils";
import {
  academicYearStart,
  fallbackAcademicYear,
} from "../../../lib/academicYear";

const text = (value) =>
  String(value ?? "").trim();

const errorOf=error=>apiErrorMessage(error,{action:"memproses",subject:"data kegiatan"});

const semesterDefinitions = (
  academicYear
) => {
  const startYear =
    Number(
      String(
        academicYear
      ).split("/")[0]
    ) ||
    academicYearStart(fallbackAcademicYear());

  return [
    {
      id: 1,
      label: "Semester Ganjil",
      sub: `Juli - Desember ${startYear}`,
    },
    {
      id: 2,
      label: "Semester Genap",
      sub: `Januari - Juni ${startYear + 1}`,
    },
  ];
};

const numberOrNull = (value) => {
  if (
    value === "" ||
    value === null ||
    value === undefined
  ) {
    return null;
  }

  const parsed = Number(value);

  return Number.isFinite(parsed)
    ? parsed
    : null;
};

const calculateBMI = (
  height,
  weight
) => {
  const tb =
    numberOrNull(height);
  const bb =
    numberOrNull(weight);

  if (
    tb === null ||
    bb === null ||
    tb <= 0 ||
    bb <= 0
  ) {
    return null;
  }

  const heightInMeters =
    tb / 100;

  return Number(
    (
      bb /
      (heightInMeters *
        heightInMeters)
    ).toFixed(1)
  );
};

const getBMIStatus = (
  bmi,
  gender
) => {
  if (bmi === null) {
    return "";
  }

  const isMale =
    text(gender)
      .toLowerCase()
      .includes("laki");

  if (isMale) {
    if (bmi < 17) {
      return "Kurus";
    }

    if (bmi <= 23) {
      return "Normal";
    }

    if (bmi <= 27) {
      return "Gemuk";
    }

    return "Obesitas";
  }

  if (bmi < 18) {
    return "Kurus";
  }

  if (bmi <= 25) {
    return "Normal";
  }

  if (bmi <= 27) {
    return "Gemuk";
  }

  return "Obesitas";
};

const statusClass = (status) => {
  if (status === "Normal") {
    return "text-emerald-600";
  }

  if (status === "Kurus") {
    return "text-amber-600";
  }

  if (
    status === "Gemuk" ||
    status === "Obesitas"
  ) {
    return "text-rose-600";
  }

  return "text-slate-400";
};

const emptySemesterData = () => ({
  tinggi_badan: "",
  berat_badan: "",
});

const normalizeSemesterData = (
  item
) => ({
  tinggi_badan:
    item?.tinggi_badan ?? "",
  berat_badan:
    item?.berat_badan ?? "",
});

const latestDevelopment = (
  items
) =>
  [...items].sort((a, b) => {
    const yearCompare =
      String(
        b.tahun_ajaran
      ).localeCompare(
        String(a.tahun_ajaran)
      );

    if (yearCompare !== 0) {
      return yearCompare;
    }

    return (
      Number(b.semester) -
      Number(a.semester)
    );
  })[0] || null;

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

export default function Perkembangan() {
  const { user } = useAuth();
  const teacherMode = isTeacherAccount(user);
  const [viewMode, setViewMode] =
    useState("list");
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
    selectedAcademicYear,
    setSelectedAcademicYear,
  ] = useState(() =>
    fallbackAcademicYear()
  );
  const [activePeriod, setActivePeriod] =
    useState(null);
  const [classes, setClasses] =
    useState([]);
  const [students, setStudents] =
    useState([]);
  const [
    summaries,
    setSummaries,
  ] = useState({});
  const [
    semesterData,
    setSemesterData,
  ] = useState({
    1: emptySemesterData(),
    2: emptySemesterData(),
  });
  const [
    ,
    setLoadingClasses,
  ] = useState(true);
  const [
    loadingStudents,
    setLoadingStudents,
  ] = useState(true);
  const [
    loadingDetail,
    setLoadingDetail,
  ] = useState(false);
  const [
    loadingSummaries,
    setLoadingSummaries,
  ] = useState(false);
  const [saving, setSaving] =
    useState(false);
  const [listError, setListError] =
    useState("");
  const [
    detailError,
    setDetailError,
  ] = useState("");
  const [
    notification,
    setNotification,
  ] = useState(null);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

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

  const semesters = useMemo(
    () =>
      semesterDefinitions(
        selectedAcademicYear
      ),
    [selectedAcademicYear]
  );

  const yearOptions = useMemo(
    () =>
      selectedAcademicYear
        ? [selectedAcademicYear]
        : [],
    [selectedAcademicYear]
  );

  const activeSemester =
    Number(activePeriod?.semester) === 2
      ? 2
      : 1;

  useEffect(() => {
    let active = true;

    fetchKegiatanCurrentAcademicPeriod()
      .then((period) => {
        if (active) {
          setActivePeriod(period);
          if (text(period?.tahun_ajaran)) {
            setSelectedAcademicYear(text(period.tahun_ajaran));
          }
        }
      })
      .catch(() => {
        if (active) {
          setActivePeriod(null);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const loadClasses =
    useCallback(async () => {
      setLoadingClasses(true);

      try {
        const items =
          await fetchKegiatanClassrooms();

        const scope = classroomScopeForUser(user, items);
        setClasses(scope.classes);
        setSelectedClass((current) => resolveSelectedClass(current, scope, "all"));
      } catch (error) {
        const message =
          errorOf(error);

        setClasses([]);
        setListError(message);
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
      setListError("");

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
        setListError(message);
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

  const loadSummaries =
    useCallback(async () => {
      if (
        students.length === 0
      ) {
        setSummaries({});
        return;
      }

      setLoadingSummaries(true);

      try {
        const items =
          await fetchStudentDevelopmentsList({
            classroom_id:
              selectedClass === "all"
                ? null
                : selectedClass,
            tahun_ajaran:
              selectedAcademicYear,
            semester:
              activeSemester,
          });

        const latestByStudent =
          new Map();

        items.forEach((item) => {
          const key = String(
            item.student_id
          );
          const current =
            latestByStudent.get(key);

          latestByStudent.set(
            key,
            latestDevelopment(
              current
                ? [current, item]
                : [item]
            )
          );
        });

        setSummaries(
          Object.fromEntries(
            students.map(
              (student) => [
                String(student.id),
                latestByStudent.get(
                  String(student.id)
                ) ?? null,
              ]
            )
          )
        );
      } catch (error) {
        showNotification(
          "error",
          "Gagal memuat Perkembangan",
          errorOf(error)
        );
      } finally {
        setLoadingSummaries(false);
      }
    }, [
      activeSemester,
      selectedAcademicYear,
      selectedClass,
      showNotification,
      students,
    ]);

  const loadDetail =
    useCallback(async () => {
      if (!selectedStudent) {
        return;
      }

      setLoadingDetail(true);
      setDetailError("");

      try {
        const items =
          await fetchStudentDevelopments(
            selectedStudent.id
          );

        const yearItems =
          items.filter(
            (item) =>
              item.tahun_ajaran ===
              selectedAcademicYear
          );

        const semesterOne =
          yearItems.find(
            (item) =>
              Number(
                item.semester
              ) === 1
          );
        const semesterTwo =
          yearItems.find(
            (item) =>
              Number(
                item.semester
              ) === 2
          );

        setSemesterData({
          1: normalizeSemesterData(
            semesterOne
          ),
          2: normalizeSemesterData(
            semesterTwo
          ),
        });
      } catch (error) {
        const message =
          errorOf(error);

        setSemesterData({
          1: emptySemesterData(),
          2: emptySemesterData(),
        });
        setDetailError(message);
        showNotification(
          "error",
          "Gagal memuat Detail",
          message
        );
      } finally {
        setLoadingDetail(false);
      }
    }, [
      selectedAcademicYear,
      selectedStudent,
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
    if (
      viewMode === "list"
    ) {
      loadStudents();
    }
  }, [loadStudents, viewMode]);

  useEffect(() => {
    if (
      viewMode === "list"
    ) {
      loadSummaries();
    }
  }, [
    loadSummaries,
    viewMode,
  ]);

  useEffect(() => {
    if (
      viewMode === "detail"
    ) {
      loadDetail();
    }
  }, [
    loadDetail,
    viewMode,
  ]);

  const handleOpenDetail = (
    student
  ) => {
    setSelectedStudent(student);
    if (text(activePeriod?.tahun_ajaran)) {
      setSelectedAcademicYear(
        text(activePeriod.tahun_ajaran)
      );
    }
    setSemesterData({
      1: emptySemesterData(),
      2: emptySemesterData(),
    });
    setDetailError("");
    setViewMode("detail");
  };

  const handleBackToList =
    () => {
      if (saving) {
        return;
      }

      setSelectedStudent(null);
      setDetailError("");
      setViewMode("list");
    };

  const handleFisikChange = (
    semester,
    field,
    value
  ) => {
    setSemesterData(
      (current) => ({
        ...current,
        [semester]: {
          ...current[semester],
          [field]: value,
        },
      })
    );
  };

  const validateSemester = (
    semester
  ) => {
    const data =
      semesterData[semester];
    const height =
      numberOrNull(
        data.tinggi_badan
      );
    const weight =
      numberOrNull(
        data.berat_badan
      );

    if (
      height === null &&
      weight === null
    ) {
      return {
        valid: true,
        empty: true,
      };
    }

    if (
      height === null ||
      weight === null
    ) {
      return {
        valid: false,
        message: `Tinggi dan berat badan Semester ${semester} harus diisi bersama.`,
      };
    }

    if (
      height < 30 ||
      height > 250
    ) {
      return {
        valid: false,
        message: `Tinggi badan Semester ${semester} harus berada antara 30 cm sampai 250 cm.`,
      };
    }

    if (
      weight < 1 ||
      weight > 300
    ) {
      return {
        valid: false,
        message: `Berat badan Semester ${semester} harus berada antara 1 kg sampai 300 kg.`,
      };
    }

    return {
      valid: true,
      empty: false,
    };
  };

  const handleSave =
    async () => {
      if (
        !selectedStudent ||
        saving
      ) {
        return;
      }

      if (
        !activePeriod ||
        !text(activePeriod.tahun_ajaran)
      ) {
        showNotification(
          "warning",
          "Periode Akademik Belum Aktif",
          "Aktifkan periode akademik terlebih dahulu sebelum menyimpan perkembangan siswa."
        );
        return;
      }

      const validation =
        validateSemester(
          activeSemester
        );

      if (!validation.valid) {
        showNotification(
          "warning",
          "Data Tidak Valid",
          validation.message
        );
        return;
      }

      if (validation.empty) {
        showNotification(
          "warning",
          "Data belum tersedia",
          `Isi tinggi dan berat badan Semester ${activeSemester} sebelum menyimpan.`
        );
        return;
      }

      setSaving(true);

      try {
        const saved =
          await saveStudentDevelopment({
            student_id:
              selectedStudent.id,
            tahun_ajaran:
              text(
                activePeriod.tahun_ajaran
              ),
            semester:
              activeSemester,
            tinggi_badan:
              semesterData[
                activeSemester
              ].tinggi_badan,
            berat_badan:
              semesterData[
                activeSemester
              ].berat_badan,
          });

        setSemesterData(
          (current) => ({
            ...current,
            [activeSemester]:
              normalizeSemesterData(
                saved
              ),
          })
        );

        const allItems =
          await fetchStudentDevelopments(
            selectedStudent.id
          );

        setSummaries(
          (current) => ({
            ...current,
            [String(
              selectedStudent.id
            )]:
              latestDevelopment(
                allItems.filter(
                  (item) =>
                    item.tahun_ajaran ===
                      text(
                        activePeriod.tahun_ajaran
                      ) &&
                    Number(
                      item.semester
                    ) ===
                      activeSemester
                )
              ),
          })
        );

        showNotification(
          "success",
          "Berhasil Disimpan",
          `Data perkembangan ${selectedStudent.nama_lengkap} untuk ${text(activePeriod.nama_periode) || `Semester ${activeSemester} ${text(activePeriod.tahun_ajaran)}`} berhasil disimpan.`
        );
      } catch (error) {
        showNotification(
          "error",
          "Gagal Menyimpan",
          `Gagal menyimpan data perkembangan: ${errorOf(
            error
          )}`
        );
      } finally {
        setSaving(false);
      }
    };



  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      {viewMode === "list" && (
        <>
          <SectionHeader icon={UserIcon} title="Data Perkembangan" description="Pantau pertumbuhan fisik dan status gizi siswa pada periode akademik aktif." actions={<button type="button" onClick={()=>setFiltersOpen(value=>!value)} className={`ui-toolbar-button ${filtersOpen?"is-active":""}`}><FunnelIcon className="h-4 w-4"/>Filter</button>}/>
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
                    <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-36">Status Gizi</th>
                    <th className="px-3 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {loadingStudents ? (
                    <tr><td colSpan="8" className="py-14 text-center text-slate-400"><span className="inline-flex items-center gap-2 text-sm"><ArrowPathIcon className="h-4 w-4 animate-spin"/>Memuat siswa...</span></td></tr>
                  ) : listError ? (
                    <tr><td colSpan="8" className="py-14 text-center"><p className="text-sm text-rose-500">{listError}</p><button type="button" onClick={loadStudents} className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]">Muat ulang</button></td></tr>
                  ) : pagedStudents.length ? (
                    pagedStudents.map((siswa, index) => {
                      const summary = summaries[String(siswa.id)];
                      const status = summary?.status_gizi || "";
                      const meta = studentClassroomMeta(classes, siswa);
                      return (
                        <tr key={siswa.id} className="group transition-colors hover:bg-slate-50">
                          <td className="px-3 py-2.5 text-center text-sm font-mono text-slate-500">{(page - 1) * pageSize + index + 1}</td>
                          <td className="px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#e94640]">{siswa.nama_lengkap || "-"}</td>
                          <td className="px-3 py-2.5 text-sm font-mono text-slate-500 whitespace-nowrap">{siswa.nomor_induk || siswa.nisn || "-"}</td>
                          <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">{studentGenderLabel(siswa.jenis_kelamin)}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.classroomName}</td>
                          <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.homeroomTeacherName}</td>
                          <td className="px-3 py-2.5 text-center">{loadingSummaries ? <ArrowPathIcon className="mx-auto h-4 w-4 animate-spin text-slate-300"/> : <span className={`text-sm font-medium ${statusClass(status)}`}>{status || "Belum ada data"}</span>}</td>
                          <td className="px-3 py-2.5 text-right"><button type="button" onClick={() => handleOpenDetail(siswa)} className="ui-action-button"><PencilSquareIcon className="h-4 w-4"/>Input</button></td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr><td colSpan="8" className="py-14 text-center text-slate-400"><FunnelIcon className="mx-auto mb-3 h-10 w-10 opacity-20"/><span className="text-sm">Tidak ada siswa ditemukan.</span></td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <Pagination currentPage={page} totalPages={totalPages} totalItems={students.length} itemsPerPage={pageSize} onPageChange={setPage} onLimitChange={(value) => { setPageSize(value); setPage(1); }} limitOptions={[10, 20, 50, 100]} className="!px-3 !py-2.5"/>
          </div>
        </>
      )}

      {viewMode === "detail" &&
        selectedStudent && (
          <div className="animate-in fade-in zoom-in-95 duration-200 flex flex-col h-full space-y-6">
            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center gap-4 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={
                    handleBackToList
                  }
                  disabled={saving}
                  className="p-2 rounded-lg bg-slate-50 text-slate-500 border border-slate-200 hover:bg-white hover:text-slate-700 transition-all disabled:cursor-not-allowed disabled:opacity-50"
                  title="Kembali"
                >
                  <ArrowLeftIcon className="h-5 w-5" />
                </button>

                <div>
                  <h2 className="text-lg font-bold text-slate-800">
                    {
                      selectedStudent.nama_lengkap
                    }
                  </h2>

                  <div className="flex flex-wrap items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                      {selectedStudent.nomor_induk ||
                        selectedStudent.nisn ||
                        "-"}
                    </span>

                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <UserIcon className="h-3 w-3" />
                      {selectedStudent.jenis_kelamin ||
                        "-"}
                    </div>

                    {selectedStudent.classroom_name && (
                      <span className="text-xs text-slate-500">
                        {
                          selectedStudent.classroom_name
                        }
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-3 w-full lg:w-auto">
                <select
                  value={
                    selectedAcademicYear
                  }
                  onChange={(
                    event
                  ) =>
                    setSelectedAcademicYear(
                      event.target
                        .value
                    )
                  }
                  disabled={true}
                  className="ui-compact-control disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400"
                >
                  {yearOptions.map(
                    (year) => (
                      <option
                        key={year}
                        value={year}
                      >
                        Tahun Ajaran{" "}
                        {year}
                      </option>
                    )
                  )}
                </select>

                <button
                  type="button"
                  onClick={
                    handleSave
                  }
                  disabled={
                    saving ||
                    loadingDetail ||
                    !activePeriod
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
                    : "Simpan Perubahan"}
                </button>
              </div>
            </div>

            <div className="min-h-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">
                  Data Fisik
                </h3>
                <p className="text-xs text-slate-500">
                  Data perkembangan hanya dapat diubah untuk periode akademik aktif: {text(activePeriod?.nama_periode) || `Semester ${activeSemester} ${selectedAcademicYear}`}.
                </p>
              </div>

              {loadingDetail ? (
                <div className="min-h-[300px] flex items-center justify-center text-slate-400">
                  <span className="inline-flex items-center gap-2 text-sm">
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                    Memuat data perkembangan...
                  </span>
                </div>
              ) : detailError ? (
                <div className="min-h-[300px] flex flex-col items-center justify-center text-center px-6">
                  <p className="text-sm text-rose-500">
                    {
                      detailError
                    }
                  </p>
                  <button
                    type="button"
                    onClick={
                      loadDetail
                    }
                    className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]"
                  >
                    Muat ulang
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-100 text-sm">
                    <thead className="sticky top-0 z-10 bg-slate-50/80 text-slate-600">
                      <tr>
                        <th className="px-6 py-4 text-center border-r border-slate-200 w-16">
                          No
                        </th>
                        <th className="px-6 py-4 text-left border-r border-slate-200 w-64">
                          Semester
                        </th>
                        <th className="px-6 py-4 text-center border-r border-slate-200 w-32">
                          Tinggi (cm)
                        </th>
                        <th className="px-6 py-4 text-center border-r border-slate-200 w-32">
                          Berat (kg)
                        </th>
                        <th className="px-6 py-4 text-center border-r border-slate-200 w-32 font-bold text-slate-700">
                          BMI
                        </th>
                        <th className="px-6 py-4 text-left">
                          Keterangan berdasarkan BMI
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                      {semesters.map(
                        (semester) => {
                          const data =
                            semesterData[
                              semester.id
                            ] ||
                            emptySemesterData();
                          const bmi =
                            calculateBMI(
                              data.tinggi_badan,
                              data.berat_badan
                            );
                          const status =
                            getBMIStatus(
                              bmi,
                              selectedStudent.jenis_kelamin
                            );

                          return (
                            <tr
                              key={
                                semester.id
                              }
                              className="hover:bg-slate-50 transition-colors"
                            >
                              <td className="px-6 py-6 text-center text-slate-500 border-r border-slate-100 bg-slate-50/30">
                                {
                                  semester.id
                                }
                              </td>

                              <td className="px-6 py-6 border-r border-slate-100">
                                <div className="font-bold text-slate-700 text-sm">
                                  {
                                    semester.label
                                  }
                                </div>
                                <div className="text-xs text-slate-400 mt-1">
                                  {
                                    semester.sub
                                  }
                                </div>
                              </td>

                              <td className="px-4 py-4 text-center border-r border-slate-100">
                                <input
                                  type="number"
                                  min="30"
                                  max="250"
                                  step="0.1"
                                  placeholder="0"
                                  value={
                                    data.tinggi_badan
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleFisikChange(
                                      semester.id,
                                      "tinggi_badan",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    loadingDetail ||
                                    semester.id !==
                                      activeSemester
                                  }
                                  className="w-full text-center bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 transition-all placeholder-slate-300 font-medium"
                                />
                              </td>

                              <td className="px-4 py-4 text-center border-r border-slate-100">
                                <input
                                  type="number"
                                  min="1"
                                  max="300"
                                  step="0.1"
                                  placeholder="0"
                                  value={
                                    data.berat_badan
                                  }
                                  onChange={(
                                    event
                                  ) =>
                                    handleFisikChange(
                                      semester.id,
                                      "berat_badan",
                                      event
                                        .target
                                        .value
                                    )
                                  }
                                  disabled={
                                    saving ||
                                    loadingDetail ||
                                    semester.id !==
                                      activeSemester
                                  }
                                  className="w-full text-center bg-white border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-100 transition-all placeholder-slate-300 font-medium"
                                />
                              </td>

                              <td className="px-6 py-6 text-center font-bold text-slate-700 bg-slate-50/30 border-r border-slate-100 text-lg">
                                {bmi ??
                                  "-"}
                              </td>

                              <td className="px-6 py-6">
                                <span
                                  className={`text-sm font-medium ${statusClass(
                                    status
                                  )} ${
                                    !status
                                      ? "italic"
                                      : ""
                                  }`}
                                >
                                  {status ||
                                    "Belum ada data"}
                                </span>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
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
