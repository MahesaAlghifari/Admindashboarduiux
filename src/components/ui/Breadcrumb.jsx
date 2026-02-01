import { ChevronRight, Home } from "lucide-react"
import { Link, useLocation } from "react-router-dom"

export default function Breadcrumb({
    items,          // optional manual breadcrumb
    showHome = true // tampilkan icon home
}) {
    const location = useLocation()

    // AUTO breadcrumb dari URL jika items tidak dikirim
    const paths = location.pathname
        .split("/")
        .filter(Boolean)

    const autoItems = paths.map((path, index) => {
        const to = "/" + paths.slice(0, index + 1).join("/")
        return {
            label: path.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
            to,
        }
    })

    const breadcrumbs = items || autoItems

    return (
        <nav className="flex items-center text-sm text-[#64748B]">
            <ol className="flex items-center flex-wrap gap-1">
                {showHome && (
                    <>
                        <li>
                            <Link
                                to="/dashboard"
                                className="flex items-center gap-1 hover:text-[#E94640]"
                            >
                                <Home className="w-4 h-4" />
                                <span className="hidden sm:inline"></span>
                            </Link>
                        </li>
                        <ChevronRight className="w-4 h-4" />
                    </>
                )}

                {breadcrumbs.map((item, index) => {
                    const isLast = index === breadcrumbs.length - 1

                    return (
                        <li key={item.to} className="flex items-center gap-1">
                            {isLast ? (
                                <span className="font-medium text-[#0F172A] truncate max-w-[140px]">
                                    {item.label}
                                </span>
                            ) : (
                                <>
                                    <Link
                                        to={item.to}
                                        className="hover:text-[#E94640] truncate max-w-[120px]"
                                    >
                                        {item.label}
                                    </Link>
                                    <ChevronRight className="w-4 h-4" />
                                </>
                            )}
                        </li>
                    )
                })}
            </ol>
        </nav>
    )
}
