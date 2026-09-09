import {
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowPathIcon,
  CheckIcon,
  FunnelIcon,
  IdentificationIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { fetchStudentById } from "../../../api/students";
import { contextualizeReportStudents, fetchAllReportStudents } from "../../../api/report-students";
import { fetchAcademicPeriods } from "../../../api/academic-periods";
import { fetchSchoolProfile } from "../../../api/kegiatan";
import {
  StudentMasterBookPrintTemplate,
  studentMasterBookPrintCss,
} from "../../../components/common/StudentMasterBookPrintTemplate";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { ClassBadge } from "../components/StudentEducationMeta";

const PAGE_SIZE = 25;

const text = (value) => String(value ?? "").trim();

const keyOf = (student) =>
  String(
    student?.id ??
      student?.student_id ??
      student?.nisn ??
      student?.nik ??
      student?.nama_lengkap ??
      ""
  );

const educationConfig = {
  current: {
    label: "Masih di Lembaga",
    className: "border-emerald-100 bg-emerald-50 text-emerald-600",
  },
  graduated: {
    label: "Sudah Lulus",
    className: "border-slate-950 bg-slate-950 text-white",
  },
  left: {
    label: "Mengundurkan Diri / Pindah",
    className: "border-amber-100 bg-amber-50 text-amber-600",
  },
};

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

function mergePrintStudent(base, detail) {
  const classroomName =
    text(base?.classroom_name) ||
    text(base?.classroom?.nama_kelas) ||
    text(detail?.classroom_name) ||
    text(detail?.classroom_nama) ||
    text(detail?.classroom?.nama_kelas);

  const classroomId =
    base?.classroom_id ??
    base?.classroom?.id ??
    detail?.classroom_id ??
    detail?.classroom?.id ??
    null;

  const year =
    text(base?.status?.tahun_pelajaran) ||
    text(base?.tahun_ajaran) ||
    text(detail?.status?.tahun_pelajaran) ||
    text(detail?.tahun_ajaran) ||
    text(detail?.tahun_pelajaran);

  return {
    ...base,
    ...detail,
    classroom_id: classroomId,
    classroom:
      classroomId || classroomName
        ? {
            id: classroomId,
            nama_kelas: classroomName,
          }
        : null,
    classroom_name: classroomName,
    classroom_nama: classroomName,
    nama_kelas: classroomName,
    tahun_ajaran: year,
    tahun_pelajaran: year,
    parent: {
      ...(base?.parent ?? {}),
      ...(base?.parent_detail ?? {}),
      ...(detail?.parent ?? {}),
      ...(detail?.parent_detail ?? {}),
    },
    parent_detail: {
      ...(base?.parent_detail ?? {}),
      ...(detail?.parent_detail ?? {}),
      ...(detail?.parent ?? {}),
    },
    dev: {
      ...(base?.dev ?? {}),
      ...(base?.development ?? {}),
      ...(detail?.dev ?? {}),
      ...(detail?.development ?? {}),
    },
    development: {
      ...(base?.development ?? {}),
      ...(detail?.development ?? {}),
      ...(detail?.dev ?? {}),
    },
    status: {
      ...(base?.status ?? {}),
      ...(detail?.status ?? {}),
      tahun_pelajaran: year,
    },
  };
}

function EducationBadge({ state }) {
  const config = educationConfig[state] ?? educationConfig.current;

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export default function BukuIndukView() {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState(() => new Set());
  const [search, setSearch] = useState("");
  const [classroom, setClassroom] = useState("all");
  const [academicYear, setAcademicYear] = useState("all");
  const [educationStatus, setEducationStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [printing, setPrinting] = useState(false);
  const [printProgress, setPrintProgress] = useState({
    done: 0,
    total: 0,
  });
  const [printStudents, setPrintStudents] = useState([]);
  const [printProfile, setPrintProfile] = useState(null);
  const [printError, setPrintError] = useState("");

  const detailCacheRef = useRef(new Map());
  const profileCacheRef = useRef(null);
  const deferredSearch = useDeferredValue(search);

  const studentsQuery = useQuery({
    queryKey: ["reports", "student-master-book", "directory"],
    queryFn: ({ signal }) => fetchAllReportStudents({ signal }),
    staleTime: 5 * 60_000,
    gcTime: 15 * 60_000,
  });
  const periodsQuery = useQuery({
    queryKey: ["reports", "academic-periods", "years"],
    queryFn: ({ signal }) => fetchAcademicPeriods(signal),
    staleTime: 10 * 60_000,
  });

  const students = studentsQuery.data ?? [];

  const classrooms = useMemo(
    () =>
      [
        ...new Set(
          students
            .map((student) => text(student.classroom_name))
            .filter(Boolean)
        ),
      ].sort((a, b) =>
        a.localeCompare(b, "id", {
          numeric: true,
          sensitivity: "base",
        })
      ),
    [students]
  );

  const academicYears = useMemo(() => {
    const values = new Set(
      (periodsQuery.data ?? []).map((period) => text(period.tahun_ajaran)).filter(Boolean)
    );
    students.forEach((student) => {
      const year = text(student.last_tahun_ajaran) || text(student.status?.tahun_pelajaran) || text(student.tahun_ajaran);
      if (year) values.add(year);
    });
    return [...values].sort((a, b) => b.localeCompare(a, "id", { numeric: true, sensitivity: "base" }));
  }, [periodsQuery.data, students]);

  const filteredStudents = useMemo(() => {
    const keyword = text(deferredSearch).toLocaleLowerCase("id");

    const sourceStudents = academicYear === "all"
      ? students
      : contextualizeReportStudents(students, { tahun_ajaran: academicYear });

    return sourceStudents.filter((student) => {
      const classroomName = text(student.classroom_name);
      const year =
        text(student.status?.tahun_pelajaran) ||
        text(student.tahun_ajaran);

      const matchesSearch =
        !keyword ||
        [student.nama_lengkap, student.nomor_induk, student.nisn, classroomName].some(
          (value) =>
            text(value)
              .toLocaleLowerCase("id")
              .includes(keyword)
        );

      const matchesClassroom =
        classroom === "all" || classroomName === classroom;

      const matchesYear =
        academicYear === "all" || year === academicYear;

      const matchesEducation =
        educationStatus === "all" ||
        student.education_state === educationStatus;

      return (
        matchesSearch &&
        matchesClassroom &&
        matchesYear &&
        matchesEducation
      );
    });
  }, [
    academicYear,
    classroom,
    deferredSearch,
    educationStatus,
    students,
  ]);

  useEffect(() => {
    setPage(1);
  }, [
    academicYear,
    classroom,
    deferredSearch,
    educationStatus,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredStudents.length / PAGE_SIZE)
  );
  const safePage = Math.min(page, totalPages);
  const pageStart = (safePage - 1) * PAGE_SIZE;

  const pageRows = useMemo(
    () =>
      filteredStudents.slice(
        pageStart,
        pageStart + PAGE_SIZE
      ),
    [filteredStudents, pageStart]
  );

  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [page, safePage]);

  const selectedStudents = useMemo(
    () =>
      students.filter((student) =>
        selectedIds.has(keyOf(student))
      ),
    [selectedIds, students]
  );

  const filteredKeys = useMemo(
    () => filteredStudents.map(keyOf).filter(Boolean),
    [filteredStudents]
  );

  const pageKeys = useMemo(
    () => pageRows.map(keyOf).filter(Boolean),
    [pageRows]
  );

  const selectedPageCount = pageKeys.filter((key) =>
    selectedIds.has(key)
  ).length;

  const allPageSelected =
    pageKeys.length > 0 &&
    selectedPageCount === pageKeys.length;

  const somePageSelected =
    selectedPageCount > 0 && !allPageSelected;

  const filtersActive =
    text(deferredSearch) ||
    classroom !== "all" ||
    academicYear !== "all" ||
    educationStatus !== "all";

  const loading = studentsQuery.isPending;

  const resetFilters = () => {
    setSearch("");
    setClassroom("all");
    setAcademicYear("all");
    setEducationStatus("all");
  };

  const toggleSelectionMode = () => {
    setSelectionMode((current) => {
      if (current) setSelectedIds(new Set());
      return !current;
    });
  };

  const toggleStudent = (student) => {
    const key = keyOf(student);
    if (!key) return;

    setSelectedIds((current) => {
      const next = new Set(current);

      if (next.has(key)) next.delete(key);
      else next.add(key);

      return next;
    });
  };

  const togglePage = () => {
    setSelectedIds((current) => {
      const next = new Set(current);

      if (allPageSelected) {
        pageKeys.forEach((key) => next.delete(key));
      } else {
        pageKeys.forEach((key) => next.add(key));
      }

      return next;
    });
  };

  const selectAllFiltered = () => {
    setSelectedIds((current) => {
      const next = new Set(current);
      const allSelected =
        filteredKeys.length > 0 &&
        filteredKeys.every((key) => next.has(key));

      filteredKeys.forEach((key) => {
        if (allSelected) next.delete(key);
        else next.add(key);
      });

      return next;
    });
  };

  const hydrateForPrint = async (rows) => {
    let completed = 0;

    setPrintProgress({
      done: 0,
      total: rows.length,
    });

    return mapWithConcurrency(rows, 4, async (student) => {
      const key = keyOf(student);
      let detail = detailCacheRef.current.get(key);

      if (!detail && student.id !== null && student.id !== undefined) {
        try {
          detail = await fetchStudentById(student.id);
          detailCacheRef.current.set(key, detail);
        } catch {
          detail = student;
        }
      }

      completed += 1;
      setPrintProgress({
        done: completed,
        total: rows.length,
      });

      return mergePrintStudent(student, detail ?? student);
    });
  };

  const loadPrintProfile = async () => {
    if (profileCacheRef.current) {
      return profileCacheRef.current;
    }

    const profile = await fetchSchoolProfile();
    profileCacheRef.current = profile;
    return profile;
  };

  const requestPrint = async (rows) => {
    if (!rows.length || printing) return;

    setPrinting(true);
    setPrintError("");

    try {
      const [hydratedStudents, profile] =
        await Promise.all([
          hydrateForPrint(rows),
          loadPrintProfile(),
        ]);

      setPrintStudents(hydratedStudents);
      setPrintProfile(profile);

      const cleanup = () => {
        setPrinting(false);
        setPrintProgress({ done: 0, total: 0 });
      };

      window.addEventListener("afterprint", cleanup, {
        once: true,
      });

      window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => window.print());
      });

      window.setTimeout(() => {
        setPrinting((current) => {
          if (!current) return current;
          setPrintProgress({ done: 0, total: 0 });
          return false;
        });
      }, 1500);
    } catch (error) {
      setPrinting(false);
      setPrintProgress({ done: 0, total: 0 });
      setPrintError(
        error?.message ||
          "Data lengkap Buku Induk gagal disiapkan."
      );
    }
  };

  const actions = (
    <>
      <span className="text-[10px] text-slate-400">
        <b className="font-semibold text-slate-600">
          {filteredStudents.length}
        </b>{" "}
        siswa
      </span>

      <button
        type="button"
        onClick={() => setFiltersOpen((value) => !value)}
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
        disabled={printing}
        className={`ui-toolbar-button ${
          selectionMode ? "is-active" : ""
        }`}
      >
        {selectionMode ? (
          <CheckIcon className="h-4 w-4" />
        ) : (
          <UserGroupIcon className="h-4 w-4" />
        )}
        {selectionMode ? "Selesai Pilih" : "Pilih Siswa"}
      </button>

      {selectionMode ? (
        <button
          type="button"
          onClick={() => requestPrint(selectedStudents)}
          disabled={
            !selectedStudents.length || loading || printing
          }
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {printing ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PrinterIcon className="h-4 w-4" />
          )}
          {printing
            ? `Menyiapkan ${printProgress.done}/${printProgress.total}`
            : `Cetak Terpilih${
                selectedStudents.length
                  ? ` (${selectedStudents.length})`
                  : ""
              }`}
        </button>
      ) : (
        <button
          type="button"
          onClick={() => requestPrint(filteredStudents)}
          disabled={
            !filteredStudents.length || loading || printing
          }
          className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {printing ? (
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
          ) : (
            <PrinterIcon className="h-4 w-4" />
          )}
          {printing
            ? `Menyiapkan ${printProgress.done}/${printProgress.total}`
            : `Cetak ${
                filtersActive ? "Hasil Filter" : "Semua"
              }`}
        </button>
      )}
    </>
  );

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <style>{studentMasterBookPrintCss}</style>

      <SectionHeader
        icon={IdentificationIcon}
        title="Cetak Buku Induk"
        description="Cetak Buku Induk lengkap 2 halaman per siswa secara individual, berdasarkan filter, atau pilih beberapa siswa sekaligus."
        actions={actions}
      />

      {filtersOpen && (
        <div className="mt-4 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={classroom}
              onChange={(event) =>
                setClassroom(event.target.value)
              }
              className="ui-compact-control min-w-40"
            >
              <option value="all">Semua Kelas</option>
              {classrooms.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>

            <select
              value={academicYear}
              onChange={(event) =>
                setAcademicYear(event.target.value)
              }
              className="ui-compact-control min-w-40"
            >
              <option value="all">Semua Tahun Ajar</option>
              {academicYears.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>

            <select
              value={educationStatus}
              onChange={(event) =>
                setEducationStatus(event.target.value)
              }
              className="ui-compact-control min-w-48"
            >
              <option value="all">
                Semua Status Pendidikan
              </option>
              <option value="current">
                Masih di Lembaga
              </option>
              <option value="graduated">Sudah Lulus</option>
              <option value="left">
                Mengundurkan Diri / Pindah
              </option>
            </select>

            {filtersActive && (
              <button
                type="button"
                onClick={resetFilters}
                className="h-9 rounded-lg px-3 text-xs font-semibold text-[#ef4d45] hover:bg-red-50"
              >
                Reset Filter
              </button>
            )}
          </div>

          <div className="relative w-full xl:w-64">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Cari nama, NIS, atau kelas..."
              className="ui-compact-control w-full pl-9"
            />
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
              Pilih siswa pada tabel. Detail lengkap baru
              diambil saat proses cetak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {selectedStudents.length > 0 && (
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="h-8 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 hover:bg-white"
              >
                Kosongkan
              </button>
            )}

            <button
              type="button"
              onClick={selectAllFiltered}
              disabled={!filteredStudents.length}
              className="h-8 rounded-lg border border-red-100 bg-white px-2.5 text-[10px] font-semibold text-[#ef4d45] disabled:opacity-40"
            >
              {filteredKeys.length > 0 &&
              filteredKeys.every((key) =>
                selectedIds.has(key)
              )
                ? "Batal Pilih Semua"
                : "Pilih Semua Hasil"}
            </button>

            <span className="text-[10px] text-slate-500">
              <b className="font-semibold text-[#ef4d45]">
                {selectedStudents.length}
              </b>{" "}
              siswa dipilih
            </span>
          </div>
        </div>
      )}

      {printError && (
        <div className="flex items-center justify-between gap-3 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5">
          <p className="text-[10px] font-medium text-rose-600">
            {printError}
          </p>
          <button
            type="button"
            onClick={() => setPrintError("")}
            className="text-rose-400 hover:text-rose-600"
            aria-label="Tutup pesan"
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        </div>
      )}

      {studentsQuery.isError ? (
        <div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
          <p className="text-[11px] font-medium text-rose-600">
            Data buku induk gagal dimuat.{" "}
            {studentsQuery.error?.message}
          </p>
          <button
            type="button"
            onClick={() => studentsQuery.refetch()}
            className="ui-toolbar-button mt-3"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Muat Ulang
          </button>
        </div>
      ) : (
        <div className="ui-table-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-240">
              <thead className="bg-slate-50/60">
                <tr className="border-b border-slate-100">
                  <th className="w-20 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    <div className="flex items-center gap-2">
                      {selectionMode && (
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          ref={(node) => {
                            if (node) {
                              node.indeterminate =
                                somePageSelected;
                            }
                          }}
                          onChange={togglePage}
                          aria-label="Pilih semua siswa pada halaman ini"
                          className="h-3.5 w-3.5 rounded border-slate-300 accent-[#ef4d45]"
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

                  <th className="w-40 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Kelas
                  </th>

                  <th className="w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Tahun Ajar
                  </th>

                  <th className="w-52 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Status Pendidikan
                  </th>

                  <th className="w-24 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                    Aksi
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  Array.from({ length: 8 }, (_, index) => (
                    <tr key={index}>
                      {Array.from(
                        { length: 7 },
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
                  ))
                ) : pageRows.length ? (
                  pageRows.map((student, index) => {
                    const key = keyOf(student);
                    const checked =
                      selectedIds.has(key);

                    return (
                      <tr
                        key={key || index}
                        className={`hover:bg-slate-50/60 ${
                          checked ? "bg-red-50/30" : ""
                        }`}
                      >
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            {selectionMode && (
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={() =>
                                  toggleStudent(student)
                                }
                                aria-label={`Pilih ${
                                  text(
                                    student.nama_lengkap
                                  ) || "siswa"
                                }`}
                                className="h-3.5 w-3.5 rounded border-slate-300 accent-[#ef4d45]"
                              />
                            )}

                            <span className="text-[11px] text-slate-400">
                              {pageStart + index + 1}
                            </span>
                          </div>
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="max-w-64 truncate text-[12px] font-semibold text-slate-800">
                            {text(
                              student.nama_lengkap
                            ) || "Tanpa nama"}
                          </p>
                        </td>

                        <td className="px-3 py-2.5 text-[11px] text-slate-600">
                          {text(student.nomor_induk) || text(student.nisn) || "-"}
                        </td>

                        <td className="px-3 py-2.5">
                          <ClassBadge
                            name={student.classroom_name}
                            educationState={student.education_state}
                          />
                        </td>

                        <td className="px-3 py-2.5 text-[11px] text-slate-600">
                          {text(
                            student.status
                              ?.tahun_pelajaran
                          ) ||
                            text(
                              student.tahun_ajaran
                            ) ||
                            "-"}
                        </td>

                        <td className="px-3 py-2.5">
                          <EducationBadge
                            state={
                              student.education_state
                            }
                          />
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <button
                            type="button"
                            onClick={() =>
                              requestPrint([student])
                            }
                            disabled={printing}
                            className="ui-action-button"
                          >
                            {printing ? (
                              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <PrinterIcon className="h-3.5 w-3.5" />
                            )}
                            Cetak
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-10 text-center"
                    >
                      <IdentificationIcon className="mx-auto h-6 w-6 text-slate-300" />
                      <p className="mt-2 text-[11px] font-semibold text-slate-600">
                        Tidak ada siswa
                      </p>
                      <p className="mt-1 text-[10px] text-slate-400">
                        Tidak ada data siswa yang sesuai
                        dengan filter saat ini.
                      </p>

                      {filtersActive && (
                        <button
                          type="button"
                          onClick={resetFilters}
                          className="ui-toolbar-button mt-3"
                        >
                          <XMarkIcon className="h-4 w-4" />
                          Reset Filter
                        </button>
                      )}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {!loading &&
            filteredStudents.length > 0 && (
              <div className="flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-[10px] text-slate-400">
                  Menampilkan{" "}
                  <b className="font-semibold text-slate-600">
                    {pageStart + 1}
                  </b>
                  –
                  <b className="font-semibold text-slate-600">
                    {Math.min(
                      pageStart + PAGE_SIZE,
                      filteredStudents.length
                    )}
                  </b>{" "}
                  dari{" "}
                  <b className="font-semibold text-slate-600">
                    {filteredStudents.length}
                  </b>{" "}
                  siswa
                </p>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={safePage <= 1}
                    onClick={() =>
                      setPage((value) =>
                        Math.max(1, value - 1)
                      )
                    }
                    className="ui-toolbar-button h-8"
                  >
                    Sebelumnya
                  </button>

                  <span className="min-w-14 text-center text-[10px] font-semibold text-slate-500">
                    {safePage}/{totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={safePage >= totalPages}
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

      <div id="student-master-book-print-root">
        <StudentMasterBookPrintTemplate
          students={printStudents}
          profile={printProfile}
        />
      </div>
    </div>
  );
}
