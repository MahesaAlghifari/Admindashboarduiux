import { useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  BarChart,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  LayoutGrid,
  School,
  Settings,
  UserCog,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useAuth } from "../../auth/useAuth";
import {
  canAccess,
  FEATURE,
  subscribeAccessControl,
} from "../../auth/accessControl";
import { useState } from "react";

const menuItems = [
  { path: "/dashboard", icon: LayoutGrid, label: "Dashboard", feature: FEATURE.DASHBOARD },
  { path: "/pengguna", icon: Users, label: "Data Pengguna", feature: FEATURE.USERS },
  { path: "/manajemen-pengguna", icon: UserCog, label: "Manajemen Pengguna", feature: FEATURE.USER_MANAGEMENT },
  { path: "/administrasi", icon: BookOpen, label: "Administrasi", feature: FEATURE.ADMINISTRATION },
  { path: "/kegiatan", icon: ClipboardCheck, label: "Akademik", feature: FEATURE.ACADEMIC },
  { path: "/keuangan", icon: Wallet, label: "Keuangan", feature: FEATURE.FINANCE },
  { path: "/laporan", icon: BarChart, label: "Laporan", feature: FEATURE.REPORTS },
  { path: "/pengaturan", icon: Settings, label: "Pengaturan", feature: FEATURE.SETTINGS },
];

function MenuItems({ expanded = true, onNavigate, user }) {
  return (
    <nav aria-label="Navigasi utama" className="space-y-1 px-3">
      {menuItems
        .filter((item) => canAccess(user, item.feature))
        .map(({ path, icon: Icon, label }) => (
          <NavLink
            key={path}
            to={path}
            onClick={onNavigate}
            title={!expanded ? label : undefined}
            className={({ isActive }) =>
              `group relative flex h-11 items-center rounded-xl transition ${
                expanded ? "gap-3 px-3" : "justify-center"
              } ${
                isActive
                  ? "bg-white text-[#ef4d45] shadow-sm"
                  : "text-white/80 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <Icon className="h-4.75 w-4.75 shrink-0" />
            {expanded && (
              <span className="min-w-0 flex-1 truncate text-[13px] font-semibold">
                {label}
              </span>
            )}
            {!expanded && (
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-100 -translate-y-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] font-medium text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                {label}
              </span>
            )}
          </NavLink>
        ))}
    </nav>
  );
}

export default function Sidebar({
  expanded,
  onToggle,
  mobileOpen = false,
  onCloseMobile,
}) {
  const { user } = useAuth();
  const [, setAccessVersion] = useState(0);

  useEffect(
    () => subscribeAccessControl(() => setAccessVersion((value) => value + 1)),
    []
  );

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") onCloseMobile?.();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [mobileOpen, onCloseMobile]);

  return (
    <>
      <button
        type="button"
        aria-label="Tutup menu"
        aria-hidden={!mobileOpen}
        tabIndex={mobileOpen ? 0 : -1}
        onClick={onCloseMobile}
        className={`fixed inset-0 z-70 bg-slate-950/40 backdrop-blur-[2px] transition md:hidden ${
          mobileOpen
            ? "visible opacity-100"
            : "pointer-events-none invisible opacity-0"
        }`}
      />

      <aside
        aria-label="Navigasi mobile"
        aria-hidden={!mobileOpen}
        className={`fixed inset-y-0 left-0 z-80 flex w-[min(84vw,288px)] flex-col bg-[#ef4d45] shadow-2xl transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-18 shrink-0 items-center justify-between border-b border-white/10 px-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/15">
              <School className="h-5 w-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">School Sphere</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[.14em] text-white/50">
                Management System
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Tutup menu"
            className="flex h-9 w-9 items-center justify-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">
          <MenuItems expanded user={user} onNavigate={onCloseMobile} />
        </div>
      </aside>

      <aside
        aria-label="Navigasi desktop"
        className={`fixed inset-y-0 left-0 z-50 hidden flex-col bg-[#ef4d45] shadow-xl transition-[width] duration-300 ease-out md:flex ${
          expanded ? "w-62" : "w-20"
        }`}
      >
        <div
          className={`flex h-19 shrink-0 items-center border-b border-white/10 ${
            expanded ? "gap-3 px-4" : "justify-center"
          }`}
        >
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/15">
            <School className="h-5.5 w-5.5 text-white" />
          </div>
          {expanded && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">School Sphere</p>
              <p className="mt-0.5 truncate text-[9px] font-semibold uppercase tracking-[.12em] text-white/50">
                Management System
              </p>
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-4 scrollbar-none [&::-webkit-scrollbar]:hidden">
          <MenuItems expanded={expanded} user={user} />
        </div>

        <div className="shrink-0 border-t border-white/10 p-3">
          {expanded && (
            <p className="mb-2 px-2 text-[10px] text-white/40">Navigasi</p>
          )}

          <button
            type="button"
            onClick={onToggle}
            aria-label={expanded ? "Ciutkan sidebar" : "Perluas sidebar"}
            title={!expanded ? "Perluas sidebar" : undefined}
            className={`flex h-10 w-full items-center rounded-xl text-white/80 transition hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-white/30 ${
              expanded ? "gap-3 px-3" : "justify-center"
            }`}
          >
            {expanded ? (
              <ChevronLeft className="h-4.5 w-4.5 shrink-0" />
            ) : (
              <ChevronRight className="h-4.5 w-4.5 shrink-0" />
            )}
            {expanded && (
              <span className="text-[12px] font-semibold">Ciutkan Sidebar</span>
            )}
          </button>
        </div>
      </aside>
    </>
  );
}
