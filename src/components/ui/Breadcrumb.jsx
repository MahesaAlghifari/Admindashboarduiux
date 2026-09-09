import {ChevronRight,Home} from "lucide-react";
import {useLocation} from "react-router-dom";

const ROUTES={
  "/dashboard":{label:"Dashboard"},
  "/pengguna":{label:"Data Pengguna",defaultTab:"siswa",tabs:{siswa:"Data Siswa",staff:"Data Staff dan Guru"}},
  "/manajemen-pengguna":{label:"Manajemen Pengguna",defaultTab:"student",tabs:{student:"Siswa",staff:"Staff & Guru"}},
  "/administrasi":{label:"Administrasi",defaultTab:"kurikulum",tabs:{kurikulum:"Kurikulum",aspek:"Aspek",perencanaan:"Perencanaan",jadwal:"Jadwal",kelas:"Data Kelas",pengumuman:"Pengumuman"}},
  "/kegiatan":{label:"Kegiatan Siswa",defaultTab:"presensi",tabs:{presensi:"Catat Presensi","rekap-presensi":"Rekap Presensi",penghubung:"Buku Penghubung",aktivitas:"Aktivitas Harian",perkembangan:"Perkembangan Siswa",rapor:"Rapor Siswa"}},
  "/keuangan":{label:"Keuangan",defaultTab:"tuition",tabs:{tuition:"SPP dan Tagihan",history:"Riwayat",expenses:"Pengeluaran",petty_cash:"Kas Kecil",payroll:"Penggajian",budget:"Anggaran",reports:"Laporan"}},
  "/laporan":{label:"Laporan",defaultTab:"rapor",tabs:{"buku-induk":"Buku Induk",rapor:"Cetak Rapor",absen:"Cetak Rekap Presensi",penghubung:"Buku Penghubung",aktivitas:"Laporan Aktivitas",perkembangan:"Grafik Perkembangan"}},
  "/pengaturan":{label:"Pengaturan",defaultTab:"access",tabs:{access:"Access Control",school:"Profil Sekolah",period:"Periode Akademik"}},
  "/profile":{label:"Profil Saya"},
  "/akses-ditolak":{label:"Akses Ditolak"},
};

const title=value=>String(value||"").replace(/-/g," ").replace(/\b\w/g,char=>char.toUpperCase());

export default function Breadcrumb(){
  const location=useLocation(),pathname=location.pathname.replace(/\/+$/g,"")||"/",config=ROUTES[pathname],params=new URLSearchParams(location.search);
  let items;
  if(/^\/administrasi\/kurikulum\/[^/]+\/edit$/.test(pathname))items=["Administrasi","Kurikulum","Atur Struktur"];
  else if(config){
    items=[config.label];
    if(config.tabs){const tab=params.get("tab")||config.defaultTab,label=config.tabs[tab]||config.tabs[config.defaultTab];if(label)items.push(label);}
  }else items=pathname.split("/").filter(Boolean).map(title);
  return <nav aria-label="Breadcrumb" className="min-h-4 text-[10px] font-medium leading-4 text-slate-300">
    <ol className="flex min-w-0 flex-wrap items-center gap-1">
      <li className="flex items-center text-slate-300" aria-disabled="true"><Home className="h-3 w-3"/></li>
      {items.map((item,index)=>{const last=index===items.length-1;return <li key={`${item}-${index}`} className="flex min-w-0 items-center gap-1"><ChevronRight className="h-3 w-3 shrink-0 text-slate-200"/><span aria-current={last?"page":undefined} className={`max-w-44 truncate ${last?"text-slate-500":"text-slate-300"}`}>{item}</span></li>;})}
    </ol>
  </nav>;
}
