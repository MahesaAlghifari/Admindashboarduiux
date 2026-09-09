import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PauseCircleIcon,
  LockClosedIcon,
  PencilSquareIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAttendanceSheet,
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  saveAttendanceBulk,
} from "../../../api/kegiatan";
import { fetchSchoolWeekStatuses } from "../../../api/school-calendar";
import {SectionHeader} from "../../../components/common/DesignSystem";
import {apiErrorMessage} from "../../../lib/apiError";
import {KegiatanDialog,useKegiatanDialog} from "../components/KegiatanDialog";
import { useAuth } from "../../../auth/useAuth";
import { classroomScopeForUser, isTeacherAccount, resolveSelectedClass } from "../classroomScope";
import { studentClassroomMeta, studentGenderLabel } from "../tableUtils";

const ALL_CLASSES="__all__";

const DAYS = [
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
];

const STATUS_OPTIONS = [
  {
    id: "H",
    label: "Hadir",
    color: "bg-emerald-500",
    text: "text-emerald-700",
    border: "border-emerald-200",
    bgLight: "bg-emerald-50",
  },
  {
    id: "S",
    label: "Sakit",
    color: "bg-blue-500",
    text: "text-blue-700",
    border: "border-blue-200",
    bgLight: "bg-blue-50",
  },
  {
    id: "I",
    label: "Izin",
    color: "bg-amber-500",
    text: "text-amber-700",
    border: "border-amber-200",
    bgLight: "bg-amber-50",
  },
  {
    id: "A",
    label: "Alpa",
    color: "bg-rose-500",
    text: "text-rose-700",
    border: "border-rose-200",
    bgLight: "bg-rose-50",
  },
];

const text = (value) =>
  String(value ?? "").trim();

const errorOf=(error,action="memproses")=>apiErrorMessage(error,{action,subject:"presensi"});

const localDate = (date) => {
  const year = date.getFullYear();
  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");
  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

const preferredAttendanceDate = (dateString, period) => {
  const value = String(dateString || "").slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekday = date.getDay();
  if (weekday === 6) date.setDate(date.getDate() - 1);
  if (weekday === 0) date.setDate(date.getDate() - 2);

  let result = localDate(date);
  const start = String(period?.tanggal_mulai || "").slice(0, 10);
  const end = String(period?.tanggal_selesai || "").slice(0, 10);

  if (start && result < start) {
    const [sy, sm, sd] = start.split("-").map(Number);
    const forward = new Date(sy, sm - 1, sd);
    while ([0, 6].includes(forward.getDay())) forward.setDate(forward.getDate() + 1);
    result = localDate(forward);
  }
  if (end && result > end) {
    const [ey, em, ed] = end.split("-").map(Number);
    const backward = new Date(ey, em - 1, ed);
    while ([0, 6].includes(backward.getDay())) backward.setDate(backward.getDate() - 1);
    result = localDate(backward);
  }

  return result;
};

const getCurrentIsoWeek = () => {
  const now = new Date();
  const date = new Date(
    Date.UTC(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    )
  );
  const day = date.getUTCDay() || 7;

  date.setUTCDate(
    date.getUTCDate() + 4 - day
  );

  const yearStart = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1)
  );

  const week = Math.ceil(
    (((date - yearStart) / 86400000) + 1) /
      7
  );

  return `${date.getUTCFullYear()}-W${String(
    week
  ).padStart(2, "0")}`;
};

const dateToIsoWeek = (dateString) => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(
    String(dateString || "")
  );
  if (!match) return "";

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
  );
  const day = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - day);
  const yearStart = new Date(
    Date.UTC(date.getUTCFullYear(), 0, 1)
  );
  const week = Math.ceil(
    (((date - yearStart) / 86400000) + 1) / 7
  );

  return `${date.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

const dateInPeriod = (dateString, period) => {
  const value = String(dateString || "").slice(0, 10);
  if (!value || !period) return false;

  const start = String(period.tanggal_mulai || "").slice(0, 10);
  const end = String(period.tanggal_selesai || "").slice(0, 10);

  if (start && value < start) return false;
  if (end && value > end) return false;
  return true;
};

const getDatesOfWeek = (weekString) => {
  const match =
    /^(\d{4})-W(\d{2})$/.exec(
      weekString || ""
    );

  if (!match) return {};

  const year = Number(match[1]);
  const week = Number(match[2]);
  const januaryFourth = new Date(
    year,
    0,
    4
  );
  const day =
    januaryFourth.getDay() || 7;
  const monday = new Date(
    januaryFourth
  );

  monday.setDate(
    januaryFourth.getDate() -
      day +
      1 +
      (week - 1) * 7
  );

  return DAYS.reduce(
    (result, dayName, index) => {
      const date = new Date(monday);
      date.setDate(
        monday.getDate() + index
      );
      result[dayName] =
        localDate(date);
      return result;
    },
    {}
  );
};

const formatDisplayDate = (
  dateString,
  options
) => {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      dateString || ""
    )
  ) {
    return "-";
  }

  const [year, month, day] =
    dateString.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "id-ID",
    options
  );
};

export default function Presensi() {
  const { user } = useAuth();
  const teacherMode = isTeacherAccount(user);
  const [selectedWeek, setSelectedWeek] =
    useState(getCurrentIsoWeek);
  const [selectedClass, setSelectedClass] =
    useState(() => teacherMode ? "" : ALL_CLASSES);
  const [searchSiswa, setSearchSiswa] =
    useState("");
  const [selectedDay, setSelectedDay] =
    useState("Senin");
  const [classes, setClasses] =
    useState([]);
  const [activePeriod, setActivePeriod] =
    useState(null);
  const [students, setStudents] =
    useState([]);
  const [
    attendanceData,
    setAttendanceData,
  ] = useState({});
  const [holidayInfo, setHolidayInfo] =
    useState(null);
  const [weekStatuses, setWeekStatuses] =
    useState({});
  const [loading, setLoading] =
    useState(true);
  const [saving, setSaving] =
    useState(false);
  const [error, setError] =
    useState("");
  const [savedCount, setSavedCount] =
    useState(0);
  const [savedStudentIds, setSavedStudentIds] =
    useState(() => new Set());
  const [previousClassAttendance,setPreviousClassAttendance]=useState({});
  const [originalAttendanceData, setOriginalAttendanceData] =
    useState({});
  const [editUnlocked, setEditUnlocked] =
    useState(false);
  const {dialog,notify,confirm,close}=useKegiatanDialog();

  const weekDates = useMemo(
    () => getDatesOfWeek(selectedWeek),
    [selectedWeek]
  );

  const selectedDate =
    weekDates[selectedDay] || "";

  const selectedDateAllowed =
    dateInPeriod(
      selectedDate,
      activePeriod
    );

  const selectedCalendarStatus =
    weekStatuses[selectedDate] || null;
  const displayHolidayInfo =
    holidayInfo ||
    (selectedCalendarStatus?.is_holiday
      ? {
          label: selectedCalendarStatus.label || "Hari Libur",
          description: selectedCalendarStatus.description || "Tidak ada presensi pada hari libur.",
        }
      : null);
  const selectedDateHoliday =
    Boolean(displayHolidayInfo);
  const todayDate = localDate(new Date());
  const selectedDateFuture =
    Boolean(selectedDate && selectedDate > todayDate);
  const hasSavedAttendance = savedCount > 0;
  const attendanceComplete =
    students.length > 0 && savedCount >= students.length;
  const sheetLocked =
    attendanceComplete && !editUnlocked;
  const editingDisabled =
    !selectedDateAllowed ||
    selectedDateHoliday ||
    selectedDateFuture ||
    sheetLocked;

  const minWeek = dateToIsoWeek(
    activePeriod?.tanggal_mulai
  );
  const maxWeek = dateToIsoWeek(
    activePeriod?.tanggal_selesai
  );

  const loadClasses =
    useCallback(async () => {
      try {
        const [items, period] =
          await Promise.all([
            fetchKegiatanClassrooms(),
            fetchKegiatanCurrentAcademicPeriod(),
          ]);

        const scope = classroomScopeForUser(user, items);
        setClasses(scope.classes);
        setActivePeriod(period);

        const today = localDate(new Date());
        const periodStart = String(period?.tanggal_mulai || "").slice(0, 10);
        const periodEnd = String(period?.tanggal_selesai || "").slice(0, 10);
        const clampedDate =
          periodStart && today < periodStart
            ? periodStart
            : periodEnd && today > periodEnd
              ? periodEnd
              : today;
        const anchorDate = preferredAttendanceDate(clampedDate, period);

        if (anchorDate) {
          const nextWeek =
            dateToIsoWeek(anchorDate);
          if (nextWeek) {
            setSelectedWeek(nextWeek);
          }

          const dayIndex =
            new Date(
              `${anchorDate}T00:00:00`
            ).getDay();
          const dayName =
            DAYS[dayIndex - 1];
          if (dayName) {
            setSelectedDay(dayName);
          }
        }

        setSelectedClass((current) =>
          resolveSelectedClass(current, scope, ALL_CLASSES)
        );
      } catch (loadError) {
        setError(errorOf(loadError));
      }
    }, [user]);

  const loadAttendance =
    useCallback(async () => {
      if (
        selectedClass === "" ||
        !selectedDate ||
        !selectedDateAllowed
      ) {
        setStudents([]);
        setAttendanceData({});
        setHolidayInfo(null);
        setSavedCount(0);
        setSavedStudentIds(new Set());
        setPreviousClassAttendance({});
        setOriginalAttendanceData({});
        setEditUnlocked(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const allClasses=selectedClass===ALL_CLASSES;
        const targetClasses=allClasses?classes:classes.filter(item=>String(item.id)===String(selectedClass));
        if(allClasses&&!targetClasses.length){setStudents([]);setAttendanceData({});setHolidayInfo(null);setSavedCount(0);setSavedStudentIds(new Set());setPreviousClassAttendance({});setOriginalAttendanceData({});setEditUnlocked(false);return;}
        const sheets=allClasses?await Promise.all(targetClasses.map(classroom=>fetchAttendanceSheet({classroom_id:classroom.id,tanggal:selectedDate}))):[await fetchAttendanceSheet({classroom_id:selectedClass,tanggal:selectedDate})];
        const studentMap=new Map();
        sheets.forEach((sheet,index)=>{const classroom=targetClasses[index]||classes.find(item=>String(item.id)===String(sheet.classroom_id));sheet.items.forEach(item=>{const normalized={...item,classroom_id:item.classroom_id??classroom?.id??sheet.classroom_id,classroom_name:item.classroom_name||classroom?.nama_kelas||""},key=String(item.id),existing=studentMap.get(key);if(!existing||String(normalized.classroom_id)===String(sheet.classroom_id))studentMap.set(key,normalized);});});
        const mergedItems=[...studentMap.values()].sort((left,right)=>text(left.classroom_name).localeCompare(text(right.classroom_name),"id",{numeric:true,sensitivity:"base"})||text(left.nama_lengkap).localeCompare(text(right.nama_lengkap),"id",{sensitivity:"base"}));
        const holidaySheet=sheets.find(sheet=>sheet.is_holiday);
        setStudents(mergedItems);
        setHolidayInfo(holidaySheet?{label:holidaySheet.holiday_label||"Hari Libur",description:holidaySheet.holiday_description||"Tidak ada presensi pada hari libur."}:null);
        setEditUnlocked(false);
        const next={},persistedIds=new Set(),previousSources={};
        mergedItems.forEach(item=>{const key=`${selectedDate}_${item.id}`,status=item.attendance?.status||"",sourceId=item.attendance?.classroom_id,crossClass=Boolean(item.attendance?.is_cross_class)||(sourceId!==null&&sourceId!==undefined&&String(sourceId)!==String(item.classroom_id));next[key]={status,note:item.attendance?.keterangan||""};if(status){persistedIds.add(String(item.id));if(crossClass)previousSources[String(item.id)]=item.attendance?.classroom_name||"Kelas sebelumnya/lainnya";}});
        setSavedCount(persistedIds.size);
        setAttendanceData(next);
        setOriginalAttendanceData(next);
        setSavedStudentIds(persistedIds);
        setPreviousClassAttendance(previousSources);
      } catch (loadError) {
        setStudents([]);
        setAttendanceData({});
        setHolidayInfo(null);
        setSavedCount(0);
        setSavedStudentIds(new Set());
        setPreviousClassAttendance({});
        setOriginalAttendanceData({});
        setEditUnlocked(false);
        setError(errorOf(loadError));
      } finally {
        setLoading(false);
      }
    }, [
      classes,
      selectedClass,
      selectedDate,
      selectedDateAllowed,
    ]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    const monday = weekDates.Senin;
    if (!monday) {
      setWeekStatuses({});
      return;
    }

    let cancelled = false;
    fetchSchoolWeekStatuses(monday)
      .then((statuses) => {
        if (cancelled) return;
        setWeekStatuses(
          Object.fromEntries(statuses.map((status) => [status.date, status]))
        );
      })
      .catch(() => {
        if (!cancelled) setWeekStatuses({});
      });

    return () => {
      cancelled = true;
    };
  }, [weekDates]);

  useEffect(() => {
    loadAttendance();
  }, [loadAttendance]);

  const filteredSiswa = useMemo(() => {
    const query =
      searchSiswa
        .trim()
        .toLowerCase();

    if (!query) return students;

    return students.filter(
      (student) =>
        student.nama_lengkap
          .toLowerCase()
          .includes(query) ||
        student.nomor_induk
          .toLowerCase()
          .includes(query) ||
        student.nisn
          .toLowerCase()
          .includes(query)
    );
  }, [students, searchSiswa]);

  const previousClassStudentIds=useMemo(()=>new Set(Object.keys(previousClassAttendance)),[previousClassAttendance]);
  const editableSavedCount=useMemo(()=>[...savedStudentIds].filter(id=>!previousClassStudentIds.has(String(id))).length,[savedStudentIds,previousClassStudentIds]);
  const rowLocked=studentId=>previousClassStudentIds.has(String(studentId))||(savedStudentIds.has(String(studentId))&&!editUnlocked);

  const handleStatusChange=(studentId,status)=>{
    if(editingDisabled||rowLocked(studentId))return;
    const key=`${selectedDate}_${studentId}`;
    setAttendanceData(previous=>({...previous,[key]:{...previous[key],status,note:status==="H"?"":previous[key]?.note||""}}));
  };

  const handleNoteChange=(studentId,note)=>{
    if(editingDisabled||rowLocked(studentId))return;
    const key=`${selectedDate}_${studentId}`;
    setAttendanceData(previous=>({...previous,[key]:{...previous[key],note}}));
  };

  const handleMarkAllPresent=async()=>{
    if(editingDisabled)return;
    const targets=filteredSiswa.filter(student=>!rowLocked(student.id));
    if(!targets.length){notify({type:"info",title:"Tidak Ada Data yang Bisa Diubah",message:"Semua presensi pada tampilan ini sudah tersimpan. Klik Edit Presensi jika ingin mengubahnya."});return;}
    const approved=await confirm({title:"Tandai Semua Hadir",message:`Tandai ${targets.length} siswa yang dapat diedit pada ${selectedDay} sebagai Hadir?`,confirmLabel:"Tandai Hadir"});
    if(!approved)return;
    setAttendanceData(previous=>{const next={...previous};targets.forEach(student=>{next[`${selectedDate}_${student.id}`]={status:"H",note:""};});return next;});
  };

  const handleUnlock=async()=>{
    if(!hasSavedAttendance||selectedDateHoliday||selectedDateFuture)return;
    if(!editableSavedCount){notify({type:"info",title:"Presensi Sudah Terisi",message:"Presensi siswa pada tanggal ini sudah tercatat di kelas sebelumnya atau kelas lain dan tetap dikunci agar tidak membuat data ganda."});return;}
    const approved=await confirm({title:"Edit Presensi",message:`Presensi ${selectedDay}, ${formatDisplayDate(selectedDate,{day:"numeric",month:"long",year:"numeric"})} sudah memiliki data tersimpan. Aktifkan mode edit untuk mengubah presensi kelas aktif? Presensi dari kelas sebelumnya tetap dikunci.`,confirmLabel:"Edit Presensi"});
    if(approved)setEditUnlocked(true);
  };

  const handleRelock=async()=>{
    if(!editUnlocked)return;
    const approved=await confirm({title:"Batalkan Edit Presensi",message:"Batalkan perubahan yang belum disimpan dan kembalikan data presensi ke kondisi terakhir?",confirmLabel:"Batalkan Edit"});
    if(!approved)return;
    setEditUnlocked(false);
    await loadAttendance();
  };

  const handleSave=async()=>{
    if(saving||selectedClass===""||!selectedDate||!selectedDateAllowed||selectedDateHoliday||selectedDateFuture||sheetLocked)return;
    const missingStudents=students.filter(student=>!attendanceData[`${selectedDate}_${student.id}`]?.status);
    if(missingStudents.length){notify({type:"warning",title:"Presensi Belum Lengkap",message:`Masih ada ${missingStudents.length} siswa yang belum diisi. Lengkapi seluruh status presensi sebelum menyimpan.`});return;}

    const changed=students.filter(student=>{
      const key=`${selectedDate}_${student.id}`;
      const current=attendanceData[key]||{};
      const original=originalAttendanceData[key]||{};
      const studentId=String(student.id),persisted=savedStudentIds.has(studentId);
      if(previousClassStudentIds.has(studentId))return false;
      if(!persisted)return Boolean(current.status);
      if(!editUnlocked)return false;
      return current.status!==original.status||String(current.note||"")!==String(original.note||"");
    });

    if(!changed.length){notify({type:"info",title:"Tidak Ada Perubahan",message:"Tidak ada data presensi baru atau perubahan yang perlu disimpan."});return;}

    const newCount=changed.filter(student=>!savedStudentIds.has(String(student.id))).length;
    const updatedCount=changed.length-newCount;
    setSaving(true);
    try{
      const groups=selectedClass===ALL_CLASSES?[...changed.reduce((map,student)=>{const classroomId=student.classroom_id,key=String(classroomId??"");if(!key||key==="null")return map;if(!map.has(key))map.set(key,{classroom_id:classroomId,students:[]});map.get(key).students.push(student);return map;},new Map()).values()]:[{classroom_id:selectedClass,students:changed}];
      if(!groups.length)throw new Error("Kelas siswa tidak dapat ditentukan. Muat ulang data lalu coba kembali.");
      const results=await Promise.allSettled(groups.map(group=>{const groupItems=group.students.map(student=>{const current=attendanceData[`${selectedDate}_${student.id}`];return{student_id:student.id,status:current.status,keterangan:current.note||""};}),locked=students.filter(student=>String(student.classroom_id)===String(group.classroom_id)&&previousClassStudentIds.has(String(student.id))).map(student=>student.id);return saveAttendanceBulk({classroom_id:group.classroom_id,tanggal:selectedDate,allow_update:editUnlocked,locked_student_ids:locked,items:groupItems});}));
      const failed=results.map((result,index)=>({result,group:groups[index]})).filter(item=>item.result.status==="rejected");
      await loadAttendance();
      if(failed.length){const names=failed.map(item=>classes.find(classroom=>String(classroom.id)===String(item.group.classroom_id))?.nama_kelas||`Kelas ${item.group.classroom_id}`),reason=failed[0]?.result?.reason;notify({type:"error",title:"Sebagian Presensi Gagal Disimpan",message:`Gagal pada ${names.join(", ")}. ${errorOf(reason,editUnlocked?"memperbarui":"menyimpan")}`});return;}
      const title=updatedCount?"Presensi Berhasil Diperbarui":hasSavedAttendance?"Presensi Berhasil Dilengkapi":"Presensi Berhasil Disimpan",parts=[];
      if(newCount)parts.push(`${newCount} siswa ditambahkan`);
      if(updatedCount)parts.push(`${updatedCount} siswa diperbarui`);
      notify({type:"success",title,message:`${parts.join(" dan ")}. Data presensi sekarang mengikuti hasil tersimpan terbaru.`});
    }catch(saveError){
      notify({type:"error",title:editUnlocked?"Presensi Gagal Diperbarui":"Presensi Gagal Disimpan",message:errorOf(saveError,editUnlocked?"memperbarui":"menyimpan")});
    }finally{setSaving(false);}
  };

  const dailyStats = useMemo(() => {
    const stats = {
      H: 0,
      S: 0,
      I: 0,
      A: 0,
      Total: filteredSiswa.length,
    };

    filteredSiswa.forEach(
      (student) => {
        const key = `${selectedDate}_${student.id}`;
        const current =
          attendanceData[key];

        if (
          current?.status &&
          Object.prototype.hasOwnProperty.call(
            stats,
            current.status
          )
        ) {
          stats[current.status] += 1;
        }
      }
    );

    return stats;
  }, [
    attendanceData,
    filteredSiswa,
    selectedDate,
  ]);

  const presentPercentage =
    dailyStats.Total > 0
      ? Math.round(
          (dailyStats.H /
            dailyStats.Total) *
            100
        )
      : 0;

  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <SectionHeader icon={CalendarDaysIcon} title="Catat Presensi" description={selectedDate?formatDisplayDate(selectedDate,{weekday:"long",day:"numeric",month:"long",year:"numeric"}):"Pilih kelas dan minggu untuk mencatat presensi."} actions={selectedDateHoliday?<span className="rounded-lg border border-amber-200 bg-amber-50 px-2.5 py-1.5 text-[10px] font-semibold text-amber-700">Hari Libur</span>:<div className="flex flex-wrap items-center gap-2"><span className="rounded-lg border border-emerald-100 bg-emerald-50 px-2.5 py-1.5 text-[10px] font-semibold text-emerald-700">Hadir {presentPercentage}%</span>{STATUS_OPTIONS.map(status=><span key={status.id} className={`rounded-lg border px-2.5 py-1.5 text-[10px] font-semibold ${status.border} ${status.bgLight} ${status.text}`}>{status.id} {dailyStats[status.id]||0}</span>)}</div>}/>
      <div className="mt-4 flex flex-col gap-3 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <select value={selectedClass} onChange={event=>setSelectedClass(event.target.value)} disabled={teacherMode&&classes.length<=1} className="ui-compact-control min-w-44 disabled:cursor-not-allowed disabled:bg-slate-100" aria-label="Filter kelas">
            {!teacherMode&&<option value={ALL_CLASSES}>Semua Kelas</option>}
            {teacherMode&&classes.length===0&&<option value="">Belum ada kelas yang ditugaskan</option>}
            {classes.map(classroom=><option key={classroom.id} value={classroom.id}>{classroom.nama_kelas}</option>)}
          </select>
          <input type="week" value={selectedWeek} min={minWeek||undefined} max={maxWeek||undefined} onChange={event=>setSelectedWeek(event.target.value)} className="ui-compact-control"/>
        </div>
        {!selectedDateHoliday&&<div className="relative w-full xl:w-64"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input type="text" placeholder="Cari nama siswa..." value={searchSiswa} onChange={event=>setSearchSiswa(event.target.value)} className="ui-compact-control w-full pl-9"/></div>}
      </div>

      <div className="ui-table-card mt-4 flex flex-1 flex-col">
        <div className="flex overflow-x-auto border-b border-slate-100 bg-slate-50/50 no-scrollbar">
          {DAYS.map((day) => {
            const dateStr =
              weekDates[day] || "";
            const isSelected =
              selectedDay === day;
            const isToday =
              localDate(new Date()) ===
              dateStr;
            const allowed =
              dateInPeriod(
                dateStr,
                activePeriod
              );
            const dayStatus =
              weekStatuses[dateStr];
            const dayHoliday =
              Boolean(dayStatus?.is_holiday);

            return (
              <button
                type="button"
                key={day}
                disabled={!dateStr}
                onClick={() =>
                  setSelectedDay(day)
                }
                className={`flex-1 min-w-25 px-4 py-3 text-center border-b-2 transition-all relative group ${
                  isSelected
                    ? dayHoliday
                      ? "border-amber-400 bg-amber-50 text-amber-700"
                      : "border-[#e94640] bg-white text-[#e94640]"
                    : dayHoliday
                      ? "border-transparent bg-amber-50/40 text-amber-600 hover:bg-amber-50"
                      : allowed
                        ? "border-transparent text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                        : "border-transparent bg-slate-50 text-slate-400"
                }`}
              >
                <div className="text-sm font-bold">
                  {day}
                </div>
                <div className="text-[10px] opacity-70 group-hover:opacity-100 transition-opacity">
                  {dateStr
                    ? formatDisplayDate(
                        dateStr,
                        {
                          day: "numeric",
                          month:
                            "short",
                        }
                      )
                    : "-"}
                </div>
                {dayHoliday && (
                  <div className="mt-1 text-[9px] font-bold text-amber-600">
                    {dayStatus?.label || "Libur"}
                  </div>
                )}
                {isToday && (
                  <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                )}
              </button>
            );
          })}
        </div>

        {displayHolidayInfo?<div className="flex min-h-100 flex-1 items-center justify-center bg-white px-6 py-16 text-center"><div className="max-w-md"><span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl border border-amber-200 bg-amber-50 text-amber-600"><PauseCircleIcon className="h-6 w-6"/></span><h3 className="mt-3 text-sm font-semibold text-slate-700">{displayHolidayInfo.label}</h3>{displayHolidayInfo.description&&<p className="mt-1 text-[11px] leading-5 text-slate-400">{displayHolidayInfo.description}</p>}<p className="mt-2 text-[11px] font-medium text-amber-600">Presensi tidak perlu diisi pada hari libur.</p></div></div>:<>

        {selectedDateFuture && (
          <div className="mx-5 mt-5 flex items-start gap-3 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3">
            <CalendarDaysIcon className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
            <div>
              <p className="text-sm font-bold text-sky-800">Tanggal Belum Berlangsung</p>
              <p className="mt-1 text-xs leading-5 text-sky-700">
                Presensi hanya dapat diisi untuk hari ini atau tanggal sebelumnya yang masih berada di periode akademik aktif.
              </p>
            </div>
          </div>
        )}

        {!displayHolidayInfo&&!selectedDateFuture&&hasSavedAttendance&&(
          <div className={`mx-5 mt-5 flex items-start justify-between gap-4 rounded-xl border px-4 py-3 ${editUnlocked?"border-amber-200 bg-amber-50":attendanceComplete?"border-emerald-200 bg-emerald-50":"border-sky-200 bg-sky-50"}`}>
            <div className="flex min-w-0 items-start gap-3">
              {editUnlocked?<PencilSquareIcon className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"/>:<LockClosedIcon className={`mt-0.5 h-5 w-5 shrink-0 ${attendanceComplete?"text-emerald-600":"text-sky-600"}`}/>}
              <div>
                <p className={`text-sm font-bold ${editUnlocked?"text-amber-800":attendanceComplete?"text-emerald-800":"text-sky-800"}`}>{editUnlocked?"Mode Edit Presensi":attendanceComplete?"Presensi Sudah Terisi":"Presensi Terisi Sebagian"}</p>
                <p className={`mt-1 text-xs leading-5 ${editUnlocked?"text-amber-700":attendanceComplete?"text-emerald-700":"text-sky-700"}`}>{editUnlocked?"Data yang sudah tersimpan sekarang dapat diubah. Simpan perubahan setelah selesai.":attendanceComplete?`${savedCount}/${students.length} siswa sudah tersimpan. Klik Edit Presensi jika ingin mengubah data yang sudah ada.`:`${savedCount}/${students.length} siswa sudah tersimpan dan otomatis terkunci. Lengkapi siswa yang belum terisi, atau klik Edit Presensi untuk mengubah data tersimpan.`}</p>
              </div>
            </div>
            <button type="button" onClick={editUnlocked?handleRelock:handleUnlock} disabled={loading||saving} className={`inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border bg-white px-3 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${editUnlocked?"border-amber-300 text-amber-700 hover:bg-amber-100":attendanceComplete?"border-emerald-300 text-emerald-700 hover:bg-emerald-100":"border-sky-300 text-sky-700 hover:bg-sky-100"}`}>
              {editUnlocked?<XMarkIcon className="h-4 w-4"/>:<PencilSquareIcon className="h-4 w-4"/>}
              {editUnlocked?"Batalkan Edit":"Edit Presensi"}
            </button>
          </div>
        )}

        <div className="flex-1 overflow-auto bg-white min-h-100">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="sticky top-0 z-10 bg-slate-50/80">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-12">No</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-48">Nama Siswa</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">NIS</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-14">L/P</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">Kelas</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-40">Wali Kelas</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-44">Status Kehadiran</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-52">Keterangan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan="8" className="px-3 py-16 text-center text-sm text-slate-400"><span className="inline-flex items-center gap-2"><ArrowPathIcon className="h-4 w-4 animate-spin" />Memuat data presensi...</span></td></tr>
              ) : error ? (
                <tr><td colSpan="8" className="px-3 py-16 text-center"><p className="text-sm text-rose-500">{error}</p><button type="button" onClick={loadAttendance} className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]">Muat ulang</button></td></tr>
              ) : filteredSiswa.length ? (
                filteredSiswa.map((siswa, index) => {
                  const key = `${selectedDate}_${siswa.id}`;
                  const data = attendanceData[key] || {};
                  const rowDisabled = editingDisabled || rowLocked(siswa.id);
                  const meta = studentClassroomMeta(classes, siswa);

                  return (
                    <tr key={siswa.id} className="group transition-colors hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-center text-sm font-mono text-slate-500">{index + 1}</td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-700 transition-colors group-hover:text-[#e94640]">{siswa.nama_lengkap || "-"}</td>
                      <td className="px-3 py-2.5 text-sm font-mono text-slate-500 whitespace-nowrap">{siswa.nomor_induk || siswa.nisn || "-"}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">{studentGenderLabel(siswa.jenis_kelamin)}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.classroomName}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.homeroomTeacherName}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex justify-center gap-2">
                          {STATUS_OPTIONS.map((option) => {
                            const isSelected = data.status === option.id;
                            return (
                              <button type="button" key={option.id} disabled={rowDisabled} onClick={() => handleStatusChange(siswa.id, option.id)} className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-all ${isSelected ? `${option.color} text-white border-transparent` : "bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:bg-slate-50"} disabled:cursor-not-allowed disabled:opacity-40`} title={option.label}>
                                <span className="text-xs font-bold">{option.id}</span>
                              </button>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <input type="text" value={data.note || ""} onChange={(event) => handleNoteChange(siswa.id, event.target.value)} disabled={rowDisabled || !data.status || data.status === "H"} placeholder={data.status === "S" ? "Sakit apa?" : data.status === "I" ? "Keperluan apa?" : "-"} className={`w-full border-b border-slate-200 bg-transparent py-1 text-sm transition-all placeholder:text-slate-300 focus:border-[#e94640] focus:outline-none ${!data.status || data.status === "H" ? "cursor-not-allowed border-transparent bg-slate-50/30 text-slate-300" : "bg-white"}`} />
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="8" className="px-3 py-16 text-center text-slate-400"><FunnelIcon className="mx-auto mb-3 h-10 w-10 opacity-20"/><span className="text-sm">Tidak ada siswa ditemukan.</span></td></tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-between items-center">
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 font-medium">
            <span>
              Total Siswa:{" "}
              <span className="text-slate-700 font-bold">
                {filteredSiswa.length}
              </span>
            </span>
            {hasSavedAttendance&&!selectedDateHoliday&&<span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold ${editUnlocked?"bg-amber-100 text-amber-700":attendanceComplete?"bg-emerald-100 text-emerald-700":"bg-sky-100 text-sky-700"}`}>{editUnlocked?<PencilSquareIcon className="h-3.5 w-3.5"/>:<LockClosedIcon className="h-3.5 w-3.5"/>}{editUnlocked?"Mode Edit":attendanceComplete?"Terisi":`${savedCount}/${students.length} Terisi`}</span>}
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={
                handleMarkAllPresent
              }
              disabled={
                loading ||
                saving ||
                filteredSiswa.length ===
                  0 ||
                editingDisabled
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircleIcon className="h-4 w-4" />
              Tandai Semua Hadir
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                loading ||
                saving ||
                students.length === 0 ||
                editingDisabled
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowDownTrayIcon className="h-4 w-4" />
              )}
              {saving?"Menyimpan...":editUnlocked?"Simpan Perubahan":hasSavedAttendance?"Lengkapi Presensi":"Simpan Data"}
            </button>
          </div>
        </div>
        </>}
      </div>
      <KegiatanDialog dialog={dialog} onClose={close}/>
    </div>
  );
}
