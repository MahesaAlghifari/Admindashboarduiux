import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BanknotesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { fetchFinanceTransactions } from "../../../api/finance";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { DEMO_TRANSACTIONS } from "../finance-demo";
import {
  ActionNotice,
  DataSourceNotice,
  EmptyRow,
  FinanceTableCard,
  MetricStrip,
  formatDate,
  formatIDR,
  normalized,
  tableCellClass,
  tableHeadClass,
} from "../components/FinanceUI";

const isExpense = (item) => {
  const value = normalized(item.tipe_transaksi);
  return (
    value.includes("keluar") ||
    value.includes("pengeluaran") ||
    value.includes("expense")
  );
};

export default function ExpensesTab() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ["finance", "transactions"],
    queryFn: ({ signal }) => fetchFinanceTransactions({ signal }),
    staleTime: 60_000,
  });

  const demo = query.isError;
  const allItems = demo ? DEMO_TRANSACTIONS : query.data ?? [];
  const expenses = useMemo(
    () => allItems.filter(isExpense),
    [allItems]
  );

  const categories = useMemo(
    () =>
      [...new Set(expenses.map((item) => item.kategori).filter(Boolean))].sort(),
    [expenses]
  );

  const filtered = useMemo(() => {
    const q = normalized(deferredSearch);
    return expenses.filter(
      (item) =>
        (!q ||
          [item.deskripsi, item.kategori, item.nomor_transaksi].some(
            (value) => normalized(value).includes(q)
          )) &&
        (category === "all" || item.kategori === category)
    );
  }, [category, deferredSearch, expenses]);

  const total = expenses.reduce(
    (sum, item) => sum + Number(item.jumlah || 0),
    0
  );
  const largest =
    [...expenses].sort(
      (a, b) => Number(b.jumlah || 0) - Number(a.jumlah || 0)
    )[0] ?? null;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={BanknotesIcon}
        title="Pengeluaran"
        description="Pantau transaksi keluar dan kategorinya."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {expenses.length}
              </b>{" "}
              transaksi
            </span>
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className={`ui-toolbar-button ${
                filtersOpen ? "is-active" : ""
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Filter
            </button>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: "Catat Pengeluaran",
                  description:
                    "Endpoint POST /api/finance/transactions tersedia. Form input dapat disambungkan setelah tahap UI selesai.",
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c]"
            >
              <PlusIcon className="h-4 w-4" />
              Pengeluaran Baru
            </button>
          </>
        }
      />

      <DataSourceNotice
        demo={demo}
        loading={query.isFetching}
        onRetry={() => query.refetch()}
      />

      <MetricStrip
        items={[
          {
            label: "Total Pengeluaran",
            value: formatIDR(total),
            detail: `${expenses.length} transaksi`,
            tone: "red",
          },
          {
            label: "Kategori",
            value: String(categories.length),
            detail: "Kategori aktif",
          },
          {
            label: "Terbesar",
            value: largest ? formatIDR(largest.jumlah) : formatIDR(0),
            detail: largest?.kategori || "-",
            tone: "amber",
          },
        ]}
      />

      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="relative w-full xl:w-80">
            <MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Cari deskripsi atau kategori..."
              className="ui-compact-control w-full pl-8"
            />
          </div>

          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="ui-compact-control min-w-44"
          >
            <option value="all">Semua Kategori</option>
            {categories.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      <FinanceTableCard
        title="Daftar Pengeluaran"
        subtitle="Transaksi bertipe pengeluaran dari modul finance."
        meta={
          <>
            <b className="font-semibold text-slate-600">
              {filtered.length}
            </b>{" "}
            data
          </>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "Tanggal",
                  "No. Transaksi",
                  "Deskripsi",
                  "Kategori",
                  "Jumlah",
                ].map((label) => (
                  <th key={label} className={tableHeadClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className={tableCellClass}>
                      {formatDate(item.tanggal_transaksi)}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">
                      {item.nomor_transaksi || item.id}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-medium text-slate-700">
                      {item.deskripsi || "-"}
                    </td>
                    <td className={tableCellClass}>
                      {item.kategori || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-semibold text-rose-600">
                      {formatIDR(item.jumlah)}
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={5}
                  title="Belum ada pengeluaran"
                  detail="Tidak ada transaksi yang sesuai filter."
                />
              )}
            </tbody>
          </table>
        </div>
      </FinanceTableCard>

      <ActionNotice
        notice={notice}
        onClose={() => setNotice(null)}
      />
    </div>
  );
}
