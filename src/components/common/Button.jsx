import React from "react";

export default function Button({
  children,
  onClick,
  type = "button",
  variant = "primary", // primary | secondary | danger | ghost
  className = "",
  icon,
  disabled = false,
  isLoading = false,
}) {
  // Base Styles
  const baseStyles = "inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100";

  // Variants
  const variants = {
    primary: "bg-[#e94640] text-white shadow-lg shadow-[#e94640]/20 hover:bg-[#d03935]",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-sm",
    danger: "bg-rose-50 text-rose-600 border border-rose-100 hover:bg-rose-100 hover:border-rose-200",
    ghost: "bg-transparent text-slate-500 hover:bg-slate-100 hover:text-slate-700",
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Loading...
        </>
      ) : (
        <>
          {icon && <span className="h-5 w-5">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}