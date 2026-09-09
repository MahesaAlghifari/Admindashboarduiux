import { lazy, Suspense } from "react";
import { useRouteTab } from "../../hooks/useRouteTab";
import { TABS } from "./components/constants";
import TabNavigation from "./components/TabNavigation";
import UnderConstructionView from "./components/UnderConstructionView";

const VIEW_LOADERS = {
  "buku-induk": lazy(() => import("./BukuInduk")),
  rapor: lazy(() => import("./rapor/RaporView")),
  absen: lazy(() => import("./RekapPresensi")),
  penghubung: lazy(() => import("./bukuPenghubung")),
  aktivitas: lazy(() => import("./Aktivitas")),
  perkembangan: lazy(() => import("./Perkembangan")),
};

function ReportLoading() {
  return (
    <div className="flex min-h-64 items-center justify-center">
      <div className="flex items-center gap-2 text-xs text-slate-400">
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-200 border-t-[#e94640]" />
        Memuat laporan...
      </div>
    </div>
  );
}

export default function LaporanPage() {
  const [activeTab, changeTab] = useRouteTab(TABS, "rapor");
  const ActiveView = VIEW_LOADERS[activeTab];
  const currentTab = TABS.find((tab) => tab.id === activeTab);

  return (
    <div className="report-ui min-w-0 text-xs text-slate-800">
      <TabNavigation
        tabs={TABS}
        activeTab={activeTab}
        onChange={changeTab}
      />

      <style>{`@media screen {
  .report-ui {
    color: #334155;
    font-size: 12px;
  }

  .report-ui label {
    font-size: 12px;
    font-weight: 600;
    line-height: 1.25rem;
    color: #64748b;
    letter-spacing: 0;
    text-transform: none;
  }

  .report-ui select,
  .report-ui input[type="text"],
  .report-ui input[type="search"],
  .report-ui input[type="date"],
  .report-ui input[type="week"],
  .report-ui input[type="month"],
  .report-ui input[type="number"],
  .report-ui textarea {
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    background-color: #fff;
    color: #475569;
    font-size: 12px;
    font-weight: 500;
    outline: none;
    transition: border-color 150ms ease, box-shadow 150ms ease, background-color 150ms ease;
  }

  .report-ui select,
  .report-ui input[type="text"],
  .report-ui input[type="search"],
  .report-ui input[type="date"],
  .report-ui input[type="week"],
  .report-ui input[type="month"],
  .report-ui input[type="number"] {
    min-height: 2.5rem;
  }

  .report-ui select:focus,
  .report-ui input[type="text"]:focus,
  .report-ui input[type="search"]:focus,
  .report-ui input[type="date"]:focus,
  .report-ui input[type="week"]:focus,
  .report-ui input[type="month"]:focus,
  .report-ui input[type="number"]:focus,
  .report-ui textarea:focus {
    border-color: #e94640;
    box-shadow: 0 0 0 3px rgba(233, 70, 64, 0.1);
  }

  .report-ui select:disabled,
  .report-ui input:disabled,
  .report-ui textarea:disabled {
    cursor: not-allowed;
    background-color: #f8fafc;
    color: #94a3b8;
  }

  .report-ui table {
    font-size: 12px;
  }

  .report-ui table thead th {
    padding: 0.7rem 1rem;
    background-color: #f8fafc;
    color: #64748b;
    font-size: 12px;
    font-weight: 600;
    line-height: 1.125rem;
    letter-spacing: 0;
    text-transform: none;
    vertical-align: middle;
  }

  .report-ui table tbody td {
    padding: 0.75rem 1rem;
    color: #475569;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.125rem;
    vertical-align: middle;
  }

  .report-ui table tbody tr {
    transition: background-color 150ms ease;
  }

  .report-ui table tbody tr:hover {
    background-color: rgba(248, 250, 252, 0.75);
  }

  .report-ui table tbody td p:first-child {
    color: #334155;
  }

  .report-ui input[type="checkbox"],
  .report-ui input[type="radio"] {
    width: 1rem;
    height: 1rem;
  }
}`}</style>

      <div className="min-h-100 pt-5">
        <div
          key={activeTab}
          role="tabpanel"
          className="h-full animate-in fade-in duration-300"
        >
          <Suspense fallback={<ReportLoading />}>
            {ActiveView ? (
              <ActiveView />
            ) : (
              <UnderConstructionView
                title={currentTab?.label}
                desc={currentTab?.desc}
              />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  );
}
