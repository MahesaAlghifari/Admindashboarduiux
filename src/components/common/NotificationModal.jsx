import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { createPortal } from "react-dom";
import {
  BellIcon,
  CalendarDaysIcon,
  CheckCircleIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  MegaphoneIcon,
  SparklesIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

const TABS = [
  {
    id: "all",
    label: "Semua",
  },
  {
    id: "unread",
    label: "Belum Dibaca",
  },
];

const typeConfig = {
  important: {
    Icon: ExclamationTriangleIcon,
    iconClass:
      "border-rose-100 bg-rose-50 text-rose-600",
    badgeClass:
      "border-rose-100 bg-rose-50 text-rose-600",
  },
  activity: {
    Icon: SparklesIcon,
    iconClass:
      "border-sky-100 bg-sky-50 text-sky-600",
    badgeClass:
      "border-sky-100 bg-sky-50 text-sky-600",
  },
  holiday: {
    Icon: CalendarDaysIcon,
    iconClass:
      "border-amber-100 bg-amber-50 text-amber-600",
    badgeClass:
      "border-amber-100 bg-amber-50 text-amber-600",
  },
  info: {
    Icon: InformationCircleIcon,
    iconClass:
      "border-slate-100 bg-slate-50 text-slate-500",
    badgeClass:
      "border-slate-100 bg-slate-50 text-slate-500",
  },
};

function NotificationItem({
  item,
  onRead,
  onOpen,
}) {
  const config =
    typeConfig[item.type] ??
    typeConfig.info;

  const Icon = config.Icon;

  return (
    <article
      className={`group relative border-b border-slate-100 px-4 py-3.5 transition ${
        item.isRead
          ? "bg-white hover:bg-slate-50/60"
          : "bg-red-50/20 hover:bg-red-50/35"
      }`}
    >
      {!item.isRead && (
        <span className="absolute left-0 top-0 h-full w-0.5 bg-[#ef4d45]" />
      )}

      <div className="flex items-start gap-3">
        <span
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border ${config.iconClass}`}
        >
          <Icon className="h-4 w-4" />
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p
                className={`line-clamp-1 text-[11px] ${
                  item.isRead
                    ? "font-medium text-slate-600"
                    : "font-semibold text-slate-800"
                }`}
              >
                {item.title}
              </p>

              <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-slate-400">
                {item.message}
              </p>
            </div>

            {!item.isRead && (
              <span
                className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[#ef4d45]"
                aria-label="Belum dibaca"
              />
            )}
          </div>

          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span
              className={`rounded-full border px-2 py-0.5 text-[8px] font-semibold ${config.badgeClass}`}
            >
              {item.typeLabel}
            </span>

            <span className="text-[9px] text-slate-400">
              {item.time}
            </span>

            <span className="text-[9px] text-slate-300">
              ·
            </span>

            <span className="text-[9px] text-slate-400">
              {item.target}
            </span>
          </div>

          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() =>
                onOpen(item)
              }
              className="inline-flex h-7 items-center gap-1.5 rounded-md border border-slate-100 bg-white px-2.5 text-[9px] font-semibold text-slate-600 transition hover:border-red-100 hover:bg-red-50/40 hover:text-[#ef4d45]"
            >
              <MegaphoneIcon className="h-3 w-3" />
              Lihat Pengumuman
            </button>

            {!item.isRead && (
              <button
                type="button"
                onClick={() =>
                  onRead(item.id)
                }
                className="inline-flex h-7 items-center gap-1.5 rounded-md px-2 text-[9px] font-semibold text-slate-400 transition hover:bg-slate-50 hover:text-slate-600"
              >
                <CheckIcon className="h-3 w-3" />
                Tandai dibaca
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

function EmptyState({
  unreadOnly,
}) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-100 bg-slate-50 text-slate-300">
        {unreadOnly ? (
          <CheckCircleIcon className="h-6 w-6" />
        ) : (
          <BellIcon className="h-6 w-6" />
        )}
      </span>

      <h3 className="mt-3 text-[12px] font-semibold text-slate-700">
        {unreadOnly
          ? "Semua sudah dibaca"
          : "Belum ada notifikasi"}
      </h3>

      <p className="mt-1 max-w-xs text-[10px] leading-4 text-slate-400">
        {unreadOnly
          ? "Tidak ada pengumuman baru yang membutuhkan perhatian."
          : "Pengumuman sekolah akan tampil di sini ketika tersedia."}
      </p>
    </div>
  );
}

export default function NotificationModal({
  isOpen,
  onClose,
  notifications = [],
  unreadCount = 0,
  onMarkRead,
  onMarkAllRead,
  onRefresh,
  isLoading = false,
  error = "",
  lastUpdated = null,
}) {
  const navigate = useNavigate();
  const [tab, setTab] =
    useState("all");

  useEffect(() => {
    if (!isOpen) return;

    const previous =
      document.body.style.overflow;

    document.body.style.overflow =
      "hidden";

    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener(
      "keydown",
      onKeyDown
    );

    return () => {
      document.body.style.overflow =
        previous;
      window.removeEventListener(
        "keydown",
        onKeyDown
      );
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;
    onRefresh?.({
      silent:
        notifications.length > 0,
    });
  }, [isOpen]);

  const filtered = useMemo(
    () =>
      tab === "unread"
        ? notifications.filter(
            (item) => !item.isRead
          )
        : notifications,
    [notifications, tab]
  );

  const handleOpen = (item) => {
    onMarkRead?.(item.id);
    onClose();
    navigate(
      item.href ||
        "/administrasi?tab=pengumuman"
    );
  };

  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[120] flex justify-end bg-slate-950/20 backdrop-blur-[1px]"
      onMouseDown={(event) => {
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="notification-title"
        className="flex h-dvh w-full flex-col border-l border-slate-200 bg-white shadow-2xl sm:max-w-[430px]"
      >
        <header className="border-b border-slate-100 px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-100 bg-red-50 text-[#ef4d45]">
                <BellIcon className="h-[18px] w-[18px]" />
              </span>

              <div>
                <div className="flex items-center gap-2">
                  <h2
                    id="notification-title"
                    className="text-[13px] font-semibold text-slate-800"
                  >
                    Notifikasi
                  </h2>

                  {unreadCount > 0 && (
                    <span className="rounded-full bg-[#ef4d45] px-2 py-0.5 text-[8px] font-semibold text-white">
                      {unreadCount} baru
                    </span>
                  )}
                </div>

                <p className="mt-1 text-[10px] text-slate-400">
                  Pengumuman dan informasi sekolah.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Tutup notifikasi"
            >
              <XMarkIcon className="h-4 w-4" />
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3">
            <div className="inline-flex rounded-lg bg-slate-100 p-1">
              {TABS.map((item) => {
                const active =
                  tab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      setTab(item.id)
                    }
                    className={`flex h-8 items-center gap-1.5 rounded-md px-3 text-[10px] font-semibold transition ${
                      active
                        ? "bg-white text-slate-700 shadow-sm"
                        : "text-slate-400 hover:text-slate-600"
                    }`}
                  >
                    {item.label}
                    {item.id ===
                      "unread" &&
                      unreadCount > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[8px] ${
                            active
                              ? "bg-red-50 text-[#ef4d45]"
                              : "bg-slate-200/70 text-slate-500"
                          }`}
                        >
                          {unreadCount}
                        </span>
                      )}
                  </button>
                );
              })}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllRead}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[9px] font-semibold text-slate-400 transition hover:bg-emerald-50 hover:text-emerald-600"
              >
                <CheckCircleIcon className="h-3.5 w-3.5" />
                Tandai semua
              </button>
            )}
          </div>
        </header>

        {error && (
          <div className="mx-4 mt-3 flex items-start gap-2 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5">
            <ExclamationTriangleIcon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] leading-4 text-rose-600">
                {error}
              </p>
              <button
                type="button"
                onClick={() =>
                  onRefresh?.()
                }
                className="mt-1 text-[9px] font-semibold text-rose-600 underline underline-offset-2"
              >
                Coba lagi
              </button>
            </div>
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto">
          {isLoading &&
          notifications.length === 0 ? (
            <div className="space-y-0">
              {Array.from(
                { length: 5 },
                (_, index) => (
                  <div
                    key={index}
                    className="flex gap-3 border-b border-slate-100 px-4 py-4"
                  >
                    <div className="h-9 w-9 shrink-0 animate-pulse rounded-lg bg-slate-100" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 animate-pulse rounded bg-slate-100" />
                      <div className="h-2.5 w-full animate-pulse rounded bg-slate-100" />
                      <div className="h-2.5 w-1/2 animate-pulse rounded bg-slate-100" />
                    </div>
                  </div>
                )
              )}
            </div>
          ) : filtered.length ? (
            filtered.map((item) => (
              <NotificationItem
                key={item.id}
                item={item}
                onRead={onMarkRead}
                onOpen={handleOpen}
              />
            ))
          ) : (
            <EmptyState
              unreadOnly={
                tab === "unread"
              }
            />
          )}
        </div>

        <footer className="flex items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/50 px-4 py-3">
          <div>
            <p className="text-[9px] font-medium text-slate-400">
              {notifications.length} notifikasi
            </p>
            {lastUpdated && (
              <p className="mt-0.5 text-[8px] text-slate-300">
                Diperbarui{" "}
                {new Intl.DateTimeFormat(
                  "id-ID",
                  {
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                ).format(
                  new Date(
                    lastUpdated
                  )
                )}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              onRefresh?.()
            }
            disabled={isLoading}
            className="ui-toolbar-button h-8"
          >
            {isLoading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-[#ef4d45]" />
            ) : (
              <BellIcon className="h-3.5 w-3.5" />
            )}
            Perbarui
          </button>
        </footer>
      </aside>
    </div>
  );

  return createPortal(
    content,
    document.body
  );
}
