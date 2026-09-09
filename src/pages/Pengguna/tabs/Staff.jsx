import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  FunnelIcon,
  InformationCircleIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  PlusIcon,
  TrashIcon,
  UserGroupIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  createStaff,
  deleteStaff,
  fetchStaffById,
  fetchStaffDetails,
  invalidateStaffDetailCache,
  updateStaff,
} from "../../../api/staff";
import { fetchStaffUsers, updateStaffUser } from "../../../api/users";
import Pagination from "../../../components/common/Pagination";
import {apiErrorMessage} from "../../../lib/apiError";
import StaffForm, {
  createEmptyStaff,
  normalizeStaffForm,
  prepareStaffForm,
  STAFF_POSITIONS,
  validateStaffForm,
} from "./components/StaffForm";
import StaffDetailModal from "./components/StaffDetailModal";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50";

const collator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

const STAFF_FORM_FIELDS = [
  "id",
  "nama_lengkap",
  "nip",
  "nik",
  "tempat_lahir",
  "tanggal_lahir",
  "jenis_kelamin",
  "agama",
  "pendidikan_terakhir",
  "status_pernikahan",
  "foto",
  "jabatan",
  "tanggal_bergabung",
  "gaji_pokok",
  "npwp",
  "no_hp",
  "email",
  "alamat_lengkap",
  "password",
];

const text = (value) => String(value ?? "").trim();
const show = (value) => text(value) || "-";
const keyOf = (value) => String(value ?? "");
const dateDisplay=value=>{const match=text(value).slice(0,10).match(/^(\d{4})-(\d{2})-(\d{2})$/);return match?`${match[3]}/${match[2]}/${match[1]}`:"-";};

const copy = (value) => {
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
};

const sameForm = (left, right) =>
  STAFF_FORM_FIELDS.every(
    (field) => left?.[field] === right?.[field]
  );

const errorOf=(error,options)=>apiErrorMessage(error,options);


function directoryStaff(user){
  return{
    id:user?.id??null,
    nama_lengkap:text(user?.nama_lengkap),
    nik:text(user?.nik),
    nip:text(user?.nip),
    jabatan:text(user?.jabatan),
    tanggal_lahir:"",
    no_hp:"",
    tempat_lahir:"",
    jenis_kelamin:"",
    agama:"",
    pendidikan_terakhir:"",
    status_pernikahan:"",
    alamat_lengkap:"",
    foto:"",
    gaji_pokok:"",
    tanggal_bergabung:"",
    npwp:"",
    email:"",
    management:user??null,
  };
}

function ActionDialog({
  dialog,
  onClose,
}) {
  const dialogRef = React.useRef(null);
  const closeButtonRef = React.useRef(null);
  const previousFocusRef =
    React.useRef(null);

  useEffect(() => {
    if (!dialog) return undefined;

    previousFocusRef.current =
      document.activeElement instanceof
      HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const focusTimer =
      window.setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 0);

    const handleKeyDown = (event) => {
      if (
        event.key === "Escape" &&
        !dialog.locked
      ) {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const container =
        dialogRef.current;

      if (!container) return;

      const focusable = Array.from(
        container.querySelectorAll(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])'
        )
      ).filter(
        (element) =>
          element instanceof HTMLElement &&
          !element.hasAttribute("hidden")
      );

      if (!focusable.length) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last =
        focusable[
          focusable.length - 1
        ];

      if (
        event.shiftKey &&
        document.activeElement === first
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener(
      "keydown",
      handleKeyDown
    );

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow =
        previousOverflow;
      window.removeEventListener(
        "keydown",
        handleKeyDown
      );

      const previousFocus =
        previousFocusRef.current;

      window.setTimeout(() => {
        if (
          previousFocus &&
          document.contains(
            previousFocus
          )
        ) {
          previousFocus.focus();
        }
      }, 0);
    };
  }, [dialog, onClose]);

  if (!dialog) return null;

  const tones = {
    warning: {
      icon:
        "bg-amber-50 text-amber-600",
      button:
        "bg-amber-500 hover:bg-amber-600",
      Icon: ExclamationTriangleIcon,
    },
    danger: {
      icon:
        "bg-rose-50 text-rose-600",
      button:
        "bg-rose-500 hover:bg-rose-600",
      Icon: ExclamationTriangleIcon,
    },
    success: {
      icon:
        "bg-emerald-50 text-emerald-600",
      button:
        "bg-emerald-600 hover:bg-emerald-700",
      Icon: CheckCircleIcon,
    },
    info: {
      icon:
        "bg-indigo-50 text-indigo-600",
      button:
        "bg-indigo-600 hover:bg-indigo-700",
      Icon: InformationCircleIcon,
    },
  };

  const tone =
    tones[dialog.tone] ||
    tones.info;

  const ToneIcon = tone.Icon;
  const titleId =
    "staff-action-dialog-title";
  const descriptionId =
    "staff-action-dialog-description";

  const runSecondary = () => {
    dialog.onSecondary?.();
    onClose?.();
  };

  const runPrimary = () => {
    dialog.onPrimary?.();

    if (!dialog.keepOpen) {
      onClose?.();
    }
  };

  return (
    <div
      className="fixed inset-0 z-200 flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (
          event.target ===
            event.currentTarget &&
          !dialog.locked
        ) {
          onClose?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={
          dialog.description
            ? descriptionId
            : undefined
        }
        className="w-full overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:max-w-md sm:rounded-2xl"
      >
        <div className="p-5 sm:p-6">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone.icon}`}
            >
              <ToneIcon className="h-5 w-5" />
            </span>

            <div className="min-w-0 flex-1">
              <h2
                id={titleId}
                className="text-[15px] font-semibold text-slate-900"
              >
                {dialog.title}
              </h2>

              {dialog.description && (
                <p
                  id={descriptionId}
                  className="mt-1.5 text-xs leading-5 text-slate-500"
                >
                  {dialog.description}
                </p>
              )}
            </div>

            {!dialog.locked && (
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label="Tutup dialog"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                <XMarkIcon className="h-4 w-4" />
              </button>
            )}
          </div>

          {Boolean(
            dialog.items?.length
          ) && (
            <div className="mt-5 overflow-hidden rounded-xl border border-slate-200">
              <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Data yang perlu
                diperbaiki
              </div>

              <div className="max-h-64 divide-y divide-slate-100 overflow-y-auto">
                {dialog.items.map(
                  (item) => (
                    <button
                      key={item.field}
                      type="button"
                      onClick={() =>
                        dialog.onItem?.(
                          item
                        )
                      }
                      className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-50 text-[9px] font-bold text-rose-500">
                        !
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="block text-xs font-semibold text-slate-700">
                          {item.label}
                        </span>
                        <span className="mt-0.5 block text-[11px] leading-4 text-slate-400">
                          {item.message}
                        </span>
                      </span>

                      <ChevronRightIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-slate-300" />
                    </button>
                  )
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            {dialog.secondaryLabel && (
              <button
                type="button"
                disabled={dialog.locked}
                onClick={runSecondary}
                className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {dialog.secondaryLabel}
              </button>
            )}

            <button
              type="button"
              disabled={dialog.locked}
              onClick={runPrimary}
              className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-5 text-xs font-semibold text-white transition ${tone.button} disabled:cursor-not-allowed disabled:opacity-50`}
            >
              {dialog.loading && (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              )}
              {dialog.primaryLabel ||
                "Oke"}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

function Checkbox({checked,indeterminate=false,onChange,label}){
  const ref=React.useRef(null);
  useEffect(()=>{if(ref.current)ref.current.indeterminate=indeterminate;},[indeterminate]);
  return <input ref={ref} type="checkbox" checked={checked} onChange={onChange} aria-label={label} className="h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#ef4d45]"/>;
}

function Empty({ filtered }) {
  return (
    <div className="px-6 py-14 text-center">
      <UserGroupIcon className="mx-auto h-9 w-9 text-slate-200" />
      <p className="mt-3 text-[13px] font-semibold text-slate-600">
        {filtered
          ? "Staff tidak ditemukan"
          : "Belum ada data staf"}
      </p>
      <p className="mt-1 text-xs leading-5 text-slate-400">
        {filtered
          ? "Ubah pencarian atau filter yang digunakan."
          : "Tambahkan staff untuk memulai."}
      </p>
    </div>
  );
}

function MobileSkeleton() {
  return Array.from(
    { length: 5 },
    (_, index) => (
      <div
        key={index}
        className="animate-pulse border-b border-slate-100 p-4 last:border-0"
      >
        <div className="h-4 w-44 max-w-full rounded bg-slate-100" />
        <div className="mt-2 h-3 w-32 max-w-full rounded bg-slate-100" />
        <div className="mt-4 grid grid-cols-2 gap-3">
          <div className="h-8 rounded bg-slate-100" />
          <div className="h-8 rounded bg-slate-100" />
        </div>
      </div>
    )
  );
}

export default function StaffPage() {
  const [staff, setStaff] =
    useState([]);
  const [loading, setLoading] =
    useState(true);
  const [error, setError] =
    useState("");
  const [search, setSearch] =
    useState("");
  const [position, setPosition] =
    useState("");
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [selectionMode,setSelectionMode]=useState(false);
  const [selected,setSelected]=useState(new Set());
  const [page, setPage] =
    useState(1);
  const [limit, setLimit] =
    useState(10);
  const [mode, setMode] =
    useState("list");
  const [form, setForm] =
    useState(createEmptyStaff());
  const [
    initialForm,
    setInitialForm,
  ] = useState(createEmptyStaff());
  const [section, setSection] =
    useState(0);
  const [errors, setErrors] =
    useState({});
  const [saving, setSaving] =
    useState(false);
  const [busyId, setBusyId] =
    useState(null);
  const [deleting, setDeleting] =
    useState(null);
  const [detail, setDetail] =
    useState(null);
  const [dialog, setDialog] =
    useState(null);
  const [rowDetailLoading,setRowDetailLoading]=useState(false);
  const [desktopTable,setDesktopTable]=useState(()=>typeof window!=="undefined"&&window.matchMedia("(min-width: 768px)").matches);

  const loadSequenceRef = React.useRef(0);
  const hydratedDetailIdsRef=React.useRef(new Set());
  const detailHydrationSequenceRef=React.useRef(0);
  const loadAbortRef = React.useRef(null);
  const mountedRef = React.useRef(true);

  useEffect(
    () => () => {
      mountedRef.current = false;
      loadSequenceRef.current += 1;
      loadAbortRef.current?.abort();
    },
    []
  );

  const dirty = useMemo(
    () => !sameForm(form, initialForm),
    [form, initialForm]
  );

  const load = useCallback(
    async () => {
      const sequence =
        ++loadSequenceRef.current;

      loadAbortRef.current?.abort();
      const controller =
        new AbortController();
      loadAbortRef.current = controller;

      setLoading(true);
      setError("");
      hydratedDetailIdsRef.current=new Set();
      detailHydrationSequenceRef.current+=1;

      try {
        const response =
          await fetchStaffUsers();

        if (
          !mountedRef.current ||
          sequence !==
            loadSequenceRef.current
        ) {
          return false;
        }

        setStaff(
          response.map(directoryStaff)
        );

        return true;
      } catch (loadError) {
        if (
          loadError?.name === "AbortError"
        ) {
          return false;
        }

        if (
          !mountedRef.current ||
          sequence !==
            loadSequenceRef.current
        ) {
          return false;
        }

        setStaff([]);
        setError(
          errorOf(loadError)
        );

        return false;
      } finally {
        if (
          mountedRef.current &&
          sequence ===
            loadSequenceRef.current
        ) {
          setLoading(false);
        }

        if (
          loadAbortRef.current ===
          controller
        ) {
          loadAbortRef.current = null;
        }
      }
    },
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  useEffect(()=>{
    if(typeof window==="undefined"||!window.matchMedia)return;

    const media=window.matchMedia("(min-width: 768px)");
    const update=()=>setDesktopTable(media.matches);

    update();
    media.addEventListener?.("change",update);

    return()=>media.removeEventListener?.("change",update);
  },[]);

  const positions=useMemo(()=>{
    const values=[
      ...STAFF_POSITIONS,
      "Admin",
      "Administrasi",
      ...staff.map(item=>text(item.jabatan)),
    ].filter(Boolean);

    return [...new Map(
      values.map(value=>[
        text(value).toLocaleLowerCase("id"),
        text(value),
      ])
    ).values()].sort((left,right)=>
      collator.compare(left,right)
    );
  },[staff]);

  const filtered = useMemo(
    () => {
      const query=text(search).toLocaleLowerCase("id");

      return staff
        .filter(item=>{
          if(
            position &&
            text(item.jabatan).toLocaleLowerCase("id")!==
              text(position).toLocaleLowerCase("id")
          ){
            return false;
          }

          if(
            query &&
            ![
              item.nama_lengkap,
              item.nik,
              item.nip,
              item.jabatan,
            ].some(value=>
              text(value)
                .toLocaleLowerCase("id")
                .includes(query)
            )
          ){
            return false;
          }

          return true;
        })
        .sort((left, right) =>
          collator.compare(
            text(left.nama_lengkap),
            text(right.nama_lengkap)
          )
        );
    },
    [staff,search,position]
  );

  useEffect(() => {
    setPage(1);
  }, [search, position, limit]);

  const totalItems =
    filtered.length;

  const totalPages = Math.max(
    1,
    Math.ceil(totalItems / limit)
  );

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const rows = useMemo(
    () =>
      filtered.slice(
        (page - 1) * limit,
        page * limit
      ),
    [
      filtered,
      page,
      limit,
    ]
  );

  const rowIds=useMemo(
    ()=>rows
      .map(item=>item.id)
      .filter(id=>id!==null&&id!==undefined),
    [rows],
  );

  const rowIdsKey=useMemo(
    ()=>rowIds.map(keyOf).join("|"),
    [rowIds],
  );

  useEffect(()=>{
    if(
      loading ||
      !desktopTable ||
      !rowIds.length
    ){
      return;
    }

    const pending=rowIds.filter(
      id=>!hydratedDetailIdsRef.current.has(keyOf(id))
    );

    if(!pending.length){
      return;
    }

    const sequence=++detailHydrationSequenceRef.current;

    const timer=window.setTimeout(async()=>{
      setRowDetailLoading(true);

      try{
        const details=await fetchStaffDetails(
          pending,
          {concurrency:3}
        );

        if(
          sequence!==detailHydrationSequenceRef.current
        ){
          return;
        }

        const map=new Map(
          details.map(item=>[keyOf(item.id),item])
        );

        details.forEach(item=>
          hydratedDetailIdsRef.current.add(keyOf(item.id))
        );

        setStaff(current=>current.map(item=>{
          const detail=map.get(keyOf(item.id));
          return detail?{...item,...detail}:item;
        }));
      }finally{
        if(
          sequence===detailHydrationSequenceRef.current
        ){
          setRowDetailLoading(false);
        }
      }
    },80);

    return()=>window.clearTimeout(timer);
  },[
    loading,
    desktopTable,
    rowIdsKey,
  ]);

  const filtersActive =
    Boolean(text(search)) ||
    Boolean(position);

  const jumpToField =
    useCallback((item) => {
      setDialog(null);
      setSection(item.section);

      window.setTimeout(() => {
        const element =
          document.getElementById(
            `staff-${item.field}`
          );

        element?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
        element?.focus();
      }, 120);
    }, []);

  const validate = () => {
    const invalid =
      validateStaffForm(
        form,
        mode === "create"
      );

    setErrors(
      Object.fromEntries(
        invalid.map((item) => [
          item.field,
          item.message,
        ])
      )
    );

    if (!invalid.length) {
      return true;
    }

    setDialog({
      tone: "warning",
      title:
        "Data Belum Lengkap",
      description: `Ada ${invalid.length} data yang harus diperbaiki sebelum disimpan.`,
      items: invalid,
      secondaryLabel: "Nanti",
      primaryLabel:
        "Periksa Data",
      onItem: jumpToField,
      onPrimary: () =>
        jumpToField(invalid[0]),
    });

    return false;
  };

  const resetForm = () => {
    const next =
      createEmptyStaff();

    setMode("list");
    setForm(next);
    setInitialForm(
      copy(next)
    );
    setSection(0);
    setErrors({});
  };

  const openCreate = () => {
    const next =
      createEmptyStaff();

    setDetail(null);
    setDialog(null);
    setForm(next);
    setInitialForm(
      copy(next)
    );
    setSection(0);
    setErrors({});
    setMode("create");
  };

  const fetchDetail =
    useCallback(
      async (item) => {
        if (
          item?.id === null ||
          item?.id === undefined
        ) {
          throw new Error(
            "ID staff tidak valid."
          );
        }

        return normalizeStaffForm(
          await fetchStaffById(
            item.id
          )
        );
      },
      []
    );

  const openDetail =
    useCallback(
      async (item) => {
        if (
          item?.id === null ||
          item?.id === undefined ||
          busyId !== null
        ) {
          return;
        }

        const itemId = item.id;

        setBusyId(itemId);
        setDialog(null);

        try {
          const next =
            await fetchDetail(
              item
            );

          setDetail(next);
        } catch (detailError) {
          setDialog({
            tone: "danger",
            title:
              "Detail Gagal Dimuat",
            description:
              errorOf(detailError),
            primaryLabel: "Tutup",
          });
        } finally {
          setBusyId((current) =>
            keyOf(current) ===
            keyOf(itemId)
              ? null
              : current
          );
        }
      },
      [busyId, fetchDetail]
    );

  const openEdit =
    useCallback(
      async (item) => {
        if (
          item?.id === null ||
          item?.id === undefined ||
          busyId !== null
        ) {
          return;
        }

        const itemId = item.id;

        setBusyId(itemId);
        setDialog(null);

        try {
          const next =
            await fetchDetail(
              item
            );

          setDetail(null);
          setForm(next);
          setInitialForm(
            copy(next)
          );
          setSection(0);
          setErrors({});
          setMode("edit");
        } catch (editError) {
          setDialog({
            tone: "danger",
            title:
              "Gagal membuka Data",
            description:
              errorOf(editError),
            primaryLabel: "Tutup",
          });
        } finally {
          setBusyId((current) =>
            keyOf(current) ===
            keyOf(itemId)
              ? null
              : current
          );
        }
      },
      [busyId, fetchDetail]
    );

  const cancelForm = () => {
    if (saving) return;

    if (!dirty) {
      resetForm();
      return;
    }

    setDialog({
      tone: "warning",
      title:
        "Batalkan Perubahan?",
      description:
        "Semua perubahan yang belum disimpan akan hilang.",
      secondaryLabel:
        "Tetap di Form",
      primaryLabel:
        "Ya, Batalkan",
      onPrimary: resetForm,
    });
  };

  const save = async () => {
    if (
      saving ||
      !validate()
    ) {
      return;
    }

    const isCreate =
      mode === "create";

    if (
      !isCreate &&
      (form.id === null ||
        form.id === undefined)
    ) {
      setDialog({
        tone: "danger",
        title:
          "Data Tidak Valid",
        description:
          "ID staff tidak ditemukan. Muat ulang data lalu coba kembali.",
        primaryLabel: "Tutup",
      });
      return;
    }

    setSaving(true);
    setDialog(null);

    try {
      const payload =
        prepareStaffForm(
          copy(form),
          isCreate
        );

      let autoUsername = "";
      let accountWarning = "";

      if (isCreate) {
        const createdStaff = await createStaff(payload);
        autoUsername = text(createdStaff.nik) || `staff${createdStaff.id}`;

        try {
          const accountCandidates = await fetchStaffUsers();
          const account = accountCandidates.find((user) =>
            keyOf(user.id) === keyOf(createdStaff.id) ||
            (text(createdStaff.nik) && text(user.nik) === text(createdStaff.nik))
          );

          if (!account) {
            throw new Error("Akun staff belum ditemukan setelah biodata dibuat.");
          }

          await updateStaffUser(account.id, {
            username: autoUsername,
            izin_login: Boolean(account.izin_login),
          });
        } catch (accountError) {
          accountWarning = errorOf(accountError);
        }
      } else {
        await updateStaff(
          form.id,
          payload
        );
      }

      if(!isCreate&&form.id!==null&&form.id!==undefined){
        invalidateStaffDetailCache([form.id]);
      }
      await load();
      resetForm();

      setDialog({
        tone: accountWarning ? "warning" : "success",
        title: accountWarning
          ? "Biodata Tersimpan, Akun Perlu Dicek"
          : "Data Berhasil Disimpan",
        description: isCreate
          ? accountWarning
            ? `Biodata staf berhasil dibuat, tetapi nama pengguna akun belum dapat disimpan: ${accountWarning}`
            : `Data staf dan akun berhasil dibuat. Nama pengguna: ${autoUsername}. Kata sandi awal menggunakan tanggal lahir dengan format DDMMYYYY.`
          : "Perubahan data staf berhasil disimpan.",
        primaryLabel: "Selesai",
      });
    } catch (saveError) {
      setDialog({
        tone: "danger",
        title:"Data Gagal Disimpan",
        description:errorOf(saveError,{action:"menyimpan perubahan",subject:"data staff"}),
        primaryLabel:"Tutup",
      });
    } finally {
      setSaving(false);
    }
  };

  const executeDelete =
    async (item) => {
      if (
        item?.id === null ||
        item?.id === undefined ||
        deleting !== null
      ) {
        return;
      }

      const itemId = item.id;

      setDeleting(itemId);

      try {
        await deleteStaff(
          itemId
        );

        setDetail((current) =>
          keyOf(current?.id) ===
          keyOf(itemId)
            ? null
            : current
        );

        await load();

        setDialog({
          tone: "success",
          title:
            "Data Berhasil Dihapus",
          description: `Data ${show(
            item.nama_lengkap
          )} berhasil dihapus.`,
          primaryLabel: "Selesai",
        });
      } catch (deleteError) {
        setDialog({
          tone: "danger",
          title:"Data Tidak Dapat Dihapus",
          description:errorOf(deleteError,{action:"menghapus",subject:"data staff"}),
          primaryLabel: "Tutup",
        });
      } finally {
        setDeleting((current) =>
          keyOf(current) ===
          keyOf(itemId)
            ? null
            : current
        );
      }
    };

  const requestDelete = (
    item
  ) => {
    if (
      item?.id === null ||
      item?.id === undefined ||
      deleting !== null
    ) {
      return;
    }

    setDialog({
      tone: "danger",
      title:
        "Hapus Data Staff?",
      description: `Data ${show(
        item.nama_lengkap
      )} akan dihapus dan tindakan ini tidak dapat dibatalkan.`,
      secondaryLabel: "Batal",
      primaryLabel: "Ya, Hapus",
      onPrimary: () =>
        executeDelete(item),
    });
  };

  if (mode !== "list") {
    return (
      <>
        <div className="min-w-0">
          <div className="mb-5 flex items-start gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={cancelForm}
              aria-label="Kembali ke daftar staff"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition hover:bg-slate-50 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeftIcon className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
                {mode === "create"
                  ? "Tambah staf Baru"
                  : "Edit Data Staff"}
              </h1>

              <p className="mt-1 text-[12px] leading-5 text-slate-400">
                {mode === "create"
                  ? "Lengkapi data staf untuk membuat data dan akun baru."
                  : "Perbarui informasi staff sesuai data terbaru."}
              </p>
            </div>
          </div>

          <StaffForm
            mode={mode}
            form={form}
            setForm={setForm}
            section={section}
            setSection={
              setSection
            }
            errors={errors}
            saving={saving}
            onCancel={cancelForm}
            onSave={save}
          />
        </div>

        <ActionDialog
          dialog={dialog}
          onClose={() =>
            setDialog(null)
          }
        />
      </>
    );
  }

  const visibleKeys=rows.map(item=>keyOf(item.id)).filter(Boolean);
  const allPage=!!visibleKeys.length&&visibleKeys.every(id=>selected.has(id));
  const somePage=visibleKeys.some(id=>selected.has(id))&&!allPage;
  const selectionCount=selected.size;
  const toggleSelected=id=>setSelected(current=>{const next=new Set(current),key=keyOf(id);next.has(key)?next.delete(key):next.add(key);return next;});
  const togglePage=()=>setSelected(current=>{const next=new Set(current);if(allPage)visibleKeys.forEach(id=>next.delete(id));else visibleKeys.forEach(id=>next.add(id));return next;});
  const clearSelection=()=>setSelected(new Set());
  const toggleSelectionMode=()=>setSelectionMode(current=>{if(current)clearSelection();return !current;});
  const resetFilters=()=>{setSearch("");setPosition("");};

  return (
    <>
      <div className="min-w-0">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">Data staf dan guru</h1>
            <p className="mt-1 text-[13px] leading-5 text-slate-400">Kelola identitas dan data kepegawaian staf.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <span className="text-xs text-slate-400"><b className="font-semibold text-slate-600">{totalItems}</b> staf & guru{desktopTable&&rowDetailLoading&&<span className="ml-1 text-[9px] text-slate-300">· memuat detail</span>}</span>
            <button type="button" onClick={()=>setFiltersOpen(value=>!value)} className={`ui-toolbar-button ${filtersOpen||filtersActive?"is-active":""}`}><FunnelIcon className="h-4 w-4"/>Filter</button>
            <button type="button" onClick={toggleSelectionMode} className={`ui-toolbar-button ${selectionMode?"is-active":""}`}><CheckCircleIcon className="h-4 w-4"/>Pilih</button>
            <button type="button" onClick={openCreate} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c]"><PlusIcon className="h-4 w-4"/>Tambah Staf</button>
          </div>
        </div>

        {error&&<div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3"><div className="flex min-w-0 gap-2.5"><ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"/><div className="min-w-0"><p className="text-xs font-semibold text-rose-600">Data staf gagal dimuat</p><p className="mt-1 wrap-break-word text-[11px] leading-5 text-rose-500">{error}</p></div></div><button type="button" onClick={load} className="shrink-0 text-xs font-semibold text-rose-600 hover:underline">Muat ulang</button></div>}

        <section className="ui-table-card mt-5">
          <div className="border-b border-slate-100 p-3">
            <div className="relative">
              <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
              <input value={search} onChange={event=>setSearch(event.target.value)} placeholder="Cari nama, NIK, NIP atau jabatan..." aria-label="Cari staf" className={`${inputClass} pl-9 pr-9`}/>
              {search&&<button type="button" onClick={()=>setSearch("")} aria-label="Hapus pencarian" className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded text-slate-300 hover:bg-slate-100 hover:text-slate-600"><XMarkIcon className="h-3.5 w-3.5"/></button>}
            </div>
            {filtersOpen&&<div className="mt-2 grid gap-2 sm:grid-cols-2">
              <div className="relative"><select value={position} onChange={event=>setPosition(event.target.value)} aria-label="Filter jabatan" className={`${inputClass} cursor-pointer appearance-none pr-9`}><option value="">Semua Jabatan</option>{positions.map(value=><option key={value} value={value}>{value}</option>)}</select><ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/></div>
              {filtersActive&&<button type="button" onClick={resetFilters} className="h-9 justify-self-start rounded-lg px-3 text-xs font-semibold text-[#ef4d45] hover:bg-red-50">Reset Filter</button>}
            </div>}
          </div>

          {selectionMode&&selectionCount>0&&<div className="flex items-center justify-between gap-3 border-b border-red-100 bg-red-50/60 px-4 py-2.5"><p className="text-[12px] font-semibold text-slate-700">{selectionCount} staf dipilih</p><button type="button" onClick={clearSelection} className="h-8 rounded-lg px-3 text-[11px] font-semibold text-slate-500 hover:bg-white">Batal Pilih</button></div>}

          <div className="md:hidden">
            {loading
              ?<MobileSkeleton/>
              :rows.length
                ?rows.map((item,index)=>{
                  const itemBusy=keyOf(busyId)===keyOf(item.id);
                  const itemDeleting=keyOf(deleting)===keyOf(item.id);
                  const checked=selected.has(keyOf(item.id));

                  return <article
                    key={item.id??index}
                    className={`border-b border-slate-100 px-3 py-3 last:border-0 ${checked?"bg-red-50/30":""}`}
                  >
                    <div className="flex items-center gap-2.5">
                      {selectionMode&&
                        <Checkbox
                          checked={checked}
                          onChange={()=>toggleSelected(item.id)}
                          label={`Pilih ${item.nama_lengkap}`}
                        />
                      }

                      <span className="w-5 shrink-0 text-[10px] text-slate-300">
                        {(page-1)*limit+index+1}
                      </span>

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[12px] font-semibold text-slate-800">
                          {show(item.nama_lengkap)}
                        </p>
                        <p className="mt-0.5 truncate text-[9px] text-slate-400">
                          NIK {show(item.nik)}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          disabled={busyId!==null||itemDeleting}
                          onClick={()=>openDetail(item)}
                          title="Detail"
                          aria-label={`Detail ${item.nama_lengkap}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
                        >
                          {itemBusy
                            ?<ArrowPathIcon className="h-4 w-4 animate-spin"/>
                            :<EyeIcon className="h-4 w-4"/>
                          }
                        </button>

                        <button
                          type="button"
                          disabled={busyId!==null||itemDeleting}
                          onClick={()=>openEdit(item)}
                          title="Edit"
                          aria-label={`Edit ${item.nama_lengkap}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-[#ef4d45] disabled:opacity-50"
                        >
                          <PencilSquareIcon className="h-4 w-4"/>
                        </button>

                        <button
                          type="button"
                          disabled={deleting!==null||busyId!==null}
                          onClick={()=>requestDelete(item)}
                          title="Hapus"
                          aria-label={`Hapus ${item.nama_lengkap}`}
                          className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50"
                        >
                          {itemDeleting
                            ?<ArrowPathIcon className="h-4 w-4 animate-spin"/>
                            :<TrashIcon className="h-4 w-4"/>
                          }
                        </button>
                      </div>
                    </div>
                  </article>;
                })
                :<Empty filtered={filtersActive}/>
            }
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-230">
              <thead className="bg-slate-50/60"><tr className="border-b border-slate-100">
                {selectionMode&&<th className="w-11 px-3 py-2.5 text-center"><Checkbox checked={allPage} indeterminate={somePage} onChange={togglePage} label="Pilih semua staf pada halaman"/></th>}
                <th className="w-12 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">No</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nama Pengguna</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">NIP</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tanggal Lahir</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jabatan</th>
                <th className="px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">No. Telepon</th>
                <th className="w-32 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Aksi</th>
              </tr></thead>
              <tbody className="divide-y divide-slate-100">
                {loading?Array.from({length:6},(_,rowIndex)=><tr key={rowIndex}>{Array.from({length:selectionMode?8:7},(_,columnIndex)=><td key={columnIndex} className="px-3 py-3"><div className="h-3 animate-pulse rounded bg-slate-100"/></td>)}</tr>):rows.length?rows.map((item,index)=>{const itemBusy=keyOf(busyId)===keyOf(item.id),itemDeleting=keyOf(deleting)===keyOf(item.id),checked=selected.has(keyOf(item.id));return <tr key={item.id??index} className={`hover:bg-slate-50/60 ${checked?"bg-red-50/30":""}`}>
                  {selectionMode&&<td className="px-3 py-2.5 text-center"><Checkbox checked={checked} onChange={()=>toggleSelected(item.id)} label={`Pilih ${item.nama_lengkap}`}/></td>}
                  <td className="px-3 py-2.5 text-[11px] text-slate-400">{(page-1)*limit+index+1}</td>
                  <td className="px-3 py-2.5"><p className="max-w-60 truncate text-[12px] font-semibold text-slate-800">{show(item.nama_lengkap)}</p><p className="mt-0.5 max-w-60 truncate text-[10px] text-slate-400">NIK {show(item.nik)}</p></td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600">{show(item.nip)}</td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600">{dateDisplay(item.tanggal_lahir)}</td>
                  <td className="px-3 py-2.5"><span className="inline-flex max-w-45 truncate rounded-full bg-indigo-50 px-2.5 py-1 text-[10px] font-semibold text-indigo-600">{show(item.jabatan)}</span></td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600">{show(item.no_hp)}</td>
                  <td className="px-3 py-2.5"><div className="flex justify-end gap-1"><button type="button" disabled={busyId!==null||itemDeleting} onClick={()=>openDetail(item)} title="Detail" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">{itemBusy?<ArrowPathIcon className="h-4 w-4 animate-spin"/>:<EyeIcon className="h-4 w-4"/>}</button><button type="button" disabled={busyId!==null||itemDeleting} onClick={()=>openEdit(item)} title="Edit" className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-[#ef4d45] disabled:opacity-50"><PencilSquareIcon className="h-4 w-4"/></button><button type="button" disabled={deleting!==null||busyId!==null} onClick={()=>requestDelete(item)} title="Hapus" className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 disabled:opacity-50">{itemDeleting?<ArrowPathIcon className="h-4 w-4 animate-spin"/>:<TrashIcon className="h-4 w-4"/>}</button></div></td>
                </tr>;}):<tr><td colSpan={selectionMode?8:7}><Empty filtered={filtersActive}/></td></tr>}
              </tbody>
            </table>
          </div>

          {!loading&&totalItems>0&&<Pagination currentPage={page} totalPages={totalPages} totalItems={totalItems} itemsPerPage={limit} onPageChange={setPage} onLimitChange={setLimit} className="border-t border-slate-100"/>}
        </section>
      </div>

      <StaffDetailModal
        staff={detail}
        onClose={() =>
          setDetail(null)
        }
        onEdit={openEdit}
      />

      <ActionDialog
        dialog={dialog}
        onClose={() =>
          setDialog(null)
        }
      />
    </>
  );
}
