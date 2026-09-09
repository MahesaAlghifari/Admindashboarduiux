import {lazy,Suspense,useMemo} from "react";
import {ArrowPathIcon,BookOpenIcon,ChartBarIcon,ClipboardDocumentCheckIcon,DocumentTextIcon,SunIcon,TableCellsIcon} from "@heroicons/react/24/outline";
import {useRouteTab} from "../../hooks/useRouteTab";
import {queryClient} from "../../lib/queryClient";

const tabLoaders={presensi:()=>import("./tabs/Presensi"),"rekap-presensi":()=>import("./tabs/RekapPresensi"),penghubung:()=>import("./tabs/BukuPenghubung"),aktivitas:()=>import("./tabs/AktivitasHarian"),perkembangan:()=>import("./tabs/Perkembangan"),rapor:()=>import("./tabs/RaporSiswa")};
const Presensi=lazy(tabLoaders.presensi),RekapPresensi=lazy(tabLoaders["rekap-presensi"]),BukuPenghubung=lazy(tabLoaders.penghubung),AktivitasHarian=lazy(tabLoaders.aktivitas),Perkembangan=lazy(tabLoaders.perkembangan),RaporSiswa=lazy(tabLoaders.rapor);
const MENU_ITEMS=[{id:"presensi",label:"Catat Presensi",Icon:ClipboardDocumentCheckIcon,Component:Presensi},{id:"rekap-presensi",label:"Rekap Presensi",Icon:TableCellsIcon,Component:RekapPresensi},{id:"penghubung",label:"Buku Penghubung",Icon:BookOpenIcon,Component:BukuPenghubung},{id:"aktivitas",label:"Aktivitas",Icon:SunIcon,Component:AktivitasHarian},{id:"perkembangan",label:"Perkembangan",Icon:ChartBarIcon,Component:Perkembangan},{id:"rapor",label:"Rapor",Icon:DocumentTextIcon,Component:RaporSiswa}];

function TabLoading(){return <div className="flex min-h-70 items-center justify-center text-slate-400"><div className="flex flex-col items-center gap-2"><ArrowPathIcon className="h-5 w-5 animate-spin"/><span className="text-[11px] font-medium">Memuat kegiatan siswa...</span></div></div>;}

export default function KegiatanSiswa(){
  const [activeTab,setActiveTab]=useRouteTab(MENU_ITEMS,"presensi"),activeItem=useMemo(()=>MENU_ITEMS.find(item=>item.id===activeTab)??MENU_ITEMS[0],[activeTab]),ActiveComponent=activeItem.Component;
  const changeTab=id=>{if(id===activeTab)return;void queryClient.cancelQueries({queryKey:["kegiatan"]});setActiveTab(id);};
  return <div className="kegiatan-ui min-h-screen text-slate-800"><div className="border-b border-slate-100 bg-white"><div className="flex overflow-x-auto no-scrollbar">{MENU_ITEMS.map(item=>{const active=item.id===activeTab,Icon=item.Icon;return <button key={item.id} type="button" onClick={()=>changeTab(item.id)} onMouseEnter={()=>void tabLoaders[item.id]?.()} onFocus={()=>void tabLoaders[item.id]?.()} className={`group relative flex min-w-28 flex-1 flex-col items-center justify-center gap-1.5 border-b-2 px-3 py-3.5 transition-colors ${active?"border-[#ef4d45] bg-white text-[#ef4d45]":"border-transparent text-slate-400 hover:bg-slate-50/70 hover:text-slate-600"}`}><Icon className="h-4 w-4"/><span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span></button>;})}</div></div><div className="min-h-100 pt-5"><Suspense fallback={<TabLoading/>}><div key={activeTab} className="animate-in fade-in duration-300"><ActiveComponent/></div></Suspense></div></div>;
}
