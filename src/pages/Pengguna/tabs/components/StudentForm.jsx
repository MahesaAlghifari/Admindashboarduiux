import React from "react";
import { AcademicCapIcon, ArrowLeftIcon, ArrowPathIcon, ArrowUpTrayIcon, BuildingOffice2Icon, CheckCircleIcon, ChevronDownIcon, ChevronRightIcon, HomeIcon, PhotoIcon, TrashIcon, } from "@heroicons/react/24/outline";
const DevelopmentHistory = React.lazy(() => import("./DevelopmentHistory"));
const text = v => String(v ?? "").trim();
const digitsOnly = value => String(value ?? "").replace(/\D/g, "");
const num = value => {
    if (value === "" || value === null || value === undefined)
        return 0;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
};
const date = value => text(value).slice(0, 10);
const readAsDataUrl = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string"
        ? reader.result
        : "");
    reader.onerror = () => reject(new Error("Foto gagal dibaca."));
    reader.readAsDataURL(file);
});
const loadImage = source => new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Foto tidak dapat diproses."));
    image.src = source;
});
const canvasBlob = canvas => new Promise(resolve => {
    canvas.toBlob(resolve, "image/webp", PHOTO_QUALITY);
});
async function optimizePhoto(file) {
    const source = await readAsDataUrl(file);
    const image = await loadImage(source);
    const width = image.naturalWidth || image.width;
    const height = image.naturalHeight || image.height;
    if (!width || !height)
        return source;
    const scale = Math.min(1, PHOTO_MAX_WIDTH / width, PHOTO_MAX_HEIGHT / height);
    if (scale === 1 && file.size <= 300 * 1024) {
        return source;
    }
    const targetWidth = Math.max(1, Math.round(width * scale));
    const targetHeight = Math.max(1, Math.round(height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const context = canvas.getContext("2d");
    if (!context)
        return source;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);
    const blob = await canvasBlob(canvas);
    if (!blob)
        return source;
    const optimized = await readAsDataUrl(blob);
    return optimized.length < source.length
        ? optimized
        : source;
}
const MAX_PHOTO_SIZE = 2 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PHOTO_MAX_WIDTH = 600;
const PHOTO_MAX_HEIGHT = 800;
const PHOTO_QUALITY = 0.82;
const schoolYearOptions = (periods, value) => {
    const rows = [...new Set((periods || []).map(x => text(x.tahun_ajaran)).filter(Boolean))]
        .sort((a, b) => b.localeCompare(a, "id", { numeric: true }));
    if (text(value) && !rows.includes(text(value)))
        rows.unshift(text(value));
    return rows;
};
const SECTIONS = [
    "Identitas",
    "Domisili",
    "Orang Tua & Wali",
    "Perkembangan",
    "Pendidikan",
];
const inputClass = "h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-[13px] text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50";
const textareaClass = "min-h-24 w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[13px] leading-5 text-slate-700 outline-none transition placeholder:text-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-50";
const disabledClass = "h-10 w-full cursor-not-allowed rounded-lg border border-slate-200 bg-slate-50 px-3 text-[13px] font-medium text-slate-500 outline-none";
export const createEmptyStudent = () => ({
    id: null,
    education_mode: "",
    exit_mode: "",
    education_status: true,
    nisn: "",
    nik: "",
    nama_lengkap: "",
    nama_panggilan: "",
    tempat_lahir: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    agama: "",
    kewarganegaraan: "Indonesia",
    alamat_lengkap: "",
    no_telepon_rumah: "",
    foto: "",
    bahasa_sehari_hari: "Bahasa Indonesia",
    status_tempat_tinggal: "",
    jarak_ke_sekolah: 0,
    jumlah_saudara_kandung: 0,
    jumlah_saudara_tiri: 0,
    jumlah_saudara_angkat: 0,
    asal_peserta_didik: "",
    nama_lembaga: "",
    alamat_lembaga: "",
    nama_lembaga_asal: "",
    alamat_lembaga_asal: "",
    kelompok_umur_sebelumnya: "",
    catatan_penting: "",
    classroom_id: null,
    classroom: null,
    management: null,
    parent: {
        nama_ayah: "",
        pendidikan_ayah: "",
        pekerjaan_ayah: "",
        nama_ibu: "",
        pendidikan_ibu: "",
        pekerjaan_ibu: "",
        nama_wali: "",
        pendidikan_wali: "",
        pekerjaan_wali: "",
        hubungan_keluarga_wali: "",
        no_hp_ortu: "",
    },
    dev: {
        berat_badan: 0,
        tinggi_badan: 0,
        catatan_kesehatan: "",
        penyakit: "",
        golongan_darah: "",
        prestasi_belajar: "",
        prestasi_belajar_sebelumnya: "",
        riwayat_perkembangan: [],
    },
    status: {
        status_aktif: true,
        tanggal_masuk: "",
        tanggal_keluar: "",
        alasan_keluar: "",
        kelompok_umur: "",
        tahun_pelajaran: "",
        nomor_surat_keterangan: "",
        lembaga_lanjutan: "",
        tanggal_pindah: "",
        dari_kelompok_umur: "",
        ke_lembaga: "",
        tingkat_kelompok_umur: "",
    },
});
export const inferStudentEducationMode = s => {
    if (text(s?.nama_lembaga_asal) ||
        text(s?.alamat_lembaga_asal) ||
        text(s?.kelompok_umur_sebelumnya))
        return "pindahan";
    if (text(s?.asal_peserta_didik) ||
        text(s?.nama_lembaga) ||
        text(s?.alamat_lembaga))
        return "baru";
    return "";
};
export const inferStudentExitMode = student => {
    const status = student?.status || {};
    const reason = text(status.alasan_keluar).toLocaleLowerCase("id");
    if (reason.includes("lulus") ||
        reason.includes("tamat")) {
        return "lulus";
    }
    if (reason ||
        text(status.ke_lembaga)) {
        return "pindah";
    }
    if (text(status.lembaga_lanjutan) ||
        text(status.nomor_surat_keterangan) ||
        text(status.tanggal_keluar) ||
        status.status_aktif === false) {
        return "lulus";
    }
    return "";
};
export function validateStudentForm(form, _isCreate = true) {
    const rules = [
        ["nama_lengkap", "Nama Lengkap", 0, !!text(form.nama_lengkap), "Nama lengkap wajib diisi."],
        ["nisn", "NIS", 0, !!digitsOnly(form.nisn), "NIS wajib diisi dengan angka."],
        ["education_mode", "Riwayat Pendidikan", 4, !!form.education_mode, "Pilih Peserta Didik Baru atau Pindah Dari."],
        ["tahun_pelajaran", "Tahun Ajaran", 4, !!text(form.status.tahun_pelajaran), "Tahun ajar wajib dipilih."],
        ["tanggal_masuk", "Tanggal Masuk", 4, !!text(form.status.tanggal_masuk), "Tanggal masuk wajib diisi."],
    ].map(([field, label, section, valid, message]) => ({
        field, label, section, valid, message,
    }));
    rules.splice(2, 0, { field: "nik", label: "NIK", section: 0, valid: digitsOnly(form.nik).length === 16, message: "NIK wajib tepat 16 digit angka." });
    if (form.education_mode === "baru") {
        rules.push({
            field: "asal_peserta_didik",
            label: "Asal Peserta Didik",
            section: 4,
            valid: ["Rumah", "PAUD", "Lainnya"].includes(form.asal_peserta_didik),
            message: "Asal peserta didik wajib dipilih.",
        });
        if (form.asal_peserta_didik && form.asal_peserta_didik !== "Rumah") {
            rules.push({
                field: "nama_lembaga",
                label: "Nama Lembaga",
                section: 4,
                valid: !!text(form.nama_lembaga),
                message: "Nama lembaga wajib diisi.",
            }, {
                field: "alamat_lembaga",
                label: "Alamat Lembaga",
                section: 4,
                valid: !!text(form.alamat_lembaga),
                message: "Alamat lembaga wajib diisi.",
            });
        }
    }
    if (form.education_mode === "pindahan") {
        rules.push({
            field: "nama_lembaga_asal",
            label: "Pindah Dari",
            section: 4,
            valid: !!text(form.nama_lembaga_asal),
            message: "Nama lembaga asal wajib diisi.",
        }, {
            field: "alamat_lembaga_asal",
            label: "Alamat Lembaga Asal",
            section: 4,
            valid: !!text(form.alamat_lembaga_asal),
            message: "Alamat lembaga asal wajib diisi.",
        }, {
            field: "kelompok_umur_sebelumnya",
            label: "Kelompok/Kelas Sebelumnya",
            section: 4,
            valid: !!text(form.kelompok_umur_sebelumnya),
            message: "Kelompok atau kelas sebelumnya wajib diisi.",
        });
    }
    if (form.exit_mode === "pindah") {
        rules.push({
            field: "tanggal_keluar",
            label: "Tanggal Keluar",
            section: 4,
            valid: !!text(form.status.tanggal_keluar),
            message: "Tanggal keluar wajib diisi.",
        }, {
            field: "alasan_keluar",
            label: "Alasan/Sebab",
            section: 4,
            valid: !!text(form.status.alasan_keluar),
            message: "Alasan atau sebab wajib diisi.",
        });
    }
    if (form.exit_mode === "lulus") {
        rules.push({
            field: "tanggal_keluar",
            label: "Tanggal Keluar",
            section: 4,
            valid: !!text(form.status.tanggal_keluar),
            message: "Tanggal keluar wajib diisi.",
        });
    }
    return rules.filter(x => !x.valid);
}
export function prepareStudentPayload(student, _isCreate = true) {
    const parent = student?.parent || {};
    const dev = student?.dev || {};
    const status = student?.status || {};
    const educationMode = student?.education_mode || "";
    const exitMode = student?.exit_mode || "";
    const history = Array.isArray(dev.riwayat_perkembangan)
        ? dev.riwayat_perkembangan.map((entry, index) => ({
            index,
            value: {
                tahun: text(entry?.tahun),
                berat_badan: num(entry?.berat_badan),
                tinggi_badan: num(entry?.tinggi_badan),
                penyakit: text(entry?.penyakit),
                kelainan_jiwa: text(entry?.kelainan_jiwa),
            },
        }))
        : [];
    const populated = history.filter(({ value }) => text(value.tahun) ||
        value.berat_badan > 0 ||
        value.tinggi_badan > 0 ||
        text(value.penyakit) ||
        text(value.kelainan_jiwa));
    const latest = [...populated].sort((a, b) => {
        const yearA = /^\d{4}$/.test(a.value.tahun) ? Number(a.value.tahun) : -1;
        const yearB = /^\d{4}$/.test(b.value.tahun) ? Number(b.value.tahun) : -1;
        if (yearA !== yearB)
            return yearB - yearA;
        return b.index - a.index;
    })[0]?.value;
    const isNew = educationMode === "baru";
    const isTransfer = educationMode === "pindahan";
    const isHome = isNew && student?.asal_peserta_didik === "Rumah";
    const isLeaving = exitMode === "pindah";
    const isGraduated = exitMode === "lulus";
    return {
        nisn: digitsOnly(student?.nisn, 10),
        tempat_lahir: text(student?.tempat_lahir),
        tanggal_lahir: date(student?.tanggal_lahir),
        jenis_kelamin: text(student?.jenis_kelamin),
        agama: text(student?.agama),
        alamat_lengkap: text(student?.alamat_lengkap),
        no_telepon_rumah: text(student?.no_telepon_rumah),
        foto: String(student?.foto ?? ""),
        nama_panggilan: text(student?.nama_panggilan),
        kewarganegaraan: text(student?.kewarganegaraan),
        bahasa_sehari_hari: text(student?.bahasa_sehari_hari),
        status_tempat_tinggal: text(student?.status_tempat_tinggal),
        jarak_ke_sekolah: num(student?.jarak_ke_sekolah),
        jumlah_saudara_kandung: num(student?.jumlah_saudara_kandung),
        jumlah_saudara_tiri: num(student?.jumlah_saudara_tiri),
        jumlah_saudara_angkat: num(student?.jumlah_saudara_angkat),
        asal_peserta_didik: isTransfer ? "" : text(student?.asal_peserta_didik),
        nama_lembaga: isTransfer || isHome ? "" : text(student?.nama_lembaga),
        alamat_lembaga: isTransfer || isHome ? "" : text(student?.alamat_lembaga),
        nama_lembaga_asal: isNew ? "" : text(student?.nama_lembaga_asal),
        alamat_lembaga_asal: isNew ? "" : text(student?.alamat_lembaga_asal),
        kelompok_umur_sebelumnya: isNew ? "" : text(student?.kelompok_umur_sebelumnya),
        catatan_penting: text(student?.catatan_penting),
        nik: digitsOnly(student?.nik).slice(0, 16),
        nama_lengkap: text(student?.nama_lengkap),
        parent: {
            nama_ayah: text(parent.nama_ayah),
            pekerjaan_ayah: text(parent.pekerjaan_ayah),
            nama_ibu: text(parent.nama_ibu),
            pekerjaan_ibu: text(parent.pekerjaan_ibu),
            no_hp_ortu: text(parent.no_hp_ortu),
            pendidikan_ayah: text(parent.pendidikan_ayah),
            pendidikan_ibu: text(parent.pendidikan_ibu),
            nama_wali: text(parent.nama_wali),
            hubungan_keluarga_wali: text(parent.hubungan_keluarga_wali),
            pendidikan_wali: text(parent.pendidikan_wali),
            pekerjaan_wali: text(parent.pekerjaan_wali),
        },
        dev: {
            berat_badan: latest ? num(latest.berat_badan) : num(dev.berat_badan),
            tinggi_badan: latest ? num(latest.tinggi_badan) : num(dev.tinggi_badan),
            catatan_kesehatan: text(dev.catatan_kesehatan),
            penyakit: latest ? text(latest.penyakit) : text(dev.penyakit),
            golongan_darah: text(dev.golongan_darah),
            prestasi_belajar: text(dev.prestasi_belajar),
            riwayat_perkembangan: history.map(({ value }) => value),
        },
        status: {
            status_aktif: !exitMode,
            tanggal_masuk: date(status.tanggal_masuk),
            tanggal_keluar: exitMode ? date(status.tanggal_keluar) : "",
            alasan_keluar: isGraduated
                ? "Lulus"
                : isLeaving
                    ? text(status.alasan_keluar)
                    : "",
            kelompok_umur: text(status.kelompok_umur),
            tahun_pelajaran: text(status.tahun_pelajaran),
            nomor_surat_keterangan: isGraduated ? text(status.nomor_surat_keterangan) : "",
            lembaga_lanjutan: isGraduated ? text(status.lembaga_lanjutan) : "",
            tanggal_pindah: isHome ? "" : date(status.tanggal_pindah),
            dari_kelompok_umur: text(status.dari_kelompok_umur),
            ke_lembaga: isLeaving ? text(status.ke_lembaga) : "",
            tingkat_kelompok_umur: text(status.tingkat_kelompok_umur),
        },
    };
}
function Field({ label, required, error, helper, children, className = "", }) {
    return <label className={`block min-w-0 ${className}`}>
    <span className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[.08em] text-slate-400">
      {label}
      {required && <span className="ml-1 text-[#ef4d45]">*</span>}
    </span>

    {children}

    {error
            ? <span className="mt-1 block text-[10px] font-medium text-rose-500">
        {error}
      </span>
            : helper && <span className="mt-1 block text-[10px] leading-4 text-slate-400">
        {helper}
      </span>}
  </label>;
}
function Select({ id, value, onChange, children, disabled = false, error = false, }) {
    return <div className="relative">
    <select id={id} value={value ?? ""} onChange={onChange} disabled={disabled} className={`${inputClass} appearance-none pr-9 ${error ? "border-rose-300" : ""} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}>
      {children}
    </select>

    <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/>
  </div>;
}
function DigitInput({ id, value, onChange, digits, error, disabled = false, exact = false, maxLength }) {
    const normalized = digitsOnly(value).slice(0, maxLength || undefined);
    const count = normalized.length;
    const valid = count === digits;
    return <div>
    <input id={id} inputMode="numeric" autoComplete="off" pattern="[0-9]*" maxLength={maxLength} disabled={disabled} value={normalized} onChange={e => onChange(digitsOnly(e.target.value).slice(0, maxLength || undefined))} placeholder={exact ? `Wajib ${digits} digit` : `Disarankan ${digits} digit`} className={`${inputClass} ${error ? "border-rose-300" : ""} disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400`}/>
    <div className="mt-1 flex items-center justify-between gap-2 text-[10px]">
      <span className="text-slate-400">{exact ? `Wajib tepat ${digits} digit angka.` : `Format standar ${digits} digit.`}</span>
      <span className={`shrink-0 font-semibold ${!count ? "text-slate-400" : valid ? "text-emerald-500" : "text-amber-500"}`}>{count}/{digits}</span>
    </div>
  </div>;
}
function UnitInput({ value, onChange, unit, }) {
    return <div className="relative">
    <input type="number" min="0" step="0.1" value={value} onChange={e => onChange(num(e.target.value))} className={`${inputClass} pr-11`}/>

    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400">
      {unit}
    </span>
  </div>;
}
function PhotoUpload({ value, onChange, }) {
    const inputRef = React.useRef(null);
    const [error, setError] = React.useState("");
    const [failed, setFailed] = React.useState(false);
    const [processing, setProcessing] = React.useState(false);
    const choose = () => {
        if (!processing) {
            inputRef.current?.click();
        }
    };
    const handleFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file)
            return;
        if (!PHOTO_TYPES.includes(file.type)) {
            setError("Format foto harus JPG, JPEG, PNG, atau WEBP.");
            e.target.value = "";
            return;
        }
        if (file.size > MAX_PHOTO_SIZE) {
            setError("Ukuran foto maksimal 2 MB.");
            e.target.value = "";
            return;
        }
        setProcessing(true);
        try {
            const optimized = await optimizePhoto(file);
            setError("");
            setFailed(false);
            onChange(optimized);
        }
        catch (photoError) {
            setError(photoError?.message ||
                "Foto gagal diproses. Silakan pilih file lain.");
        }
        finally {
            setProcessing(false);
            e.target.value = "";
        }
    };
    const remove = () => {
        if (processing)
            return;
        setError("");
        setFailed(false);
        onChange("");
        if (inputRef.current) {
            inputRef.current.value = "";
        }
    };
    const hasPhoto = Boolean(value) && !failed;
    return <section className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/40">
    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
      <div className="flex items-center gap-2">
        <PhotoIcon className="h-4 w-4 text-slate-400"/>

        <div>
          <h3 className="text-[11px] font-semibold text-slate-700">
            Foto Siswa
          </h3>

          <p className="mt-0.5 text-[9px] leading-4 text-slate-400">
            Gunakan foto formal dengan wajah terlihat jelas.
          </p>
        </div>
      </div>
    </div>

    <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center">
      <div className="mx-auto aspect-[3/4] w-[120px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm sm:mx-0">
        {hasPhoto
            ? <img src={value} alt="Foto siswa" width="120" height="160" loading="lazy" decoding="async" onError={() => setFailed(true)} className="h-full w-full object-cover object-center"/>
            : <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 px-3 text-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
              <PhotoIcon className="h-5 w-5"/>
            </div>

            <p className="mt-2 text-[9px] font-medium leading-4 text-slate-400">
              Belum ada foto
            </p>
          </div>}
      </div>

      <div className="min-w-0 flex-1">
        <div className="rounded-xl border border-dashed border-slate-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-slate-700">
            Unggah Foto Formal
          </p>

          <p className="mt-1 max-w-lg text-[10px] leading-5 text-slate-400">
            Foto otomatis dioptimalkan sebelum disimpan agar ukuran data tetap ringan.
          </p>

          <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <button type="button" disabled={processing} onClick={choose} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 text-[10px] font-semibold text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-[#ef4d45] disabled:cursor-not-allowed disabled:opacity-50">
              {processing
            ? <ArrowPathIcon className="h-4 w-4 animate-spin"/>
            : <ArrowUpTrayIcon className="h-4 w-4"/>}
              {processing
            ? "Memproses..."
            : value
                ? "Ganti Foto"
                : "Pilih Foto"}
            </button>

            {value && <button type="button" disabled={processing} onClick={remove} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-rose-100 bg-white px-3.5 text-[10px] font-semibold text-rose-500 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50">
              <TrashIcon className="h-4 w-4"/>
              Hapus Foto
            </button>}
          </div>

          <input ref={inputRef} type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={handleFile} disabled={processing} className="hidden"/>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[9px] text-slate-400">
            <span>JPG, PNG, WEBP</span>
            <span>Maksimal input 2 MB</span>
            <span>Output maksimal 600×800</span>
          </div>
        </div>

        {error && <div className="mt-2 rounded-lg border border-rose-100 bg-rose-50 px-3 py-2">
          <p className="text-[10px] font-medium text-rose-600">
            {error}
          </p>
        </div>}
      </div>
    </div>
  </section>;
}
function ParentCard({ title, type, form, setParent, }) {
    const config = {
        ayah: [
            ["nama_ayah", "Nama"],
            ["pendidikan_ayah", "Pendidikan"],
            ["pekerjaan_ayah", "Pekerjaan"],
        ],
        ibu: [
            ["nama_ibu", "Nama"],
            ["pendidikan_ibu", "Pendidikan"],
            ["pekerjaan_ibu", "Pekerjaan"],
        ],
        wali: [
            ["nama_wali", "Nama"],
            ["pendidikan_wali", "Pendidikan"],
            ["pekerjaan_wali", "Pekerjaan"],
            ["hubungan_keluarga_wali", "Hubungan"],
        ],
    }[type];
    return <section className="overflow-hidden rounded-xl border border-slate-200">
    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
      <h3 className="text-[12px] font-semibold text-slate-700">
        {title}
      </h3>
    </div>

    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
      {config.map(([field, label]) => <Field key={field} label={label} className={field === "hubungan_keluarga_wali"
                ? "lg:col-span-2"
                : ""}>
        <input value={form.parent[field] || ""} inputMode={field.startsWith("kontak")
                ? "tel"
                : undefined} onChange={e => setParent(field, e.target.value)} placeholder={field.startsWith("kontak")
                ? "Contoh: 081234567890"
                : field === "hubungan_keluarga_wali"
                    ? "Contoh: Paman, Bibi, Kakek"
                    : label} className={inputClass}/>
      </Field>)}
    </div>
  </section>;
}
function ParentSection({ form, setForm, }) {
    const setParent = (field, value) => setForm(x => ({
        ...x,
        parent: {
            ...x.parent,
            [field]: value,
        },
    }));
    return <div className="space-y-4">
    <section className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3">
        <h3 className="text-[12px] font-semibold text-slate-700">Kontak Orang Tua</h3>
      </div>
      <div className="p-4">
        <Field label="Nomor ponsel orang tua" helper="Gunakan satu nomor kontak utama orang tua atau wali.">
          <input value={form.parent.no_hp_ortu || ""} inputMode="numeric" autoComplete="tel" pattern="[0-9]*" onChange={e => setParent("no_hp_ortu", digitsOnly(e.target.value))} placeholder="Contoh: 081234567890" className={inputClass}/>
        </Field>
      </div>
    </section>

    <ParentCard title="Ayah" type="ayah" form={form} setParent={setParent}/>

    <ParentCard title="Ibu" type="ibu" form={form} setParent={setParent}/>

    <ParentCard title="Wali" type="wali" form={form} setParent={setParent}/>
  </div>;
}
function EducationHistory({ form, setForm, errors, }) {
    const set = (field, value) => setForm(x => ({
        ...x,
        [field]: value,
    }));
    const setDev = (field, value) => setForm(x => ({
        ...x,
        dev: {
            ...x.dev,
            [field]: value,
        },
    }));
    const setStatus = (field, value) => setForm(x => ({
        ...x,
        status: {
            ...x.status,
            [field]: value,
        },
    }));
    const chooseMode = mode => setForm(x => mode === "baru"
        ? {
            ...x,
            education_mode: "baru",
            nama_lembaga_asal: "",
            alamat_lembaga_asal: "",
            kelompok_umur_sebelumnya: "",
            status: {
                ...x.status,
                tanggal_pindah: "",
            },
            dev: {
                ...x.dev,
                prestasi_belajar_sebelumnya: "",
            },
        }
        : {
            ...x,
            education_mode: "pindahan",
            asal_peserta_didik: "",
            nama_lembaga: "",
            alamat_lembaga: "",
            status: {
                ...x.status,
                tanggal_pindah: "",
            },
        });
    const setOrigin = value => setForm(x => ({
        ...x,
        asal_peserta_didik: value,
        ...(value === "Rumah"
            ? {
                nama_lembaga: "",
                alamat_lembaga: "",
                status: {
                    ...x.status,
                    tanggal_pindah: "",
                },
            }
            : {}),
    }));
    return <section className="overflow-hidden rounded-xl border border-slate-200">
    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
      <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-700">
        Riwayat Pendidikan
        <span className="ml-1 text-[#ef4d45]">*</span>
      </h3>

      <p className="mt-1 text-[10px] text-slate-400">
        Pilih salah satu riwayat masuk siswa.
      </p>
    </div>

    <div className="p-4 sm:p-5">
      <div id="student-education_mode" tabIndex={-1} className={`grid gap-3 rounded-xl outline-none sm:grid-cols-2 ${errors.education_mode
            ? "ring-2 ring-rose-100"
            : ""}`}>
        {[
            {
                id: "baru",
                title: "Masuk Menjadi Peserta Didik Baru",
                description: "Siswa masuk sebagai peserta didik baru.",
                icon: HomeIcon,
            },
            {
                id: "pindahan",
                title: "Pindah Dari",
                description: "Siswa berasal dari lembaga pendidikan lain.",
                icon: BuildingOffice2Icon,
            },
        ].map(choice => {
            const active = form.education_mode === choice.id;
            const Icon = choice.icon;
            return <button key={choice.id} type="button" onClick={() => chooseMode(choice.id)} className={`flex min-h-25 items-start gap-3 rounded-xl border p-4 text-left transition ${active
                    ? "border-red-200 bg-red-50/60 ring-1 ring-red-100"
                    : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${active
                    ? "bg-[#ef4d45] text-white"
                    : "bg-slate-100 text-slate-400"}`}>
              <Icon className="h-4 w-4"/>
            </span>

            <span className="min-w-0 flex-1">
              <span className={`block text-[12px] font-semibold ${active
                    ? "text-[#d9423c]"
                    : "text-slate-700"}`}>
                {choice.title}
              </span>

              <span className="mt-1 block text-[10px] leading-4 text-slate-400">
                {choice.description}
              </span>
            </span>

            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${active
                    ? "border-[#ef4d45] bg-[#ef4d45]"
                    : "border-slate-300"}`}>
              {active && <span className="h-1.5 w-1.5 rounded-full bg-white"/>}
            </span>
          </button>;
        })}
      </div>

      {errors.education_mode && <p className="mt-2 text-[10px] font-medium text-rose-500">
        {errors.education_mode}
      </p>}

      {form.education_mode === "baru" && <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="mb-4">
          <h4 className="text-[12px] font-semibold text-slate-700">
            Masuk Menjadi Peserta Didik Baru
          </h4>

          <p className="mt-1 text-[10px] text-slate-400">
            Tentukan asal siswa sebelum masuk ke lembaga ini.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Asal Peserta Didik" required error={errors.asal_peserta_didik}>
            <Select id="student-asal_peserta_didik" value={form.asal_peserta_didik} error={!!errors.asal_peserta_didik} onChange={e => setOrigin(e.target.value)}>
              <option value="">
                Pilih asal
              </option>

              <option value="Rumah">
                Rumah
              </option>

              <option value="PAUD">
                PAUD
              </option>

              <option value="Lainnya">
                Lainnya
              </option>
            </Select>
          </Field>

          {form.asal_peserta_didik &&
                form.asal_peserta_didik !== "Rumah" && <>
            <Field label="Nama Lembaga" required error={errors.nama_lembaga}>
              <input id="student-nama_lembaga" value={form.nama_lembaga} onChange={e => set("nama_lembaga", e.target.value)} placeholder="Nama lembaga sebelumnya" className={`${inputClass} ${errors.nama_lembaga
                    ? "border-rose-300"
                    : ""}`}/>
            </Field>

            <Field label="Tanggal Keluar Lembaga Sebelumnya">
              <input type="date" value={form.status.tanggal_pindah} onChange={e => setStatus("tanggal_pindah", e.target.value)} className={inputClass}/>
            </Field>

            <Field label="Alamat Lembaga" required error={errors.alamat_lembaga}>
              <textarea id="student-alamat_lembaga" value={form.alamat_lembaga} onChange={e => set("alamat_lembaga", e.target.value)} placeholder="Alamat lengkap lembaga sebelumnya" className={`${textareaClass} ${errors.alamat_lembaga
                    ? "border-rose-300"
                    : ""}`}/>
            </Field>
          </>}
        </div>
      </div>}

      {form.education_mode === "pindahan" && <div className="mt-5 border-t border-slate-100 pt-5">
        <div className="mb-4">
          <h4 className="text-[12px] font-semibold text-slate-700">
            Pindah Dari
          </h4>

          <p className="mt-1 text-[10px] text-slate-400">
            Lengkapi riwayat siswa pada lembaga sebelumnya.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Pindah Dari" required error={errors.nama_lembaga_asal}>
            <input id="student-nama_lembaga_asal" value={form.nama_lembaga_asal} onChange={e => set("nama_lembaga_asal", e.target.value)} placeholder="Nama lembaga asal" className={`${inputClass} ${errors.nama_lembaga_asal
                ? "border-rose-300"
                : ""}`}/>
          </Field>

          <Field label="Kelompok / Kelas Sebelumnya" required error={errors.kelompok_umur_sebelumnya}>
            <input id="student-kelompok_umur_sebelumnya" value={form.kelompok_umur_sebelumnya} onChange={e => set("kelompok_umur_sebelumnya", e.target.value)} placeholder="Contoh: Kelompok A" className={`${inputClass} ${errors.kelompok_umur_sebelumnya
                ? "border-rose-300"
                : ""}`}/>
          </Field>

          <Field label="Tanggal Keluar Lembaga Sebelumnya">
            <input type="date" value={form.status.tanggal_pindah} onChange={e => setStatus("tanggal_pindah", e.target.value)} className={inputClass}/>
          </Field>

          <Field label="Alamat Lembaga Asal" required error={errors.alamat_lembaga_asal}>
            <textarea id="student-alamat_lembaga_asal" value={form.alamat_lembaga_asal} onChange={e => set("alamat_lembaga_asal", e.target.value)} placeholder="Alamat lengkap lembaga asal" className={`${textareaClass} ${errors.alamat_lembaga_asal
                ? "border-rose-300"
                : ""}`}/>
          </Field>

          <Field label="Prestasi Belajar di Lembaga Sebelumnya" className="sm:col-span-2">
            <textarea value={form.dev.prestasi_belajar_sebelumnya || ""} onChange={e => setDev("prestasi_belajar_sebelumnya", e.target.value)} placeholder="Catatan prestasi atau perkembangan belajar di lembaga sebelumnya..." className={`${textareaClass} min-h-27.5`}/>
          </Field>
        </div>
      </div>}
    </div>
  </section>;
}
function CurrentInstitution({ mode, form, setForm, errors, }) {
    const [academicPeriods, setAcademicPeriods] = React.useState([]);
    const [activeAcademicPeriod, setActiveAcademicPeriod] = React.useState(null);
    const [academicPeriodError, setAcademicPeriodError] = React.useState("");
    React.useEffect(() => {
        const controller = new AbortController();
        let mounted = true;
        import("../../../../api/academic-periods")
            .then(module => Promise.allSettled([
            module.fetchAcademicPeriods(controller.signal),
            module.fetchCurrentAcademicPeriod(controller.signal),
        ]))
            .then(([allResult, currentResult]) => {
            if (!mounted || controller.signal.aborted)
                return;
            if (allResult.status === "fulfilled") {
                setAcademicPeriods(Array.isArray(allResult.value) ? allResult.value : []);
                setAcademicPeriodError("");
            }
            else {
                setAcademicPeriods([]);
                setAcademicPeriodError(allResult.reason?.message || "Periode akademik gagal dimuat.");
            }
            if (currentResult.status === "fulfilled" && currentResult.value) {
                setActiveAcademicPeriod(currentResult.value);
                setForm(current => {
                    if (current?.exit_mode) {
                        return current;
                    }
                    const activeYear = text(currentResult.value
                        ?.tahun_ajaran);
                    if (!activeYear ||
                        text(current?.status
                            ?.tahun_pelajaran) === activeYear) {
                        return current;
                    }
                    return {
                        ...current,
                        status: {
                            ...current.status,
                            tahun_pelajaran: activeYear,
                        },
                    };
                });
            }
            else {
                setActiveAcademicPeriod(null);
            }
        })
            .catch(loadError => {
            if (!mounted || controller.signal.aborted)
                return;
            setAcademicPeriods([]);
            setActiveAcademicPeriod(null);
            setAcademicPeriodError(loadError?.message || "Periode akademik gagal dimuat.");
        });
        return () => {
            mounted = false;
            controller.abort();
        };
    }, [mode, setForm]);
    const setStatus = (field, value) => setForm(x => ({
        ...x,
        status: {
            ...x.status,
            [field]: value,
        },
    }));
    const setDev = (field, value) => setForm(x => ({
        ...x,
        dev: {
            ...x.dev,
            [field]: value,
        },
    }));
    return <section className="overflow-hidden rounded-xl border border-slate-200">
    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
      <div className="flex items-start gap-3">
        <AcademicCapIcon className="mt-0.5 h-4 w-4 shrink-0 text-indigo-500"/>

        <div>
          <h3 className="text-[12px] font-semibold text-slate-700">
            Lembaga Saat Ini
          </h3>

          <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
            Status dan penempatan kelas dikelola melalui Manajemen Pengguna.
          </p>
        </div>
      </div>
    </div>

    <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4 sm:p-5">
      <Field label="Tahun Ajaran" required error={errors.tahun_pelajaran}>
        <Select id="student-tahun_pelajaran" value={form.status.tahun_pelajaran} error={!!errors.tahun_pelajaran} onChange={e => setStatus("tahun_pelajaran", e.target.value)}>
          <option value="">
            Pilih tahun ajar
          </option>

          {schoolYearOptions(academicPeriods, form.status.tahun_pelajaran).map(x => <option key={x} value={x}>
              {x}
            </option>)}
        </Select>
        {activeAcademicPeriod && <p className="mt-1 text-[10px] font-medium text-emerald-600">Periode aktif: {activeAcademicPeriod.tahun_ajaran} · Semester {activeAcademicPeriod.semester}</p>}
        {academicPeriodError && <p className="mt-1 text-[10px] text-amber-600">{academicPeriodError}</p>}
      </Field>

      <Field label="Tanggal Masuk" required error={errors.tanggal_masuk}>
        <input id="student-tanggal_masuk" type="date" value={form.status.tanggal_masuk} onChange={e => setStatus("tanggal_masuk", e.target.value)} className={`${inputClass} ${errors.tanggal_masuk
            ? "border-rose-300"
            : ""}`}/>
      </Field>

      <Field label="Status Pendidikan">
        <div className="relative">
          <input disabled value={form.education_status
            ? "Aktif"
            : "Tidak Aktif"} className={`${disabledClass} pr-20`}/>

          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-slate-200 px-2 py-0.5 text-[9px] font-semibold text-slate-500">
            Dihitung sistem
          </span>
        </div>
      </Field>

      <Field label="Penempatan Kelas">
        <div className="relative">
          <input disabled value={form.classroom?.nama_kelas ||
            "Belum Ditentukan"} className={`${disabledClass} pr-24`}/>

          <span className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-indigo-50 px-2 py-0.5 text-[9px] font-semibold text-indigo-500">
            Management
          </span>
        </div>
      </Field>

      <Field label="Prestasi Belajar" className="sm:col-span-2 lg:col-span-4">
        <textarea value={form.dev.prestasi_belajar} onChange={e => setDev("prestasi_belajar", e.target.value)} placeholder="Catatan prestasi, kemampuan menonjol atau perkembangan belajar siswa di lembaga saat ini..." className={`${textareaClass} min-h-27.5`}/>
      </Field>
    </div>
  </section>;
}
function ExitSection({ form, setForm, errors, }) {
    const setStatus = (field, value) => setForm(x => ({
        ...x,
        status: {
            ...x.status,
            [field]: value,
        },
    }));
    const choose = mode => setForm(current => {
        if (!mode) {
            return {
                ...current,
                exit_mode: "",
                status: {
                    ...current.status,
                    status_aktif: true,
                    tanggal_keluar: "",
                    alasan_keluar: "",
                    nomor_surat_keterangan: "",
                    lembaga_lanjutan: "",
                    ke_lembaga: "",
                },
            };
        }
        if (mode === "lulus") {
            return {
                ...current,
                exit_mode: "lulus",
                status: {
                    ...current.status,
                    status_aktif: false,
                    alasan_keluar: "Lulus",
                    ke_lembaga: "",
                },
            };
        }
        return {
            ...current,
            exit_mode: "pindah",
            status: {
                ...current.status,
                status_aktif: false,
                nomor_surat_keterangan: "",
                lembaga_lanjutan: "",
            },
        };
    });
    return <section className="overflow-hidden rounded-xl border border-slate-200">
    <div className="border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
      <h3 className="text-[12px] font-semibold text-slate-700">
        Status Keluar dari Lembaga
      </h3>

      <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
        Pilih jika siswa pindah, mengundurkan diri atau telah lulus.
      </p>
    </div>

    <div className="p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-3">
        {[
            [
                "",
                "Belum Keluar",
                "Siswa masih berada di lembaga.",
            ],
            [
                "pindah",
                "Pindah / Mengundurkan Diri",
                "Siswa pindah lembaga atau mengundurkan diri.",
            ],
            [
                "lulus",
                "Lulus / Melanjutkan",
                "Siswa telah menyelesaikan pendidikan di lembaga.",
            ],
        ].map(([id, title, description]) => {
            const active = form.exit_mode === id;
            return <button key={title} type="button" onClick={() => choose(id)} className={`rounded-xl border p-3.5 text-left transition ${active
                    ? "border-red-200 bg-red-50/60 ring-1 ring-red-100"
                    : "border-slate-200 hover:bg-slate-50"}`}>
            <span className={`block text-[11px] font-semibold ${active
                    ? "text-[#d9423c]"
                    : "text-slate-700"}`}>
              {title}
            </span>

            <span className="mt-1 block text-[9px] leading-4 text-slate-400">
              {description}
            </span>
          </button>;
        })}
      </div>

      {form.exit_mode === "pindah" && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Ke Lembaga" helper="Boleh dikosongkan jika siswa mengundurkan diri tanpa pindah ke lembaga lain.">
          <input value={form.status.ke_lembaga} onChange={e => setStatus("ke_lembaga", e.target.value)} placeholder="Nama lembaga tujuan" className={inputClass}/>
        </Field>

        <Field label="Tanggal Keluar" required error={errors.tanggal_keluar}>
          <input id="student-tanggal_keluar" type="date" value={form.status.tanggal_keluar} onChange={e => setStatus("tanggal_keluar", e.target.value)} className={`${inputClass} ${errors.tanggal_keluar
                ? "border-rose-300"
                : ""}`}/>
        </Field>

        <Field label="Alasan / Sebab" required error={errors.alasan_keluar} className="sm:col-span-2">
          <textarea id="student-alasan_keluar" value={form.status.alasan_keluar} onChange={e => setStatus("alasan_keluar", e.target.value)} placeholder="Contoh: Pindah domisili, mengikuti orang tua, mengundurkan diri..." className={`${textareaClass} ${errors.alasan_keluar
                ? "border-rose-300"
                : ""}`}/>
        </Field>
      </div>}

      {form.exit_mode === "lulus" && <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field label="Melanjutkan ke Lembaga" helper="Opsional. Isi jika lembaga lanjutan sudah diketahui.">
          <input value={form.status.lembaga_lanjutan} onChange={e => setStatus("lembaga_lanjutan", e.target.value)} placeholder="Nama lembaga lanjutan" className={inputClass}/>
        </Field>

        <Field label="Nomor/Tgl. Surat Ket." helper="Opsional. Nomor dapat dibuat oleh sistem saat rapor dicetak dan tetap dapat diubah.">
          <input value={form.status.nomor_surat_keterangan} onChange={e => setStatus("nomor_surat_keterangan", e.target.value)} placeholder="Akan terisi saat cetak rapor / isi manual" className={inputClass}/>
        </Field>

        <Field label="Tanggal Keluar" required error={errors.tanggal_keluar}>
          <input id="student-tanggal_keluar" type="date" value={form.status.tanggal_keluar} onChange={e => setStatus("tanggal_keluar", e.target.value)} className={`${inputClass} ${errors.tanggal_keluar
                ? "border-rose-300"
                : ""}`}/>
        </Field>
      </div>}
    </div>
  </section>;
}
export default function StudentForm({ mode, form, setForm, section, setSection, errors, saving, onCancel, onSave, }) {
    const set = (field, value) => setForm(x => ({
        ...x,
        [field]: value,
    }));
    return <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
    <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
      <h2 className="text-[15px] font-semibold text-slate-800">
        {mode === "create"
            ? "Tambah Siswa"
            : "Edit Siswa"}
      </h2>

      <p className="mt-1 text-xs text-slate-400">
        Lengkapi biodata, perkembangan dan riwayat pendidikan siswa.
      </p>

      <div className="mt-5 overflow-x-auto pb-1">
        <div className="flex min-w-max gap-2">
          {SECTIONS.map((name, i) => {
            const active = section === i;
            return <button key={name} type="button" disabled={saving} aria-current={active ? "step" : undefined} onClick={() => setSection(i)} className={`inline-flex h-9 items-center gap-2 rounded-lg border px-3 text-[11px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${active
                    ? "border-red-100 bg-red-50 text-[#ef4d45]"
                    : "border-slate-200 text-slate-500 hover:bg-slate-50"}`}>
              <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold ${active
                    ? "bg-[#ef4d45] text-white"
                    : "bg-slate-100 text-slate-500"}`}>
                {i + 1}
              </span>

              {name}
            </button>;
        })}
        </div>
      </div>
    </div>

    <form onSubmit={e => {
            e.preventDefault();
            if (!saving)
                onSave();
        }}>
      <div className="min-h-[460px] p-4 sm:min-h-[520px] sm:p-5">
        {section === 0 && <div className="space-y-6">
          <PhotoUpload value={form.foto} onChange={value => set("foto", value)}/>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="Nama Lengkap" required error={errors.nama_lengkap}>
              <input id="student-nama_lengkap" value={form.nama_lengkap} onChange={e => set("nama_lengkap", e.target.value)} placeholder="Nama lengkap siswa" className={`${inputClass} ${errors.nama_lengkap
                ? "border-rose-300"
                : ""}`}/>
            </Field>

            <Field label="Nama Panggilan">
              <input value={form.nama_panggilan} onChange={e => set("nama_panggilan", e.target.value)} placeholder="Nama panggilan" className={inputClass}/>
            </Field>

            <Field label="NIS" required error={errors.nisn}>
              <DigitInput id="student-nisn" value={form.nisn} digits={10} error={!!errors.nisn} onChange={value => set("nisn", value)}/>
            </Field>

            <Field label="NIK" required error={errors.nik}>
              <DigitInput id="student-nik" value={form.nik} digits={16} exact maxLength={16} error={!!errors.nik} disabled={saving} onChange={value => set("nik", value)}/>
            </Field>

            <Field label="Tempat Lahir">
              <input value={form.tempat_lahir} onChange={e => set("tempat_lahir", e.target.value)} placeholder="Kota kelahiran" className={inputClass}/>
            </Field>

            <Field label="Tanggal Lahir">
              <input type="date" value={form.tanggal_lahir} onChange={e => set("tanggal_lahir", e.target.value)} className={inputClass}/>
            </Field>

            <Field label="Jenis Kelamin">
              <Select value={form.jenis_kelamin} onChange={e => set("jenis_kelamin", e.target.value)}>
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

            <Field label="Agama">
              <Select value={form.agama} onChange={e => set("agama", e.target.value)}>
                <option value="">
                  Pilih agama
                </option>

                {[
                "Islam",
                "Kristen",
                "Katolik",
                "Hindu",
                "Buddha",
                "Konghucu",
            ].map(x => <option key={x} value={x}>
                    {x}
                  </option>)}
              </Select>
            </Field>

            <Field label="Kewarganegaraan">
              <input value={form.kewarganegaraan} onChange={e => set("kewarganegaraan", e.target.value)} className={inputClass}/>
            </Field>
          </div>
        </div>}

        {section === 1 && <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Alamat Lengkap" className="sm:col-span-2 lg:col-span-3">
            <textarea value={form.alamat_lengkap} onChange={e => set("alamat_lengkap", e.target.value)} placeholder="Alamat lengkap tempat tinggal" className={textareaClass}/>
          </Field>

          <Field label="Nomor telepon rumah">
            <input inputMode="numeric" pattern="[0-9]*" value={form.no_telepon_rumah} onChange={e => set("no_telepon_rumah", digitsOnly(e.target.value))} placeholder="Contoh: 0251..." className={inputClass}/>
          </Field>

          <Field label="Status Tempat Tinggal">
            <Select value={form.status_tempat_tinggal} onChange={e => set("status_tempat_tinggal", e.target.value)}>
              <option value="">
                Pilih status
              </option>

              {[
                "Orang Tua",
                "Wali",
                "Asrama",
                "Lainnya",
            ].map(x => <option key={x} value={x}>
                  {x}
                </option>)}
            </Select>
          </Field>

          <Field label="Jarak ke Sekolah">
            <UnitInput value={form.jarak_ke_sekolah} onChange={value => set("jarak_ke_sekolah", value)} unit="km"/>
          </Field>

          <Field label="Bahasa Sehari-hari">
            <input value={form.bahasa_sehari_hari} onChange={e => set("bahasa_sehari_hari", e.target.value)} placeholder="Bahasa Indonesia" className={inputClass}/>
          </Field>

          <Field label="Saudara Kandung">
            <input type="number" min="0" value={form.jumlah_saudara_kandung} onChange={e => set("jumlah_saudara_kandung", num(e.target.value))} className={inputClass}/>
          </Field>

          <Field label="Saudara Tiri">
            <input type="number" min="0" value={form.jumlah_saudara_tiri} onChange={e => set("jumlah_saudara_tiri", num(e.target.value))} className={inputClass}/>
          </Field>

          <Field label="Saudara Angkat">
            <input type="number" min="0" value={form.jumlah_saudara_angkat} onChange={e => set("jumlah_saudara_angkat", num(e.target.value))} className={inputClass}/>
          </Field>
        </div>}

        {section === 2 && <ParentSection form={form} setForm={setForm}/>}

        {section === 3 && <React.Suspense fallback={<div className="min-h-[360px] space-y-3 rounded-xl border border-slate-100 bg-white p-4">
              <div className="h-10 w-52 animate-pulse rounded-lg bg-slate-100"/>
              <div className="h-28 animate-pulse rounded-xl bg-slate-50"/>
              <div className="h-28 animate-pulse rounded-xl bg-slate-50"/>
            </div>}>
          <DevelopmentHistory value={form.dev} onChange={dev => setForm(x => ({
                ...x,
                dev,
            }))}/>
        </React.Suspense>}

        {section === 4 && <div className="space-y-6">
          <EducationHistory form={form} setForm={setForm} errors={errors}/>

          <CurrentInstitution mode={mode} form={form} setForm={setForm} errors={errors}/>

          <ExitSection form={form} setForm={setForm} errors={errors}/>

          <Field label="Catatan Penting">
            <textarea value={form.catatan_penting} onChange={e => set("catatan_penting", e.target.value)} placeholder="Catatan tambahan jika diperlukan..." className={textareaClass}/>
          </Field>
        </div>}
      </div>

      <div className="border-t border-slate-100 bg-slate-50 px-4 py-3 sm:px-5">
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <button type="button" disabled={saving} onClick={onCancel} className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:border-rose-200 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50">
            Batal
          </button>

          <div className="grid grid-cols-2 gap-2 sm:flex">
            {section > 0 && <button type="button" disabled={saving} onClick={() => setSection(x => Math.max(0, x - 1))} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
              <ArrowLeftIcon className="h-4 w-4"/>
              Sebelumnya
            </button>}

            {section < SECTIONS.length - 1 && <button type="button" disabled={saving} onClick={() => setSection(x => Math.min(SECTIONS.length - 1, x + 1))} className="inline-flex h-10 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
              Selanjutnya
              <ChevronRightIcon className="h-4 w-4"/>
            </button>}

            <button type="submit" disabled={saving} className="col-span-2 inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-5 text-xs font-semibold text-white transition hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50 sm:col-auto">
              {saving
            ? <ArrowPathIcon className="h-4 w-4 animate-spin"/>
            : <CheckCircleIcon className="h-4 w-4"/>}

              {saving
            ? "Menyimpan..."
            : "Simpan"}
            </button>
          </div>
        </div>
      </div>
    </form>
  </section>;
}
