import { invalidateStudentEducationMetaCache } from "../api/students";
import { adminQueryKeys } from "./adminQueryKeys";
import { queryClient as defaultQueryClient } from "./queryClient";

export const STUDENT_DATA_CHANGED_EVENT = "ssphere:student-data-changed";

const uniqueIds = (studentIds) => [
  ...new Set(
    (Array.isArray(studentIds) ? studentIds : [])
      .filter((value) => value !== null && value !== undefined && String(value).trim())
      .map((value) => String(value))
  ),
];

const notifyStudentDataChanged = (detail) => {
  if (typeof window === "undefined" || typeof window.dispatchEvent !== "function") return;
  window.dispatchEvent(new CustomEvent(STUDENT_DATA_CHANGED_EVENT, { detail }));
};

export async function invalidateStudentData({
  studentIds = [],
  client = defaultQueryClient,
  includeAcademicPeriod = false,
  reason = "student-data",
} = {}) {
  const ids = uniqueIds(studentIds);
  invalidateStudentEducationMetaCache(ids.length ? ids : undefined);

  const reportModule = await import("../api/report-students").catch(() => null);
  reportModule?.invalidateReportStudentCaches?.();
  reportModule?.invalidateReportStudentDirectory?.();

  const queryKeys = [
    adminQueryKeys.classrooms,
    adminQueryKeys.classroomMaster,
    ["admin", "classrooms", "available-students"],
    adminQueryKeys.students,
    adminQueryKeys.studentUsers,
    adminQueryKeys.kegiatan,
    adminQueryKeys.dashboard,
    adminQueryKeys.reports,
    adminQueryKeys.analytics,
  ];

  if (includeAcademicPeriod) {
    queryKeys.push(
      adminQueryKeys.academicPeriod,
      ["admin", "academic-periods"],
      adminQueryKeys.curriculums
    );
  }

  await Promise.all(
    queryKeys.map((queryKey) => client.invalidateQueries({ queryKey }))
  );

  notifyStudentDataChanged({
    studentIds: ids,
    includeAcademicPeriod,
    reason,
  });
}

export function subscribeStudentDataChanges(listener) {
  if (typeof window === "undefined" || typeof listener !== "function") return () => {};
  const handler = (event) => listener(event?.detail ?? {});
  window.addEventListener(STUDENT_DATA_CHANGED_EVENT, handler);
  return () => window.removeEventListener(STUDENT_DATA_CHANGED_EVENT, handler);
}
