import * as React from "react";
import {
  BanknotesIcon,
  ChartPieIcon,
  ClipboardDocumentListIcon,
  PresentationChartLineIcon,
  ReceiptRefundIcon,
  UsersIcon,
  WalletIcon,
} from "@heroicons/react/24/outline";
import { useRouteTab } from "../../hooks/useRouteTab";

const loadTuition = () => import("./tabs/TuitionTab");
const loadHistory = () => import("./tabs/HistoryTab");
const loadExpenses = () => import("./tabs/ExpensesTab");
const loadPettyCash = () => import("./tabs/PettyCashTab");
const loadPayroll = () => import("./tabs/PayrollTab");
const loadBudget = () => import("./tabs/BudgetTab");
const loadReports = () => import("./tabs/ReportsTab");

const TuitionTab = React.lazy(loadTuition);
const HistoryTab = React.lazy(loadHistory);
const ExpensesTab = React.lazy(loadExpenses);
const PettyCashTab = React.lazy(loadPettyCash);
const PayrollTab = React.lazy(loadPayroll);
const BudgetTab = React.lazy(loadBudget);
const ReportsTab = React.lazy(loadReports);

const MENU_ITEMS = [
  {
    id: "tuition",
    label: "SPP & Tagihan",
    Icon: WalletIcon,
    Component: TuitionTab,
    preload: loadTuition,
  },
  {
    id: "history",
    label: "Riwayat",
    Icon: ReceiptRefundIcon,
    Component: HistoryTab,
    preload: loadHistory,
  },
  {
    id: "expenses",
    label: "Pengeluaran",
    Icon: BanknotesIcon,
    Component: ExpensesTab,
    preload: loadExpenses,
  },
  {
    id: "petty_cash",
    label: "Kas Kecil",
    Icon: ClipboardDocumentListIcon,
    Component: PettyCashTab,
    preload: loadPettyCash,
  },
  {
    id: "payroll",
    label: "Penggajian",
    Icon: UsersIcon,
    Component: PayrollTab,
    preload: loadPayroll,
  },
  {
    id: "budget",
    label: "Anggaran",
    Icon: ChartPieIcon,
    Component: BudgetTab,
    preload: loadBudget,
  },
  {
    id: "reports",
    label: "Laporan",
    Icon: PresentationChartLineIcon,
    Component: ReportsTab,
    preload: loadReports,
  },
];

function TabLoading() {
  return (
    <div className="flex min-h-70 items-center justify-center text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-200 border-t-[#ef4d45]" />
        <span className="text-[11px] font-medium">
          Memuat modul...
        </span>
      </div>
    </div>
  );
}

export default function FinancePage() {
  const [activeTab, setActiveTab] = useRouteTab(
    MENU_ITEMS,
    "tuition"
  );

  const activeItem = React.useMemo(
    () =>
      MENU_ITEMS.find(
        (item) => item.id === activeTab
      ) ?? MENU_ITEMS[0],
    [activeTab]
  );

  const ActiveComponent = activeItem.Component;

  return (
    <div className="min-h-screen text-slate-800">
      <div className="border-b border-slate-100 bg-white">
        <div className="flex overflow-x-auto no-scrollbar">
          {MENU_ITEMS.map((item) => {
            const active = item.id === activeTab;
            const Icon = item.Icon;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  setActiveTab(item.id)
                }
                onMouseEnter={() =>
                  item.preload()
                }
                onFocus={() => item.preload()}
                className={`group relative flex min-w-28 flex-1 flex-col items-center justify-center gap-1.5 border-b-2 px-3 py-3.5 transition-colors ${
                  active
                    ? "border-[#ef4d45] bg-white text-[#ef4d45]"
                    : "border-transparent text-slate-400 hover:bg-slate-50/70 hover:text-slate-600"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="text-[10px] font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="min-h-100 pt-5">
        <React.Suspense
          fallback={<TabLoading />}
        >
          <div
            key={activeTab}
            className="animate-in fade-in duration-300"
          >
            <ActiveComponent />
          </div>
        </React.Suspense>
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
