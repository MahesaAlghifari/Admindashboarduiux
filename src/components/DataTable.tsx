import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Eye, Edit, Trash2 } from 'lucide-react';

interface Column {
  key: string;
  label: string;
  render?: (value: any, row: any, index: number) => React.ReactNode;
}

interface DataTableProps {
  columns: Column[];
  data: any[];
  onView?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (row: any) => void;
  showActions?: boolean;
  itemsPerPage?: number;
}

export function DataTable({
  columns,
  data,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  itemsPerPage = 10,
}: DataTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(itemsPerPage);

  const totalPages = Math.ceil(data.length / perPage);
  const startIndex = (currentPage - 1) * perPage;
  const endIndex = startIndex + perPage;
  const currentData = data.slice(startIndex, endIndex);

  const handlePrevious = () => {
    if (currentPage > 1) setCurrentPage(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) setCurrentPage(currentPage + 1);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      {/* Table Controls */}
      <div className="p-4 border-b border-[#E5E7EB] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-[#64748B] text-sm">Show</span>
          <select
            value={perPage}
            onChange={(e) => {
              setPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-3 py-1.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20"
          >
            <option value={10}>10</option>
            <option value={25}>25</option>
            <option value={50}>50</option>
          </select>
          <span className="text-[#64748B] text-sm">entries</span>
        </div>

        <div className="text-[#64748B] text-sm">
          Showing {startIndex + 1} to {Math.min(endIndex, data.length)} of {data.length} entries
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full">
          <thead className="bg-[#F6F7F9] border-b border-[#E5E7EB]">
            <tr>
              <th className="px-4 py-3 text-left text-[#0F172A] text-sm whitespace-nowrap">No</th>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 text-left text-[#0F172A] text-sm whitespace-nowrap">
                  {column.label}
                </th>
              ))}
              {showActions && <th className="px-4 py-3 text-left text-[#0F172A] text-sm whitespace-nowrap">Aksi</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {currentData.map((row, index) => (
              <tr key={index} className="hover:bg-[#F6F7F9]/50 transition-colors">
                <td className="px-4 py-3 text-[#334155] text-sm">{startIndex + index + 1}</td>
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-[#334155] text-sm whitespace-nowrap">
                    {column.render ? column.render(row[column.key], row, index) : row[column.key]}
                  </td>
                ))}
                {showActions && (
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {onView && (
                        <button
                          onClick={() => onView(row)}
                          className="p-2 text-[#3B82F6] hover:bg-[#3B82F6]/10 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      )}
                      {onEdit && (
                        <button
                          onClick={() => onEdit(row)}
                          className="p-2 text-[#F59E0B] hover:bg-[#F59E0B]/10 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(row)}
                          className="p-2 text-[#EF4444] hover:bg-[#EF4444]/10 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="p-4 border-t border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          onClick={handlePrevious}
          disabled={currentPage === 1}
          className="w-full sm:w-auto px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </button>

        <div className="flex items-center gap-2 flex-wrap justify-center">
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            let page;
            if (totalPages <= 5) {
              page = i + 1;
            } else if (currentPage <= 3) {
              page = i + 1;
            } else if (currentPage >= totalPages - 2) {
              page = totalPages - 4 + i;
            } else {
              page = currentPage - 2 + i;
            }
            return (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-10 h-10 rounded-lg transition-colors text-sm ${
                  currentPage === page
                    ? 'btn-gradient'
                    : 'border border-[#E5E7EB] hover:bg-[#F6F7F9]'
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        <button
          onClick={handleNext}
          disabled={currentPage === totalPages}
          className="w-full sm:w-auto px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors text-sm"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}