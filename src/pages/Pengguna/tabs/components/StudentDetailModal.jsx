import React, { useEffect, useMemo, useState } from "react";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  CheckCircleIcon,
  HeartIcon,
  HomeIcon,
  IdentificationIcon,
  InformationCircleIcon,
  MapPinIcon,
  PencilSquareIcon,
  PhotoIcon,
  UserGroupIcon,
  XCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const text = (value) => String(value ?? "").trim();
const show = (value) => text(value) || "-";
const has = (value) => Boolean(text(value));

const numberValue = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatDate = (value) => {
  const raw = text(value);
  if (!raw) return "-";

  const isoDate = raw.slice(0, 10);

  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) {
    return raw;
  }

  const [year, month, day] = isoDate.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  if (
    Number.isNaN(date.getTime()) ||
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return raw;
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const inferEducationMode = (student) => {
  if (
    has(student?.nama_lembaga_asal) ||
    has(student?.alamat_lembaga_asal) ||
    has(student?.kelompok_umur_sebelumnya)
  ) {
    return "pindahan";
  }

  if (
    has(student?.asal_peserta_didik) ||
    has(student?.nama_lembaga) ||
    has(student?.alamat_lembaga)
  ) {
    return "baru";
  }

  return "";
};

const inferExitMode = (student) => {
  const status = student?.status ?? {};

  if (
    has(status.lembaga_lanjutan) ||
    has(status.nomor_surat_keterangan) ||
    (has(status.tanggal_keluar) &&
      !has(status.alasan_keluar) &&
      !has(status.ke_lembaga))
  ) {
    return "lulus";
  }

  if (
    has(status.ke_lembaga) ||
    has(status.alasan_keluar)
  ) {
    return "pindah";
  }

  return "";
};

function StudentPhoto({ src, name, className = "" }) {
  const [failed, setFailed] = useState(false);
  const visible = has(src) && !failed;

  useEffect(() => {
    setFailed(false);
  }, [src]);

  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm ${className}`}
    >
      {visible ? (
        <img
          src={src}
          alt={`Foto ${name || "siswa"}`}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover object-center"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center bg-slate-50 px-2 text-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-slate-300 shadow-sm ring-1 ring-slate-100">
            <PhotoIcon className="h-5 w-5" />
          </span>
          <p className="mt-2 text-[9px] font-medium text-slate-400">
            Belum ada foto
          </p>
        </div>
      )}
    </div>
  );
}

function Section({
  title,
  description,
  icon: Icon,
  children,
}) {
  return (
    <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/70 px-4 py-3 sm:px-5">
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-slate-500 shadow-sm ring-1 ring-slate-100">
            <Icon className="h-4 w-4" />
          </span>
        )}

        <div className="min-w-0">
          <h3 className="text-[12px] font-bold uppercase tracking-wide text-slate-700">
            {title}
          </h3>
          {description && (
            <p className="mt-0.5 text-[10px] leading-4 text-slate-400">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="p-4 sm:p-5">
        {children}
      </div>
    </section>
  );
}

function Item({
  label,
  value,
  className = "",
}) {
  return (
    <div
      className={`min-w-0 rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3 ${className}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 wrap-break-word text-[12px] font-semibold leading-5 text-slate-700">
        {show(value)}
      </p>
    </div>
  );
}

function TextItem({
  label,
  value,
  className = "",
}) {
  return (
    <div
      className={`rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3 ${className}`}
    >
      <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
        {label}
      </p>
      <p className="mt-1.5 whitespace-pre-wrap wrap-break-word text-[12px] leading-5 text-slate-600">
        {show(value)}
      </p>
    </div>
  );
}

function StatusBadge({ active }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
        active
          ? "bg-emerald-50 text-emerald-600"
          : "bg-slate-100 text-slate-500"
      }`}
    >
      {active ? (
        <CheckCircleIcon className="h-3.5 w-3.5" />
      ) : (
        <XCircleIcon className="h-3.5 w-3.5" />
      )}
      {active ? "Aktif" : "Tidak Aktif"}
    </span>
  );
}

function ParentCard({
  title,
  data,
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <div className="border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <p className="text-[11px] font-semibold text-slate-700">
          {title}
        </p>
      </div>

      <div className="grid gap-2 p-3 sm:grid-cols-2 lg:grid-cols-4">
        {data.map(([label, value, className]) => (
          <Item
            key={label}
            label={label}
            value={value}
            className={className || ""}
          />
        ))}
      </div>
    </div>
  );
}

function DevelopmentHistory({ development }) {
  const rows = useMemo(
    () =>
      Array.from(
        { length: 3 },
        (_, index) =>
          development?.riwayat_perkembangan?.[index] ?? {}
      ),
    [development]
  );

  const visible = rows.some(
    (row) =>
      has(row.tahun) ||
      numberValue(row.berat_badan) > 0 ||
      numberValue(row.tinggi_badan) > 0 ||
      has(row.penyakit) ||
      has(row.kelainan_jiwa)
  );

  if (!visible) {
    return (
      <div className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center">
        <p className="text-[11px] text-slate-400">
          Belum ada riwayat keadaan jasmani.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-3 md:hidden">
        {rows.map((row, index) => (
          <div
            key={index}
            className="overflow-hidden rounded-xl border border-slate-200"
          >
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-4 py-2.5">
              <p className="text-[11px] font-semibold text-slate-700">
                Tahun Ke-{index + 1}
              </p>
              <span className="text-[10px] font-medium text-slate-400">
                {show(row.tahun)}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 p-3">
              <Item
                label="Berat Badan"
                value={
                  numberValue(row.berat_badan) > 0
                    ? `${numberValue(row.berat_badan)} kg`
                    : "-"
                }
              />
              <Item
                label="Tinggi Badan"
                value={
                  numberValue(row.tinggi_badan) > 0
                    ? `${numberValue(row.tinggi_badan)} cm`
                    : "-"
                }
              />
              <TextItem
                label="Penyakit"
                value={row.penyakit}
                className="col-span-2"
              />
              <TextItem
                label="Kelainan"
                value={row.kelainan_jiwa}
                className="col-span-2"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 md:block">
        <table className="w-full min-w-[700px] table-fixed">
          <thead className="bg-slate-50">
            <tr className="border-b border-slate-200">
              <th className="w-[25%] px-4 py-3 text-left text-[9px] font-semibold uppercase tracking-wider text-slate-400">
                Aspek
              </th>
              {[1, 2, 3].map((value) => (
                <th
                  key={value}
                  className="px-4 py-3 text-center text-[9px] font-semibold uppercase tracking-wider text-slate-400"
                >
                  Tahun Ke-{value}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {[
              ["Tahun", (row) => show(row.tahun)],
              [
                "Berat Badan",
                (row) =>
                  numberValue(row.berat_badan) > 0
                    ? `${numberValue(row.berat_badan)} kg`
                    : "-",
              ],
              [
                "Tinggi Badan",
                (row) =>
                  numberValue(row.tinggi_badan) > 0
                    ? `${numberValue(row.tinggi_badan)} cm`
                    : "-",
              ],
              ["Penyakit", (row) => show(row.penyakit)],
              ["Kelainan", (row) => show(row.kelainan_jiwa)],
            ].map(([label, getter]) => (
              <tr key={label}>
                <td className="px-4 py-3 text-[11px] font-semibold text-slate-600">
                  {label}
                </td>
                {rows.map((row, index) => (
                  <td
                    key={index}
                    className="px-4 py-3 text-center text-[11px] leading-5 text-slate-600"
                  >
                    {getter(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function DevelopmentSection({ development }) {
  const weight = numberValue(development?.berat_badan);
  const height = numberValue(development?.tinggi_badan);

  return (
    <div className="space-y-4">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        <Item
          label="Berat Badan Terakhir"
          value={weight > 0 ? `${weight} kg` : "-"}
        />
        <Item
          label="Tinggi Badan Terakhir"
          value={height > 0 ? `${height} cm` : "-"}
        />
        <Item
          label="Golongan Darah"
          value={development?.golongan_darah}
        />
        <Item
          label="Penyakit"
          value={development?.penyakit}
        />
        <TextItem
          label="Catatan Kesehatan"
          value={development?.catatan_kesehatan}
          className="sm:col-span-2 lg:col-span-4"
        />
      </div>

      <div>
        <div className="mb-3 flex items-center gap-3">
          <h4 className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-slate-600">
            Riwayat Perkembangan
          </h4>
          <div className="h-px flex-1 bg-slate-100" />
        </div>
        <DevelopmentHistory development={development} />
      </div>
    </div>
  );
}

function EducationEntry({
  student,
  educationMode,
}) {
  if (educationMode === "pindahan") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-indigo-50 px-3 py-2.5 text-indigo-600">
          <BuildingOffice2Icon className="h-4 w-4 shrink-0" />
          <p className="text-[11px] font-semibold">
            Pindah dari lembaga lain
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Item
            label="Pindah Dari"
            value={student.nama_lembaga_asal}
          />
          <Item
            label="Kelompok / Kelas Sebelumnya"
            value={student.kelompok_umur_sebelumnya}
          />
          <Item
            label="Tanggal Keluar Lembaga Sebelumnya"
            value={formatDate(student.status?.tanggal_pindah)}
          />
          <Item
            label="Alamat Lembaga Asal"
            value={student.alamat_lembaga_asal}
            className="sm:col-span-2 lg:col-span-3"
          />
        </div>

        {has(student.dev?.prestasi_belajar_sebelumnya) && (
          <TextItem
            label="Prestasi Belajar di Lembaga Sebelumnya"
            value={student.dev.prestasi_belajar_sebelumnya}
          />
        )}
      </div>
    );
  }

  if (educationMode === "baru") {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2.5 text-emerald-600">
          <HomeIcon className="h-4 w-4 shrink-0" />
          <p className="text-[11px] font-semibold">
            Masuk menjadi peserta didik baru
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Item
            label="Asal Peserta Didik"
            value={student.asal_peserta_didik}
          />

          {student.asal_peserta_didik !== "Rumah" && (
            <>
              <Item
                label="Nama Lembaga"
                value={student.nama_lembaga}
              />
              <Item
                label="Tanggal Keluar Lembaga Sebelumnya"
                value={formatDate(student.status?.tanggal_pindah)}
              />
              <Item
                label="Alamat Lembaga"
                value={student.alamat_lembaga}
                className="sm:col-span-2 lg:col-span-3"
              />
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-dashed border-slate-200 px-4 py-7 text-center">
      <p className="text-[11px] text-slate-400">
        Riwayat pendidikan belum diisi.
      </p>
    </div>
  );
}

function ExitDetail({
  student,
  exitMode,
}) {
  const status = student.status ?? {};

  if (exitMode === "pindah") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-amber-700">
            Pindah / Mengundurkan Diri
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {has(status.ke_lembaga) && (
            <Item
              label="Ke Lembaga"
              value={status.ke_lembaga}
            />
          )}
          <Item
            label="Tanggal Keluar"
            value={formatDate(status.tanggal_keluar)}
          />
          <TextItem
            label="Alasan / Sebab"
            value={status.alasan_keluar}
            className="sm:col-span-2"
          />
        </div>
      </div>
    );
  }

  if (exitMode === "lulus") {
    return (
      <div className="space-y-3">
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2.5">
          <p className="text-[11px] font-semibold text-emerald-700">
            Lulus / Melanjutkan
          </p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Item
            label="Tanggal Keluar"
            value={formatDate(status.tanggal_keluar)}
          />
          <Item
            label="Melanjutkan ke Lembaga"
            value={status.lembaga_lanjutan}
          />
          <Item
            label="Nomor/Tgl. Surat Ket."
            value={status.nomor_surat_keterangan}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
      <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-500" />
      <div>
        <p className="text-[11px] font-semibold text-slate-700">
          Belum Keluar
        </p>
        <p className="mt-0.5 text-[10px] text-slate-400">
          Siswa masih tercatat pada lembaga saat ini.
        </p>
      </div>
    </div>
  );
}

function useModalBehavior({
  active,
  onClose,
  dialogRef,
  closeButtonRef,
}) {
  const previousFocusRef = React.useRef(null);

  useEffect(() => {
    if (!active) return undefined;

    previousFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 0);

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = Array.from(
        dialog.querySelectorAll(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
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
      const last = focusable[focusable.length - 1];

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

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);

      const previousFocus = previousFocusRef.current;

      window.setTimeout(() => {
        if (
          previousFocus &&
          document.contains(previousFocus)
        ) {
          previousFocus.focus();
        }
      }, 0);
    };
  }, [
    active,
    onClose,
    dialogRef,
    closeButtonRef,
  ]);
}

export default function StudentDetailModal({
  student,
  onClose,
  onEdit,
}) {
  const dialogRef = React.useRef(null);
  const closeButtonRef = React.useRef(null);

  useModalBehavior({
    active: Boolean(student),
    onClose,
    dialogRef,
    closeButtonRef,
  });

  const parent = student?.parent ?? {};
  const status = student?.status ?? {};
  const development = student?.dev ?? {};

  const educationMode =
    student?.education_mode ||
    inferEducationMode(student);

  const exitMode =
    student?.exit_mode ||
    inferExitMode(student);

  const educationActive =
    typeof student?.education_status === "boolean"
      ? student.education_status
      : Boolean(status.status_aktif);

  const classroomName =
    text(student?.classroom?.nama_kelas) ||
    text(student?.nama_kelas) ||
    "Belum ditempatkan";

  if (!student) return null;

  const handleEdit = () => {
    if (!onEdit) return;
    onClose?.();
    onEdit(student);
  };

  return (
    <div
      className="fixed inset-0 z-[150] flex items-end justify-center bg-slate-950/45 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose?.();
        }
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-detail-title"
        aria-describedby="student-detail-description"
        className="flex max-h-[96dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-slate-50 shadow-2xl sm:max-h-[92dvh] sm:max-w-5xl sm:rounded-2xl"
      >
        <header className="shrink-0 border-b border-slate-200 bg-white">
          <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
            <StudentPhoto
              src={student.foto}
              name={student.nama_lengkap}
              className="h-24 w-[72px] shrink-0 sm:h-28 sm:w-[84px]"
            />

            <div className="min-w-0 flex-1 py-0.5">
              <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-slate-400">
                Detail Siswa
              </p>

              <h2
                id="student-detail-title"
                className="mt-1 truncate text-[16px] font-semibold text-slate-900 sm:text-lg"
              >
                {show(student.nama_lengkap)}
              </h2>

              <p
                id="student-detail-description"
                className="sr-only"
              >
                Detail biodata, orang tua, perkembangan, pendidikan, dan status siswa.
              </p>

              {has(student.nama_panggilan) && (
                <p className="mt-0.5 text-[11px] text-slate-400">
                  {student.nama_panggilan}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-500">
                <span>
                  <b className="font-semibold text-slate-600">
                    NIS
                  </b>{" "}
                  {show(student.nisn)}
                </span>
                <span>
                  <b className="font-semibold text-slate-600">
                    NIK
                  </b>{" "}
                  {show(student.nik)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                <StatusBadge active={educationActive} />

                <span
                  className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                    classroomName !== "Belum ditempatkan"
                      ? "bg-indigo-50 text-indigo-600"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {classroomName}
                </span>

                <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-500">
                  Tahun Ajaran {show(status.tahun_pelajaran)}
                </span>
              </div>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              aria-label="Tutup detail siswa"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          <div className="mx-auto max-w-5xl space-y-4 p-4 sm:p-5">
            <Section
              title="Identitas Siswa"
              description="Informasi dasar dan identitas resmi siswa."
              icon={IdentificationIcon}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <Item
                  label="Nama Lengkap"
                  value={student.nama_lengkap}
                  className="sm:col-span-2"
                />
                <Item
                  label="Nama Panggilan"
                  value={student.nama_panggilan}
                />
                <Item
                  label="NIS"
                  value={student.nisn}
                />
                <Item
                  label="NIK"
                  value={student.nik}
                />
                <Item
                  label="Jenis Kelamin"
                  value={student.jenis_kelamin}
                />
                <Item
                  label="Tempat Lahir"
                  value={student.tempat_lahir}
                />
                <Item
                  label="Tanggal Lahir"
                  value={formatDate(student.tanggal_lahir)}
                />
                <Item
                  label="Agama"
                  value={student.agama}
                />
                <Item
                  label="Kewarganegaraan"
                  value={student.kewarganegaraan}
                />
              </div>
            </Section>

            <Section
              title="Domisili"
              description="Informasi tempat tinggal dan kondisi keluarga."
              icon={MapPinIcon}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Item
                  label="Alamat Lengkap"
                  value={student.alamat_lengkap}
                  className="sm:col-span-2 lg:col-span-4"
                />
                <Item
                  label="Nomor telepon rumah"
                  value={student.no_telepon_rumah}
                />
                <Item
                  label="Status Tempat Tinggal"
                  value={student.status_tempat_tinggal}
                />
                <Item
                  label="Jarak ke Sekolah"
                  value={`${numberValue(student.jarak_ke_sekolah)} km`}
                />
                <Item
                  label="Bahasa Sehari-hari"
                  value={student.bahasa_sehari_hari}
                />
                <Item
                  label="Saudara Kandung"
                  value={student.jumlah_saudara_kandung ?? 0}
                />
                <Item
                  label="Saudara Tiri"
                  value={student.jumlah_saudara_tiri ?? 0}
                />
                <Item
                  label="Saudara Angkat"
                  value={student.jumlah_saudara_angkat ?? 0}
                />
              </div>
            </Section>

            <Section
              title="Orang Tua & Wali"
              description="Informasi ayah, ibu dan wali siswa."
              icon={UserGroupIcon}
            >
              <div className="space-y-3">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  <Item
                    label="Nomor ponsel orang tua"
                    value={parent.no_hp_ortu}
                    className="sm:col-span-2 lg:col-span-4"
                  />
                </div>

                <ParentCard
                  title="Ayah"
                  data={[
                    ["Nama", parent.nama_ayah],
                    ["Pendidikan", parent.pendidikan_ayah],
                    ["Pekerjaan", parent.pekerjaan_ayah],
                  ]}
                />

                <ParentCard
                  title="Ibu"
                  data={[
                    ["Nama", parent.nama_ibu],
                    ["Pendidikan", parent.pendidikan_ibu],
                    ["Pekerjaan", parent.pekerjaan_ibu],
                  ]}
                />

                <ParentCard
                  title="Wali"
                  data={[
                    ["Nama", parent.nama_wali],
                    ["Pendidikan", parent.pendidikan_wali],
                    ["Pekerjaan", parent.pekerjaan_wali],
                    [
                      "Hubungan",
                      parent.hubungan_keluarga_wali,
                      "sm:col-span-2 lg:col-span-4",
                    ],
                  ]}
                />
              </div>
            </Section>

            <Section
              title="Perkembangan & Kesehatan"
              description="Kondisi kesehatan dan riwayat perkembangan jasmani siswa."
              icon={HeartIcon}
            >
              <DevelopmentSection development={development} />
            </Section>

            <Section
              title="Riwayat Pendidikan"
              description="Riwayat siswa sebelum masuk ke lembaga saat ini."
              icon={BuildingOffice2Icon}
            >
              <EducationEntry
                student={student}
                educationMode={educationMode}
              />
            </Section>

            <Section
              title="Lembaga Saat Ini"
              description="Informasi pendidikan siswa pada lembaga saat ini."
              icon={AcademicCapIcon}
            >
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                <Item
                  label="Tahun Ajaran"
                  value={status.tahun_pelajaran}
                />
                <Item
                  label="Tanggal Masuk"
                  value={formatDate(status.tanggal_masuk)}
                />
                <div className="rounded-lg border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                  <p className="text-[9px] font-semibold uppercase tracking-[.08em] text-slate-400">
                    Status Pendidikan
                  </p>
                  <div className="mt-1.5">
                    <StatusBadge active={educationActive} />
                  </div>
                </div>
                <Item
                  label="Penempatan Kelas"
                  value={classroomName}
                />
                <Item
                  label="Kelompok Umur"
                  value={status.kelompok_umur}
                />
                <Item
                  label="Dari Kelompok Umur"
                  value={status.dari_kelompok_umur}
                />
                <Item
                  label="Tingkat Kelompok Umur"
                  value={status.tingkat_kelompok_umur}
                />
                <Item
                  label="Tanggal Pindah"
                  value={formatDate(status.tanggal_pindah)}
                />
                <TextItem
                  label="Prestasi Belajar"
                  value={development.prestasi_belajar}
                  className="sm:col-span-2 lg:col-span-4"
                />
              </div>
            </Section>

            <Section
              title="Status Keluar dari Lembaga"
              description="Informasi perpindahan, pengunduran diri atau kelulusan siswa."
              icon={ArrowRightIcon}
            >
              <ExitDetail
                student={student}
                exitMode={exitMode}
              />
            </Section>

            {has(student.catatan_penting) && (
              <Section
                title="Catatan Penting"
                icon={InformationCircleIcon}
              >
                <TextItem
                  label="Catatan"
                  value={student.catatan_penting}
                />
              </Section>
            )}
          </div>
        </main>

        <footer className="shrink-0 border-t border-slate-200 bg-white px-4 py-3 sm:px-5">
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="h-10 rounded-lg border border-slate-200 bg-white px-4 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-200"
            >
              Tutup
            </button>

            {onEdit && (
              <button
                type="button"
                onClick={handleEdit}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white transition hover:bg-[#df433c] focus:outline-none focus:ring-2 focus:ring-red-100"
              >
                <PencilSquareIcon className="h-4 w-4" />
                Edit Data
              </button>
            )}
          </div>
        </footer>
      </section>
    </div>
  );
}