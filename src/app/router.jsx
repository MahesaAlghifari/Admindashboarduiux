import { Routes, Route, Navigate, Outlet } from "react-router-dom";

import AuthLayout from "../layout/AuthLayout";
import DashboardLayout from "../layout/DashboardLayout";
import LoginPage from "../pages/auth/LoginPage";
import DashboardPage from "../pages/dashboard/DashboardPage";
import NotFoundPage from "../pages/not-found/NotFoundPage";
import UserManagement from "../pages/manajemen-pengguna";
import AdministrasiAkademik from "../pages/administrasi";
import KegiatanSiswa from "../pages/kegiatan";
import ManajemenPengguna from "../pages/Pengguna";
import ProfilePage from "../pages/profile/ProfilePage";
import FinancePage from "../pages/keuangan";
import LaporanPage from "../pages/laporan/LaporanPage";

// --- GUARD COMPONENTS ---

// 1. PrivateRoute: Hanya bisa diakses jika sudah login
const PrivateRoute = () => {
  const userSession = localStorage.getItem("user_session");
  return userSession ? <Outlet /> : <Navigate to="/login" replace />;
};

// 2. PublicRoute: Hanya bisa diakses jika BELUM login
const PublicRoute = () => {
  const userSession = localStorage.getItem("user_session");
  return userSession ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default function AppRouter() {
  return (
    <Routes>
      {/* --- PUBLIC ROUTES (Login) --- */}
      <Route element={<PublicRoute />}>
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Route>

      {/* --- PROTECTED ROUTES (Dashboard) --- */}
      <Route element={<PrivateRoute />}>
        {/* CUKUP SATU DashboardLayout DI SINI */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/manajemen-pengguna" element={<UserManagement />} />
          <Route path="/pengguna" element={<ManajemenPengguna />} />
          
          {/* Routes Akademik */}
          <Route path="/administrasi" element={<AdministrasiAkademik />} />
          <Route path="/kegiatan" element={<KegiatanSiswa />} />

          {/* Halaman Lain */}
          <Route path="/keuangan" element={<div className="p-8"><FinancePage /></div>} />
          <Route path="/pengaturan" element={<div className="p-8">Halaman Pengaturan (Under Construction)</div>} />
          <Route path="/laporan" element={<div className="p-8"><LaporanPage /></div>} />
          
          {/* PERBAIKAN: Profile diletakkan langsung di sini, jangan dibungkus DashboardLayout lagi */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>

      {/* --- DEFAULT REDIRECT --- */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      {/* --- 404 NOT FOUND --- */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}