import {
  lazy,
  Suspense,
  useMemo,
  useState,
} from "react";
import {
  CalendarDaysIcon,
  UserIcon,
} from "@heroicons/react/24/outline";

const DailyClassActivityView = lazy(() =>
  import("./DailyClassActivityView")
);
const WeeklyStudentActivityView = lazy(() =>
  import("./WeeklyStudentActivityView")
);

const TYPES = [
  {
    id: "daily-class",
    label: "Per Kelas",
    title: "Laporan Aktivitas Harian Per Kelas",
    description:
      "Rekap aktivitas harian per kelas berdasarkan tanggal dan periode, lengkap dengan rencana, status dilakukan/tidak dilakukan, refleksi, barang yang dibawa, dan catatan guru.",
    icon: CalendarDaysIcon,
  },
  {
    id: "weekly-student",
    label: "Per Anak",
    title: "Laporan Aktivitas Mingguan Per Anak",
    description:
      "Lihat aktivitas Senin–Jumat setiap siswa dalam format 2 lembar, termasuk status dilakukan/tidak dilakukan, refleksi, barang yang dibawa, dan catatan guru.",
    icon: UserIcon,
  },
];

function TypeTabs({ value, onChange }) {
  return (
    <div className="max-w-full overflow-x-auto">
      <div className="inline-flex rounded-lg bg-slate-100 p-1">
        {TYPES.map((item) => {
          const Icon = item.icon;
          const active = value === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              className={`flex h-9 items-center gap-2 whitespace-nowrap rounded-md px-3 text-xs font-semibold transition sm:px-4 ${
                active
                  ? "bg-white text-slate-800 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ModeLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="flex items-center gap-2 text-[11px] text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#ef4d45]" />
        Memuat laporan aktivitas...
      </div>
    </div>
  );
}

export default function LaporanAktivitasView() {
  const [type, setType] = useState("daily-class");

  const active = useMemo(
    () =>
      TYPES.find((item) => item.id === type) ??
      TYPES[0],
    [type]
  );

  const ActiveIcon = active.icon;

  const typeTabs = (
    <TypeTabs value={type} onChange={setType} />
  );

  return (
    <div className="min-w-0 animate-in fade-in duration-300">
      <div className="flex min-w-0 items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-[#ef4d45]">
          <ActiveIcon className="h-6 w-6" />
        </span>

        <div className="min-w-0">
          <h1 className="text-lg font-semibold text-slate-900 sm:text-xl">
            {active.title}
          </h1>
          <p className="mt-1 max-w-2xl text-[11px] leading-5 text-slate-400">
            {active.description}
          </p>
        </div>
      </div>

      <div className="min-h-125 pt-5">
        <Suspense fallback={<ModeLoading />}>
          <div
            key={type}
            className="animate-in fade-in duration-300"
          >
            {type === "daily-class" ? (
              <DailyClassActivityView
                typeTabs={typeTabs}
              />
            ) : (
              <WeeklyStudentActivityView
                typeTabs={typeTabs}
              />
            )}
          </div>
        </Suspense>
      </div>
    </div>
  );
}
