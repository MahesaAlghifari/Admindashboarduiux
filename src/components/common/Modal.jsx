import React, { useEffect } from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  footer, 
  size = "max-w-4xl" // max-w-lg, max-w-2xl, max-w-4xl, etc.
}) {
  
  // Close on Escape key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div className={`relative flex flex-col w-full ${size} max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden ring-1 ring-slate-900/5 animate-in fade-in zoom-in-95 duration-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-800 tracking-tight">
            {title}
          </h2>
          <button 
            onClick={onClose} 
            className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all focus:outline-none"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 scrollbar-thin scrollbar-thumb-slate-200">
          {children}
        </div>

        {/* Footer (Optional) */}
        {footer && (
          <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4 shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}