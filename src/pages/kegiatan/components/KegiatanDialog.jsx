import {useCallback,useEffect,useState} from "react";
import {CheckCircleIcon,ExclamationTriangleIcon,InformationCircleIcon,XCircleIcon,XMarkIcon} from "@heroicons/react/24/outline";

const CONFIG={success:{Icon:CheckCircleIcon,icon:"border-emerald-200 bg-emerald-50 text-emerald-600",button:"bg-emerald-600 hover:bg-emerald-700"},error:{Icon:XCircleIcon,icon:"border-rose-200 bg-rose-50 text-rose-600",button:"bg-rose-600 hover:bg-rose-700"},warning:{Icon:ExclamationTriangleIcon,icon:"border-amber-200 bg-amber-50 text-amber-600",button:"bg-amber-600 hover:bg-amber-700"},info:{Icon:InformationCircleIcon,icon:"border-sky-200 bg-sky-50 text-sky-600",button:"bg-slate-800 hover:bg-slate-700"}};

export function useKegiatanDialog(){
  const [dialog,setDialog]=useState(null);
  const notify=useCallback(({type="info",title,message})=>setDialog({type,title,message,confirm:false}),[]);
  const confirm=useCallback(({type="warning",title,message,confirmLabel="Lanjutkan",cancelLabel="Batal"})=>new Promise(resolve=>setDialog({type,title,message,confirm:true,confirmLabel,cancelLabel,resolve})),[]);
  const close=useCallback(result=>setDialog(current=>{current?.resolve?.(Boolean(result));return null;}),[]);
  return {dialog,notify,confirm,close};
}

export function KegiatanDialog({dialog,onClose}){
  useEffect(()=>{if(!dialog)return undefined;const previous=document.body.style.overflow,handleKey=event=>event.key==="Escape"&&onClose(false);document.body.style.overflow="hidden";window.addEventListener("keydown",handleKey);return()=>{document.body.style.overflow=previous;window.removeEventListener("keydown",handleKey);};},[dialog,onClose]);
  if(!dialog)return null;
  const config=CONFIG[dialog.type]??CONFIG.info,Icon=config.Icon;
  return <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]" onMouseDown={()=>onClose(false)}><section role="dialog" aria-modal="true" onMouseDown={event=>event.stopPropagation()} className="w-full max-w-md overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"><div className="flex items-start gap-3 px-5 py-4"><span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${config.icon}`}><Icon className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-800">{dialog.title}</h3><p className="mt-1 whitespace-pre-line text-[12px] leading-5 text-slate-500">{dialog.message}</p></div><button type="button" onClick={()=>onClose(false)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600" aria-label="Tutup"><XMarkIcon className="h-4 w-4"/></button></div><div className="flex justify-end gap-2 border-t border-slate-100 bg-slate-50/60 px-5 py-3">{dialog.confirm&&<button type="button" onClick={()=>onClose(false)} className="ui-toolbar-button">{dialog.cancelLabel}</button>}<button type="button" onClick={()=>onClose(true)} className={`inline-flex h-9 items-center justify-center rounded-lg px-4 text-xs font-semibold text-white ${config.button}`}>{dialog.confirm?dialog.confirmLabel:"Tutup"}</button></div></section></div>;
}
