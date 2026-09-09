import { useState } from "react";

const SearchEmployee = () => {
  const [keyword, setKeyword] = useState("");

  const handleSearch = () => {
    console.log("Search:", keyword);
  };

  return (
    <div className="flex items-center gap-3 w-full">
      {/* INPUT */}
      <input
        type="text"
        placeholder="Cari nama atau NIP karyawan..."
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-red-500"
      />

      {/* BUTTON */}
      <button
        onClick={handleSearch}
        className="flex items-center gap-2 px-6 py-3 bg-red-500 text-white
                   rounded-lg hover:bg-red-600 transition"
      >
        {/* ICON */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-5 h-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z"
          />
        </svg>
        <span>Search</span>
      </button>
    </div>
  );
};

export default SearchEmployee;
