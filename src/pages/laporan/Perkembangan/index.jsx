import {
  Suspense,
  lazy,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowPathIcon,
  PresentationChartLineIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  UserIcon,
  UsersIcon,
} from "@heroicons/react/24/outline";
import { fetchAllClassrooms } from "../../../api/classrooms";
import { fetchAcademicYearOptions } from "../../../api/academic-periods";
import {
  fetchDevelopmentAnalysisYears,
  fetchSchoolProfile,
} from "../../../api/kegiatan";
import {
  fetchAllDevelopmentAnalysis,
  filterDevelopmentAnalysis,
} from "../../../api/report-students";
import { DevelopmentAnalysisPrintTemplate } from "../../../components/common/DevelopmentAnalysisPrintTemplate";
import ReportPageHeading from "../components/ReportPageHeading";
import {
  ClassBadge,
  EducationBadge,
  EDUCATION_STATUS_OPTIONS,
  studentAcademicYear,
  studentNis,
} from "../components/StudentEducationMeta";

const DevelopmentCharts = lazy(() => import("./DevelopmentCharts"));

const EMPTY_ANALYSIS = {
  periods: [],
  students: [],
  summary: {
    total_students: 0,
    students_with_data: 0,
    latest_avg_height: null,
    latest_avg_weight: null,
    avg_height_change: null,
    avg_weight_change: null,
    status_distribution: [],
    trend: [],
  },
};

const PAGE_SIZE = 25;

const show = (value, suffix = "") =>
  value === null || value === undefined || value === ""
    ? "-"
    : `${value}${suffix}`;

function Stat({ label, value, detail }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs font-semibold text-slate-400">{label}</div>
      <div className="mt-1 text-xl font-semibold text-slate-800">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{detail}</div>
    </div>
  );
}

function ChartSkeleton() {
  return (
    <>
      {Array.from({ length: 2 }, (_, index) => (
        <div
          key={index}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="h-4 w-44 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-64 max-w-full animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-72 animate-pulse rounded-lg bg-slate-50" />
        </div>
      ))}
    </>
  );
}

function StatusDistribution({ items }) {
  const max = Math.max(1, ...items.map((item) => Number(item.count) || 0));

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">
          Distribusi Status Tersimpan
        </h3>
        <p className="mt-1 text-xs text-slate-400">
          Berdasarkan status gizi pada pengukuran terakhir.
        </p>
      </div>

      <div className="mt-5 space-y-3">
        {items.length ? (
          items.map((item) => {
            const width = Math.max(
              4,
              Math.round(((Number(item.count) || 0) / max) * 100)
            );

            return (
              <div key={item.status}>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-medium text-slate-600">
                    {item.status}
                  </span>
                  <span className="shrink-0 font-semibold text-slate-500">
                    {item.count}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-slate-400"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            );
          })
        ) : (
          <p className="py-10 text-center text-xs text-slate-400">
            Belum ada data status.
          </p>
        )}
      </div>
    </div>
  );
}

function StudentTable({ students, page, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(students.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const rows = students.slice(start, start + PAGE_SIZE);

  useEffect(() => {
    if (page !== safePage) onPageChange(safePage);
  }, [onPageChange, page, safePage]);

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">
            Data per Siswa
          </h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Hanya {PAGE_SIZE} siswa dirender per halaman untuk menjaga performa.
          </p>
        </div>
        <span className="text-xs text-slate-400">
          {students.length} siswa
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-260 text-left text-xs">
          <thead className="bg-slate-50 text-xs uppercase text-slate-400">
            <tr>
              <th className="px-3 py-2">Siswa</th>
              <th className="px-3 py-2">NIS</th>
              <th className="px-3 py-2">Kelas</th>
              <th className="px-3 py-2">Tahun Ajaran</th>
              <th className="px-3 py-2">Status Pendidikan</th>
              <th className="px-3 py-2">Tinggi</th>
              <th className="px-3 py-2">Berat</th>
              <th className="px-3 py-2">Status Gizi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((student) => (
              <tr key={student.id} className="hover:bg-slate-50/60">
                <td className="px-3 py-2">
                  <p className="font-semibold text-slate-700">
                    {student.nama_lengkap}
                  </p>
                </td>
                <td className="px-3 py-2 text-slate-600">
                  {studentNis(student) || "-"}
                </td>
                <td className="px-3 py-2">
                  <ClassBadge
                    name={student.classroom_name}
                    educationState={student.education_state}
                  />
                </td>
                <td className="px-3 py-2 font-medium text-slate-600">
                  {studentAcademicYear(student) || "-"}
                </td>
                <td className="px-3 py-2">
                  <EducationBadge state={student.education_state} />
                </td>
                <td className="px-3 py-2">
                  {show(student.latest?.tinggi_badan, " cm")}
                </td>
                <td className="px-3 py-2">
                  {show(student.latest?.berat_badan, " kg")}
                </td>
                <td className="px-3 py-2">
                  {student.latest?.status_gizi || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {students.length > PAGE_SIZE && (
        <div className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5">
          <p className="text-xs text-slate-400">
            {start + 1}–{Math.min(start + PAGE_SIZE, students.length)} dari{" "}
            {students.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={safePage <= 1}
              onClick={() => onPageChange(safePage - 1)}
              className="ui-toolbar-button h-8 disabled:opacity-40"
            >
              Sebelumnya
            </button>
            <span className="min-w-14 text-center text-xs font-semibold text-slate-500">
              {safePage}/{totalPages}
            </span>
            <button
              type="button"
              disabled={safePage >= totalPages}
              onClick={() => onPageChange(safePage + 1)}
              className="ui-toolbar-button h-8 disabled:opacity-40"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function LaporanPerkembanganView() {
  const [mode, setMode] = useState("class");
  const [selectedClass, setSelectedClass] = useState("all");
  const [selectedYear, setSelectedYear] = useState("all");
  const [educationStatus, setEducationStatus] = useState("all");
  const [semester, setSemester] = useState("all");
  const [search, setSearch] = useState("");
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [printContext, setPrintContext] = useState(null);
  const [chartsReady, setChartsReady] = useState(false);

  const deferredSearch = useDeferredValue(search);

  const masterQuery = useQuery({
    queryKey: ["reports", "development", "master"],
    queryFn: async () => {
      const [classResult, yearResult, officialYearsResult, profileResult] = await Promise.allSettled([
        fetchAllClassrooms(100),
        fetchDevelopmentAnalysisYears(),
        fetchAcademicYearOptions(),
        fetchSchoolProfile(),
      ]);

      return {
        classes:
          classResult.status === "fulfilled" ? classResult.value : [],
        years: [...new Set([
          ...(officialYearsResult.status === "fulfilled" ? officialYearsResult.value : []),
          ...(yearResult.status === "fulfilled" ? yearResult.value : []),
        ])].sort((a, b) => b.localeCompare(a)),
        profile:
          profileResult.status === "fulfilled" ? profileResult.value : null,
      };
    },
    staleTime: 10 * 60_000,
  });

  const analysisQuery = useQuery({
    queryKey: [
      "reports",
      "development",
      "analysis",
      selectedClass,
      selectedYear,
      semester,
    ],
    queryFn: ({ signal }) =>
      fetchAllDevelopmentAnalysis({
        classroom_id: selectedClass,
        tahun_ajaran: selectedYear,
        semester: semester === "all" ? "all" : Number(semester),
        signal,
      }),
    staleTime: 2 * 60_000,
    placeholderData: (previous) => previous,
  });

  const classes = masterQuery.data?.classes ?? [];
  const years = masterQuery.data?.years ?? [];
  const profile = masterQuery.data?.profile ?? null;
  const baseAnalysis = analysisQuery.data ?? EMPTY_ANALYSIS;

  const analysis = useMemo(
    () => filterDevelopmentAnalysis(baseAnalysis, deferredSearch, educationStatus),
    [baseAnalysis, deferredSearch, educationStatus]
  );

  useEffect(() => {
    setStudentPage(1);
  }, [deferredSearch, selectedClass, selectedYear, educationStatus, semester]);

  useEffect(() => {
    setSelectedStudentId((current) =>
      current &&
      analysis.students.some(
        (student) => String(student.id) === String(current)
      )
        ? current
        : String(
            analysis.students.find(
              (student) => student.developments.length > 0
            )?.id ??
              analysis.students[0]?.id ??
              ""
          )
    );
  }, [analysis.students]);

  useEffect(() => {
    if (chartsReady || analysisQuery.isPending || !analysis.students.length) {
      return undefined;
    }

    let idleId;
    let timeoutId;

    const reveal = () => setChartsReady(true);

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(reveal, { timeout: 700 });
    } else {
      timeoutId = window.setTimeout(reveal, 120);
    }

    return () => {
      if (idleId && typeof window.cancelIdleCallback === "function") {
        window.cancelIdleCallback(idleId);
      }
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [analysis.students.length, analysisQuery.isPending, chartsReady]);

  const selectedStudent = useMemo(
    () =>
      analysis.students.find(
        (student) => String(student.id) === String(selectedStudentId)
      ) || null,
    [analysis.students, selectedStudentId]
  );

  const studentTrend = useMemo(
    () =>
      (selectedStudent?.developments || []).map((item) => ({
        label: `${item.tahun_ajaran} S${item.semester}`,
        tinggi: item.tinggi_badan,
        berat: item.berat_badan,
        bmi: item.bmi,
      })),
    [selectedStudent]
  );

  const periodLabel = useMemo(() => {
    const year =
      selectedYear === "all" ? "Semua Tahun Ajaran" : selectedYear;
    const sem =
      semester === "all"
        ? "Semua Semester"
        : `Semester ${semester === "1" ? "I" : "II"}`;
    return `${year} · ${sem}`;
  }, [selectedYear, semester]);

  const classroomLabel =
    selectedClass === "all"
      ? "Semua Kelas"
      : classes.find(
          (item) => String(item.id) === String(selectedClass)
        )?.nama_kelas || "Kelas";

  const loading = analysisQuery.isPending && !analysisQuery.data;
  const refreshing = analysisQuery.isFetching && !loading;

  const print = () => {
    if (mode === "student" && !selectedStudent) return;

    setPrintContext({
      mode,
      analysis,
      student: selectedStudent,
      profile,
      periodLabel,
      classroomLabel,
      printedAt: new Date(),
    });

    const clear = () => setPrintContext(null);
    window.addEventListener("afterprint", clear, { once: true });
    window.requestAnimationFrame(() =>
      window.requestAnimationFrame(() => window.print())
    );
  };

  return (
    <div className="min-w-0">
      <style>{`@media print { body > * { display:none !important; } #development-analysis-print-root { display:block !important; position:absolute; inset:0; width:100%; background:white; z-index:99999; } }`}</style>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <ReportPageHeading
          icon={PresentationChartLineIcon}
          title="Analisis Perkembangan Siswa"
          description="Analisis tren tinggi badan, berat badan, BMI tersimpan, dan perubahan perkembangan antar semester."
        />

        <div className="flex items-center gap-2">
          {refreshing && (
            <span className="inline-flex items-center gap-1.5 text-xs text-slate-400">
              <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
              Memperbarui
            </span>
          )}
          <button
            type="button"
            onClick={print}
            disabled={loading || (mode === "student" && !selectedStudent)}
            className="inline-flex items-center gap-2 rounded-xl bg-[#e94640] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#d63d38] disabled:opacity-40"
          >
            <PrinterIcon className="h-4 w-4" />
            Cetak Analisa
          </button>
        </div>
      </div>

      <div className="mt-6 grid gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm xl:grid-cols-[230px_1fr_190px_190px]">
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">
            Mode Analisa
          </label>
          <div className="flex rounded-lg bg-slate-100 p-1">
            <button
              type="button"
              onClick={() => setMode("class")}
              className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold ${
                mode === "class"
                  ? "bg-white text-[#e94640] shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <UsersIcon className="h-4 w-4" />
                Kelas
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMode("student")}
              className={`flex-1 rounded-md px-2 py-2 text-xs font-semibold ${
                mode === "student"
                  ? "bg-white text-[#e94640] shadow-sm"
                  : "text-slate-500"
              }`}
            >
              <span className="inline-flex items-center gap-1.5">
                <UserIcon className="h-4 w-4" />
                Siswa
              </span>
            </button>
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">
            Cari Siswa
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Nama atau NIS..."
              className="h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs outline-none focus:border-[#e94640]"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">
            Tahun Ajaran
          </label>
          <select
            value={selectedYear}
            onChange={(event) => setSelectedYear(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#e94640]"
          >
            <option value="all">Semua Tahun</option>
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
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
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#e94640]"
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
            Semester
          </label>
          <select
            value={semester}
            onChange={(event) => setSemester(event.target.value)}
            className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#e94640]"
          >
            <option value="all">Semua Semester</option>
            <option value="1">Semester I</option>
            <option value="2">Semester II</option>
          </select>
        </div>

        <div className="xl:col-span-4">
          <label className="mb-1.5 block text-xs font-semibold text-slate-400">
            Kelas
          </label>
          <select
            value={selectedClass}
            onChange={(event) => setSelectedClass(event.target.value)}
            disabled={masterQuery.isPending}
            className="h-10 w-full max-w-xs rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#e94640] disabled:bg-slate-50"
          >
            <option value="all">Semua Kelas</option>
            {classes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nama_kelas}
              </option>
            ))}
          </select>
        </div>
      </div>

      {analysisQuery.isError ? (
        <div className="mt-6 rounded-xl border border-rose-100 bg-rose-50/60 p-5">
          <p className="text-sm font-semibold text-rose-700">
            Analisis perkembangan gagal dimuat
          </p>
          <p className="mt-1 text-xs text-rose-500">
            {analysisQuery.error?.message || "Terjadi kesalahan saat mengambil data."}
          </p>
          <button
            type="button"
            onClick={() => analysisQuery.refetch()}
            className="ui-toolbar-button mt-4"
          >
            <ArrowPathIcon className="h-4 w-4" />
            Muat Ulang
          </button>
        </div>
      ) : loading ? (
        <div className="mt-6 flex min-h-72 items-center justify-center rounded-xl border border-slate-200 bg-white">
          <span className="inline-flex items-center gap-2 text-sm text-slate-400">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Memuat analisa...
          </span>
        </div>
      ) : mode === "class" ? (
        <>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <Stat
              label="Siswa"
              value={analysis.summary.total_students}
              detail="Dalam filter"
            />
            <Stat
              label="Punya Data"
              value={analysis.summary.students_with_data}
              detail="Ada pengukuran"
            />
            <Stat
              label="Rata-rata Tinggi"
              value={show(analysis.summary.latest_avg_height, " cm")}
              detail="Data terakhir"
            />
            <Stat
              label="Rata-rata Berat"
              value={show(analysis.summary.latest_avg_weight, " kg")}
              detail="Data terakhir"
            />
            <Stat
              label="Δ Tinggi"
              value={show(analysis.summary.avg_height_change, " cm")}
              detail="Rata-rata perubahan"
            />
            <Stat
              label="Δ Berat"
              value={show(analysis.summary.avg_weight_change, " kg")}
              detail="Rata-rata perubahan"
            />
          </div>

          <div className="mt-5 grid gap-5 xl:grid-cols-2">
            {chartsReady ? (
              <Suspense fallback={<ChartSkeleton />}>
                <DevelopmentCharts
                  mode="class"
                  summary={analysis.summary}
                />
              </Suspense>
            ) : (
              <ChartSkeleton />
            )}

            <StatusDistribution
              items={analysis.summary.status_distribution}
            />

            <StudentTable
              students={analysis.students}
              page={studentPage}
              onPageChange={setStudentPage}
            />
          </div>
        </>
      ) : (
        <div className="mt-5 space-y-5">
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <label className="mb-1.5 block text-xs font-semibold text-slate-400">
              Pilih Siswa
            </label>
            <select
              value={selectedStudentId}
              onChange={(event) =>
                setSelectedStudentId(event.target.value)
              }
              className="h-10 w-full max-w-lg rounded-lg border border-slate-200 bg-white px-3 text-xs outline-none focus:border-[#e94640]"
            >
              {analysis.students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.nama_lengkap} · {student.classroom_name || "-"}
                </option>
              ))}
            </select>
          </div>

          {selectedStudent ? (
            <>
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
                <Stat
                  label="Pengukuran"
                  value={selectedStudent.developments.length}
                  detail="Periode tersimpan"
                />
                <Stat
                  label="Tinggi Terakhir"
                  value={show(
                    selectedStudent.latest?.tinggi_badan,
                    " cm"
                  )}
                  detail="Pengukuran terakhir"
                />
                <Stat
                  label="Berat Terakhir"
                  value={show(
                    selectedStudent.latest?.berat_badan,
                    " kg"
                  )}
                  detail="Pengukuran terakhir"
                />
                <Stat
                  label="BMI"
                  value={show(selectedStudent.latest?.bmi)}
                  detail="Nilai tersimpan"
                />
                <Stat
                  label="Δ Tinggi"
                  value={show(selectedStudent.delta_tinggi, " cm")}
                  detail="Awal → akhir"
                />
                <Stat
                  label="Δ Berat"
                  value={show(selectedStudent.delta_berat, " kg")}
                  detail="Awal → akhir"
                />
              </div>

              {chartsReady ? (
                <Suspense fallback={<ChartSkeleton />}>
                  <DevelopmentCharts
                    mode="student"
                    student={selectedStudent}
                    studentTrend={studentTrend}
                  />
                </Suspense>
              ) : (
                <div className="grid gap-5 xl:grid-cols-2">
                  <ChartSkeleton />
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="text-sm font-semibold text-slate-800">
                    Riwayat Pengukuran
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-175 text-left text-xs">
                    <thead className="bg-slate-50 text-xs uppercase text-slate-400">
                      <tr>
                        <th className="px-4 py-3">Tahun Ajaran</th>
                        <th className="px-4 py-3">Semester</th>
                        <th className="px-4 py-3">Status Pendidikan</th>
                        <th className="px-4 py-3">Tinggi</th>
                        <th className="px-4 py-3">Berat</th>
                        <th className="px-4 py-3">BMI</th>
                        <th className="px-4 py-3">Status Tersimpan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedStudent.developments.map((item) => (
                        <tr
                          key={`${item.tahun_ajaran}-${item.semester}`}
                        >
                          <td className="px-4 py-3 font-semibold text-slate-700">
                            {item.tahun_ajaran || "-"}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {item.semester === 1 ? "Semester I" : "Semester II"}
                          </td>
                          <td className="px-4 py-3">
                            <EducationBadge state={selectedStudent.education_state} />
                          </td>
                          <td className="px-4 py-3">
                            {show(item.tinggi_badan, " cm")}
                          </td>
                          <td className="px-4 py-3">
                            {show(item.berat_badan, " kg")}
                          </td>
                          <td className="px-4 py-3">{show(item.bmi)}</td>
                          <td className="px-4 py-3">
                            {item.status_gizi || "-"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-white p-12 text-center text-sm text-slate-400">
              Belum ada siswa yang sesuai filter.
            </div>
          )}
        </div>
      )}

      <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
        Grafik ini memvisualisasikan data perkembangan yang tersimpan.
        Status gizi ditampilkan apa adanya dari modul Perkembangan dan
        tidak dimaksudkan sebagai diagnosis medis.
      </div>

      {typeof document !== "undefined" &&
        printContext &&
        createPortal(
          <div
            id="development-analysis-print-root"
            style={{ display: "none" }}
          >
            <DevelopmentAnalysisPrintTemplate {...printContext} />
          </div>,
          document.body
        )}
    </div>
  );
}
