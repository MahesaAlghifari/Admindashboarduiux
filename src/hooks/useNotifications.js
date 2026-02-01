import { useEffect, useState } from "react"

export function useNotifications() {
    const [notifications, setNotifications] = useState([
        {
            id: 1,
            title: "Presensi Kelas A",
            message: "Rina Wulandari telah mengisi presensi hari ini",
            time: "5 menit lalu",
            isRead: false,
        },
        {
            id: 2,
            title: "Pembayaran SPP",
            message: "SPP Mahesa Al Ghifari telah dikonfirmasi",
            time: "1 jam lalu",
            isRead: false,
        },
    ])

    const unreadCount = notifications.filter(n => !n.isRead).length

    // simulasi realtime
    useEffect(() => {
        const interval = setInterval(() => {
            setNotifications(prev => [
                {
                    id: Date.now(),
                    title: "Notifikasi Baru",
                    message: "Aktivitas baru terdeteksi",
                    time: "Baru saja",
                    isRead: false,
                },
                ...prev,
            ])
        }, 20000)

        return () => clearInterval(interval)
    }, [])

    const markAllRead = () => {
        setNotifications(prev =>
            prev.map(n => ({ ...n, isRead: true }))
        )
    }

    return {
        notifications,
        unreadCount,
        markAllRead,
    }
}
