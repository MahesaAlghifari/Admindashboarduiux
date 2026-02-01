import {
    LayoutGrid,
    Users,
    GraduationCap,
    Wallet,
    Settings,
    BarChart,
} from "lucide-react"

export const MENU = [
    {
        path: "/dashboard",
        icon: LayoutGrid,
        roles: ["admin", "staff", "guru"],
    },
    {
        path: "/siswa",
        icon: Users,
        roles: ["admin", "staff"],
    },
    {
        path: "/staff",
        icon: Users,
        roles: ["admin", "staff"],
    },
    {
        path: "/akademik",
        icon: GraduationCap,
        roles: ["admin", "guru"],
    },
    {
        path: "/keuangan",
        icon: Wallet,
        roles: ["admin"],
    },
    {
        path: "/laporan",
        icon: BarChart,
        roles: ["admin"],
    },
    {
        path: "/pengaturan",
        icon: Settings,
        roles: ["admin"],
    },
]
