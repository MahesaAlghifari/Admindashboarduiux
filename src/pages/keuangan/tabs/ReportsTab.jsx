import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  FunnelIcon,
  PresentationChartLineIcon,
} from "@heroicons/react/24/outline";
import {
  fetchFinanceBudgets,
  fetchFinanceSummary,
  fetchFinanceTransactions,
} from "../../../api/finance";
import { SectionHeader } from "../../../components/common/DesignSystem";
import {
  DEMO_BUDGETS,
  DEMO_GRANTS,
  DEMO_SUMMARY,
  DEMO_TRANSACTIONS,
} from "../finance-demo";
import {
  ActionNotice,
  DataSourceNotice,
  FinanceTableCard,
  MetricStrip,
  formatCompactIDR,
  formatIDR,
  normalized,
  tableHeadClass,
} from "../components/FinanceUI";

const isOut = (item) => {
  const value = normalized(item.tipe_transaksi);
  return (
    value.includes("keluar") ||
    value.includes("pengeluaran") ||
    value.includes("expense")
  );
};

const monthKey = (value) =>
  String(value ?? "").slice(0, 7);

const monthLabel = (value) => {
  const [year, month] = value.split("-");
  const date = new Date(
    Number(year),
    Number(month) - 1,
    1
  );

  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat("id-ID", {
    month: "short",
    year: "2-digit",
  }).format(date);
};

export default function ReportsTab() {
  const now = new Date();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const [startDate, setStartDate] = useState(
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-01`
  );
  const [endDate, setEndDate] = useState(
    `${now.getFullYear()}-${String(
      now.getMonth() + 1
    ).padStart(2, "0")}-${String(
      new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0
      ).getDate()
    ).padStart(2, "0")}`
  );

  const summaryQuery = useQuery({
    queryKey: ["finance", "summary", startDate, endDate],
    queryFn: ({ signal }) =>
      fetchFinanceSummary(
        {
          start_date: startDate,
          end_date: endDate,
        },
        { signal }
      ),
    staleTime: 60_000,
  });

  const transactionQuery = useQuery({
    queryKey: ["finance", "transactions"],
    queryFn: ({ signal }) => fetchFinanceTransactions({ signal }),
    staleTime: 60_000,
  });

  const budgetQuery = useQuery({
    queryKey: ["finance", "budgets"],
    queryFn: ({ signal }) => fetchFinanceBudgets({ signal }),
    staleTime: 60_000,
  });

  const summary = summaryQuery.isError
    ? DEMO_SUMMARY
    : summaryQuery.data ?? DEMO_SUMMARY;

  const transactions = transactionQuery.isError
    ? DEMO_TRANSACTIONS
    : transactionQuery.data ?? [];

  const budgets = budgetQuery.isError
    ? DEMO_BUDGETS
    : budgetQuery.data ?? [];

  const demo =
    summaryQuery.isError ||
    transactionQuery.isError ||
    budgetQuery.isError;

  const cashflow = useMemo(() => {
    const map = new Map();

    transactions.forEach((item) => {
      const key = monthKey(item.tanggal_transaksi);
      if (!key) return;

      const current = map.get(key) ?? {
        month: key,
        income: 0,
        expense: 0,
      };

      if (isOut(item)) {
        current.expense += Number(item.jumlah || 0);
      } else {
        current.income += Number(item.jumlah || 0);
      }

      map.set(key, current);
    });

    return [...map.values()]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6);
  }, [transactions]);

  const maxCashflow = Math.max(
    1,
    ...cashflow.flatMap((item) => [
      item.income,
      item.expense,
    ])
  );

  const totalAllocation = budgets.reduce(
    (sum, item) => sum + Number(item.alokasi || 0),
    0
  );
  const totalUsed = budgets.reduce(
    (sum, item) => sum + Number(item.terpakai || 0),
    0
  );

  const loading =
    summaryQuery.isFetching ||
    transactionQuery.isFetching ||
    budgetQuery.isFetching;

  const reload = () => {
    summaryQuery.refetch();
    transactionQuery.refetch();
    budgetQuery.refetch();
  };

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={PresentationChartLineIcon}
        title="Laporan Keuangan"
        description="Ringkasan arus kas, realisasi anggaran, dan pendanaan tambahan."
        actions={
          <>
            <button
              type="button"
              onClick={() => setFiltersOpen((value) => !value)}
              className={`ui-toolbar-button ${
                filtersOpen ? "is-active" : ""
              }`}
            >
              <FunnelIcon className="h-4 w-4" />
              Periode
            </button>
            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="ui-toolbar-button"
            >
              <ArrowPathIcon
                className={`h-4 w-4 ${
                  loading ? "animate-spin" : ""
                }`}
              />
              Muat Ulang
            </button>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: "Ekspor Laporan",
                  description:
                    "Endpoint ekspor belum tersedia. Tombol ini disiapkan agar struktur UI sudah final ketika fitur export ditambahkan.",
                })
              }
              className="ui-toolbar-button"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              Ekspor
            </button>
          </>
        }
      />

      <DataSourceNotice
        demo={demo}
        loading={loading}
        onRetry={reload}
      />

      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-wrap items-end gap-2">
            <label>
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Dari
              </span>
              <input
                type="date"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
                className="ui-compact-control"
              />
            </label>
            <label>
              <span className="mb-1 block text-[9px] font-semibold uppercase tracking-wide text-slate-400">
                Sampai
              </span>
              <input
                type="date"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
                className="ui-compact-control"
              />
            </label>
          </div>

          <span className="text-[10px] text-slate-400">
            Ringkasan mengikuti periode yang dipilih.
          </span>
        </div>
      )}

      <MetricStrip
        items={[
          {
            label: "Saldo Kas",
            value: formatIDR(summary.saldo_kas),
            detail: "Saat ini",
            tone: "blue",
          },
          {
            label: "Pengeluaran",
            value: formatIDR(summary.pengeluaran_periode),
            detail: "Periode",
            tone: "red",
          },
          {
            label: "Anggaran Terpakai",
            value: formatIDR(
              summary.anggaran_terpakai || totalUsed
            ),
            detail: "Realisasi",
            tone: "amber",
          },
          {
            label: "Sisa Anggaran",
            value: formatIDR(
              (summary.total_anggaran || totalAllocation) -
                (summary.anggaran_terpakai || totalUsed)
            ),
            detail: "Tersedia",
            tone: "green",
          },
        ]}
      />

      <div className="grid gap-4 xl:grid-cols-[1.3fr_1fr]">
        <FinanceTableCard
          title="Arus Kas"
          subtitle="Perbandingan pemasukan dan pengeluaran 6 bulan terakhir."
          meta={`${transactions.length} transaksi`}
        >
          <div className="px-4 py-4">
            <div className="mb-3 flex justify-end gap-3 text-[9px] text-slate-400">
              <span className="inline-flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm bg-emerald-400" />
                Masuk
              </span>
              <span className="inline-flex items-center gap-1">
                <i className="h-2 w-2 rounded-sm bg-rose-400" />
                Keluar
              </span>
            </div>

            <div className="flex h-44 items-end gap-3 border-b border-slate-100">
              {cashflow.length ? (
                cashflow.map((item) => (
                  <div
                    key={item.month}
                    className="flex min-w-0 flex-1 flex-col items-center gap-2"
                  >
                    <div className="flex h-32 w-full items-end justify-center gap-1">
                      <div
                        className="w-2.5 rounded-t bg-emerald-400"
                        title={`Masuk ${formatIDR(item.income)}`}
                        style={{
                          height: `${Math.max(
                            4,
                            Math.round(
                              (item.income / maxCashflow) * 100
                            )
                          )}%`,
                        }}
                      />
                      <div
                        className="w-2.5 rounded-t bg-rose-400"
                        title={`Keluar ${formatIDR(item.expense)}`}
                        style={{
                          height: `${Math.max(
                            4,
                            Math.round(
                              (item.expense / maxCashflow) * 100
                            )
                          )}%`,
                        }}
                      />
                    </div>
                    <span className="truncate text-[9px] text-slate-400">
                      {monthLabel(item.month)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-400">
                  Belum ada transaksi.
                </div>
              )}
            </div>
          </div>
        </FinanceTableCard>

        <FinanceTableCard
          title="Realisasi Anggaran"
          subtitle="Pemakaian per pos anggaran."
          meta={`${budgets.length} pos`}
        >
          <div className="space-y-3 px-4 py-4">
            {budgets.length ? (
              budgets.slice(0, 6).map((item) => {
                const allocation = Number(item.alokasi || 0);
                const used = Number(item.terpakai || 0);
                const percent = allocation
                  ? Math.round((used / allocation) * 100)
                  : 0;

                return (
                  <div key={item.id}>
                    <div className="flex items-center justify-between gap-3">
                      <span className="truncate text-[10px] font-medium text-slate-600">
                        {item.nama_anggaran}
                      </span>
                      <span className="shrink-0 text-[9px] font-semibold text-slate-400">
                        {percent}%
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={`h-full rounded-full ${
                          percent > 100
                            ? "bg-rose-500"
                            : percent > 85
                              ? "bg-amber-500"
                              : "bg-slate-500"
                        }`}
                        style={{
                          width: `${Math.min(100, percent)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-10 text-center text-[10px] text-slate-400">
                Belum ada anggaran.
              </div>
            )}
          </div>
        </FinanceTableCard>
      </div>

      <FinanceTableCard
        title="Dana Hibah & Pendanaan Tambahan"
        subtitle="Belum ada endpoint khusus hibah; data contoh dipakai sementara."
        meta="Demo"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "Program",
                  "Pemberi",
                  "Total",
                  "Terpakai",
                  "Sisa",
                ].map((label) => (
                  <th key={label} className={tableHeadClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {DEMO_GRANTS.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800">
                    {item.name}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-500">
                    {item.provider}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-slate-600">
                    {formatCompactIDR(item.total)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-amber-600">
                    {formatCompactIDR(item.used)}
                  </td>
                  <td className="px-3 py-2.5 text-[11px] font-semibold text-emerald-600">
                    {formatCompactIDR(item.total - item.used)}
                  </td>
                </tr>
              ))}
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
