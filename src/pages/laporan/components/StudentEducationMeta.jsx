const text = (value) => String(value ?? "").trim();

export const EDUCATION_STATUS_OPTIONS = [
  { value: "all", label: "Semua Status Pendidikan" },
  { value: "current", label: "Masih di Lembaga" },
  { value: "graduated", label: "Sudah Lulus" },
  { value: "left", label: "Mengundurkan Diri / Pindah" },
];

const educationConfig = {
  current: {
    label: "Masih di Lembaga",
    className: "border-emerald-100 bg-emerald-50 text-emerald-700",
  },
  graduated: {
    label: "Sudah Lulus",
    className: "border-slate-950 bg-slate-950 text-white",
  },
  left: {
    label: "Mengundurkan Diri / Pindah",
    className: "border-amber-100 bg-amber-50 text-amber-700",
  },
};

export function educationLabel(state) {
  return (educationConfig[state] ?? educationConfig.current).label;
}

export function EducationBadge({ state }) {
  const config = educationConfig[state] ?? educationConfig.current;

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function ClassBadge({ name, educationState }) {
  const label = text(name) || "-";
  const alumni = educationState === "graduated";

  return (
    <span
      className={`inline-flex max-w-44 items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
        alumni
          ? "bg-slate-950 text-white"
          : "bg-indigo-50 text-indigo-600"
      }`}
      title={label}
    >
      <span className="truncate">{label}</span>
    </span>
  );
}

export function StudentEducationSummary({ students = [] }) {
  const counts = students.reduce(
    (acc, student) => {
      const state = educationConfig[student?.education_state]
        ? student.education_state
        : "current";
      acc[state] += 1;
      return acc;
    },
    { current: 0, graduated: 0, left: 0 }
  );

  const entries = ["current", "graduated", "left"].filter(
    (state) => counts[state] > 0
  );

  if (!entries.length) return <span className="text-slate-400">-</span>;

  return (
    <div className="flex flex-wrap gap-1">
      {entries.map((state) => (
        <span key={state} className="inline-flex items-center gap-1">
          <EducationBadge state={state} />
          <span className="text-[9px] font-semibold text-slate-400">
            {counts[state]}
          </span>
        </span>
      ))}
    </div>
  );
}

export function studentAcademicYear(student) {
  return (
    text(student?.status?.tahun_pelajaran) ||
    text(student?.tahun_ajaran) ||
    text(student?.tahun_pelajaran)
  );
}

export function studentNis(student) {
  return (
    text(student?.nomor_induk) ||
    text(student?.nis) ||
    text(student?.nisn)
  );
}

export function matchesEducationStatus(student, filter) {
  return (
    !filter ||
    filter === "all" ||
    student?.education_state === filter
  );
}
