import {
  BarChart,
  Bell,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  LayoutGrid,
  LogOut,
  Menu,
  Settings,
  User,
  Users,
  Wallet,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import {
  canAccess,
  FEATURE,
  subscribeAccessControl,
} from "../../auth/accessControl";

const ROUTE_CONFIG = {
  "/dashboard": {
    label: "Dashboard",
    subtitle: "Pantau aktivitas dan informasi utama sekolah",
    icon: LayoutGrid,
  },
  "/manajemen-pengguna": {
    label: "Manajemen Pengguna",
    subtitle: "Kelola akses, akun, dan penempatan pengguna",
    icon: Users,
  },
  "/pengguna": {
    label: "Data Pengguna",
    subtitle: "Kelola data siswa, staff, dan guru",
    icon: Users,
  },
  "/administrasi": {
    label: "Administrasi Akademik",
    subtitle: "Kelola data akademik dan kurikulum",
    icon: GraduationCap,
  },
  "/kegiatan": {
    label: "Kegiatan Siswa",
    subtitle: "Kelola aktivitas dan perkembangan siswa",
    icon: CalendarDays,
  },
  "/keuangan": {
    label: "Manajemen Keuangan",
    subtitle: "Pantau transaksi dan laporan keuangan",
    icon: Wallet,
  },
  "/laporan": {
    label: "Laporan dan Analisis",
    subtitle: "Tinjau laporan dan wawasan operasional",
    icon: BarChart,
  },
  "/pengaturan": {
    label: "Pengaturan Sistem",
    subtitle: "Kelola preferensi dan konfigurasi aplikasi",
    icon: Settings,
  },
  "/profile": {
    label: "Profil Saya",
    subtitle: "Kelola informasi profil dan keamanan akun",
    icon: User,
  },
};

const displayNameOf = (user) =>
  user?.fullname ||
  user?.name ||
  user?.employee?.fullname ||
  user?.staff?.fullname ||
  user?.pribadi?.nama_lengkap ||
  user?.nik ||
  "Pengguna";

const displayRoleOf = (user, role) =>
  user?.position ||
  user?.position_name ||
  user?.jobtitle ||
  user?.employee?.position ||
  user?.staff?.position ||
  user?.kepegawaian?.jabatan ||
  user?.role ||
  role ||
  "Staff";

const displayPhotoOf = (user) =>
  user?.photo ||
  user?.employee?.photo ||
  user?.staff?.photo ||
  user?.pribadi?.foto ||
  null;

const isEmbeddedPhoto = (value) =>
  /^data:image\//i.test(String(value ?? "").trim());

const avatarUrl = (value, size = 32) => {
  const source = String(value ?? "").trim();

  if (!source) return "";

  try {
    const url = new URL(source);

    if (
      url.hostname === "i.pravatar.cc"
    ) {
      url.pathname = `/${size}`;
      return url.toString();
    }
  } catch {}

  return source;
};

const isResizableAvatar = (value) => {
  try {
    return (
      new URL(
        String(value ?? "").trim()
      ).hostname === "i.pravatar.cc"
    );
  } catch {
    return false;
  }
};

const initialsOf = (value) =>
  String(value ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");

const displayEmailOf = (user) =>
  user?.email ||
  user?.employee?.email ||
  user?.staff?.email ||
  user?.kontak?.email ||
  "";

export default function Header({
  unreadCount = 0,
  onOpenNotifications,
  onOpenSidebar,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, role, logout } = useAuth();
  const [openProfile, setOpenProfile] = useState(false);
  const [openMobileProfile, setOpenMobileProfile] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [, setAccessVersion] = useState(0);
  const profileRef = useRef(null);
  const mobileProfileRef = useRef(null);

  const path =
    location.pathname.length > 1
      ? location.pathname.replace(/\/+$/g, "")
      : location.pathname;
  const routeKey = path.startsWith("/administrasi/")
    ? "/administrasi"
    : path;
  const meta = ROUTE_CONFIG[routeKey] || ROUTE_CONFIG["/dashboard"];
  const ActiveIcon = meta.icon;
  const displayName = displayNameOf(user);
  const displayRole = displayRoleOf(user, role);
  const displayPhoto = displayPhotoOf(user);
  const safeDisplayPhoto =
    displayPhoto && !isEmbeddedPhoto(displayPhoto)
      ? displayPhoto
      : null;
  const displayInitials = initialsOf(displayName);
  const avatar1x = avatarUrl(
    safeDisplayPhoto,
    32
  );
  const avatar2x = avatarUrl(
    safeDisplayPhoto,
    64
  );
  const avatarSrcSet =
    safeDisplayPhoto &&
    isResizableAvatar(safeDisplayPhoto)
      ? `${avatar1x} 1x, ${avatar2x} 2x`
      : undefined;
  const displayEmail = displayEmailOf(user);
  const canOpenProfile = canAccess(user, FEATURE.PROFILE);
  const canOpenSettings = canAccess(user, FEATURE.SETTINGS);

  useEffect(
    () => subscribeAccessControl(() => setAccessVersion((value) => value + 1)),
    []
  );

  useEffect(() => {
    setImageError(false);
  }, [safeDisplayPhoto]);

  useEffect(() => {
    const handleMouseDown = (event) => {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setOpenProfile(false);
      }
      if (
        mobileProfileRef.current &&
        !mobileProfileRef.current.contains(event.target)
      ) {
        setOpenMobileProfile(false);
      }
    };

    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, []);

  useEffect(() => {
    setOpenProfile(false);
    setOpenMobileProfile(false);
  }, [location.pathname, location.search]);

  const closeProfileMenus = () => {
    setOpenProfile(false);
    setOpenMobileProfile(false);
  };

  const handleLogout = () => {
    if (!window.confirm("Apakah Anda yakin ingin keluar?")) return;
    closeProfileMenus();
    logout();
    navigate("/login", { replace: true });
  };

  const handleProfile = () => {
    if (!canOpenProfile) return;
    closeProfileMenus();
    navigate("/profile");
  };

  const handleSettings = () => {
    if (!canOpenSettings) return;
    closeProfileMenus();
    navigate("/pengaturan");
  };

  const avatar = (
    <div className="h-full w-full overflow-hidden bg-slate-100">
      {safeDisplayPhoto && !imageError ? (
        <img
          src={avatar1x}
          srcSet={avatarSrcSet}
          sizes="32px"
          alt={displayName}
          width="32"
          height="32"
          decoding="async"
          loading="eager"
          fetchPriority="low"
          className="h-full w-full object-cover"
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center">
          {displayInitials ? (
            <span className="text-[9px] font-semibold tracking-wide text-slate-500">
              {displayInitials}
            </span>
          ) : (
            <User className="h-4 w-4 text-slate-400" />
          )}
        </div>
      )}
    </div>
  );

  const profileActions = (
    <>
      {(canOpenProfile || canOpenSettings) && (
        <div className="p-1.5">
          {canOpenProfile && (
            <button
              type="button"
              onClick={handleProfile}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
            >
              <User className="h-3.5 w-3.5 text-slate-400" />
              Profil Saya
            </button>
          )}
          {canOpenSettings && (
            <button
              type="button"
              onClick={handleSettings}
              className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs text-slate-600 hover:bg-slate-50"
            >
              <Settings className="h-3.5 w-3.5 text-slate-400" />
              Pengaturan
            </button>
          )}
        </div>
      )}
      <div className="border-t border-slate-100 p-1.5">
        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-semibold text-red-500 hover:bg-red-50"
        >
          <LogOut className="h-3.5 w-3.5" />
          Keluar
        </button>
      </div>
    </>
  );

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between px-4 md:hidden">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 transition-colors hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-100"
          aria-label="Buka menu"
        >
          <Menu className="h-4 w-4" />
        </button>

        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-red-50">
            <ActiveIcon className="h-3.5 w-3.5 text-[#ef4d45]" />
          </div>
          <h2 className="truncate text-[13px] font-semibold text-slate-700">
            {meta.label}
          </h2>
        </div>

        <div ref={mobileProfileRef} className="relative">
          <button
            type="button"
            onClick={() => setOpenMobileProfile((value) => !value)}
            className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200"
            aria-label="Menu profil"
            aria-expanded={openMobileProfile}
          >
            {avatar}
          </button>

          {openMobileProfile && (
            <div className="absolute right-0 top-10 z-50 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              <div className="border-b border-slate-100 px-3 py-2.5">
                <p className="truncate text-xs font-semibold text-slate-700">
                  {displayName}
                </p>
                <p className="mt-0.5 truncate text-[10px] text-slate-400">
                  {displayRole}
                </p>
              </div>
              {profileActions}
            </div>
          )}
        </div>
      </div>

      <div className="hidden h-17 items-center justify-between px-6 md:flex lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-red-100 bg-red-50">
            <ActiveIcon className="h-4.25 w-4.25 text-[#ef4d45]" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-5 text-slate-800">
              {meta.label}
            </h1>
            <p className="mt-0.5 truncate text-[11px] font-normal leading-4 text-slate-400">
              {meta.subtitle}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenNotifications}
            className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-600"
            aria-label="Notifikasi"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-[#ef4d45] ring-2 ring-white" />
            )}
          </button>

          <div className="h-6 w-px bg-slate-200" />

          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setOpenProfile((value) => !value)}
              className="flex h-10 items-center gap-2 rounded-lg border border-transparent px-1.5 transition-colors hover:border-slate-200 hover:bg-slate-50"
              aria-expanded={openProfile}
            >
              <div className="h-8 w-8 overflow-hidden rounded-lg border border-slate-200">
                {avatar}
              </div>
              <div className="hidden min-w-0 text-left lg:block">
                <p className="max-w-40 truncate text-[11px] font-semibold leading-4 text-slate-700">
                  {displayName}
                </p>
                <p className="max-w-40 truncate text-[10px] leading-3.5 text-slate-400">
                  {displayRole}
                </p>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 text-slate-300 transition-transform duration-150 ${
                  openProfile ? "rotate-180" : ""
                }`}
              />
            </button>

            {openProfile && (
              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-100 px-3 py-2.5">
                  <p className="truncate text-xs font-semibold text-slate-700">
                    {displayName}
                  </p>
                  <p className="mt-0.5 truncate text-[10px] text-slate-400">
                    {displayEmail || displayRole}
                  </p>
                </div>
                {profileActions}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
