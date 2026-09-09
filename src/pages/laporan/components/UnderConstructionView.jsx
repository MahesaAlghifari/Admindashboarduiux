import {
  RocketLaunchIcon,
  BellAlertIcon,
  WrenchScrewdriverIcon
} from "@heroicons/react/24/outline";

export default function UnderConstructionView({
  title,
  desc
}) {
  return (
    <div
      className="
        flex flex-col items-center
        justify-center
        min-h-[500px]
        text-center
        bg-white
        border border-dashed border-slate-300
        rounded-2xl
        p-10
      "
    >

      {/* ICON */}
      <div
        className="
          relative
          w-24 h-24
          rounded-full
          bg-slate-50
          flex items-center justify-center
          mb-7
        "
      >

        <div
          className="
            absolute inset-0
            rounded-full
            bg-blue-100
            animate-ping
            opacity-20
          "
        />

        <RocketLaunchIcon
          className="
            w-11 h-11
            text-slate-400
          "
        />
      </div>

      {/* TITLE */}
      <h2
        className="
          text-3xl
          font-black
          tracking-tight
          text-slate-800
          mb-3
        "
      >
        Fitur {title} Segera Hadir
      </h2>

      {/* DESC */}
      <p
        className="
          max-w-2xl
          text-slate-500
          leading-relaxed
          text-[15px]
          mb-10
        "
      >
        Modul{" "}
        <span className="font-semibold text-slate-700">
          {desc}
        </span>{" "}
        sedang dalam tahap pengembangan oleh tim engineering.
        Kami sedang menyiapkan pengalaman terbaik agar fitur
        ini stabil, cepat, dan nyaman digunakan.
      </p>

      {/* ACTION */}
      <div className="flex items-center gap-4">

        <button
          className="
            px-6 py-3
            rounded-xl
            bg-slate-900
            text-white
            text-sm
            font-bold
            hover:bg-slate-800
            transition-all
            shadow-lg shadow-slate-200
          "
        >
          Kembali ke Dashboard
        </button>

        <button
          className="
            flex items-center gap-2
            px-6 py-3
            rounded-xl
            bg-white
            border border-slate-200
            text-slate-700
            text-sm
            font-semibold
            hover:bg-slate-50
            transition-all
          "
        >
          <BellAlertIcon className="w-4 h-4" />

          Beritahu Saya
        </button>
      </div>

      {/* STATUS */}
      <div
        className="
          mt-14
          flex items-center gap-2
          px-4 py-2
          rounded-full
          bg-slate-50
          border border-slate-100
          text-xs
          text-slate-400
        "
      >

        <WrenchScrewdriverIcon className="w-3 h-3" />

        <span>
          Status: Development (v1.0.0-beta)
        </span>
      </div>
    </div>
  );
}