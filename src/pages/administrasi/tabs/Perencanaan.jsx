import {useEffect,useMemo,useState} from "react";
import {useMutation,useQuery,useQueryClient} from "@tanstack/react-query";
import {ArrowPathIcon,CheckCircleIcon,ChevronLeftIcon,ChevronRightIcon,ExclamationTriangleIcon,FunnelIcon,MagnifyingGlassIcon,PencilSquareIcon,PlusCircleIcon,TrashIcon,XMarkIcon} from "@heroicons/react/24/outline";
import {createJournal,deleteJournal,fetchAllJournals,fetchJournals,updateJournal} from "../../../api/administrasi";
import {SectionHeader} from "../../../components/common/DesignSystem";
import {adminQueryKeys} from "../../../lib/adminQueryKeys";
import {apiErrorMessage} from "../../../lib/apiError";

const emptyForm=()=>({id:null,tema:"",pilar_karakter:"",nilai_karakter:"",jurnal:"",aktivitas:"",pembiasaan:""});
const text=value=>String(value??"").trim();
const keyOf=value=>text(value).toLocaleLowerCase("id-ID");
const uniqueSorted=values=>[...new Set(values.map(text).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"id",{numeric:true,sensitivity:"base"}));

function NoticeModal({notice,onClose}){
  if(!notice)return null;
  const danger=notice.tone==="danger",Icon=danger?ExclamationTriangleIcon:CheckCircleIcon;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]" onMouseDown={onClose}><section role="dialog" aria-modal="true" onMouseDown={event=>event.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-start gap-3 px-5 py-4"><span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${danger?"bg-rose-50 text-rose-600":"bg-emerald-50 text-emerald-600"}`}><Icon className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-800">{notice.title}</h3><p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-slate-500">{notice.message}</p></div><button type="button" onClick={onClose} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XMarkIcon className="h-4 w-4"/></button></div><div className="flex justify-end border-t border-slate-100 px-5 py-3"><button type="button" onClick={onClose} className="ui-action-button">Tutup</button></div></section></div>;
}

function ConfirmModal({confirm,busy,onCancel,onConfirm}){
  if(!confirm)return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-[1px]" onMouseDown={()=>!busy&&onCancel()}><section role="dialog" aria-modal="true" onMouseDown={event=>event.stopPropagation()} className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><div className="flex items-start gap-3 px-5 py-4"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-50 text-rose-600"><ExclamationTriangleIcon className="h-5 w-5"/></span><div className="min-w-0 flex-1"><h3 className="text-sm font-semibold text-slate-800">{confirm.title}</h3><p className="mt-1 whitespace-pre-line text-[11px] leading-5 text-slate-500">{confirm.message}</p></div></div><div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3"><button type="button" onClick={onCancel} disabled={busy} className="ui-action-button">Batal</button><button type="button" onClick={onConfirm} disabled={busy} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-rose-600 px-3 text-[10px] font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50">{busy&&<ArrowPathIcon className="h-3.5 w-3.5 animate-spin"/>}Hapus</button></div></section></div>;
}

export default function Perencanaan(){
  const queryClient=useQueryClient();
  const [searchInput,setSearchInput]=useState("");
  const [searchQuery,setSearchQuery]=useState("");
  const [filtersOpen,setFiltersOpen]=useState(false);
  const [page,setPage]=useState(1);
  const [perPage,setPerPage]=useState(10);
  const [selectMode,setSelectMode]=useState(false);
  const [selectedIds,setSelectedIds]=useState([]);
  const [modalOpen,setModalOpen]=useState(false);
  const [editing,setEditing]=useState(false);
  const [form,setForm]=useState(emptyForm());
  const [notice,setNotice]=useState(null);
  const [confirm,setConfirm]=useState(null);

  const params=useMemo(()=>({q:searchQuery||undefined,page,per_page:perPage}),[page,perPage,searchQuery]);
  const journalQuery=useQuery({queryKey:adminQueryKeys.journalList(params),queryFn:({signal})=>fetchJournals({...params,signal}),placeholderData:previous=>previous,staleTime:60_000});
  const masterQuery=useQuery({queryKey:adminQueryKeys.journalMaster,queryFn:({signal})=>fetchAllJournals(100,signal),enabled:modalOpen,staleTime:5*60_000});
  const saveMutation=useMutation({mutationFn:({id,payload})=>id==null?createJournal(payload):updateJournal(id,payload)});
  const deleteMutation=useMutation({mutationFn:id=>deleteJournal(id)});
  const bulkDeleteMutation=useMutation({mutationFn:targets=>Promise.allSettled(targets.map(item=>deleteJournal(item.id)))});

  const response=journalQuery.data;
  const rows=Array.isArray(response?.items)?response.items:[];
  const master=Array.isArray(masterQuery.data)?masterQuery.data:[];
  const total=Number(response?.total)||0;
  const totalPages=Math.max(1,Number(response?.total_pages)||1);
  const loading=journalQuery.isPending;
  const saving=saveMutation.isPending;
  const bulkDeleting=bulkDeleteMutation.isPending;
  const deletingId=deleteMutation.isPending?String(deleteMutation.variables??""):null;
  const filtersActive=Boolean(searchQuery);

  const invalidate=()=>Promise.all([queryClient.invalidateQueries({queryKey:adminQueryKeys.journals}),queryClient.invalidateQueries({queryKey:["kegiatan","daily-week"]})]);

  useEffect(()=>{const timer=window.setTimeout(()=>{setPage(1);setSearchQuery(text(searchInput));},300);return()=>window.clearTimeout(timer);},[searchInput]);
  useEffect(()=>{if(!response)return;if(total===0&&page>1)setPage(1);else if(total>0&&page>totalPages)setPage(totalPages);},[page,response,total,totalPages]);
  useEffect(()=>{setSelectedIds([]);},[page,searchQuery,perPage]);

  const themeOptions=useMemo(()=>uniqueSorted(master.map(item=>item.tema)),[master]);
  const pillarOptions=useMemo(()=>{const theme=keyOf(form.tema);return theme?uniqueSorted(master.filter(item=>keyOf(item.tema)===theme).map(item=>item.pilar_karakter)):[];},[form.tema,master]);
  const pillarOwner=useMemo(()=>{const pillar=keyOf(form.pilar_karakter);return pillar?master.find(item=>keyOf(item.pilar_karakter)===pillar&&String(item.id)!==String(form.id))||null:null;},[form.id,form.pilar_karakter,master]);
  const pillarConflict=Boolean(pillarOwner&&keyOf(pillarOwner.tema)!==keyOf(form.tema));

  const openModal=item=>{if(item){setForm({id:item.id,tema:item.tema??"",pilar_karakter:item.pilar_karakter??"",nilai_karakter:item.nilai_karakter??"",jurnal:item.isi_jurnal??"",aktivitas:item.aktivitas??"",pembiasaan:item.pembiasaan??""});setEditing(true);}else{setForm(emptyForm());setEditing(false);}setModalOpen(true);};
  const closeModal=()=>{if(saving)return;setModalOpen(false);setEditing(false);setForm(emptyForm());};
  const setField=(key,value)=>setForm(current=>({...current,[key]:value}));
  const handleTheme=value=>{const next=text(value);setForm(current=>{const owner=master.find(item=>keyOf(item.pilar_karakter)===keyOf(current.pilar_karakter)&&String(item.id)!==String(current.id));return {...current,tema:value,pilar_karakter:owner&&keyOf(owner.tema)!==keyOf(next)?"":current.pilar_karakter};});};

  const save=async event=>{
    event.preventDefault();
    const payload={tema:text(form.tema),pilar_karakter:text(form.pilar_karakter),nilai_karakter:text(form.nilai_karakter),isi_jurnal:text(form.jurnal),aktivitas:text(form.aktivitas),pembiasaan:text(form.pembiasaan)};
    if(!payload.tema||!payload.pilar_karakter){setNotice({tone:"danger",title:"Data Belum Lengkap",message:"Tema dan Pilar Karakter wajib diisi."});return;}
    const owner=master.find(item=>keyOf(item.pilar_karakter)===keyOf(payload.pilar_karakter)&&String(item.id)!==String(form.id));
    if(owner&&keyOf(owner.tema)!==keyOf(payload.tema)){setNotice({tone:"danger",title:"Pilar Karakter Sudah Digunakan",message:`Pilar Karakter “${payload.pilar_karakter}” sudah terikat pada Tema “${owner.tema}”.`});return;}
    try{await saveMutation.mutateAsync({id:editing&&form.id!==null?form.id:null,payload});closeModal();await invalidate();setNotice({tone:"success",title:editing?"Perencanaan Berhasil Diperbarui":"Perencanaan Berhasil Ditambahkan",message:`Tema “${payload.tema}” dengan Pilar Karakter “${payload.pilar_karakter}” berhasil disimpan.`});}catch(error){setNotice({tone:"danger",title:editing?"Perencanaan Gagal Diperbarui":"Perencanaan Gagal Ditambahkan",message:apiErrorMessage(error,{action:editing?"memperbarui":"menambahkan",subject:"perencanaan"})});}
  };

  const visibleIds=useMemo(()=>rows.map(item=>item?.id).filter(id=>id!==null&&id!==undefined).map(String),[rows]);
  const allVisibleSelected=visibleIds.length>0&&visibleIds.every(id=>selectedIds.includes(id));
  const toggleSelectMode=()=>{if(loading||saving||deletingId!==null||bulkDeleting||!rows.length)return;setSelectedIds([]);setSelectMode(value=>!value);};
  const toggleSelection=id=>{if(id==null||bulkDeleting)return;const key=String(id);setSelectedIds(previous=>previous.includes(key)?previous.filter(item=>item!==key):[...previous,key]);};
  const toggleAll=()=>setSelectedIds(previous=>allVisibleSelected?previous.filter(id=>!visibleIds.includes(id)):[...new Set([...previous,...visibleIds])]);

  const requestDelete=item=>setConfirm({type:"single",title:"Hapus Perencanaan",message:`Perencanaan Tema “${item.tema||"-"}” dengan Pilar “${item.pilar_karakter||"-"}” akan dihapus.`,item});
  const requestBulkDelete=()=>{const targets=rows.filter(item=>selectedIds.includes(String(item.id)));if(!targets.length)return;setConfirm({type:"bulk",title:"Hapus Perencanaan Terpilih",message:`${targets.length} perencanaan akan dihapus. Data yang sudah digunakan pada jadwal dapat ditolak oleh backend.`,targets});};
  const executeDelete=async()=>{
    if(!confirm)return;
    if(confirm.type==="single"){
      const item=confirm.item;
      try{await deleteMutation.mutateAsync(item.id);setConfirm(null);await invalidate();setNotice({tone:"success",title:"Perencanaan Berhasil Dihapus",message:`Tema “${item.tema||"-"}” berhasil dihapus.`});}catch(error){setConfirm(null);setNotice({tone:"danger",title:"Perencanaan Gagal Dihapus",message:apiErrorMessage(error,{action:"menghapus",subject:"perencanaan"})});}
      return;
    }
    const targets=confirm.targets;
    try{
      const results=await bulkDeleteMutation.mutateAsync(targets);
      const failed=results.map((result,index)=>result.status==="rejected"?targets[index]:null).filter(Boolean);
      const success=targets.filter(item=>!failed.some(fail=>String(fail.id)===String(item.id)));
      setConfirm(null);await invalidate();setSelectedIds(failed.map(item=>String(item.id)));if(!failed.length)setSelectMode(false);
      const parts=[];if(success.length)parts.push(`Berhasil dihapus: ${success.map(item=>item.tema||`ID ${item.id}`).join(", ")}.`);if(failed.length)parts.push(`Gagal dihapus: ${failed.map(item=>item.tema||`ID ${item.id}`).join(", ")}.`);
      setNotice({tone:failed.length?"danger":"success",title:failed.length?"Sebagian Perencanaan Gagal Dihapus":"Perencanaan Berhasil Dihapus",message:parts.join("\n")});
    }catch(error){setConfirm(null);setNotice({tone:"danger",title:"Perencanaan Gagal Dihapus",message:apiErrorMessage(error,{action:"menghapus",subject:"perencanaan"})});}
  };

  const queryError=journalQuery.isError?apiErrorMessage(journalQuery.error,{action:"memuat",subject:"perencanaan"}):"";
  const from=total?Math.min((page-1)*perPage+1,total):0,to=Math.min(page*perPage,total);

  return <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
    <SectionHeader icon={PencilSquareIcon} title="Perencanaan Pembelajaran" description="Susun tema, pilar karakter dan rencana kegiatan pembelajaran secara terstruktur." actions={<><span className="text-[10px] text-slate-400"><b className="font-semibold text-slate-600">{total}</b> perencanaan</span><button type="button" onClick={()=>setFiltersOpen(value=>!value)} className={`ui-toolbar-button ${filtersOpen||filtersActive?"is-active":""}`}><FunnelIcon className="h-4 w-4"/>Filter</button><button type="button" onClick={toggleSelectMode} disabled={loading||!rows.length} className={`ui-toolbar-button ${selectMode?"is-active":""}`}><CheckCircleIcon className="h-4 w-4"/>Pilih</button><button type="button" onClick={()=>openModal()} disabled={loading||saving||selectMode||bulkDeleting} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50"><PlusCircleIcon className="h-4 w-4"/>Tambah Perencanaan</button></>}/>

    {queryError&&<div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2.5 text-[11px] text-rose-700">{queryError}</div>}

    {filtersOpen&&<div className="flex flex-col gap-2 border-y border-slate-100 py-3 sm:flex-row sm:items-center"><div className="relative w-full sm:max-w-md"><MagnifyingGlassIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"/><input type="search" value={searchInput} onChange={event=>setSearchInput(event.target.value)} placeholder="Cari tema, pilar, nilai, jurnal atau aktivitas..." disabled={selectMode||bulkDeleting} className="ui-compact-control w-full pl-9"/></div>{filtersActive&&<button type="button" onClick={()=>{setSearchInput("");setSearchQuery("");setPage(1);}} className="ui-action-button self-start">Reset</button>}</div>}

    {selectMode&&<div className="flex flex-wrap items-center justify-between gap-2 border-y border-slate-100 py-2.5"><span className="text-[11px] text-slate-500"><b className="font-semibold text-slate-700">{selectedIds.length}</b> dipilih</span><div className="flex items-center gap-2"><button type="button" onClick={()=>{setSelectedIds([]);setSelectMode(false);}} disabled={bulkDeleting} className="ui-action-button">Batal</button><button type="button" onClick={requestBulkDelete} disabled={!selectedIds.length||bulkDeleting} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg border border-rose-200 px-3 text-[10px] font-semibold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"><TrashIcon className="h-3.5 w-3.5"/>Hapus ({selectedIds.length})</button></div></div>}

    <div className="ui-table-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-[980px] w-full">
          <thead><tr className="border-b border-slate-100 bg-slate-50/70">{selectMode&&<th className="w-11 px-3 py-2.5 text-center"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAll} disabled={bulkDeleting||!visibleIds.length} className="h-3.5 w-3.5 rounded border-slate-300 text-[#ef4d45] focus:ring-[#ef4d45]"/></th>}<th className="w-12 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">No</th><th className="min-w-52 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Tema & Pilar</th><th className="min-w-40 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Nilai Karakter</th><th className="min-w-72 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Jurnal & Aktivitas</th><th className="min-w-44 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400">Pembiasaan</th>{!selectMode&&<th className="w-20 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400">Aksi</th>}</tr></thead>
          <tbody>{loading?Array.from({length:Math.min(perPage,5)}).map((_,index)=><tr key={index} className="border-b border-slate-100 last:border-0"><td colSpan={selectMode?6:6} className="px-3 py-2.5"><div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-100"/></td></tr>):rows.length?rows.map((item,index)=><tr key={item.id} className={`border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50/60 ${selectedIds.includes(String(item.id))?"bg-red-50/30":""}`}>{selectMode&&<td className="px-3 py-2.5 text-center align-top"><input type="checkbox" checked={selectedIds.includes(String(item.id))} onChange={()=>toggleSelection(item.id)} disabled={bulkDeleting} className="h-3.5 w-3.5 rounded border-slate-300 text-[#ef4d45] focus:ring-[#ef4d45]"/></td>}<td className="px-3 py-2.5 align-top text-[11px] text-slate-400">{(page-1)*perPage+index+1}</td><td className="px-3 py-2.5 align-top"><p className="text-[11px] font-semibold text-slate-700">{item.tema||"-"}</p><p className="mt-0.5 text-[10px] leading-4 text-slate-400">{item.pilar_karakter||"-"}</p></td><td className="px-3 py-2.5 align-top text-[11px] leading-5 text-slate-600">{item.nilai_karakter||"-"}</td><td className="px-3 py-2.5 align-top"><p className="line-clamp-2 text-[11px] leading-5 text-slate-600">{item.isi_jurnal||"-"}</p><p className="mt-1 line-clamp-2 border-t border-slate-100 pt-1 text-[10px] leading-4 text-slate-400">{item.aktivitas||"-"}</p></td><td className="px-3 py-2.5 align-top text-[11px] leading-5 text-slate-600">{item.pembiasaan||"-"}</td>{!selectMode&&<td className="px-3 py-2.5 align-top"><div className="flex justify-end gap-1"><button type="button" onClick={()=>openModal(item)} disabled={saving||deletingId!==null} className="rounded-md p-1.5 text-slate-400 hover:bg-amber-50 hover:text-amber-600 disabled:opacity-40" title="Edit"><PencilSquareIcon className="h-4 w-4"/></button><button type="button" onClick={()=>requestDelete(item)} disabled={saving||deletingId!==null} className="rounded-md p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40" title="Hapus">{deletingId===String(item.id)?<ArrowPathIcon className="h-4 w-4 animate-spin"/>:<TrashIcon className="h-4 w-4"/>}</button></div></td>}</tr>):<tr><td colSpan={selectMode?6:6} className="px-4 py-12 text-center text-[11px] text-slate-400">{searchQuery?"Perencanaan tidak ditemukan.":"Belum ada data perencanaan."}</td></tr>}</tbody>
        </table>
      </div>
      {total>0&&<div className="flex flex-col gap-2 border-t border-slate-100 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-2 text-[10px] text-slate-400"><span>{from}-{to} dari {total}</span><select value={perPage} onChange={event=>{setPerPage(Number(event.target.value));setPage(1);}} disabled={loading||selectMode||bulkDeleting} className="h-7 rounded-md border border-slate-200 bg-white px-2 text-[10px] text-slate-600 outline-none focus:border-[#ef4d45]"><option value={5}>5</option><option value={10}>10</option><option value={25}>25</option></select></div><div className="flex items-center gap-1"><button type="button" onClick={()=>setPage(value=>Math.max(1,value-1))} disabled={loading||selectMode||bulkDeleting||page===1} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30"><ChevronLeftIcon className="h-3.5 w-3.5"/></button><span className="min-w-14 text-center text-[10px] font-medium text-slate-500">{page} / {totalPages}</span><button type="button" onClick={()=>setPage(value=>Math.min(totalPages,value+1))} disabled={loading||selectMode||bulkDeleting||page===totalPages} className="flex h-7 w-7 items-center justify-center rounded-md border border-slate-200 text-slate-400 hover:bg-slate-50 disabled:opacity-30"><ChevronRightIcon className="h-3.5 w-3.5"/></button></div></div>}
    </div>

    {modalOpen&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/25 p-4 backdrop-blur-[1px]" onMouseDown={closeModal}><section onMouseDown={event=>event.stopPropagation()} className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"><header className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4"><div><h3 className="text-sm font-semibold text-slate-800">{editing?"Edit Perencanaan":"Tambah Perencanaan"}</h3><p className="mt-0.5 text-[11px] text-slate-400">Tema menjadi induk Pilar Karakter. Isi rencana lainnya dapat disesuaikan.</p></div><button type="button" onClick={closeModal} disabled={saving} className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XMarkIcon className="h-4 w-4"/></button></header><form onSubmit={save} className="overflow-y-auto"><div className="space-y-4 px-5 py-4"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Tema</span><input type="text" list="tema-options" required value={form.tema} onChange={event=>handleTheme(event.target.value)} disabled={saving} placeholder="Pilih atau tulis tema" className="ui-compact-control w-full"/><datalist id="tema-options">{themeOptions.map(item=><option key={item} value={item}/>)}</datalist><span className="mt-1 block text-[10px] text-slate-400">Satu tema dapat memiliki banyak pilar karakter.</span></label><label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pilar Karakter</span><input type="text" list="pillar-options" required value={form.pilar_karakter} onChange={event=>setField("pilar_karakter",event.target.value)} disabled={saving} placeholder={form.tema?"Pilih atau tulis pilar":"Isi tema terlebih dahulu"} className={`ui-compact-control w-full ${pillarConflict?"!border-rose-300 !text-rose-700":""}`}/><datalist id="pillar-options">{pillarOptions.map(item=><option key={item} value={item}/>)}</datalist><span className={`mt-1 block text-[10px] ${pillarConflict?"text-rose-600":"text-slate-400"}`}>{pillarConflict?`Sudah terikat pada Tema “${pillarOwner.tema}”.`:"Satu pilar hanya terikat pada satu tema."}</span></label></div><div className="border-t border-slate-100 pt-4"><div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Nilai Karakter</span><input type="text" value={form.nilai_karakter} onChange={event=>setField("nilai_karakter",event.target.value)} disabled={saving} placeholder="Contoh: Tanggung Jawab" className="ui-compact-control w-full"/></label><label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Pembiasaan</span><input type="text" value={form.pembiasaan} onChange={event=>setField("pembiasaan",event.target.value)} disabled={saving} placeholder="Contoh: Berdoa sebelum belajar" className="ui-compact-control w-full"/></label><label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Aktivitas</span><textarea rows={4} value={form.aktivitas} onChange={event=>setField("aktivitas",event.target.value)} disabled={saving} placeholder="Isi aktivitas pembelajaran..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[11px] leading-5 text-slate-700 outline-none focus:border-[#ef4d45] focus:ring-1 focus:ring-[#ef4d45] disabled:bg-slate-50"/></label><label className="block"><span className="mb-1 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">Jurnal</span><textarea rows={4} value={form.jurnal} onChange={event=>setField("jurnal",event.target.value)} disabled={saving} placeholder="Isi jurnal kegiatan..." className="w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-[11px] leading-5 text-slate-700 outline-none focus:border-[#ef4d45] focus:ring-1 focus:ring-[#ef4d45] disabled:bg-slate-50"/></label></div></div></div><footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3"><button type="button" onClick={closeModal} disabled={saving} className="ui-action-button">Batal</button><button type="submit" disabled={saving||pillarConflict||masterQuery.isPending||masterQuery.isError} className="inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-[#ef4d45] px-4 text-[10px] font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50">{saving&&<ArrowPathIcon className="h-3.5 w-3.5 animate-spin"/>}{saving?"Menyimpan...":"Simpan"}</button></footer></form></section></div>}

    <ConfirmModal confirm={confirm} busy={deleteMutation.isPending||bulkDeleting} onCancel={()=>setConfirm(null)} onConfirm={executeDelete}/>
    <NoticeModal notice={notice} onClose={()=>setNotice(null)}/>
  </div>;
}
