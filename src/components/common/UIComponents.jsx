import React from "react";

// --- 1. INPUT TEXT / NUMBER / DATE ---
export function Input({ 
  label, 
  value, 
  onChange, 
  type = "text", 
  placeholder, 
  icon,
  className = "" 
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-0.5">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#e94640] transition-colors">
            {icon}
          </div>
        )}
        <input
          type={type}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder || (label ? `Masukkan ${label}...` : "")}
          className={`w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all 
            focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 hover:bg-slate-100/50
            ${icon ? "pl-10 pr-4" : "px-4"}`}
        />
      </div>
    </div>
  );
}

// --- 2. TEXT AREA (MULTILINE) ---
export function TextArea({ label, value, onChange, placeholder, rows = 3 }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-0.5">
          {label}
        </label>
      )}
      <textarea
        rows={rows}
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || (label ? `Masukkan ${label}...` : "")}
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 hover:bg-slate-100/50 resize-none"
      />
    </div>
  );
}

// --- 3. SELECT / DROPDOWN ---
export function Select({ label, value, onChange, options = [], placeholder = "Pilih..." }) {
  return (
    <div className="flex flex-col gap-2">
      {label && (
        <label className="text-xs font-bold text-slate-500 uppercase tracking-wide ml-0.5">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 cursor-pointer hover:bg-slate-100/50"
        >
          <option value="" disabled>{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        {/* Custom Arrow Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}

// --- 4. ACTION BUTTON (SMALL ICON BTN) ---
export function ActionButton({ onClick, icon, colorClass, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`p-1.5 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95 ${colorClass || "text-slate-400 hover:text-slate-600 hover:bg-slate-100"}`}
    >
      {icon}
    </button>
  );
}