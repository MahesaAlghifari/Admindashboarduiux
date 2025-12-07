import React from 'react';
import { Search, Plus } from 'lucide-react';

interface FilterOption {
  label: string;
  value: string;
  options: { label: string; value: string }[];
  onChange: (value: string) => void;
}

interface StandardToolbarProps {
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  onSearchClick?: () => void;
  searchPlaceholder?: string;
  filters?: FilterOption[];
  onAddClick?: () => void;
  addButtonText?: string;
  showAddButton?: boolean;
}

export function StandardToolbar({
  searchValue = '',
  onSearchChange,
  onSearchClick,
  searchPlaceholder = 'Cari...',
  filters = [],
  onAddClick,
  addButtonText = 'Tambah',
  showAddButton = true,
}: StandardToolbarProps) {
  return (
    <div className="flex flex-col lg:flex-row gap-4 mb-6">
      {/* Left Section - Search */}
      {onSearchChange && (
        <div className="relative flex-1 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#64748B]" />
            <input
              type="text"
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full pl-10 pr-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 focus:border-[#E94640]"
            />
          </div>
          <button
            onClick={onSearchClick}
            className="px-6 py-2.5 bg-[#E94640] text-white rounded-lg hover:bg-[#DA393C] transition-colors flex items-center gap-2 whitespace-nowrap"
          >
            <Search className="w-5 h-5" />
            <span className="hidden sm:inline">Search</span>
          </button>
        </div>
      )}

      {/* Middle Section - Filters */}
      {filters.length > 0 && (
        <div className="flex flex-wrap gap-3">
          {filters.map((filter, index) => (
            <select
              key={index}
              onChange={(e) => filter.onChange(e.target.value)}
              className="px-4 py-2.5 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 focus:border-[#E94640] bg-white text-[#334155]"
            >
              <option value="">{filter.label}</option>
              {filter.options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}

      {/* Right Section - Add Button */}
      {showAddButton && onAddClick && (
        <button
          onClick={onAddClick}
          className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 whitespace-nowrap"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">{addButtonText}</span>
        </button>
      )}
    </div>
  );
}