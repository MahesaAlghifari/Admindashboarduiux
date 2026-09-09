import { fetchAllClassrooms, updateClassroom } from "../api/classrooms";

const text = (value) => String(value ?? "").trim();
const keyOf = (value) => String(value ?? "");

const hasStudent = (classroom, studentId) =>
  (Array.isArray(classroom?.students) ? classroom.students : []).some(
    (student) => keyOf(student?.id) === keyOf(studentId)
  );

const classroomPayload = (classroom, studentIds) => {
  const teacherId = classroom?.wali_kelas?.id;
  const curriculumId = classroom?.curriculum?.id;

  if (teacherId === null || teacherId === undefined || !keyOf(teacherId)) {
    throw new Error(`Wali kelas ${text(classroom?.nama_kelas) || "kelas"} belum tersedia.`);
  }
  if (curriculumId === null || curriculumId === undefined || !keyOf(curriculumId)) {
    throw new Error(`Kurikulum ${text(classroom?.nama_kelas) || "kelas"} belum tersedia.`);
  }

  return {
    nama_kelas: text(classroom?.nama_kelas),
    wali_kelas_id: teacherId,
    curriculum_id: curriculumId,
    student_ids: studentIds,
  };
};

const studentIdsOf = (classroom) =>
  (Array.isArray(classroom?.students) ? classroom.students : [])
    .map((student) => student?.id)
    .filter((id) => id !== null && id !== undefined && keyOf(id));

/**
 * Keep /api/classrooms membership authoritative when a student's class is changed
 * from another frontend surface such as User Management or Data Pengguna.
 */
export async function syncStudentClassroomMembership({
  studentId,
  targetClassroomId = null,
  classrooms,
} = {}) {
  if (studentId === null || studentId === undefined || !keyOf(studentId)) {
    throw new Error("ID siswa tidak valid.");
  }

  const rows = Array.isArray(classrooms) ? classrooms : await fetchAllClassrooms(100);
  const targetKey = targetClassroomId === null || targetClassroomId === undefined || !keyOf(targetClassroomId)
    ? ""
    : keyOf(targetClassroomId);
  const target = targetKey
    ? rows.find((classroom) => keyOf(classroom?.id) === targetKey) || null
    : null;

  if (targetKey && !target) {
    throw new Error("Kelas tujuan tidak ditemukan.");
  }

  const sources = rows.filter(
    (classroom) => hasStudent(classroom, studentId) && keyOf(classroom?.id) !== targetKey
  );
  const removed = [];

  try {
    for (const classroom of sources) {
      const before = studentIdsOf(classroom);
      const after = before.filter((id) => keyOf(id) !== keyOf(studentId));
      await updateClassroom(classroom.id, classroomPayload(classroom, after));
      removed.push({ classroom, before });
    }

    if (target && !hasStudent(target, studentId)) {
      const before = studentIdsOf(target);
      await updateClassroom(
        target.id,
        classroomPayload(target, [...before, studentId])
      );
    }
  } catch (error) {
    // Best-effort rollback for source memberships if the target update fails.
    for (const entry of removed.reverse()) {
      try {
        await updateClassroom(
          entry.classroom.id,
          classroomPayload(entry.classroom, entry.before)
        );
      } catch {
        // Preserve the original error; global cache invalidation will force a refetch.
      }
    }
    throw error;
  }

  return target;
}

export async function syncStudentsToClassroomMembership({
  studentIds = [],
  targetClassroomId = null,
  classrooms,
} = {}) {
  const ids = [...new Map(
    (Array.isArray(studentIds) ? studentIds : [])
      .filter((id) => id !== null && id !== undefined && keyOf(id))
      .map((id) => [keyOf(id), id])
  ).values()];

  if (!ids.length) return null;

  const rows = Array.isArray(classrooms) ? classrooms : await fetchAllClassrooms(100);
  const moving = new Set(ids.map(keyOf));
  const targetKey = targetClassroomId === null || targetClassroomId === undefined || !keyOf(targetClassroomId)
    ? ""
    : keyOf(targetClassroomId);
  const target = targetKey
    ? rows.find((classroom) => keyOf(classroom?.id) === targetKey) || null
    : null;

  if (targetKey && !target) throw new Error("Kelas tujuan tidak ditemukan.");

  const changes = [];
  rows.forEach((classroom) => {
    const before = studentIdsOf(classroom);
    let after = before.filter((id) => !moving.has(keyOf(id)));
    if (target && keyOf(classroom?.id) === targetKey) {
      const existing = new Set(after.map(keyOf));
      ids.forEach((id) => {
        if (!existing.has(keyOf(id))) {
          existing.add(keyOf(id));
          after.push(id);
        }
      });
    }
    const changed = before.length !== after.length || before.some((id, index) => keyOf(id) !== keyOf(after[index]));
    if (changed) changes.push({ classroom, before, after });
  });

  const applied = [];
  try {
    for (const change of changes) {
      await updateClassroom(
        change.classroom.id,
        classroomPayload(change.classroom, change.after)
      );
      applied.push(change);
    }
  } catch (error) {
    for (const change of applied.reverse()) {
      try {
        await updateClassroom(
          change.classroom.id,
          classroomPayload(change.classroom, change.before)
        );
      } catch {
        // Best effort rollback only.
      }
    }
    throw error;
  }

  return target;
}

export async function removeStudentFromClassrooms(studentId, classrooms) {
  return syncStudentClassroomMembership({
    studentId,
    targetClassroomId: null,
    classrooms,
  });
}
