export default function TabNavigation({ tabs, activeTab, onChange }) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <div
        role="tablist"
        aria-label="Navigasi Laporan dan Analisis"
        className="flex overflow-x-auto no-scrollbar"
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`${tab.label}. ${tab.desc || ""}`.trim()}
              onClick={() => onChange(tab.id)}
              className={`relative flex min-w-40 flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 text-xs font-semibold transition-colors ${
                active
                  ? "border-[#e94640] text-[#e94640]"
                  : "border-transparent text-slate-500 hover:border-slate-200 hover:bg-slate-50/60 hover:text-slate-700"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
