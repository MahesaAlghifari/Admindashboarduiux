import * as React from "react";
import {
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export function SectionHeader({icon:Icon,title,description,actions,className=""}){return <div className={`flex flex-col my-2 gap-4 sm:flex-row sm:items-start sm:justify-between ${className}`}><div className="flex min-w-0 items-start gap-3">{Icon&&<span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50 text-[#ef4d45]"><Icon className="h-6 w-6"/></span>}<div><h1 className="text-xl font-semibold text-slate-800">{title}</h1>{description&&<p className="max-w-2xl text-[12px] leading-5 text-slate-400">{description}</p>}</div></div>{actions&&<div className="flex flex-wrap items-center gap-2 self-start">{actions}</div>}</div>;}


export function InfoPopup({ title = "Ketentuan", children, buttonLabel = "Ketentuan" }) {
  const [open, setOpen] = React.useState(false);
  const titleId = React.useId();

  React.useEffect(() => {
    if (!open) return undefined;
    const closeOnEscape = (event) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-200 hover:text-slate-800"
      >
        <InformationCircleIcon className="h-4 w-4" />
        {buttonLabel}
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]" onMouseDown={() => setOpen(false)}>
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            onMouseDown={(event) => event.stopPropagation()}
            className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl shadow-slate-950/20"
          >
            <header className="flex items-center justify-between gap-4 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                  <InformationCircleIcon className="h-5 w-5" />
                </span>
                <h2 id={titleId} className="text-base font-semibold text-slate-900">{title}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700" aria-label="Tutup popup">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </header>
            <div className="border-t border-slate-100 px-5 py-5 text-sm leading-6 text-slate-600">{children}</div>
            <footer className="flex justify-end bg-slate-50 px-5 py-3">
              <button type="button" onClick={() => setOpen(false)} className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">Mengerti</button>
            </footer>
          </section>
        </div>
      )}
    </>
  );
}

export function ModuleTabs({ items, activeId, onChange, onPreload }) {
  return (
    <div className="overflow-x-auto rounded-xl bg-slate-100 p-1 no-scrollbar">
      <div className="flex min-w-max gap-1 sm:min-w-full">
        {items.map((item) => {
          const Icon = item.Icon;
          const active = activeId === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              onMouseEnter={() => onPreload?.(item.id)}
              onFocus={() => onPreload?.(item.id)}
              className={`flex min-w-[132px] flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${active ? "bg-white text-[#e94640] shadow-sm" : "text-slate-500 hover:bg-white/60 hover:text-slate-800"}`}
            >
              {Icon && <Icon className="h-4 w-4 shrink-0" />}
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
