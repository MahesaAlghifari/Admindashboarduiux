// import { useState } from "react";
// import {
//   PrinterIcon,
//   ClipboardDocumentCheckIcon,
//   PresentationChartLineIcon,
//   BookOpenIcon,
//   PuzzlePieceIcon,
//   MagnifyingGlassIcon,
//   ArrowDownTrayIcon,
//   CheckCircleIcon,
//   WrenchScrewdriverIcon, // Ikon untuk Under Construction
//   RocketLaunchIcon,
//   BellAlertIcon
// } from "@heroicons/react/24/outline";

// // ==========================================
// // 1. MOCK DATA (KHUSUS RAPOR)
// // ==========================================

// const CLASSES = ["A", "B" ];
// const SEMESTERS = ["Ganjil 2025/2026", "Genap 2025/2026", "Ganjil 2024/2025"];

// const STUDENTS_DB = Array.from({ length: 20 }).map((_, i) => ({
//   id: `SIS-${1000 + i}`,
//   name: [
//     "Aditya Pratama", "Bunga Citra Lestari", "Chandra Wijaya", "Dewi Sartika", 
//     "Eko Prasetyo", "Fajar Nugraha", "Gita Gutawa", "Hendra Setiawan", 
//     "Indah Permatasari", "Joko Anwar", "Kartika Putri", "Lukman Sardi"
//   ][i % 12] + ` ${String.fromCharCode(65 + (i % 5))}.`,
//   class: CLASSES[i % 5],
//   nis: 2025000 + i,
// }));

// // Data Rapor (Hanya ini yang kita butuhkan sekarang)
// const REPORT_DATA = STUDENTS_DB.map((student, i) => ({
//   ...student,
//   average: (75 + Math.random() * 20).toFixed(1),
//   rank: (i % 10) + 1,
//   attitude: ["Sangat Baik", "Baik", "Cukup"][i % 3],
//   extracurricular: ["Pramuka", "Futsal", "Tari", "Musik", "Lukis"][i % 5],
//   status: Math.random() > 0.1 ? "Lulus / Naik Kelas" : "Perlu Bimbingan"
// }));

// // ==========================================
// // 2. MAIN COMPONENT (LAYOUT)
// // ==========================================

// export default function LaporanPage() {
//   const [activeTab, setActiveTab] = useState("rapor");

//   // Tab Definitions
//   const TABS = [
//     { id: "rapor", label: "Cetak Rapor", icon: PrinterIcon, desc: "Nilai Akademik & Laporan Hasil Belajar" },
//     { id: "absen", label: "Cetak Absensi", icon: ClipboardDocumentCheckIcon, desc: "Rekap Kehadiran Siswa Bulanan" },
//     { id: "penghubung", label: "Buku Penghubung", icon: BookOpenIcon, desc: "Log Komunikasi Guru & Wali Murid" },
//     { id: "aktivitas", label: "Laporan Aktivitas", icon: PuzzlePieceIcon, desc: "Jurnal Kegiatan Harian Kelas" },
//     { id: "perkembangan", label: "Grafik Perkembangan", icon: PresentationChartLineIcon, desc: "Analisa Tumbuh Kembang Siswa" },
//   ];

//   return (
//     <div className="w-full mx-auto space-y-8 animate-in fade-in duration-500 pb-24 font-sans text-slate-800">
      


//       {/* MAIN CARD CONTAINER */}
//       <div className="">
        
//         {/* TAB NAVIGATION (Sticky Style) */}
//         <div className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10">
//             <div className="flex overflow-x-auto no-scrollbar">
//                 {TABS.map((tab) => {
//                     const isActive = activeTab === tab.id;
//                     const Icon = tab.icon;
//                     return (
//                         <button
//                             key={tab.id}
//                             onClick={() => setActiveTab(tab.id)}
//                             className={`
//                                 group relative flex-1 min-w-[180px] px-6 py-5 text-left transition-all duration-300
//                                 border-r border-slate-100 last:border-r-0
//                                 ${isActive ? "bg-white" : "hover:bg-white/50"}
//                             `}
//                         >
//                             {isActive && <div className="absolute top-0 left-0 w-full h-[3px] bg-[#e94640]"></div>}
//                             <div className="flex items-center gap-3 mb-1">
//                                 <Icon className={`w-5 h-5 ${isActive ? "text-[#e94640]" : "text-slate-400 group-hover:text-slate-600"}`} />
//                                 <span className={`text-sm font-bold ${isActive ? "text-slate-800" : "text-slate-500 group-hover:text-slate-700"}`}>
//                                     {tab.label}
//                                 </span>
//                             </div>
//                             <p className="text-[10px] text-slate-400 font-medium truncate">{tab.desc}</p>
//                         </button>
//                     )
//                 })}
//             </div>
//         </div>

//         {/* CONTENT RENDERER */}
//         <div className="flex-1 bg-slate-50/30 p-6 lg:p-8">
//             <div className="animate-in slide-in-from-bottom-2 duration-300 h-full">
//                 {activeTab === "rapor" ? (
//                     <RaporView />
//                 ) : (
//                     <UnderConstructionView 
//                         title={TABS.find(t => t.id === activeTab)?.label} 
//                         desc={TABS.find(t => t.id === activeTab)?.desc} 
//                     />
//                 )}
//             </div>
//         </div>

//       </div>
//     </div>
//   );
// }


// // ==========================================
// // 3. SUB-COMPONENTS (VIEWS)
// // ==========================================

// // --- A. CETAK RAPOR VIEW (ACTIVE) ---
// function RaporView() {
//     const [filterKelas, setFilterKelas] = useState("TK-A");
//     const [search, setSearch] = useState("");

//     const filtered = REPORT_DATA.filter(s => 
//         s.class === filterKelas && 
//         s.name.toLowerCase().includes(search.toLowerCase())
//     );

//     return (
//         <div className="space-y-6">
//             {/* Toolbar */}
//             <div className="flex flex-col lg:flex-row justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
//                 <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
//                     <SelectBox 
//                         options={SEMESTERS} 
//                         label="Periode Akademik" 
//                     />
//                     <SelectBox 
//                         options={CLASSES} 
//                         value={filterKelas} 
//                         onChange={setFilterKelas} 
//                         label="Pilih Kelas" 
//                     />
//                 </div>
//                 <div className="flex gap-3 w-full lg:w-auto">
//                     <div className="relative w-full lg:w-64">
//                         <input type="text" placeholder="Cari Siswa / NIS..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-[#e94640] transition-colors" />
//                         <MagnifyingGlassIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3"/>
//                     </div>
//                     <button className="flex items-center gap-2 px-5 py-2.5 bg-[#e94640] text-white rounded-xl text-sm font-bold hover:bg-[#d63d38] shadow-md transition-all whitespace-nowrap">
//                         <PrinterIcon className="w-4 h-4" /> Cetak Massal
//                     </button>
//                 </div>
//             </div>

//             {/* Table */}
//             <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
//                 <div className="overflow-x-auto">
//                     <table className="w-full text-sm text-left">
//                         <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
//                             <tr>
//                                 <th className="px-6 py-4">Identitas Siswa</th>
//                                 <th className="px-6 py-4">Peringkat</th>
//                                 <th className="px-6 py-4">Rata-Rata</th>
//                                 <th className="px-6 py-4">Sikap & Perilaku</th>
//                                 <th className="px-6 py-4">Ekstrakurikuler</th>
//                                 <th className="px-6 py-4 text-center">Status Akhir</th>
//                                 <th className="px-6 py-4 text-right">Aksi</th>
//                             </tr>
//                         </thead>
//                         <tbody className="divide-y divide-slate-100">
//                             {filtered.length > 0 ? (
//                                 filtered.map((item, idx) => (
//                                     <tr key={idx} className="hover:bg-slate-50 transition-colors group">
//                                         <td className="px-6 py-4">
//                                             <div className="flex items-center gap-3">
//                                                 <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-xs border border-slate-200">
//                                                     {item.name.substring(0,2).toUpperCase()}
//                                                 </div>
//                                                 <div>
//                                                     <p className="font-bold text-slate-800 group-hover:text-[#e94640] transition-colors">{item.name}</p>
//                                                     <p className="text-xs text-slate-500 font-mono">NIS: {item.nis}</p>
//                                                 </div>
//                                             </div>
//                                         </td>
//                                         <td className="px-6 py-4">
//                                             <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${item.rank <= 3 ? "bg-amber-100 text-amber-700 border border-amber-200" : "bg-slate-100 text-slate-600"}`}>
//                                                 #{item.rank}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 font-bold text-slate-800">{item.average}</td>
//                                         <td className="px-6 py-4 text-slate-600">{item.attitude}</td>
//                                         <td className="px-6 py-4">
//                                             <span className="px-2.5 py-1 rounded-md bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100">
//                                                 {item.extracurricular}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 text-center">
//                                             <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-emerald-50 text-emerald-600 border border-emerald-100">
//                                                 <CheckCircleIcon className="w-3 h-3" /> {item.status}
//                                             </span>
//                                         </td>
//                                         <td className="px-6 py-4 text-right">
//                                             <button className="text-slate-400 hover:text-[#e94640] p-2 hover:bg-red-50 rounded-lg transition-colors" title="Download PDF">
//                                                 <ArrowDownTrayIcon className="w-5 h-5" />
//                                             </button>
//                                         </td>
//                                     </tr>
//                                 ))
//                             ) : (
//                                 <tr>
//                                     <td colSpan="7" className="px-6 py-12 text-center">
//                                         <div className="flex flex-col items-center justify-center text-slate-400">
//                                             <MagnifyingGlassIcon className="w-8 h-8 mb-2 opacity-50" />
//                                             <p className="font-medium">Tidak ada siswa ditemukan.</p>
//                                             <p className="text-xs">Coba ubah filter kelas atau kata kunci.</p>
//                                         </div>
//                                     </td>
//                                 </tr>
//                             )}
//                         </tbody>
//                     </table>
//                 </div>
//             </div>
//         </div>
//     )
// }

// // --- B. UNDER CONSTRUCTION VIEW (REUSABLE) ---
// function UnderConstructionView({ title, desc }) {
//     return (
//         <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-center bg-white border border-dashed border-slate-300 rounded-2xl p-8">
//             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6 relative">
//                 <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-20"></div>
//                 <RocketLaunchIcon className="w-10 h-10 text-slate-400" />
//             </div>
            
//             <h3 className="text-2xl font-bold text-slate-800 mb-2">Fitur {title} Segera Hadir!</h3>
//             <p className="text-slate-500 max-w-md mx-auto mb-8 leading-relaxed">
//                 Modul <span className="font-semibold text-slate-700">{desc}</span> sedang dalam tahap pengembangan oleh tim teknis kami. 
//                 Kami memastikan fitur ini akan siap digunakan pada pembaruan berikutnya.
//             </p>

//             <div className="flex items-center gap-3">
//                 <button className="px-5 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
//                     Kembali ke Dashboard
//                 </button>
//                 <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 text-sm font-bold rounded-xl hover:bg-slate-50 transition-colors flex items-center gap-2">
//                     <BellAlertIcon className="w-4 h-4" /> Beritahu Saya
//                 </button>
//             </div>

//             <div className="mt-12 flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-100">
//                 <WrenchScrewdriverIcon className="w-3 h-3" />
//                 <span>Status: Development (v1.0.0-beta)</span>
//             </div>
//         </div>
//     )
// }

// // ==========================================
// // 4. HELPER UI COMPONENTS
// // ==========================================

// function SelectBox({ options, value, onChange, label }) {
//     return (
//         <div className="flex flex-col">
//             {label && <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 ml-1">{label}</label>}
//             <div className="relative">
//                 <select 
//                     value={value}
//                     onChange={(e) => onChange && onChange(e.target.value)}
//                     className="appearance-none w-full pl-4 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:border-[#e94640] cursor-pointer transition-colors"
//                 >
//                     {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
//                 </select>
//                 <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-500">
//                     <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
//                 </div>
//             </div>
//         </div>
//     )
// }