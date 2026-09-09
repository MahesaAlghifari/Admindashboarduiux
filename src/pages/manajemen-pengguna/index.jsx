import React, { useCallback, useEffect, useMemo, useState, } from "react";
import { ArrowPathIcon, ArrowsRightLeftIcon, BriefcaseIcon, CheckCircleIcon, ExclamationTriangleIcon, FunnelIcon, MagnifyingGlassIcon, PencilSquareIcon, UserGroupIcon, XCircleIcon, XMarkIcon, } from "@heroicons/react/24/outline";
import { fetchStaffUsers, fetchStudentUsers, updateStaffUser, updateStudentUser, } from "../../api/users";
import { fetchAllClassrooms, updateClassroom, } from "../../api/classrooms";
import { fetchStudentById, studentEducationMeta, updateStudentEducation, } from "../../api/students";
import { fetchCurrentAcademicPeriod } from "../../api/academic-periods";
import { fetchStaffById } from "../../api/staff";
import { useRouteTab } from "../../hooks/useRouteTab";
import { resolveStudentAcademicYear } from "../../lib/academicYear";
import { invalidateStudentData, subscribeStudentDataChanges } from "../../lib/studentDataSync";
import { syncStudentClassroomMembership, syncStudentsToClassroomMembership } from "../../lib/studentClassroomSync";
import Pagination from "../../components/common/Pagination";
const UserManagementModal = React.lazy(() => import("./UserManagementModal"));
const BULK_CONCURRENCY = 6;
const DETAIL_CONCURRENCY = 3;
const DETAIL_TTL = 5 * 60000;
const collator = new Intl.Collator("id", {
    numeric: true,
    sensitivity: "base",
});
const studentDetailCache = new Map();
const staffDetailCache = new Map();
const EDUCATION_LABELS = {
    current: "Masih di Lembaga",
    graduated: "Lulus",
    left: "Pindah / Mengundurkan Diri",
};
const TYPES = [
    {
        id: "student",
        label: "Siswa",
        icon: UserGroupIcon,
    },
    {
        id: "staff",
        label: "Staff & Guru",
        icon: BriefcaseIcon,
    },
];
const text = (value) => String(value ?? "").trim();
const show = (value) => text(value) || "-";
const keyOf = (value) => String(value ?? "");
const invalidateStudentOperationalCaches = (studentIds = []) =>
    invalidateStudentData({
        studentIds,
        reason: "user-management",
    });
const dateDisplay = (value) => {
    const match = text(value)
        .slice(0, 10)
        .match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) {
        return "-";
    }
    return `${match[3]}/${match[2]}/${match[1]}`;
};
const teacherMatches = (user, teacher) => {
    if (!teacher) {
        return false;
    }
    const sameId = user.id != null &&
        teacher.id != null &&
        keyOf(user.id) === keyOf(teacher.id);
    const sameNik = text(user.nik) &&
        text(user.nik) === text(teacher.nik);
    return Boolean(sameId || sameNik);
};
const errorOf = (error) => {
    const value = error?.response?.data?.detail ??
        error?.response?.data?.message ??
        error?.data?.detail ??
        error?.data?.message ??
        error?.message;
    if (Array.isArray(value)) {
        const message = value
            .map((item) => item?.msg ||
            item?.message ||
            String(item))
            .filter(Boolean)
            .join(", ");
        return message || "Terjadi kesalahan.";
    }
    if (value &&
        typeof value === "object") {
        const message = Object.entries(value)
            .map(([field, item]) => {
            const normalized = Array.isArray(item)
                ? item.join(", ")
                : String(item);
            return `${field}: ${normalized}`;
        })
            .join(", ");
        return message || "Terjadi kesalahan.";
    }
    if (typeof value === "string" &&
        value.trim()) {
        return value;
    }
    return "Terjadi kesalahan.";
};
async function settleWithConcurrency(items, worker, limit = BULK_CONCURRENCY) {
    const results = new Array(items.length);
    const size = Math.max(1, Math.min(limit, items.length));
    let cursor = 0;
    const run = async () => {
        while (true) {
            const index = cursor++;
            if (index >= items.length) {
                return;
            }
            try {
                results[index] = {
                    status: "fulfilled",
                    value: await worker(items[index], index),
                };
            }
            catch (reason) {
                results[index] = {
                    status: "rejected",
                    reason,
                };
            }
        }
    };
    await Promise.all(Array.from({ length: size }, run));
    return results;
}
function cacheGet(cache, id) {
    const key = keyOf(id);
    const entry = cache.get(key);
    if (!entry) {
        return null;
    }
    if (entry.expiresAt <= Date.now()) {
        cache.delete(key);
        return null;
    }
    return entry.value;
}
function cacheSet(cache, id, value) {
    if (id == null || !value) {
        return;
    }
    cache.set(keyOf(id), {
        value,
        expiresAt: Date.now() + DETAIL_TTL,
    });
}
async function cachedStudentDetail(id) {
    const cached = cacheGet(studentDetailCache, id);
    if (cached) {
        return cached;
    }
    const value = await fetchStudentById(id);
    cacheSet(studentDetailCache, id, value);
    return value;
}
async function cachedStaffDetail(id) {
    const cached = cacheGet(staffDetailCache, id);
    if (cached) {
        return cached;
    }
    const value = await fetchStaffById(id);
    cacheSet(staffDetailCache, id, value);
    return value;
}
function lightweightStudent(item) {
    return {
        ...item,
        education_state: item.status_aktif
            ? "current"
            : "unknown",
        tahun_pelajaran: "",
        tanggal_keluar: "",
        alasan_keluar: "",
        tanggal_lahir: "",
    };
}
function lightweightStaff(item) {
    return {
        ...item,
        tanggal_lahir: "",
    };
}
function StatusBadge({ value }) {
    const activeClass = value
        ? "bg-emerald-50 text-emerald-600"
        : "bg-slate-100 text-slate-500";
    return (<span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${activeClass}`}>
      {value ? (<CheckCircleIcon className="h-3.5 w-3.5"/>) : (<XCircleIcon className="h-3.5 w-3.5"/>)}

      {value ? "Aktif" : "Nonaktif"}
    </span>);
}
function EducationBadge({ value }) {
    let tone = "bg-slate-100 text-slate-500";
    if (value === "current") {
        tone =
            "bg-emerald-50 text-emerald-600";
    }
    else if (value === "graduated") {
        tone =
            "bg-slate-950 text-white";
    }
    else if (value === "left") {
        tone =
            "bg-amber-50 text-amber-700";
    }
    return (<span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>
      {EDUCATION_LABELS[value] || "-"}
    </span>);
}
function ClassBadge({ value, educationState = "current" }) {
    const className = text(value);
    const alumni = educationState === "graduated";
    const left = educationState === "left";
    const suffix = alumni ? "Alumni" : left ? "Keluar" : "";
    const label = suffix
        ? className
            ? `${className} · ${suffix}`
            : suffix
        : className || "Belum Ditentukan";
    const hasValue = Boolean(className);
    const tone = alumni
        ? "bg-slate-950 text-white"
        : left
            ? "bg-amber-50 text-amber-700"
            : hasValue
                ? "bg-indigo-50 text-indigo-600"
                : "bg-slate-100 text-slate-500";
    return (<span className={`inline-flex max-w-45 truncate rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>
      {label}
    </span>);
}
function HomeroomBadges({ user }) {
    const names = Array.isArray(user.kelas_wali)
        ? user.kelas_wali
        : [];
    if (!names.length) {
        return (<span className="text-[11px] text-slate-400">
        -
      </span>);
    }
    return (<div className="flex max-w-60 flex-wrap gap-1">
      {names.map((name) => (<ClassBadge key={name} value={name}/>))}
    </div>);
}
function Checkbox({ checked, indeterminate = false, onChange, label, }) {
    const ref = React.useRef(null);
    useEffect(() => {
        if (ref.current) {
            ref.current.indeterminate =
                indeterminate;
        }
    }, [indeterminate]);
    return (<input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#ef4d45]"/>);
}
function TypeTabs({ value, onChange, }) {
    return (<div className="max-w-full overflow-x-auto">
      <div className="inline-flex rounded-lg bg-slate-100 p-1">
        {TYPES.map((item) => {
            const Icon = item.icon;
            const active = value === item.id;
            const stateClass = active
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-400 hover:text-slate-600";
            return (<button key={item.id} type="button" onClick={() => onChange(item.id)} className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition sm:px-4 ${stateClass}`}>
              <Icon className="h-4 w-4"/>
              {item.label}
            </button>);
        })}
      </div>
    </div>);
}
function Empty({ filtered, type, }) {
    const Icon = type === "student"
        ? UserGroupIcon
        : BriefcaseIcon;
    const title = filtered
        ? "Data tidak ditemukan"
        : `Belum ada data ${type === "student"
            ? "siswa"
            : "staff & guru"}`;
    const description = filtered
        ? "Ubah pencarian atau filter yang digunakan."
        : "Data akan muncul setelah tersedia di sistem.";
    return (<div className="px-6 py-12 text-center">
      <Icon className="mx-auto h-9 w-9 text-slate-200"/>

      <p className="mt-3 text-[13px] font-semibold text-slate-600">
        {title}
      </p>

      <p className="mt-1 text-xs leading-5 text-slate-400">
        {description}
      </p>
    </div>);
}
function FeedbackPopup({ notice, onClose, }) {
    if (!notice) {
        return null;
    }
    const success = notice.type === "success";
    const iconClass = success
        ? "bg-emerald-50 text-emerald-600"
        : "bg-rose-50 text-rose-500";
    const buttonClass = success
        ? "bg-emerald-600"
        : "bg-rose-500";
    return (<div className="fixed inset-0 z-220 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4" onMouseDown={(event) => {
            if (event.target ===
                event.currentTarget) {
                onClose();
            }
        }}>
      <section className="w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
              {success ? (<CheckCircleIcon className="h-5 w-5"/>) : (<ExclamationTriangleIcon className="h-5 w-5"/>)}
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-[15px] font-semibold text-slate-900">
                {success
            ? "Perubahan berhasil"
            : "Perubahan gagal"}
              </h2>

              <p className="mt-1.5 text-xs leading-5 text-slate-500">
                {notice.text}
              </p>
            </div>

            <button type="button" onClick={onClose} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
              <XMarkIcon className="h-4 w-4"/>
            </button>
          </div>

          <div className="mt-6 flex justify-end">
            <button type="button" onClick={onClose} className={`h-10 min-w-28 rounded-lg px-5 text-xs font-semibold text-white ${buttonClass}`}>
              {success
            ? "Selesai"
            : "Tutup"}
            </button>
          </div>
        </div>
      </section>
    </div>);
}
export default function UserManagement() {
    const [type, setType] = useRouteTab(TYPES, "student");
    const [students, setStudents] = useState([]);
    const [staff, setStaff] = useState([]);
    const [classes, setClasses] = useState([]);
    const [activeAcademicPeriod, setActiveAcademicPeriod] = useState(null);
    const [studentError, setStudentError,] = useState("");
    const [staffError, setStaffError,] = useState("");
    const [classError, setClassError,] = useState("");
    const [loading, setLoading] = useState(true);
    const [rowDetailLoading, setRowDetailLoading,] = useState(false);
    const [advancedDetailLoading, setAdvancedDetailLoading,] = useState(false);
    const [desktopTable, setDesktopTable,] = useState(() => typeof window !== "undefined" &&
        window
            .matchMedia("(min-width: 768px)")
            .matches);
    const [search, setSearch] = useState("");
    const [educationStatus, setEducationStatus,] = useState("");
    const [loginStatus, setLoginStatus,] = useState("");
    const [classFilter, setClassFilter,] = useState("");
    const [academicYear, setAcademicYear,] = useState("");
    const [position, setPosition,] = useState("");
    const [filtersOpen, setFiltersOpen,] = useState(false);
    const [selectionMode, setSelectionMode,] = useState(false);
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [selected, setSelected,] = useState(new Set());
    const [targetClass, setTargetClass,] = useState("");
    const [bulkEducationState, setBulkEducationState,] = useState("");
    const [bulkExitDate, setBulkExitDate,] = useState("");
    const [bulkExitReason, setBulkExitReason,] = useState("");
    const [busy, setBusy] = useState("");
    const [editor, setEditor] = useState(null);
    const [editorSaving, setEditorSaving,] = useState(false);
    const [notice, setNotice] = useState(null);
    const loadSequence = React.useRef(0);
    const classLoadSequence = React.useRef(0);
    const loadedTypes = React.useRef(new Set());
    const hydratedStudentIds = React.useRef(new Set());
    const hydratedStaffIds = React.useRef(new Set());
    const detailSequence = React.useRef(0);
    const loadActiveAcademicPeriod = useCallback(async () => {
        try {
            const period = await fetchCurrentAcademicPeriod();
            setActiveAcademicPeriod(period || null);
        }
        catch {
            setActiveAcademicPeriod(null);
        }
    }, []);
    const loadClasses = useCallback(async () => {
        const sequence = ++classLoadSequence.current;
        setClassError("");
        try {
            const values = await fetchAllClassrooms();
            if (sequence !==
                classLoadSequence.current) {
                return;
            }
            const normalized = values
                .filter((item) => item.id != null)
                .map((item) => ({
                id: item.id,
                name: item.nama_kelas,
                jumlah_siswa: item.jumlah_siswa,
                wali_kelas: item.wali_kelas,
                curriculum_id: item.curriculum?.id ??
                    null,
                tahun_ajaran: text(item.curriculum
                    ?.tahun_ajaran),
                student_ids: (item.students || [])
                    .map((student) => student.id)
                    .filter((id) => id != null),
            }));
            setClasses(normalized);
        }
        catch (error) {
            if (sequence !==
                classLoadSequence.current) {
                return;
            }
            setClasses([]);
            setClassError(errorOf(error));
        }
    }, []);
    const load = useCallback(async ({ fresh = false } = {}) => {
        const sequence = ++loadSequence.current;
        if (!fresh &&
            loadedTypes.current.has(type)) {
            setLoading(false);
            return;
        }
        setLoading(true);
        try {
            if (type === "student") {
                setStudentError("");
                const values = await fetchStudentUsers();
                if (sequence !==
                    loadSequence.current) {
                    return;
                }
                setStudents(values.map(lightweightStudent));
                hydratedStudentIds.current =
                    new Set();
                loadedTypes.current.add("student");
            }
            else {
                setStaffError("");
                const values = await fetchStaffUsers();
                if (sequence !==
                    loadSequence.current) {
                    return;
                }
                setStaff(values.map(lightweightStaff));
                hydratedStaffIds.current =
                    new Set();
                loadedTypes.current.add("staff");
            }
        }
        catch (error) {
            if (sequence !==
                loadSequence.current) {
                return;
            }
            if (type === "student") {
                setStudents([]);
                setStudentError(errorOf(error));
                loadedTypes.current.delete("student");
            }
            else {
                setStaff([]);
                setStaffError(errorOf(error));
                loadedTypes.current.delete("staff");
            }
        }
        finally {
            if (sequence ===
                loadSequence.current) {
                setLoading(false);
            }
        }
    }, [type]);
    useEffect(() => {
        load();
    }, [load]);
    useEffect(() => {
        loadClasses();
    }, [loadClasses]);
    useEffect(() => {
        loadActiveAcademicPeriod();
    }, [loadActiveAcademicPeriod]);
    useEffect(() => subscribeStudentDataChanges((detail) => {
        const ids = Array.isArray(detail?.studentIds) ? detail.studentIds : [];
        if (ids.length) {
            ids.forEach((id) => studentDetailCache.delete(keyOf(id)));
        } else {
            studentDetailCache.clear();
        }
        hydratedStudentIds.current = new Set();
        if (detail?.reason !== "user-management") {
            loadedTypes.current.delete("student");
            if (type === "student") load({ fresh: true });
            loadClasses();
            if (detail?.includeAcademicPeriod) loadActiveAcademicPeriod();
        }
    }), [type, load, loadClasses, loadActiveAcademicPeriod]);
    useEffect(() => {
        if (typeof window === "undefined" ||
            !window.matchMedia) {
            return;
        }
        const media = window.matchMedia("(min-width: 768px)");
        const update = () => {
            setDesktopTable(media.matches);
        };
        update();
        media.addEventListener?.("change", update);
        return () => {
            media.removeEventListener?.("change", update);
        };
    }, []);
    useEffect(() => {
        setSearch("");
        setEducationStatus("");
        setLoginStatus("");
        setClassFilter("");
        setAcademicYear("");
        setPosition("");
        setFiltersOpen(false);
        setSelectionMode(false);
        setSelected(new Set());
        setTargetClass("");
        setBulkEducationState("");
        setBulkExitDate("");
        setBulkExitReason("");
        setEditor(null);
        setNotice(null);
        setPage(1);
    }, [type]);
    useEffect(() => {
        setPage(1);
    }, [
        search,
        educationStatus,
        loginStatus,
        classFilter,
        academicYear,
        position,
        limit,
    ]);
    const classMap = useMemo(() => {
        const byId = new Map();
        const byName = new Map();
        classes.forEach((item) => {
            byId.set(keyOf(item.id), item);
            if (text(item.name)) {
                byName.set(text(item.name).toLocaleLowerCase("id-ID"), item);
            }
        });
        return {
            byId,
            byName,
        };
    }, [classes]);
    const activeAcademicYear = text(activeAcademicPeriod?.tahun_ajaran);
    const operationalClasses = useMemo(() => {
        if (!activeAcademicYear) return classes;
        return classes.filter((item) => text(item.tahun_ajaran) === activeAcademicYear);
    }, [classes, activeAcademicYear]);
    const effectiveStudents = useMemo(() => students.map((student) => {
        const classroom = classMap.byId.get(keyOf(student.classroom_id)) ||
            classMap.byName.get(text(student.nama_kelas).toLocaleLowerCase("id-ID"));
        return {
            ...student,
            classroom_id: classroom?.id ??
                student.classroom_id,
            nama_kelas: classroom?.name ||
                text(student.nama_kelas),
            tahun_pelajaran: resolveStudentAcademicYear({
                educationState: student.education_state,
                statusActive: student.status_aktif,
                storedYear: text(student.tahun_pelajaran) || text(classroom?.tahun_ajaran),
                activePeriod: activeAcademicPeriod,
            }),
        };
    }), [students, classMap, activeAcademicYear]);
    const effectiveStaff = useMemo(() => staff.map((user) => {
        const homerooms = classes.filter((classroom) => teacherMatches(user, classroom.wali_kelas));
        return {
            ...user,
            classroom_ids: homerooms.map((item) => keyOf(item.id)),
            kelas_wali: homerooms.map((item) => item.name),
        };
    }), [staff, classes]);
    const positions = useMemo(() => [
        ...new Set(staff
            .map((item) => text(item.jabatan))
            .filter(Boolean)),
    ].sort((left, right) => collator.compare(left, right)), [staff]);
    const academicYears = useMemo(() => [
        ...new Set(effectiveStudents
            .map((item) => text(item.tahun_pelajaran))
            .filter(Boolean)),
    ].sort((left, right) => collator.compare(right, left)), [effectiveStudents]);
    const source = type === "student"
        ? effectiveStudents
        : effectiveStaff;
    useEffect(() => {
        const valid = new Set(source
            .filter((item) => item.id != null)
            .map((item) => keyOf(item.id)));
        setSelected((previous) => {
            let changed = false;
            const next = new Set();
            previous.forEach((id) => {
                if (valid.has(id)) {
                    next.add(id);
                }
                else {
                    changed = true;
                }
            });
            return changed
                ? next
                : previous;
        });
    }, [source]);
    const filtered = useMemo(() => {
        const query = text(search).toLocaleLowerCase("id-ID");
        return source
            .filter((user) => {
            if (query) {
                const matched = [
                    user.nama_lengkap,
                    user.nisn,
                    user.nik,
                    user.nip,
                    user.username,
                ].some((value) => text(value)
                    .toLocaleLowerCase("id-ID")
                    .includes(query));
                if (!matched) {
                    return false;
                }
            }
            if (loginStatus &&
                Boolean(user.izin_login) !==
                    (loginStatus === "active")) {
                return false;
            }
            if (type === "student") {
                if (educationStatus &&
                    user.education_state !==
                        educationStatus) {
                    return false;
                }
                if (academicYear &&
                    text(user.tahun_pelajaran) !== academicYear) {
                    return false;
                }
                if (classFilter ===
                    "unassigned" &&
                    user.classroom_id != null) {
                    return false;
                }
                if (classFilter &&
                    classFilter !==
                        "unassigned" &&
                    keyOf(user.classroom_id) !== classFilter) {
                    return false;
                }
            }
            else if (position &&
                text(user.jabatan) !==
                    position) {
                return false;
            }
            return true;
        })
            .sort((left, right) => collator.compare(text(left.nama_lengkap), text(right.nama_lengkap)));
    }, [
        source,
        type,
        search,
        educationStatus,
        loginStatus,
        classFilter,
        academicYear,
        position,
    ]);
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
    }, [page, totalPages]);
    const rows = useMemo(() => filtered.slice((page - 1) * limit, page * limit), [filtered, page, limit]);
    const selectedUsers = useMemo(() => source.filter((item) => selected.has(keyOf(item.id))), [source, selected]);
    const selectionCount = selectedUsers.length;

    const blockedStudentSelection = useMemo(
        () =>
            type === "student"
                ? selectedUsers.filter(
                      (user) =>
                          user.status_aktif === false ||
                          user.education_state !== "current"
                  )
                : [],
        [type, selectedUsers]
    );

    const hasBlockedStudentSelection =
        blockedStudentSelection.length > 0;
    const pageIds = useMemo(() => rows
        .filter((item) => item.id != null)
        .map((item) => keyOf(item.id)), [rows]);
    const allPage = pageIds.length > 0 &&
        pageIds.every((id) => selected.has(id));
    const somePage = pageIds.some((id) => selected.has(id)) && !allPage;
    const currentError = type === "student"
        ? studentError
        : staffError;
    const filtersActive = Boolean(educationStatus ||
        loginStatus ||
        classFilter ||
        academicYear ||
        position);
    const rowIdsKey = useMemo(() => rows
        .map((item) => keyOf(item.id))
        .filter(Boolean)
        .join("|"), [rows]);
    const hydrateUsers = useCallback(async (ids, { all = false } = {}) => {
        const unique = [
            ...new Set(ids
                .map(keyOf)
                .filter(Boolean)),
        ];
        const hydrated = type === "student"
            ? hydratedStudentIds.current
            : hydratedStaffIds.current;
        const pending = unique.filter((id) => !hydrated.has(id));
        if (!pending.length) {
            return;
        }
        const sequence = ++detailSequence.current;
        if (all) {
            setAdvancedDetailLoading(true);
        }
        else {
            setRowDetailLoading(true);
        }
        try {
            const results = await settleWithConcurrency(pending, (id) => type === "student"
                ? cachedStudentDetail(id)
                : cachedStaffDetail(id), DETAIL_CONCURRENCY);
            if (sequence !==
                detailSequence.current) {
                return;
            }
            if (type === "student") {
                const updates = new Map();
                results.forEach((result, index) => {
                    if (result.status !==
                        "fulfilled") {
                        return;
                    }
                    const detail = result.value;
                    const meta = studentEducationMeta(detail);
                    const id = pending[index];
                    hydrated.add(id);
                    updates.set(id, {
                        ...meta,
                        tanggal_lahir: detail
                            ?.tanggal_lahir ||
                            "",
                    });
                });
                setStudents((previous) => previous.map((item) => {
                    const update = updates.get(keyOf(item.id));
                    return update
                        ? {
                            ...item,
                            ...update,
                        }
                        : item;
                }));
            }
            else {
                const updates = new Map();
                results.forEach((result, index) => {
                    if (result.status !==
                        "fulfilled") {
                        return;
                    }
                    const detail = result.value;
                    const id = pending[index];
                    hydrated.add(id);
                    updates.set(id, {
                        tanggal_lahir: detail
                            ?.tanggal_lahir ||
                            "",
                    });
                });
                setStaff((previous) => previous.map((item) => {
                    const update = updates.get(keyOf(item.id));
                    return update
                        ? {
                            ...item,
                            ...update,
                        }
                        : item;
                }));
            }
        }
        finally {
            if (sequence ===
                detailSequence.current) {
                if (all) {
                    setAdvancedDetailLoading(false);
                }
                else {
                    setRowDetailLoading(false);
                }
            }
        }
    }, [type]);
    useEffect(() => {
        if (loading ||
            !rows.length) {
            return;
        }
        const timer = window.setTimeout(() => {
            hydrateUsers(rows.map((item) => item.id));
        }, 80);
        return () => window.clearTimeout(timer);
    }, [
        loading,
        rowIdsKey,
        hydrateUsers,
    ]);
    const hydrateAllStudentMetadata = useCallback(() => hydrateUsers(students.map((item) => item.id), { all: true }), [students, hydrateUsers]);
    const changeEducationStatus = async (event) => {
        const value = event.target.value;
        if (value &&
            value !== "current") {
            await hydrateAllStudentMetadata();
        }
        setEducationStatus(value);
    };
    const changeAcademicYear = async (event) => {
        const value = event.target.value;
        if (value) {
            await hydrateAllStudentMetadata();
        }
        setAcademicYear(value);
    };
    const toggleSelected = (id) => {
        const key = keyOf(id);
        setSelected((previous) => {
            const next = new Set(previous);
            if (next.has(key)) {
                next.delete(key);
            }
            else {
                next.add(key);
            }
            return next;
        });
    };
    const togglePage = () => {
        setSelected((previous) => {
            const next = new Set(previous);
            const remove = pageIds.every((id) => next.has(id));
            pageIds.forEach((id) => {
                if (remove) {
                    next.delete(id);
                }
                else {
                    next.add(id);
                }
            });
            return next;
        });
    };
    const resetFilters = () => {
        setEducationStatus("");
        setLoginStatus("");
        setClassFilter("");
        setAcademicYear("");
        setPosition("");
    };
    const clearSelection = () => {
        setSelected(new Set());
        setTargetClass("");
        setBulkEducationState("");
        setBulkExitDate("");
        setBulkExitReason("");
    };
    const toggleSelectionMode = () => {
        setSelectionMode((value) => {
            if (value) {
                clearSelection();
            }
            return !value;
        });
    };
    const applyUpdated = (values, userType = type) => {
        const map = new Map(values.map((item) => [
            keyOf(item.id),
            item,
        ]));
        if (userType === "student") {
            setStudents((previous) => previous.map((item) => map.get(keyOf(item.id)) ?? item));
            return;
        }
        setStaff((previous) => previous.map((item) => map.get(keyOf(item.id)) ?? item));
    };
    const mergeStudent = (result, fallback) => {
        if (!result) {
            return fallback;
        }
        return {
            ...fallback,
            ...result,
            id: result.id ??
                fallback.id,
            nama_lengkap: text(result.nama_lengkap) ||
                text(fallback.nama_lengkap),
            nisn: text(result.nisn) ||
                text(fallback.nisn),
            nik: text(result.nik) ||
                text(fallback.nik),
            username: text(result.username) ||
                text(fallback.username),
            classroom_id: result.classroom_id ??
                fallback.classroom_id,
            nama_kelas: text(result.nama_kelas) ||
                text(fallback.nama_kelas),
        };
    };
    const mergeStaff = (result, fallback) => {
        if (!result) {
            return fallback;
        }
        return {
            ...fallback,
            ...result,
            id: result.id ??
                fallback.id,
            nama_lengkap: text(result.nama_lengkap) ||
                text(fallback.nama_lengkap),
            nik: text(result.nik) ||
                text(fallback.nik),
            nip: text(result.nip) ||
                text(fallback.nip),
            jabatan: text(result.jabatan) ||
                text(fallback.jabatan),
            username: text(result.username) ||
                text(fallback.username),
            tanggal_lahir: text(fallback.tanggal_lahir),
        };
    };
    const runBulk = async ({ action, targets, transform, message, userType = type, }) => {
        if (!targets.length ||
            busy) {
            return;
        }
        setBusy(action);
        setNotice(null);
        try {
            const results = await settleWithConcurrency(targets, async (user) => {
                const payload = transform(user);
                if (userType ===
                    "student") {
                    const result = await updateStudentUser(user.id, payload);
                    return mergeStudent(result, payload);
                }
                const result = await updateStaffUser(user.id, payload);
                return mergeStaff(result, payload);
            });
            const success = [];
            const failed = new Set();
            results.forEach((result, index) => {
                if (result.status ===
                    "fulfilled") {
                    success.push(result.value);
                }
                else {
                    failed.add(keyOf(targets[index].id));
                }
            });
            applyUpdated(success, userType);
            if (userType === "student" &&
                success.length) {
                await invalidateStudentOperationalCaches();
            }
            setSelected(failed);
            setNotice(failed.size
                ? {
                    type: "error",
                    text: `${success.length} berhasil, ${failed.size} gagal diproses.`,
                }
                : {
                    type: "success",
                    text: message(success.length),
                });
            return {
                success: success.length,
                failed: failed.size,
                items: success,
            };
        }
        finally {
            setBusy("");
        }
    };
    const bulkMove = async () => {
        const target = classMap.byId.get(targetClass);

        if (hasBlockedStudentSelection) {
            setNotice({
                type: "error",
                text: `${blockedStudentSelection.length} siswa Lulus/Pindah tidak dapat dipindahkan kelas. Pilih hanya siswa yang masih aktif di lembaga.`,
            });
            return;
        }
        if (!target) {
            setNotice({ type: "error", text: "Pilih kelas tujuan terlebih dahulu." });
            return;
        }
        if (activeAcademicYear && text(target.tahun_ajaran) !== activeAcademicYear) {
            setNotice({
                type: "error",
                text: `Kelas ${target.name} belum dikonfigurasi untuk periode aktif ${activeAcademicYear}. Ubah kurikulum kelas dari Administrasi → Data Kelas terlebih dahulu.`,
            });
            return;
        }

        const targets = selectedUsers.filter((user) => keyOf(user.classroom_id) !== targetClass);
        const skipped = selectedUsers.length - targets.length;
        if (!targets.length) {
            clearSelection();
            setNotice({ type: "success", text: `Semua siswa terpilih sudah berada di ${target.name}.` });
            return;
        }

        setBusy("move");
        setNotice(null);
        try {
            await syncStudentsToClassroomMembership({
                studentIds: targets.map((user) => user.id),
                targetClassroomId: target.id,
            });
            const results = await settleWithConcurrency(targets, async (user) => {
                const result = await updateStudentUser(user.id, {
                    ...user,
                    classroom_id: target.id,
                });
                return mergeStudent(result, { ...user, classroom_id: target.id, nama_kelas: target.name });
            }, 3);
            const success = [];
            const failed = new Set();
            results.forEach((result, index) => {
                if (result.status === "fulfilled") success.push(result.value);
                else failed.add(keyOf(targets[index].id));
            });
            applyUpdated(success, "student");
            await invalidateStudentOperationalCaches(targets.map((user) => user.id));
            await Promise.all([loadClasses(), load({ fresh: true })]);
            setSelected(failed);
            setNotice(failed.size
                ? { type: "error", text: `${success.length} akun berhasil disinkronkan, ${failed.size} akun perlu dicek ulang. Keanggotaan kelas sudah disimpan dari Data Kelas.` }
                : { type: "success", text: `${success.length} siswa berhasil dipindahkan ke ${target.name}${skipped ? `, ${skipped} sudah berada di kelas tersebut` : ""}.` });
            if (!failed.size) setTargetClass("");
        } catch (error) {
            setNotice({ type: "error", text: errorOf(error) });
        } finally {
            setBusy("");
        }
    };
    const bulkStudentEducation = async () => {
        if (!bulkEducationState) {
            setNotice({
                type: "error",
                text: "Pilih status pendidikan yang akan diterapkan.",
            });
            return;
        }
        if ([
            "graduated",
            "left",
        ].includes(bulkEducationState) &&
            !bulkExitDate) {
            setNotice({
                type: "error",
                text: "Tanggal keluar wajib diisi.",
            });
            return;
        }
        if (!selectedUsers.length || busy) {
            return;
        }
        if (bulkEducationState === "current" && activeAcademicYear) {
            const invalid = selectedUsers.filter((user) => {
                if (user.classroom_id == null) return false;
                const classroom = classMap.byId.get(keyOf(user.classroom_id));
                return !classroom || text(classroom.tahun_ajaran) !== activeAcademicYear;
            });
            if (invalid.length) {
                setNotice({
                    type: "error",
                    text: `${invalid.length} siswa masih terhubung ke kelas periode lama. Pindahkan/atur kelas ${activeAcademicYear} terlebih dahulu sebelum mengaktifkan kembali status pendidikan.`,
                });
                return;
            }
        }
        setBusy("education");
        setNotice(null);
        try {
            const results = await settleWithConcurrency(selectedUsers, async (user) => {
                const student = await updateStudentEducation(user.id, {
                    education_state: bulkEducationState,
                    tahun_pelajaran:
                        bulkEducationState === "current" ||
                        user.education_state === "current" ||
                        user.status_aktif !== false
                            ? activeAcademicYear || text(user.tahun_pelajaran) || undefined
                            : text(user.tahun_pelajaran) || undefined,
                    tanggal_keluar: bulkExitDate ||
                        undefined,
                    alasan_keluar: bulkEducationState ===
                        "left"
                        ? bulkExitReason ||
                            undefined
                        : undefined,
                });
                cacheSet(studentDetailCache, user.id, student);
                const meta = studentEducationMeta(student);
                const shouldActive = meta.education_state ===
                    "current";
                let account = user;
                if (user.status_aktif !==
                    shouldActive ||
                    (!shouldActive &&
                        user.izin_login)) {
                    account =
                        await updateStudentUser(user.id, {
                            ...user,
                            status_aktif: shouldActive,
                            izin_login: shouldActive
                                ? Boolean(user.izin_login)
                                : false,
                        });
                }
                return {
                    ...mergeStudent(account, user),
                    ...meta,
                    status_aktif: shouldActive,
                };
            });
            const success = [];
            const failed = new Set();
            results.forEach((result, index) => {
                if (result.status ===
                    "fulfilled") {
                    success.push(result.value);
                }
                else {
                    failed.add(keyOf(selectedUsers[index].id));
                }
            });
            if (success.length) {
                if (bulkEducationState === "current") {
                    const groups = new Map();
                    success.forEach((user) => {
                        const classId = user.classroom_id ?? null;
                        const key = keyOf(classId);
                        if (!groups.has(key)) groups.set(key, { classId, ids: [] });
                        groups.get(key).ids.push(user.id);
                    });
                    for (const group of groups.values()) {
                        await syncStudentsToClassroomMembership({
                            studentIds: group.ids,
                            targetClassroomId: group.classId,
                        });
                    }
                } else {
                    await syncStudentsToClassroomMembership({
                        studentIds: success.map((user) => user.id),
                        targetClassroomId: null,
                    });
                }
            }
            applyUpdated(success, "student");
            if (success.length) {
                await invalidateStudentOperationalCaches(success.map((user) => user.id));
                await loadClasses();
            }
            setSelected(failed);
            setNotice(failed.size
                ? {
                    type: "error",
                    text: `${success.length} berhasil, ${failed.size} gagal diperbarui.`,
                }
                : {
                    type: "success",
                    text: `${success.length} siswa berhasil diperbarui.`,
                });
            if (!failed.size) {
                setBulkEducationState("");
                setBulkExitDate("");
                setBulkExitReason("");
            }
        }
        finally {
            setBusy("");
        }
    };
    const bulkLogin = (value) => {
        if (
            type === "student" &&
            value &&
            hasBlockedStudentSelection
        ) {
            setNotice({
                type: "error",
                text: `${blockedStudentSelection.length} siswa Lulus/Pindah tidak dapat diaktifkan akses loginnya. Aktifkan kembali status pendidikan siswa terlebih dahulu.`,
            });
            return;
        }

        const targets = selectedUsers.filter(
            (item) => item.izin_login !== value
        );
        if (!targets.length) {
            clearSelection();
            setNotice({
                type: "success",
                text: `Semua akun terpilih sudah ${value
                    ? "aktif"
                    : "nonaktif"}.`,
            });
            return;
        }
        runBulk({
            action: value
                ? "enable-login"
                : "disable-login",
            targets,
            transform: (user) => ({
                ...user,
                izin_login: value,
            }),
            message: (count) => `${count} akun berhasil ${value
                ? "diaktifkan"
                : "dinonaktifkan"}.`,
        });
    };
    const saveEditor = async (draft) => {
        if (draft?.id == null ||
            editorSaving) {
            return;
        }
        setEditorSaving(true);
        setNotice(null);
        try {
            const { password, ...safeDraft } = draft;
            if (type === "student") {
                const educationChanged = [
                    "education_state",
                    "tanggal_keluar",
                    "alasan_keluar",
                ].some((field) => text(draft[field]) !==
                    text(editor?.[field]));
                let meta = {
                    education_state: draft.education_state,
                    tahun_pelajaran: draft.tahun_pelajaran,
                    tanggal_keluar: text(draft.tanggal_keluar),
                    alasan_keluar: text(draft.alasan_keluar),
                };
                if (educationChanged) {
                    const updatedStudent = await updateStudentEducation(draft.id, {
                        education_state: draft.education_state,
                        tahun_pelajaran:
                            draft.education_state === "current" ||
                            editor?.education_state === "current"
                                ? activeAcademicYear || text(draft.tahun_pelajaran) || undefined
                                : text(draft.tahun_pelajaran) || undefined,
                        tanggal_keluar: draft.tanggal_keluar,
                        alasan_keluar: draft.alasan_keluar,
                    });
                    cacheSet(studentDetailCache, draft.id, updatedStudent);
                    meta =
                        studentEducationMeta(updatedStudent);
                }
                const nextActive = meta.education_state ===
                    "current";
                const payload = {
                    ...safeDraft,
                    status_aktif: nextActive,
                    izin_login: nextActive
                        ? Boolean(safeDraft.izin_login)
                        : false,
                    ...(text(password)
                        ? { password }
                        : {}),
                };
                const classroomChanged = keyOf(draft.classroom_id) !== keyOf(editor?.classroom_id);
                if (nextActive && (classroomChanged || educationChanged)) {
                    const target = draft.classroom_id == null || !keyOf(draft.classroom_id)
                        ? null
                        : classMap.byId.get(keyOf(draft.classroom_id));
                    if (target && activeAcademicYear && text(target.tahun_ajaran) !== activeAcademicYear) {
                        throw new Error(`Kelas ${target.name} belum dikonfigurasi untuk periode aktif ${activeAcademicYear}.`);
                    }
                    await syncStudentClassroomMembership({
                        studentId: draft.id,
                        targetClassroomId: draft.classroom_id ?? null,
                    });
                } else if (!nextActive && (educationChanged || classroomChanged)) {
                    await syncStudentClassroomMembership({
                        studentId: draft.id,
                        targetClassroomId: null,
                    });
                }
                const result = await updateStudentUser(draft.id, payload);
                applyUpdated([
                    {
                        ...mergeStudent(result, safeDraft),
                        ...meta,
                        status_aktif: nextActive,
                    },
                ], "student");
                await invalidateStudentOperationalCaches();
            }
            else {
                const currentIds = new Set(
                    (editor?.classroom_ids || []).map(keyOf)
                );

                const nextIds = new Set(
                    (draft.classroom_ids || []).map(keyOf)
                );

                const removals = [
                    ...currentIds,
                ].filter(
                    (id) => !nextIds.has(id)
                );

                if (removals.length) {
                    const names = removals
                        .map(
                            (id) =>
                                classMap.byId.get(id)
                                    ?.name
                        )
                        .filter(Boolean)
                        .join(", ");

                    throw new Error(
                        `Pelepasan wali kelas belum didukung endpoint kelas saat ini${
                            names
                                ? ` untuk ${names}`
                                : ""
                        }. Ubah wali kelas dari Administrasi Kelas agar data tidak menjadi tidak sinkron.`
                    );
                }

                const additions = [
                    ...nextIds,
                ].filter(
                    (id) =>
                        !currentIds.has(id)
                );

                const additionClasses =
                    additions.map((id) => {
                        const classroom =
                            classMap.byId.get(id);

                        if (!classroom) {
                            throw new Error(
                                "Data kelas tidak ditemukan."
                            );
                        }

                        if (
                            classroom.wali_kelas &&
                            !teacherMatches(
                                draft,
                                classroom.wali_kelas
                            )
                        ) {
                            throw new Error(
                                `${classroom.name} sudah memiliki wali kelas.`
                            );
                        }

                        if (
                            classroom.curriculum_id ==
                            null
                        ) {
                            throw new Error(
                                `Kurikulum ${classroom.name} tidak tersedia.`
                            );
                        }

                        return classroom;
                    });

                const result =
                    await updateStaffUser(
                        draft.id,
                        {
                            ...safeDraft,
                            ...(text(password)
                                ? {
                                      password,
                                  }
                                : {}),
                        }
                    );

                applyUpdated(
                    [
                        mergeStaff(
                            result,
                            safeDraft
                        ),
                    ],
                    "staff"
                );

                for (
                    const classroom
                    of additionClasses
                ) {
                    await updateClassroom(
                        classroom.id,
                        {
                            nama_kelas:
                                classroom.name,
                            wali_kelas_id:
                                draft.id,
                            curriculum_id:
                                classroom.curriculum_id,
                            student_ids:
                                classroom.student_ids,
                        }
                    );
                }

                if (
                    additionClasses.length
                ) {
                    await loadClasses();
                }
            }
            setEditor(null);
            setNotice({
                type: "success",
                text: "Perubahan berhasil disimpan.",
            });
        }
        catch (error) {
            setNotice({
                type: "error",
                text: errorOf(error),
            });
        }
        finally {
            setEditorSaving(false);
        }
    };
    return (<div className="min-w-0">
      <div>
        <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
          Manajemen Pengguna
        </h1>

        <p className="mt-1 max-w-2xl text-[13px] leading-5 text-slate-400">
          Kelola penempatan, status akun dan akses pengguna sekolah.
        </p>
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
        <TypeTabs value={type} onChange={setType}/>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">
            <b className="font-semibold text-slate-600">
              {totalItems}
            </b>{" "}
            {type === "student"
            ? "siswa"
            : "staff & guru"}

            {desktopTable &&
            rowDetailLoading && (<span className="ml-1 text-[9px] text-slate-300">
                  · memuat detail
                </span>)}
          </span>

          <button type="button" onClick={() => setFiltersOpen((value) => !value)} className={`ui-toolbar-button ${filtersOpen ||
            filtersActive
            ? "is-active"
            : ""}`}>
            <FunnelIcon className="h-4 w-4"/>
            Filter
          </button>

          <button type="button" onClick={toggleSelectionMode} className={`ui-toolbar-button ${selectionMode
            ? "is-active"
            : ""}`}>
            <CheckCircleIcon className="h-4 w-4"/>
            Pilih
          </button>
        </div>
      </div>

      {currentError && (<div className="mt-4 flex items-start justify-between gap-4 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3">
          <div className="flex min-w-0 gap-2.5">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"/>

            <div>
              <p className="text-[13px] font-semibold text-rose-600">
                Gagal memuat data
              </p>

              <p className="mt-0.5 text-xs leading-5 text-rose-500">
                {currentError}
              </p>
            </div>
          </div>

          <button type="button" onClick={() => load({ fresh: true })} className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-rose-600">
            <ArrowPathIcon className="h-3.5 w-3.5"/>
            Muat ulang
          </button>
        </div>)}

      {classError && (<div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3">
          <div className="flex min-w-0 gap-2.5">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/>

            <div>
              <p className="text-xs font-semibold text-amber-700">
                Master kelas gagal dimuat
              </p>

              <p className="mt-1 text-[11px] leading-5 text-amber-600">
                {classError}
              </p>
            </div>
          </div>

          <button type="button" onClick={loadClasses} className="shrink-0 text-[11px] font-semibold text-amber-700">
            Muat ulang
          </button>
        </div>)}

      <section className="ui-table-card mt-4">
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>

            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={type === "student"
            ? "Cari nama, NIK atau NIS..."
            : "Cari nama, NIK atau NIP..."} className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-9 text-[13px] text-slate-700 outline-none placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50"/>

            {search && (<button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-300 hover:bg-slate-100">
                <XMarkIcon className="h-3.5 w-3.5"/>
              </button>)}
          </div>

          {filtersOpen && (<div className={`mt-2 grid gap-2 ${type === "student"
                ? "sm:grid-cols-2 xl:grid-cols-4"
                : "sm:grid-cols-2"}`}>
              {type === "student" ? (<>
                  <select value={classFilter} onChange={(event) => setClassFilter(event.target
                    .value)} className="ui-compact-control">
                    <option value="">
                      Semua Kelas
                    </option>
                    <option value="unassigned">
                      Belum Ditentukan
                    </option>

                    {classes.map((item) => (<option key={keyOf(item.id)} value={keyOf(item.id)}>
                          {item.name}
                        </option>))}
                  </select>

                  <select value={academicYear} disabled={advancedDetailLoading} onChange={changeAcademicYear} className="ui-compact-control">
                    <option value="">
                      Semua Tahun Ajar
                    </option>

                    {academicYears.map((item) => (<option key={item} value={item}>
                          {item}
                        </option>))}
                  </select>

                  <select value={loginStatus} onChange={(event) => setLoginStatus(event.target
                    .value)} className="ui-compact-control">
                    <option value="">
                      Semua Akses Akun
                    </option>
                    <option value="active">
                      Aktif
                    </option>
                    <option value="inactive">
                      Nonaktif
                    </option>
                  </select>

                  <select value={educationStatus} disabled={advancedDetailLoading} onChange={changeEducationStatus} className="ui-compact-control">
                    <option value="">
                      Semua Status Pendidikan
                    </option>
                    <option value="current">
                      Masih di Lembaga
                    </option>
                    <option value="graduated">
                      Lulus
                    </option>
                    <option value="left">
                      Pindah / Mengundurkan Diri
                    </option>
                  </select>
                </>) : (<>
                  <select value={position} onChange={(event) => setPosition(event.target
                    .value)} className="ui-compact-control">
                    <option value="">
                      Semua Jabatan
                    </option>

                    {positions.map((item) => (<option key={item} value={item}>
                          {item}
                        </option>))}
                  </select>

                  <select value={loginStatus} onChange={(event) => setLoginStatus(event.target
                    .value)} className="ui-compact-control">
                    <option value="">
                      Semua Akses Akun
                    </option>
                    <option value="active">
                      Aktif
                    </option>
                    <option value="inactive">
                      Nonaktif
                    </option>
                  </select>
                </>)}

              {filtersActive && (<button type="button" onClick={resetFilters} className="h-9 rounded-lg px-3 text-xs font-semibold text-[#ef4d45] hover:bg-red-50">
                  Reset Filter
                </button>)}
            </div>)}
        </div>

        {selectionMode &&
            selectionCount > 0 && (<div className="border-b border-red-100 bg-red-50/60 px-4 py-3">
              <div className="flex flex-col gap-2">
                <p className="text-[12px] font-semibold text-slate-700">
                  {selectionCount} pengguna dipilih
                </p>

                <div className="flex flex-wrap gap-2">
                  {type === "student" && (<>
                      <select value={targetClass} disabled={Boolean(busy) ||
                    !operationalClasses.length} onChange={(event) => setTargetClass(event.target
                    .value)} className="h-9 rounded-lg border border-red-100 bg-white px-3 text-xs text-slate-600">
                        <option value="">
                          Pilih kelas tujuan
                        </option>

                        {operationalClasses.map((item) => (<option key={keyOf(item.id)} value={keyOf(item.id)}>
                              {item.name}
                            </option>))}
                      </select>

                      <button type="button" onClick={bulkMove} disabled={!targetClass ||
                    Boolean(busy) ||
                    hasBlockedStudentSelection} className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-[#ef4d45] px-3 text-xs font-semibold text-white disabled:opacity-50">
                        <ArrowsRightLeftIcon className="h-4 w-4"/>
                        Pindahkan
                      </button>

                      <select value={bulkEducationState} disabled={Boolean(busy)} onChange={(event) => setBulkEducationState(event.target
                    .value)} className="h-9 rounded-lg border border-red-100 bg-white px-3 text-xs text-slate-600">
                        <option value="">
                          Pilih status
                        </option>
                        <option value="current">
                          Masih di Lembaga
                        </option>
                        <option value="graduated">
                          Lulus
                        </option>
                        <option value="left">
                          Pindah / Mengundurkan Diri
                        </option>
                      </select>

                      {[
                    "graduated",
                    "left",
                ].includes(bulkEducationState) && (<input type="date" value={bulkExitDate} disabled={Boolean(busy)} onChange={(event) => setBulkExitDate(event.target
                        .value)} className="h-9 rounded-lg border border-red-100 bg-white px-3 text-xs text-slate-600"/>)}

                      {bulkEducationState ===
                    "left" && (<input value={bulkExitReason} disabled={Boolean(busy)} onChange={(event) => setBulkExitReason(event.target
                        .value)} placeholder="Alasan keluar" className="h-9 rounded-lg border border-red-100 bg-white px-3 text-xs text-slate-600"/>)}

                      <button type="button" disabled={Boolean(busy) ||
                    !bulkEducationState} onClick={bulkStudentEducation} className="h-9 rounded-lg border border-[#ef4d45] bg-white px-3 text-xs font-semibold text-[#ef4d45] disabled:opacity-50">
                        Terapkan Status
                      </button>
                    </>)}

                  <button type="button" disabled={Boolean(busy) ||
                    (type === "student" &&
                        hasBlockedStudentSelection)} onClick={() => bulkLogin(true)} className="h-9 rounded-lg border border-emerald-200 bg-white px-3 text-xs font-semibold text-emerald-600 disabled:opacity-50">
                    Aktifkan Akun
                  </button>

                  <button type="button" disabled={Boolean(busy)} onClick={() => bulkLogin(false)} className="h-9 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-500">
                    Nonaktifkan Akun
                  </button>

                  <button type="button" onClick={clearSelection} className="h-9 rounded-lg px-3 text-xs font-semibold text-slate-400">
                    Batal Pilih
                  </button>
                </div>
              </div>
            </div>)}

        <div className="md:hidden">
          {loading ? (<div className="p-6 text-center text-xs text-slate-400">
              Memuat data...
            </div>) : rows.length ? (rows.map((user, index) => {
            const checked = selected.has(keyOf(user.id));
            return (<article key={`${type}-${keyOf(user.id) || index}`} className={`border-b border-slate-100 px-4 py-3 last:border-0 ${checked
                    ? "bg-red-50/30"
                    : ""}`}>
                    <div className="flex items-start gap-2.5">
                      {selectionMode && (<div className="pt-1">
                          <Checkbox checked={checked} onChange={() => toggleSelected(user.id)} label={`Pilih ${user.nama_lengkap}`}/>
                        </div>)}

                      <span className="w-5 shrink-0 pt-0.5 text-[10px] text-slate-300">
                        #
                        {(page - 1) *
                    limit +
                    index +
                    1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-800">
                              {show(user.nama_lengkap)}
                            </p>

                            <p className="mt-0.5 text-[10px] text-slate-400">
                              NIK{" "}
                              {show(user.nik)}
                            </p>
                          </div>

                          <button type="button" onClick={() => setEditor(user)} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-2.5 text-[10px] font-semibold text-slate-600">
                            <PencilSquareIcon className="h-3.5 w-3.5"/>
                            Kelola
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-2 text-[10px]">
                          <div>
                            <p className="text-slate-400">
                              {type ===
                    "student"
                    ? "Kelas"
                    : "Tanggal Lahir"}
                            </p>

                            <div className="mt-1">
                              {type ===
                    "student" ? (<ClassBadge value={user.nama_kelas} educationState={type === "student" ? user.education_state : "current"}/>) : (<span className="text-slate-600">
                                  {dateDisplay(user.tanggal_lahir)}
                                </span>)}
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-400">
                              {type ===
                    "student"
                    ? "Status Pendidikan"
                    : "Jabatan"}
                            </p>

                            <div className="mt-1">
                              {type ===
                    "student" ? (<EducationBadge value={user.education_state}/>) : (<span className="text-slate-600">
                                  {show(user.jabatan)}
                                </span>)}
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-400">
                              {type ===
                    "student"
                    ? "Tahun Ajar"
                    : "Kelas Wali"}
                            </p>

                            <div className="mt-1">
                              {type ===
                    "student" ? (<span className="text-slate-600">
                                  {show(user.tahun_pelajaran)}
                                </span>) : (<HomeroomBadges user={user}/>)}
                            </div>
                          </div>

                          <div>
                            <p className="text-slate-400">
                              Status Akun
                            </p>

                            <div className="mt-1">
                              <StatusBadge value={user.izin_login}/>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </article>);
        })) : (<Empty filtered={Boolean(search) ||
                filtersActive} type={type}/>)}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className={`w-full ${type === "student"
            ? "min-w-235"
            : "min-w-255"}`}>
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {selectionMode && (<th className="w-11 px-3 py-2.5 text-center">
                    <Checkbox checked={allPage} indeterminate={somePage} onChange={togglePage} label="Pilih semua"/>
                  </th>)}

                <th className="w-12 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  No
                </th>

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Nama Pengguna
                </th>

                {type === "student" ? (<>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Kelas
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Status Pendidikan
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Tahun Ajar
                    </th>
                  </>) : (<>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Tanggal Lahir
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Jabatan
                    </th>
                    <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                      Kelas Wali
                    </th>
                  </>)}

                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Status Akun
                </th>

                <th className="w-24 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">
                  Aksi
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100">
              {loading ? (Array.from({ length: 6 }, (_, rowIndex) => (<tr key={rowIndex}>
                      {Array.from({
                length: selectionMode
                    ? 8
                    : 7,
            }, (_, cellIndex) => (<td key={cellIndex} className="px-3 py-3">
                            <div className="h-3 animate-pulse rounded bg-slate-100"/>
                          </td>))}
                    </tr>))) : rows.length ? (rows.map((user, index) => {
            const checked = selected.has(keyOf(user.id));
            return (<tr key={`${type}-${keyOf(user.id) || index}`} className={`hover:bg-slate-50/60 ${checked
                    ? "bg-red-50/30"
                    : ""}`}>
                        {selectionMode && (<td className="px-3 py-2.5 text-center">
                            <Checkbox checked={checked} onChange={() => toggleSelected(user.id)} label={`Pilih ${user.nama_lengkap}`}/>
                          </td>)}

                        <td className="px-3 py-2.5 text-[11px] text-slate-400">
                          {(page - 1) *
                    limit +
                    index +
                    1}
                        </td>

                        <td className="px-3 py-2.5">
                          <p className="max-w-60 truncate text-[12px] font-semibold text-slate-800">
                            {show(user.nama_lengkap)}
                          </p>

                          <p className="mt-0.5 text-[10px] text-slate-400">
                            NIK{" "}
                            {show(user.nik)}
                          </p>
                        </td>

                        {type ===
                    "student" ? (<>
                            <td className="px-3 py-2.5">
                              <ClassBadge value={user.nama_kelas} educationState={type === "student" ? user.education_state : "current"}/>
                            </td>

                            <td className="px-3 py-2.5">
                              <EducationBadge value={user.education_state}/>
                            </td>

                            <td className="px-3 py-2.5 text-[11px] text-slate-600">
                              {show(user.tahun_pelajaran)}
                            </td>
                          </>) : (<>
                            <td className="px-3 py-2.5 text-[11px] text-slate-600">
                              {dateDisplay(user.tanggal_lahir)}
                            </td>

                            <td className="px-3 py-2.5 text-[11px] font-medium text-slate-600">
                              {show(user.jabatan)}
                            </td>

                            <td className="px-3 py-2.5">
                              <HomeroomBadges user={user}/>
                            </td>
                          </>)}

                        <td className="px-3 py-2.5">
                          <StatusBadge value={user.izin_login}/>
                        </td>

                        <td className="px-3 py-2.5 text-right">
                          <button type="button" onClick={() => setEditor(user)} className="ui-action-button">
                            <PencilSquareIcon className="h-3.5 w-3.5"/>
                            Kelola
                          </button>
                        </td>
                      </tr>);
        })) : (<tr>
                  <td colSpan={selectionMode
                ? 8
                : 7}>
                    <Empty filtered={Boolean(search) ||
                filtersActive} type={type}/>
                  </td>
                </tr>)}
            </tbody>
          </table>
        </div>

        {!loading &&
            totalItems > 0 && (<Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} className="border-t border-slate-100"/>)}
      </section>

      {editor && (<React.Suspense fallback={null}>
          <UserManagementModal open type={type} user={editor} classes={type === "student" ? operationalClasses : classes} saving={editorSaving} onClose={() => {
                if (!editorSaving) {
                    setEditor(null);
                }
            }} onSave={saveEditor}/>
        </React.Suspense>)}

      <FeedbackPopup notice={notice} onClose={() => setNotice(null)}/>
    </div>);
}
