import{j as a}from"./index-Bh-X4LgR.js";import"./react-CJLMTRQJ.js";const d=e=>String(e??"").trim(),c=e=>d(e)||"-",P=e=>{const s=e instanceof Date?e:new Date(e);return Number.isNaN(s.getTime())?"-":new Intl.DateTimeFormat("id-ID",{day:"2-digit",month:"long",year:"numeric"}).format(s)},I=(e,s,t)=>{if(Array.isArray(e?.scores))return new Map(e.scores.map(r=>[String(r.indicator_id),d(r.scale)]));const n=t?.semester_key||(Number(t?.semester)===2?"sem2":"sem1"),i=s?.[n]?.nilai||{};return new Map(Object.entries(i).map(([r,l])=>[r,d(l)]))},K=e=>{const s=new Map;return e.forEach(t=>{const n=d(t.aspek)||"Lainnya",i=d(t.sub_aspek),r=i&&i!=="-"?i:"Tanpa Subaspek";s.has(n)||s.set(n,new Map);const l=s.get(n);l.has(r)||l.set(r,[]),l.get(r).push(t)}),Array.from(s.entries()).map(([t,n])=>({aspect:t,subAspects:Array.from(n.entries()).map(([i,r])=>({subAspect:i,items:r}))}))},R=(e,s)=>{const t=s?.semester_key||(Number(s?.semester)===2?"sem2":"sem1");return e?.[t]||{catatan:"",komentar_ortu:"",fisik:{bb:"",tb:""},absen:{s:0,i:0,a:0}}},F=e=>d(e?.peserta_didik?.nama_lengkap||e?.nama_lengkap),C=e=>d(e?.peserta_didik?.nomor_induk||e?.nomor_induk||e?.nisn),G=e=>d(e?.peserta_didik?.jenis_kelamin||e?.jenis_kelamin),O=(e,s)=>{const t=[{key:"BB",label:"Belum Berkembang"},{key:"MB",label:"Mulai Berkembang"},{key:"BSH",label:"Berkembang Sesuai Harapan"},{key:"BSB",label:"Berkembang Sangat Baik"}],n=s.length;return t.map(i=>{const r=s.filter(o=>e.get(String(o.id))===i.key).length,l=n>0?Math.round(r/n*100):0;return{...i,count:r,total:n,percentage:l}})},W=e=>{if((e[0]?.total||0)===0)return"Belum tersedia data penilaian yang cukup untuk menyusun kesimpulan perkembangan.";const t={BSB:4,BSH:3,MB:2,BB:1},n=[...e].sort((i,r)=>r.count-i.count||t[r.key]-t[i.key])[0];return!n||n.count===0?"Belum tersedia data penilaian yang cukup untuk menyusun kesimpulan perkembangan.":n.key==="BSB"?`Anak didik menunjukkan perkembangan yang sangat baik. Sebanyak ${n.count} dari ${n.total} indikator (${n.percentage}%) berada pada kategori Berkembang Sangat Baik, menunjukkan kemampuan yang semakin matang dan konsisten dalam kegiatan pembelajaran.`:n.key==="BSH"?`Anak didik menunjukkan perkembangan yang positif dan sesuai tahapan usianya. Sebanyak ${n.count} dari ${n.total} indikator (${n.percentage}%) berada pada kategori Berkembang Sesuai Harapan.`:n.key==="MB"?`Anak didik mulai menunjukkan perkembangan pada berbagai kemampuan. Sebanyak ${n.count} dari ${n.total} indikator (${n.percentage}%) berada pada kategori Mulai Berkembang sehingga stimulasi dan pendampingan yang konsisten perlu terus diberikan.`:`Anak didik masih memerlukan stimulasi dan pendampingan lebih lanjut. Sebanyak ${n.count} dari ${n.total} indikator (${n.percentage}%) berada pada kategori Belum Berkembang dan perlu menjadi perhatian dalam kegiatan pembelajaran berikutnya.`};function Y({student:e,data:s,report:t,indicators:n=[],curriculum:i,classroom:r,period:l,headmaster:o,homeroomTeacher:x,printedAt:N,schoolProfile:u}){const b=["BB","MB","BSH","BSB"],j=K(n),k=I(t,s,l),f=O(k,n),m=R(s,l),h={berat_badan:t?.fisik?.berat_badan??m?.fisik?.bb??"",tinggi_badan:t?.fisik?.tinggi_badan??m?.fisik?.tb??""},g={sakit:t?.absensi?.sakit??m?.absen?.s??0,izin:t?.absensi?.izin??m?.absen?.i??0,alpa:t?.absensi?.alpa??m?.absen?.a??0},y=d(t?.catatan)||d(m?.catatan),w=W(f),B=d(u?.nama_sekolah),S=d(u?.alamat),v=F(e),_=C(e),A=G(e),z=d(r?.nama_kelas),M=d(i?.nama_kurikulum),$=d(l?.semester_label),D=d(l?.tahun_ajaran),H=P(N||new Date);return a.jsxs("div",{className:"rapor-print",children:[a.jsx("style",{children:`
        @page {
          size: A4 portrait;
          margin: 8mm 9mm 13mm 9mm;

          @bottom-right {
            content: "Halaman " counter(page) " dari " counter(pages);
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7pt;
            color: #6b7280;
          }
        }

        .rapor-print {
          width: 100%;
          background: #fff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8.6pt;
          line-height: 1.25;
          box-sizing: border-box;
        }

        .rapor-print * {
          box-sizing: border-box;
        }

        .rp-header {
          text-align: center;
          border-bottom: 1.8px solid #111827;
          padding-bottom: 6px;
          margin-bottom: 7px;
        }

        .rp-title {
          margin: 0;
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .25px;
        }

        .rp-curriculum {
          margin: 2px 0 0;
          font-size: 8.5pt;
          font-weight: 600;
        }

        .rp-info {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 7px;
        }

        .rp-info td {
          padding: 1.5px 3px;
          vertical-align: top;
        }

        .rp-info-label {
          width: 86px;
          font-weight: 600;
        }

        .rp-info-separator {
          width: 8px;
          text-align: center;
        }

        .rp-section {
          margin-top: 11px;
        }

        .rp-section-title {
          margin: 0 0 4px;
          padding: 4px 6px;
          border: 1px solid #374151;
          background: #f3f4f6;
          font-size: 8.8pt;
          font-weight: 700;
          text-transform: uppercase;
        }

        .rp-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rp-table th,
        .rp-table td {
          border: 1px solid #4b5563;
          padding: 2.6px 3.5px;
          vertical-align: top;
        }

        .rp-table th {
          background: #f9fafb;
          font-size: 7.8pt;
          text-align: center;
          font-weight: 700;
        }

        .rp-aspect-row td {
          background: #e5e7eb;
          font-weight: 700;
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .rp-sub-row td {
          background: #f9fafb;
          font-weight: 600;
          font-size: 7.8pt;
          padding-top: 2.5px;
          padding-bottom: 2.5px;
        }

        .rp-no {
          width: 4%;
          text-align: center;
        }

        .rp-indicator {
          width: 76%;
        }

        .rp-scale {
          width: 5%;
          text-align: center;
          vertical-align: middle !important;
          font-weight: 700;
        }

        .rp-check {
          font-size: 10pt;
          line-height: 1;
        }

        .rp-legend {
          margin-top: 3px;
          font-size: 7.2pt;
          line-height: 1.2;
        }

        .rp-summary-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rp-summary-table th,
        .rp-summary-table td {
          border: 1px solid #4b5563;
          padding: 3px 5px;
        }

        .rp-summary-table th {
          background: #f9fafb;
          text-align: left;
          width: 58%;
        }

        .rp-summary-code {
          width: 11%;
          text-align: center;
          font-weight: 700;
        }

        .rp-summary-value {
          width: 15%;
          text-align: center;
        }

        .rp-summary-percent {
          width: 16%;
          text-align: center;
        }

        .rp-description {
          margin-top: 4px;
          border: 1px solid #4b5563;
          padding: 5px 6px;
        }

        .rp-description-title {
          display: block;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .rp-text-box {
          min-height: 47px;
          border: 1px solid #4b5563;
          padding: 5px 6px;
          white-space: pre-wrap;
        }

        .rp-data-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rp-data-table th,
        .rp-data-table td {
          border: 1px solid #4b5563;
          padding: 3px 5px;
        }

        .rp-data-table th {
          background: #f9fafb;
          font-weight: 600;
          text-align: left;
        }

        .rp-data-table .rp-half-label {
          width: 22%;
        }

        .rp-data-table .rp-half-value {
          width: 28%;
        }

        .rp-signatures {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .rp-signature-heading {
          min-height: 30px;
        }

        .rp-signature-space {
          height: 48px;
        }

        .rp-signature-name {
          font-weight: 700;
          text-decoration: underline;
        }

        .rp-signature-nip {
          margin-top: 2px;
          font-size: 8pt;
        }

        .rp-parent-name-line {
          display: inline-block;
          width: 150px;
          border-bottom: 1px solid #111827;
          min-height: 14px;
        }

        .rp-parent-label {
          margin-top: 3px;
          font-size: 7.6pt;
          color: #4b5563;
        }

        .rp-empty {
          border: 1px solid #9ca3af;
          padding: 8px;
          text-align: center;
          color: #6b7280;
        }

        @media print {
          .rapor-print {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .rp-section-title,
          .rp-aspect-row,
          .rp-sub-row,
          .rp-table tr,
          .rp-signatures {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}),a.jsxs("header",{className:"rp-header",children:[a.jsx("h1",{className:"rp-title",children:"Laporan Perkembangan Peserta Didik"}),a.jsx("div",{style:{marginTop:"3px",fontSize:"9.5pt",fontWeight:700},children:c(B)}),a.jsx("div",{style:{marginTop:"1px",fontSize:"8pt"},children:c(S)}),a.jsx("p",{className:"rp-curriculum",children:c(M)})]}),a.jsx("table",{className:"rp-info",children:a.jsxs("tbody",{children:[a.jsxs("tr",{children:[a.jsx("td",{className:"rp-info-label",children:"Nama Siswa"}),a.jsx("td",{className:"rp-info-separator",children:":"}),a.jsx("td",{children:c(v)}),a.jsx("td",{className:"rp-info-label",children:"Kelas"}),a.jsx("td",{className:"rp-info-separator",children:":"}),a.jsx("td",{children:c(z)})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"rp-info-label",children:"Nomor Induk"}),a.jsx("td",{className:"rp-info-separator",children:":"}),a.jsx("td",{children:c(_)}),a.jsx("td",{className:"rp-info-label",children:"Semester"}),a.jsx("td",{className:"rp-info-separator",children:":"}),a.jsx("td",{children:c($)})]}),a.jsxs("tr",{children:[a.jsx("td",{className:"rp-info-label",children:"Jenis Kelamin"}),a.jsx("td",{className:"rp-info-separator",children:":"}),a.jsx("td",{children:c(A)}),a.jsx("td",{className:"rp-info-label",children:"Tahun Ajaran"}),a.jsx("td",{className:"rp-info-separator",children:":"}),a.jsx("td",{children:c(D)})]})]})}),a.jsxs("section",{className:"rp-section",children:[a.jsx("h2",{className:"rp-section-title",children:"A. Capaian Perkembangan"}),j.length>0?a.jsxs("table",{className:"rp-table",children:[a.jsxs("colgroup",{children:[a.jsx("col",{style:{width:"4%"}}),a.jsx("col",{style:{width:"76%"}}),a.jsx("col",{style:{width:"5%"}}),a.jsx("col",{style:{width:"5%"}}),a.jsx("col",{style:{width:"5%"}}),a.jsx("col",{style:{width:"5%"}})]}),a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{children:"No"}),a.jsx("th",{children:"Indikator"}),b.map(p=>a.jsx("th",{children:p},p))]})}),a.jsx("tbody",{children:j.map((p,T)=>a.jsx(E,{aspect:p,aspectIndex:T,scoreMap:k,scales:b},p.aspect))})]}):a.jsx("div",{className:"rp-empty",children:"Belum ada indikator pada kurikulum ini."}),a.jsxs("div",{className:"rp-legend",children:[a.jsx("strong",{children:"BB"})," = Belum Berkembang   •  ",a.jsx("strong",{children:"MB"})," = Mulai Berkembang   •  ",a.jsx("strong",{children:"BSH"})," = Berkembang Sesuai Harapan   •  ",a.jsx("strong",{children:"BSB"})," = Berkembang Sangat Baik"]})]}),a.jsxs("section",{className:"rp-section",children:[a.jsx("h2",{className:"rp-section-title",children:"B. Kesimpulan Perkembangan"}),a.jsxs("table",{className:"rp-summary-table",children:[a.jsx("thead",{children:a.jsxs("tr",{children:[a.jsx("th",{children:"Tingkat Perkembangan"}),a.jsx("th",{className:"rp-summary-code",children:"Skala"}),a.jsx("th",{className:"rp-summary-value",children:"Capaian"}),a.jsx("th",{className:"rp-summary-percent",children:"Persentase"})]})}),a.jsx("tbody",{children:f.map(p=>a.jsxs("tr",{children:[a.jsx("td",{children:p.label}),a.jsx("td",{className:"rp-summary-code",children:p.key}),a.jsxs("td",{className:"rp-summary-value",children:[p.count,"/",p.total]}),a.jsxs("td",{className:"rp-summary-percent",children:[p.percentage,"%"]})]},p.key))})]}),a.jsxs("div",{className:"rp-description",children:[a.jsx("span",{className:"rp-description-title",children:"Deskripsi Umum"}),w]})]}),a.jsxs("section",{className:"rp-section",children:[a.jsx("h2",{className:"rp-section-title",children:"C. Catatan Guru"}),a.jsx("div",{className:"rp-text-box",children:c(y)})]}),a.jsxs("section",{className:"rp-section",children:[a.jsx("h2",{className:"rp-section-title",children:"D. Data Fisik dan Kehadiran"}),a.jsx("table",{className:"rp-data-table",children:a.jsxs("tbody",{children:[a.jsxs("tr",{children:[a.jsx("th",{className:"rp-half-label",children:"Berat Badan"}),a.jsx("td",{className:"rp-half-value",children:h.berat_badan!==null&&h.berat_badan!==""?`${h.berat_badan} kg`:"-"}),a.jsx("th",{className:"rp-half-label",children:"Sakit"}),a.jsxs("td",{className:"rp-half-value",children:[g.sakit," hari"]})]}),a.jsxs("tr",{children:[a.jsx("th",{children:"Tinggi Badan"}),a.jsx("td",{children:h.tinggi_badan!==null&&h.tinggi_badan!==""?`${h.tinggi_badan} cm`:"-"}),a.jsx("th",{children:"Izin"}),a.jsxs("td",{children:[g.izin," hari"]})]}),a.jsxs("tr",{children:[a.jsx("th",{children:"Alpa"}),a.jsxs("td",{children:[g.alpa," hari"]}),a.jsx("td",{colSpan:"2"})]})]})})]}),a.jsxs("section",{className:"rp-section",children:[a.jsx("h2",{className:"rp-section-title",children:"E. Tanggapan Orang Tua / Wali"}),a.jsx("div",{className:"rp-text-box",style:{minHeight:"62px"},children:" "})]}),a.jsxs("div",{className:"rp-signatures",children:[a.jsxs("div",{children:[a.jsxs("div",{className:"rp-signature-heading",children:["Mengetahui,",a.jsx("br",{}),"Kepala Sekolah"]}),a.jsx("div",{className:"rp-signature-space"}),a.jsx("div",{className:"rp-signature-name",children:c(o?.nama_lengkap)}),a.jsxs("div",{className:"rp-signature-nip",children:["NIP."," ",c(o?.nip)]})]}),a.jsxs("div",{children:[a.jsxs("div",{className:"rp-signature-heading",children:["Mengetahui,",a.jsx("br",{}),"Orang Tua / Wali"]}),a.jsx("div",{className:"rp-signature-space"}),a.jsx("div",{className:"rp-parent-name-line",children:" "}),a.jsx("div",{className:"rp-parent-label",children:"Nama Orang Tua / Wali"})]}),a.jsxs("div",{children:[a.jsxs("div",{className:"rp-signature-heading",children:[H,a.jsx("br",{}),"Guru Kelas"]}),a.jsx("div",{className:"rp-signature-space"}),a.jsx("div",{className:"rp-signature-name",children:c(x?.nama_lengkap)}),a.jsxs("div",{className:"rp-signature-nip",children:["NIP."," ",c(x?.nip)]})]})]})]})}function E({aspect:e,aspectIndex:s,scoreMap:t,scales:n}){let i=0;return a.jsxs(a.Fragment,{children:[a.jsx("tr",{className:"rp-aspect-row",children:a.jsxs("td",{colSpan:"6",children:[s+1,"."," ",e.aspect]})}),e.subAspects.map((r,l)=>a.jsx(L,{sub:r,aspectIndex:s,subIndex:l,scoreMap:t,scales:n,nextNumber:()=>(i+=1,i)},`${e.aspect}-${r.subAspect}`))]})}function L({sub:e,aspectIndex:s,subIndex:t,scoreMap:n,scales:i,nextNumber:r}){return a.jsxs(a.Fragment,{children:[a.jsx("tr",{className:"rp-sub-row",children:a.jsxs("td",{colSpan:"6",children:[s+1,".",t+1," ",e.subAspect]})}),e.items.map(l=>{const o=n.get(String(l.id))||n.get(l.deskripsi)||"";return a.jsxs("tr",{children:[a.jsx("td",{className:"rp-no",children:r()}),a.jsx("td",{className:"rp-indicator",children:c(l.deskripsi)}),i.map(x=>a.jsx("td",{className:"rp-scale",children:o===x?a.jsx("span",{className:"rp-check",children:"✓"}):""},x))]},l.id)})]})}export{Y as RaporPrintTemplate,Y as default};
