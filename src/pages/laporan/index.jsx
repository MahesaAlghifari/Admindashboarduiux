import { useState } from "react";
import { TABS } from "./components/constants";
import TabNavigation from "./components/TabNavigation";
import UnderConstructionView from "./components/UnderConstructionView";
import RaporView from "./rapor/RaporView";
// Import modul Absensi yang sudah kita buat
import RekapPresensiView from "../laporan/RekapPresensi/index";
// Import modul Buku Penghubung yang baru kita buat
import LaporanBukuPenghubungView from "./BukuPenghubung/index"; // Sesuaikan path ini dengan lokasi file Anda
import LaporanAktivitasView from "./Aktivitas";

export default function LaporanPage() {
  const [activeTab, setActiveTab] = useState("rapor");

  // Fungsi untuk menentukan komponen mana yang harus dirender
  const renderView = () => {
    switch (activeTab) {
      case "rapor":
        return <RaporView />;
      case "absen":
        return <RekapPresensiView />;
      case "penghubung": // Sesuaikan "penghubung" ini dengan ID tab yang ada di TABS (constants.js)
        return <LaporanBukuPenghubungView />;
      case "aktivitas": // Sesuaikan "penghubung" ini dengan ID tab yang ada di TABS (constants.js)
        return <LaporanAktivitasView />;
      default:
        // Mengambil label dan desc dari konstanta untuk tampilan UnderConstruction
        const currentTab = TABS.find((t) => t.id === activeTab);
        return (
          <UnderConstructionView
            title={currentTab?.label}
            desc={currentTab?.desc}
          />
        );
    }
  };

  return (
    <div className="w-full space-y-8 pb-24">
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">

        <TabNavigation
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <div className="p-6 lg:p-8 bg-slate-50/30 min-h-[600px]">
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 h-full">
            {renderView()}
          </div>
        </div>
      </div>
    </div>
  );
}