import { useState } from "react";
import { 
  BookOpenIcon, 
  HomeModernIcon, 
  MegaphoneIcon,
  ListBulletIcon,   
  PencilSquareIcon, 
  CalendarDaysIcon  
} from "@heroicons/react/24/outline";

// --- IMPORT TAB COMPONENTS ---
// Pastikan path sesuai dengan struktur folder Anda
import Kurikulum from "./tabs/Kurikulum"; 
import Kelas from "./tabs/Kelas"; 
import Pengumuman from "./tabs/Pengumuman"; 
import Indikator from "./tabs/Indikator"; 
import Perencanaan from "./tabs/Perencanaan"; 
import Jadwal from "./tabs/Jadwal"; 

const MENU_ITEMS = [
  { 
    id: "kurikulum", 
    label: "Kurikulum", 
    icon: <BookOpenIcon className="h-5 w-5" />, 
    component: <Kurikulum /> 
  },
  { 
    id: "aspek", 
    label: "Aspek", 
    icon: <ListBulletIcon className="h-5 w-5" />, 
    component: <Indikator /> 
  },
  { 
    id: "perencanaan", 
    label: "Perencanaan", 
    icon: <PencilSquareIcon className="h-5 w-5" />, 
    component: <Perencanaan /> 
  },
  { 
    id: "jadwal", 
    label: "Jadwal", 
    icon: <CalendarDaysIcon className="h-5 w-5" />, 
    component: <Jadwal /> 
  },
  { 
    id: "kelas", 
    label: "Data Kelas", 
    icon: <HomeModernIcon className="h-5 w-5" />, 
    component: <Kelas /> 
  },
  { 
    id: "pengumuman", 
    label: "Pengumuman", 
    icon: <MegaphoneIcon className="h-5 w-5" />, 
    component: <Pengumuman /> 
  },
];

export default function AdministrasiAkademik() {
  const [activeTab, setActiveTab] = useState("kurikulum"); 

  const renderContent = () => {
    const found = MENU_ITEMS.find(item => item.id === activeTab);
    return found ? found.component : <div className="p-10 text-center text-slate-400">Halaman tidak ditemukan</div>;
  };

  return (
    <div className="min-h-screen  font-sans text-slate-800">
      
      {/* HEADER PAGE */}


      {/* NAVIGATION BAR - MINIMALIST VERSION */}
      <div className="bg-slate-100 rounded-t-xl overflow-hidden border  border-slate-200"> 
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
      <div className=" py-8 px-8 rounded-b-xl min-h-[400px]">
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