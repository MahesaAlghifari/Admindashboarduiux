import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeftIcon,
  ArrowPathIcon,
  ArrowUpRightIcon,
  ClockIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";
import { fetchFinanceTransactions } from "../../../api/finance";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { DEMO_TRANSACTIONS } from "../finance-demo";
import {
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

export default function HistoryTab() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ["finance", "transactions"],
    queryFn: ({ signal }) => fetchFinanceTransactions({ signal }),
    staleTime: 60_000,
  });

  const demo = query.isError;
  const items = demo ? DEMO_TRANSACTIONS : query.data ?? [];

  const filtered = useMemo(() => {
    const q = normalized(deferredSearch);
    return items.filter((item) => {
      const value = normalized(item.tipe_transaksi);
      const matchesSearch =
        !q ||
        [item.nomor_transaksi, item.deskripsi, item.kategori].some(
          (entry) => normalized(entry).includes(q)
        );
      const matchesType =
        type === "all" ||
        (type === "in" &&
          (value.includes("masuk") ||
            value.includes("pemasukan") ||
            value.includes("income"))) ||
        (type === "out" &&
          (value.includes("keluar") ||
            value.includes("pengeluaran") ||
            value.includes("expense")));
      return matchesSearch && matchesType;
    });
  }, [deferredSearch, items, type]);

  const totalIn = items
    .filter((item) => {
      const value = normalized(item.tipe_transaksi);
      return (
        value.includes("masuk") ||
        value.includes("pemasukan") ||
        value.includes("income")
      );
    })
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  const totalOut = items
    .filter((item) => {
      const value = normalized(item.tipe_transaksi);
      return (
        value.includes("keluar") ||
        value.includes("pengeluaran") ||
        value.includes("expense")
      );
    })
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ClockIcon}
        title="Riwayat Transaksi"
        description="Tinjau seluruh arus uang masuk dan keluar yang tercatat."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {items.length}
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
              onClick={() => query.refetch()}
              disabled={query.isFetching}
              className="ui-toolbar-button"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${
                  query.isFetching ? "animate-spin" : ""
                }`}
              />
              Muat Ulang
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
            label: "Pemasukan",
            value: formatIDR(totalIn),
            detail: "Masuk",
            tone: "green",
          },
          {
            label: "Pengeluaran",
            value: formatIDR(totalOut),
            detail: "Keluar",
            tone: "red",
          },
          {
            label: "Selisih",
            value: formatIDR(totalIn - totalOut),
            detail: `${items.length} transaksi`,
            tone: totalIn - totalOut >= 0 ? "blue" : "red",
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
              placeholder="Cari transaksi, kategori, deskripsi..."
              className="ui-compact-control w-full pl-8"
            />
          </div>

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="ui-compact-control min-w-40"
          >
            <option value="all">Semua Transaksi</option>
            <option value="in">Pemasukan</option>
            <option value="out">Pengeluaran</option>
          </select>
        </div>
      )}

      <FinanceTableCard
        title="Transaksi Keuangan"
        subtitle="Riwayat transaksi berdasarkan tanggal pencatatan."
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
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "No. Transaksi",
                  "Tanggal",
                  "Tipe",
                  "Kategori",
                  "Deskripsi",
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
                filtered.map((item) => {
                  const outgoing =
                    normalized(item.tipe_transaksi).includes("keluar") ||
                    normalized(item.tipe_transaksi).includes("pengeluaran") ||
                    normalized(item.tipe_transaksi).includes("expense");

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">
                        {item.nomor_transaksi || item.id}
                      </td>
                      <td className={tableCellClass}>
                        {formatDate(item.tanggal_transaksi)}
                      </td>
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                            outgoing
                              ? "border-rose-100 bg-rose-50 text-rose-600"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {outgoing ? (
                            <ArrowUpRightIcon className="h-3 w-3" />
                          ) : (
                            <ArrowDownLeftIcon className="h-3 w-3" />
                          )}
                          {outgoing ? "Keluar" : "Masuk"}
                        </span>
                      </td>
                      <td className={tableCellClass}>
                        {item.kategori || "-"}
                      </td>
                      <td className="max-w-96 px-3 py-2.5 text-[11px] text-slate-600">
                        {item.deskripsi || "-"}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-[11px] font-semibold ${
                          outgoing
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {outgoing ? "- " : "+ "}
                        {formatIDR(item.jumlah)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow
                  colSpan={6}
                  title="Transaksi tidak ditemukan"
                  detail="Ubah pencarian atau filter transaksi."
                />
              )}
            </tbody>
          </table>
        </div>
      </FinanceTableCard>
    </div>
  );
}
