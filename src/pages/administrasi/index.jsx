import * as React from "react";
import {ArrowPathIcon,BookOpenIcon,CalendarDaysIcon,HomeModernIcon,ListBulletIcon,MegaphoneIcon,PencilSquareIcon} from "@heroicons/react/24/outline";
import {useRouteTab} from "../../hooks/useRouteTab";

const loadKurikulum=()=>import("./tabs/Kurikulum"),loadIndikator=()=>import("./tabs/Indikator"),loadPerencanaan=()=>import("./tabs/Perencanaan"),loadJadwal=()=>import("./tabs/Jadwal"),loadKelas=()=>import("./tabs/Kelas"),loadPengumuman=()=>import("./tabs/Pengumuman");
const Kurikulum=React.lazy(loadKurikulum),Indikator=React.lazy(loadIndikator),Perencanaan=React.lazy(loadPerencanaan),Jadwal=React.lazy(loadJadwal),Kelas=React.lazy(loadKelas),Pengumuman=React.lazy(loadPengumuman);
const MENU_ITEMS=[
  {id:"kurikulum",label:"Kurikulum",Icon:BookOpenIcon,Component:Kurikulum,preload:loadKurikulum},
  {id:"aspek",label:"Aspek",Icon:ListBulletIcon,Component:Indikator,preload:loadIndikator},
  {id:"perencanaan",label:"Perencanaan",Icon:PencilSquareIcon,Component:Perencanaan,preload:loadPerencanaan},
  {id:"jadwal",label:"Jadwal",Icon:CalendarDaysIcon,Component:Jadwal,preload:loadJadwal},
  {id:"kelas",label:"Data Kelas",Icon:HomeModernIcon,Component:Kelas,preload:loadKelas},
  {id:"pengumuman",label:"Pengumuman",Icon:MegaphoneIcon,Component:Pengumuman,preload:loadPengumuman},
];

function TabLoading(){return <div className="flex min-h-70 items-center justify-center text-slate-400"><div className="flex flex-col items-center gap-2"><ArrowPathIcon className="h-5 w-5 animate-spin"/><span className="text-[11px] font-medium">Memuat modul...</span></div></div>;}

export default function AdministrasiAkademik(){
  const [activeTab,setActiveTab]=useRouteTab(MENU_ITEMS,"kurikulum"),activeItem=React.useMemo(()=>MENU_ITEMS.find(item=>item.id===activeTab)??MENU_ITEMS[0],[activeTab]),ActiveComponent=activeItem.Component;
  return <div className="min-h-screen text-slate-800">
    <div className="border-b border-slate-100 bg-white">
      <div className="flex overflow-x-auto no-scrollbar">
        {MENU_ITEMS.map(item=>{const active=item.id===activeTab,Icon=item.Icon;return <button key={item.id} type="button" onClick={()=>setActiveTab(item.id)} onMouseEnter={()=>item.preload()} onFocus={()=>item.preload()} className={`group relative flex min-w-28 flex-1 flex-col items-center justify-center gap-1.5 border-b-2 px-3 py-3.5 transition-colors ${active?"border-[#ef4d45] bg-white text-[#ef4d45]":"border-transparent text-slate-400 hover:bg-slate-50/70 hover:text-slate-600"}`}><Icon className="h-4 w-4"/><span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span></button>;})}
      </div>
    </div>
    <div className="min-h-100 pt-5"><React.Suspense fallback={<TabLoading/>}><div key={activeTab} className="animate-in fade-in duration-300"><ActiveComponent/></div></React.Suspense></div>
    <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
  </div>;
}
