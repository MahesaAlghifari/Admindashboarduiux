import {
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export const text = (value) =>
  String(value ?? "").trim();

export const normalized = (value) =>
  text(value)
    .toLocaleLowerCase("id")
    .replace(/[\s_-]+/g, " ");

export const formatIDR = (value) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);

export const formatCompactIDR = (value) =>
  new Intl.NumberFormat("id-ID", {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
  }).format(Number(value) || 0);

export const formatDate = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
};

export function MetricStrip({ items }) {
  return (
    <div
      className={`grid overflow-hidden rounded-xl border border-slate-100 bg-white ${
        items.length === 4
          ? "sm:grid-cols-2 xl:grid-cols-4"
          : items.length === 3
            ? "sm:grid-cols-3"
            : "sm:grid-cols-2"
      }`}
    >
      {items.map((item, index) => (
        <div
          key={item.label}
          className={`px-3 py-2.5 ${
            index
              ? "border-t border-slate-100 sm:border-l sm:border-t-0"
              : ""
          }`}
        >
          <p className="text-[9px] font-semibold uppercase tracking-wide text-slate-400">
            {item.label}
          </p>
          <div className="mt-1 flex items-end justify-between gap-2">
            <p
              className={`truncate text-[14px] font-semibold ${
                item.tone === "green"
                  ? "text-emerald-600"
                  : item.tone === "red"
                    ? "text-rose-600"
                    : item.tone === "amber"
                      ? "text-amber-600"
                      : item.tone === "blue"
                        ? "text-sky-600"
                        : "text-slate-800"
              }`}
            >
              {item.value}
            </p>
            {item.detail && (
              <span className="shrink-0 text-[9px] text-slate-400">
                {item.detail}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

export function DataSourceNotice({
  demo,
  loading,
  onRetry,
}) {
  if (!demo) return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-amber-100 bg-amber-50/60 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-2">
        <ExclamationTriangleIcon className="h-4 w-4 shrink-0 text-amber-500" />
        <p className="text-[10px] leading-4 text-amber-700">
          API belum merespons. Data contoh digunakan sementara agar tampilan tetap dapat diuji.
        </p>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="ui-toolbar-button h-8 shrink-0"
        >
          <ArrowPathIcon
            className={`h-3.5 w-3.5 ${
              loading ? "animate-spin" : ""
            }`}
          />
          Coba API Lagi
        </button>
      )}
    </div>
  );
}

export function FinanceTableCard({
  children,
  title,
  subtitle,
  meta,
}) {
  return (
    <div className="ui-table-card overflow-hidden">
      {(title || meta) && (
        <div className="flex flex-col gap-1 border-b border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {title && (
              <h3 className="text-[11px] font-semibold text-slate-700">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="mt-0.5 text-[10px] text-slate-400">
                {subtitle}
              </p>
            )}
          </div>
          {meta && (
            <div className="text-[10px] text-slate-400">
              {meta}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatusBadge({ status }) {
  const value = normalized(status);

  const config =
    value.includes("lunas") ||
    value.includes("paid") ||
    value.includes("dibayar") ||
    value.includes("approved") ||
    value.includes("selesai")
      ? {
          label: "Selesai",
          className:
            "border-emerald-100 bg-emerald-50 text-emerald-600",
        }
      : value.includes("jatuh") ||
          value.includes("overdue") ||
          value.includes("ditolak") ||
          value.includes("rejected")
        ? {
            label:
              value.includes("jatuh") ||
              value.includes("overdue")
                ? "Jatuh Tempo"
                : "Ditolak",
            className:
              "border-rose-100 bg-rose-50 text-rose-600",
          }
        : {
            label:
              value.includes("belum") ||
              value.includes("unpaid")
                ? "Belum Lunas"
                : "Menunggu",
            className:
              "border-amber-100 bg-amber-50 text-amber-600",
          };

  return (
    <span
      className={`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold ${config.className}`}
    >
      {config.label}
    </span>
  );
}

export function EmptyRow({
  colSpan,
  title = "Belum ada data",
  detail = "Data akan tampil ketika tersedia.",
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-3 py-10 text-center"
      >
        <p className="text-[11px] font-semibold text-slate-600">
          {title}
        </p>
        <p className="mt-1 text-[10px] text-slate-400">
          {detail}
        </p>
      </td>
    </tr>
  );
}

export function ActionNotice({
  notice,
  onClose,
}) {
  if (!notice) return null;

  const success = notice.type === "success";
  const Icon = success
    ? CheckCircleIcon
    : InformationCircleIcon;

  return (
    <div className="fixed inset-0 z-70 flex items-end justify-center bg-slate-950/35 p-0 backdrop-blur-[2px] sm:items-center sm:p-4">
      <section className="w-full rounded-t-2xl border border-slate-100 bg-white shadow-2xl sm:max-w-md sm:rounded-xl">
        <div className="p-5">
          <div className="flex items-start gap-3">
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                success
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-sky-50 text-sky-600"
              }`}
            >
              <Icon className="h-[18px] w-[18px]" />
            </span>

            <div className="min-w-0 flex-1">
              <h2 className="text-[13px] font-semibold text-slate-800">
                {notice.title}
              </h2>
              <p className="mt-1 text-[11px] leading-5 text-slate-500">
                {notice.description}
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="ui-toolbar-button"
            >
              Tutup
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}

export const tableHeadClass =
  "px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400";

export const tableCellClass =
  "px-3 py-2.5 text-[11px] text-slate-600";
