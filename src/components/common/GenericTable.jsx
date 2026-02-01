import React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserCircleIcon,
  ArchiveBoxXMarkIcon // Icon alternatif jika data kosong
} from "@heroicons/react/24/outline";

export default function GenericTable({
  columns = [],
  data = [],
  isLoading = false,
  pagination = null, // Struktur prop: { currentPage, totalPages, totalItems, itemsPerPage, onPageChange, onLimitChange }
}) {

  // --- 1. LOGIC RENDER CELL DINAMIS ---
  // Fungsi ini menentukan apa yang harus ditampilkan di dalam <td>
  const renderCell = (item, column) => {
    // A. Jika ada fungsi render khusus (misal: tombol aksi, badge warna, format tanggal custom)
    if (column.render) {
      return column.render(item);
    }
    
    // B. Jika accessor adalah fungsi (misal: (row) => row.pribadi.nama)
    if (typeof column.accessor === 'function') {
      return column.accessor(item);
    }

    // C. Jika accessor adalah string (misal: "nip" atau "pribadi.nama")
    // Mendukung nested object key (dot notation)
    if (typeof column.accessor === 'string') {
      return column.accessor.split('.').reduce((obj, key) => obj?.[key], item) || "-";
    }

    return "-";
  };

  // --- 2. LOGIC PAGINATION GROUP ---
  // Membuat array halaman [1, 2, 3, 4, 5] dengan logic sliding window
  const getPaginationGroup = () => {
    if (!pagination) return [];
    const { currentPage, totalPages } = pagination;
    
    // Tampilkan maksimal 5 tombol halaman
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

  // --- 3. RENDER COMPONENT ---
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col w-full">
      
      {/* A. BAGIAN TABEL */}
      <div className="overflow-x-auto flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-track-transparent">
        <table className="min-w-full divide-y divide-slate-100">
          
          {/* Header Tabel */}
          <thead className="bg-slate-50/80">
            <tr>
              {columns.map((col, idx) => (
                <th
                  key={idx}
                  className={`px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body Tabel */}
          <tbody className="divide-y divide-slate-100 bg-white">
            {/* KONDISI 1: LOADING */}
            {isLoading ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center justify-center animate-pulse">
                    <div className="h-8 w-8 bg-slate-200 rounded-full mb-2"></div>
                    <div className="h-4 w-32 bg-slate-200 rounded"></div>
                  </div>
                </td>
              </tr>
            ) : data.length > 0 ? (
              // KONDISI 2: ADA DATA
              data.map((item, rowIdx) => (
                <tr 
                  key={item.id || rowIdx} 
                  className="hover:bg-slate-50 transition-colors duration-200 group"
                >
                  {columns.map((col, colIdx) => (
                    <td 
                      key={colIdx} 
                      className={`px-6 py-4 text-sm ${col.tdClassName || 'text-slate-700'}`}
                    >
                      {renderCell(item, col)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              // KONDISI 3: DATA KOSONG
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center text-slate-400">
                  <div className="flex flex-col items-center">
                    <UserCircleIcon className="h-12 w-12 mb-2 opacity-50 text-slate-300" />
                    <p className="text-sm font-medium text-slate-500">Tidak ada data ditemukan.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* B. BAGIAN FOOTER PAGINATION (Hanya muncul jika props pagination ada & data > 0) */}
      {pagination && !isLoading && pagination.totalItems > 0 && (
        <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Kiri: Selector Jumlah Data per Halaman */}
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span>Tampilkan</span>
            <select
              value={pagination.itemsPerPage}
              onChange={(e) => pagination.onLimitChange(Number(e.target.value))}
              className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-[#e94640] focus:border-[#e94640] block w-16 p-1.5 cursor-pointer outline-none transition-all shadow-sm"
            >
              {[5, 10, 25, 50, 100].map((val) => (
                <option key={val} value={val}>{val}</option>
              ))}
            </select>
            <span>data</span>
          </div>

          {/* Tengah: Info Data (Mobile Hidden) */}
          <span className="text-sm text-slate-500 hidden md:block">
            Menampilkan <span className="font-semibold text-slate-700">{Math.min((pagination.currentPage - 1) * pagination.itemsPerPage + 1, pagination.totalItems)}</span> - <span className="font-semibold text-slate-700">{Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)}</span> dari <span className="font-semibold text-slate-700">{pagination.totalItems}</span> data
          </span>

          {/* Kanan: Tombol Navigasi */}
          <div className="flex items-center gap-1">
            {/* Tombol Previous */}
            <button
              onClick={() => pagination.onPageChange(Math.max(1, pagination.currentPage - 1))}
              disabled={pagination.currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>

            {/* Nomor Halaman */}
            <div className="hidden sm:flex gap-1">
              {getPaginationGroup().map((pageNumber) => (
                <button
                  key={pageNumber}
                  onClick={() => pagination.onPageChange(pageNumber)}
                  className={`px-3.5 py-1.5 text-sm font-medium rounded-lg transition-all shadow-sm border ${
                    pagination.currentPage === pageNumber
                      ? "bg-[#e94640] border-[#e94640] text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  {pageNumber}
                </button>
              ))}
            </div>

            {/* Tombol Next */}
            <button
              onClick={() => pagination.onPageChange(Math.min(pagination.totalPages, pagination.currentPage + 1))}
              disabled={pagination.currentPage === pagination.totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}