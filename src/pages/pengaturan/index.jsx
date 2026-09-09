import {Building2,CalendarRange,ShieldCheck} from "lucide-react";
import {useRouteTab} from "../../hooks/useRouteTab";
import AccessControlTab from "./AccessControlTab";
import AcademicPeriodTab from "./AcademicPeriodTab";
import SchoolProfileTab from "./SchoolProfileTab";

const TABS=[{id:"access",label:"Access Control",icon:ShieldCheck,component:<AccessControlTab/>},{id:"school",label:"Profil Sekolah",icon:Building2,component:<SchoolProfileTab/>},{id:"period",label:"Periode Akademik",icon:CalendarRange,component:<AcademicPeriodTab/>}];

export default function SettingsPage(){
  const [activeTab,setActiveTab]=useRouteTab(TABS,"access"),active=TABS.find(item=>item.id===activeTab)??TABS[0];
  return <div className="min-h-screen bg-white text-slate-800"><div className="border-b border-slate-100"><div className="flex overflow-x-auto no-scrollbar">{TABS.map(item=>{const Icon=item.icon,selected=item.id===activeTab;return <button key={item.id} type="button" onClick={()=>setActiveTab(item.id)} className={`group relative flex min-w-36 flex-1 items-center justify-center gap-2 border-b-2 px-4 py-3.5 transition-colors ${selected?"border-[#ef4d45] text-[#ef4d45]":"border-transparent text-slate-400 hover:bg-slate-50/70 hover:text-slate-600"}`}><Icon className="h-4 w-4"/><span className="text-[10px] font-semibold uppercase tracking-wider">{item.label}</span></button>;})}</div></div><div className="px-0 pt-5"><div key={activeTab} className="animate-in fade-in duration-200">{active.component}</div></div></div>;
}
