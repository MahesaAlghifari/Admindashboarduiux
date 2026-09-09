const clean = (value) => {
  if (!value || typeof value !== "object") return value;
  const entries = Object.entries(value)
    .filter(([, item]) => item !== undefined && item !== null && item !== "")
    .sort(([a], [b]) => a.localeCompare(b));
  return Object.fromEntries(entries);
};

export const adminQueryKeys = {
  all: ["admin"],

  academicPeriod: ["admin", "academic-period", "current"],

  curriculums: ["admin", "curriculums"],
  curriculumList: (params = {}) => ["admin", "curriculums", "list", clean(params)],

  indicators: ["admin", "indicators"],
  indicatorList: (params = {}) => ["admin", "indicators", "list", clean(params)],

  aspects: ["admin", "aspects"],
  aspectList: (params = {}) => ["admin", "aspects", "list", clean(params)],

  journals: ["admin", "journals"],
  journalList: (params = {}) => ["admin", "journals", "list", clean(params)],
  journalMaster: ["admin", "journals", "master"],

  schedules: ["admin", "schedules"],
  scheduleList: (params = {}) => ["admin", "schedules", "list", clean(params)],

  classrooms: ["admin", "classrooms"],
  classroomList: (params = {}) => ["admin", "classrooms", "list", clean(params)],
  classroomMaster: ["admin", "classrooms", "master"],
  availableStudents: (params = {}) => [
    "admin",
    "classrooms",
    "available-students",
    clean(params),
  ],

  staffUsers: ["admin", "staff-users"],

  students: ["students"],
  studentUsers: ["student-users"],
  dashboard: ["dashboard"],
  kegiatan: ["kegiatan"],
  reports: ["reports"],
  analytics: ["analytics"],

  announcements: ["admin", "announcements"],
  announcementList: (params = {}) => [
    "admin",
    "announcements",
    "list",
    clean(params),
  ],
};
