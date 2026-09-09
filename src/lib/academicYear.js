const text = (value) => String(value ?? "").trim();

export function academicYearStart(value) {
  const match = /^(\d{4})\s*\/\s*(\d{4})$/.exec(text(value));
  if (!match) return null;

  const start = Number(match[1]);
  const end = Number(match[2]);
  if (!Number.isInteger(start) || end !== start + 1) return null;

  return start;
}

export function academicYearLabel(startYear) {
  const start = Number(startYear);
  if (!Number.isInteger(start)) return "";
  return `${start}/${start + 1}`;
}

export function fallbackAcademicYear(date = new Date()) {
  const start = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
  return academicYearLabel(start);
}

export function fallbackAcademicSemester(date = new Date()) {
  return date.getMonth() >= 6 ? 1 : 2;
}

export function resolveAcademicYear(period, date = new Date()) {
  const fromPeriod = academicYearStart(period?.tahun_ajaran);
  return fromPeriod === null
    ? fallbackAcademicYear(date)
    : academicYearLabel(fromPeriod);
}

export function resolveAcademicSemester(period, date = new Date()) {
  const semester = Number(period?.semester);
  return semester === 1 || semester === 2
    ? semester
    : fallbackAcademicSemester(date);
}

export function resolveStudentAcademicYear({
  educationState,
  statusActive,
  storedYear,
  activePeriod,
  date = new Date(),
} = {}) {
  const normalizedState = text(educationState).toLocaleLowerCase("id-ID");
  const explicitlyInactive = normalizedState === "graduated" || normalizedState === "left";
  const isCurrent = normalizedState === "current" || (!explicitlyInactive && statusActive === true);

  if (isCurrent) {
    const activeStart = academicYearStart(activePeriod?.tahun_ajaran);
    if (activeStart !== null) return academicYearLabel(activeStart);

    const storedStart = academicYearStart(storedYear);
    if (storedStart !== null) return academicYearLabel(storedStart);

    return fallbackAcademicYear(date);
  }

  const storedStart = academicYearStart(storedYear);
  return storedStart === null ? text(storedYear) : academicYearLabel(storedStart);
}

export function buildAcademicYearOptions(anchorYear, count = 8) {
  const fallbackStart = academicYearStart(fallbackAcademicYear());
  const anchorStart = academicYearStart(anchorYear) ?? fallbackStart;
  const total = Math.max(1, Number(count) || 1);

  return Array.from({ length: total }, (_, index) =>
    academicYearLabel(anchorStart - index)
  );
}
