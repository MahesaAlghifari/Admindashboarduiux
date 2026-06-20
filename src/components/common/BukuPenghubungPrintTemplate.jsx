import React from "react";
import { DATA_STAFF_DUMMY } from "../../data/dummyStaff";
import { DATA_KELAS_DUMMY } from "../../data/dummySiswa";

const DAYS_PRINT = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"];
const METRICS_PRINT = [
  { key: "jam_tidur", label: "Jam Tidur" },
  { key: "anak_bab", label: "Anak BAB" },
  { key: "suhu_tubuh", label: "Suhu Tubuh" },
  { key: "menu_sarapan", label: "Menu Sarapan" }
];

export const BukuPenghubungPrintTemplate = React.forwardRef(({ student, mingguLabel, penghubungData }, ref) => {
  if (!student) return <div ref={ref}></div>;

  const s = student.peserta_didik || {};
  const terima = student.diterima_di_lembaga || {};
  
  // Data Guru Kelas
  const siswaKelas = DATA_KELAS_DUMMY.find((k) => k.id === student.class_id);
  const guruKelas = DATA_STAFF_DUMMY.find((staff) => staff.id === siswaKelas?.wali_kelas_id);
  const guruNama = guruKelas?.pribadi?.nama_lengkap || ".........................";

  // Waktu Cetak
  const printDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  }).format(new Date());

  // Fallback Data jika kosong
  const safeData = penghubungData || {};

  return (
    <div ref={ref} className="bg-white text-slate-800 font-sans print-container flex justify-center">
      
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; margin: 0; padding: 0; background: white; }
          .print-container { width: 100%; margin: 0; padding: 0; }
          .page-break { page-break-before: always; }
          
          #print-area { width: 210mm; min-height: 297mm; margin: 0 auto; background: white; padding: 15mm 20mm; }
          table { page-break-inside: auto; }
          tr { page-break-inside: avoid; }
          thead { display: table-header-group; }
        `}
      </style>

      <div id="print-area">
        
        {/* HEADER */}
        <div className="pb-6 border-b border-slate-200">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-5">
              <div className="w-[82px] h-[82px] rounded-2xl bg-gradient-to-br from-red-50 to-white border border-red-100 flex items-center justify-center">
                <span className="text-[#e94640] font-black text-lg">LOGO</span>
              </div>
              <div>
                <div className="text-[30px] font-black tracking-tight leading-[1.05] text-slate-900">SEKOLAH SS</div>
                <div className="mt-1 text-[15px] font-semibold text-slate-600">Buku Penghubung Siswa</div>
                <div className="text-[12px] text-slate-400">Jl. Pendidikan No.10 • Telp 08123456789</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] uppercase tracking-[4px] text-slate-400 font-bold">Periode</div>
              <div className="mt-2 text-[26px] font-black leading-tight text-slate-900">{mingguLabel}</div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-100 px-5 py-4 flex items-center justify-between">
            <div>
              <div className="text-[11px] uppercase tracking-[3px] text-red-400 font-bold">Dokumen Akademik</div>
              <div className="mt-1 text-[18px] font-black text-slate-800">Laporan Mingguan</div>
            </div>
            <div className="px-4 py-2 rounded-xl bg-white border border-red-100 text-sm font-bold text-red-500">AKTIF</div>
          </div>
        </div>

        {/* IDENTITAS */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-[10px] uppercase tracking-[2px] text-slate-400 font-bold">Nama Siswa</div>
            <div className="mt-1 text-[18px] font-bold text-slate-800">{s.nama_lengkap}</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
            <div className="text-[10px] uppercase tracking-[2px] text-slate-400 font-bold">Kelas / Kelompok</div>
            <div className="mt-1 text-[18px] font-bold text-slate-800">{siswaKelas?.nama || "-"}</div>
          </div>
        </div>

        {/* TABEL */}
        <div className="mt-6">
          <table className="w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-slate-200">
            <thead>
              <tr className="bg-slate-100">
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-b border-slate-200">Hari</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-b border-slate-200 border-l">Indikator</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-b border-slate-200 border-l">Hasil</th>
                <th className="px-4 py-3 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-b border-slate-200 border-l">Catatan Guru & Ortu</th>
              </tr>
            </thead>
            <tbody>
              {DAYS_PRINT.map((day, dayIndex) => {
                const dayData = safeData[day] || {};
                return (
                  <React.Fragment key={day}>
                    {METRICS_PRINT.map((metric, idx) => (
                      <tr key={`${day}-${metric.key}`} className={dayIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"}>
                        {idx === 0 && (
                          <td rowSpan={METRICS_PRINT.length} className="border-b border-slate-200 px-4 py-4 align-top font-bold text-sm text-slate-700 w-24">
                            {day}
                          </td>
                        )}
                        <td className="border-b border-l border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 w-32">
                          {metric.label}
                        </td>
                        <td className="border-b border-l border-slate-200 px-4 py-3 text-xs text-slate-600 w-32">
                          {dayData[metric.key] || "-"}
                        </td>
                        {idx === 0 && (
                          <td rowSpan={METRICS_PRINT.length} className="border-b border-l border-slate-200 px-4 py-4 align-top">
                            <div className="mb-3">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Catatan Guru:</span>
                                <p className="text-xs text-slate-700 leading-relaxed">{dayData.catatan_guru || "-"}</p>
                            </div>
                            <div className="pt-2 border-t border-dashed border-slate-200">
                                <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Tanggapan Orang Tua:</span>
                                <p className="text-xs text-slate-700 leading-relaxed">{dayData.catatan_ortu || "-"}</p>
                            </div>
                          </td>
                        )}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* TANDA TANGAN */}
        <div className="mt-12 grid grid-cols-2 gap-24">
          <div className="text-center">
             <div className="text-[13px] font-semibold text-slate-600 mb-20">Orang Tua / Wali</div>
             <div className="border-t border-slate-400 pt-2 text-sm font-semibold text-slate-700">( _______________________ )</div>
          </div>
          <div className="text-center">
             <div className="text-[13px] font-semibold text-slate-600 mb-20">Guru Kelas</div>
             <div className="border-t border-slate-400 pt-2 text-sm font-semibold text-slate-700">{guruNama}</div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="mt-10 pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
          <span>Dicetak pada: {printDate} WIB</span>
          <span>Buku Penghubung Digital PAUD</span>
        </div>

      </div>
    </div>
  );
});