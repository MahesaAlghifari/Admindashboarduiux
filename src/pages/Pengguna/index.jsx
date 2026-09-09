import { useState } from "react";
import { 
  GraduationCap, 
  Users 
} from "lucide-react"; 

// --- IMPORT KOMPONEN EXISTING ---
import SiswaPage from "./tabs/Siswa"; 
import StaffPage from "./tabs/Staff";

// --- KONFIGURASI TAB ---
const USER_TABS = [
  { 
    id: "siswa", 
    label: "Data Siswa", 
    icon: <GraduationCap className="h-5 w-5" />, 
    component: <SiswaPage /> 
  },
  { 
    id: "staff", 
    label: "Data Staff & Guru", 
    icon: <Users className="h-5 w-5" />, 
    component: <StaffPage /> 
  },
];

export default function ManajemenPengguna() {
  const [activeTab, setActiveTab] = useState("siswa");

  const renderContent = () => {
    const found = USER_TABS.find(item => item.id === activeTab);
    return found ? found.component : <div className="p-10 text-center text-slate-400">Halaman tidak ditemukan</div>;
  };

  return (
    <div className="min-h-screen font-sans text-slate-800">
      
    

      {/* WRAPPER UTAMA (Style disamakan dengan KegiatanSiswa) */}
      <div className="bg-white rounded-xl shadow-sm">
        
        {/* NAVIGATION BAR - IDENTICAL STYLE */}
        <div className="bg-slate-100 rounded-t-xl overflow-hidden border border-slate-200"> 
          <div className="flex overflow-x-auto no-scrollbar">
            {USER_TABS.map((item) => {
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
                    
                    /* STYLING LOGIC YANG SAMA */
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
        {/* Menggunakan bg-white dan border agar menyatu dengan tab active */}
        <div className="bg-white border-x border-b border-slate-200 rounded-b-xl min-h-[500px]  p-4 ">
          <div key={activeTab} className="animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-forwards">
             {renderContent()}
          </div>
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