import React,{
  Suspense,
  lazy,
  startTransition,
  useCallback,
  useMemo,
} from "react";
import {
  GraduationCap,
  Users,
} from "lucide-react";
import {useRouteTab} from "../../hooks/useRouteTab";

const loadSiswa=()=>import("./tabs/Siswa");
const loadStaff=()=>import("./tabs/Staff");

const SiswaPage=lazy(loadSiswa);
const StaffPage=lazy(loadStaff);

const USER_TABS=[
  {
    id:"siswa",
    label:"Data Siswa",
    icon:GraduationCap,
    component:SiswaPage,
    preload:loadSiswa,
  },
  {
    id:"staff",
    label:"Data Staff dan Guru",
    icon:Users,
    component:StaffPage,
    preload:loadStaff,
  },
];

const preloadedTabs=new Set();

function preloadTab(id){
  if(preloadedTabs.has(id))return;

  const item=USER_TABS.find(
    tab=>tab.id===id
  );

  if(!item)return;

  preloadedTabs.add(id);

  item.preload().catch(()=>{
    preloadedTabs.delete(id);
  });
}

function TabSkeleton(){
  return <div
    className="space-y-4"
    aria-hidden="true"
  >
    <div className="space-y-2">
      <div className="h-6 w-40 animate-pulse rounded-md bg-slate-100"/>
      <div className="h-3 w-72 max-w-full animate-pulse rounded bg-slate-100"/>
    </div>

    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white">
      <div className="border-b border-slate-100 p-3">
        <div className="h-9 animate-pulse rounded-lg bg-slate-50"/>
      </div>

      <div className="divide-y divide-slate-100">
        {Array.from(
          {length:5},
          (_,index)=>
            <div
              key={index}
              className="grid grid-cols-[2rem_1fr] gap-3 px-3 py-3 sm:grid-cols-[2rem_1.5fr_1fr_1fr]"
            >
              <div className="h-3 animate-pulse rounded bg-slate-100"/>
              <div className="space-y-2">
                <div className="h-3 w-40 max-w-full animate-pulse rounded bg-slate-100"/>
                <div className="h-2.5 w-28 max-w-full animate-pulse rounded bg-slate-50"/>
              </div>
              <div className="hidden h-3 animate-pulse rounded bg-slate-50 sm:block"/>
              <div className="hidden h-3 animate-pulse rounded bg-slate-50 sm:block"/>
            </div>
        )}
      </div>
    </div>
  </div>;
}

export default function ManajemenPengguna(){
  const [activeTab,changeTab]=useRouteTab(
    USER_TABS,
    "siswa"
  );

  const active=useMemo(
    ()=>USER_TABS.find(
      item=>item.id===activeTab
    )??USER_TABS[0],
    [activeTab]
  );

  const handleTabChange=useCallback(
    id=>{
      if(id===activeTab)return;

      preloadTab(id);

      startTransition(()=>{
        changeTab(id);
      });
    },
    [activeTab,changeTab]
  );

  const ActiveComponent=active.component;

  return <div className="min-w-0 text-slate-800">
    <div className="bg-white">
      <div className="border-b border-slate-100">
        <div
          role="tablist"
          aria-label="Jenis pengguna"
          className="flex overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {USER_TABS.map(item=>{
            const Icon=item.icon;
            const isActive=
              activeTab===item.id;

            return <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={()=>
                handleTabChange(item.id)
              }
              onPointerEnter={()=>
                preloadTab(item.id)
              }
              onFocus={()=>
                preloadTab(item.id)
              }
              onTouchStart={()=>
                preloadTab(item.id)
              }
              className={`group relative flex min-w-32 flex-1 flex-col items-center justify-center gap-1.5 border-b-2 px-3 py-3.5 transition-colors ${
                isActive
                  ?"border-[#ef4d45] bg-white text-[#ef4d45]"
                  :"border-transparent text-slate-400 hover:bg-slate-50/70 hover:text-slate-600"
              }`}
            >
              <Icon className="h-4 w-4"/>
              <span className="text-[10px] font-semibold uppercase tracking-wider">
                {item.label}
              </span>
            </button>;
          })}
        </div>
      </div>

      <div className="min-h-[520px] pt-5">
        <Suspense fallback={<TabSkeleton/>}>
          <div
            key={active.id}
            role="tabpanel"
            className="animate-in fade-in duration-150"
          >
            <ActiveComponent/>
          </div>
        </Suspense>
      </div>
    </div>
  </div>;
}
