import{j as e,r,e as We,l as L,h as je,d as Je,F as Ve}from"./index-CbExjZeZ.js";import{fetchKegiatanClassrooms as Ze,fetchCommunicationBookReportPeriods as Qe,fetchKegiatanCurrentAcademicPeriod as Xe,fetchSchoolProfile as et,fetchCommunicationBookReport as tt}from"./kegiatan-sRxdCWK9.js";import{fetchAllReportStudents as at,mergeCommunicationReportStudents as st}from"./report-students-BWWE_emQ.js";import{fetchStaff as nt}from"./staff-Bv-lrrjn.js";import{fetchAcademicYearOptions as lt}from"./academic-periods-CyfC8DFj.js";import{_ as rt}from"./logo-BrWziYHr.js";import{R as it}from"./ReportPageHeading-C-xLv8gg.js";import{f as Ne,a as ot,c as dt,e as ct}from"./academicYear-C2T7n_E-.js";import{E as xt,s as we,C as ye,a as mt,b as ve}from"./StudentEducationMeta-BmnrfPun.js";import{F as ut}from"./BookOpenIcon-DC1-WHp2.js";import{F}from"./PrinterIcon-CRUHEXo5.js";import{F as pt}from"./MagnifyingGlassIcon-CvXdtJI-.js";import{F as ht}from"./EyeIcon-C008KQRe.js";import{F as bt}from"./UserGroupIcon-4fZ30ZCJ.js";import{F as gt}from"./ChevronLeftIcon-BRaHRppr.js";import{F as ft}from"./ChevronRightIcon-Bz5WynSv.js";import{F as jt}from"./ArrowPathIcon-C1SJMkIo.js";import"./react-CJLMTRQJ.js";import"./classrooms-BwyQ5bWJ.js";import"./administrasi-C_hu5LuC.js";import"./school-calendar-Bh_9dMwA.js";import"./students-DVrgGPoZ.js";import"./users-BBGmxq3w.js";const Nt=Object.assign({"../img/logo.png":rt}),O=Object.entries(Nt),be=O.find(([t])=>/logo/i.test(t))||O.find(([t])=>/sekolah.?ss/i.test(t))||(O.length===1?O[0]:null),ge=be?be[1]:"",j=t=>String(t??"").trim(),b=t=>j(t)||"-",X=t=>{const s=j(t).slice(0,10);if(!s)return"-";const n=new Date(`${s}T00:00:00`);return Number.isNaN(n.getTime())?s:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(n)},wt=t=>{const s=j(t).slice(0,10);if(!s)return"-";const n=new Date(`${s}T00:00:00`);return Number.isNaN(n.getTime())?s:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric"}).format(n)},ke=t=>({nama_sekolah:j(t?.nama_sekolah)||"SEKOLAH SS",alamat:j(t?.alamat)||j(t?.alamat_jalan_2)||"Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",telepon:j(t?.telepon)||"0811 - 9141 - 285",email:j(t?.email)||"adm.sekolahss@gmail.com"});function yt({profile:t,periodLabel:s}){const n=ke(t);return e.jsxs("header",{className:"cb-print-header",children:[e.jsx("div",{className:"cb-print-logo",children:ge?e.jsx("img",{src:ge,alt:`Logo ${n.nama_sekolah}`}):e.jsx("div",{className:"cb-print-logo-fallback",children:"SS"})}),e.jsxs("div",{className:"cb-print-header-copy",children:[e.jsx("div",{className:"cb-print-school",children:n.nama_sekolah}),e.jsxs("div",{className:"cb-print-school-meta",children:[n.alamat," · Telp ",n.telepon," · ",n.email]}),e.jsx("h1",{children:"LAPORAN BUKU PENGHUBUNG"}),e.jsxs("div",{className:"cb-print-period",children:["Per Siswa · ",s]})]})]})}function vt({value:t}){const s=j(t).toLowerCase(),n=["ya","true","1"].includes(s),i=s&&!n;return e.jsxs("div",{className:"cb-choice-wrap",children:[e.jsxs("span",{className:"cb-choice",children:[e.jsx("b",{children:n?"✓":""})," Ya"]}),e.jsxs("span",{className:"cb-choice",children:[e.jsx("b",{children:i?"✓":""})," Tidak"]})]})}function kt({item:t,book:s,profile:n,periodLabel:i,homeroomTeacher:d,printedAt:c}){const o=s.days[0]?.tanggal,v=s.days.at(-1)?.tanggal;return e.jsxs("section",{className:"cb-print-page",children:[e.jsx(yt,{profile:n,periodLabel:i}),e.jsxs("div",{className:"cb-print-identity",children:[e.jsxs("div",{children:[e.jsx("span",{children:"Nama Anak Didik"}),e.jsx("b",{children:b(t.nama_lengkap)})]}),e.jsxs("div",{children:[e.jsx("span",{children:"NIS"}),e.jsx("b",{children:b(t.nomor_induk||t.nis||t.nisn)})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Kelas"}),e.jsx("b",{children:b(t.classroom_name)})]}),e.jsxs("div",{children:[e.jsx("span",{children:"Minggu"}),e.jsx("b",{children:b(s.week)})]}),e.jsxs("div",{className:"cb-print-period-cell",children:[e.jsx("span",{children:"Periode Minggu"}),e.jsxs("b",{children:[X(o)," s.d. ",X(v)]})]})]}),e.jsxs("table",{className:"cb-print-table",children:[e.jsx("thead",{children:e.jsxs("tr",{children:[e.jsx("th",{className:"cb-day-col",children:"Hari / Tanggal"}),e.jsx("th",{className:"cb-sleep-col",children:"Jam Tidur"}),e.jsx("th",{className:"cb-bab-col",children:"Anak BAB"}),e.jsx("th",{className:"cb-temp-col",children:"Suhu Tubuh"}),e.jsx("th",{className:"cb-breakfast-col",children:"Menu Sarapan"}),e.jsx("th",{className:"cb-note-col",children:"Catatan Orang Tua"}),e.jsx("th",{className:"cb-note-col",children:"Catatan Guru"})]})}),e.jsx("tbody",{children:s.days.map(m=>e.jsxs("tr",{children:[e.jsxs("td",{children:[e.jsx("b",{children:m.hari}),e.jsx("div",{className:"cb-date",children:wt(m.tanggal)}),m.is_holiday&&e.jsx("div",{className:"cb-holiday",children:m.holiday_label||"Libur"})]}),e.jsx("td",{children:b(m.jam_tidur)}),e.jsx("td",{children:e.jsx(vt,{value:m.anak_bab})}),e.jsx("td",{className:"cb-center",children:j(m.suhu_tubuh)?`${m.suhu_tubuh} °C`:"-"}),e.jsx("td",{children:b(m.menu_sarapan)}),e.jsx("td",{className:"cb-note-cell",children:b(m.catatan_ortu)}),e.jsx("td",{className:"cb-note-cell",children:b(m.catatan_guru)})]},`${s.week}-${m.hari}`))})]}),e.jsxs("div",{className:"cb-print-signatures",children:[e.jsxs("div",{className:"cb-signature",children:[e.jsx("div",{children:"Mengetahui,"}),e.jsx("div",{children:"Orang Tua / Wali"}),e.jsx("div",{className:"cb-signature-space"}),e.jsx("div",{className:"cb-signature-line",children:"( ____________________ )"})]}),e.jsxs("div",{className:"cb-signature",children:[e.jsx("div",{children:X(c)}),e.jsx("div",{children:"Wali Kelas"}),e.jsx("div",{className:"cb-signature-space"}),e.jsx("div",{className:"cb-signature-name",children:b(d?.nama_lengkap)}),e.jsxs("div",{children:["NIP. ",b(d?.nip)]})]})]}),e.jsxs("div",{className:"cb-print-footer",children:[e.jsx("span",{children:ke(n).nama_sekolah}),e.jsxs("span",{children:["Buku Penghubung · ",b(t.nama_lengkap)," · ",b(s.week)]})]})]})}function _t({items:t=[],profile:s,periodLabel:n="",homeroomTeachers:i={},printedAt:d=new Date}){return e.jsxs("div",{className:"cb-print-document",children:[e.jsx("style",{children:`
        @page { size:A4 landscape; margin:6mm; }

        .cb-print-document { color:#111827; font-family:Arial,Helvetica,sans-serif; font-size:8.2pt; line-height:1.28; }

        .cb-print-page {
          box-sizing: border-box;
          width: 100%;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid-page;
        }

        .cb-print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .cb-print-header { display:flex; align-items:center; gap:8px; border-bottom:1.5px solid #111827; padding-bottom:4px; }

        .cb-print-logo { width:40px; height:40px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }

        .cb-print-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .cb-print-logo-fallback { width:35px; height:35px; border:1.2px solid #111827; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12pt; font-weight:700; }

        .cb-print-header-copy {
          flex: 1;
          text-align: center;
        }

        .cb-print-school { font-size:12pt; font-weight:700; }

        .cb-print-school-meta { margin-top:1px; font-size:7pt; color:#6b7280; }

        .cb-print-header h1 { margin:3px 0 0; font-size:13pt; letter-spacing:.04em; }

        .cb-print-period { margin-top:1px; font-size:7.4pt; font-weight:600; color:#4b5563; }

        .cb-print-identity {
          display: grid;
          margin-top: 5px;
          grid-template-columns: 1.35fr 1fr .75fr .75fr 1.45fr;
          border: 1px solid #9ca3af;
        }

        .cb-print-identity > div {
          min-height: 30px;
          border-right: 1px solid #d1d5db;
          padding: 4px 6px;
          box-sizing: border-box;
        }

        .cb-print-identity > div:last-child {
          border-right: 0;
        }

        .cb-print-identity span {
          display: block;
          font-size: 7pt;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: .03em;
        }

        .cb-print-identity b {
          display: block;
          margin-top: 2px;
          font-size: 9pt;
        }

        .cb-print-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-top: 6px;
        }

        .cb-print-table th,
        .cb-print-table td {
          border: 1px solid #9ca3af;
          padding: 5px 6px;
          vertical-align: top;
          overflow-wrap: anywhere;
        }

        .cb-print-table th {
          background: #f3f4f6;
          text-align: center;
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: .02em;
        }

        .cb-print-table tbody tr {
          height: 18mm;
        }

        .cb-day-col { width: 10%; }
        .cb-sleep-col { width: 9%; }
        .cb-bab-col { width: 10%; }
        .cb-temp-col { width: 8%; }
        .cb-breakfast-col { width: 13%; }
        .cb-note-col { width: 25%; }

        .cb-date {
          margin-top: 2px;
          font-size: 7.5pt;
          color: #6b7280;
        }

        .cb-holiday {
          display: inline-block;
          margin-top: 4px;
          padding: 1px 5px;
          border: 1px solid #f59e0b;
          border-radius: 999px;
          font-size: 6.8pt;
          font-weight: 700;
          color: #92400e;
        }

        .cb-center { text-align: center; }

        .cb-note-cell {
          font-size: 8.5pt;
          line-height: 1.3;
        }

        .cb-choice-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 8pt;
        }

        .cb-choice {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .cb-choice b {
          display: inline-flex;
          width: 12px;
          height: 12px;
          align-items: center;
          justify-content: center;
          border: 1px solid #6b7280;
          font-size: 8pt;
          line-height: 1;
        }

        .cb-print-signatures {
          display: flex;
          justify-content: space-between;
          gap: 20mm;
          margin: 7px 10mm 0;
        }

        .cb-signature {
          width: 62mm;
          text-align: center;
          font-size: 8.5pt;
        }

        .cb-signature-space { height: 11mm; }
        .cb-signature-name { font-weight: 700; text-decoration: underline; }
        .cb-signature-line { font-weight: 600; }

        .cb-print-footer {
          margin-top: 5px;
          border-top: 1px solid #d1d5db;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 7pt;
          color: #6b7280;
        }

        @media screen {
          .cb-print-page {
            background: white;
            margin: 0 auto 18px;
            padding: 7mm;
            max-width: 297mm;
            box-shadow: 0 8px 30px rgba(15, 23, 42, .12);
          }
        }

        @media print {
          .cb-print-page {
            margin: 0;
            padding: 0;
          }
        }
      `}),t.flatMap(c=>(c.books||[]).map(o=>e.jsx(kt,{item:c,book:o,profile:s,periodLabel:n,homeroomTeacher:i[String(c.classroom_id)]||null,printedAt:d},`${c.id}-${o.week}`)))]})}const _e="ssphere:rapor:staff-actor-cache:v1",St=[10,20,50,100],g=t=>String(t??"").trim(),f=t=>String(t??""),ee=t=>g(t).toLowerCase().replace(/\s+/g," "),Ct=t=>g(t?.response?.data?.detail||t?.response?.data?.message||t?.message)||"Terjadi kesalahan.",P=t=>{const s=t.getFullYear(),n=String(t.getMonth()+1).padStart(2,"0"),i=String(t.getDate()).padStart(2,"0");return`${s}-${n}-${i}`},Pt=(t=new Date)=>`${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,"0")}`,Dt=(t=new Date)=>{const s=new Date(t.getFullYear(),t.getMonth(),t.getDate());s.setHours(0,0,0,0),s.setDate(s.getDate()+3-(s.getDay()+6)%7);const n=new Date(s.getFullYear(),0,4),i=1+Math.round(((s.getTime()-n.getTime())/864e5-3+(n.getDay()+6)%7)/7);return`${s.getFullYear()}-W${String(i).padStart(2,"0")}`},Tt=t=>{const s=/^(\d{4})-W(\d{2})$/.exec(g(t));if(!s)return{dari:"",sampai:""};const n=Number(s[1]),i=Number(s[2]),d=new Date(n,0,4),c=d.getDay()||7,o=new Date(d);o.setDate(d.getDate()-c+1+(i-1)*7);const v=new Date(o);return v.setDate(o.getDate()+4),{dari:P(o),sampai:P(v)}},$t=t=>{const s=/^(\d{4})-(\d{2})$/.exec(g(t));if(!s)return{dari:"",sampai:""};const n=Number(s[1]),i=Number(s[2]);return{dari:P(new Date(n,i-1,1)),sampai:P(new Date(n,i,0))}},At=(t,s)=>{const n=Number(g(t).split("/")[0]);return Number.isFinite(n)?Number(s)===2?{dari:`${n+1}-01-01`,sampai:`${n+1}-06-30`}:{dari:`${n}-07-01`,sampai:`${n}-12-31`}:{dari:"",sampai:""}},Rt=t=>{const s=Number(g(t).split("/")[0]);return Number.isFinite(s)?{dari:`${s}-07-01`,sampai:`${s+1}-06-30`}:{dari:"",sampai:""}},N=t=>{const s=g(t).slice(0,10);if(!s)return"-";const n=new Date(`${s}T00:00:00`);return Number.isNaN(n.getTime())?s:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"short",year:"numeric"}).format(n)},Bt=(t,s)=>!t||!s?!1:t.id!==null&&t.id!==void 0&&s.id!==null&&s.id!==void 0&&f(t.id)===f(s.id)||g(t.nik)&&g(s.nik)&&g(t.nik)===g(s.nik)?!0:ee(t.nama_lengkap)&&ee(t.nama_lengkap)===ee(s.nama_lengkap),Ft=(t,s)=>{const n=t?.wali_kelas;return n?s.find(i=>Bt(i,n))||{...n,nip:""}:null},Mt=()=>{try{const t=window.localStorage.getItem(_e),s=t?JSON.parse(t):[];return Array.isArray(s)?s:[]}catch{return[]}},Et=t=>{try{window.localStorage.setItem(_e,JSON.stringify(t||[]))}catch{}};function fe({checked:t,indeterminate:s=!1,onChange:n,label:i}){const d=r.useRef(null);return r.useEffect(()=>{d.current&&(d.current.indeterminate=s)},[s]),e.jsx("input",{ref:d,type:"checkbox",checked:t,onChange:n,"aria-label":i,className:"h-4 w-4 cursor-pointer rounded border-slate-300 accent-[#e94640]"})}function y({label:t,value:s,detail:n,tone:i="slate"}){const d={slate:"bg-slate-50 text-slate-700",blue:"bg-blue-50 text-blue-700",amber:"bg-amber-50 text-amber-700",green:"bg-emerald-50 text-emerald-700"};return e.jsxs("div",{className:"rounded-xl border border-slate-200 bg-white p-4 shadow-sm",children:[e.jsx("div",{className:`inline-flex rounded-lg px-2 py-1 text-xs font-semibold ${d[i]||d.slate}`,children:t}),e.jsx("div",{className:"mt-2 text-xl font-semibold text-slate-800",children:s}),e.jsx("div",{className:"mt-0.5 text-xs text-slate-400",children:n})]})}function It({notice:t,onClose:s}){if(r.useEffect(()=>{if(!t)return;const i=window.setTimeout(s,3800);return()=>window.clearTimeout(i)},[t,s]),!t)return null;const n=t.type==="error";return L.createPortal(e.jsx("div",{className:"fixed right-5 top-5 z-170 w-[min(92vw,390px)] rounded-xl border border-slate-200 bg-white p-4 shadow-xl",children:e.jsxs("div",{className:"flex items-start gap-3",children:[e.jsx("div",{className:`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${n?"bg-rose-50 text-rose-600":"bg-emerald-50 text-emerald-600"}`,children:n?e.jsx(Je,{className:"h-4 w-4"}):e.jsx(Ve,{className:"h-4 w-4"})}),e.jsxs("div",{className:"min-w-0 flex-1",children:[e.jsx("div",{className:"text-sm font-semibold text-slate-800",children:t.title}),e.jsx("div",{className:"mt-1 text-xs leading-5 text-slate-500",children:t.message})]}),e.jsx("button",{type:"button",onClick:s,className:"rounded-lg p-1 text-slate-400 hover:bg-slate-100",children:e.jsx(je,{className:"h-4 w-4"})})]})}),document.body)}function zt({item:t,periodLabel:s,range:n,onClose:i,onPrint:d}){return r.useEffect(()=>{const c=document.body.style.overflow;document.body.style.overflow="hidden";const o=v=>v.key==="Escape"&&i();return window.addEventListener("keydown",o),()=>{document.body.style.overflow=c,window.removeEventListener("keydown",o)}},[i]),L.createPortal(e.jsx("div",{className:"fixed inset-0 z-[150] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]",children:e.jsxs("section",{className:"flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl",children:[e.jsxs("header",{className:"flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-xs font-semiboldr text-slate-400",children:"LAPORAN BUKU PENGHUBUNG"}),e.jsx("h3",{className:"mt-1 text-lg font-bold text-slate-900",children:t.nama_lengkap}),e.jsxs("div",{className:"mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500",children:[e.jsx("span",{children:we(t)||"-"}),e.jsx(ye,{name:t.classroom_name||"-",educationState:t.education_state}),e.jsx("span",{children:s})]})]}),e.jsx("button",{type:"button",onClick:i,className:"rounded-lg p-2 text-slate-400 hover:bg-slate-100",children:e.jsx(je,{className:"h-5 w-5"})})]}),e.jsxs("div",{className:"overflow-y-auto p-5",children:[e.jsxs("div",{className:"mb-5 grid gap-3 sm:grid-cols-4",children:[e.jsx(y,{label:"Minggu",value:t.stats.weeks,detail:"Buku tersimpan"}),e.jsx(y,{label:"Hari Berisi",value:t.stats.filled_days,detail:"Hari dengan data",tone:"green"}),e.jsx(y,{label:"Catatan Orang Tua",value:t.stats.parent_notes,detail:"Catatan masuk",tone:"amber"}),e.jsx(y,{label:"Catatan Guru",value:t.stats.teacher_notes,detail:"Catatan sekolah",tone:"blue"})]}),e.jsx("div",{className:"space-y-5",children:t.books.map(c=>e.jsxs("div",{className:"overflow-hidden rounded-xl border border-slate-200",children:[e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3",children:[e.jsxs("div",{className:"text-sm font-semibold text-slate-700",children:["Minggu ",c.week]}),e.jsxs("div",{className:"text-xs text-slate-400",children:[N(c.days[0]?.tanggal)," s.d. ",N(c.days.at(-1)?.tanggal)]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"min-w-[1320px] w-full text-left text-xs",children:[e.jsx("thead",{className:"bg-white text-xs uppercase text-slate-400",children:e.jsxs("tr",{children:[e.jsx("th",{className:"px-3 py-3",children:"Hari / Tanggal"}),e.jsx("th",{className:"px-3 py-3",children:"Tahun Ajaran"}),e.jsx("th",{className:"px-3 py-3",children:"Status Pendidikan"}),e.jsx("th",{className:"px-3 py-3",children:"Jam Tidur"}),e.jsx("th",{className:"px-3 py-3",children:"BAB"}),e.jsx("th",{className:"px-3 py-3",children:"Suhu"}),e.jsx("th",{className:"px-3 py-3",children:"Menu Sarapan"}),e.jsx("th",{className:"px-3 py-3",children:"Catatan Orang Tua"}),e.jsx("th",{className:"px-3 py-3",children:"Catatan Guru"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100",children:c.days.map(o=>e.jsxs("tr",{children:[e.jsxs("td",{className:"px-3 py-3 font-semibold text-slate-700",children:[o.hari,e.jsx("div",{className:"mt-0.5 font-normal text-slate-400",children:N(o.tanggal)})]}),e.jsx("td",{className:"whitespace-nowrap px-3 py-3 font-medium text-slate-600",children:Ne(new Date(`${o.tanggal}T00:00:00`))}),e.jsx("td",{className:"px-3 py-3",children:e.jsx(ve,{state:t.education_state})}),e.jsx("td",{className:"px-3 py-3 text-slate-600",children:o.jam_tidur||"-"}),e.jsx("td",{className:"px-3 py-3 text-slate-600",children:o.anak_bab||"-"}),e.jsx("td",{className:"px-3 py-3 text-slate-600",children:o.suhu_tubuh?`${o.suhu_tubuh} °C`:"-"}),e.jsx("td",{className:"px-3 py-3 text-slate-600",children:o.menu_sarapan||"-"}),e.jsx("td",{className:"max-w-60 px-3 py-3 leading-5 text-slate-600",children:o.catatan_ortu||"-"}),e.jsx("td",{className:"max-w-60 px-3 py-3 leading-5 text-slate-600",children:o.catatan_guru||"-"})]},`${c.week}-${o.hari}`))})]})})]},c.week))})]}),e.jsxs("footer",{className:"flex flex-col-reverse gap-2 border-t border-slate-100 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-between",children:[e.jsxs("div",{className:"text-xs text-slate-400",children:[N(n.dari)," s.d. ",N(n.sampai)]}),e.jsxs("div",{className:"flex gap-2",children:[e.jsx("button",{type:"button",onClick:i,className:"rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50",children:"Tutup"}),e.jsxs("button",{type:"button",onClick:()=>d(t),className:"inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-xs font-semibold text-white hover:bg-slate-700",children:[e.jsx(F,{className:"h-4 w-4"}),"Cetak Buku"]})]})]})]})}),document.body)}function Ot({count:t,totalBooks:s,loading:n,onCancel:i,onConfirm:d}){return L.createPortal(e.jsx("div",{className:"fixed inset-0 z-160 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]",children:e.jsxs("section",{className:"w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl",children:[e.jsx("div",{className:"flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700",children:e.jsx(F,{className:"h-5 w-5"})}),e.jsx("h3",{className:"mt-4 text-lg font-bold text-slate-900",children:"Cetak Laporan Buku Penghubung"}),e.jsxs("p",{className:"mt-2 text-sm leading-6 text-slate-500",children:[t," anak didik akan dicetak dengan total ",s," minggu Buku Penghubung. Setiap minggu dicetak sebagai satu halaman dokumen."]}),e.jsxs("div",{className:"mt-6 flex justify-end gap-2",children:[e.jsx("button",{type:"button",disabled:n,onClick:i,className:"rounded-lg border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-50",children:"Batal"}),e.jsxs("button",{type:"button",disabled:n,onClick:d,className:"inline-flex items-center gap-2 rounded-lg bg-[#e94640] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#d63d38] disabled:opacity-50",children:[n?e.jsx(jt,{className:"h-4 w-4 animate-spin"}):e.jsx(F,{className:"h-4 w-4"}),"Lanjut Cetak"]})]})]})}),document.body)}function ca(){const[t,s]=r.useState("weekly"),[n,i]=r.useState(()=>Ne()),[d,c]=r.useState(()=>ot()),[o,v]=r.useState(()=>Dt()),[m,Se]=r.useState(()=>Pt()),[S,te]=r.useState(()=>{const a=new Date,l=new Date(a.getFullYear(),a.getMonth(),1);return{dari:P(l),sampai:P(a)}}),[D,Ce]=r.useState([]),[ae,Pe]=r.useState([]),[se,De]=r.useState(()=>Mt()),[Te,$e]=r.useState(null),[k,Ae]=r.useState("all"),[T,Re]=r.useState("all"),[Y,Be]=r.useState(""),[M,Fe]=r.useState(""),[ne,H]=r.useState({dari:"",sampai:"",items:[],total_books:0,total_days:0}),[G,le]=r.useState(!0),[$,A]=r.useState(new Set),[Me,E]=r.useState(1),[C,Ee]=r.useState(20),[re,U]=r.useState(null),[Ie,K]=r.useState(null),[R,q]=r.useState(null),[ie,oe]=r.useState(null),[ze,de]=r.useState(!1),x=r.useMemo(()=>t==="weekly"?Tt(o):t==="monthly"?$t(m):t==="semester"?At(n,d):t==="year"?Rt(n):S,[t,o,m,n,d,S]),W=r.useMemo(()=>{if(t==="weekly")return`Minggu ${o}`;if(t==="monthly"){const[a,l]=m.split("-").map(Number),h=new Date(a,l-1,1);return new Intl.DateTimeFormat("id-ID",{month:"long",year:"numeric"}).format(h)}return t==="semester"?`Semester ${Number(d)===1?"I (Ganjil)":"II (Genap)"} ${n}`:t==="year"?`Tahun Ajaran ${n}`:`${N(x.dari)} s.d. ${N(x.sampai)}`},[t,o,m,d,n,x]),ce=r.useCallback(async()=>{const[a,l,h,u,he,Q]=await Promise.allSettled([Ze(),Qe(),lt(),Xe(),et(),nt()]);if(a.status==="fulfilled"&&Ce(a.value),l.status==="fulfilled"||h.status==="fulfilled"){const z=new Map;l.status==="fulfilled"&&l.value.forEach(w=>{w?.tahun_ajaran&&z.set(w.tahun_ajaran,w)}),h.status==="fulfilled"&&h.value.forEach(w=>{z.has(w)||z.set(w,{tahun_ajaran:w})}),Pe([...z.values()].sort((w,qe)=>qe.tahun_ajaran.localeCompare(w.tahun_ajaran)))}u.status==="fulfilled"&&(i(dt(u.value)),c(ct(u.value))),he.status==="fulfilled"&&$e(he.value),Q.status==="fulfilled"&&(De(Q.value),Et(Q.value))},[]);r.useEffect(()=>{ce()},[ce]),r.useEffect(()=>{const a=window.setTimeout(()=>Fe(Y),300);return()=>window.clearTimeout(a)},[Y]);const xe=r.useCallback(async()=>{if(!x.dari||!x.sampai||x.dari>x.sampai){H({dari:x.dari,sampai:x.sampai,items:[],total_books:0,total_days:0});return}le(!0);try{const[a,l]=await Promise.all([tt({dari:x.dari,sampai:x.sampai,classroom_id:k,q:M}),at({classroom_id:k,q:M,dari:x.dari,sampai:x.sampai})]);H(st(a,l))}catch(a){H({dari:x.dari,sampai:x.sampai,items:[],total_books:0,total_days:0}),K({type:"error",title:"Gagal memuat Buku Penghubung",message:Ct(a)})}finally{le(!1)}},[x,k,M]);r.useEffect(()=>{xe()},[xe]),r.useEffect(()=>{A(new Set),E(1),U(null)},[t,o,m,n,d,S.dari,S.sampai,k,T,M]);const p=r.useMemo(()=>ne.items.filter(a=>T==="all"||a.education_state===T),[T,ne.items]),I=Math.max(1,Math.ceil(p.length/C)),_=Math.min(Me,I),J=r.useMemo(()=>p.slice((_-1)*C,_*C),[p,_,C]),B=J.map(a=>f(a.id)),me=B.length>0&&B.every(a=>$.has(a)),Oe=B.some(a=>$.has(a))&&!me,V=p.filter(a=>$.has(f(a.id))),ue=r.useMemo(()=>p.reduce((a,l)=>({parent:a.parent+l.stats.parent_notes,teacher:a.teacher+l.stats.teacher_notes,dataPoints:a.dataPoints+l.stats.data_points}),{parent:0,teacher:0,dataPoints:0}),[p]),Le=r.useMemo(()=>new Map(D.map(a=>[f(a.id),a])),[D]),Ye=r.useMemo(()=>{const a={};return D.forEach(l=>{a[f(l.id)]=Ft(l,se)}),a},[D,se]),He=a=>{const l=f(a);A(h=>{const u=new Set(h);return u.has(l)?u.delete(l):u.add(l),u})},Ge=()=>{A(a=>{const l=new Set(a),h=B.every(u=>l.has(u));return B.forEach(u=>h?l.delete(u):l.add(u)),l})},Ue=()=>{A(new Set(p.map(a=>f(a.id))))},Z=a=>{const l=a.filter(h=>Array.isArray(h.books)&&h.books.length>0);if(!l.length){K({type:"error",title:"Data belum tersedia",message:"Buku Penghubung yang dipilih belum memiliki data tersimpan untuk periode ini."});return}q({items:l,totalBooks:l.reduce((h,u)=>h+Number(u.stats?.weeks??u.books.length),0)})},Ke=()=>{if(!R?.items?.length)return;de(!0);const a={items:R.items,profile:Te,periodLabel:W,dateRange:x,homeroomTeachers:Ye,printedAt:new Date};oe(a),q(null);const l=()=>{oe(null),de(!1)};window.addEventListener("afterprint",l,{once:!0}),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>{window.print()})})},pe=k==="all"?null:Le.get(f(k));return e.jsxs("div",{className:"min-w-0",children:[e.jsx("style",{children:`
        @media print {
          body > * { display: none !important; }
          #communication-book-print-root {
            display: block !important;
            position: absolute;
            inset: 0;
            width: 100%;
            background: white;
            z-index: 99999;
          }
        }
      `}),e.jsxs("div",{className:"flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",children:[e.jsx(it,{icon:ut,title:"LAPORAN BUKU PENGHUBUNG",description:"Rekap komunikasi mingguan antara orang tua dan guru berdasarkan siswa, kelas, dan periode."}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsxs("button",{type:"button",disabled:G||V.length===0,onClick:()=>Z(V),className:"inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40",children:[e.jsx(F,{className:"h-4 w-4"}),"Cetak Terpilih (",V.length,")"]}),e.jsxs("button",{type:"button",disabled:G||p.length===0,onClick:()=>Z(p),className:"inline-flex items-center gap-2 rounded-xl bg-[#e94640] px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-[#d63d38] disabled:cursor-not-allowed disabled:opacity-40",children:[e.jsx(F,{className:"h-4 w-4"}),"Cetak Semua"]})]})]}),e.jsxs("div",{className:"mt-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm",children:[e.jsxs("div",{className:"grid gap-4 xl:grid-cols-[170px_1fr_190px_220px_250px]",children:[e.jsxs("div",{children:[e.jsx("label",{className:"mb-1.5 block text-xs font-semibold text-slate-400",children:"Jenis Periode"}),e.jsxs("select",{value:t,onChange:a=>s(a.target.value),className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 outline-none focus:border-[#e94640]",children:[e.jsx("option",{value:"weekly",children:"Mingguan"}),e.jsx("option",{value:"monthly",children:"Bulanan"}),e.jsx("option",{value:"semester",children:"Semester"}),e.jsx("option",{value:"year",children:"Tahun Ajaran"}),e.jsx("option",{value:"range",children:"Rentang Tanggal"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-1.5 block text-xs font-semibold text-slate-400",children:"Periode"}),t==="weekly"&&e.jsx("input",{type:"week",value:o,onChange:a=>v(a.target.value),className:"h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"}),t==="monthly"&&e.jsx("input",{type:"month",value:m,onChange:a=>Se(a.target.value),className:"h-10 w-full rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"}),t==="semester"&&e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsx("select",{value:n,onChange:a=>i(a.target.value),className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]",children:ae.map(a=>e.jsx("option",{value:a.tahun_ajaran,children:a.tahun_ajaran},a.tahun_ajaran))}),e.jsxs("select",{value:d,onChange:a=>c(Number(a.target.value)),className:"h-10 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]",children:[e.jsx("option",{value:1,children:"Semester I"}),e.jsx("option",{value:2,children:"Semester II"})]})]}),t==="year"&&e.jsx("select",{value:n,onChange:a=>i(a.target.value),className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]",children:ae.map(a=>e.jsx("option",{value:a.tahun_ajaran,children:a.tahun_ajaran},a.tahun_ajaran))}),t==="range"&&e.jsxs("div",{className:"grid grid-cols-2 gap-2",children:[e.jsx("input",{type:"date",value:S.dari,onChange:a=>te(l=>({...l,dari:a.target.value})),className:"h-10 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"}),e.jsx("input",{type:"date",value:S.sampai,onChange:a=>te(l=>({...l,sampai:a.target.value})),className:"h-10 rounded-lg border border-slate-200 px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-1.5 block text-xs font-semibold text-slate-400",children:"Kelas"}),e.jsxs("select",{value:k,onChange:a=>Ae(a.target.value),className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]",children:[e.jsx("option",{value:"all",children:"Semua Kelas"}),D.map(a=>e.jsx("option",{value:a.id,children:a.nama_kelas},a.id))]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-1.5 block text-xs font-semibold text-slate-400",children:"Status Pendidikan"}),e.jsx("select",{value:T,onChange:a=>Re(a.target.value),className:"h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-700 outline-none focus:border-[#e94640]",children:xt.map(a=>e.jsx("option",{value:a.value,children:a.label},a.value))})]}),e.jsxs("div",{children:[e.jsx("label",{className:"mb-1.5 block text-xs font-semibold text-slate-400",children:"Cari Anak Didik"}),e.jsxs("div",{className:"relative",children:[e.jsx(pt,{className:"pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:"search",value:Y,onChange:a=>Be(a.target.value),placeholder:"Cari berdasarkan nama, NIS, atau kelas...",className:"h-10 w-full rounded-lg border border-slate-200 pl-9 pr-3 text-xs text-slate-700 outline-none focus:border-[#e94640]"})]})]})]}),e.jsxs("div",{className:"mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-400",children:[e.jsx(We,{className:"h-4 w-4"}),e.jsx("span",{children:W}),e.jsx("span",{children:"•"}),e.jsxs("span",{children:[N(x.dari)," s.d. ",N(x.sampai)]}),pe&&e.jsxs(e.Fragment,{children:[e.jsx("span",{children:"•"}),e.jsx("span",{children:pe.nama_kelas})]})]})]}),e.jsxs("div",{className:"mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-5",children:[e.jsx(y,{label:"Anak Didik",value:p.length,detail:"Sesuai filter"}),e.jsx(y,{label:"Buku Mingguan",value:p.reduce((a,l)=>a+Number(l.stats?.weeks??0),0),detail:"Minggu tersimpan",tone:"green"}),e.jsx(y,{label:"Hari Berisi",value:p.reduce((a,l)=>a+Number(l.stats?.filled_days??0),0),detail:"Hari dengan data",tone:"blue"}),e.jsx(y,{label:"Catatan Orang Tua",value:ue.parent,detail:"Komunikasi dari rumah",tone:"amber"}),e.jsx(y,{label:"Catatan Guru",value:ue.teacher,detail:"Komunikasi sekolah",tone:"blue"})]}),e.jsxs("div",{className:"mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm",children:[e.jsxs("div",{className:"flex flex-col gap-3 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",children:[e.jsxs("div",{children:[e.jsx("div",{className:"text-sm font-semibold text-slate-800",children:"Data Buku Penghubung"}),e.jsx("div",{className:"mt-0.5 text-xs text-slate-400",children:"Pilih anak didik untuk melihat detail atau mencetak Buku Penghubung."})]}),e.jsxs("div",{className:"flex flex-wrap gap-2",children:[e.jsx("button",{type:"button",disabled:!p.length,onClick:Ue,className:"rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40",children:"Pilih Semua Data"}),$.size>0&&e.jsx("button",{type:"button",onClick:()=>A(new Set),className:"rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-500 hover:bg-slate-50",children:"Hapus Pilihan"})]})]}),e.jsx("div",{className:"overflow-x-auto",children:e.jsxs("table",{className:"w-full min-w-[1380px]",children:[e.jsx("thead",{className:"bg-slate-50/70",children:e.jsxs("tr",{children:[e.jsx("th",{className:"w-12 px-4 py-3 text-center",children:e.jsx(fe,{checked:me,indeterminate:Oe,onChange:Ge,label:"Pilih semua pada halaman"})}),e.jsx("th",{className:"w-14 px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"No"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"Anak Didik"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"NIS"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"Kelas"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"Tahun Ajaran"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"Status Pendidikan"}),e.jsx("th",{className:"px-4 py-3 text-center text-xs font-semibold text-slate-400",children:"Minggu"}),e.jsx("th",{className:"px-4 py-3 text-center text-xs font-semibold text-slate-400",children:"Hari"}),e.jsx("th",{className:"px-4 py-3 text-center text-xs font-semibold text-slate-400",children:"Catatan Ortu"}),e.jsx("th",{className:"px-4 py-3 text-center text-xs font-semibold text-slate-400",children:"Catatan Guru"}),e.jsx("th",{className:"px-4 py-3 text-left text-xs font-semibold text-slate-400",children:"Terakhir"}),e.jsx("th",{className:"w-20 px-4 py-3 text-center text-xs font-semibold text-slate-400",children:"Detail"})]})}),e.jsx("tbody",{className:"divide-y divide-slate-100",children:G?Array.from({length:6},(a,l)=>e.jsx("tr",{children:e.jsx("td",{colSpan:13,className:"px-4 py-4",children:e.jsx("div",{className:"h-5 animate-pulse rounded bg-slate-100"})})},l)):J.length>0?J.map((a,l)=>e.jsxs("tr",{className:"transition hover:bg-slate-50/70",children:[e.jsx("td",{className:"px-4 py-3 text-center",children:e.jsx(fe,{checked:$.has(f(a.id)),onChange:()=>He(a.id),label:`Pilih ${a.nama_lengkap}`})}),e.jsx("td",{className:"px-4 py-3 text-xs text-slate-400",children:(_-1)*C+l+1}),e.jsx("td",{className:"px-4 py-3",children:e.jsx("div",{className:"text-sm font-semibold text-slate-700",children:a.nama_lengkap})}),e.jsx("td",{className:"px-4 py-3 text-xs text-slate-600",children:we(a)||"-"}),e.jsx("td",{className:"px-4 py-3",children:e.jsx(ye,{name:a.classroom_name,educationState:a.education_state})}),e.jsx("td",{className:"px-4 py-3 text-xs font-medium text-slate-600",children:mt(a)||"-"}),e.jsx("td",{className:"px-4 py-3",children:e.jsx(ve,{state:a.education_state})}),e.jsx("td",{className:"px-4 py-3 text-center text-sm font-semibold text-slate-700",children:a.stats.weeks}),e.jsx("td",{className:"px-4 py-3 text-center text-sm text-slate-600",children:a.stats.filled_days}),e.jsx("td",{className:"px-4 py-3 text-center",children:e.jsx("span",{className:"inline-flex min-w-7 justify-center rounded-full bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700",children:a.stats.parent_notes})}),e.jsx("td",{className:"px-4 py-3 text-center",children:e.jsx("span",{className:"inline-flex min-w-7 justify-center rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700",children:a.stats.teacher_notes})}),e.jsx("td",{className:"px-4 py-3 text-xs text-slate-500",children:N(a.stats.last_activity)}),e.jsx("td",{className:"px-4 py-3 text-center",children:e.jsx("button",{type:"button",onClick:()=>U(a),className:"rounded-lg p-2 text-slate-400 transition hover:bg-red-50 hover:text-[#e94640]",title:"Lihat detail",children:e.jsx(ht,{className:"h-4 w-4"})})})]},a.id)):e.jsx("tr",{children:e.jsxs("td",{colSpan:13,className:"px-6 py-14 text-center",children:[e.jsx(bt,{className:"mx-auto h-9 w-9 text-slate-200"}),e.jsx("div",{className:"mt-3 text-sm font-semibold text-slate-600",children:"Belum ada Buku Penghubung pada periode ini"}),e.jsx("div",{className:"mt-1 text-xs text-slate-400",children:"Ubah periode, kelas, atau pencarian yang digunakan."})]})})})]})}),e.jsxs("div",{className:"flex flex-col gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",children:[e.jsxs("div",{className:"flex items-center gap-2 text-xs text-slate-500",children:[e.jsx("span",{children:"Tampilkan"}),e.jsx("select",{value:C,onChange:a=>{Ee(Number(a.target.value)),E(1)},className:"rounded border border-slate-200 bg-white px-2 py-1 text-xs outline-none",children:St.map(a=>e.jsx("option",{value:a,children:a},a))}),e.jsxs("span",{children:["dari ",p.length," anak didik"]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{type:"button",disabled:_<=1,onClick:()=>E(a=>Math.max(1,a-1)),className:"rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40",children:e.jsx(gt,{className:"h-4 w-4"})}),e.jsxs("span",{className:"min-w-20 text-center text-xs text-slate-500",children:[_," / ",I]}),e.jsx("button",{type:"button",disabled:_>=I,onClick:()=>E(a=>Math.min(I,a+1)),className:"rounded-lg border border-slate-200 bg-white p-2 text-slate-500 hover:bg-slate-50 disabled:opacity-40",children:e.jsx(ft,{className:"h-4 w-4"})})]})]})]}),re&&e.jsx(zt,{item:re,periodLabel:W,range:x,onClose:()=>U(null),onPrint:a=>Z([a])}),R&&e.jsx(Ot,{count:R.items.length,totalBooks:R.totalBooks,loading:ze,onCancel:()=>q(null),onConfirm:Ke}),e.jsx(It,{notice:Ie,onClose:()=>K(null)}),typeof document<"u"&&ie&&L.createPortal(e.jsx("div",{id:"communication-book-print-root",style:{display:"none"},children:e.jsx(_t,{...ie})}),document.body)]})}export{ca as default};
