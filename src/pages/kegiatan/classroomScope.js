import { accessLevelOf } from "../../auth/accessControl";

const text = (value) => String(value ?? "").trim();
const normalized = (value) =>
  text(value)
    .toLocaleLowerCase("id")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");

const explicitStaffIds = (user) =>
  [
    user?.staff_id,
    user?.staffid,
    user?.staff?.id,
    user?.profile?.staff_id,
  ]
    .filter((value) => value !== null && value !== undefined && text(value))
    .map((value) => String(value));

const userNik = (user) =>
  text(user?.nik || user?.staff?.nik || user?.profile?.nik);

const userName = (user) =>
  normalized(
    user?.nama_lengkap ||
      user?.fullname ||
      user?.name ||
      user?.staff?.nama_lengkap ||
      user?.profile?.nama_lengkap
  );

export function isTeacherAccount(user) {
  if (!user) return false;

  const level = normalized(accessLevelOf(user));
  if (level === "leadership" || level === "admin") return false;
  if (level === "guru") return true;

  const labels = [
    user?.role,
    user?.position,
    user?.jabatan,
    user?.nama_jabatan,
    user?.job_title,
    user?.kepegawaian?.jabatan,
  ].map(normalized);

  return labels.some(
    (value) =>
      value === "guru" ||
      value === "teacher" ||
      value.includes("guru ") ||
      value.includes(" guru") ||
      value.includes("wali kelas") ||
      value.includes("homeroom")
  );
}

function sameTeacher(user, teacher) {
  if (!teacher) return false;

  const nik = userNik(user);
  const teacherNik = text(teacher.nik);
  if (nik && teacherNik) return nik === teacherNik;

  const ids = explicitStaffIds(user);
  if (
    ids.length > 0 &&
    teacher.id !== null &&
    teacher.id !== undefined &&
    ids.includes(String(teacher.id))
  ) {
    return true;
  }

  // Fallback untuk response /auth/me lama yang hanya mengembalikan `id`.
  if (
    !nik &&
    ids.length === 0 &&
    user?.id !== null &&
    user?.id !== undefined &&
    teacher.id !== null &&
    teacher.id !== undefined &&
    String(user.id) === String(teacher.id)
  ) {
    return true;
  }

  const name = userName(user);
  const teacherName = normalized(teacher.nama_lengkap);
  return Boolean(name && teacherName && name === teacherName);
}

export function classroomScopeForUser(user, classrooms = []) {
  const source = Array.isArray(classrooms) ? classrooms : [];
  const teacher = isTeacherAccount(user);

  if (!teacher) {
    return {
      isTeacher: false,
      classes: source,
      defaultClass: "all",
      hasAssignedClass: true,
    };
  }

  const assigned = source.filter((classroom) =>
    sameTeacher(user, classroom?.wali_kelas)
  );

  return {
    isTeacher: true,
    classes: assigned,
    defaultClass: assigned[0]?.id ?? "",
    hasAssignedClass: assigned.length > 0,
  };
}

export function resolveSelectedClass(current, scope, allValue = "all") {
  const classes = scope?.classes || [];

  if (scope?.isTeacher) {
    if (
      current !== null &&
      current !== undefined &&
      current !== "" &&
      classes.some((item) => String(item.id) === String(current))
    ) {
      return current;
    }

    return scope?.defaultClass ?? "";
  }

  if (String(current) === String(allValue)) return allValue;

  if (
    current !== null &&
    current !== undefined &&
    current !== "" &&
    classes.some((item) => String(item.id) === String(current))
  ) {
    return current;
  }

  return allValue;
}
