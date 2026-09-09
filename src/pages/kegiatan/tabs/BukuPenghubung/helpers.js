export const getPenghubungKey = (week, studentId) => {
  return `${week}_${studentId}`;
};

export const getDayData = ({
  penghubungData,
  selectedWeek,
  studentId,
  day
}) => {
  const key = getPenghubungKey(selectedWeek, studentId);

  return penghubungData?.[key]?.[day] || {};
};