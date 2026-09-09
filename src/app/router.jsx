import { lazy, Suspense } from "react";
import {
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import PrivateRoute from "../auth/PrivateRoute";
import PublicRoute from "../auth/PublicRoute";
import AccessRoute from "../auth/AccessRoute";
import { FEATURE } from "../auth/accessControl";

import AuthLayout from "../layout/AuthLayout";
import DashboardLayout from "../layout/DashboardLayout";

const LoginPage = lazy(() => import("../pages/auth/LoginPage"));
const DashboardPage = lazy(() => import("../pages/dashboard/DashboardPage"));
const NotFoundPage = lazy(() => import("../pages/not-found/NotFoundPage"));

const UserManagement = lazy(() => import("../pages/manajemen-pengguna"));
const ManajemenPengguna = lazy(() => import("../pages/Pengguna"));
const AdministrasiAkademik = lazy(() => import("../pages/administrasi"));
const EditKurikulum = lazy(() => import("../pages/administrasi/kurikulum/EditKurikulum"));
const KegiatanSiswa = lazy(() => import("../pages/kegiatan"));
const FinancePage = lazy(() => import("../pages/keuangan"));
const LaporanPage = lazy(() => import("../pages/laporan"));
const ProfilePage = lazy(() => import("../pages/profile/ProfilePage"));
const SettingsPage = lazy(() => import("../pages/pengaturan"));
const AccessDeniedPage = lazy(() => import("../pages/access-denied/AccessDeniedPage"));

function RouteLoading() {
  return (
    <div className="flex min-h-60 items-center justify-center px-6 py-12">
      <div className="flex items-center gap-3 text-sm text-slate-400">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#e94640]" />
        <span>Memuat halaman...</span>
      </div>
    </div>
  );
}

export default function AppRouter() {
  return (
    <Suspense fallback={<RouteLoading />}>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route
              path="/login"
              element={<LoginPage />}
            />
          </Route>
        </Route>

        <Route element={<PrivateRoute />}>
          <Route element={<DashboardLayout />}>
            <Route
              path="/dashboard"
              element={<AccessRoute feature={FEATURE.DASHBOARD}><DashboardPage /></AccessRoute>}
            />

            <Route
              path="/manajemen-pengguna"
              element={<AccessRoute feature={FEATURE.USER_MANAGEMENT}><UserManagement /></AccessRoute>}
            />

            <Route
              path="/pengguna"
              element={<AccessRoute feature={FEATURE.USERS}><ManajemenPengguna /></AccessRoute>}
            />

            <Route
              path="/administrasi"
              element={<AccessRoute feature={FEATURE.ADMINISTRATION}><AdministrasiAkademik /></AccessRoute>}
            />

            <Route
              path="/administrasi/kurikulum/:id/edit"
              element={<AccessRoute feature={FEATURE.ADMINISTRATION}><EditKurikulum /></AccessRoute>}
            />

            <Route
              path="/kegiatan"
              element={<AccessRoute feature={FEATURE.ACADEMIC}><KegiatanSiswa /></AccessRoute>}
            />

            <Route
              path="/keuangan"
              element={<AccessRoute feature={FEATURE.FINANCE}><FinancePage /></AccessRoute>}
            />

            <Route
              path="/laporan"
              element={<AccessRoute feature={FEATURE.REPORTS}><LaporanPage /></AccessRoute>}
            />

            <Route
              path="/pengaturan"
              element={<AccessRoute feature={FEATURE.SETTINGS}><SettingsPage /></AccessRoute>}
            />

            <Route
              path="/profile"
              element={<AccessRoute feature={FEATURE.PROFILE}><ProfilePage /></AccessRoute>}
            />

            <Route path="/akses-ditolak" element={<AccessDeniedPage />} />
          </Route>
        </Route>

        <Route
          path="/"
          element={
            <Navigate
              to="/dashboard"
              replace
            />
          }
        />

        <Route
          path="*"
          element={<NotFoundPage />}
        />
      </Routes>
    </Suspense>
  );
}
