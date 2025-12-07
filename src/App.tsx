import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Dashboard } from './components/pages/Dashboard';
import { Karyawan } from './components/pages/Karyawan';
import { Siswa } from './components/pages/Siswa';
import { Pengguna } from './components/pages/Pengguna';
import { PenggunaUpdated } from './components/pages/PenggunaUpdated';
import { Akademik } from './components/pages/Akademik';
import { Keuangan } from './components/pages/Keuangan';
import { Pengaturan } from './components/pages/Pengaturan';
import { Laporan } from './components/pages/Laporan';
import { Login } from './components/pages/Login';
import { Profile } from './components/pages/Profile';
import { NotificationPopup } from './components/NotificationPopup';
import { User, Bell } from 'lucide-react';

type ActiveMenu =
  | 'dashboard'
  | 'karyawan'
  | 'siswa'
  | 'pengguna'
  | 'akademik'
  | 'keuangan'
  | 'pengaturan'
  | 'laporan'
  | 'profile'
  | 'logout';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeMenu, setActiveMenu] = useState<ActiveMenu>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const handleMenuClick = (menu: string) => {
    if (menu === 'logout') {
      if (confirm('Apakah Anda yakin ingin keluar?')) {
        setIsLoggedIn(false);
        setActiveMenu('dashboard');
      }
    } else {
      setActiveMenu(menu as ActiveMenu);
      setIsMobileOpen(false);
    }
  };

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#F6F7F9] flex">
      {/* Sidebar */}
      <Sidebar
        activeMenu={activeMenu}
        onMenuClick={handleMenuClick}
        isMobileOpen={isMobileOpen}
        onMobileToggle={() => setIsMobileOpen(!isMobileOpen)}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Top Navbar */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 sm:px-6 py-4 sticky top-0 z-20">
          <div className="flex items-center justify-between">
            <div className="flex-1 lg:ml-0 ml-12">
              <h2 className="text-[#0F172A] text-lg sm:text-xl">
                {activeMenu === 'dashboard' && 'Dashboard'}
                {activeMenu === 'karyawan' && 'Manajemen Karyawan'}
                {activeMenu === 'siswa' && 'Manajemen Siswa'}
                {activeMenu === 'pengguna' && 'Manajemen Pengguna'}
                {activeMenu === 'akademik' && 'Akademik'}
                {activeMenu === 'keuangan' && 'Manajemen Keuangan'}
                {activeMenu === 'pengaturan' && 'Pengaturan Sistem'}
                {activeMenu === 'laporan' && 'Laporan & Analisa'}
                {activeMenu === 'profile' && 'Profil Saya'}
              </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Notifications */}
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 hover:bg-[#F6F7F9] rounded-lg transition-colors"
              >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-[#64748B]" />
                <span className="absolute top-1 right-1 w-2 h-2 bg-[#EF4444] rounded-full" />
              </button>

              {/* User Profile */}
              <button
                onClick={() => setActiveMenu('profile')}
                className="flex items-center gap-2 sm:gap-3 p-2 hover:bg-[#F6F7F9] rounded-lg transition-colors"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 brand-gradient rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
                </div>
                <div className="text-left hidden md:block">
                  <p className="text-[#0F172A] text-sm">Admin</p>
                  <p className="text-[#64748B] text-xs">Administrator</p>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Notification Popup */}
        <NotificationPopup
          isOpen={showNotifications}
          onClose={() => setShowNotifications(false)}
        />

        {/* Page Content */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto">
          {activeMenu === 'dashboard' && <Dashboard />}
          {activeMenu === 'karyawan' && <Karyawan />}
          {activeMenu === 'siswa' && <Siswa />}
          {activeMenu === 'pengguna' && <PenggunaUpdated />}
          {activeMenu === 'akademik' && <Akademik />}
          {activeMenu === 'keuangan' && <Keuangan />}
          {activeMenu === 'pengaturan' && <Pengaturan />}
          {activeMenu === 'laporan' && <Laporan />}
          {activeMenu === 'profile' && <Profile />}
        </div>

        {/* Footer */}
        <div className="bg-white border-t border-[#E5E7EB] px-4 sm:px-6 py-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[#64748B] text-xs sm:text-sm text-center md:text-left">
              © 2024 PAUD Yayasan Suci Sutjipto. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-[#64748B] text-xs sm:text-sm">
              <button className="hover:text-[#E94640] transition-colors">Help</button>
              <span>•</span>
              <button className="hover:text-[#E94640] transition-colors">Privacy</button>
              <span>•</span>
              <button className="hover:text-[#E94640] transition-colors">Terms</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}