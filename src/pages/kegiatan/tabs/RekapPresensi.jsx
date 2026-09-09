import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowPathIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  EyeIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  fetchAttendanceFillDates,
  fetchAttendanceRecap,
  fetchStudentAttendanceHistory,
  fetchKegiatanClassrooms,
  fetchKegiatanCurrentAcademicPeriod,
  updateStudentAttendanceHistory,
} from "../../../api/kegiatan";
import {SectionHeader} from "../../../components/common/DesignSystem";
import Pagination from "../../../components/common/Pagination";
import {apiErrorMessage} from "../../../lib/apiError";
import { fallbackAcademicSemester, fallbackAcademicYear, resolveAcademicYear } from "../../../lib/academicYear";
import {KegiatanDialog,useKegiatanDialog} from "../components/KegiatanDialog";
import { useAuth } from "../../../auth/useAuth";
import { classroomScopeForUser, isTeacherAccount, resolveSelectedClass } from "../classroomScope";
import { studentClassroomMeta, studentGenderLabel } from "../tableUtils";


const attendanceLabel=status=>({H:"Hadir",S:"Sakit",I:"Izin",A:"Alpa"}[status]||status||"-");

const text = (value) =>
  String(value ?? "").trim();

const errorOf=error=>apiErrorMessage(error,{action:"memproses",subject:"data kegiatan"});

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

const getCurrentMonth = () => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
};

const getWeekRange = (weekString) => {
  const match =
    /^(\d{4})-W(\d{2})$/.exec(
      weekString || ""
    );

  if (!match) {
    return {
      dari: "",
      sampai: "",
    };
  }

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

  const friday = new Date(monday);
  friday.setDate(
    monday.getDate() + 4
  );

  return {
    dari: localDate(monday),
    sampai: localDate(friday),
  };
};

const getMonthRange = (monthString) => {
  const match =
    /^(\d{4})-(\d{2})$/.exec(
      monthString || ""
    );

  if (!match) {
    return {
      dari: "",
      sampai: "",
    };
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const first = new Date(
    year,
    month - 1,
    1
  );
  const last = new Date(
    year,
    month,
    0
  );

  return {
    dari: localDate(first),
    sampai: localDate(last),
  };
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

const maxDate = (left, right) =>
  !left ? right : !right ? left : left > right ? left : right;

const minDate = (left, right) =>
  !left ? right : !right ? left : left < right ? left : right;

const formatDate = (dateString) => {
  const value =
    text(dateString).slice(0, 10);

  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    return "-";
  }

  const [year, month, day] =
    value.split("-").map(Number);

  return new Date(
    year,
    month - 1,
    day
  ).toLocaleDateString(
    "id-ID",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
};

export default function RekapPresensi() {
  const { user } = useAuth();
  const teacherMode = isTeacherAccount(user);
  const now = new Date();

  const [filterType, setFilterType] =
    useState("weekly");
  const [
    selectedClass,
    setSelectedClass,
  ] = useState(() => teacherMode ? "" : "all");
  const [
    searchSiswa,
    setSearchSiswa,
  ] = useState("");
  const [
    debouncedSearch,
    setDebouncedSearch,
  ] = useState("");
  const [
    isModalOpen,
    setIsModalOpen,
  ] = useState(false);
  const [
    selectedStudent,
    setSelectedStudent,
  ] = useState(null);
  const [
    selectedWeek,
    setSelectedWeek,
  ] = useState(getCurrentIsoWeek);
  const [
    selectedMonth,
    setSelectedMonth,
  ] = useState(getCurrentMonth);
  const [
    selectedSemester,
    setSelectedSemester,
  ] = useState(
    fallbackAcademicSemester() === 2
      ? "genap"
      : "ganjil"
  );
  const [
    selectedYear,
    setSelectedYear,
  ] = useState(
    fallbackAcademicYear()
  );
  const [classes, setClasses] =
    useState([]);
  const [activePeriod, setActivePeriod] =
    useState(null);
  const [data, setData] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [page, setPage] =
    useState(1);
  const [pageSize, setPageSize] =
    useState(10);
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [fillDates,setFillDates]=useState([]);
  const [fillLoading,setFillLoading]=useState(false);
  const [fillError,setFillError]=useState("");
  const [studentHistory,setStudentHistory]=useState([]);
  const [historyStats,setHistoryStats]=useState(null);
  const [historyLoading,setHistoryLoading]=useState(false);
  const [historyError,setHistoryError]=useState("");
  const [historyClassSummary,setHistoryClassSummary]=useState([]);
  const [historyVersion,setHistoryVersion]=useState(0);
  const [editHistory,setEditHistory]=useState(null);
  const [editSaving,setEditSaving]=useState(false);
  const {dialog,notify,confirm,close}=useKegiatanDialog();
  const historyGroups=useMemo(()=>{
    const map=new Map(),currentId=String(selectedStudent?.classroom_id??"");
    historyClassSummary.forEach(item=>{const key=String(item.classroom_id??item.classroom_name);map.set(key,{classroom_id:item.classroom_id,classroom_name:item.classroom_name,total:Number(item.total||0),items:[]});});
    studentHistory.forEach(item=>{const key=String(item.classroom_id??item.classroom_name??"kelas");if(!map.has(key))map.set(key,{classroom_id:item.classroom_id,classroom_name:item.classroom_name||"Kelas",total:0,items:[]});map.get(key).items.push(item);});
    return [...map.values()].filter(group=>group.total>0||group.items.length).map(group=>({...group,is_current:Boolean(currentId)&&String(group.classroom_id??"")===currentId,items:group.items.sort((a,b)=>b.tanggal.localeCompare(a.tanggal))})).sort((a,b)=>Number(b.is_current)-Number(a.is_current)||String(a.classroom_name).localeCompare(String(b.classroom_name),"id",{sensitivity:"base",numeric:true}));
  },[historyClassSummary,selectedStudent,studentHistory]);

  const period = useMemo(() => {
    const activeStart = String(
      activePeriod?.tanggal_mulai || ""
    ).slice(0, 10);
    const activeEnd = String(
      activePeriod?.tanggal_selesai || ""
    ).slice(0, 10);

    if (!activeStart || !activeEnd) {
      return { dari: "", sampai: "" };
    }

    if (filterType === "semester") {
      return {
        dari: activeStart,
        sampai: activeEnd,
      };
    }

    const requested =
      filterType === "weekly"
        ? getWeekRange(selectedWeek)
        : getMonthRange(selectedMonth);

    const dari = maxDate(
      requested.dari,
      activeStart
    );
    const sampai = minDate(
      requested.sampai,
      activeEnd
    );

    if (!dari || !sampai || dari > sampai) {
      return { dari: "", sampai: "" };
    }

    return { dari, sampai };
  }, [
    activePeriod,
    filterType,
    selectedMonth,
    selectedWeek,
  ]);

  const minWeek = dateToIsoWeek(
    activePeriod?.tanggal_mulai
  );
  const maxWeek = dateToIsoWeek(
    activePeriod?.tanggal_selesai
  );
  const minMonth = String(
    activePeriod?.tanggal_mulai || ""
  ).slice(0, 7);
  const maxMonth = String(
    activePeriod?.tanggal_selesai || ""
  ).slice(0, 7);

  useEffect(() => {
    const timer = window.setTimeout(
      () => {
        setDebouncedSearch(
          searchSiswa.trim()
        );
      },
      250
    );

    return () =>
      window.clearTimeout(timer);
  }, [searchSiswa]);

  const loadClasses =
    useCallback(async () => {
      try {
        const [items, currentPeriod] =
          await Promise.all([
            fetchKegiatanClassrooms(),
            fetchKegiatanCurrentAcademicPeriod(),
          ]);

        const scope = classroomScopeForUser(user, items);
        setClasses(scope.classes);
        setActivePeriod(currentPeriod);
        setSelectedClass((current) => resolveSelectedClass(current, scope, "all"));

        const today = localDate(new Date());
        const periodStart =
          String(currentPeriod.tanggal_mulai || "").slice(0, 10);
        const periodEnd =
          String(currentPeriod.tanggal_selesai || "").slice(0, 10);
        const anchor =
          today >= periodStart && today <= periodEnd
            ? today
            : periodStart || periodEnd;

        if (anchor) {
          setSelectedWeek(
            dateToIsoWeek(anchor)
          );
          setSelectedMonth(
            anchor.slice(0, 7)
          );
        }

        setSelectedYear(resolveAcademicYear(currentPeriod));
        setSelectedSemester(
          Number(currentPeriod.semester) === 2
            ? "genap"
            : "ganjil"
        );
      } catch (loadError) {
        setError(errorOf(loadError));
      }
    }, [user]);

  const loadRecap =
    useCallback(async () => {
      if (
        selectedClass === "" ||
        !period.dari ||
        !period.sampai
      ) {
        setData([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const items =
          await fetchAttendanceRecap({
            classroom_id:
              selectedClass,
            dari: period.dari,
            sampai: period.sampai,
            q: debouncedSearch,
          });

        setData(items);
      } catch (loadError) {
        setData([]);
        setError(errorOf(loadError));
      } finally {
        setLoading(false);
      }
    }, [
      debouncedSearch,
      period.dari,
      period.sampai,
      selectedClass,
    ]);

  const loadFillDates=useCallback(async()=>{
    if(selectedClass==="all"||!period.dari||!period.sampai){
      setFillDates([]);
      setFillError("");
      setFillLoading(false);
      return;
    }
    setFillLoading(true);
    setFillError("");
    try{
      setFillDates(await fetchAttendanceFillDates({classroom_id:selectedClass,dari:period.dari,sampai:period.sampai}));
    }catch(loadError){
      setFillDates([]);
      setFillError(errorOf(loadError));
    }finally{
      setFillLoading(false);
    }
  },[period.dari,period.sampai,selectedClass]);

  useEffect(() => {
    loadClasses();
  }, [loadClasses]);

  useEffect(() => {
    loadRecap();
  }, [loadRecap]);

  useEffect(() => {
    if (loading) return;
    const timer = window.setTimeout(() => {
      loadFillDates();
    }, 150);

    return () => window.clearTimeout(timer);
  }, [loadFillDates, loading]);

  useEffect(() => {
    setPage(1);
  }, [
    debouncedSearch,
    filterType,
    selectedClass,
    selectedMonth,
    selectedSemester,
    selectedWeek,
    selectedYear,
  ]);

  const totalPages = Math.max(
    1,
    Math.ceil(
      data.length / pageSize
    )
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pagedData = useMemo(() => {
    const start =
      (page - 1) * pageSize;

    return data.slice(
      start,
      start + pageSize
    );
  }, [data, page, pageSize]);

  const filledDates=useMemo(()=>fillDates.filter(item=>item.saved_count>0),[fillDates]);
  const completeDays=useMemo(()=>fillDates.filter(item=>item.is_complete).length,[fillDates]);
  const partialDays=useMemo(()=>fillDates.filter(item=>item.is_partial).length,[fillDates]);

  const handleOpenModal=student=>{setSelectedStudent(student);setStudentHistory([]);setHistoryStats(student.stats);setHistoryError("");setHistoryClassSummary([]);setIsModalOpen(true);};
  const handleCloseModal=()=>{setIsModalOpen(false);setSelectedStudent(null);setStudentHistory([]);setHistoryStats(null);setHistoryError("");setHistoryClassSummary([]);setEditHistory(null);};

  useEffect(()=>{
    if(!isModalOpen||!selectedStudent||!period.dari||!period.sampai)return;
    let active=true;
    const load=async()=>{
      setHistoryLoading(true);setHistoryError("");
      try{
        const summary=await fetchAttendanceRecap({student_id:selectedStudent.id,dari:period.dari,sampai:period.sampai});
        const globalStats=summary[0]?.stats||selectedStudent.stats;
        const expectedTotal=Number(globalStats?.total||0);
        const classSummary=(await Promise.all(classes.map(async classroom=>{
          try{
            const recap=await fetchAttendanceRecap({classroom_id:classroom.id,student_id:selectedStudent.id,dari:period.dari,sampai:period.sampai});
            const stats=recap[0]?.stats;
            const total=Number(stats?.total||0);
            return total>0?{classroom_id:classroom.id,classroom_name:classroom.nama_kelas,total,stats}:null;
          }catch{return null;}
        }))).filter(Boolean);
        const candidateDates=fillDates.filter(item=>item.saved_count>0).map(item=>item.tanggal);
        const rows=await fetchStudentAttendanceHistory({student_id:selectedStudent.id,dari:period.dari,sampai:period.sampai,expected_total:expectedTotal,candidate_dates:candidateDates,preferred_classroom_id:selectedStudent.classroom_id||selectedClass});
        if(!active)return;
        setHistoryStats(globalStats);
        setHistoryClassSummary(classSummary);
        setStudentHistory(rows);
      }catch(loadError){if(active){setStudentHistory([]);setHistoryError(errorOf(loadError));}}finally{if(active)setHistoryLoading(false);}
    };
    load();
    return()=>{active=false;};
  },[classes,fillDates,historyVersion,isModalOpen,period.dari,period.sampai,selectedClass,selectedStudent]);

  const handleEditHistory=useCallback(item=>setEditHistory({...item,status:item.status,keterangan:item.keterangan||""}),[]);

  const handleSaveHistoryEdit=useCallback(async()=>{
    if(!editHistory||!selectedStudent)return;
    setEditSaving(true);
    try{
      await updateStudentAttendanceHistory({classroom_id:editHistory.classroom_id,student_id:selectedStudent.id,tanggal:editHistory.tanggal,status:editHistory.status,keterangan:editHistory.keterangan});
      setEditHistory(null);
      setHistoryVersion(value=>value+1);
      await Promise.all([loadRecap(),loadFillDates()]);
      notify({type:"success",title:"Presensi Berhasil Diubah",message:`Presensi ${selectedStudent.nama_lengkap} pada ${formatDate(editHistory.tanggal)} berhasil diperbarui.`});
    }catch(saveError){notify({type:"error",title:"Presensi Gagal Diubah",message:errorOf(saveError)});}finally{setEditSaving(false);}
  },[editHistory,loadFillDates,loadRecap,notify,selectedStudent]);

  const handleDeleteUnavailable=useCallback(async({scope,label,count=0,studentName=""})=>{
    const studentMode=Boolean(studentName),title=scope==="week"?"Hapus Rekap Mingguan?":studentMode?"Hapus Presensi Siswa?":"Hapus Rekap Harian?";
    const message=scope==="week"?`Seluruh presensi kelas terpilih pada ${label} akan dihapus. Tindakan ini tidak dapat dibatalkan.`:studentMode?`Presensi ${studentName} pada ${label} akan dihapus. Tindakan ini tidak dapat dibatalkan.`:`Seluruh presensi kelas terpilih pada ${label} akan dihapus. Tindakan ini tidak dapat dibatalkan.`;
    const approved=await confirm({type:"warning",title,message,confirmLabel:"Hapus Presensi"});
    if(!approved)return;
    notify({type:"info",title:studentMode?"Hapus Presensi Belum Tersedia":"Hapus Rekap Belum Tersedia",message:`Backend saat ini belum menyediakan endpoint DELETE presensi ${scope==="week"?"per minggu":studentMode?"per siswa/per hari":"per hari"}. Tidak ada data yang dihapus.${count?` ${count} hari berisi presensi terdeteksi pada pilihan ini.`:""}`});
  },[confirm,notify]);

  const handleDeleteDay=useCallback(item=>{
    if(selectedClass==="all")return notify({type:"info",title:"Pilih Satu Kelas",message:"Pilih satu kelas terlebih dahulu sebelum menghapus rekap presensi harian."});
    return handleDeleteUnavailable({scope:"day",label:formatDate(item.tanggal)});
  },[handleDeleteUnavailable,notify,selectedClass]);

  const handleDeleteHistory=useCallback(item=>handleDeleteUnavailable({scope:"day",label:formatDate(item.tanggal),studentName:selectedStudent?.nama_lengkap||"Siswa"}),[handleDeleteUnavailable,selectedStudent]);

  const handleDeleteWeek=useCallback(()=>{
    if(selectedClass==="all")return notify({type:"info",title:"Pilih Satu Kelas",message:"Pilih satu kelas terlebih dahulu sebelum menghapus rekap presensi mingguan."});
    if(filterType!=="weekly")return notify({type:"info",title:"Gunakan Filter Mingguan",message:"Pilih filter Mingguan untuk menghapus rekap presensi satu minggu."});
    const count=filledDates.length;
    if(!count)return notify({type:"info",title:"Tidak Ada Rekap",message:"Belum ada presensi tersimpan pada minggu yang dipilih."});
    return handleDeleteUnavailable({scope:"week",label:`${formatDate(period.dari)} - ${formatDate(period.sampai)}`,count});
  },[filledDates.length,filterType,handleDeleteUnavailable,notify,period.dari,period.sampai,selectedClass]);



  return (
    <div className="flex flex-col h-full bg-white animate-in fade-in duration-300">
      <SectionHeader icon={CalendarDaysIcon} title="Rekapitulasi Presensi" description="Data kehadiran siswa pada periode yang dipilih." actions={<><button type="button" onClick={()=>setFiltersOpen(value=>!value)} className={`ui-toolbar-button ${filtersOpen?"is-active":""}`}><FunnelIcon className="h-4 w-4"/>Filter</button>{filterType==="weekly"&&selectedClass!=="all"&&filledDates.length>0&&<button type="button" onClick={handleDeleteWeek} className="ui-toolbar-button border-rose-200 text-rose-600 hover:bg-rose-50"><TrashIcon className="h-4 w-4"/>Hapus Minggu</button>}</>}/>
      {filtersOpen&&<div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3">
        <select value={selectedClass} onChange={event=>setSelectedClass(event.target.value)} disabled={teacherMode&&classes.length<=1} className="ui-compact-control min-w-40 disabled:cursor-not-allowed disabled:bg-slate-100">{!teacherMode&&<option value="all">Semua Kelas</option>}{teacherMode&&classes.length===0&&<option value="">Belum ada kelas yang ditugaskan</option>}{classes.map(classroom=><option key={classroom.id} value={classroom.id}>{classroom.nama_kelas}</option>)}</select>
        <select value={filterType} onChange={event=>setFilterType(event.target.value)} className="ui-compact-control min-w-32"><option value="weekly">Mingguan</option><option value="monthly">Bulanan</option><option value="semester">Semester</option></select>
        {filterType==="weekly"&&<input type="week" value={selectedWeek} min={minWeek||undefined} max={maxWeek||undefined} onChange={event=>setSelectedWeek(event.target.value)} className="ui-compact-control"/>}
        {filterType==="monthly"&&<input type="month" value={selectedMonth} min={minMonth||undefined} max={maxMonth||undefined} onChange={event=>setSelectedMonth(event.target.value)} className="ui-compact-control"/>}
        {filterType==="semester"&&<><select value={selectedYear} disabled className="ui-compact-control"><option value={selectedYear}>{selectedYear}</option></select><select value={selectedSemester} disabled className="ui-compact-control"><option value="ganjil">Ganjil</option><option value="genap">Genap</option></select></>}
        <div className="relative min-w-56 flex-1 xl:max-w-72"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"/><input type="text" placeholder="Cari nama siswa..." value={searchSiswa} onChange={event=>setSearchSiswa(event.target.value)} className="ui-compact-control w-full pl-9"/></div>
      </div>}

      <div className="mt-4 rounded-xl border border-slate-100 bg-white px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div><p className="text-[11px] font-semibold text-slate-700">Status Pengisian Presensi</p><p className="mt-0.5 text-[10px] text-slate-400">{selectedClass==="all"?"Pilih satu kelas untuk melihat tanggal yang sudah diisi.":fillLoading?"Memeriksa tanggal pengisian...":`${filledDates.length} dari ${fillDates.length} hari efektif sampai hari ini sudah memiliki presensi.`}</p></div>
          {selectedClass!=="all"&&!fillLoading&&!fillError&&<div className="flex items-center gap-2 text-[10px]"><span className="inline-flex items-center gap-1 text-emerald-600"><CheckCircleIcon className="h-3.5 w-3.5"/>{completeDays} selesai</span>{partialDays>0&&<span className="inline-flex items-center gap-1 text-amber-600"><ExclamationCircleIcon className="h-3.5 w-3.5"/>{partialDays} sebagian</span>}</div>}
        </div>
        {selectedClass!=="all"&&<div className="mt-3">
          {fillLoading?<div className="flex items-center gap-2 text-[10px] text-slate-400"><ArrowPathIcon className="h-3.5 w-3.5 animate-spin"/>Memuat tanggal presensi...</div>:fillError?<p className="text-[10px] text-rose-500">{fillError}</p>:filledDates.length?<div className="flex max-h-28 flex-wrap gap-1.5 overflow-y-auto">{filledDates.map(item=><span key={item.tanggal} className={`inline-flex items-center overflow-hidden rounded-md border text-[10px] font-medium ${item.is_complete?"border-emerald-100 bg-emerald-50 text-emerald-700":"border-amber-100 bg-amber-50 text-amber-700"}`}><span className="inline-flex items-center gap-1 px-2 py-1">{item.is_complete?<CheckCircleIcon className="h-3 w-3"/>:<ExclamationCircleIcon className="h-3 w-3"/>}{formatDate(item.tanggal)}{item.is_partial&&<span className="text-[9px] opacity-70">({item.saved_count}/{item.total_students})</span>}</span><button type="button" onClick={()=>handleDeleteDay(item)} className="flex self-stretch items-center border-l border-current/10 px-1.5 opacity-60 transition hover:bg-white/60 hover:opacity-100" aria-label={`Hapus rekap ${formatDate(item.tanggal)}`} title="Hapus rekap harian"><TrashIcon className="h-3 w-3"/></button></span>)}</div>:<p className="text-[10px] text-slate-400">Belum ada presensi yang tersimpan pada periode ini.</p>}
        </div>}
      </div>

      <div className="ui-table-card mt-4 flex-1 relative">
        <div className="overflow-auto">
          <table className="min-w-full divide-y divide-slate-100 text-left">
            <thead className="sticky top-0 z-10 bg-slate-50/80">
              <tr>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-12">No</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-48">Nama Siswa</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">NIS</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-14">L/P</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">Kelas</th>
                <th className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 min-w-40">Wali Kelas</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600 w-16">Hadir</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600 w-16">Sakit</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600 w-16">Izin</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600 w-16">Alpa</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-600 w-24">% Hadir</th>
                <th className="px-3 py-3 text-center text-xs font-semibold uppercase text-slate-500 w-16">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr><td colSpan="12" className="py-14 text-center text-slate-400"><span className="inline-flex items-center gap-2 text-sm"><ArrowPathIcon className="h-4 w-4 animate-spin"/>Memuat rekap presensi...</span></td></tr>
              ) : error ? (
                <tr><td colSpan="12" className="py-14 text-center"><p className="text-sm text-rose-500">{error}</p><button type="button" onClick={loadRecap} className="mt-3 text-xs font-semibold text-[#e94640] hover:text-[#d63d38]">Muat ulang</button></td></tr>
              ) : pagedData.length ? (
                pagedData.map((siswa, index) => {
                  const { stats } = siswa;
                  const meta = studentClassroomMeta(classes, siswa);
                  return (
                    <tr key={siswa.id} onClick={() => handleOpenModal(siswa)} className="group cursor-pointer transition-colors hover:bg-slate-50">
                      <td className="px-3 py-2.5 text-center text-sm font-mono text-slate-500">{(page - 1) * pageSize + index + 1}</td>
                      <td className="px-3 py-2.5 text-sm font-semibold text-slate-700">{siswa.nama_lengkap || "-"}</td>
                      <td className="px-3 py-2.5 text-sm font-mono text-slate-500 whitespace-nowrap">{siswa.nomor_induk || siswa.nisn || "-"}</td>
                      <td className="px-3 py-2.5 text-center text-sm font-semibold text-slate-600">{studentGenderLabel(siswa.jenis_kelamin)}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.classroomName}</td>
                      <td className="px-3 py-2.5 text-sm text-slate-600 whitespace-nowrap">{meta.homeroomTeacherName}</td>
                      <td className="px-3 py-2.5 text-center text-sm text-slate-600">{stats.h}</td>
                      <td className="px-3 py-2.5 text-center text-sm text-slate-600">{stats.s}</td>
                      <td className="px-3 py-2.5 text-center text-sm text-slate-600">{stats.i}</td>
                      <td className="px-3 py-2.5 text-center text-sm text-slate-600">{stats.a}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className={`inline-flex items-center justify-center rounded-full border px-2.5 py-1 text-xs font-bold ${stats.percentage >= 80 ? "border-green-100 bg-green-50 text-green-700" : stats.percentage >= 50 ? "border-yellow-100 bg-yellow-50 text-yellow-700" : "border-red-100 bg-red-50 text-red-700"}`}>{stats.percentage}%</span>
                      </td>
                      <td className="px-3 py-2.5 text-center"><button type="button" onClick={(event) => { event.stopPropagation(); handleOpenModal(siswa); }} className="rounded-lg p-1.5 text-slate-400 transition-all hover:bg-red-50 hover:text-[#e94640]"><EyeIcon className="h-4 w-4"/></button></td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan="12" className="py-12 text-center text-slate-400"><FunnelIcon className="mx-auto mb-3 h-10 w-10 opacity-20"/><span className="text-sm">Data tidak ditemukan</span></td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination currentPage={page} totalPages={totalPages} totalItems={data.length} itemsPerPage={pageSize} onPageChange={setPage} onLimitChange={(value) => { setPageSize(value); setPage(1); }} limitOptions={[10, 20, 50, 100]} className="!px-3 !py-2.5"/>
      </div>

      {isModalOpen &&
        selectedStudent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/30 backdrop-blur-[2px] animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Detail Kehadiran
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-slate-500 mt-1">
                    <span className="font-medium text-slate-700">
                      {
                        selectedStudent.nama_lengkap
                      }
                    </span>
                    <span>•</span>
                    <span className="font-mono">
                      {
                        selectedStudent.nomor_induk
                      }
                    </span>
                    <span>•</span>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs">
                      {selectedStudent.classroom_name ||
                        "-"}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={
                    handleCloseModal
                  }
                  className="p-2 bg-white border border-slate-200 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto">
                <div className="grid grid-cols-4 gap-4 mb-6">
                  <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 flex flex-col items-center">
                    <span className="text-xs font-bold text-emerald-600 uppercase mb-1">
                      Hadir
                    </span>
                    <span className="text-2xl font-bold text-emerald-700">
                      {
                        historyStats?.h??selectedStudent.stats.h
                      }
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-blue-100 bg-blue-50/30 flex flex-col items-center">
                    <span className="text-xs font-bold text-blue-600 uppercase mb-1">
                      Sakit
                    </span>
                    <span className="text-2xl font-bold text-blue-700">
                      {
                        historyStats?.s??selectedStudent.stats.s
                      }
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-amber-100 bg-amber-50/30 flex flex-col items-center">
                    <span className="text-xs font-bold text-amber-600 uppercase mb-1">
                      Izin
                    </span>
                    <span className="text-2xl font-bold text-amber-700">
                      {
                        historyStats?.i??selectedStudent.stats.i
                      }
                    </span>
                  </div>
                  <div className="p-4 rounded-xl border border-rose-100 bg-rose-50/30 flex flex-col items-center">
                    <span className="text-xs font-bold text-rose-600 uppercase mb-1">
                      Alpha
                    </span>
                    <span className="text-2xl font-bold text-rose-700">
                      {
                        historyStats?.a??selectedStudent.stats.a
                      }
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-bold text-slate-800"><CalendarDaysIcon className="h-4 w-4 text-[#e94640]"/>Riwayat Absensi</h4>
                  {historyLoading?<div className="ui-table-card mt-4 px-3 py-8 text-center text-[11px] text-slate-400"><span className="inline-flex items-center gap-2"><ArrowPathIcon className="h-4 w-4 animate-spin"/>Memuat riwayat absensi...</span></div>:historyError?<div className="ui-table-card mt-4 px-3 py-8 text-center text-[11px] text-rose-500">{historyError}</div>:historyGroups.length?<div className="mt-4 space-y-4">{historyGroups.map(group=><section key={String(group.classroom_id??group.classroom_name)} className="ui-table-card overflow-hidden"><div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50/70 px-3 py-2.5"><div><div className="text-[12px] font-semibold text-slate-700">{group.classroom_name||"Kelas"}</div><span className={`mt-1 inline-flex rounded-md border px-1.5 py-0.5 text-[9px] font-semibold ${group.is_current?"border-emerald-100 bg-emerald-50 text-emerald-700":"border-amber-100 bg-amber-50 text-amber-700"}`}>{group.is_current?"Kelas Saat Ini":"Kelas Sebelumnya"}</span></div><span className="text-[10px] text-slate-400"><b className="font-semibold text-slate-600">{group.items.length||group.total}</b> presensi</span></div><div className="overflow-x-auto"><table className="min-w-full text-left"><thead className="bg-white"><tr><th className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-400">Tanggal</th><th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase text-slate-400">Status</th><th className="px-3 py-2.5 text-[10px] font-semibold uppercase text-slate-400">Keterangan</th><th className="px-3 py-2.5 text-center text-[10px] font-semibold uppercase text-slate-400">Aksi</th></tr></thead><tbody className="divide-y divide-slate-100 bg-white">{group.items.length?group.items.map(item=><tr key={`${selectedStudent.id}-${item.tanggal}-${item.classroom_id||"kelas"}`} className="hover:bg-slate-50/60"><td className="px-3 py-2.5 text-[11px] font-medium text-slate-600">{formatDate(item.tanggal)}</td><td className="px-3 py-2.5 text-center"><span className={`inline-flex min-w-14 items-center justify-center rounded-md border px-2 py-1 text-[10px] font-semibold ${item.status==="H"?"border-emerald-100 bg-emerald-50 text-emerald-700":item.status==="S"?"border-blue-100 bg-blue-50 text-blue-700":item.status==="I"?"border-amber-100 bg-amber-50 text-amber-700":"border-rose-100 bg-rose-50 text-rose-700"}`}>{attendanceLabel(item.status)}</span></td><td className="px-3 py-2.5 text-[11px] text-slate-500">{item.keterangan||"-"}</td><td className="px-3 py-2.5 text-center"><div className="flex items-center justify-center gap-1"><button type="button" onClick={()=>handleEditHistory(item)} className="ui-action-button text-slate-500 hover:bg-slate-100 hover:text-slate-700" title={`Ubah presensi ${formatDate(item.tanggal)}`}><PencilSquareIcon className="h-3.5 w-3.5"/>Ubah</button><button type="button" onClick={()=>handleDeleteHistory(item)} className="ui-action-button text-rose-500 hover:bg-rose-50 hover:text-rose-600" title={`Hapus presensi ${formatDate(item.tanggal)}`}><TrashIcon className="h-3.5 w-3.5"/>Hapus</button></div></td></tr>):<tr><td colSpan="4" className="px-3 py-6 text-center text-[11px] text-slate-400">Rincian harian belum tersedia.</td></tr>}</tbody></table></div></section>)}</div>:<div className="ui-table-card mt-4 px-3 py-8 text-center text-[11px] text-slate-400">Belum ada riwayat presensi tersimpan pada periode ini.</div>}
                </div>
              </div>
            </div>
          </div>
        )}
      {editHistory&&<div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/30 p-4"><div className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-start justify-between border-b border-slate-100 px-4 py-3"><div><h3 className="text-sm font-semibold text-slate-800">Ubah Presensi</h3><p className="mt-0.5 text-[10px] text-slate-400">{selectedStudent?.nama_lengkap} · {editHistory.classroom_name||"Kelas"} · {formatDate(editHistory.tanggal)}</p></div><button type="button" onClick={()=>!editSaving&&setEditHistory(null)} className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XMarkIcon className="h-4 w-4"/></button></div><div className="space-y-4 px-4 py-4"><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status</label><div className="grid grid-cols-4 gap-2">{[["H","Hadir"],["S","Sakit"],["I","Izin"],["A","Alpa"]].map(([value,label])=><button key={value} type="button" onClick={()=>setEditHistory(current=>({...current,status:value}))} className={`h-9 rounded-lg border text-[11px] font-semibold ${editHistory.status===value?"border-[#ef4d45] bg-red-50 text-[#ef4d45]":"border-slate-200 bg-white text-slate-500 hover:bg-slate-50"}`}>{label}</button>)}</div></div><div><label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-400">Keterangan</label><textarea value={editHistory.keterangan||""} onChange={event=>setEditHistory(current=>({...current,keterangan:event.target.value}))} rows={3} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-[11px] text-slate-600 outline-none transition focus:border-red-200 focus:ring-2 focus:ring-red-50" placeholder="Tambahkan keterangan jika diperlukan"/></div></div><div className="flex justify-end gap-2 border-t border-slate-100 px-4 py-3"><button type="button" onClick={()=>setEditHistory(null)} disabled={editSaving} className="ui-toolbar-button">Batal</button><button type="button" onClick={handleSaveHistoryEdit} disabled={editSaving} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50">{editSaving&&<ArrowPathIcon className="h-4 w-4 animate-spin"/>}Simpan Perubahan</button></div></div></div>}
      <KegiatanDialog dialog={dialog} onClose={close}/>
    </div>
  );
}
