import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChartPieIcon,
  FunnelIcon,
  PlusIcon,
} from "@heroicons/react/24/outline";
import { fetchFinanceBudgets } from "../../../api/finance";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { DEMO_BUDGETS } from "../finance-demo";
import {
  ActionNotice,
  DataSourceNotice,
  EmptyRow,
  FinanceTableCard,
  MetricStrip,
  formatIDR,
  tableCellClass,
  tableHeadClass,
} from "../components/FinanceUI";

export default function BudgetTab() {
  const [period, setPeriod] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState(null);

  const query = useQuery({
    queryKey: ["finance", "budgets"],
    queryFn: ({ signal }) => fetchFinanceBudgets({ signal }),
    staleTime: 60_000,
  });

  const demo = query.isError;
  const items = demo ? DEMO_BUDGETS : query.data ?? [];

  const periods = useMemo(
    () =>
      [...new Set(items.map((item) => item.periode).filter(Boolean))]
        .sort()
        .reverse(),
    [items]
  );

  const filtered =
    period === "all"
      ? items
      : items.filter((item) => item.periode === period);

  const total = filtered.reduce(
    (sum, item) => sum + Number(item.alokasi || 0),
    0
  );
  const used = filtered.reduce(
    (sum, item) => sum + Number(item.terpakai || 0),
    0
  );
  const percent = total ? Math.round((used / total) * 100) : 0;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ChartPieIcon}
        title="Anggaran"
        description="Pantau alokasi, realisasi, dan sisa anggaran."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {filtered.length}
              </b>{" "}
              pos
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
                  title: "Pos Anggaran",
                  description:
                    "Backend saat ini menyediakan GET /api/finance/budgets. Endpoint create/update belum tersedia di dokumentasi.",
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c]"
            >
              <PlusIcon className="h-4 w-4" />
              Pos Anggaran
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
            label: "Total Anggaran",
            value: formatIDR(total),
            detail: `${filtered.length} pos`,
          },
          {
            label: "Terpakai",
            value: formatIDR(used),
            detail: `${percent}%`,
            tone: "amber",
          },
          {
            label: "Sisa",
            value: formatIDR(total - used),
            detail: "Tersedia",
            tone: "green",
          },
          {
            label: "Realisasi",
            value: `${percent}%`,
            detail: "Penggunaan",
            tone: percent > 90 ? "red" : "blue",
          },
        ]}
      />

      {filtersOpen && (
        <div className="flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-[10px] text-slate-400">
            Filter anggaran berdasarkan periode.
          </span>
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value)}
            className="ui-compact-control min-w-40"
          >
            <option value="all">Semua Periode</option>
            {periods.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      )}

      <FinanceTableCard
        title="Pos Anggaran"
        subtitle="Realisasi penggunaan dana per pos."
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "Nama Anggaran",
                  "Periode",
                  "Alokasi",
                  "Terpakai",
                  "Sisa",
                  "Progres",
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
                  const allocation = Number(item.alokasi || 0);
                  const current = Number(item.terpakai || 0);
                  const progress = allocation
                    ? Math.round((current / allocation) * 100)
                    : 0;

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/60">
                      <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800">
                        {item.nama_anggaran || "-"}
                      </td>
                      <td className={tableCellClass}>
                        {item.periode || "-"}
                      </td>
                      <td className={tableCellClass}>
                        {formatIDR(item.alokasi)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-medium text-amber-600">
                        {formatIDR(item.terpakai)}
                      </td>
                      <td className="px-3 py-2.5 text-[11px] font-medium text-emerald-600">
                        {formatIDR(allocation - current)}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex min-w-28 items-center gap-2">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className={`h-full rounded-full ${
                                progress > 100
                                  ? "bg-rose-500"
                                  : progress > 85
                                    ? "bg-amber-500"
                                    : "bg-slate-500"
                              }`}
                              style={{
                                width: `${Math.min(100, progress)}%`,
                              }}
                            />
                          </div>
                          <span className="w-9 text-right text-[9px] font-semibold text-slate-500">
                            {progress}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <EmptyRow
                  colSpan={6}
                  title="Anggaran tidak ditemukan"
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
