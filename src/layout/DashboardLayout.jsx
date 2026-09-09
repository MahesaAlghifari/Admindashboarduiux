import { Outlet, useLocation } from "react-router-dom"
import { useState } from "react"

import Header from "../components/layout/Header"
import Footer from "../components/layout/Footer"
import { useNotifications } from "../hooks/useNotifications"
import NotificationModal from "../components/common/NotificationModal"
import Breadcrumb from "../components/ui/Breadcrumb"
import Sidebar from "../components/layout/Sidebar"

export default function DashboardLayout() {
  const location = useLocation()

  // ===== USER (NANTI DARI AUTH) =====
  const user = {
    name: "Admin",
    role: "admin", // admin | staff | guru
    photo: "https://i.pravatar.cc/150?img=12",
  }

  // ===== ACTIVE MENU DARI URL =====
  const activeMenu = location.pathname.split("/")[1] || "dashboard"

  // ===== NOTIFICATION =====
  const { notifications, unreadCount, markAllRead } = useNotifications()
  const [openNotif, setOpenNotif] = useState(false)

  // ===== MOBILE SIDEBAR =====
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-100">
      {/* SIDEBAR */}
      <Sidebar
        role={user.role}
        mobileOpen={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* MAIN AREA */}
      <div className="md:ml-20 flex min-h-screen flex-col bg-[#F6F7F9]">
        {/* HEADER */}
        <Header
          activeMenu={activeMenu}
          setActiveMenu={() => { }}
          user={user}
          unreadCount={unreadCount}
          onOpenNotifications={() => setOpenNotif(true)}
          onOpenSidebar={() => setMobileSidebarOpen(true)}
        />

        {/* PAGE CONTENT */}


        <div className="p-4">

          <Breadcrumb />
        </div>
        <main className="relative flex-1 pb-8 px-8" >
          <div className=" rounded-xl border border-[#E5E7EB]" style={{ backgroundColor: "white" }}>

            <Outlet />
          </div>
        </main>

        {/* FOOTER */}
        <Footer />
      </div>

      {/* NOTIFICATION MODAL */}
      <NotificationModal
        isOpen={openNotif}
        onClose={() => setOpenNotif(false)}
        notifications={notifications}
        onMarkAllRead={markAllRead}
      />
    </div>
  )
}
