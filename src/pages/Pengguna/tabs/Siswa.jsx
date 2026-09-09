import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowPathIcon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon, ExclamationTriangleIcon, FunnelIcon, InformationCircleIcon, MagnifyingGlassIcon, PencilSquareIcon, PlusIcon, TrashIcon, UserGroupIcon, XCircleIcon, XMarkIcon, } from "@heroicons/react/24/outline";
import { createStudent, deleteStudent, fetchStudentById, updateStudent, fetchStudentEducationMetas, invalidateStudentEducationMetaCache, } from "../../../api/students";
import { fetchClassroomOptions } from "../../../api/classrooms";
import { fetchAcademicPeriods } from "../../../api/academic-periods";
import { fetchStudentUsers, updateStudentUser } from "../../../api/users";
import Pagination from "../../../components/common/Pagination";
import { apiErrorMessage } from "../../../lib/apiError";
import { resolveStudentAcademicYear } from "../../../lib/academicYear";
import { invalidateStudentData, subscribeStudentDataChanges } from "../../../lib/studentDataSync";
import { removeStudentFromClassrooms, syncStudentClassroomMembership } from "../../../lib/studentClassroomSync";
const StudentDetailModal = React.lazy(() => import("./components/StudentDetailModal"));
import StudentForm, { createEmptyStudent, inferStudentEducationMode, inferStudentExitMode, prepareStudentPayload, validateStudentForm, } from "./components/StudentForm";
const text = v => String(v ?? "").trim();
const keyOf = v => String(v ?? "");
const show = v => text(v) || "-";
const copy = v => JSON.parse(JSON.stringify(v));
const inputClass = "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50";
const dateDisplay = value => { const match = text(value).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/); return match ? `${match[3]}/${match[2]}/${match[1]}` : "-"; };
const errorOf = (e, options) => apiErrorMessage(e, options);
const invalidateStudentOperationalCaches = (studentIds = []) =>
    invalidateStudentData({
        studentIds,
        reason: "student-directory",
    });
function managementMaps(users) {
    const byId = new Map(), byNisn = new Map(), byNik = new Map();
    users.forEach(x => {
        if (x?.id !== null && x?.id !== undefined)
            byId.set(keyOf(x.id), x);
        if (text(x?.nisn))
            byNisn.set(text(x.nisn), x);
        if (text(x?.nik))
            byNik.set(text(x.nik), x);
    });
    return { byId, byNisn, byNik };
}
const findManagement = (student, maps) => maps.byNisn.get(text(student.nisn)) ||
    maps.byNik.get(text(student.nik)) ||
    maps.byId.get(keyOf(student.id)) ||
    null;
function mergeStudent(student, management, classMap, activePeriod) {
    const managementClassId = management?.classroom_id;
    const studentClassId = student?.classroom_id ?? student?.classroom?.id ?? null;
    const classroomId = managementClassId !== null && managementClassId !== undefined
        ? managementClassId
        : studentClassId;
    const classroom = classroomId !== null && classroomId !== undefined
        ? classMap.get(keyOf(classroomId)) || {
            id: classroomId,
            nama_kelas: text(management?.nama_kelas) || text(student?.classroom?.nama_kelas),
        }
        : null;
    const studentStatus = student?.status?.status_aktif;
    const educationStatus = typeof studentStatus === "boolean"
        ? studentStatus
        : typeof management?.status_aktif === "boolean"
            ? management.status_aktif
            : true;
    const educationMode = inferStudentEducationMode(student);
    const storedYear = text(student?.status?.tahun_pelajaran) || text(student?.tahun_pelajaran);
    const canonicalYear = resolveStudentAcademicYear({
        educationState: educationMode,
        statusActive: educationStatus,
        storedYear: storedYear || text(classroom?.tahun_ajaran),
        activePeriod,
    });
    return {
        ...student,
        education_mode: educationMode,
        exit_mode: inferStudentExitMode(student),
        education_status: educationStatus,
        classroom_id: classroomId,
        classroom,
        management: management ?? null,
        tahun_pelajaran: canonicalYear,
        status: {
            ...student?.status,
            tahun_pelajaran: canonicalYear,
        },
    };
}
function directoryStudent(user, classMap, activePeriod) {
    const classroomId = user?.classroom_id ?? null;
    const classroom = classroomId !== null && classroomId !== undefined
        ? classMap.get(keyOf(classroomId)) || {
            id: classroomId,
            nama_kelas: text(user?.nama_kelas),
        }
        : null;
    const active = typeof user?.status_aktif === "boolean"
        ? user.status_aktif
        : true;
    return {
        id: user?.id ?? null,
        nama_lengkap: text(user?.nama_lengkap),
        nisn: text(user?.nisn),
        nik: text(user?.nik),
        classroom_id: classroomId,
        classroom,
        management: user ?? null,
        education_status: active,
        education_state: active
            ? "current"
            : "unknown",
        tahun_pelajaran: resolveStudentAcademicYear({
            educationState: active ? "current" : "",
            statusActive: active,
            storedYear: active ? text(classroom?.tahun_ajaran) : "",
            activePeriod,
        }),
        tanggal_keluar: "",
        alasan_keluar: "",
        tanggal_lahir: "",
        no_telepon_rumah: "",
        parent: {},
        status: { status_aktif: active },
    };
}
function ActionDialog({ dialog, onClose }) {
    useEffect(() => {
        if (!dialog)
            return;
        const overflow = document.body.style.overflow;
        const key = e => e.key === "Escape" && !dialog.locked && onClose();
        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", key);
        return () => {
            document.body.style.overflow = overflow;
            window.removeEventListener("keydown", key);
        };
    }, [dialog, onClose]);
    if (!dialog)
        return null;
    const tones = {
        warning: ["bg-amber-50 text-amber-600", "bg-amber-500 hover:bg-amber-600", ExclamationTriangleIcon],
        danger: ["bg-rose-50 text-rose-600", "bg-rose-500 hover:bg-rose-600", ExclamationTriangleIcon],
        success: ["bg-emerald-50 text-emerald-600", "bg-emerald-600 hover:bg-emerald-700", CheckCircleIcon],
        info: ["bg-indigo-50 text-indigo-600", "bg-indigo-600 hover:bg-indigo-700", InformationCircleIcon],
    };
    const [iconClass, buttonClass, Icon] = tones[dialog.tone || "info"];
    const titleId = "student-action-dialog-title";
    return <div role="dialog" aria-modal="true" aria-labelledby={titleId} onMouseDown={e => e.target === e.currentTarget && !dialog.locked && onClose()} className="fixed inset-0 z-200 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4">
    <section className="w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl">
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${iconClass}`}>
            <Icon className="h-5 w-5"/>
          </div>

          <div className="min-w-0 flex-1">
            <h2 id={titleId} className="text-[15px] font-semibold text-slate-900">{dialog.title}</h2>
            {dialog.description && <p className="mt-1.5 text-xs leading-5 text-slate-500">{dialog.description}</p>}
          </div>

          {!dialog.locked && <button type="button" onClick={onClose} aria-label="Tutup dialog" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100">
            <XMarkIcon className="h-4 w-4"/>
          </button>}
        </div>

        {!!dialog.items?.length && <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
          <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            Data yang perlu dilengkapi
          </div>

          <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
            {dialog.items.map(item => <button key={item.field} type="button" onClick={() => dialog.onItem?.(item)} className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-slate-50">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[9px] font-bold text-rose-500">
                !
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-xs font-semibold text-slate-700">{item.label}</span>
                <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">{item.message}</span>
              </span>

              <ChevronRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300"/>
            </button>)}
          </div>
        </div>}

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          {dialog.secondaryLabel && <button type="button" onClick={() => {
                dialog.onSecondary?.();
                onClose();
            }} className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 hover:bg-slate-50">
            {dialog.secondaryLabel}
          </button>}

          <button type="button" onClick={() => {
            dialog.onPrimary?.();
            if (!dialog.keepOpen)
                onClose();
        }} className={`h-10 rounded-lg px-5 text-xs font-semibold text-white ${buttonClass}`}>
            {dialog.primaryLabel || "Oke"}
          </button>
        </div>
      </div>
    </section>
  </div>;
}
function Select({ value, onChange, children, disabled = false }) {
    return <div className="relative">
    <select value={value} onChange={onChange} disabled={disabled} className={`${inputClass} appearance-none pr-9 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}>
      {children}
    </select>
    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
  </div>;
}
const EDUCATION_LABELS = {
    current: "Masih di Lembaga",
    graduated: "Lulus",
    left: "Pindah / Mengundurkan Diri",
    unknown: "Belum Ditentukan",
};
function EducationBadge({ state }) {
    const tone = state === "current"
        ? "bg-emerald-50 text-emerald-600"
        : state === "graduated"
            ? "bg-slate-950 text-white"
            : state === "left"
                ? "bg-amber-50 text-amber-700"
                : "bg-slate-100 text-slate-500";
    return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${tone}`}>
    {state === "current" ? <CheckCircleIcon className="h-3.5 w-3.5"/> : <XCircleIcon className="h-3.5 w-3.5"/>}
    {EDUCATION_LABELS[state] || EDUCATION_LABELS.unknown}
  </span>;
}
function ClassBadge({ student }) {
    return <span className={`inline-flex max-w-45 truncate rounded-full px-2.5 py-1 text-[10px] font-semibold ${student.classroom ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
    {student.classroom?.nama_kelas || "Belum ditempatkan"}
  </span>;
}
function Checkbox({ checked, indeterminate = false, onChange, label }) {
    const ref = React.useRef(null);
    useEffect(() => {
        if (ref.current)
            ref.current.indeterminate = indeterminate;
    }, [indeterminate]);
    return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#ef4d45]"/>;
}
function Empty({ filtered }) {
    return <div className="px-6 py-14 text-center">
    <UserGroupIcon className="mx-auto h-9 w-9 text-slate-200"/>
    <p className="mt-3 text-[13px] font-semibold text-slate-600">
      {filtered ? "Siswa tidak ditemukan" : "Belum ada data siswa"}
    </p>
    <p className="mt-1 text-xs text-slate-400">
      {filtered ? "Ubah pencarian atau filter." : "Tambahkan siswa untuk memulai."}
    </p>
  </div>;
}
export default function StudentsPage() {
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [managementUsers, setManagementUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [managementError, setManagementError] = useState("");
    const [classError, setClassError] = useState("");
    const [search, setSearch] = useState("");
    const [classFilter, setClassFilter] = useState("");
    const [educationFilter, setEducationFilter] = useState("");
    const [schoolYearFilter, setSchoolYearFilter] = useState("");
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selected, setSelected] = useState(new Set());
    const [academicPeriods, setAcademicPeriods] = useState([]);
    const [academicPeriodError, setAcademicPeriodError] = useState("");
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [mode, setMode] = useState("list");
    const [form, setForm] = useState(createEmptyStudent());
    const [initialForm, setInitialForm] = useState(createEmptyStudent());
    const [section, setSection] = useState(0);
    const [errors, setErrors] = useState({});
    const [saving, setSaving] = useState(false);
    const [detail, setDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [deleting, setDeleting] = useState(null);
    const [dialog, setDialog] = useState(null);
    const [rowMetaLoading, setRowMetaLoading] = useState(false);
    const [advancedMetaLoading, setAdvancedMetaLoading] = useState(false);
    const [desktopTable, setDesktopTable] = useState(() => typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches);
    const loadSequence = React.useRef(0);
    const hydratedMetaIds = React.useRef(new Set());
    const metaHydrationSequence = React.useRef(0);
    const classMap = useMemo(() => new Map(classes.map(x => [keyOf(x.id), x])), [classes]);
    const userMaps = useMemo(() => managementMaps(managementUsers), [managementUsers]);
    const activeAcademicPeriod = useMemo(() => academicPeriods.find(period => Boolean(period.is_active)) || null, [academicPeriods]);
    const activeAcademicYear = text(activeAcademicPeriod?.tahun_ajaran);
    const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(initialForm), [form, initialForm]);
    const hydrateMetadata = useCallback(async (ids, { advanced = false, fresh = false } = {}) => {
        const unique = [
            ...new Set(ids
                .filter(id => id !== null && id !== undefined && keyOf(id))
                .map(keyOf)),
        ].filter(id => fresh || !hydratedMetaIds.current.has(id));
        if (!unique.length)
            return;
        const sequence = ++metaHydrationSequence.current;
        if (advanced)
            setAdvancedMetaLoading(true);
        else
            setRowMetaLoading(true);
        try {
            const metas = await fetchStudentEducationMetas(unique, {
                concurrency: 3,
                fresh,
            });
            if (sequence !== metaHydrationSequence.current)
                return;
            const metaMap = new Map(metas.map(item => [keyOf(item.id), item]));
            metas.forEach(item => hydratedMetaIds.current.add(keyOf(item.id)));
            setStudents(current => current.map(student => {
                const meta = metaMap.get(keyOf(student.id));
                if (!meta) {
                    return student;
                }
                const canonicalYear = resolveStudentAcademicYear({
                    educationState: meta.education_state,
                    statusActive: meta.education_state === "current",
                    storedYear: text(meta.tahun_pelajaran) || text(student.classroom?.tahun_ajaran),
                    activePeriod: activeAcademicPeriod,
                });
                return {
                    ...student,
                    ...meta,
                    tahun_pelajaran: canonicalYear,
                };
            }));
        }
        finally {
            if (sequence === metaHydrationSequence.current) {
                if (advanced)
                    setAdvancedMetaLoading(false);
                else
                    setRowMetaLoading(false);
            }
        }
    }, [activeAcademicPeriod]);
    const load = useCallback(async () => {
        const sequence = ++loadSequence.current;
        setLoading(true);
        setError("");
        setManagementError("");
        setClassError("");
        hydratedMetaIds.current = new Set();
        metaHydrationSequence.current += 1;
        const [userResult, classResult, periodResult] = await Promise.allSettled([
            fetchStudentUsers(),
            fetchClassroomOptions(),
            fetchAcademicPeriods(),
        ]);
        if (sequence !== loadSequence.current)
            return;
        const userItems = userResult.status === "fulfilled" ? userResult.value : [];
        const classItems = classResult.status === "fulfilled" ? classResult.value : [];
        if (userResult.status === "rejected") {
            setError(errorOf(userResult.reason));
            setManagementError("");
        }
        if (classResult.status === "rejected") {
            setClassError(errorOf(classResult.reason));
        }
        if (periodResult.status === "fulfilled") {
            setAcademicPeriods(periodResult.value);
            setAcademicPeriodError("");
        }
        else {
            setAcademicPeriods([]);
            setAcademicPeriodError(errorOf(periodResult.reason));
        }
        const classrooms = new Map(classItems.map(item => [keyOf(item.id), item]));
        const loadedActivePeriod = periodResult.status === "fulfilled"
            ? periodResult.value.find(period => Boolean(period.is_active)) || null
            : null;
        const directory = userItems
            .map(user => directoryStudent(user, classrooms, loadedActivePeriod))
            .sort((a, b) => text(a.nama_lengkap).localeCompare(text(b.nama_lengkap), "id", { numeric: true, sensitivity: "base" }));
        setManagementUsers(userItems);
        setClasses(classItems);
        setStudents(directory);
        setLoading(false);
    }, []);
    useEffect(() => { load(); }, [load]);
    useEffect(() => subscribeStudentDataChanges((detail) => {
        if (detail?.reason === "student-directory") return;
        hydratedMetaIds.current = new Set();
        metaHydrationSequence.current += 1;
        load();
    }), [load]);
    useEffect(() => {
        if (typeof window === "undefined" || !window.matchMedia)
            return;
        const media = window.matchMedia("(min-width: 768px)");
        const update = () => setDesktopTable(media.matches);
        update();
        media.addEventListener?.("change", update);
        return () => media.removeEventListener?.("change", update);
    }, []);
    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return students.filter(student => {
            if (q && ![
                student.nama_lengkap,
                student.nisn,
                student.nik,
                student.classroom?.nama_kelas,
            ].some(v => text(v).toLowerCase().includes(q)))
                return false;
            if (classFilter && keyOf(student.classroom_id) !== classFilter)
                return false;
            if (educationFilter && student.education_state !== educationFilter)
                return false;
            if (schoolYearFilter && text(student.tahun_pelajaran) !== schoolYearFilter)
                return false;
            return true;
        }).sort((a, b) => text(a.nama_lengkap).localeCompare(text(b.nama_lengkap), "id", { numeric: true, sensitivity: "base" }));
    }, [students, search, classFilter, educationFilter, schoolYearFilter]);
    useEffect(() => setPage(1), [search, classFilter, educationFilter, schoolYearFilter, limit]);
    const totalItems = filtered.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / limit));
    useEffect(() => {
        if (page > totalPages)
            setPage(totalPages);
    }, [page, totalPages]);
    const rows = useMemo(() => filtered.slice((page - 1) * limit, page * limit), [filtered, page, limit]);
    const rowIds = useMemo(() => rows.map(item => item.id).filter(id => id !== null && id !== undefined), [rows]);
    const rowIdsKey = useMemo(() => rowIds.map(keyOf).join("|"), [rowIds]);
    useEffect(() => {
        if (loading || !rowIds.length)
            return;
        const timer = window.setTimeout(() => {
            hydrateMetadata(rowIds);
        }, 80);
        return () => window.clearTimeout(timer);
    }, [loading, rowIdsKey, hydrateMetadata]);
    const hydrateAdvancedFilter = useCallback(async (kind, value) => {
        if (!value)
            return;
        if (kind === "education" && value === "current") {
            return;
        }
        const candidates = kind === "education"
            ? students.filter(item => item.education_state !== "current")
            : students;
        await hydrateMetadata(candidates.map(item => item.id), { advanced: true });
    }, [students, hydrateMetadata]);
    const changeEducationFilter = async (event) => {
        const value = event.target.value;
        setEducationFilter(value);
        await hydrateAdvancedFilter("education", value);
    };
    const changeSchoolYearFilter = async (event) => {
        const value = event.target.value;
        setSchoolYearFilter(value);
        await hydrateAdvancedFilter("schoolYear", value);
    };
    const schoolYears = useMemo(() => [
        ...new Set([
            ...academicPeriods.map(x => text(x.tahun_ajaran)),
            ...students.map(x => text(x.tahun_pelajaran)),
        ].filter(Boolean)),
    ].sort((a, b) => b.localeCompare(a, "id", { numeric: true })), [academicPeriods, students]);
    const jumpToField = useCallback(item => {
        setDialog(null);
        setSection(item.section);
        setTimeout(() => {
            const el = document.getElementById(`student-${item.field}`);
            el?.scrollIntoView({ behavior: "smooth", block: "center" });
            el?.focus();
        }, 120);
    }, []);
    const validate = () => {
        const invalid = validateStudentForm(form, mode === "create");
        setErrors(Object.fromEntries(invalid.map(x => [x.field, x.message])));
        if (!invalid.length)
            return true;
        setDialog({
            tone: "warning",
            title: "Data Belum Lengkap",
            description: `Ada ${invalid.length} data yang harus diperbaiki sebelum disimpan.`,
            items: invalid,
            secondaryLabel: "Nanti",
            primaryLabel: "Periksa Data",
            onItem: jumpToField,
            onPrimary: () => jumpToField(invalid[0]),
        });
        return false;
    };
    const closeForm = () => {
        const next = createEmptyStudent();
        setMode("list");
        setForm(next);
        setInitialForm(copy(next));
        setErrors({});
        setSection(0);
    };
    const cancelForm = () => {
        if (saving)
            return;
        if (!dirty) {
            closeForm();
            return;
        }
        setDialog({
            tone: "warning",
            title: "Batalkan Perubahan?",
            description: "Semua perubahan yang belum disimpan akan hilang. Apakah Anda yakin ingin membatalkan?",
            secondaryLabel: "Tetap di Form",
            primaryLabel: "Ya, Batalkan",
            onPrimary: closeForm,
        });
    };
    const hydrate = useCallback(student => mergeStudent(student, findManagement(student, userMaps), classMap, activeAcademicPeriod), [userMaps, classMap, activeAcademicPeriod]);
    const openCreate = () => {
        const next = createEmptyStudent();
        setForm(next);
        setInitialForm(copy(next));
        setErrors({});
        setSection(0);
        setMode("create");
    };
    const openEdit = async (student) => {
        if (student.id == null || detailLoading)
            return;
        setDetailLoading(true);
        try {
            const data = hydrate(await fetchStudentById(student.id));
            const base = createEmptyStudent();
            const next = {
                ...base,
                ...data,
                education_mode: inferStudentEducationMode(data),
                exit_mode: inferStudentExitMode(data),
                parent: { ...base.parent, ...data.parent },
                dev: {
                    ...base.dev,
                    ...data.dev,
                    riwayat_perkembangan: Array.isArray(data.dev?.riwayat_perkembangan)
                        ? data.dev.riwayat_perkembangan
                        : [],
                },
                status: { ...base.status, ...data.status },
            };
            setForm(next);
            setInitialForm(copy(next));
            setErrors({});
            setSection(0);
            setMode("edit");
        }
        catch (e) {
            setDialog({
                tone: "danger",
                title: "Gagal membuka Data",
                description: errorOf(e),
                primaryLabel: "Tutup",
            });
        }
        finally {
            setDetailLoading(false);
        }
    };
    const openDetail = async (student) => {
        if (student.id == null || detailLoading)
            return;
        setDetailLoading(true);
        try {
            setDetail(hydrate(await fetchStudentById(student.id)));
        }
        catch (e) {
            setDialog({
                tone: "danger",
                title: "Detail Gagal Dimuat",
                description: errorOf(e),
                primaryLabel: "Tutup",
            });
        }
        finally {
            setDetailLoading(false);
        }
    };
    const syncStudentAccount = useCallback(async ({ student, statusActive, preferredUsername, classroomId, }) => {
        let account = findManagement(student, managementMaps(managementUsers));
        if (!account) {
            const candidates = await fetchStudentUsers({
                search: text(student?.nisn) ||
                    text(student?.nik) ||
                    text(preferredUsername),
                limit: 100,
            });
            account =
                findManagement(student, managementMaps(candidates));
        }
        if (!account ||
            account.id === null ||
            account.id === undefined) {
            throw new Error("Akun siswa tidak ditemukan setelah biodata disimpan.");
        }
        const username = text(preferredUsername) ||
            text(account.username) ||
            text(student?.nisn) ||
            text(student?.nik);
        return updateStudentUser(account.id, {
            username,
            izin_login: statusActive
                ? Boolean(account.izin_login)
                : false,
            classroom_id: classroomId !== undefined
                ? classroomId
                : account.classroom_id ?? null,
            status_aktif: statusActive,
        });
    }, [managementUsers]);
    const save = async () => {
        if (saving ||
            !validate()) {
            return;
        }
        setSaving(true);
        try {
            const payload = prepareStudentPayload(copy(form), mode === "create");
            const created = mode === "create";
            const assignedClass = classMap.get(keyOf(form.classroom_id));
            const classYear = text(assignedClass
                ?.tahun_ajaran);
            if (payload.status
                .status_aktif) {
                payload.status.tahun_pelajaran =
                    activeAcademicYear ||
                        classYear ||
                        text(payload.status
                            .tahun_pelajaran);
            }
            let savedStudent;
            let autoUsername = "";
            let accountWarning = "";
            let academicWarning = "";
            if (payload.status
                .status_aktif &&
                classYear &&
                activeAcademicYear &&
                classYear !==
                    activeAcademicYear) {
                academicWarning =
                    `Kelas ${text(assignedClass
                        ?.nama_kelas)} menggunakan tahun ajar ${classYear}, sedangkan periode aktif ${activeAcademicYear}.`;
            }
            if (created) {
                savedStudent =
                    await createStudent(payload);
                if (!savedStudent) {
                    throw new Error("Data siswa belum dapat dibaca setelah dibuat.");
                }
                autoUsername =
                    text(savedStudent.nisn) ||
                        text(savedStudent.nik) ||
                        `siswa${savedStudent.id}`;
            }
            else {
                if (form.id === null ||
                    form.id === undefined) {
                    throw new Error("ID siswa tidak valid.");
                }
                savedStudent =
                    await updateStudent(form.id, payload);
                if (!savedStudent) {
                    savedStudent =
                        await fetchStudentById(form.id);
                }
            }
            try {
                const statusActive = Boolean(payload.status.status_aktif);
                const targetClassroomId = form.classroom_id ?? null;
                if (statusActive) {
                    if (targetClassroomId !== null && targetClassroomId !== undefined) {
                        const target = classMap.get(keyOf(targetClassroomId));
                        if (target && activeAcademicYear && text(target.tahun_ajaran) && text(target.tahun_ajaran) !== activeAcademicYear) {
                            throw new Error(`Kelas ${text(target.nama_kelas)} belum dikonfigurasi untuk periode aktif ${activeAcademicYear}.`);
                        }
                    }
                    await syncStudentClassroomMembership({
                        studentId: savedStudent.id,
                        targetClassroomId,
                    });
                } else {
                    await removeStudentFromClassrooms(savedStudent.id);
                }
                await syncStudentAccount({
                    student: savedStudent,
                    statusActive,
                    preferredUsername: created ? autoUsername : "",
                    // Simpan kelas terakhir pada akun walau siswa lulus/keluar agar histori tetap terbaca.
                    classroomId: targetClassroomId,
                });
            }
            catch (accountError) {
                accountWarning =
                    errorOf(accountError);
            }
            if (savedStudent.id !==
                null &&
                savedStudent.id !==
                    undefined) {
                invalidateStudentEducationMetaCache([
                    savedStudent.id,
                ]);
            }
            await invalidateStudentOperationalCaches(
                savedStudent.id !== null && savedStudent.id !== undefined ? [savedStudent.id] : []
            );
            await load();
            closeForm();
            const warnings = [
                accountWarning,
                academicWarning,
            ].filter(Boolean);
            setDialog({
                tone: warnings.length
                    ? "warning"
                    : "success",
                title: warnings.length
                    ? "Data Tersimpan, Perlu Dicek"
                    : "Data Berhasil Disimpan",
                description: warnings.length
                    ? `Data siswa berhasil disimpan. ${warnings.join(" ")}`
                    : created
                        ? `Biodata dan akun siswa berhasil dibuat. Nama pengguna: ${autoUsername}.`
                        : "Perubahan data siswa berhasil disimpan.",
                primaryLabel: "Selesai",
            });
        }
        catch (error) {
            setDialog({
                tone: "danger",
                title: "Data Gagal Disimpan",
                description: errorOf(error, {
                    action: "menyimpan perubahan",
                    subject: "data siswa",
                }),
                primaryLabel: "Tutup",
            });
        }
        finally {
            setSaving(false);
        }
    };
    const executeDelete = async (student) => {
        setDeleting(student.id);
        const accountBeforeDelete = findManagement(student, managementMaps(managementUsers));
        const previousClassroomId = student?.classroom_id ??
            student?.classroom?.id ??
            accountBeforeDelete?.classroom_id ??
            null;
        let classroomDetached = false;
        let deleteAttempted = false;
        let rollbackWarning = "";
        try {
            // Bersihkan hanya relasi classroom yang benar-benar bisa dilepas melalui
            // /api/classrooms. Jangan mengirim classroom_id=null ke endpoint user:
            // serializer lama mengubah null menjadi 0 dan backend menganggapnya
            // sebagai ID kelas sehingga membalas "Kelas tidak ditemukan".
            await removeStudentFromClassrooms(student.id);
            classroomDetached = true;

            deleteAttempted = true;
            await deleteStudent(student.id);

            invalidateStudentEducationMetaCache([student.id]);
            await invalidateStudentOperationalCaches([student.id]);
            await load();
            setDialog({
                tone: "success",
                title: "Data Berhasil Dihapus",
                description: `Data ${student.nama_lengkap || "siswa"} berhasil dihapus. Keanggotaan kelas yang tersedia sudah dibersihkan sebelum penghapusan.`,
                primaryLabel: "Selesai",
            });
        }
        catch (e) {
            // Jika DELETE utama masih ditolak backend, kembalikan membership kelas
            // sebisa mungkin. Akun sengaja tidak dimodifikasi sebelum DELETE karena
            // backend user tidak menerima classroom_id kosong/null dengan aman.
            if (deleteAttempted && classroomDetached && previousClassroomId !== null && previousClassroomId !== undefined) {
                try {
                    await syncStudentClassroomMembership({
                        studentId: student.id,
                        targetClassroomId: previousClassroomId,
                    });
                    rollbackWarning = " Keanggotaan kelas sudah dikembalikan ke kondisi sebelumnya.";
                }
                catch {
                    rollbackWarning = " Pemulihan keanggotaan kelas juga gagal; muat ulang data sebelum melakukan perubahan lain.";
                }
            }

            try {
                await invalidateStudentOperationalCaches([student.id]);
                await load();
            }
            catch {
                // Error utama tetap lebih penting daripada kegagalan refresh.
            }

            const baseMessage = errorOf(e, { action: "menghapus", subject: "data siswa" });
            setDialog({
                tone: "danger",
                title: "Data Tidak Dapat Dihapus",
                description: deleteAttempted
                    ? `${baseMessage}${rollbackWarning} Jika masih HTTP 500, relasi yang mengunci kemungkinan berada pada presensi, rapor, kegiatan, buku penghubung, atau data backend lain yang tidak memiliki endpoint hapus dari frontend.`
                    : `${baseMessage} Proses dihentikan sebelum DELETE siswa karena keanggotaan kelas yang tercatat belum berhasil dibersihkan.`,
                primaryLabel: "Tutup",
            });
        }
        finally {
            setDeleting(null);
        }
    };
    const requestDelete = student => setDialog({
        tone: "danger",
        title: "Hapus Data Siswa?",
        description: `Data ${student.nama_lengkap || "siswa ini"} akan dihapus dan tindakan ini tidak dapat dibatalkan.`,
        secondaryLabel: "Batal",
        primaryLabel: "Ya, Hapus",
        onPrimary: () => executeDelete(student),
    });
    if (mode !== "list")
        return <>
    <div className="min-w-0 p-4 sm:p-5 lg:p-6">
      <StudentForm mode={mode} form={form} setForm={setForm} section={section} setSection={setSection} errors={errors} saving={saving} onCancel={cancelForm} onSave={save}/>
    </div>

    <ActionDialog dialog={dialog} onClose={() => setDialog(null)}/>
  </>;
    const filtersActive = !!text(search) || !!classFilter || !!educationFilter || !!schoolYearFilter;
    const visibleKeys = rows.map(item => keyOf(item.id)).filter(Boolean);
    const allPage = !!visibleKeys.length && visibleKeys.every(id => selected.has(id));
    const somePage = visibleKeys.some(id => selected.has(id)) && !allPage;
    const selectionCount = selected.size;
    const toggleSelected = id => setSelected(current => { const next = new Set(current), key = keyOf(id); next.has(key) ? next.delete(key) : next.add(key); return next; });
    const togglePage = () => setSelected(current => {
        const next = new Set(current);
        if (allPage)
            visibleKeys.forEach(id => next.delete(id));
        else
            visibleKeys.forEach(id => next.add(id));
        return next;
    });
    const clearSelection = () => setSelected(new Set());
    const toggleSelectionMode = () => setSelectionMode(current => {
        if (current)
            clearSelection();
        return !current;
    });
    const resetFilters = () => { setSearch(""); setClassFilter(""); setEducationFilter(""); setSchoolYearFilter(""); };
    return <>
    <div className="min-w-0">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Data Siswa</h1>
          <p className="mt-1 text-[13px] leading-5 text-slate-400">Kelola biodata, perkembangan dan riwayat pendidikan siswa.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 self-start">
          <span className="text-xs text-slate-400"><b className="font-semibold text-slate-600">{totalItems}</b> siswa{desktopTable && rowMetaLoading && <span className="ml-1 text-[9px] text-slate-300">· memuat detail</span>}</span>
          <button type="button" onClick={() => setFiltersOpen(value => !value)} className={`ui-toolbar-button ${filtersOpen || filtersActive ? "is-active" : ""}`}><FunnelIcon className="h-4 w-4"/>Filter</button>
          <button type="button" onClick={toggleSelectionMode} className={`ui-toolbar-button ${selectionMode ? "is-active" : ""}`}><CheckCircleIcon className="h-4 w-4"/>Pilih</button>
          <button type="button" onClick={openCreate} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c]"><PlusIcon className="h-4 w-4"/>Tambah Siswa</button>
        </div>
      </div>

      {error && <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3"><div className="flex gap-2.5"><ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"/><div><p className="text-xs font-semibold text-rose-600">Data siswa gagal dimuat</p><p className="mt-1 text-[11px] text-rose-500">{error}</p></div></div><button type="button" onClick={load} className="text-xs font-semibold text-rose-600">Muat ulang</button></div>}
      {managementError && <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3"><div className="flex min-w-0 gap-2.5"><ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/><div className="min-w-0"><p className="text-xs font-semibold text-amber-700">Data Manajemen Pengguna gagal dimuat</p><p className="mt-1 wrap-break-word text-[11px] leading-5 text-amber-600">{managementError}</p><p className="mt-1 text-[10px] leading-4 text-amber-500">Status sementara menggunakan data dari layanan siswa. Penempatan kelas dapat tidak lengkap sampai data akun berhasil dimuat.</p></div></div><button type="button" onClick={load} className="shrink-0 text-[11px] font-semibold text-amber-700 hover:underline">Muat ulang</button></div>}
      {classError && <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3"><div className="flex min-w-0 gap-2.5"><ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/><div className="min-w-0"><p className="text-xs font-semibold text-amber-700">Master kelas gagal dimuat</p><p className="mt-1 wrap-break-word text-[11px] leading-5 text-amber-600">{classError}</p></div></div><button type="button" onClick={load} className="shrink-0 text-[11px] font-semibold text-amber-700 hover:underline">Muat ulang</button></div>}
      {academicPeriodError && <div className="mt-4 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-[11px] text-amber-700">Daftar periode akademik gagal dimuat: {academicPeriodError}. Filter tahun ajar tetap memakai tahun yang ditemukan pada data siswa.</div>}

      <section className="ui-table-card mt-5">
        <div className="border-b border-slate-100 p-3">
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Cari nama, NIK, NIS atau kelas..." className={`${inputClass} pl-9 pr-9`}/>
            {search && <button type="button" onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-300 hover:bg-slate-100"><XMarkIcon className="h-3.5 w-3.5"/></button>}
          </div>
          {filtersOpen && <div className="mt-2 grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <Select value={classFilter} disabled={!classes.length} onChange={e => setClassFilter(e.target.value)}><option value="">Semua Kelas</option>{classes.map(x => <option key={x.id} value={keyOf(x.id)}>{x.nama_kelas}</option>)}</Select>
            <Select value={educationFilter} disabled={advancedMetaLoading} onChange={changeEducationFilter}><option value="">Semua Status Pendidikan</option><option value="current">Masih di Lembaga</option><option value="graduated">Lulus</option><option value="left">Pindah / Mengundurkan Diri</option><option value="unknown">Belum Ditentukan</option></Select>
            <Select value={schoolYearFilter} disabled={advancedMetaLoading} onChange={changeSchoolYearFilter}><option value="">Semua Tahun Ajaran</option>{schoolYears.map(x => <option key={x} value={x}>{x}</option>)}</Select>
            {filtersActive && <button type="button" onClick={resetFilters} className="h-9 justify-self-start rounded-lg px-3 text-xs font-semibold text-[#ef4d45] hover:bg-red-50">Reset Filter</button>}
          </div>}
          {advancedMetaLoading && <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400"><ArrowPathIcon className="h-3.5 w-3.5 animate-spin"/>Memuat detail siswa untuk filter lanjutan...</div>}
        </div>

        {selectionMode && selectionCount > 0 && <div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50/60 px-4 py-2.5"><p className="text-[12px] font-semibold text-slate-700">{selectionCount} siswa dipilih</p><button type="button" onClick={clearSelection} className="h-8 rounded-lg px-3 text-[11px] font-semibold text-slate-500 hover:bg-white">Batal Pilih</button></div>}

        <div className="md:hidden">
          {loading
            ? Array.from({ length: 6 }, (_, i) => <div key={i} className="animate-pulse border-b border-slate-100 px-3 py-3.5"><div className="h-4 w-40 rounded bg-slate-100"/><div className="mt-2 h-3 w-28 rounded bg-slate-100"/></div>)
            : rows.length
                ? rows.map((student, i) => {
                    const checked = selected.has(keyOf(student.id));
                    return <article key={student.id ?? i} className={`border-b border-slate-100 px-3 py-3 last:border-0 ${checked ? "bg-red-50/30" : ""}`}>
                  <div className="flex items-center gap-2.5">
                    {selectionMode && <Checkbox checked={checked} onChange={() => toggleSelected(student.id)} label={`Pilih ${student.nama_lengkap}`}/>}

                    <span className="w-5 shrink-0 text-[10px] text-slate-300">
                      {(page - 1) * limit + i + 1}
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[12px] font-semibold text-slate-800">
                        {show(student.nama_lengkap)}
                      </p>
                      <p className="mt-0.5 truncate text-[9px] text-slate-400">
                        NIK {show(student.nik)}
                      </p>
                    </div>

                    <div className="flex shrink-0 items-center gap-0.5">
                      <button type="button" disabled={detailLoading} onClick={() => openDetail(student)} title="Detail" aria-label={`Detail ${student.nama_lengkap}`} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
                        <InformationCircleIcon className="h-4 w-4"/>
                      </button>

                      <button type="button" disabled={detailLoading} onClick={() => openEdit(student)} title="Edit" aria-label={`Edit ${student.nama_lengkap}`} className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-[#ef4d45] disabled:opacity-50">
                        <PencilSquareIcon className="h-4 w-4"/>
                      </button>

                      <button type="button" disabled={deleting === student.id} onClick={() => requestDelete(student)} title="Hapus" aria-label={`Hapus ${student.nama_lengkap}`} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50">
                        {deleting === student.id
                            ? <ArrowPathIcon className="h-4 w-4 animate-spin"/>
                            : <TrashIcon className="h-4 w-4"/>}
                      </button>
                    </div>
                  </div>
                </article>;
                })
                : <Empty filtered={filtersActive}/>}
        </div>

        <div className="hidden overflow-x-auto md:block">
          <table className="w-full min-w-300">
            <thead className="bg-slate-50/60"><tr className="border-b border-slate-100">
              {selectionMode && <th className="w-11 px-3 py-2.5 text-center"><Checkbox checked={allPage} indeterminate={somePage} onChange={togglePage} label="Pilih semua siswa pada halaman"/></th>}
              <th className="w-12 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">No</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama Pengguna</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama Ibu</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">No. Telepon Orang Tua</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Kelas</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Lahir</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Status Pendidikan</th>
              <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tahun Ajar</th>
              <th className="w-32 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Aksi</th>
            </tr></thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? Array.from({ length: 6 }, (_, i) => <tr key={i}>{Array.from({ length: selectionMode ? 10 : 9 }, (_, j) => <td key={j} className="px-3 py-3"><div className="h-3 animate-pulse rounded bg-slate-100"/></td>)}</tr>) : rows.length ? rows.map((student, i) => {
            const checked = selected.has(keyOf(student.id));
            return <tr key={student.id ?? i} className={`hover:bg-slate-50/60 ${checked ? "bg-red-50/30" : ""}`}>
                {selectionMode && <td className="px-3 py-2.5 text-center"><Checkbox checked={checked} onChange={() => toggleSelected(student.id)} label={`Pilih ${student.nama_lengkap}`}/></td>}
                <td className="px-3 py-2.5 text-[11px] text-slate-400">{(page - 1) * limit + i + 1}</td>
                <td className="px-3 py-2.5"><p className="max-w-60 truncate text-[12px] font-semibold text-slate-800">{show(student.nama_lengkap)}</p><p className="mt-0.5 text-[10px] text-slate-400">NIK {show(student.nik)}</p></td>
                <td className="px-3 py-2.5 text-[11px] text-slate-600">{show(student.parent?.nama_ibu)}</td>
                <td className="px-3 py-2.5 text-[11px] text-slate-600">{show(student.parent?.no_hp_ortu || student.parent?.kontak_ibu || student.parent?.kontak_ayah || student.parent?.kontak_wali || student.no_telepon_rumah)}</td>
                <td className="px-3 py-2.5"><ClassBadge student={student}/></td>
                <td className="px-3 py-2.5 text-[11px] text-slate-600">{dateDisplay(student.tanggal_lahir)}</td>
                <td className="px-3 py-2.5"><EducationBadge state={student.education_state}/></td>
                <td className="px-3 py-2.5 text-[11px] text-slate-600">{show(student.tahun_pelajaran)}</td>
                <td className="px-3 py-2.5"><div className="flex justify-end gap-1"><button type="button" disabled={detailLoading} onClick={() => openDetail(student)} title="Detail" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><InformationCircleIcon className="h-4 w-4"/></button><button type="button" disabled={detailLoading} onClick={() => openEdit(student)} title="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-[#ef4d45]"><PencilSquareIcon className="h-4 w-4"/></button><button type="button" disabled={deleting === student.id} onClick={() => requestDelete(student)} title="Hapus" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50">{deleting === student.id ? <ArrowPathIcon className="h-4 w-4 animate-spin"/> : <TrashIcon className="h-4 w-4"/>}</button></div></td>
              </tr>;
        }) : <tr><td colSpan={selectionMode ? 10 : 9}><Empty filtered={filtersActive}/></td></tr>}
            </tbody>
          </table>
        </div>

        {!loading && totalItems > 0 && <Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} className="border-t border-slate-100"/>}
      </section>
    </div>
    {detail && <React.Suspense fallback={null}>
      <StudentDetailModal student={detail} onClose={() => setDetail(null)} onEdit={openEdit}/>
    </React.Suspense>}

    <ActionDialog dialog={dialog} onClose={() => setDialog(null)}/>
  </>;
}
