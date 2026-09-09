import {
  useEffect,
  useState,
} from "react";
import {
  Outlet,
  useLocation,
} from "react-router-dom";
import Header from "../components/layout/Header";
import Footer from "../components/layout/Footer";
import Sidebar from "../components/layout/Sidebar";
import Breadcrumb from "../components/ui/Breadcrumb";
import NotificationModal from "../components/common/NotificationModal";
import { useNotifications } from "../hooks/useNotifications";
import { useAuth } from "../auth/useAuth";

const SIDEBAR_KEY =
  "sidebar-expanded";

export default function DashboardLayout() {
  const location = useLocation();
  const { user } = useAuth();

  const [
    sidebarExpanded,
    setSidebarExpanded,
  ] = useState(() => {
    try {
      const saved =
        localStorage.getItem(
          SIDEBAR_KEY
        );

      return saved === null
        ? true
        : saved === "true";
    } catch {
      return true;
    }
  });

  const [
    mobileSidebarOpen,
    setMobileSidebarOpen,
  ] = useState(false);

  const [openNotif, setOpenNotif] =
    useState(false);

  const headerUser = {
    ...user,
    name:
      user?.fullname ||
      user?.nama_lengkap ||
      user?.pribadi?.nama_lengkap ||
      user?.name ||
      "Pengguna",
    role:
      user?.position ||
      user?.jabatan ||
      user?.kepegawaian?.jabatan ||
      user?.role ||
      "Pengguna",
    photo:
      user?.photo ||
      user?.foto ||
      user?.pribadi?.foto ||
      "",
  };

  const activeMenu =
    location.pathname.split("/")[1] ||
    "dashboard";

  const {
    notifications,
    unreadCount,
    markRead,
    markAllRead,
    refresh,
    isLoading,
    error,
    lastUpdated,
  } = useNotifications();

  useEffect(() => {
    try {
      localStorage.setItem(
        SIDEBAR_KEY,
        String(sidebarExpanded)
      );
    } catch {}
  }, [sidebarExpanded]);

  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div
      style={{
        "--sidebar-width":
          sidebarExpanded
            ? "248px"
            : "80px",
      }}
      className="min-h-dvh overflow-x-hidden bg-[#F6F7F9]"
    >
      <Sidebar
        role={user?.role}
        expanded={sidebarExpanded}
        onToggle={() =>
          setSidebarExpanded(
            (value) => !value
          )
        }
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() =>
          setMobileSidebarOpen(false)
        }
      />

      <div className="flex min-h-dvh min-w-0 flex-col bg-[#F6F7F9] transition-[margin-left] duration-300 ease-out md:ml-[var(--sidebar-width)]">
        <Header
          activeMenu={activeMenu}
          setActiveMenu={() => {}}
          user={headerUser}
          unreadCount={unreadCount}
          onOpenNotifications={() =>
            setOpenNotif(true)
          }
          onOpenSidebar={() =>
            setMobileSidebarOpen(true)
          }
        />

        <div className="shrink-0 px-4 pt-4 sm:px-6 lg:px-8">
          <Breadcrumb />
        </div>

        <main className="app-ui relative min-w-0 flex-1 px-4 pb-6 pt-4 sm:px-6 lg:px-8">
          <div className="min-w-0 rounded-xl bg-white p-4 shadow-sm sm:p-6">
            <Outlet />
          </div>
        </main>

        <Footer />
      </div>

      <NotificationModal
        isOpen={openNotif}
        onClose={() =>
          setOpenNotif(false)
        }
        notifications={notifications}
        unreadCount={unreadCount}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onRefresh={refresh}
        isLoading={isLoading}
        error={error}
        lastUpdated={lastUpdated}
      />
    </div>
  );
}
