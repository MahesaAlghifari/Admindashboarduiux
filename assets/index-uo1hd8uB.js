import{j as a,r as m,Y as $a,h as oa}from"./index-CsIhJmVP.js";import{u as ma}from"./useQuery-DXjMQyNl.js";import{fetchStudentById as Da}from"./students-C0AOidBx.js";import{contextualizeReportStudents as Ra,fetchAllReportStudents as za}from"./report-students--yudG5eW.js";import{fetchAcademicPeriods as Oa}from"./academic-periods-DihpcRp-.js";import{fetchSchoolProfile as Ha}from"./kegiatan-bfVsD07P.js";import{_ as Wa}from"./logo-DBgabt-N.js";import{S as Ya}from"./DesignSystem-DSaiaxMk.js";import{C as qa}from"./StudentEducationMeta-Dbz5AL6c.js";import{F as Ua}from"./FunnelIcon-CUfsEJfn.js";import{F as Va}from"./UserGroupIcon-BWHOSYri.js";import{F as O}from"./ArrowPathIcon-D-9CwXBR.js";import{F as Q}from"./PrinterIcon-CvQZgBLk.js";import{F as da}from"./IdentificationIcon-D_dUszKT.js";import{F as Ga}from"./MagnifyingGlassIcon-wGSM-3N0.js";import"./react-CJLMTRQJ.js";import"./classrooms-BzpSXJAc.js";import"./users-CZUkCB7t.js";import"./administrasi-DjMQ08q5.js";import"./school-calendar-BdBTC9D4.js";const Ja=Object.assign({"../img/logo.png":Wa}),H=Object.entries(Ja),ca=H.find(([e])=>/logo/i.test(e))||H.find(([e])=>/sekolah.?ss/i.test(e))||(H.length===1?H[0]:null),Qa=ca?ca[1]:"",i=e=>String(e??"").trim(),b=e=>i(e)||"-",Z=e=>{if(e===""||e===null||e===void 0)return"0";const s=Number(e);return Number.isFinite(s)&&s>=0?String(s):"-"},ha=(e,s="")=>{const t=Number(e);return Number.isFinite(t)&&t>0?`${t}${s?` ${s}`:""}`:"-"},Za=e=>{const s=Number(e);return Number.isFinite(s)&&s>=0?`${s} km`:"-"},T=e=>{const s=i(e).slice(0,10);if(!s)return"-";const t=new Date(`${s}T00:00:00`);return Number.isNaN(t.getTime())?s:new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(t)},xa=e=>i(e?.classroom?.nama_kelas)||i(e?.classroom_name)||i(e?.classroom_nama)||i(e?.nama_kelas),ua=e=>i(e?.status?.tahun_pelajaran)||i(e?.tahun_ajaran)||i(e?.tahun_pelajaran),Xa=e=>({...e?.parent_detail??{},...e?.parent??{}}),ae=e=>({...e?.development??{},...e?.dev??{}}),ee=e=>i(e?.nama_lembaga_asal)||i(e?.alamat_lembaga_asal)||i(e?.kelompok_umur_sebelumnya)?"pindahan":i(e?.asal_peserta_didik)||i(e?.nama_lembaga)||i(e?.alamat_lembaga)?"baru":"",te=e=>{const s=e?.status??{},t=i(s?.alasan_keluar).toLocaleLowerCase("id");return/lulus|tamat/.test(t)?"lulus":t||i(s?.ke_lembaga)?"pindah":i(s?.lembaga_lanjutan)||i(s?.nomor_surat_keterangan)||i(s?.tanggal_keluar)||s?.status_aktif===!1?"lulus":""},ga=e=>e?.status?.status_aktif===!1?"Tidak Aktif":"Aktif",se=e=>({nama_sekolah:i(e?.nama_sekolah)||i(e?.school_name)||i(e?.nama)||"SEKOLAH SS",alamat:i(e?.alamat)||i(e?.alamat_sekolah)||i(e?.alamat_jalan_2)||i(e?.address)||"Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",telepon:i(e?.telepon)||i(e?.no_telepon)||i(e?.phone)||"0811 - 9141 - 285",email:i(e?.email)||i(e?.email_sekolah)||"adm.sekolahss@gmail.com",npsn:i(e?.npsn),logo:i(e?.logo)||i(e?.logo_sekolah)||i(e?.school_logo)||Qa});function ne({profile:e,subtitle:s}){const t=se(e);return a.jsxs("header",{className:"mb-header",children:[a.jsx("div",{className:"mb-logo",children:t.logo?a.jsx("img",{src:t.logo,alt:`Logo ${t.nama_sekolah}`}):a.jsx("div",{className:"mb-logo-fallback",children:"SS"})}),a.jsxs("div",{className:"mb-header-copy",children:[a.jsx("div",{className:"mb-school-name",children:t.nama_sekolah}),a.jsxs("div",{className:"mb-school-meta",children:[t.alamat," · Telp ",t.telepon," · ",t.email,t.npsn?` · NPSN ${t.npsn}`:""]}),a.jsx("h1",{children:"BUKU INDUK PESERTA DIDIK"}),a.jsx("div",{className:"mb-header-subtitle",children:s})]})]})}function j({label:e,value:s}){return a.jsxs("div",{className:"mb-info-row",children:[a.jsx("div",{className:"mb-info-label",children:e}),a.jsx("div",{className:"mb-info-sep",children:":"}),a.jsx("div",{className:"mb-info-value",children:b(s)})]})}function F({code:e,children:s}){return a.jsxs("div",{className:"mb-section-title",children:[a.jsx("span",{children:e}),a.jsx("b",{children:s})]})}function y({left:e=[],right:s=[]}){return a.jsxs("div",{className:"mb-data-grid",children:[a.jsx("div",{className:"mb-data-column",children:e.map(([t,d])=>a.jsx(j,{label:t,value:d},t))}),a.jsx("div",{className:"mb-data-column",children:s.map(([t,d])=>a.jsx(j,{label:t,value:d},t))})]})}function pa({label:e,value:s}){return a.jsx("div",{className:"mb-wide-row",children:a.jsx(j,{label:e,value:s})})}function ie({student:e}){const s=xa(e),t=ua(e);return a.jsxs("div",{className:"mb-student-identity",children:[a.jsx("div",{className:"mb-photo",children:i(e?.foto)?a.jsx("img",{src:e.foto,alt:i(e?.nama_lengkap)}):a.jsxs("span",{children:["FOTO",a.jsx("br",{}),"3 × 4"]})}),a.jsxs("div",{className:"mb-identity-data",children:[a.jsx(j,{label:"Nama Lengkap",value:e?.nama_lengkap}),a.jsx(j,{label:"NIS",value:e?.nomor_induk||e?.nis||e?.nisn}),a.jsx(j,{label:"NIK",value:e?.nik}),a.jsx(j,{label:"Penempatan Kelas",value:s}),a.jsx(j,{label:"Tahun Ajaran",value:t}),a.jsx(j,{label:"Status Pendidikan",value:ga(e)})]})]})}function le({rows:e=[]}){const s=Array.isArray(e)?e.slice(0,3):[];return s.length===0||!s.some(t=>i(t?.tahun)||Number(t?.berat_badan)>0||Number(t?.tinggi_badan)>0||i(t?.penyakit)||i(t?.kelainan_jiwa))?a.jsx("div",{className:"mb-empty-note",children:"Belum ada riwayat keadaan jasmani."}):a.jsxs("table",{className:"mb-history-table",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{children:"Tahun"}),a.jsx("th",{children:"Berat Badan"}),a.jsx("th",{children:"Tinggi Badan"}),a.jsx("th",{children:"Penyakit"}),a.jsx("th",{children:"Kelainan"})]})}),a.jsx("tbody",{children:s.map((t,d)=>a.jsxs("tr",{children:[a.jsx("td",{children:b(t?.tahun)}),a.jsx("td",{children:ha(t?.berat_badan,"kg")}),a.jsx("td",{children:ha(t?.tinggi_badan,"cm")}),a.jsx("td",{children:b(t?.penyakit)}),a.jsx("td",{children:b(t?.kelainan_jiwa)})]},`${i(t?.tahun)}-${d}`))})]})}function re({student:e}){const s=e?.status??{},t=ee(e);if(t==="pindahan")return a.jsxs("div",{className:"mb-context-block",children:[a.jsx("div",{className:"mb-context-heading",children:"Pindah Dari"}),a.jsx(y,{left:[["Pindah Dari",e?.nama_lembaga_asal],["Kelompok / Kelas Sebelumnya",e?.kelompok_umur_sebelumnya]],right:[["Tanggal Keluar Lembaga Sebelumnya",T(s?.tanggal_pindah)],["Alamat Lembaga Asal",e?.alamat_lembaga_asal]]})]});if(t==="baru"){const d=i(e?.asal_peserta_didik)==="Rumah";return a.jsxs("div",{className:"mb-context-block",children:[a.jsx("div",{className:"mb-context-heading",children:"Masuk Menjadi Peserta Didik Baru"}),a.jsx(y,{left:[["Asal Peserta Didik",e?.asal_peserta_didik],["Nama Lembaga",d?"-":e?.nama_lembaga]],right:[["Tanggal Keluar Lembaga Sebelumnya",d?"-":T(s?.tanggal_pindah)],["Alamat Lembaga",d?"-":e?.alamat_lembaga]]})]})}return a.jsx("div",{className:"mb-empty-note",children:"Riwayat masuk siswa belum dipilih pada StudentForm."})}function oe({student:e}){const s=e?.status??{},t=te(e);return t==="pindah"?a.jsxs("div",{className:"mb-context-block",children:[a.jsx("div",{className:"mb-context-heading",children:"Status Keluar: Pindah / Mengundurkan Diri"}),a.jsx(y,{left:[["Ke Lembaga",s?.ke_lembaga],["Tanggal Keluar",T(s?.tanggal_keluar)]],right:[["Alasan / Sebab",s?.alasan_keluar]]})]}):t==="lulus"?a.jsxs("div",{className:"mb-context-block",children:[a.jsx("div",{className:"mb-context-heading",children:"Status Keluar: Lulus / Melanjutkan"}),a.jsx(y,{left:[["Melanjutkan ke Lembaga",s?.lembaga_lanjutan],["Tanggal Keluar",T(s?.tanggal_keluar)]],right:[["Nomor/Tgl. Surat Ket.",s?.nomor_surat_keterangan]]})]}):a.jsxs("div",{className:"mb-context-block",children:[a.jsx("div",{className:"mb-context-heading",children:"Status Keluar: Belum Keluar"}),a.jsx("div",{className:"mb-empty-note",children:"Siswa masih berada di lembaga."})]})}function me(){return a.jsxs("div",{className:"mb-signatures",children:[a.jsxs("div",{className:"mb-signature-box",children:[a.jsx("span",{children:"Orang Tua / Wali"}),a.jsx("div",{className:"mb-sign-space"}),a.jsx("b",{children:"(................................................)"})]}),a.jsxs("div",{className:"mb-signature-box",children:[a.jsx("span",{children:"Mengetahui,"}),a.jsx("span",{children:"Kepala Sekolah"}),a.jsx("div",{className:"mb-sign-space"}),a.jsx("b",{children:"(................................................)"})]})]})}function fa({student:e,page:s}){return a.jsxs("div",{className:"mb-footer",children:[a.jsx("span",{children:"Buku Induk Peserta Didik"}),a.jsxs("span",{children:[b(e?.nama_lengkap)," · ",b(e?.nisn)," · Halaman ",s,"/2"]})]})}function de({student:e,profile:s}){const t=Xa(e);return a.jsxs("section",{className:"mb-page",children:[a.jsx(ne,{profile:s,subtitle:"Identitas, Domisili, Orang Tua & Wali"}),a.jsx(ie,{student:e}),a.jsx(F,{code:"A",children:"IDENTITAS"}),a.jsx(y,{left:[["Nama Lengkap",e?.nama_lengkap],["Nama Panggilan",e?.nama_panggilan],["NIS",e?.nomor_induk||e?.nis||e?.nisn],["NIK",e?.nik],["Tempat Lahir",e?.tempat_lahir]],right:[["Tanggal Lahir",T(e?.tanggal_lahir)],["Jenis Kelamin",e?.jenis_kelamin],["Agama",e?.agama],["Kewarganegaraan",e?.kewarganegaraan]]}),a.jsx(F,{code:"B",children:"DOMISILI"}),a.jsx(pa,{label:"Alamat Lengkap",value:e?.alamat_lengkap}),a.jsx(y,{left:[["Nomor Telepon Rumah",e?.no_telepon_rumah],["Status Tempat Tinggal",e?.status_tempat_tinggal],["Jarak ke Sekolah",Za(e?.jarak_ke_sekolah)],["Bahasa Sehari-hari",e?.bahasa_sehari_hari]],right:[["Saudara Kandung",Z(e?.jumlah_saudara_kandung)],["Saudara Tiri",Z(e?.jumlah_saudara_tiri)],["Saudara Angkat",Z(e?.jumlah_saudara_angkat)]]}),a.jsx(F,{code:"C",children:"ORANG TUA & WALI"}),a.jsx(pa,{label:"Nomor Ponsel Orang Tua",value:t?.no_hp_ortu}),a.jsx(y,{left:[["Nama Ayah",t?.nama_ayah],["Pendidikan Ayah",t?.pendidikan_ayah],["Pekerjaan Ayah",t?.pekerjaan_ayah],["Nama Ibu",t?.nama_ibu],["Pendidikan Ibu",t?.pendidikan_ibu],["Pekerjaan Ibu",t?.pekerjaan_ibu]],right:[["Nama Wali",t?.nama_wali],["Pendidikan Wali",t?.pendidikan_wali],["Pekerjaan Wali",t?.pekerjaan_wali],["Hubungan",t?.hubungan_keluarga_wali]]}),a.jsx(fa,{student:e,page:1})]})}function ce({student:e}){const s=e?.status??{},t=ae(e),d=xa(e),h=ua(e),g=Array.isArray(t?.riwayat_perkembangan)?t.riwayat_perkembangan:[];return a.jsxs("section",{className:"mb-page mb-page-continuation",children:[a.jsxs("div",{className:"mb-page-identity",children:[a.jsxs("div",{children:[a.jsx("span",{children:"Nama Peserta Didik"}),a.jsx("b",{children:b(e?.nama_lengkap)})]}),a.jsxs("div",{children:[a.jsx("span",{children:"NIS"}),a.jsx("b",{children:b(e?.nomor_induk||e?.nis||e?.nisn)})]}),a.jsxs("div",{children:[a.jsx("span",{children:"Penempatan Kelas"}),a.jsx("b",{children:b(d)})]}),a.jsxs("div",{children:[a.jsx("span",{children:"Tahun Ajaran"}),a.jsx("b",{children:b(h)})]})]}),a.jsx(F,{code:"D",children:"PERKEMBANGAN — KEADAAN JASMANI (RIWAYAT)"}),a.jsx(le,{rows:g}),a.jsx(F,{code:"E",children:"PENDIDIKAN"}),a.jsx(re,{student:e}),a.jsx("div",{className:"mb-subtitle",children:"Lembaga Saat Ini"}),a.jsx(y,{left:[["Tahun Ajaran",h],["Tanggal Masuk",T(s?.tanggal_masuk)],["Status Pendidikan",ga(e)]],right:[["Penempatan Kelas",d],["Prestasi Belajar",t?.prestasi_belajar]]}),a.jsx("div",{className:"mb-subtitle",children:"Status Keluar dari Lembaga"}),a.jsx(oe,{student:e}),a.jsx("div",{className:"mb-subtitle",children:"Catatan Penting"}),a.jsx("div",{className:"mb-notes",children:b(e?.catatan_penting)}),a.jsx(me,{}),a.jsx(fa,{student:e,page:2})]})}function he({students:e=[],profile:s={}}){return a.jsx("div",{className:"student-master-book-print",children:e.map((t,d)=>{const h=t?.id??t?.student_id??t?.nisn??t?.nik??d;return a.jsxs("div",{className:"mb-student-document",children:[a.jsx(de,{student:t,profile:s}),a.jsx(ce,{student:t})]},h)})})}const pe=`
#student-master-book-print-root { display:none; }

@media print {
  /* 1. Ratakan margin A4 agar kalkulasi tinggi halaman akurat */
  @page { size: A4 portrait; margin: 10mm; }

  html, body {
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  body * { visibility: hidden !important; }

  #student-master-book-print-root,
  #student-master-book-print-root * { visibility: visible !important; }

  #student-master-book-print-root {
    display: block !important;
    /* Menghapus position: absolute & inset: 0 yang menyebabkan konten panjang terpotong */
    position: relative !important; 
    width: auto !important;
    margin: 0 !important;
    padding: 0 !important;
    background: #fff !important;
  }

  .student-master-book-print {
    width: 100%;
    margin: 0;
    padding: 0;
    color: #111827;
    font-family: Arial, Helvetica, sans-serif;
    font-size: 9pt;
    line-height: 1.28;
  }

  .mb-student-document { display: block; }

  .mb-page {
    box-sizing: border-box;
    position: relative;
    width: 100%;
    /* Tinggi A4 (297mm) dikurangi total margin atas-bawah (20mm) */
    min-height: 277mm; 
    padding-bottom: 5mm;
    page-break-after: always;
    break-after: page;
    page-break-inside: avoid;
    background: #fff;
    /* Gunakan flexbox agar footer terdorong rapi ke bawah */
    display: flex;
    flex-direction: column;
  }

  .mb-student-document:last-child .mb-page:last-child {
    page-break-after: auto;
    break-after: auto;
  }

  .mb-header {
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1.5px solid #111827;
    padding-bottom: 4px;
  }

  .mb-logo {
    width: 42px;
    height: 42px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 42px;
  }

  .mb-logo img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .mb-logo-fallback {
    width: 36px;
    height: 36px;
    border: 1.2px solid #111827;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12pt;
    font-weight: 700;
  }

  .mb-header-copy { flex: 1; text-align: center; min-width: 0; }
  .mb-school-name { font-size: 12pt; font-weight: 700; text-transform: uppercase; }
  .mb-school-meta { margin-top: 1px; font-size: 7.2pt; color: #6b7280; }
  .mb-header h1 { margin: 3px 0 0; font-size: 13pt; letter-spacing: .04em; }
  .mb-header-subtitle { margin-top: 1px; font-size: 7.6pt; font-weight: 600; color: #4b5563; }

  .mb-student-identity {
    display: grid;
    grid-template-columns: 26mm minmax(0,1fr);
    gap: 4mm;
    margin-top: 5mm;
    margin-bottom: 4mm;
  }

  .mb-photo {
    width: 26mm;
    height: 34mm;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border: .7pt solid #9ca3af;
    color: #9ca3af;
    background: #f9fafb;
    font-size: 8pt;
    font-weight: 600;
    text-align: center;
  }

  .mb-photo img { width: 100%; height: 100%; object-fit: cover; }

  .mb-identity-data {
    border: 1px solid #9ca3af;
    display: grid;
    align-content: start;
  }

  .mb-info-row {
    display: grid;
    grid-template-columns: 39% 4mm minmax(0,1fr);
    min-height: 5.5mm;
    align-items: stretch;
    border-bottom: .55pt solid #e5e7eb;
    break-inside: avoid;
  }

  .mb-info-row:last-child { border-bottom: 0; }
  .mb-info-label, .mb-info-sep, .mb-info-value { padding: 1mm 1.5mm; box-sizing: border-box; }
  .mb-info-label { background: #fafafa; color: #4b5563; font-size: 8.1pt; font-weight: 600; }
  .mb-info-sep { color: #9ca3af; text-align: center; padding-left: 0; padding-right: 0; }
  .mb-info-value { color: #111827; font-size: 8.3pt; font-weight: 500; overflow-wrap: anywhere; }

  .mb-section-title {
    display: flex;
    align-items: center;
    gap: 2mm;
    margin-top: 3.5mm;
    min-height: 6.5mm;
    padding: 1.2mm 2mm;
    border: 1px solid #9ca3af;
    background: #f3f4f6;
    color: #111827;
    font-size: 8.5pt;
    break-after: avoid-page;
  }

  .mb-section-title span {
    display: inline-flex;
    width: 5mm;
    height: 5mm;
    align-items: center;
    justify-content: center;
    border: .6pt solid #9ca3af;
    background: #fff;
    font-size: 7.5pt;
    font-weight: 700;
  }

  .mb-data-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    border-right: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
    border-left: 1px solid #d1d5db;
  }

  .mb-data-column:first-child { border-right: 1px solid #d1d5db; }
  .mb-data-column .mb-info-row { grid-template-columns: 42% 4mm minmax(0,1fr); }

  .mb-wide-row {
    border-right: 1px solid #d1d5db;
    border-bottom: 1px solid #d1d5db;
    border-left: 1px solid #d1d5db;
  }

  .mb-wide-row .mb-info-row { grid-template-columns: 21% 4mm minmax(0,1fr); }

  .mb-page-identity {
    display: grid;
    grid-template-columns: 1.6fr .9fr 1fr .9fr;
    margin-top: 5mm;
    border: 1px solid #9ca3af;
  }

  .mb-page-identity > div { padding: 2mm 2.5mm; border-right: 1px solid #d1d5db; }
  .mb-page-identity > div:last-child { border-right: 0; }
  .mb-page-identity span { display: block; font-size: 7pt; color: #6b7280; text-transform: uppercase; }
  .mb-page-identity b { display: block; margin-top: .7mm; font-size: 8.5pt; }

  .mb-subtitle,
  .mb-context-heading {
    margin-top: 3mm;
    margin-bottom: 1.5mm;
    font-size: 8.3pt;
    font-weight: 700;
    color: #374151;
    break-after: avoid-page;
  }

  .mb-context-block { break-inside: avoid; page-break-inside: avoid; }
  .mb-context-heading {
    margin-bottom: 0;
    padding: 1.4mm 2mm;
    border: 1px solid #d1d5db;
    border-bottom: 0;
    background: #fafafa;
  }

  .mb-history-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    font-size: 8pt;
  }

  .mb-history-table th,
  .mb-history-table td {
    border: .65pt solid #9ca3af;
    padding: 1.5mm 1.8mm;
    vertical-align: top;
    overflow-wrap: anywhere;
  }

  .mb-history-table th { background: #f3f4f6; font-weight: 700; text-align: left; }
  .mb-history-table th:nth-child(1) { width: 13%; }
  .mb-history-table th:nth-child(2),
  .mb-history-table th:nth-child(3) { width: 17%; text-align: center; }
  .mb-history-table th:nth-child(4),
  .mb-history-table th:nth-child(5) { width: 26.5%; }
  .mb-history-table td:nth-child(2),
  .mb-history-table td:nth-child(3) { text-align: center; }

  .mb-empty-note {
    min-height: 8mm;
    display: flex;
    align-items: center;
    padding: 1.5mm 2mm;
    border: 1px solid #d1d5db;
    color: #6b7280;
    font-size: 8pt;
  }

  .mb-notes {
    min-height: 16mm;
    padding: 2.2mm;
    border: 1px solid #d1d5db;
    font-size: 8.3pt;
    line-height: 1.45;
    white-space: pre-wrap;
  }

  .mb-signatures {
    display: grid;
    grid-template-columns: repeat(2, minmax(0,1fr));
    gap: 20mm;
    margin-top: 6mm;
    padding: 0 8mm;
    break-inside: avoid;
  }

  .mb-signature-box { text-align: center; font-size: 8pt; line-height: 1.35; }
  .mb-signature-box span { display: block; }
  .mb-signature-box b { display: block; font-size: 8pt; font-weight: 600; }
  .mb-sign-space { height: 16mm; }

  /* 2. Ubah footer menjadi relative dan gunakan flex margin-top: auto */
  .mb-footer {
    margin-top: auto; 
    display: flex;
    justify-content: space-between;
    gap: 5mm;
    padding-top: 1.6mm;
    border-top: .5pt solid #d1d5db;
    color: #9ca3af;
    font-size: 6.8pt;
    background: #fff;
  }

  /* Kurangi block avoid berlebihan yang seringkali memaksa grid pindah ke halaman baru tanpa alasan */
  .mb-student-identity,
  .mb-page-identity,
  .mb-history-table,
  .mb-context-block {
    break-inside: avoid !important;
    page-break-inside: avoid !important;
  }
}
`,W=25,o=e=>String(e??"").trim(),A=e=>String(e?.id??e?.student_id??e?.nisn??e?.nik??e?.nama_lengkap??""),ba={current:{label:"Masih di Lembaga",className:"border-emerald-100 bg-emerald-50 text-emerald-600"},graduated:{label:"Sudah Lulus",className:"border-slate-950 bg-slate-950 text-white"},left:{label:"Mengundurkan Diri / Pindah",className:"border-amber-100 bg-amber-50 text-amber-600"}};async function be(e,s,t){const d=new Array(e.length);let h=0;const g=Array.from({length:Math.min(Math.max(1,s),Math.max(1,e.length))},async()=>{for(;h<e.length;){const w=h++;d[w]=await t(e[w],w)}});return await Promise.all(g),d}function xe(e,s){const t=o(e?.classroom_name)||o(e?.classroom?.nama_kelas)||o(s?.classroom_name)||o(s?.classroom_nama)||o(s?.classroom?.nama_kelas),d=e?.classroom_id??e?.classroom?.id??s?.classroom_id??s?.classroom?.id??null,h=o(e?.status?.tahun_pelajaran)||o(e?.tahun_ajaran)||o(s?.status?.tahun_pelajaran)||o(s?.tahun_ajaran)||o(s?.tahun_pelajaran);return{...e,...s,classroom_id:d,classroom:d||t?{id:d,nama_kelas:t}:null,classroom_name:t,classroom_nama:t,nama_kelas:t,tahun_ajaran:h,tahun_pelajaran:h,parent:{...e?.parent??{},...e?.parent_detail??{},...s?.parent??{},...s?.parent_detail??{}},parent_detail:{...e?.parent_detail??{},...s?.parent_detail??{},...s?.parent??{}},dev:{...e?.dev??{},...e?.development??{},...s?.dev??{},...s?.development??{}},development:{...e?.development??{},...s?.development??{},...s?.dev??{}},status:{...e?.status??{},...s?.status??{},tahun_pelajaran:h}}}function ue({state:e}){const s=ba[e]??ba.current;return a.jsx("span",{className:`inline-flex whitespace-nowrap rounded-full border px-2 py-0.5 text-[9px] font-semibold ${s.className}`,children:s.label})}function Be(){const[e,s]=m.useState(!1),[t,d]=m.useState(!1),[h,g]=m.useState(()=>new Set),[w,X]=m.useState(""),[_,aa]=m.useState("all"),[k,ea]=m.useState("all"),[v,ta]=m.useState("all"),[Y,E]=m.useState(1),[x,L]=m.useState(!1),[B,M]=m.useState({done:0,total:0}),[ja,ka]=m.useState([]),[ya,Na]=m.useState(null),[sa,q]=m.useState(""),na=m.useRef(new Map),U=m.useRef(null),$=m.useDeferredValue(w),C=ma({queryKey:["reports","student-master-book","directory"],queryFn:({signal:n})=>za({signal:n}),staleTime:5*6e4,gcTime:15*6e4}),ia=ma({queryKey:["reports","academic-periods","years"],queryFn:({signal:n})=>Oa(n),staleTime:10*6e4}),f=C.data??[],wa=m.useMemo(()=>[...new Set(f.map(n=>o(n.classroom_name)).filter(Boolean))].sort((n,l)=>n.localeCompare(l,"id",{numeric:!0,sensitivity:"base"})),[f]),_a=m.useMemo(()=>{const n=new Set((ia.data??[]).map(l=>o(l.tahun_ajaran)).filter(Boolean));return f.forEach(l=>{const r=o(l.last_tahun_ajaran)||o(l.status?.tahun_pelajaran)||o(l.tahun_ajaran);r&&n.add(r)}),[...n].sort((l,r)=>r.localeCompare(l,"id",{numeric:!0,sensitivity:"base"}))},[ia.data,f]),p=m.useMemo(()=>{const n=o($).toLocaleLowerCase("id");return(k==="all"?f:Ra(f,{tahun_ajaran:k})).filter(r=>{const c=o(r.classroom_name),u=o(r.status?.tahun_pelajaran)||o(r.tahun_ajaran),Ka=!n||[r.nama_lengkap,r.nomor_induk,r.nisn,c].some(Ba=>o(Ba).toLocaleLowerCase("id").includes(n)),Fa=_==="all"||c===_,Ea=k==="all"||u===k,La=v==="all"||r.education_state===v;return Ka&&Fa&&Ea&&La})},[k,_,$,v,f]);m.useEffect(()=>{E(1)},[k,_,$,v]);const D=Math.max(1,Math.ceil(p.length/W)),N=Math.min(Y,D),S=(N-1)*W,R=m.useMemo(()=>p.slice(S,S+W),[p,S]);m.useEffect(()=>{Y!==N&&E(N)},[Y,N]);const P=m.useMemo(()=>f.filter(n=>h.has(A(n))),[h,f]),I=m.useMemo(()=>p.map(A).filter(Boolean),[p]),K=m.useMemo(()=>R.map(A).filter(Boolean),[R]),la=K.filter(n=>h.has(n)).length,V=K.length>0&&la===K.length,va=la>0&&!V,G=o($)||_!=="all"||k!=="all"||v!=="all",z=C.isPending,ra=()=>{X(""),aa("all"),ea("all"),ta("all")},Sa=()=>{d(n=>(n&&g(new Set),!n))},Pa=n=>{const l=A(n);l&&g(r=>{const c=new Set(r);return c.has(l)?c.delete(l):c.add(l),c})},Aa=()=>{g(n=>{const l=new Set(n);return V?K.forEach(r=>l.delete(r)):K.forEach(r=>l.add(r)),l})},Ta=()=>{g(n=>{const l=new Set(n),r=I.length>0&&I.every(c=>l.has(c));return I.forEach(c=>{r?l.delete(c):l.add(c)}),l})},Ma=async n=>{let l=0;return M({done:0,total:n.length}),be(n,4,async r=>{const c=A(r);let u=na.current.get(c);if(!u&&r.id!==null&&r.id!==void 0)try{u=await Da(r.id),na.current.set(c,u)}catch{u=r}return l+=1,M({done:l,total:n.length}),xe(r,u??r)})},Ca=async()=>{if(U.current)return U.current;const n=await Ha();return U.current=n,n},J=async n=>{if(!(!n.length||x)){L(!0),q("");try{const[l,r]=await Promise.all([Ma(n),Ca()]);ka(l),Na(r);const c=()=>{L(!1),M({done:0,total:0})};window.addEventListener("afterprint",c,{once:!0}),window.requestAnimationFrame(()=>{window.requestAnimationFrame(()=>window.print())}),window.setTimeout(()=>{L(u=>u&&(M({done:0,total:0}),!1))},1500)}catch(l){L(!1),M({done:0,total:0}),q(l?.message||"Data lengkap Buku Induk gagal disiapkan.")}}},Ia=a.jsxs(a.Fragment,{children:[a.jsxs("span",{className:"text-[10px] text-slate-400",children:[a.jsx("b",{className:"font-semibold text-slate-600",children:p.length})," ","siswa"]}),a.jsxs("button",{type:"button",onClick:()=>s(n=>!n),className:`ui-toolbar-button ${e?"is-active":""}`,children:[a.jsx(Ua,{className:"h-4 w-4"}),"Filter"]}),a.jsxs("button",{type:"button",onClick:Sa,disabled:x,className:`ui-toolbar-button ${t?"is-active":""}`,children:[t?a.jsx($a,{className:"h-4 w-4"}):a.jsx(Va,{className:"h-4 w-4"}),t?"Selesai Pilih":"Pilih Siswa"]}),t?a.jsxs("button",{type:"button",onClick:()=>J(P),disabled:!P.length||z||x,className:"inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50",children:[x?a.jsx(O,{className:"h-4 w-4 animate-spin"}):a.jsx(Q,{className:"h-4 w-4"}),x?`Menyiapkan ${B.done}/${B.total}`:`Cetak Terpilih${P.length?` (${P.length})`:""}`]}):a.jsxs("button",{type:"button",onClick:()=>J(p),disabled:!p.length||z||x,className:"inline-flex h-9 items-center gap-2 rounded-lg bg-[#ef4d45] px-4 text-xs font-semibold text-white hover:bg-[#df433c] disabled:cursor-not-allowed disabled:opacity-50",children:[x?a.jsx(O,{className:"h-4 w-4 animate-spin"}):a.jsx(Q,{className:"h-4 w-4"}),x?`Menyiapkan ${B.done}/${B.total}`:`Cetak ${G?"Hasil Filter":"Semua"}`]})]});return a.jsxs("div",{className:"space-y-5 animate-in fade-in duration-300",children:[a.jsx("style",{children:pe}),a.jsx(Ya,{icon:da,title:"Cetak Buku Induk",description:"Cetak Buku Induk lengkap 2 halaman per siswa secara individual, berdasarkan filter, atau pilih beberapa siswa sekaligus.",actions:Ia}),e&&a.jsxs("div",{className:"mt-4 flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/40 p-3 xl:flex-row xl:items-center xl:justify-between",children:[a.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[a.jsxs("select",{value:_,onChange:n=>aa(n.target.value),className:"ui-compact-control min-w-40",children:[a.jsx("option",{value:"all",children:"Semua Kelas"}),wa.map(n=>a.jsx("option",{value:n,children:n},n))]}),a.jsxs("select",{value:k,onChange:n=>ea(n.target.value),className:"ui-compact-control min-w-40",children:[a.jsx("option",{value:"all",children:"Semua Tahun Ajar"}),_a.map(n=>a.jsx("option",{value:n,children:n},n))]}),a.jsxs("select",{value:v,onChange:n=>ta(n.target.value),className:"ui-compact-control min-w-48",children:[a.jsx("option",{value:"all",children:"Semua Status Pendidikan"}),a.jsx("option",{value:"current",children:"Masih di Lembaga"}),a.jsx("option",{value:"graduated",children:"Sudah Lulus"}),a.jsx("option",{value:"left",children:"Mengundurkan Diri / Pindah"})]}),G&&a.jsx("button",{type:"button",onClick:ra,className:"h-9 rounded-lg px-3 text-xs font-semibold text-[#ef4d45] hover:bg-red-50",children:"Reset Filter"})]}),a.jsxs("div",{className:"relative w-full xl:w-64",children:[a.jsx(Ga,{className:"pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400"}),a.jsx("input",{type:"search",value:w,onChange:n=>X(n.target.value),placeholder:"Cari nama, NIS, atau kelas...",className:"ui-compact-control w-full pl-9"})]})]}),t&&a.jsxs("div",{className:"flex flex-col gap-2 rounded-lg border border-red-100 bg-red-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",children:[a.jsxs("div",{children:[a.jsx("p",{className:"text-[11px] font-semibold text-slate-700",children:"Mode pilih siswa aktif"}),a.jsx("p",{className:"mt-0.5 text-[10px] text-slate-400",children:"Pilih siswa pada tabel. Detail lengkap baru diambil saat proses cetak."})]}),a.jsxs("div",{className:"flex flex-wrap items-center gap-2",children:[P.length>0&&a.jsx("button",{type:"button",onClick:()=>g(new Set),className:"h-8 rounded-lg px-2.5 text-[10px] font-semibold text-slate-500 hover:bg-white",children:"Kosongkan"}),a.jsx("button",{type:"button",onClick:Ta,disabled:!p.length,className:"h-8 rounded-lg border border-red-100 bg-white px-2.5 text-[10px] font-semibold text-[#ef4d45] disabled:opacity-40",children:I.length>0&&I.every(n=>h.has(n))?"Batal Pilih Semua":"Pilih Semua Hasil"}),a.jsxs("span",{className:"text-[10px] text-slate-500",children:[a.jsx("b",{className:"font-semibold text-[#ef4d45]",children:P.length})," ","siswa dipilih"]})]})]}),sa&&a.jsxs("div",{className:"flex items-center justify-between gap-3 rounded-lg border border-rose-100 bg-rose-50/60 px-3 py-2.5",children:[a.jsx("p",{className:"text-[10px] font-medium text-rose-600",children:sa}),a.jsx("button",{type:"button",onClick:()=>q(""),className:"text-rose-400 hover:text-rose-600","aria-label":"Tutup pesan",children:a.jsx(oa,{className:"h-4 w-4"})})]}),C.isError?a.jsxs("div",{className:"rounded-xl border border-rose-100 bg-rose-50/60 p-4",children:[a.jsxs("p",{className:"text-[11px] font-medium text-rose-600",children:["Data buku induk gagal dimuat."," ",C.error?.message]}),a.jsxs("button",{type:"button",onClick:()=>C.refetch(),className:"ui-toolbar-button mt-3",children:[a.jsx(O,{className:"h-4 w-4"}),"Muat Ulang"]})]}):a.jsxs("div",{className:"ui-table-card overflow-hidden",children:[a.jsx("div",{className:"overflow-x-auto",children:a.jsxs("table",{className:"w-full min-w-240",children:[a.jsx("thead",{className:"bg-slate-50/60",children:a.jsxs("tr",{className:"border-b border-slate-100",children:[a.jsx("th",{className:"w-20 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:a.jsxs("div",{className:"flex items-center gap-2",children:[t&&a.jsx("input",{type:"checkbox",checked:V,ref:n=>{n&&(n.indeterminate=va)},onChange:Aa,"aria-label":"Pilih semua siswa pada halaman ini",className:"h-3.5 w-3.5 rounded border-slate-300 accent-[#ef4d45]"}),a.jsx("span",{children:"No."})]})}),a.jsx("th",{className:"px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:"Nama Siswa"}),a.jsx("th",{className:"w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:"NIS"}),a.jsx("th",{className:"w-40 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:"Kelas"}),a.jsx("th",{className:"w-36 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:"Tahun Ajar"}),a.jsx("th",{className:"w-52 px-3 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:"Status Pendidikan"}),a.jsx("th",{className:"w-24 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-slate-400",children:"Aksi"})]})}),a.jsx("tbody",{className:"divide-y divide-slate-100 bg-white",children:z?Array.from({length:8},(n,l)=>a.jsx("tr",{children:Array.from({length:7},(r,c)=>a.jsx("td",{className:"px-3 py-3",children:a.jsx("div",{className:"h-3 animate-pulse rounded bg-slate-100"})},c))},l)):R.length?R.map((n,l)=>{const r=A(n),c=h.has(r);return a.jsxs("tr",{className:`hover:bg-slate-50/60 ${c?"bg-red-50/30":""}`,children:[a.jsx("td",{className:"px-3 py-2.5",children:a.jsxs("div",{className:"flex items-center gap-2",children:[t&&a.jsx("input",{type:"checkbox",checked:c,onChange:()=>Pa(n),"aria-label":`Pilih ${o(n.nama_lengkap)||"siswa"}`,className:"h-3.5 w-3.5 rounded border-slate-300 accent-[#ef4d45]"}),a.jsx("span",{className:"text-[11px] text-slate-400",children:S+l+1})]})}),a.jsx("td",{className:"px-3 py-2.5",children:a.jsx("p",{className:"max-w-64 truncate text-[12px] font-semibold text-slate-800",children:o(n.nama_lengkap)||"Tanpa nama"})}),a.jsx("td",{className:"px-3 py-2.5 text-[11px] text-slate-600",children:o(n.nomor_induk)||o(n.nisn)||"-"}),a.jsx("td",{className:"px-3 py-2.5",children:a.jsx(qa,{name:n.classroom_name,educationState:n.education_state})}),a.jsx("td",{className:"px-3 py-2.5 text-[11px] text-slate-600",children:o(n.status?.tahun_pelajaran)||o(n.tahun_ajaran)||"-"}),a.jsx("td",{className:"px-3 py-2.5",children:a.jsx(ue,{state:n.education_state})}),a.jsx("td",{className:"px-3 py-2.5 text-right",children:a.jsxs("button",{type:"button",onClick:()=>J([n]),disabled:x,className:"ui-action-button",children:[x?a.jsx(O,{className:"h-3.5 w-3.5 animate-spin"}):a.jsx(Q,{className:"h-3.5 w-3.5"}),"Cetak"]})})]},r||l)}):a.jsx("tr",{children:a.jsxs("td",{colSpan:7,className:"px-3 py-10 text-center",children:[a.jsx(da,{className:"mx-auto h-6 w-6 text-slate-300"}),a.jsx("p",{className:"mt-2 text-[11px] font-semibold text-slate-600",children:"Tidak ada siswa"}),a.jsx("p",{className:"mt-1 text-[10px] text-slate-400",children:"Tidak ada data siswa yang sesuai dengan filter saat ini."}),G&&a.jsxs("button",{type:"button",onClick:ra,className:"ui-toolbar-button mt-3",children:[a.jsx(oa,{className:"h-4 w-4"}),"Reset Filter"]})]})})})]})}),!z&&p.length>0&&a.jsxs("div",{className:"flex flex-col gap-2 border-t border-slate-100 bg-slate-50/40 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between",children:[a.jsxs("p",{className:"text-[10px] text-slate-400",children:["Menampilkan"," ",a.jsx("b",{className:"font-semibold text-slate-600",children:S+1}),"–",a.jsx("b",{className:"font-semibold text-slate-600",children:Math.min(S+W,p.length)})," ","dari"," ",a.jsx("b",{className:"font-semibold text-slate-600",children:p.length})," ","siswa"]}),a.jsxs("div",{className:"flex items-center gap-2",children:[a.jsx("button",{type:"button",disabled:N<=1,onClick:()=>E(n=>Math.max(1,n-1)),className:"ui-toolbar-button h-8",children:"Sebelumnya"}),a.jsxs("span",{className:"min-w-14 text-center text-[10px] font-semibold text-slate-500",children:[N,"/",D]}),a.jsx("button",{type:"button",disabled:N>=D,onClick:()=>E(n=>Math.min(D,n+1)),className:"ui-toolbar-button h-8",children:"Selanjutnya"})]})]})]}),a.jsx("div",{id:"student-master-book-print-root",children:a.jsx(he,{students:ja,profile:ya})})]})}export{Be as default};
