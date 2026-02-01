import { useState, useMemo, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  FunnelIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

// Import Data Dummy
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../../data/dummySiswa";

const DAYS = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const STATUS_OPTIONS = [
  { id: "H", label: "Hadir", color: "bg-emerald-500", text: "text-emerald-700", border: "border-emerald-200", bgLight: "bg-emerald-50" },
  { id: "S", label: "Sakit", color: "bg-blue-500", text: "text-blue-700", border: "border-blue-200", bgLight: "bg-blue-50" },
  { id: "I", label: "Izin", color: "bg-amber-500", text: "text-amber-700", border: "border-amber-200", bgLight: "bg-amber-50" },
  { id: "A", label: "Alpa", color: "bg-rose-500", text: "text-rose-700", border: "border-rose-200", bgLight: "bg-rose-50" },
];

// Helper Dates
const getDatesOfWeek = (weekString) => {
  if (!weekString) return {};
  const [year, week] = weekString.split('-W');
  const simple = new Date(year, 0, 1 + (week - 1) * 7);
  const dow = simple.getDay();
  const weekStart = simple;
  if (dow <= 4) weekStart.setDate(simple.getDate() - simple.getDay() + 1);
  else weekStart.setDate(simple.getDate() + 8 - simple.getDay());

  const dates = {};
  DAYS.forEach((day, index) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + index);
    dates[day] = d.toISOString().split('T')[0];
  });
  return dates;
};

export default function Presensi() {
  // --- STATE ---
  const [selectedWeek, setSelectedWeek] = useState("2025-W30");
  const [selectedClass, setSelectedClass] = useState(DATA_KELAS_DUMMY[0]?.id || "");
  const [searchSiswa, setSearchSiswa] = useState("");
  const [selectedDay, setSelectedDay] = useState("Senin");
  const [attendanceData, setAttendanceData] = useState({});
  const [weekDates, setWeekDates] = useState({});

  useEffect(() => {
    setWeekDates(getDatesOfWeek(selectedWeek));
  }, [selectedWeek]);

  const filteredSiswa = useMemo(() => {
    return DATA_SISWA_DUMMY.filter(s => {
      const matchClass = selectedClass === "all" ? true : s.class_id === Number(selectedClass);
      const matchName = s.peserta_didik.nama_lengkap.toLowerCase().includes(searchSiswa.toLowerCase());
      return matchClass && matchName;
    });
  }, [selectedClass, searchSiswa]);

  const handleStatusChange = (studentId, status) => {
    const date = weekDates[selectedDay];
    const key = `${date}_${studentId}`;
    setAttendanceData(prev => ({
      ...prev,
      [key]: { ...prev[key], status: status }
    }));
  };

  const handleNoteChange = (studentId, note) => {
    const date = weekDates[selectedDay];
    const key = `${date}_${studentId}`;
    setAttendanceData(prev => ({
      ...prev,
      [key]: { ...prev[key], note: note }
    }));
  };

  const handleMarkAllPresent = () => {
    if (!confirm(`Tandai semua siswa ${selectedDay} sebagai HADIR?`)) return;
    const date = weekDates[selectedDay];
    const newData = { ...attendanceData };
    filteredSiswa.forEach(s => {
      const key = `${date}_${s.id}`;
      if (!newData[key]?.status) newData[key] = { status: "H", note: "" };
    });
    setAttendanceData(newData);
  };

  const handleSave = () => {
    console.log("Saving Attendance:", attendanceData);
    alert("Data Presensi berhasil disimpan!");
  };

  // Stats Logic
  const dailyStats = useMemo(() => {
    const date = weekDates[selectedDay];
    const stats = { H: 0, S: 0, I: 0, A: 0, Total: 0 };
    filteredSiswa.forEach(s => {
      const key = `${date}_${s.id}`;
      const data = attendanceData[key];
      if (data?.status) stats[data.status]++;
      else stats.A++; // Asumsi default Alpha/Belum Absen
    });
    stats.Total = filteredSiswa.length;
    return stats;
  }, [attendanceData, filteredSiswa, selectedDay, weekDates]);

  const presentPercentage = dailyStats.Total > 0
    ? Math.round((dailyStats.H / dailyStats.Total) * 100)
    : 0;

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      
      {/* --- TOOLBAR SECTION --- */}
      <div className="bg-white pb-6 space-y-6">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">Input Presensi</h1>
            <p className="text-sm text-slate-500 mt-1 flex items-center gap-2">
              <CalendarDaysIcon className="h-4 w-4 text-[#e94640]" />
              {weekDates[selectedDay]
                ? new Date(weekDates[selectedDay]).toLocaleDateString("id-ID", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
                : "-"}
            </p>
          </div>
          
          {/* Stats Bar */}
          <div className="flex items-center gap-4 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
             <div className="flex flex-col items-center px-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Kehadiran</span>
                <span className="text-lg font-bold text-emerald-600">{presentPercentage}%</span>
             </div>
             <div className="h-8 w-px bg-slate-200"></div>
             <div className="flex gap-4 px-2">
                {STATUS_OPTIONS.map(st => (
                  <div key={st.id} className="flex flex-col items-center">
                    <span className={`text-[10px] font-bold ${st.text}`}>{st.id}</span>
                    <span className="text-sm font-semibold text-slate-700">{dailyStats[st.id] || 0}</span>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* --- FILTERS --- */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center border-t border-slate-100 pt-6">
          
          {/* LEFT: CLASS TABS */}
          <div className="w-full xl:w-auto overflow-x-auto pb-2 xl:pb-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kelas:</span>
              <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">

                {DATA_KELAS_DUMMY.map((k) => (
                  <button
                    key={k.id}
                    onClick={() => setSelectedClass(k.id)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all capitalize whitespace-nowrap ${
                      selectedClass === k.id
                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    {k.nama}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: WEEK PICKER & SEARCH */}
          <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto justify-end">
            <input 
                type="week" 
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)} 
                className="px-3 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] bg-white shadow-sm transition-all focus:shadow" 
            />
            <div className="relative">
                <input 
                    type="text" 
                    placeholder="Cari siswa..." 
                    value={searchSiswa} 
                    onChange={(e) => setSearchSiswa(e.target.value)} 
                    className="w-full xl:w-56 pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] focus:ring-1 focus:ring-red-200 transition-all shadow-sm focus:shadow" 
                />
                <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>
        </div>
      </div>

      {/* --- MAIN CARD --- */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mb-6">

        {/* DAY TABS (Inside Card) */}
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 no-scrollbar">
          {DAYS.map(day => {
            const dateStr = weekDates[day] || "";
            const isSelected = selectedDay === day;
            const isToday = new Date().toISOString().split('T')[0] === dateStr;
            return (
              <button 
                key={day} 
                onClick={() => setSelectedDay(day)} 
                className={`flex-1 min-w-[100px] px-4 py-3 text-center border-b-2 transition-all relative group ${
                    isSelected ? "border-[#e94640] bg-white text-[#e94640]" : "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                }`}
              >
                <div className="text-sm font-bold">{day}</div>
                <div className="text-[10px] opacity-70 group-hover:opacity-100 transition-opacity">
                    {dateStr ? new Date(dateStr).toLocaleDateString("id-ID", { day: 'numeric', month: 'short' }) : "-"}
                </div>
                {isToday && <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>}
              </button>
            )
          })}
        </div>

        {/* TABLE CONTENT */}
        <div className="flex-1 overflow-auto bg-white min-h-[400px]">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm ring-1 ring-slate-900/5">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-12 text-center">No</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-64">Nama Siswa</th>
                <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Status Kehadiran</th>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider w-64 text-left">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSiswa.map((siswa, index) => {
                const date = weekDates[selectedDay];
                const key = `${date}_${siswa.id}`;
                const data = attendanceData[key] || {};
                
                return (
                  <tr key={siswa.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-6 py-4 text-center text-sm text-slate-500 font-mono">{index + 1}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-slate-700 group-hover:text-[#e94640] transition-colors">{siswa.peserta_didik.nama_lengkap}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5">{siswa.peserta_didik.nomor_induk}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center gap-3">
                        {STATUS_OPTIONS.map((opt) => {
                          const isSelected = data.status === opt.id;
                          return (
                            <button 
                                key={opt.id} 
                                onClick={() => handleStatusChange(siswa.id, opt.id)} 
                                className={`w-9 h-9 rounded-lg flex flex-col items-center justify-center transition-all border ${
                                    isSelected 
                                    ? `${opt.color} text-white border-transparent shadow-md scale-105 ring-2 ring-offset-1 ring-offset-white ${opt.text.replace('text-', 'ring-')}` 
                                    : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50 hover:shadow-sm"
                                }`} 
                                title={opt.label}
                            >
                              <span className="text-xs font-bold">{opt.id}</span>
                            </button>
                          )
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input 
                        type="text" 
                        value={data.note || ""} 
                        onChange={(e) => handleNoteChange(siswa.id, e.target.value)} 
                        disabled={!data.status || data.status === "H"} 
                        placeholder={data.status === "S" ? "Sakit apa?" : data.status === "I" ? "Keperluan apa?" : "-"} 
                        className={`w-full border-b border-slate-200 bg-transparent py-1.5 text-sm focus:outline-none focus:border-[#e94640] transition-all placeholder:text-slate-300 ${
                            (!data.status || data.status === "H") ? "cursor-not-allowed bg-slate-50/30 text-slate-300 border-transparent" : "bg-white"
                        }`} 
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filteredSiswa.length === 0 && (
            <div className="py-20 text-center flex flex-col items-center justify-center text-slate-400">
              <FunnelIcon className="h-12 w-12 mb-3 opacity-20" />
              <p className="text-sm">Tidak ada siswa ditemukan.</p>
            </div>
          )}
        </div>

        {/* --- FOOTER ACTIONS --- */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
            <div className="text-xs text-slate-400 font-medium">
                Total Siswa: <span className="text-slate-700 font-bold">{filteredSiswa.length}</span>
            </div>
            <div className="flex gap-3">
                <button
                    onClick={handleMarkAllPresent}
                    className="px-4 py-2 bg-white text-emerald-700 text-xs font-bold rounded-lg border border-emerald-200 hover:bg-emerald-50 hover:shadow-sm transition-all flex items-center gap-2"
                >
                    <CheckCircleIcon className="h-4 w-4" /> Tandai Semua Hadir
                </button>      
                <button
                    onClick={handleSave}
                    className="px-6 py-2 bg-[#e94640] text-white text-xs font-bold rounded-lg shadow-sm hover:bg-[#d63d38] hover:shadow transition-all flex items-center gap-2"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Simpan Data
                </button>
            </div>
        </div>

      </div>
    </div>
  );
}