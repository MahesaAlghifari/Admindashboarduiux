import {
  Bell,
  User,
  LogOut,
  Settings,
  Menu,
  LayoutGrid,
  Users,
  GraduationCap,
  Wallet,
  BarChart,
  CalendarDays,
  ShieldCheck
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useNavigate, useLocation } from "react-router-dom" 

export default function Header({
  unreadCount = 0,
  onOpenNotifications,
  onOpenSidebar,
}) {
  const navigate = useNavigate()
  const location = useLocation() 
  
  // STATE
  const [openProfile, setOpenProfile] = useState(false) // Desktop Toggle
  const [openMobileProfile, setOpenMobileProfile] = useState(false) // Mobile Toggle (Pisahkan state agar tidak bentrok)
  
  const [imageError, setImageError] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  
  // REFS (PISAHKAN AGAR TIDAK KONFLIK)
  const profileRef = useRef(null)       // Untuk Desktop
  const mobileProfileRef = useRef(null) // Untuk Mobile

  // --- 1. CONFIGURATION ---
  const routeConfig = {
    "/dashboard": { label: "Dashboard", subtitle: "Ringkasan aktivitas", icon: LayoutGrid },
    "/manajemen-pengguna": { label: "Manajemen Pengguna", subtitle: "Kelola data siswa & staff", icon: Users },
    "/administrasi": { label: "Administrasi Akademik", subtitle: "Data akademik & kurikulum", icon: GraduationCap },
    "/kegiatan": { label: "Kegiatan Siswa", subtitle: "Jadwal kegiatan", icon: CalendarDays },
    "/keuangan": { label: "Manajemen Keuangan", subtitle: "Laporan & transaksi", icon: Wallet },
    "/laporan": { label: "Laporan & Analisa", subtitle: "Insight sistem", icon: BarChart },
    "/pengaturan": { label: "Pengaturan Sistem", subtitle: "Konfigurasi aplikasi", icon: Settings },
    "/profile": { label: "Profil Saya", subtitle: "Informasi akun", icon: User },
  }

  const currentPath = location.pathname
  const meta = routeConfig[currentPath] || routeConfig["/dashboard"]
  const ActiveIcon = meta.icon

  // --- 2. LOAD DATA ---
  useEffect(() => {
    const session = localStorage.getItem("user_session")
    if (session) {
      try {
        setCurrentUser(JSON.parse(session))
      } catch (e) {
        console.error("Gagal parsing user", e)
      }
    }
  }, [])

  // --- HANDLE CLICK OUTSIDE (DIPISAH) ---
  useEffect(() => {
    const handler = (e) => {
      // Cek Desktop
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setOpenProfile(false)
      }
      // Cek Mobile
      if (mobileProfileRef.current && !mobileProfileRef.current.contains(e.target)) {
        setOpenMobileProfile(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleLogout = () => {
    if (window.confirm("Apakah Anda yakin ingin keluar?")) {
      localStorage.removeItem("user_session")
      navigate("/login", { replace: true })
    }
  }

  const displayName = currentUser?.pribadi?.nama_lengkap || "Pengguna"
  const displayRole = currentUser?.kepegawaian?.jabatan || "Staff"
  const displayPhoto = currentUser?.pribadi?.foto || null

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-slate-200 shadow-sm">
      
      {/* ================= MOBILE HEADER ================= */}
      <div className="flex md:hidden items-center justify-between px-4 py-3">
        <button onClick={onOpenSidebar} className="p-2 rounded-lg hover:bg-slate-50 text-slate-600">
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <ActiveIcon className="w-5 h-5 text-[#E94640] shrink-0" />
          <h2 className="text-base font-bold text-slate-800 truncate">{meta.label}</h2>
        </div>

        {/* MOBILE PROFILE DROPDOWN */}
        <div className="relative" ref={mobileProfileRef}>
             <button 
                onClick={() => setOpenMobileProfile(!openMobileProfile)}
                className="w-8 h-8 rounded-full overflow-hidden border border-slate-200"
             >
                {displayPhoto ? (
                    <img src={displayPhoto} className="w-full h-full object-cover" alt="Avatar" onError={(e) => e.target.style.display='none'} />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <User className="w-4 h-4 text-slate-400" />
                    </div>
                )}
             </button>
             
             {openMobileProfile && (
                 <div className="absolute right-0 top-10 w-48 bg-white border border-slate-200 rounded-lg shadow-xl py-2 z-50 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 mb-1">
                        <p className="text-xs font-bold text-slate-800 truncate">{displayName}</p>
                    </div>
                    <button onClick={() => { navigate('/profile'); setOpenMobileProfile(false); }} className="w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2">
                        <User className="w-4 h-4"/> Profil Saya
                    </button>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2">
                        <LogOut className="w-4 h-4"/> Keluar
                    </button>
                 </div>
             )}
        </div>
      </div>

      {/* ================= DESKTOP HEADER ================= */}
      <div className="hidden md:flex items-center justify-between px-8 py-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm">
            <ActiveIcon className="w-6 h-6 text-[#E94640]" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{meta.label}</h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">{meta.subtitle}</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button onClick={onOpenNotifications} className="relative p-2.5 hover:bg-slate-50 rounded-xl transition-all group">
            <Bell className="w-6 h-6 text-slate-400 group-hover:text-slate-600 transition-colors" />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2.5 w-2.5 h-2.5 bg-[#E94640] rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          <div className="h-8 w-px bg-slate-200"></div>

          {/* DESKTOP PROFILE DROPDOWN */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setOpenProfile(!openProfile)}
              className="flex items-center gap-3 p-1.5 pr-3 hover:bg-slate-50 rounded-full border border-transparent hover:border-slate-100 transition-all"
            >
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 border border-slate-200">
                {displayPhoto && !imageError ? (
                  <img src={displayPhoto} alt="Profile" className="w-full h-full object-cover" onError={() => setImageError(true)} />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-slate-100">
                    <User className="w-5 h-5 text-slate-400" />
                  </div>
                )}
              </div>
              <div className="text-left hidden lg:block">
                <p className="text-sm font-bold text-slate-800 leading-none mb-1">{displayName.split(',')[0]}</p>
                <p className="text-xs text-slate-500 font-medium">{displayRole}</p>
              </div>
              <ShieldCheck className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${openProfile ? 'rotate-180' : ''}`} />
            </button>

            {openProfile && (
              <div className="absolute right-0 mt-3 w-60 bg-white border border-slate-100 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50 ring-1 ring-black/5">
                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50">
                   <p className="text-sm font-bold text-slate-800">{displayName}</p>
                   <p className="text-xs text-slate-500">{currentUser?.kontak?.email || displayRole}</p>
                </div>
                <div className="p-2">
                    <button onClick={() => { navigate("/profile"); setOpenProfile(false); }} className="w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                      <User className="w-4 h-4 text-slate-400" /> Profil Saya
                    </button>
                    <button onClick={() => { navigate("/pengaturan"); setOpenProfile(false); }} className="w-full px-3 py-2.5 text-left text-sm font-medium rounded-lg hover:bg-slate-50 flex items-center gap-3 text-slate-700 transition-colors">
                      <Settings className="w-4 h-4 text-slate-400" /> Pengaturan
                    </button>
                </div>
                <div className="border-t border-slate-100 p-2">
                    <button onClick={handleLogout} className="w-full px-3 py-2.5 text-left text-sm font-bold rounded-lg hover:bg-red-50 text-red-600 flex items-center gap-3 transition-colors">
                      <LogOut className="w-4 h-4" /> Keluar
                    </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}