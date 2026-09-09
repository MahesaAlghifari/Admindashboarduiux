import { useEffect, useMemo, useState, } from "react";
import { useQuery } from "@tanstack/react-query";
import { AcademicCapIcon, ArrowPathIcon, ArrowRightIcon, BanknotesIcon, BookOpenIcon, CalendarDaysIcon, CheckCircleIcon, ChevronRightIcon, ClockIcon, ExclamationCircleIcon, ExclamationTriangleIcon, InformationCircleIcon, MegaphoneIcon, Squares2X2Icon, SunIcon, UserGroupIcon, UsersIcon, } from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { SectionHeader } from "../../components/common/DesignSystem";
import { fetchDashboardCommunicationReminder, fetchDashboardContext, fetchDashboardPriorityReminders, fetchDashboardRecentPayments, fetchDashboardStaffStats, fetchDashboardStudentStats, } from "../../api/dashboard-overview";
const text = (value) => String(value ?? "").trim();
const formatDate = (value, options = {
    day: "2-digit",
    month: "short",
    year: "numeric",
}) => {
    const raw = text(value).slice(0, 10);
    if (!raw)
        return "-";
    const date = new Date(`${raw}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
        return raw;
    }
    return new Intl.DateTimeFormat("id-ID", options).format(date);
};
const formatCurrency = (value) => new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
}).format(Number(value) || 0);
const formatToday = () => new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
}).format(new Date());
const formatTime = (value) => {
    if (!value)
        return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "-";
    }
    return new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
    }).format(date);
};
const announcementTone = (type) => {
    const value = text(type).toLowerCase();
    if (value === "penting") {
        return {
            dot: "bg-rose-500",
            badge: "border-rose-100 bg-rose-50 text-rose-600",
        };
    }
    if (value === "kegiatan") {
        return {
            dot: "bg-sky-500",
            badge: "border-sky-100 bg-sky-50 text-sky-600",
        };
    }
    if (value === "libur") {
        return {
            dot: "bg-amber-500",
            badge: "border-amber-100 bg-amber-50 text-amber-600",
        };
    }
    return {
        dot: "bg-slate-400",
        badge: "border-slate-100 bg-slate-50 text-slate-500",
    };
};
function getDisplayName(user) {
    return (user?.fullname ||
        user?.name ||
        user?.employee?.fullname ||
        user?.staff?.fullname ||
        user?.pribadi?.nama_lengkap ||
        user?.nik ||
        "Pengguna");
}
function getUserNik(user) {
    return text(user?.nik ||
        user?.employee?.nik ||
        user?.staff?.nik ||
        user?.pribadi?.nik);
}
function useDelayedReady(delay) {
    const [ready, setReady] = useState(false);
    useEffect(() => {
        let idleId = null;
        let timerId = null;
        const activate = () => setReady(true);
        timerId = window.setTimeout(() => {
            if (typeof window.requestIdleCallback ===
                "function") {
                idleId = window.requestIdleCallback(activate, { timeout: 700 });
            }
            else {
                activate();
            }
        }, delay);
        return () => {
            if (timerId !== null) {
                window.clearTimeout(timerId);
            }
            if (idleId !== null &&
                typeof window.cancelIdleCallback ===
                    "function") {
                window.cancelIdleCallback(idleId);
            }
        };
    }, [delay]);
    return ready;
}
function SectionLoading({ rows = 1, className = "", }) {
    return (<div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }, (_, index) => (<div key={index} className="h-24 animate-pulse rounded-xl border border-slate-100 bg-slate-50/70"/>))}
    </div>);
}
function StatCard({ icon: Icon, label, value, detail, tone = "slate", }) {
    const tones = {
        slate: {
            icon: "border-slate-100 bg-slate-50 text-slate-500",
            value: "text-slate-800",
        },
        red: {
            icon: "border-red-100 bg-red-50 text-[#ef4d45]",
            value: "text-[#ef4d45]",
        },
        green: {
            icon: "border-emerald-100 bg-emerald-50 text-emerald-600",
            value: "text-emerald-600",
        },
        blue: {
            icon: "border-sky-100 bg-sky-50 text-sky-600",
            value: "text-sky-600",
        },
    };
    const style = tones[tone] ?? tones.slate;
    return (<div className="group rounded-xl border border-slate-100 bg-white p-3.5 transition hover:border-slate-200">
      <div className="flex items-start justify-between gap-3">
        <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${style.icon}`}>
          <Icon className="h-[18px] w-[18px]"/>
        </span>

        <span className="text-right text-[11px] leading-4 text-slate-400">
          {detail}
        </span>
      </div>

      <div className="mt-4">
        <p className={`text-[26px] font-semibold leading-none tracking-[-0.03em] ${style.value}`}>
          {value}
        </p>
        <p className="mt-2 text-[12px] font-semibold uppercase tracking-wide text-slate-400">
          {label}
        </p>
      </div>
    </div>);
}
function SectionGroup({ eyebrow, title, description, children, }) {
    return (<section className="space-y-3">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 h-8 w-1 shrink-0 rounded-full bg-[#ef4d45]"/>
        <div>
          {eyebrow && (<p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#ef4d45]">
              {eyebrow}
            </p>)}
          <h2 className="mt-0.5 text-[15px] font-semibold text-slate-800">
            {title}
          </h2>
          {description && (<p className="mt-1 text-[12px] leading-4 text-slate-400">
              {description}
            </p>)}
        </div>
      </div>

      {children}
    </section>);
}
function OperationalBanner({ operational, }) {
    return (<div className={`relative overflow-hidden rounded-xl border px-4 py-3 ${operational.school_day
            ? "border-red-100 bg-gradient-to-r from-red-50/80 via-white to-white"
            : "border-amber-100 bg-gradient-to-r from-amber-50/80 via-white to-white"}`}>
      <div className="relative z-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${operational.school_day
            ? "bg-[#ef4d45] text-white"
            : "bg-amber-100 text-amber-600"}`}>
            {operational.school_day ? (<SunIcon className="h-[18px] w-[18px]"/>) : (<CalendarDaysIcon className="h-[18px] w-[18px]"/>)}
          </span>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-[14px] font-semibold text-slate-800">
                {operational.day_label}
              </h2>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${operational.school_day
            ? "border-emerald-100 bg-emerald-50 text-emerald-600"
            : "border-amber-100 bg-amber-50 text-amber-600"}`}>
                {operational.school_day
            ? "Operasional aktif"
            : "Tidak wajib input"}
              </span>
            </div>

            <p className="mt-1 max-w-2xl text-[12px] leading-4 text-slate-400">
              {operational.day_description}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 text-[12px] text-slate-400">
          <span className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5">
            {formatToday()}
          </span>
          <span className="rounded-lg border border-slate-100 bg-white px-2.5 py-1.5">
            Scope:{" "}
            <b className="font-semibold text-slate-600">
              {operational.scope_label}
            </b>
          </span>
        </div>
      </div>

      <span className="pointer-events-none absolute -right-8 -top-12 h-28 w-28 rounded-full border-[18px] border-white/60"/>
    </div>);
}
function PeriodCard({ period, onManage }) {
    if (!period) {
        return (<div className="rounded-xl border border-slate-100 bg-white p-4">
        <div className="flex h-full min-h-52 flex-col items-center justify-center text-center">
          <CalendarDaysIcon className="h-7 w-7 text-slate-300"/>
          <h3 className="mt-3 text-[14px] font-semibold text-slate-700">
            Periode akademik belum aktif
          </h3>
          <p className="mt-1 max-w-xs text-[12px] leading-4 text-slate-400">
            Aktifkan periode untuk menentukan tahun
            ajar, semester, dan hari belajar.
          </p>
          <button type="button" onClick={onManage} className="ui-toolbar-button mt-4">
            Atur Periode
          </button>
        </div>
      </div>);
    }
    return (<div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-[#ef4d45]">
            <CalendarDaysIcon className="h-[18px] w-[18px]"/>
          </span>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Periode Akademik Aktif
            </p>
            <h3 className="mt-1 text-[16px] font-semibold text-slate-800">
              {period.tahun_ajaran} · Semester{" "}
              {period.semester}
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-400">
              {period.nama_periode ||
            "Periode berjalan"}
            </p>
          </div>
        </div>

        <button type="button" onClick={onManage} className="ui-action-button">
          Atur
          <ChevronRightIcon className="h-3.5 w-3.5"/>
        </button>
      </div>

      <div className="p-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-lg bg-slate-50/70 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Mulai
            </p>
            <p className="mt-1 text-[13px] font-semibold text-slate-700">
              {formatDate(period.tanggal_mulai)}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50/70 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Selesai
            </p>
            <p className="mt-1 text-[13px] font-semibold text-slate-700">
              {formatDate(period.tanggal_selesai)}
            </p>
          </div>

          <div className="rounded-lg bg-slate-50/70 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Hari Belajar
            </p>
            <p className="mt-1 text-[13px] font-semibold text-slate-700">
              {period.total_learning_days} hari
            </p>
          </div>

          <div className="rounded-lg bg-slate-50/70 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Tersisa
            </p>
            <p className="mt-1 text-[13px] font-semibold text-emerald-600">
              {period.remaining_learning_days} hari
            </p>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] font-medium text-slate-500">
              Progres hari belajar
            </span>
            <span className="text-[12px] font-semibold text-slate-600">
              {period.elapsed_learning_days}/
              {period.total_learning_days} ·{" "}
              {period.progress_percent}%
            </span>
          </div>

          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-[#ef4d45] transition-[width] duration-500" style={{
            width: `${period.progress_percent}%`,
        }}/>
          </div>
        </div>
      </div>
    </div>);
}
function CurriculumCard({ curriculum, onChange, }) {
    return (<div className="flex h-full flex-col overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-[#ef4d45]">
            <BookOpenIcon className="h-[18px] w-[18px]"/>
          </span>

          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Kurikulum Aktif
            </p>
            <h3 className="mt-1 text-[16px] font-semibold text-slate-800">
              {curriculum?.nama_kurikulum ||
            "Belum ada kurikulum aktif"}
            </h3>
            <p className="mt-0.5 text-[12px] text-slate-400">
              {curriculum?.tahun_ajaran ||
            "Tahun ajaran belum ditentukan"}
            </p>
          </div>
        </div>

        <span className="rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-600">
          Terpilih
        </span>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="min-h-12 text-[12px] leading-5 text-slate-500">
          {curriculum?.deskripsi ||
            "Pilih kurikulum aktif agar kelas dan indikator pembelajaran memiliki acuan yang konsisten."}
        </p>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Mata Pelajaran
            </p>
            <p className="mt-1 text-[15px] font-semibold text-slate-700">
              {curriculum?.mata_pelajaran?.length ?? 0}
            </p>
          </div>

          <div className="rounded-lg border border-slate-100 bg-slate-50/60 px-3 py-2.5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              Indikator
            </p>
            <p className="mt-1 text-[15px] font-semibold text-slate-700">
              {curriculum?.indikator_ids?.length ?? 0}
            </p>
          </div>
        </div>

        <div className="mt-auto pt-4">
          <button type="button" onClick={onChange} className="flex h-9 w-full items-center justify-between rounded-lg border border-slate-100 bg-slate-50/60 px-3 text-[12px] font-semibold text-slate-600 transition hover:border-red-100 hover:bg-red-50/50 hover:text-[#ef4d45]">
            Ganti / kelola kurikulum
            <ArrowRightIcon className="h-3.5 w-3.5"/>
          </button>
        </div>
      </div>
    </div>);
}
function AnnouncementCard({ announcements, onOpen, }) {
    return (<div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
            <MegaphoneIcon className="h-4 w-4"/>
          </span>

          <div>
            <h3 className="text-[13px] font-semibold text-slate-700">
              Kalender & Pengumuman
            </h3>
            <p className="mt-0.5 text-[11px] text-slate-400">
              Informasi terdekat dari hari ini
            </p>
          </div>
        </div>

        <button type="button" onClick={onOpen} className="ui-action-button">
          Lihat
          <ChevronRightIcon className="h-3.5 w-3.5"/>
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {announcements.length ? (announcements.map((item) => {
            const tone = announcementTone(item.tipe);
            return (<div key={`${item.id}-${item.tanggal_terbit}`} className="flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50/50">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-lg border border-slate-100 bg-slate-50/70">
                  <span className="text-[17px] font-semibold leading-none text-slate-700">
                    {formatDate(item.tanggal_terbit, {
                    day: "2-digit",
                })}
                  </span>
                  <span className="mt-1 text-[10px] font-semibold uppercase text-slate-400">
                    {formatDate(item.tanggal_terbit, {
                    month: "short",
                })}
                  </span>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="line-clamp-1 text-[13px] font-semibold text-slate-700">
                      {item.judul}
                    </p>
                    <span className={`shrink-0 rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${tone.badge}`}>
                      {item.tipe}
                    </span>
                  </div>

                  <p className="mt-1 line-clamp-2 text-[11px] leading-4 text-slate-400">
                    {item.isi || "Tanpa deskripsi"}
                  </p>
                </div>
              </div>);
        })) : (<div className="px-4 py-10 text-center">
            <CalendarDaysIcon className="mx-auto h-6 w-6 text-slate-300"/>
            <p className="mt-2 text-[12px] font-medium text-slate-500">
              Belum ada pengumuman mendatang
            </p>
          </div>)}
      </div>
    </div>);
}
function ReminderIcon({ state }) {
    if (state === "complete") {
        return (<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
        <CheckCircleIcon className="h-[18px] w-[18px]"/>
      </span>);
    }
    if (state === "not-required") {
        return (<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-400">
        <InformationCircleIcon className="h-[18px] w-[18px]"/>
      </span>);
    }
    if (state === "error") {
        return (<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-rose-50 text-rose-600">
        <ExclamationCircleIcon className="h-[18px] w-[18px]"/>
      </span>);
    }
    return (<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
      <ExclamationTriangleIcon className="h-[18px] w-[18px]"/>
    </span>);
}
function ReminderCard({ item, icon: Icon, onOpen, onCheck, checking, }) {
    const complete = item?.state === "complete";
    const unchecked = item?.state === "unchecked";
    return (<div className={`rounded-xl border p-3.5 ${complete
            ? "border-emerald-100 bg-emerald-50/20"
            : "border-slate-100 bg-white"}`}>
      <div className="flex items-start gap-3">
        {item ? (<ReminderIcon state={item.state}/>) : (<span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-300">
            <ArrowPathIcon className="h-[18px] w-[18px] animate-spin"/>
          </span>)}

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-slate-400"/>
                <h4 className="text-[13px] font-semibold text-slate-700">
                  {item?.label || "Memeriksa..."}
                </h4>
              </div>

              <p className="mt-1.5 min-h-8 text-[11px] leading-4 text-slate-400">
                {item?.detail ||
            "Mengambil status pengisian hari ini."}
              </p>
            </div>

            {item &&
            item.state !==
                "not-required" &&
            !unchecked && (<span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${complete
                ? "border-emerald-100 bg-emerald-50 text-emerald-600"
                : item.state === "error"
                    ? "border-rose-100 bg-rose-50 text-rose-600"
                    : "border-amber-100 bg-amber-50 text-amber-600"}`}>
                  {complete
                ? "Selesai"
                : item.state === "error"
                    ? "Gagal cek"
                    : `${item.missing} belum`}
                </span>)}
          </div>

          <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-2.5">
            {unchecked ? (<button type="button" onClick={onCheck} disabled={checking} className="text-[11px] font-semibold text-[#ef4d45] hover:underline disabled:opacity-50">
                {checking
                ? "Memeriksa..."
                : "Periksa sekarang"}
              </button>) : (<span className="text-[11px] text-slate-400">
                {item &&
                item.expected > 0 &&
                item.state !==
                    "not-required"
                ? `${item.completed}/${item.expected} siswa`
                : "Status hari ini"}
              </span>)}

            <button type="button" onClick={onOpen} className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-[#ef4d45]">
              Buka modul
              <ChevronRightIcon className="h-3 w-3"/>
            </button>
          </div>
        </div>
      </div>
    </div>);
}
function ReminderSection({ reminders, loading, forceCommunication, onForceCommunication, onOpen, checkedAt, }) {
    const byId = new Map((reminders ?? []).map((item) => [
        item.id,
        item,
    ]));
    const completeCount = (reminders ?? []).filter((item) => item.state === "complete" ||
        item.state === "not-required").length;
    return (<div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="h-4 w-4 text-slate-400"/>
            <h3 className="text-[13px] font-semibold text-slate-700">
              Checklist Operasional Hari Ini
            </h3>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            Pengingat pengisian data rutin kelas
            aktif.
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400">
          {checkedAt && (<span>
              Dicek {formatTime(checkedAt)}
            </span>)}
          <span className="rounded-full border border-slate-100 bg-slate-50 px-2 py-0.5 font-semibold text-slate-500">
            {loading
            ? "Memeriksa"
            : `${completeCount}/3 aman`}
          </span>
        </div>
      </div>

      <div className="grid gap-2 p-3 md:grid-cols-3">
        <ReminderCard item={byId.get("attendance")} icon={CheckCircleIcon} onOpen={() => onOpen("presensi")}/>
        <ReminderCard item={byId.get("activity")} icon={SunIcon} onOpen={() => onOpen("aktivitas")}/>
        <ReminderCard item={byId.get("communication")} icon={BookOpenIcon} onOpen={() => onOpen("penghubung")} onCheck={onForceCommunication} checking={forceCommunication && loading}/>
      </div>
    </div>);
}
function PaymentTable({ payments, onOpen, loading = false, error = false, }) {
    return (<div className="ui-table-card overflow-hidden">
      <div className="flex items-start justify-between gap-3 border-b border-slate-100 px-3 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <BanknotesIcon className="h-4 w-4 text-slate-400"/>
            <h3 className="text-[13px] font-semibold text-slate-700">
              Transaksi Pembayaran Terakhir
            </h3>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-400">
            Pemasukan terbaru dari modul keuangan.
          </p>
        </div>

        <button type="button" onClick={onOpen} className="ui-action-button">
          Lihat Semua
          <ArrowRightIcon className="h-3.5 w-3.5"/>
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px]">
          <thead className="bg-slate-50/60">
            <tr className="border-b border-slate-100">
              {[
            "Transaksi",
            "Siswa / Pembayar",
            "Jenis Pembayaran",
            "Jumlah",
            "Tanggal",
            "Status",
        ].map((label) => (<th key={label} className="px-3 py-2.5 text-left text-[12px] font-semibold uppercase tracking-wide text-slate-400">
                  {label}
                </th>))}
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {loading ? (Array.from({ length: 4 }, (_, index) => (<tr key={index}>
                  {Array.from({ length: 6 }, (_, cell) => (<td key={cell} className="px-3 py-3">
                        <div className="h-3 animate-pulse rounded bg-slate-100"/>
                      </td>))}
                </tr>))) : payments.length ? (payments.map((item) => (<tr key={`${item.id}-${item.nomor_transaksi}`} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2.5">
                    <p className="font-mono text-[12px] font-medium text-slate-600">
                      {item.nomor_transaksi}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {item.invoice_number ||
                "Tanpa invoice"}
                    </p>
                  </td>

                  <td className="px-3 py-2.5">
                    <p className="text-[13px] font-semibold text-slate-700">
                      {item.student_name}
                    </p>
                    {item.student_nisn && (<p className="mt-0.5 text-[10px] text-slate-400">
                        NIS {item.student_nisn}
                      </p>)}
                  </td>

                  <td className="px-3 py-2.5">
                    <p className="text-[12px] font-medium text-slate-600">
                      {item.category}
                    </p>
                    {item.description && (<p className="mt-0.5 max-w-60 truncate text-[10px] text-slate-400">
                        {item.description}
                      </p>)}
                  </td>

                  <td className="px-3 py-2.5 text-[13px] font-semibold text-emerald-600">
                    {formatCurrency(item.amount)}
                  </td>

                  <td className="px-3 py-2.5 text-[12px] text-slate-500">
                    {formatDate(item.date)}
                  </td>

                  <td className="px-3 py-2.5">
                    <span className="inline-flex items-center gap-1 rounded-full border border-emerald-100 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600">
                      <CheckCircleIcon className="h-3 w-3"/>
                      Diterima
                    </span>
                  </td>
                </tr>))) : (<tr>
                <td colSpan={6} className="px-4 py-10 text-center">
                  {error ? (<ExclamationCircleIcon className="mx-auto h-6 w-6 text-rose-300"/>) : (<BanknotesIcon className="mx-auto h-6 w-6 text-slate-300"/>)}
                  <p className={`mt-2 text-[12px] font-medium ${error
                ? "text-rose-500"
                : "text-slate-500"}`}>
                    {error
                ? "Transaksi pembayaran gagal dimuat"
                : "Belum ada transaksi pembayaran"}
                  </p>
                </td>
              </tr>)}
          </tbody>
        </table>
      </div>
    </div>);
}
function CoreSkeleton() {
    return (<div className="space-y-8">
      <div className="space-y-3">
        <div className="h-10 w-56 animate-pulse rounded-lg bg-slate-100"/>
        <div className="grid gap-2 md:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (<div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100"/>))}
        </div>
        <div className="h-16 animate-pulse rounded-xl bg-slate-100"/>
      </div>

      <div className="space-y-3">
        <div className="h-10 w-44 animate-pulse rounded-lg bg-slate-100"/>
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (<div key={index} className="h-32 animate-pulse rounded-xl bg-slate-100"/>))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-slate-100"/>
        <div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
          <div className="h-64 animate-pulse rounded-xl bg-slate-100"/>
          <div className="h-64 animate-pulse rounded-xl bg-slate-100"/>
        </div>
      </div>
    </div>);
}
export default function DashboardPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [forceCommunication, setForceCommunication] = useState(false);
    const statsReady = useDelayedReady(450);
    const financeReady = useDelayedReady(950);
    const communicationReady = useDelayedReady(1600);
    const displayName = getDisplayName(user);
    const userNik = getUserNik(user);
    const contextQuery = useQuery({
        queryKey: [
            "dashboard",
            "context",
            userNik,
        ],
        queryFn: ({ signal }) => fetchDashboardContext(userNik, signal),
        staleTime: 5 * 60000,
        gcTime: 15 * 60000,
        refetchOnWindowFocus: false,
    });
    const operational = contextQuery.data?.operational;
    const priorityQuery = useQuery({
        queryKey: [
            "dashboard",
            "priority-reminders",
            operational?.today,
            operational?.scope_label,
        ],
        enabled: Boolean(operational),
        queryFn: ({ signal }) => fetchDashboardPriorityReminders(operational, signal),
        staleTime: 30000,
        gcTime: 5 * 60000,
        refetchOnWindowFocus: false,
    });
    const studentQuery = useQuery({
        queryKey: [
            "dashboard",
            "student-stats",
        ],
        enabled: statsReady,
        queryFn: ({ signal }) => fetchDashboardStudentStats(signal),
        staleTime: 5 * 60000,
        gcTime: 20 * 60000,
        refetchOnWindowFocus: false,
    });
    const staffQuery = useQuery({
        queryKey: [
            "dashboard",
            "staff-stats",
        ],
        enabled: statsReady,
        queryFn: ({ signal }) => fetchDashboardStaffStats(signal),
        staleTime: 2 * 60000,
        gcTime: 15 * 60000,
        refetchOnWindowFocus: false,
    });
    const paymentQuery = useQuery({
        queryKey: [
            "dashboard",
            "recent-payments",
        ],
        enabled: financeReady,
        queryFn: ({ signal }) => fetchDashboardRecentPayments(signal),
        staleTime: 60000,
        gcTime: 10 * 60000,
        refetchOnWindowFocus: false,
    });
    const communicationExpected = operational?.expected_student_ids
        ?.length ?? 0;
    const autoCommunication = Boolean(operational?.teacher_scope) ||
        communicationExpected <= 12;
    const communicationEnabled = Boolean(operational?.school_day &&
        communicationReady &&
        (autoCommunication ||
            forceCommunication));
    const communicationQuery = useQuery({
        queryKey: [
            "dashboard",
            "communication-reminder",
            operational?.today,
            operational?.scope_label,
            forceCommunication,
        ],
        enabled: communicationEnabled,
        queryFn: ({ signal }) => fetchDashboardCommunicationReminder(operational, {
            signal,
            force: forceCommunication,
        }),
        staleTime: 30000,
        gcTime: 5 * 60000,
        refetchOnWindowFocus: false,
    });
    const communicationItem = useMemo(() => {
        if (!operational)
            return null;
        if (!operational.school_day) {
            return {
                id: "communication",
                label: "Buku Penghubung",
                state: "not-required",
                completed: 0,
                expected: communicationExpected,
                missing: 0,
                detail: "Tidak perlu diisi pada hari non-efektif.",
            };
        }
        if (communicationQuery.data) {
            return communicationQuery.data;
        }
        if (communicationReady &&
            !autoCommunication &&
            !forceCommunication) {
            return {
                id: "communication",
                label: "Buku Penghubung",
                state: "unchecked",
                completed: 0,
                expected: communicationExpected,
                missing: 0,
                detail: "Pengecekan massal ditunda agar dashboard tetap ringan.",
            };
        }
        return null;
    }, [
        operational,
        communicationExpected,
        communicationQuery.data,
        communicationReady,
        autoCommunication,
        forceCommunication,
    ]);
    const reminderItems = useMemo(() => [
        ...(priorityQuery.data?.items ??
            []),
        ...(communicationItem
            ? [communicationItem]
            : []),
    ], [
        priorityQuery.data?.items,
        communicationItem,
    ]);
    const stats = useMemo(() => {
        const students = studentQuery.data;
        const staff = staffQuery.data;
        return [
            {
                icon: AcademicCapIcon,
                label: "Total Siswa",
                value: students?.total ??
                    (studentQuery.isError
                        ? "—"
                        : "…"),
                detail: students
                    ? `${students.left} pindah / keluar`
                    : studentQuery.isError
                        ? "Gagal dimuat"
                        : "Memuat data",
                tone: "slate",
            },
            {
                icon: UsersIcon,
                label: "Masih di Lembaga",
                value: students?.active ??
                    (studentQuery.isError
                        ? "—"
                        : "…"),
                detail: students?.total
                    ? `${Math.round((students.active /
                        students.total) *
                        100)}% dari total`
                    : studentQuery.isError
                        ? "Gagal dimuat"
                        : "Memuat data",
                tone: "green",
            },
            {
                icon: CheckCircleIcon,
                label: "Siswa Lulus",
                value: students?.graduated ??
                    (studentQuery.isError
                        ? "—"
                        : "…"),
                detail: students
                    ? "Status lulus / tamat"
                    : studentQuery.isError
                        ? "Gagal dimuat"
                        : "Memuat data",
                tone: "red",
            },
            {
                icon: UserGroupIcon,
                label: "Akun Staff & Guru Aktif",
                value: staff?.active ??
                    (staffQuery.isError
                        ? "—"
                        : "…"),
                detail: staff
                    ? `${staff.teachers} guru · ${staff.staff} staff`
                    : staffQuery.isError
                        ? "Gagal dimuat"
                        : "Memuat data",
                tone: "blue",
            },
        ];
    }, [
        studentQuery.data,
        studentQuery.isError,
        staffQuery.data,
        staffQuery.isError,
    ]);
    const isRefreshing = contextQuery.isFetching ||
        priorityQuery.isFetching ||
        studentQuery.isFetching ||
        staffQuery.isFetching ||
        paymentQuery.isFetching ||
        communicationQuery.isFetching;
    const refreshAll = async () => {
        setForceCommunication(false);
        const jobs = [
            contextQuery.refetch(),
            priorityQuery.refetch(),
            studentQuery.refetch(),
            staffQuery.refetch(),
            paymentQuery.refetch(),
        ];
        if (communicationEnabled) {
            jobs.push(communicationQuery.refetch());
        }
        await Promise.allSettled(jobs);
    };
    return (<div className="space-y-8 pb-4 animate-in fade-in duration-300">
      <SectionHeader icon={Squares2X2Icon} title={`Selamat datang, ${displayName}`} description="Ringkasan operasional sekolah, periode akademik, agenda, dan pekerjaan yang perlu diselesaikan hari ini." actions={<>
            <span className="hidden text-[12px] text-slate-400 sm:inline">
              {formatToday()}
            </span>
            <button type="button" onClick={refreshAll} disabled={isRefreshing} className="ui-toolbar-button">
              <ArrowPathIcon className={`h-4 w-4 ${isRefreshing
                ? "animate-spin"
                : ""}`}/>
              Muat Ulang
            </button>
          </>}/>

      {contextQuery.data?.warnings
            ?.length > 0 && (<div className="flex items-start gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5">
          <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-amber-500"/>
          <p className="text-[12px] leading-4 text-amber-700">
            Sebagian data belum dapat dimuat:{" "}
            {contextQuery.data.warnings.join(", ")}
            . Bagian lain tetap ditampilkan.
          </p>
        </div>)}

      <SectionGroup eyebrow="Prioritas" title="Yang Perlu Diselesaikan Hari Ini" description="Pekerjaan operasional wajib dimuat lebih dulu agar tidak terlewat.">
        {contextQuery.isPending ? (<SectionLoading rows={2}/>) : contextQuery.isError ||
            !operational ? (<div className="rounded-xl border border-rose-100 bg-rose-50/60 p-4">
            <div className="flex items-start gap-3">
              <ExclamationCircleIcon className="h-5 w-5 shrink-0 text-rose-500"/>
              <div>
                <h3 className="text-[13px] font-semibold text-rose-700">
                  Status operasional gagal dimuat
                </h3>
                <p className="mt-1 text-[12px] text-rose-500">
                  Coba muat ulang konteks kelas dan periode.
                </p>
                <button type="button" onClick={() => contextQuery.refetch()} className="ui-toolbar-button mt-3">
                  Coba Lagi
                </button>
              </div>
            </div>
          </div>) : (<>
            <ReminderSection reminders={reminderItems} loading={priorityQuery.isPending ||
                priorityQuery.isFetching ||
                communicationQuery.isFetching} checkedAt={priorityQuery.data
                ?.checked_at} forceCommunication={forceCommunication} onForceCommunication={() => setForceCommunication(true)} onOpen={(tab) => navigate(`/kegiatan?tab=${tab}`)}/>

            {/* <OperationalBanner operational={operational}/> */}
          </>)}
      </SectionGroup>

      <SectionGroup eyebrow="Ringkasan" title="Kondisi Sekolah" description="Statistik siswa dan tenaga aktif dimuat setelah bagian prioritas tampil.">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {stats.map((item) => (<StatCard key={item.label} {...item}/>))}
        </div>
      </SectionGroup>

      <SectionGroup eyebrow="Akademik" title="Periode & Kurikulum Aktif" description="Konteks akademik yang sedang berlaku untuk kelas, indikator, dan kegiatan pembelajaran.">
        {contextQuery.isPending ? (<div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <SectionLoading />
            <SectionLoading />
          </div>) : contextQuery.data ? (<div className="grid gap-4 xl:grid-cols-[1.55fr_1fr]">
            <PeriodCard period={contextQuery.data.period} onManage={() => navigate("/pengaturan?tab=period")}/>

            <CurriculumCard curriculum={contextQuery.data
                .curriculum} onChange={() => navigate("/administrasi?tab=kurikulum")}/>
          </div>) : (<SectionLoading />)}
      </SectionGroup>

      <SectionGroup eyebrow="Agenda" title="Kalender & Pengumuman Terdekat" description="Informasi sekolah yang perlu diperhatikan dalam beberapa hari ke depan.">
        {contextQuery.isPending ? (<SectionLoading rows={2}/>) : (<AnnouncementCard announcements={contextQuery.data
                ?.announcements ?? []} onOpen={() => navigate("/administrasi?tab=pengumuman")}/>)}
      </SectionGroup>

      <SectionGroup eyebrow="Keuangan" title="Pembayaran Terbaru" description="Transaksi pembayaran dimuat belakangan agar tidak menghambat prioritas operasional.">
        <PaymentTable payments={paymentQuery.data ?? []} loading={!financeReady ||
            paymentQuery.isPending} error={paymentQuery.isError} onOpen={() => navigate("/keuangan?tab=history")}/>
      </SectionGroup>
    </div>);
}
