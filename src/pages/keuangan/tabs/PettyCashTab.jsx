import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownLeftIcon,
  ArrowUpRightIcon,
  PlusIcon,
  WalletIcon,
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

const isCashItem = (item) =>
  normalized(item.kategori).includes("kas") ||
  normalized(item.deskripsi).includes("kas kecil");

const isOut = (item) => {
  const value = normalized(item.tipe_transaksi);
  return (
    value.includes("keluar") ||
    value.includes("pengeluaran") ||
    value.includes("expense")
  );
};

export default function PettyCashTab() {
  const [notice, setNotice] = useState(null);

  const query = useQuery({
    queryKey: ["finance", "transactions"],
    queryFn: ({ signal }) => fetchFinanceTransactions({ signal }),
    staleTime: 60_000,
  });

  const demo = query.isError;
  const allItems = demo ? DEMO_TRANSACTIONS : query.data ?? [];

  const apiCashItems = useMemo(
    () => allItems.filter(isCashItem),
    [allItems]
  );

  const items =
    apiCashItems.length > 0
      ? apiCashItems
      : DEMO_TRANSACTIONS.filter(isCashItem);

  const usingDemo = demo || apiCashItems.length === 0;

  const incoming = items
    .filter((item) => !isOut(item))
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  const outgoing = items
    .filter(isOut)
    .reduce((sum, item) => sum + Number(item.jumlah || 0), 0);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={WalletIcon}
        title="Kas Kecil"
        description="Pantau penggunaan kas operasional harian."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {items.length}
              </b>{" "}
              mutasi
            </span>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: "Isi Saldo Kas Kecil",
                  description:
                    "Belum ada endpoint khusus kas kecil. Gunakan transaksi pemasukan dengan kategori Kas Kecil untuk sementara.",
                })
              }
              className="ui-toolbar-button"
            >
              <ArrowDownLeftIcon className="h-4 w-4" />
              Isi Saldo
            </button>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: "Catat Kas Kecil",
                  description:
                    "Pencatatan dapat memakai POST /api/finance/transactions dengan kategori Kas Kecil.",
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c]"
            >
              <PlusIcon className="h-4 w-4" />
              Transaksi Baru
            </button>
          </>
        }
      />

      <DataSourceNotice
        demo={usingDemo}
        loading={query.isFetching}
        onRetry={() => query.refetch()}
      />

      <MetricStrip
        items={[
          {
            label: "Kas Masuk",
            value: formatIDR(incoming),
            detail: "Pengisian",
            tone: "green",
          },
          {
            label: "Kas Keluar",
            value: formatIDR(outgoing),
            detail: "Pemakaian",
            tone: "red",
          },
          {
            label: "Saldo Berjalan",
            value: formatIDR(incoming - outgoing),
            detail: `${items.length} transaksi`,
            tone: "blue",
          },
        ]}
      />

      <FinanceTableCard
        title="Mutasi Kas Kecil"
        subtitle="Transaksi berkategori kas kecil."
        meta={usingDemo ? "Fallback demo" : "Data API"}
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "Tanggal",
                  "No. Transaksi",
                  "Keterangan",
                  "Tipe",
                  "Jumlah",
                ].map((label) => (
                  <th key={label} className={tableHeadClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.length ? (
                items.map((item) => {
                  const outgoingItem = isOut(item);

                  return (
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
                      <td className="px-3 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[9px] font-semibold ${
                            outgoingItem
                              ? "border-rose-100 bg-rose-50 text-rose-600"
                              : "border-emerald-100 bg-emerald-50 text-emerald-600"
                          }`}
                        >
                          {outgoingItem ? (
                            <ArrowUpRightIcon className="h-3 w-3" />
                          ) : (
                            <ArrowDownLeftIcon className="h-3 w-3" />
                          )}
                          {outgoingItem ? "Keluar" : "Masuk"}
                        </span>
                      </td>
                      <td
                        className={`px-3 py-2.5 text-[11px] font-semibold ${
                          outgoingItem
                            ? "text-rose-600"
                            : "text-emerald-600"
                        }`}
                      >
                        {formatIDR(item.jumlah)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow
                  colSpan={5}
                  title="Belum ada mutasi kas kecil"
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
