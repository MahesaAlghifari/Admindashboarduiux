import React from 'react';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  BookOpen,
  Wallet,
  Settings,
  BarChart3,
  LogOut,
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  activeMenu: string;
  onMenuClick: (menu: string) => void;
  isMobileOpen: boolean;
  onMobileToggle: () => void;
}

const menuItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'karyawan', icon: Users, label: 'Manajemen Karyawan' },
  { id: 'siswa', icon: GraduationCap, label: 'Manajemen Siswa' },
  { id: 'pengguna', icon: UserCog, label: 'Manajemen Pengguna' },
  { id: 'akademik', icon: BookOpen, label: 'Akademik' },
  { id: 'keuangan', icon: Wallet, label: 'Keuangan' },
  { id: 'pengaturan', icon: Settings, label: 'Pengaturan' },
  { id: 'laporan', icon: BarChart3, label: 'Laporan & Analisa' },
];

export function Sidebar({ activeMenu, onMenuClick, isMobileOpen, onMobileToggle }: SidebarProps) {
  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={onMobileToggle}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white rounded-lg shadow-md"
      >
        {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onMobileToggle}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
          fixed lg:sticky top-0 left-0 h-screen brand-gradient z-40
          flex flex-col items-center py-6 px-3 gap-2
          transition-transform duration-300 lg:translate-x-0
          ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="mb-6 p-3 bg-white/10 rounded-2xl backdrop-blur-sm">
          <GraduationCap className="w-8 h-8 text-white" />
        </div>

        {/* Menu Items */}
        <div className="flex-1 flex flex-col gap-2 w-full">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeMenu === item.id;

            return (
              <div key={item.id} className="relative group">
                <button
                  onClick={() => {
                    onMenuClick(item.id);
                    if (isMobileOpen) onMobileToggle();
                  }}
                  className={`
                    w-full p-3 rounded-2xl transition-all duration-200
                    flex items-center justify-center
                    hover:bg-white/10 hover:shadow-lg
                    ${isActive ? 'bg-white/20 shadow-lg' : ''}
                  `}
                >
                  <Icon className="w-6 h-6 text-white" />
                </button>

                {/* Tooltip */}
                <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
                  {item.label}
                  <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-gray-900" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Logout */}
        <div className="relative group">
          <button
            onClick={() => onMenuClick('logout')}
            className="w-full p-3 rounded-2xl transition-all duration-200 flex items-center justify-center hover:bg-white/10 hover:shadow-lg"
          >
            <LogOut className="w-6 h-6 text-white" />
          </button>

          <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none z-50">
            Keluar
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-8 border-transparent border-r-gray-900" />
          </div>
        </div>
      </div>
    </>
  );
}
