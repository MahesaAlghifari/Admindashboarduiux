import { useState } from "react";
import { 
  ClipboardDocumentCheckIcon, 
  SunIcon, 
  BookOpenIcon, 
  ChartBarIcon, 
  DocumentTextIcon,
  TableCellsIcon 
} from "@heroicons/react/24/outline";

// --- IMPORT TAB COMPONENTS ---
import Presensi from "./tabs/Presensi";
import RekapPresensi from "./tabs/RekapPresensi";
import BukuPenghubung from "./tabs/BukuPenghubung"; // Pastikan file ini ada
import AktivitasHarian from "./tabs/AktivitasHarian";
import Perkembangan from "./tabs/Perkembangan";
import RaporSiswa from "./tabs/RaporSiswa";

const MENU_ITEMS = [
  { 
    id: "presensi", 
    label: "Input Presensi", 
    icon: <ClipboardDocumentCheckIcon className="h-5 w-5" />, 
    component: <Presensi /> 
  },
  { 
    id: "rekap-presensi", 
    label: "Rekap Absensi", 
    icon: <TableCellsIcon className="h-5 w-5" />, 
    component: <RekapPresensi /> 
  },
  { 
    id: "penghubung", 
    label: "Buku Penghubung", 
    icon: <BookOpenIcon className="h-5 w-5" />, 
    component: <BukuPenghubung /> 
  },
  { 
    id: "aktivitas", 
    label: "Aktivitas", 
    icon: <SunIcon className="h-5 w-5" />, 
    component: <AktivitasHarian /> 
  },
  { 
    id: "perkembangan", 
    label: "Perkembangan", 
    icon: <ChartBarIcon className="h-5 w-5" />, 
    component: <Perkembangan /> 
  },
  { 
    id: "rapor", 
    label: "Rapor", 
    icon: <DocumentTextIcon className="h-5 w-5" />, 
    component: <RaporSiswa /> 
  },
];

export default function KegiatanSiswa() {
  const [activeTab, setActiveTab] = useState("presensi"); 

  const renderContent = () => {
    const found = MENU_ITEMS.find(item => item.id === activeTab);
    return found ? found.component : <div className="p-10 text-center text-slate-400">Halaman tidak ditemukan</div>;
  };

  return (
    <div className="min-h-screen font-sans text-slate-800">
      
      {/* HEADER PAGE (Kosong sesuai desain administrasi) */}

      {/* NAVIGATION BAR - MINIMALIST VERSION */}
      <div className="bg-slate-100 rounded-t-xl overflow-hidden border border-slate-200"> 
        <div className="flex overflow-x-auto no-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`
                  group relative flex-1 min-w-[110px] py-4 px-2
                  flex flex-col items-center justify-center gap-2
                  transition-all duration-300 ease-in-out
                  border-b-2
                  
                  /* MINIMALIST STYLE LOGIC */
                  ${isActive 
                    ? "bg-white border-[#e94640] text-[#e94640] shadow-[0_4px_12px_-6px_rgba(0,0,0,0.05)]" 
                    : "bg-transparent border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                  }
                `}
              >
                {/* ICON with Animation */}
                <div className={`transition-transform duration-300 ${isActive ? "-translate-y-0.5" : "group-hover:-translate-y-0.5"}`}>
                  {item.icon}
                </div>

                {/* TEXT LABEL */}
                <span className={`text-[11px] font-bold uppercase tracking-widest transition-colors duration-200`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="py-8 px-8 rounded-b-xl min-h-[400px]">
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
            {renderContent()}
        </div>
      </div>

      {/* CSS Reset */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

    </div>
  );
}