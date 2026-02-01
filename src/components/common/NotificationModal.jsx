import { X, Bell, CheckCheck, Clock } from "lucide-react"
import { useEffect } from "react"

export default function NotificationModal({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
}) {
  // Lock body scroll saat modal open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [isOpen])

  if (!isOpen) return null

  const unreadCount = notifications.filter(n => !n.isRead).length

  return (
    <>
      {/* BACKDROP */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />

      {/* MODAL */}
      <div className="
        fixed z-50
        top-1/2 left-1/2
        -translate-x-1/2 -translate-y-1/2
        w-[90vw] max-w-lg
        max-h-[80vh]
        bg-white rounded-2xl shadow-2xl
        flex flex-col
      ">
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E94640]" />
            <h3 className="font-semibold text-[#0F172A]">
              Notifikasi
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 bg-[#E94640] text-white text-xs rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[#F6F7F9]"
          >
            <X className="w-5 h-5 text-[#64748B]" />
          </button>
        </div>

        {/* ACTION */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <button
            onClick={onMarkAllRead}
            className="w-full flex items-center justify-center gap-2
              px-3 py-2 text-sm border border-[#E5E7EB]
              rounded-lg hover:bg-[#F6F7F9]"
          >
            <CheckCheck className="w-4 h-4" />
            Tandai Semua Terbaca
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-10 text-center">
              <Bell className="w-12 h-12 mx-auto text-[#CBD5E1] mb-3" />
              <p className="text-[#64748B]">
                Tidak ada notifikasi
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#E5E7EB]">
              {notifications.map(item => (
                <div
                  key={item.id}
                  className={`p-4 cursor-pointer transition-colors
                    hover:bg-[#F6F7F9]
                    ${!item.isRead ? "bg-[#FEF2F2]" : ""}
                  `}
                >
                  <div className="flex gap-3">
                    <span
                      className={`w-2 h-2 rounded-full mt-2
                        ${!item.isRead ? "bg-[#E94640]" : "bg-transparent"}
                      `}
                    />

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-[#0F172A] truncate">
                          {item.title}
                        </h4>
                        <Clock className="w-4 h-4 text-[#94A3B8]" />
                      </div>

                      <p className="text-sm text-[#64748B] line-clamp-2 mt-1">
                        {item.message}
                      </p>

                      <span className="text-xs text-[#94A3B8] mt-1 block">
                        {item.time}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="p-4 border-t border-[#E5E7EB]">
          <button className="w-full text-center text-[#E94640] hover:underline">
            Lihat Semua Notifikasi
          </button>
        </div>
      </div>
    </>
  )
}
