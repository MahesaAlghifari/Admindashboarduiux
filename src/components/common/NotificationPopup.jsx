import React from "react"
import { X, Bell, CheckCheck, Clock } from "lucide-react"

const notifications = [
  {
    id: "1",
    title: "Presensi Kelas A",
    message: "Rina Wulandari telah mengisi presensi kelas A untuk hari ini",
    time: "5 menit yang lalu",
    isRead: false,
    type: "info",
  },
  {
    id: "2",
    title: "Pembayaran SPP",
    message: "Pembayaran SPP Mahesa Al Ghifari telah dikonfirmasi",
    time: "1 jam yang lalu",
    isRead: false,
    type: "success",
  },
  {
    id: "3",
    title: "Pengumuman Baru",
    message: "Libur Nasional: Hari Kemerdekaan RI",
    time: "2 jam yang lalu",
    isRead: true,
    type: "warning",
  },
  {
    id: "4",
    title: "Aktivitas Harian",
    message: "Dewi Kartika menambahkan aktivitas harian untuk kelas B",
    time: "3 jam yang lalu",
    isRead: true,
    type: "info",
  },
  {
    id: "5",
    title: "Penilaian Siswa",
    message: "Penilaian semester untuk kelas A sudah difinalisasi",
    time: "Kemarin",
    isRead: true,
    type: "success",
  },
]

export default function NotificationPopup({ isOpen, onClose }) {
  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40"
        onClick={onClose}
      />

      {/* Popup */}
      <div className="fixed right-4 top-20 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 max-h-[calc(100vh-100px)] flex flex-col md:right-6">
        {/* Header */}
        <div className="p-4 border-b border-[#E5E7EB] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E94640]" />
            <h3 className="font-semibold text-[#0F172A]">Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#E94640] text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 hover:bg-[#F6F7F9] rounded-lg"
          >
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <button className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2">
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Terbaca
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
              <p className="text-[#64748B]">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {notifications.map(notif => (
                <div
                  key={notif.id}
                  className={`p-4 cursor-pointer transition-colors hover:bg-[#F6F7F9] ${
                    !notif.isRead ? "bg-[#FEF2F2]" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                        !notif.isRead ? "bg-[#E94640]" : "bg-transparent"
                      }`}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h4 className="text-[#0F172A] truncate font-medium">
                          {notif.title}
                        </h4>
                        <Clock className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                      </div>
                      <p className="text-[#64748B] text-sm line-clamp-2 mb-2">
                        {notif.message}
                      </p>
                      <span className="text-[#94A3B8] text-xs">
                        {notif.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <button className="w-full text-center text-[#E94640] hover:underline">
            Lihat Semua Notifikasi
          </button>
        </div>
      </div>
    </>
  )
}
