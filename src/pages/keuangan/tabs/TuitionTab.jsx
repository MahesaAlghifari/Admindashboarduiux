import { useDeferredValue, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BanknotesIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  ReceiptPercentIcon,
} from "@heroicons/react/24/outline";
import { fetchFinanceInvoices } from "../../../api/finance";
import { SectionHeader } from "../../../components/common/DesignSystem";
import { DEMO_INVOICES } from "../finance-demo";
import {
  ActionNotice,
  DataSourceNotice,
  EmptyRow,
  FinanceTableCard,
  MetricStrip,
  StatusBadge,
  formatDate,
  formatIDR,
  normalized,
  tableCellClass,
  tableHeadClass,
} from "../components/FinanceUI";

export default function TuitionTab() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [notice, setNotice] = useState(null);
  const deferredSearch = useDeferredValue(search);

  const query = useQuery({
    queryKey: ["finance", "invoices"],
    queryFn: ({ signal }) => fetchFinanceInvoices({ signal }),
    staleTime: 60_000,
  });

  const demo = query.isError;
  const invoices = demo ? DEMO_INVOICES : query.data ?? [];

  const filtered = useMemo(() => {
    const q = normalized(deferredSearch);
    return invoices.filter((item) => {
      const state = normalized(item.status_pembayaran);
      const matchesSearch =
        !q ||
        [
          item.nomor_tagihan,
          item.student?.nama_lengkap,
          item.student?.nisn,
        ].some((value) => normalized(value).includes(q));
      const matchesStatus =
        status === "all" ||
        (status === "paid" &&
          (state.includes("lunas") || state.includes("paid"))) ||
        (status === "unpaid" &&
          (state.includes("belum") || state.includes("unpaid"))) ||
        (status === "overdue" &&
          (state.includes("jatuh") || state.includes("overdue")));
      return matchesSearch && matchesStatus;
    });
  }, [deferredSearch, invoices, status]);

  const summary = useMemo(() => {
    const total = invoices.reduce(
      (sum, item) => sum + Number(item.jumlah_tagihan || 0),
      0
    );
    const paid = invoices
      .filter((item) => {
        const value = normalized(item.status_pembayaran);
        return value.includes("lunas") || value.includes("paid");
      })
      .reduce(
        (sum, item) => sum + Number(item.jumlah_tagihan || 0),
        0
      );
    return {
      total,
      paid,
      unpaid: Math.max(0, total - paid),
    };
  }, [invoices]);

  return (
    <div className="space-y-4">
      <SectionHeader
        icon={ReceiptPercentIcon}
        title="SPP & Tagihan"
        description="Kelola tagihan siswa dan pantau status pembayarannya."
        actions={
          <>
            <span className="text-[10px] text-slate-400">
              <b className="font-semibold text-slate-600">
                {invoices.length}
              </b>{" "}
              tagihan
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
                  title: "Catat Pembayaran",
                  description:
                    "Pencatatan pembayaran dapat menggunakan endpoint transaksi pemasukan. Form transaksi belum dibuat pada tahap styling ini.",
                })
              }
              className="ui-toolbar-button"
            >
              <BanknotesIcon className="h-4 w-4" />
              Catat Bayar
            </button>
            <button
              type="button"
              onClick={() =>
                setNotice({
                  title: "Buat Tagihan",
                  description:
                    "Endpoint POST /api/finance/invoices tersedia. Form create dapat disambungkan pada tahap berikutnya.",
                })
              }
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-[11px] font-semibold text-white hover:bg-[#df433c]"
            >
              <PlusIcon className="h-4 w-4" />
              Tagihan Baru
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
            label: "Total Tagihan",
            value: formatIDR(summary.total),
            detail: `${invoices.length} invoice`,
          },
          {
            label: "Sudah Diterima",
            value: formatIDR(summary.paid),
            detail: "Lunas",
            tone: "green",
          },
          {
            label: "Belum Diterima",
            value: formatIDR(summary.unpaid),
            detail: "Outstanding",
            tone: "red",
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
              placeholder="Cari nama, NIS, nomor tagihan..."
              className="ui-compact-control w-full pl-8"
            />
          </div>

          <select
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className="ui-compact-control min-w-40"
          >
            <option value="all">Semua Status</option>
            <option value="paid">Lunas</option>
            <option value="unpaid">Belum Lunas</option>
            <option value="overdue">Jatuh Tempo</option>
          </select>
        </div>
      )}

      <FinanceTableCard
        title="Daftar Tagihan"
        subtitle="Tagihan siswa yang tercatat pada modul keuangan."
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
          <table className="w-full min-w-[860px]">
            <thead className="bg-slate-50/60">
              <tr className="border-b border-slate-100">
                {[
                  "No. Tagihan",
                  "Siswa",
                  "Tanggal",
                  "Jatuh Tempo",
                  "Jumlah",
                  "Status",
                ].map((label) => (
                  <th key={label} className={tableHeadClass}>
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {query.isPending && !demo ? (
                Array.from({ length: 6 }, (_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }, (_, cell) => (
                      <td key={cell} className="px-3 py-3">
                        <div className="h-3 animate-pulse rounded bg-slate-100" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length ? (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/60">
                    <td className="px-3 py-2.5 font-mono text-[10px] text-slate-500">
                      {item.nomor_tagihan || item.id}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="text-[12px] font-semibold text-slate-800">
                        {item.student?.nama_lengkap || "Siswa"}
                      </p>
                      <p className="mt-0.5 text-[9px] text-slate-400">
                        NIS {item.student?.nisn || "-"}
                      </p>
                    </td>
                    <td className={tableCellClass}>
                      {formatDate(item.tanggal_tagihan)}
                    </td>
                    <td className={tableCellClass}>
                      {formatDate(item.tanggal_jatuh_tempo)}
                    </td>
                    <td className="px-3 py-2.5 text-[11px] font-semibold text-slate-700">
                      {formatIDR(item.jumlah_tagihan)}
                    </td>
                    <td className="px-3 py-2.5">
                      <StatusBadge status={item.status_pembayaran} />
                    </td>
                  </tr>
                ))
              ) : (
                <EmptyRow
                  colSpan={6}
                  title="Tagihan tidak ditemukan"
                  detail="Ubah pencarian atau filter status."
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
