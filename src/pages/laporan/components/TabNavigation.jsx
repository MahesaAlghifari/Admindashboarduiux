export default function TabNavigation({
  tabs,
  activeTab,
  onChange
}) {
  return (
    <div
      className="
        bg-slate-50
        border-b border-slate-200
      "
    >

      <div className="flex overflow-x-auto">

        {tabs.map((tab) => {
          const Icon = tab.icon;

          const isActive =
            activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() =>
                onChange(tab.id)
              }
              className={`
                group relative flex-1
                min-w-[180px]
                px-6 py-5 text-left
                border-r border-slate-100
                transition-all
                ${
                  isActive
                    ? "bg-white"
                    : "hover:bg-white/50"
                }
              `}
            >

              {isActive && (
                <div className="absolute top-0 left-0 w-full h-[3px] bg-[#e94640]" />
              )}

              <div className="flex items-center gap-3 mb-1">

                <Icon
                  className={`
                    w-5 h-5
                    ${
                      isActive
                        ? "text-[#e94640]"
                        : "text-slate-400"
                    }
                  `}
                />

                <span
                  className={`
                    text-sm font-bold
                    ${
                      isActive
                        ? "text-slate-800"
                        : "text-slate-500"
                    }
                  `}
                >
                  {tab.label}
                </span>
              </div>

              <p className="text-[10px] text-slate-400">
                {tab.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}