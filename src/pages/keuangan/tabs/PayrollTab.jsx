import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  FunnelIcon,
  MagnifyingGlassIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { fetchFinancePayroll } from "../../../api/finance";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { DEMO_PAYROLL } from "../finance-demo";
import {
  DataSourceNotice,
  EmptyRow,
  FinanceTableCard,
  MetricStrip,
  StatusBadge,
  formatIDR,
  normalized,
  tableCellClass,
  tableHeadClass,
} from "../components/FinanceUI";

export default function PayrollTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ["finance", "payroll"],
    queryFn: ({ signal }) => fetchFinancePayroll({ signal }),
    staleTime: 60_000,
  });

  const demo = query.isError;
  const items = demo ? DEMO_PAYROLL : query.data ?? [];

  const filtered = useMemo(() => {
    const q = normalized(deferredSearch);

    return items.filter((item) => {
      const state = normalized(item.status_pembayaran);
      const matchesSearch =
        !q ||
        [item.nama_lengkap, item.jabatan, item.periode].some(
          (value) => normalized(value).includes(q)
        );
      const paid =
        state.includes("dibayar") ||
        state.includes("lunas") ||
        state.includes("paid");
      const matchesStatus =
        status === "all" ||
        (status === "paid" && paid) ||
        (status === "pending" && !paid);

      return matchesSearch && matchesStatus;
    });
  }, [deferredSearch, items, status]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.gaji_pokok || 0),
    0
  );

  const paidCount = items.filter((item) => {
    const state = normalized(item.status_pembayaran);
    return (
      state.includes("dibayar") ||
      state.includes("lunas") ||
      state.includes("paid")
    );
  }).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={UserGroupIcon}
        title="Penggajian"
        description="Pantau daftar gaji staff dan guru serta status pembayarannya."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {items.length}
              </b>{" "}
              staff & guru
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
            label: "Total Payroll",
            value: formatIDR(total),
            detail: `${items.length} orang`,
          },
          {
            label: "Sudah Dibayar",
            value: String(paidCount),
            detail: "Selesai",
            tone: "green",
          },
          {
            label: "Menunggu",
            value: String(Math.max(0, items.length - paidCount)),
            detail: "Belum dibayar",
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
              placeholder="Cari nama, jabatan, periode..."
              className="ui-compact-control w-full pl-8"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="ui-compact-control min-w-40"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Sudah Dibayar</option>
            <option value="pending">Menunggu</option>
          </select>
        </div>
      )}

      <FinanceTableCard
        title="Daftar Penggajian"
        subtitle="Payroll staff dan guru berdasarkan periode."
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
          <table className="w-full min-w-[780px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "Nama",
                  "Jabatan",
                  "Periode",
                  "Gaji Pokok",
                  "Status",
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
                    <td className="px-3 py-2.5 text-[12px] font-semibold text-slate-800">
                      {item.nama_lengkap || "-"}
                    </td>
                    <td className={tableCellClass}>
                      {item.jabatan || "-"}
                    </td>
                    <td className={tableCellClass}>
                      {item.periode || "-"}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-semibold text-slate-700">
                      {formatIDR(item.gaji_pokok)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={item.status_pembayaran} />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={5}
                  title="Data payroll tidak ditemukan"
                  detail="Ubah pencarian atau filter status."
                />
              )}
            </tbody>
          </table>
        </div>
      </FinanceTableCard>
    </div>
  );
}
