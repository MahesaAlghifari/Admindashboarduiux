import React from "react";
import { DATA_STAFF_DUMMY } from "../../data/dummyStaff";
import { DATA_KELAS_DUMMY } from "../../data/dummySiswa";

export const AbsensiPrintTemplate = React.forwardRef(({ student, bulanLabel, absenData }, ref) => {
  if (!student) return <div ref={ref}></div>;

  const s = student.peserta_didik || {};
  
  // Data Kepala Sekolah & Guru
  const headmaster = DATA_STAFF_DUMMY.find((staff) => staff.kepegawaian?.jabatan === "Kepala Sekolah");
  const kepsekNama = headmaster?.pribadi?.nama_lengkap || ".........................";
  const kepsekNIP = headmaster?.pribadi?.nip || "-";

  const siswaKelas = DATA_KELAS_DUMMY.find((k) => k.id === student.class_id);
  const guruKelas = DATA_STAFF_DUMMY.find((staff) => staff.id === siswaKelas?.wali_kelas_id);
  const guruNama = guruKelas?.pribadi?.nama_lengkap || ".........................";
  const guruNIP = guruKelas?.pribadi?.nip || "-";

  // Data Absensi (Gunakan fallback jika kosong)
  const stats = absenData?.summary || { h: 22, s: 1, i: 0, a: 0 };
  const dailyRecords = absenData?.daily || Array.from({ length: 23 }).map((_, i) => ({
      date: `${i+1} ${bulanLabel.split(" ")[0]}`,
      status: i === 10 ? 'S' : 'H', 
      keterangan: i === 10 ? 'Demam' : '-'
  }));

  const today = new Date();

  return (
    <div ref={ref} className="bg-white text-slate-900 font-sans text-sm print-container">
      
      {/* STYLE KHUSUS CETAK */}
      <style type="text/css" media="print">
        {`
          @page { size: A4 portrait; margin: 2cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; font-family: 'Arial', sans-serif; color: #1f2937; margin: 0; padding: 0; }
          .print-container { width: 100%; margin: 0; padding: 0; line-height: 1.5; }
          .page-break { page-break-before: always; }
          .break-inside-avoid { page-break-inside: avoid; }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .font-bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .text-xs { font-size: 9pt; } 
          .text-sm { font-size: 10pt; }
          .text-lg { font-size: 14pt; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-8 { margin-bottom: 2rem; }
          
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background-color: #f3f4f6 !important; font-weight: 700; text-align: center; padding: 8px; border: 1px solid #d1d5db; font-size: 9pt; text-transform: uppercase; }
          td { padding: 6px 8px; vertical-align: middle; border: 1px solid #d1d5db; font-size: 9pt; }
          .no-border-table td { border: none; padding: 4px 0; font-size: 10pt; }
          
          .kop-surat { border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px; text-align: center; }
          .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 0 auto; margin-top: 70px; }
        `}
      </style>

      {/* KOP SURAT */}
      <div className="kop-surat">
        <h1 className="text-xl font-bold uppercase tracking-widest mb-1">SEKOLAH SS</h1>
        <h2 className="text-sm font-bold uppercase text-slate-600">Laporan Rekapitulasi Kehadiran Siswa</h2>
        <p className="text-xs italic text-slate-500 mt-1">Jl. Megamendung IV Blok E1 No. 21, Bogor Timur</p>
      </div>

      {/* IDENTITAS */}
      <div className="mb-6 bg-slate-50 p-4 border border-slate-200">
        <table className="no-border-table w-full">
          <tbody>
            <tr>
                <td className="font-bold w-32">Nama Siswa</td><td className="w-4">:</td><td>{s.nama_lengkap}</td>
                <td className="font-bold w-24">Periode</td><td className="w-4">:</td><td className="font-bold uppercase">{bulanLabel}</td>
            </tr>
            <tr>
                <td className="font-bold">Nomor Induk</td><td>:</td><td>{s.nomor_induk || "-"}</td>
                <td className="font-bold">Kelas</td><td>:</td><td>{siswaKelas?.nama || "-"}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* RINGKASAN ABSENSI */}
      <div className="mb-6 flex gap-4 break-inside-avoid">
         <div className="flex-1 border border-slate-300 p-4 text-center bg-emerald-50/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Hadir (H)</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.h} <span className="text-sm font-normal text-slate-500">hari</span></p>
         </div>
         <div className="flex-1 border border-slate-300 p-4 text-center bg-blue-50/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Sakit (S)</p>
            <p className="text-2xl font-bold text-blue-700">{stats.s} <span className="text-sm font-normal text-slate-500">hari</span></p>
         </div>
         <div className="flex-1 border border-slate-300 p-4 text-center bg-amber-50/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Izin (I)</p>
            <p className="text-2xl font-bold text-amber-700">{stats.i} <span className="text-sm font-normal text-slate-500">hari</span></p>
         </div>
         <div className="flex-1 border border-slate-300 p-4 text-center bg-rose-50/50">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Alpa (A)</p>
            <p className="text-2xl font-bold text-rose-700">{stats.a} <span className="text-sm font-normal text-slate-500">hari</span></p>
         </div>
      </div>

      {/* TABEL RINCIAN HARIAN */}
      <div className="mb-8">
        <table>
          <thead>
            <tr>
              <th className="w-12">No</th>
              <th className="w-48 text-left">Tanggal</th>
              <th className="w-24">Status</th>
              <th className="text-left">Keterangan</th>
            </tr>
          </thead>
          <tbody>
            {dailyRecords.map((record, idx) => (
              <tr key={idx}>
                <td className="text-center text-slate-500">{idx + 1}</td>
                <td className="font-medium">{record.date}</td>
                <td className="text-center font-bold">
                    {record.status === 'H' ? 'Hadir' : record.status}
                </td>
                <td>{record.keterangan}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TANDA TANGAN */}
      <div className="flex justify-between mt-10 break-inside-avoid">
        <div className="text-center w-[40%]">
          <p className="mb-20">Mengetahui,<br/>Kepala Sekolah</p>
          <div className="signature-line"></div>
          <p className="font-bold mt-2">{kepsekNama}</p>
          <p className="text-xs text-slate-500">NIP. {kepsekNIP}</p>
        </div>
        <div className="text-center w-[40%]">
          <p className="mb-20">
            Bogor, {today.toLocaleDateString('id-ID', {day: 'numeric', month: 'long', year: 'numeric'})}
            <br/>Guru Kelas
          </p>
          <div className="signature-line"></div>
          <p className="font-bold mt-2">{guruNama}</p>
          <p className="text-xs text-slate-500">NIP. {guruNIP}</p>
        </div>
      </div>

    </div>
  );
});