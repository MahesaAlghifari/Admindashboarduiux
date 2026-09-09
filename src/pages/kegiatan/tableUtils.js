export const studentGenderLabel = (value) => {
  const normalized = String(value ?? "").trim().toLowerCase();
  if (["l", "laki-laki", "laki laki", "male"].includes(normalized) || normalized.includes("laki")) return "L";
  if (["p", "perempuan", "female"].includes(normalized) || normalized.includes("perempuan")) return "P";
  return "-";
};

export const studentClassroomMeta = (classes = [], student = {}) => {
  const classroom = classes.find(
    (item) => String(item?.id ?? "") === String(student?.classroom_id ?? "")
  ) || classes.find(
    (item) => String(item?.nama_kelas ?? "").trim() === String(student?.classroom_name ?? "").trim()
  ) || null;

  return {
    classroom,
    classroomName: String(student?.classroom_name || classroom?.nama_kelas || "-").trim() || "-",
    homeroomTeacherName:
      String(classroom?.wali_kelas?.nama_lengkap || "").trim() || "-",
  };
};
