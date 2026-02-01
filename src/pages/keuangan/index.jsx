import { useState } from "react";
import {
    WalletIcon,
    ReceiptRefundIcon,
    BanknotesIcon,
    ChartPieIcon,
    UsersIcon,
    ClipboardDocumentListIcon,
    PresentationChartLineIcon
} from "@heroicons/react/24/outline";

// --- IMPORT TAB COMPONENTS ---
// Buat file placeholder dulu jika belum ada (lihat langkah 2 di bawah)
import TuitionTab from "./tabs/TuitionTab";
import HistoryTab from "./tabs/HistoryTab";
import ExpensesTab from "./tabs/ExpensesTab";
import PettyCashTab from "./tabs/PettyCashTab";
import PayrollTab from "./tabs/PayrollTab";
import BudgetTab from "./tabs/BudgetTab";
import ReportsTab from "./tabs/ReportsTab";

const MENU_ITEMS = [
    {
        id: "tuition",
        label: "SPP & Tagihan",
        icon: <WalletIcon className="h-5 w-5" />,
        component: <TuitionTab />
    },
    {
        id: "history",
        label: "Riwayat",
        icon: <ReceiptRefundIcon className="h-5 w-5" />,
        component: <HistoryTab />
    },
    {
        id: "expenses",
        label: "Pengeluaran",
        icon: <BanknotesIcon className="h-5 w-5" />,
        component: <ExpensesTab />
    },
    {
        id: "petty_cash",
        label: "Kas Kecil",
        icon: <ClipboardDocumentListIcon className="h-5 w-5" />,
        component: <PettyCashTab />
    },
    {
        id: "payroll",
        label: "Gaji (Payroll)",
        icon: <UsersIcon className="h-5 w-5" />,
        component: <PayrollTab />
    },
    {
        id: "budget",
        label: "Anggaran",
        icon: <ChartPieIcon className="h-5 w-5" />,
        component: <BudgetTab />
    },
    {
        id: "reports",
        label: "Laporan",
        icon: <PresentationChartLineIcon className="h-5 w-5" />,
        component: <ReportsTab />
    },
];

export default function FinancePage() {
    const [activeTab, setActiveTab] = useState("tuition");

    const renderContent = () => {
        const found = MENU_ITEMS.find(item => item.id === activeTab);
        return found ? found.component : <div className="p-10 text-center text-slate-400">Halaman tidak ditemukan</div>;
    };

    return (
        <div className="w-full  text-slate-800">

            {/* HEADER SECTION */}


            <div className="">

                {/* NAVIGATION BAR - TAB STYLE */}
                <div className=" border-b border-slate-200">
                    <div className="flex overflow-x-auto no-scrollbar">
                        {MENU_ITEMS.map((item) => {
                            const isActive = activeTab === item.id;

                            return (
                                <button
                                    key={item.id}
                                    onClick={() => setActiveTab(item.id)}
                                    className={`
                      group relative flex-1 min-w-[120px] py-4 px-2
                      flex flex-col items-center justify-center gap-2
                      transition-all duration-300 ease-in-out
                      border-b-2
                      
                      /* TAB STYLE LOGIC */
                      ${isActive
                                            ? "bg-white border-[#e94640] text-[#e94640] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)_inset]"
                                            : "bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100"
                                        }
                    `}
                                >
                                    {/* ICON with Animation */}
                                    <div className={`transition-transform duration-300 ${isActive ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`}>
                                        {item.icon}
                                    </div>

                                    {/* TEXT LABEL */}
                                    <span className={`text-[10px] font-bold uppercase tracking-widest transition-colors duration-200`}>
                                        {item.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* CONTENT AREA */}
                <div className="py-8 w-full ">
                    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                        {renderContent()}
                    </div>
                </div>

            </div>

            {/* CSS Reset for Scrollbar */}
            <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

        </div>
    );
}