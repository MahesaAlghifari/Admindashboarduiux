import { useMemo, useState } from "react";

import StudentList from "./StudentList";
import StudentHeader from "./StudentHeader";
import WeeklyJournalTable from "./WeeklyJournalTable";

import {
  DATA_SISWA_DUMMY
} from "../../../../data/dummySiswa";

import { getPenghubungKey } from "./helpers";

export default function BukuPenghubung() {
  const [viewMode, setViewMode] = useState("list");

  const [selectedStudent, setSelectedStudent] =
    useState(null);

  const [selectedWeek, setSelectedWeek] =
    useState("2025-W30");

  const [penghubungData, setPenghubungData] =
    useState({});

  const filteredSiswa = useMemo(() => {
    return DATA_SISWA_DUMMY;
  }, []);

  const handleOpenDetail = (student) => {
    setSelectedStudent(student);
    setViewMode("detail");
  };

  const handleBack = () => {
    setSelectedStudent(null);
    setViewMode("list");
  };

  const handlePenghubungChange = (
    day,
    field,
    value
  ) => {
    const key = getPenghubungKey(
      selectedWeek,
      selectedStudent.id
    );

    setPenghubungData((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],

        [day]: {
          ...prev[key]?.[day],

          [field]: value
        }
      }
    }));
  };

  if (viewMode === "list") {
    return (
      <StudentList
        students={filteredSiswa}
        onOpen={handleOpenDetail}
      />
    );
  }

  return (
    <div className="flex flex-col h-full gap-6">
      <StudentHeader
        student={selectedStudent}
        onBack={handleBack}
      />

      <div
        className="bg-white rounded-xl border
        border-slate-200 shadow-sm
        overflow-hidden flex flex-col flex-1"
      >
        <div className="p-4 border-b">
          <input
            type="week"
            value={selectedWeek}
            onChange={(e) =>
              setSelectedWeek(e.target.value)
            }
          />
        </div>

        <WeeklyJournalTable
          selectedWeek={selectedWeek}
          student={selectedStudent}
          penghubungData={penghubungData}
          onChange={handlePenghubungChange}
        />
      </div>
    </div>
  );
}