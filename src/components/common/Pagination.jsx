import React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  onLimitChange,
  className = ""
}) {
  
  if (totalItems === 0) return null;

  // Logic Generate Page Numbers (Sliding Window)
  const getPaginationGroup = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  return (
    <div className={`border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 ${className}`}>
      
      {/* 1. Selector Limit per Page (Optional if onLimitChange provided) */}
      {onLimitChange && (
        <div className="flex items-center gap-2 text-sm text-slate-600">
          <span>Tampilkan</span>
          <select
            value={itemsPerPage}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-[#e94640] focus:border-[#e94640] block w-16 p-1.5 cursor-pointer outline-none transition-all shadow-sm"
          >
            {[5, 10, 25, 50, 100].map((val) => (
              <option key={val} value={val}>{val}</option>
            ))}
          </select>
          <span>data</span>
        </div>
      )}

      {/* 2. Info Text */}
      <span className="text-sm text-slate-500 hidden md:block">
        Menampilkan <span className="font-semibold text-slate-700">{Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}</span> - <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, totalItems)}</span> dari <span className="font-semibold text-slate-700">{totalItems}</span> data
      </span>

      {/* 3. Navigation Buttons */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </button>

        <div className="hidden sm:flex gap-1">
          {getPaginationGroup().map((pageNumber) => (
            <button
              key={pageNumber}
              onClick={() => onPageChange(pageNumber)}
              className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all shadow-sm border ${
                currentPage === pageNumber
                  ? "bg-[#e94640] border-[#e94640] text-white"
                  : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              {pageNumber}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}