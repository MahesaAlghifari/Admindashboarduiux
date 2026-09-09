import { useRef, useState } from "react";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowUpTrayIcon,
  BriefcaseIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  IdentificationIcon,
  KeyIcon,
  MapPinIcon,
  PhotoIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";

const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_WIDTH = 600;
const PHOTO_MAX_HEIGHT = 800;
const PHOTO_QUALITY = 0.82;

const SECTIONS = [
  "Identitas",
  "Kepegawaian",
  "Kontak dan Alamat",
];

export const STAFF_POSITIONS = [
  "Kepala Sekolah",
  "Admin",
  "Administrasi",
  "Guru",
  "Staff",
  "Bendahara",
  "Operator",
  "Ketua Yayasan",
];

const EDUCATIONS = [
  "SD/Sederajat",
  "SMP/Sederajat",
  "SMA/SMK/Sederajat",
  "D1",
  "D2",
  "D3",
  "D4",
  "S1",
  "S2",
  "S3",
];

const MARITAL_STATUSES = [
  "Belum Menikah",
  "Menikah",
  "Cerai Hidup",
  "Cerai Mati",
];

const RELIGIONS = [
  "Islam",
  "Kristen",
  "Katolik",
  "Hindu",
  "Buddha",
  "Konghucu",
];

const inputClass =
  "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50";

const textareaClass =
  "min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50";

const text = (value) => String(value ?? "").trim();

const rawString = (value) =>
  value === null || value === undefined
    ? ""
    : String(value);

const digits = (value) =>
  String(value ?? "").replace(/\D/g, "");

const date = (value) => text(value).slice(0, 10);

const readAsDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () =>
      resolve(
        typeof reader.result === "string"
          ? reader.result
          : ""
      );

    reader.onerror = () =>
      reject(
        new Error("Foto gagal dibaca.")
      );

    reader.readAsDataURL(file);
  });

const loadImage = (source) =>
  new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(
        new Error("Foto tidak dapat diproses.")
      );
    image.src = source;
  });

const canvasBlob = (canvas) =>
  new Promise((resolve) => {
    canvas.toBlob(
      resolve,
      "image/webp",
      PHOTO_QUALITY
    );
  });

async function optimizePhoto(file) {
  const source = await readAsDataUrl(file);
  const image = await loadImage(source);

  const width =
    image.naturalWidth || image.width;
  const height =
    image.naturalHeight || image.height;

  if (!width || !height) {
    return source;
  }

  const scale = Math.min(
    1,
    PHOTO_MAX_WIDTH / width,
    PHOTO_MAX_HEIGHT / height
  );

  if (
    scale === 1 &&
    file.size <= 300 * 1024
  ) {
    return source;
  }

  const targetWidth = Math.max(
    1,
    Math.round(width * scale)
  );
  const targetHeight = Math.max(
    1,
    Math.round(height * scale)
  );

  const canvas =
    document.createElement("canvas");

  canvas.width = targetWidth;
  canvas.height = targetHeight;

  const context =
    canvas.getContext("2d");

  if (!context) {
    return source;
  }

  context.drawImage(
    image,
    0,
    0,
    targetWidth,
    targetHeight
  );

  const blob = await canvasBlob(canvas);

  if (!blob) {
    return source;
  }

  const optimized =
    await readAsDataUrl(blob);

  return optimized.length < source.length
    ? optimized
    : source;
}

const pick = (...values) => {
  for (const value of values) {
    if (
      value !== undefined &&
      value !== null &&
      String(value).trim() !== ""
    ) {
      return value;
    }
  }

  return "";
};

const birthPassword = (value) => {
  const normalized = date(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(normalized);

  if (!match) return "";

  const [, year, month, day] = match;

  return `${day}${month}${year}`;
};

const rupiah = (value) => {
  const normalized = digits(value);

  if (!normalized) return "";

  return new Intl.NumberFormat("id-ID").format(
    Number(normalized)
  );
};

const normalizeId = (value) => {
  if (
    typeof value === "number" &&
    Number.isFinite(value)
  ) {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim();

    return normalized || null;
  }

  return null;
};

export const createEmptyStaff = () => ({
  id: null,
  nama_lengkap: "",
  nip: "",
  nik: "",
  tempat_lahir: "",
  tanggal_lahir: "",
  jenis_kelamin: "",
  agama: "",
  pendidikan_terakhir: "",
  status_pernikahan: "",
  foto: "",
  jabatan: "",
  tanggal_bergabung: "",
  gaji_pokok: "0",
  npwp: "",
  no_hp: "",
  email: "",
  alamat_lengkap: "",
  password: "",
});

export function normalizeStaffForm(raw = {}) {
  const root =
    raw?.data &&
    typeof raw.data === "object" &&
    !Array.isArray(raw.data)
      ? raw.data
      : raw ?? {};

  const staff =
    root?.staff ??
    root?.profile ??
    root?.biodata ??
    {};

  const pribadi =
    root?.pribadi ??
    staff?.pribadi ??
    {};

  const kepegawaian =
    root?.kepegawaian ??
    staff?.kepegawaian ??
    {};

  const kontak =
    root?.kontak ??
    staff?.kontak ??
    {};

  return {
    ...createEmptyStaff(),

    id: normalizeId(
      pick(
        root.id,
        root.staff_id,
        root.staffid,
        staff.id,
        staff.staff_id,
        staff.staffid
      )
    ),

    nama_lengkap: text(
      pick(
        root.nama_lengkap,
        root.fullname,
        root.nama,
        staff.nama_lengkap,
        staff.fullname,
        pribadi.nama_lengkap,
        pribadi.fullname
      )
    ),

    nip: digits(
      pick(
        root.nip,
        staff.nip,
        pribadi.nip
      )
    ),

    nik: digits(
      pick(
        root.nik,
        staff.nik,
        pribadi.nik
      )
    ),

    tempat_lahir: text(
      pick(
        root.tempat_lahir,
        root.place_of_birth,
        root.birthplace,
        staff.tempat_lahir,
        staff.place_of_birth,
        pribadi.tempat_lahir,
        pribadi.place_of_birth
      )
    ),

    tanggal_lahir: date(
      pick(
        root.tanggal_lahir,
        root.birthdate,
        root.date_of_birth,
        staff.tanggal_lahir,
        staff.birthdate,
        pribadi.tanggal_lahir,
        pribadi.birthdate
      )
    ),

    jenis_kelamin: text(
      pick(
        root.jenis_kelamin,
        root.gender,
        staff.jenis_kelamin,
        staff.gender,
        pribadi.jenis_kelamin,
        pribadi.gender
      )
    ),

    agama: text(
      pick(
        root.agama,
        root.religion,
        staff.agama,
        staff.religion,
        pribadi.agama,
        pribadi.religion
      )
    ),

    pendidikan_terakhir: text(
      pick(
        root.pendidikan_terakhir,
        root.education,
        root.last_education,
        staff.pendidikan_terakhir,
        staff.education,
        pribadi.pendidikan_terakhir,
        pribadi.education
      )
    ),

    status_pernikahan: text(
      pick(
        root.status_pernikahan,
        root.marital_status,
        staff.status_pernikahan,
        staff.marital_status,
        pribadi.status_pernikahan,
        pribadi.marital_status
      )
    ),

    foto: rawString(
      pick(
        root.foto,
        root.photo,
        staff.foto,
        staff.photo,
        pribadi.foto,
        pribadi.photo
      )
    ),

    jabatan: text(
      pick(
        root.jabatan,
        root.position,
        root.role,
        staff.jabatan,
        staff.position,
        kepegawaian.jabatan,
        kepegawaian.position
      )
    ),

    tanggal_bergabung: date(
      pick(
        root.tanggal_bergabung,
        root.datejoin,
        root.join_date,
        root.joined_at,
        staff.tanggal_bergabung,
        kepegawaian.tanggal_bergabung,
        kepegawaian.datejoin
      )
    ),

    gaji_pokok:
      digits(
        pick(
          root.gaji_pokok,
          root.salary,
          root.basic_salary,
          staff.gaji_pokok,
          kepegawaian.gaji_pokok,
          kepegawaian.salary
        )
      ) || "0",

    npwp: text(
      pick(
        root.npwp,
        staff.npwp,
        pribadi.npwp,
        kepegawaian.npwp
      )
    ),

    no_hp: text(
      pick(
        root.no_hp,
        root.contact,
        root.phone,
        root.phone_number,
        staff.no_hp,
        staff.contact,
        kontak.no_hp,
        kontak.contact,
        kontak.phone
      )
    ),

    email: text(
      pick(
        root.email,
        staff.email,
        kontak.email
      )
    ).toLowerCase(),

    alamat_lengkap: text(
      pick(
        root.alamat_lengkap,
        root.address,
        staff.alamat_lengkap,
        staff.address,
        pribadi.alamat_lengkap,
        pribadi.address
      )
    ),

    password: "",
  };
}

export function validateStaffForm(
  form,
  isCreate = false
) {
  const rules = [
    {
      field: "nama_lengkap",
      label: "Nama Lengkap",
      section: 0,
      valid: Boolean(text(form?.nama_lengkap)),
      message: "Nama lengkap wajib diisi.",
    },
    {
      field: "jenis_kelamin",
      label: "Jenis Kelamin",
      section: 0,
      valid: Boolean(text(form?.jenis_kelamin)),
      message: "Jenis kelamin wajib dipilih.",
    },
    {
      field: "pendidikan_terakhir",
      label: "Pendidikan Terakhir",
      section: 0,
      valid: EDUCATIONS.includes(
        text(form?.pendidikan_terakhir)
      ),
      message:
        "Pendidikan terakhir wajib dipilih.",
    },
    {
      field: "jabatan",
      label: "Jabatan",
      section: 1,
      valid: STAFF_POSITIONS.includes(
        text(form?.jabatan)
      ),
      message:
        "Jabatan wajib dipilih dari daftar.",
    },
    {
      field: "tanggal_bergabung",
      label: "Tanggal Bergabung",
      section: 1,
      valid: Boolean(
        date(form?.tanggal_bergabung)
      ),
      message:
        "Tanggal bergabung wajib diisi.",
    },
  ];

  rules.push({field:"nik",label:"NIK",section:0,valid:digits(form?.nik).length===16,message:"NIK wajib tepat 16 digit angka."});

  if(isCreate)rules.push({field:"tanggal_lahir",label:"Tanggal Lahir",section:0,valid:Boolean(birthPassword(form?.tanggal_lahir)),message:"Tanggal lahir wajib diisi untuk membuat password awal."});

  if (text(form?.email)) {
    rules.push({
      field: "email",
      label: "Email",
      section: 2,
      valid:
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          text(form.email)
        ),
      message: "Format email tidak valid.",
    });
  }

  return rules.filter(
    (rule) => !rule.valid
  );
}

export function prepareStaffForm(
  form,
  isCreate = false
) {
  const payload = {
    nama_lengkap: text(form?.nama_lengkap),
    nip: digits(form?.nip),
    tempat_lahir: text(form?.tempat_lahir),
    tanggal_lahir: date(form?.tanggal_lahir),
    jenis_kelamin: text(
      form?.jenis_kelamin
    ),
    agama: text(form?.agama),
    pendidikan_terakhir: text(
      form?.pendidikan_terakhir
    ),
    status_pernikahan: text(
      form?.status_pernikahan
    ),
    foto: rawString(form?.foto),
    jabatan: text(form?.jabatan),
    tanggal_bergabung: date(
      form?.tanggal_bergabung
    ),
    gaji_pokok:
      digits(form?.gaji_pokok) || "0",
    npwp: text(form?.npwp),
    no_hp: text(form?.no_hp),
    email: text(
      form?.email
    ).toLowerCase(),
    alamat_lengkap: text(
      form?.alamat_lengkap
    ),
  };

  payload.nik=digits(form?.nik).slice(0,16);
  if(isCreate)payload.password=birthPassword(form?.tanggal_lahir);

  return payload;
}

function Field({
  id,
  label,
  required = false,
  error,
  helper,
  children,
  className = "",
}) {
  return (
    <div
      className={`min-w-0 ${className}`}
    >
      <label
        htmlFor={id}
        className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.08em] text-slate-400"
      >
        {label}
        {required && (
          <span className="ml-1 text-[#ef4d45]">
            *
          </span>
        )}
      </label>

      {children}

      {error ? (
        <p
          id={id ? `${id}-error` : undefined}
          className="mt-1 text-[10px] font-medium text-rose-500"
        >
          {error}
        </p>
      ) : helper ? (
        <p className="mt-1 text-[10px] leading-4 text-slate-400">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

function Select({
  id,
  value,
  onChange,
  error = false,
  disabled = false,
  children,
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value ?? ""}
        onChange={onChange}
        disabled={disabled}
        aria-invalid={error}
        aria-describedby={
          error ? `${id}-error` : undefined
        }
        className={`${inputClass} appearance-none pr-9 ${
          error ? "border-rose-300" : ""
        } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
      >
        {children}
      </select>

      <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
    </div>
  );
}

function DigitInput({
  id,
  value,
  onChange,
  recommended,
  placeholder,
  error = false,
  maxLength,
  exact = false,
  disabled = false,
}) {
  const normalized = digits(value);
  const count = normalized.length;
  const recommendedMatch =
    count === recommended;

  return (
    <div>
      <input
        id={id}
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        value={normalized}
        maxLength={maxLength}
        disabled={disabled}
        onChange={(event) => {
          let next = digits(
            event.target.value
          );

          if (maxLength) {
            next = next.slice(
              0,
              maxLength
            );
          }

          onChange(next);
        }}
        placeholder={placeholder}
        aria-invalid={error}
        aria-describedby={
          error ? `${id}-error` : undefined
        }
        className={`${inputClass} ${
          error ? "border-rose-300" : ""
        } disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}
      />

      <div className="mt-1 flex justify-between gap-3 text-[10px]">
        <span className="text-slate-400">
          {exact ? `Wajib tepat ${recommended} digit angka.` : `Disarankan ${recommended} digit${maxLength ? `, maksimal ${maxLength} digit.` : ", tidak dibatasi."}`}
        </span>

        <span
          className={`shrink-0 font-semibold ${
            !count
              ? "text-slate-400"
              : recommendedMatch
                ? "text-emerald-500"
                : "text-amber-500"
          }`}
        >
          {count}/{recommended}
        </span>
      </div>
    </div>
  );
}

function EmailInput({
  value,
  onChange,
  error = false,
}) {
  const handleBlur = () => {
    const normalized = text(value);

    if (
      normalized &&
      !normalized.includes("@")
    ) {
      onChange(
        `${normalized}@gmail.com`
      );
    }
  };

  return (
    <div>
      <input
        id="staff-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value.replace(
              /\s/g,
              ""
            )
          )
        }
        onBlur={handleBlur}
        placeholder="nama.staff"
        aria-invalid={error}
        aria-describedby={
          error
            ? "staff-email-error"
            : undefined
        }
        className={`${inputClass} ${
          error ? "border-rose-300" : ""
        }`}
      />

      <p className="mt-1 text-[10px] leading-4 text-slate-400">
        Ketik nama pengguna tanpa domain untuk menggunakan
        @gmail.com, atau masukkan alamat email lengkap.
      </p>
    </div>
  );
}

function MoneyInput({
  value,
  onChange,
}) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400">
        Rp
      </span>

      <input
        id="staff-gaji_pokok"
        inputMode="numeric"
        value={rupiah(value)}
        onChange={(event) =>
          onChange(
            digits(
              event.target.value
            ) || "0"
          )
        }
        onFocus={(event) =>
          event.target.select()
        }
        className={`${inputClass} pl-9 tabular-nums`}
        placeholder="0"
      />
    </div>
  );
}

function PhotoUpload({
  value,
  onChange,
  disabled = false,
}) {
  const inputRef = useRef(null);
  const [error, setError] =
    useState("");
  const [failed, setFailed] =
    useState(false);
  const [processing, setProcessing] =
    useState(false);

  const blocked =
    disabled || processing;

  const choose = () => {
    if (!blocked) {
      inputRef.current?.click();
    }
  };

  const handleFile = async (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !PHOTO_TYPES.includes(
        file.type
      )
    ) {
      setError(
        "Format foto harus JPG, JPEG, PNG, atau WEBP."
      );
      event.target.value = "";
      return;
    }

    if (
      file.size >
      MAX_PHOTO_SIZE
    ) {
      setError(
        "Ukuran foto maksimal 2 MB."
      );
      event.target.value = "";
      return;
    }

    setProcessing(true);

    try {
      const optimized =
        await optimizePhoto(file);

      setError("");
      setFailed(false);
      onChange(optimized);
    } catch (photoError) {
      setError(
        photoError?.message ||
          "Foto gagal diproses. Silakan pilih file lain."
      );
    } finally {
      setProcessing(false);
      event.target.value = "";
    }
  };

  const remove = () => {
    if (blocked) return;

    setError("");
    setFailed(false);
    onChange("");

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const hasPhoto =
    Boolean(value) && !failed;

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <div className="flex items-center gap-2">
          <PhotoIcon className="h-4 w-4 text-slate-400" />

          <div>
            <h3 className="text-[11px] font-semibold text-slate-700">
              Foto staf
            </h3>
            <p className="mt-0.5 text-[9px] text-slate-400">
              Foto formal, maksimal 2 MB.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
        <div className="mx-auto aspect-[3/4] w-[120px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-0">
          {hasPhoto ? (
            <img
              src={value}
              alt="Foto staf"
              width="120"
              height="160"
              loading="lazy"
              decoding="async"
              onError={() =>
                setFailed(true)
              }
              className="h-full w-full object-cover object-center"
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-slate-50 px-3 text-center text-slate-300">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm ring-1 ring-slate-100">
                <PhotoIcon className="h-5 w-5" />
              </span>
              <span className="mt-2 text-[9px]">
                Belum ada foto
              </span>
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1 rounded-xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-slate-700">
            Unggah Foto Formal
          </p>

          <p className="mt-1 max-w-lg text-[10px] leading-5 text-slate-400">
            Gunakan JPG, PNG, atau WEBP.
            Disarankan rasio 3:4 dengan wajah
            terlihat jelas.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button
              type="button"
              disabled={blocked}
              onClick={choose}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[10px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#ef4d45] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {processing ? (
                <ArrowPathIcon className="h-4 w-4 animate-spin" />
              ) : (
                <ArrowUpTrayIcon className="h-4 w-4" />
              )}
              {processing
                ? "Memproses..."
                : value
                  ? "Ganti Foto"
                  : "Pilih Foto"}
            </button>

            {value && (
              <button
                type="button"
                disabled={blocked}
                onClick={remove}
                className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-white px-3.5 text-[10px] font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <TrashIcon className="h-4 w-4" />
                Hapus Foto
              </button>
            )}
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
            onChange={handleFile}
            disabled={blocked}
            className="hidden"
          />

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400">
            <span>
              JPG, JPEG, PNG, WEBP
            </span>
            <span>Maksimal input 2 MB</span>
            <span>Otomatis dioptimalkan</span>
          </div>

          {error && (
            <div className="mt-3 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
              <p className="text-[10px] font-medium text-rose-600">
                {error}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function IdentitySection({
  mode,
  form,
  setForm,
  errors,
  saving,
}) {
  const set = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  const initialPassword =
    birthPassword(
      form.tanggal_lahir
    );

  return (
    <div className="space-y-5">
      <PhotoUpload
        value={form.foto}
        disabled={saving}
        onChange={(value) =>
          set("foto", value)
        }
      />

      <section className="overflow-hidden rounded-xl border border-slate-200">
        <div className="flex gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
          <IdentificationIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

          <div>
            <h3 className="text-[11px] font-semibold text-slate-700">
              Identitas Pribadi
            </h3>
            <p className="mt-0.5 text-[9px] text-slate-400">
              Informasi identitas resmi staf.
            </p>
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field
            id="staff-nama_lengkap"
            label="Nama Lengkap"
            required
            error={
              errors.nama_lengkap
            }
            className="sm:col-span-2"
          >
            <input
              id="staff-nama_lengkap"
              value={
                form.nama_lengkap
              }
              disabled={saving}
              onChange={(event) =>
                set(
                  "nama_lengkap",
                  event.target.value
                )
              }
              aria-invalid={Boolean(
                errors.nama_lengkap
              )}
              aria-describedby={
                errors.nama_lengkap
                  ? "staff-nama_lengkap-error"
                  : undefined
              }
              className={`${inputClass} ${
                errors.nama_lengkap
                  ? "border-rose-300"
                  : ""
              } disabled:cursor-not-allowed disabled:bg-slate-50`}
              placeholder="Nama lengkap"
              autoComplete="name"
            />
          </Field>

          <Field id="staff-nik" label="NIK" required error={errors.nik}>
            <DigitInput id="staff-nik" value={form.nik} recommended={16} maxLength={16} exact error={Boolean(errors.nik)} disabled={saving} onChange={value=>set("nik",value)} placeholder="Masukkan NIK"/>
          </Field>

          <Field
            id="staff-nip"
            label="NIP"
          >
            <DigitInput
              id="staff-nip"
              value={form.nip}
              recommended={18}
              onChange={(value) =>
                set("nip", value)
              }
              placeholder="Masukkan NIP"
            />
          </Field>

          <Field
            id="staff-tempat_lahir"
            label="Tempat Lahir"
          >
            <input
              id="staff-tempat_lahir"
              value={
                form.tempat_lahir
              }
              disabled={saving}
              onChange={(event) =>
                set(
                  "tempat_lahir",
                  event.target.value
                )
              }
              className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
              placeholder="Kota kelahiran"
              autoComplete="off"
            />
          </Field>

          <Field
            id="staff-tanggal_lahir"
            label="Tanggal Lahir"
            required={
              mode === "create"
            }
            error={
              errors.tanggal_lahir
            }
          >
            <input
              id="staff-tanggal_lahir"
              type="date"
              value={
                form.tanggal_lahir
              }
              disabled={saving}
              onChange={(event) =>
                set(
                  "tanggal_lahir",
                  event.target.value
                )
              }
              aria-invalid={Boolean(
                errors.tanggal_lahir
              )}
              aria-describedby={
                errors.tanggal_lahir
                  ? "staff-tanggal_lahir-error"
                  : undefined
              }
              className={`${inputClass} ${
                errors.tanggal_lahir
                  ? "border-rose-300"
                  : ""
              } disabled:cursor-not-allowed disabled:bg-slate-50`}
            />
          </Field>

          <Field
            id="staff-jenis_kelamin"
            label="Jenis Kelamin"
            required
            error={
              errors.jenis_kelamin
            }
          >
            <Select
              id="staff-jenis_kelamin"
              value={
                form.jenis_kelamin
              }
              disabled={saving}
              error={Boolean(
                errors.jenis_kelamin
              )}
              onChange={(event) =>
                set(
                  "jenis_kelamin",
                  event.target.value
                )
              }
            >
              <option value="">
                Pilih jenis kelamin
              </option>
              <option value="Laki-laki">
                Laki-laki
              </option>
              <option value="Perempuan">
                Perempuan
              </option>
            </Select>
          </Field>

          <Field
            id="staff-agama"
            label="Agama"
          >
            <Select
              id="staff-agama"
              value={form.agama}
              disabled={saving}
              onChange={(event) =>
                set(
                  "agama",
                  event.target.value
                )
              }
            >
              <option value="">
                Pilih agama
              </option>
              {RELIGIONS.map(
                (religion) => (
                  <option
                    key={religion}
                    value={religion}
                  >
                    {religion}
                  </option>
                )
              )}
            </Select>
          </Field>

          <Field
            id="staff-pendidikan_terakhir"
            label="Pendidikan Terakhir"
            required
            error={
              errors.pendidikan_terakhir
            }
          >
            <Select
              id="staff-pendidikan_terakhir"
              value={
                form.pendidikan_terakhir
              }
              disabled={saving}
              error={Boolean(
                errors.pendidikan_terakhir
              )}
              onChange={(event) =>
                set(
                  "pendidikan_terakhir",
                  event.target.value
                )
              }
            >
              <option value="">
                Pilih pendidikan
              </option>
              {EDUCATIONS.map(
                (education) => (
                  <option
                    key={education}
                    value={education}
                  >
                    {education}
                  </option>
                )
              )}
            </Select>
          </Field>

          <Field
            id="staff-status_pernikahan"
            label="Status Pernikahan"
          >
            <Select
              id="staff-status_pernikahan"
              value={
                form.status_pernikahan
              }
              disabled={saving}
              onChange={(event) =>
                set(
                  "status_pernikahan",
                  event.target.value
                )
              }
            >
              <option value="">
                Pilih status
              </option>
              {MARITAL_STATUSES.map(
                (status) => (
                  <option
                    key={status}
                    value={status}
                  >
                    {status}
                  </option>
                )
              )}
            </Select>
          </Field>

          {mode === "create" && (
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/60 p-3 sm:col-span-2 lg:col-span-3">
              <div className="flex gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-indigo-500 shadow-sm">
                  <KeyIcon className="h-4 w-4" />
                </span>

                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                    Kata sandi awal
                  </p>

                  <p className="mt-1 text-[11px] leading-5 text-slate-600">
                    Dibuat dari tanggal lahir dengan format
                    DDMMYYYY.
                  </p>

                  <p className="mt-1 font-mono text-xs font-semibold tabular-nums text-slate-800">
                    {initialPassword ||
                      "Pilih tanggal lahir"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function EmploymentSection({
  form,
  setForm,
  errors,
  saving,
}) {
  const set = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <BriefcaseIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

        <div>
          <h3 className="text-[11px] font-semibold text-slate-700">
            Data Kepegawaian
          </h3>
          <p className="mt-0.5 text-[9px] text-slate-400">
            Informasi pekerjaan staf.
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field
          id="staff-jabatan"
          label="Jabatan"
          required
          error={errors.jabatan}
        >
          <Select
            id="staff-jabatan"
            value={form.jabatan}
            disabled={saving}
            error={Boolean(
              errors.jabatan
            )}
            onChange={(event) =>
              set(
                "jabatan",
                event.target.value
              )
            }
          >
            <option value="">
              Pilih jabatan
            </option>
            {STAFF_POSITIONS.map(
              (position) => (
                <option
                  key={position}
                  value={position}
                >
                  {position}
                </option>
              )
            )}
          </Select>
        </Field>

        <Field
          id="staff-tanggal_bergabung"
          label="Tanggal Bergabung"
          required
          error={
            errors.tanggal_bergabung
          }
        >
          <input
            id="staff-tanggal_bergabung"
            type="date"
            value={
              form.tanggal_bergabung
            }
            disabled={saving}
            onChange={(event) =>
              set(
                "tanggal_bergabung",
                event.target.value
              )
            }
            aria-invalid={Boolean(
              errors.tanggal_bergabung
            )}
            aria-describedby={
              errors.tanggal_bergabung
                ? "staff-tanggal_bergabung-error"
                : undefined
            }
            className={`${inputClass} ${
              errors.tanggal_bergabung
                ? "border-rose-300"
                : ""
            } disabled:cursor-not-allowed disabled:bg-slate-50`}
          />
        </Field>

        <Field
          id="staff-gaji_pokok"
          label="Gaji Pokok"
        >
          <MoneyInput
            value={form.gaji_pokok}
            onChange={(value) =>
              set(
                "gaji_pokok",
                value
              )
            }
          />
        </Field>

        <Field
          id="staff-npwp"
          label="NPWP"
        >
          <input
            id="staff-npwp"
            value={form.npwp}
            disabled={saving}
            onChange={(event) =>
              set(
                "npwp",
                event.target.value
              )
            }
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
            placeholder="Nomor NPWP"
            autoComplete="off"
          />
        </Field>
      </div>
    </section>
  );
}

function ContactSection({
  form,
  setForm,
  errors,
  saving,
}) {
  const set = (field, value) =>
    setForm((current) => ({
      ...current,
      [field]: value,
    }));

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200">
      <div className="flex gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <MapPinIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />

        <div>
          <h3 className="text-[11px] font-semibold text-slate-700">
            Kontak dan Alamat
          </h3>
          <p className="mt-0.5 text-[9px] text-slate-400">
            Informasi kontak staf.
          </p>
        </div>
      </div>

      <div className="grid gap-4 p-4 sm:grid-cols-2">
        <Field
          id="staff-no_hp"
          label="Nomor ponsel"
        >
          <input
            id="staff-no_hp"
            value={form.no_hp}
            disabled={saving}
            onChange={(event) =>
              set(
                "no_hp",
                event.target.value
              )
            }
            inputMode="tel"
            autoComplete="tel"
            className={`${inputClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
            placeholder="081234567890"
          />
        </Field>

        <Field
          id="staff-email"
          label="Email"
          error={errors.email}
        >
          <EmailInput
            value={form.email}
            error={Boolean(
              errors.email
            )}
            onChange={(value) =>
              set(
                "email",
                value
              )
            }
          />
        </Field>

        <Field
          id="staff-alamat_lengkap"
          label="Alamat Lengkap"
          className="sm:col-span-2"
        >
          <textarea
            id="staff-alamat_lengkap"
            value={
              form.alamat_lengkap
            }
            disabled={saving}
            onChange={(event) =>
              set(
                "alamat_lengkap",
                event.target.value
              )
            }
            autoComplete="street-address"
            className={`${textareaClass} disabled:cursor-not-allowed disabled:bg-slate-50`}
            placeholder="Alamat lengkap"
          />
        </Field>
      </div>
    </section>
  );
}

export default function StaffForm({
  mode,
  form,
  setForm,
  section,
  setSection,
  errors = {},
  saving = false,
  onCancel,
  onSave,
}) {
  const currentSection = Math.min(
    Math.max(Number(section) || 0, 0),
    SECTIONS.length - 1
  );

  const previousSection = () => {
    if (saving) return;

    setSection((current) =>
      Math.max(
        0,
        Number(current) - 1
      )
    );
  };

  const nextSection = () => {
    if (saving) return;

    setSection((current) =>
      Math.min(
        SECTIONS.length - 1,
        Number(current) + 1
      )
    );
  };

  const submit = (event) => {
    event.preventDefault();

    if (!saving) {
      onSave?.();
    }
  };

  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <h2 className="text-[15px] font-semibold text-slate-800">
          {mode === "create"
            ? "Tambah staf"
            : "Edit staf"}
        </h2>

        <p className="mt-1 text-xs leading-5 text-slate-400">
          Lengkapi identitas,
          kepegawaian, dan kontak
          staff.
        </p>

        <div className="mt-5 overflow-x-auto pb-1">
          <div
            role="tablist"
            aria-label="Bagian form staff"
            className="flex min-w-max gap-2"
          >
            {SECTIONS.map(
              (name, index) => {
                const active =
                  currentSection ===
                  index;

                return (
                  <button
                    key={name}
                    type="button"
                    role="tab"
                    aria-selected={
                      active
                    }
                    disabled={saving}
                    onClick={() =>
                      setSection(index)
                    }
                    className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition ${
                      active
                        ? "border-red-100 bg-red-50 text-[#ef4d45]"
                        : "border-slate-200 text-slate-500 hover:bg-slate-50"
                    } disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    <span
                      className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${
                        active
                          ? "bg-[#ef4d45] text-white"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {index + 1}
                    </span>

                    {name}
                  </button>
                );
              }
            )}
          </div>
        </div>
      </div>

      <form onSubmit={submit}>
        <div
          role="tabpanel"
          className="min-h-[420px] p-4 sm:min-h-[460px] sm:p-5"
        >
          {currentSection === 0 && (
            <IdentitySection
              mode={mode}
              form={form}
              setForm={setForm}
              errors={errors}
              saving={saving}
            />
          )}

          {currentSection === 1 && (
            <EmploymentSection
              form={form}
              setForm={setForm}
              errors={errors}
              saving={saving}
            />
          )}

          {currentSection === 2 && (
            <ContactSection
              form={form}
              setForm={setForm}
              errors={errors}
              saving={saving}
            />
          )}
        </div>

        <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              disabled={saving}
              onClick={onCancel}
              className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Batal
            </button>

            <div className="grid grid-cols-2 gap-2 sm:flex">
              {currentSection > 0 && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    previousSection
                  }
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                  Sebelumnya
                </button>
              )}

              {currentSection <
                SECTIONS.length -
                  1 && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={
                    nextSection
                  }
                  className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Selanjutnya
                  <ChevronRightIcon className="h-4 w-4" />
                </button>
              )}

              <button
                type="submit"
                disabled={saving}
                className="col-span-2 inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-5 text-xs font-semibold text-white transition hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50 sm:col-auto"
              >
                {saving ? (
                  <ArrowPathIcon className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircleIcon className="h-4 w-4" />
                )}

                {saving
                  ? "Menyimpan..."
                  : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      </form>
    </section>
  );
}
