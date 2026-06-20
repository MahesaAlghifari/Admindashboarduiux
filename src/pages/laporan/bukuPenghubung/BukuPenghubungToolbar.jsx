import { MagnifyingGlassIcon, PrinterIcon } from "@heroicons/react/24/outline";
import SelectBox from "../../../components/common/SelectBox"; 

export default function BukuPenghubungToolbar({
  filterKelas, setFilterKelas,
  filterMinggu, setFilterMinggu,
  search, setSearch,
  isSelectionMode, setIsSelectionMode,
  onExecutePrint,
  selectedCount,
  clearSelection
}) {
  return (
    <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto">
        <SelectBox
          options={["Minggu 1 - Jul 2026", "Minggu 2 - Jul 2026", "Minggu 3 - Jul 2026", "Minggu 4 - Jul 2026"]}
          value={filterMinggu}
          onChange={setFilterMinggu}
          label="Periode Minggu"
        />
        <SelectBox
          options={["Semua Kelas", "TK A", "TK B"]}
          value={filterKelas}
          onChange={setFilterKelas}
          label="Pilih Kelas"
        />
      </div>

      <div className="flex flex-wrap lg:flex-nowrap gap-3 w-full lg:w-auto">
        <div className="relative w-full lg:w-64">
          <input
            type="text"
            placeholder="Cari nama siswa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 bg-slate-50 text-sm font-medium rounded-xl outline-none focus:bg-white focus:border-[#e94640] transition-all"
          />
          <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
        </div>

        {isSelectionMode ? (
          <div className="flex gap-2 w-full lg:w-auto animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => {
                setIsSelectionMode(false);
                clearSelection();
              }}
              className="flex justify-center items-center gap-1 px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-xl shadow-sm transition-all"
            >
               Batal
            </button>
            <button
              onClick={onExecutePrint}
              className="flex justify-center items-center gap-2 px-5 py-2.5 bg-[#e94640] hover:bg-[#d63d38] text-white text-sm font-bold rounded-xl shadow-sm transition-all"
            >
              <PrinterIcon className="w-4 h-4" />
              Cetak Terpilih {selectedCount > 0 ? `(${selectedCount})` : ""}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsSelectionMode(true)}
            className="flex w-full lg:w-auto justify-center items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white text-sm font-bold rounded-xl shadow-sm transition-all animate-in fade-in"
          >
            <PrinterIcon className="w-4 h-4" />
            Cetak Laporan
          </button>
        )}
      </div>
    </div>
  );
}