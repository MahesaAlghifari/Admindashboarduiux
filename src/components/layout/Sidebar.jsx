import { NavLink } from "react-router-dom"
import { useState } from "react"
import {
  School,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
  LayoutGrid,
  Users,
  UserCog,
  Wallet,
  Settings,
  BarChart,
  Menu,
  X,
} from "lucide-react"

const menuItems = [
  { path: "/dashboard", icon: LayoutGrid, label: "Dashboard" },
  { path: "/pengguna", icon: Users, label: "Pengguna" },
  { path: "/manajemen-pengguna", icon: UserCog, label: "Pengguna" },
  { path: "/administrasi", icon: BookOpen, label: "Administrasi" }, 
  { path: "/kegiatan", icon: ClipboardCheck, label: "Kegiatan" },  
  { path: "/keuangan", icon: Wallet, label: "Keuangan" },
  { path: "/laporan", icon: BarChart, label: "Laporan" },
  { path: "/pengaturan", icon: Settings, label: "Pengaturan" },
]

function SidebarContent({ onNavigate }) {
  return (
    <nav className="flex flex-col items-center gap-3 py-6">
      {menuItems.map(({ path, icon: Icon, label }) => (
        <NavLink
          key={path}
          to={path}
          onClick={onNavigate}
          title={label}
          className={({ isActive }) =>
            `
            w-12 h-12 flex items-center justify-center rounded-xl
            transition-all duration-200 group relative
            ${isActive
              ? "bg-white/25 text-white shadow-md backdrop-blur-sm"
              : "text-white/80 hover:bg-white/15 hover:text-white"
            }
            `
          }
        >
          <Icon className="w-5 h-5" />
        </NavLink>
      ))}
    </nav>
  )
}

export default function Sidebar() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      {/* HAMBURGER (MOBILE) */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-[#EB4C42] text-white shadow hover:bg-[#d63d38] transition-colors"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* OVERLAY */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/40 z-40 md:hidden backdrop-blur-sm transition-opacity"
        />
      )}

      {/* MOBILE DRAWER */}
      <aside
        className={`
          fixed top-0 left-0 z-50 h-screen
          w-[80vw] max-w-[280px]
          bg-[#EB4C42]
          transform transition-transform duration-300 ease-in-out
          md:hidden shadow-2xl
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div className="flex justify-between items-center px-6 py-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <School className="text-white w-5 h-5" />
            </div>
            <span className="text-white font-bold text-lg">Menu</span>
          </div>
          <button onClick={() => setMobileOpen(false)} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="px-4">
          <SidebarContent onNavigate={() => setMobileOpen(false)} />
        </div>
      </aside>

      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen w-20 bg-[#EB4C42] flex-col items-center py-6 shadow-xl z-40">
        {/* LOGO (SEKOLAH) */}
        <div className="mb-8">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
            <School className="text-white w-6 h-6" />
          </div>
        </div>

        {/* MENU */}
        <SidebarContent />
      </aside>
    </>
  )
}