import React, { useMemo } from "react";
import { CheckIcon } from "@heroicons/react/24/solid";

// --- IMPORT DATA DUMMY ---
import { DATA_PEMBELAJARAN_DUMMY } from "../../data/dummyPembelajaran";
import { DATA_STAFF_DUMMY } from "../../data/dummyStaff";
import { DATA_KELAS_DUMMY } from "../../data/dummySiswa";

const SCALES = ["BB", "MB", "BSH", "BSB"];

// ============================================================================
// KOMPONEN UTAMA
// ============================================================================
export const RaporPrintTemplate = React.forwardRef(({ student, data }, ref) => {
  if (!student || !data) return <div ref={ref}></div>;

  // --- 1. AKSES DATA SISWA ---
  const s = student.peserta_didik || {};
  const ayah = student.orang_tua_kandung?.ayah || {};
  const ibu = student.orang_tua_kandung?.ibu || {};
  const terima = student.diterima_di_lembaga || {};

  // --- 2. LOGIKA KEPALA SEKOLAH ---
  const headmaster = DATA_STAFF_DUMMY.find(
    (staff) => staff.kepegawaian?.jabatan === "Kepala Sekolah"
  );
  const kepsekNama = headmaster?.pribadi?.nama_lengkap || ".........................";
  const kepsekNIP = headmaster?.pribadi?.nip || "-";

  // --- 3. LOGIKA GURU KELAS ---
  const siswaKelas = DATA_KELAS_DUMMY.find((k) => k.id === student.class_id);
  const guruKelas = DATA_STAFF_DUMMY.find((staff) => staff.id === siswaKelas?.wali_kelas_id);
  const guruNama = guruKelas?.pribadi?.nama_lengkap || ".........................";
  const guruNIP = guruKelas?.pribadi?.nip || "-";

  // --- 4. TRANSFORM DATA INDIKATOR ---
  const INDICATORS = useMemo(() => {
    const grouped = {};
    const orderMap = {
      "Nilai Agama & Moral": 1,
      "Fisik Motorik": 2,
      "Kognitif": 3,
      "Bahasa": 4,
      "Sosial Emosional": 5,
      "Seni": 6
    };

    DATA_PEMBELAJARAN_DUMMY.forEach(item => {
      if (!grouped[item.aspek]) grouped[item.aspek] = [];
      grouped[item.aspek].push(item.indikator);
    });

    return Object.keys(grouped)
      .sort((a, b) => (orderMap[a] || 99) - (orderMap[b] || 99))
      .map(key => ({
        category: key.toUpperCase(),
        items: grouped[key]
      }));
  }, []);

  // --- 5. SEMESTER LOGIC ---
  const today = new Date();
  const currentMonth = today.getMonth(); 
  const isSemester1 = currentMonth >= 6; 
  const semesterLabel = isSemester1 ? "1 (Ganjil)" : "2 (Genap)";
  const semesterKey = isSemester1 ? "sem1" : "sem2";
  const tahunAjaran = isSemester1 
    ? `${today.getFullYear()}/${today.getFullYear() + 1}` 
    : `${today.getFullYear() - 1}/${today.getFullYear()}`;

  const currentData = data[semesterKey] || {};

  // --- 6. STATISTICS LOGIC ---
  const calculateStatistics = () => {
    const totalIndicators = INDICATORS.reduce((acc, curr) => acc + curr.items.length, 0);
    const stats = { BB: 0, MB: 0, BSH: 0, BSB: 0 };

    if (currentData.nilai) {
      Object.keys(currentData.nilai).forEach((key) => {
        const val = currentData.nilai[key];
        if (SCALES.includes(val)) stats[val] += 1;
      });
    }
    return { stats, total: totalIndicators };
  };

  const { stats, total } = calculateStatistics();
  const fmtStat = (count) => {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return `${count}/${total} (${pct}%)`;
  };

  return (
    <div ref={ref} className="bg-white text-slate-900 font-sans text-sm print-container">
      
      {/* ============================================================================
          STYLESHEET: VERSI FINAL (MARGIN RAPI & HALAMAN BERSAMBUNG AMAN)
         ============================================================================ */}
      <style type="text/css" media="print">
        {`
          /* 1. Atur Margin Kertas yang Sebenarnya */
          @page { 
            size: A4; 
            margin: 2.5cm; /* Ini akan memberi jarak putih 2.5cm di SEMUA halaman */
          }
          
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-family: 'Arial', 'Helvetica', sans-serif;
            color: #1f2937;
            margin: 0; 
            padding: 0;
          }

          /* 2. Container Konten (Full Width karena margin sudah diatur @page) */
          .print-container { 
            width: 100%;
            margin: 0;
            padding: 0; /* Tidak perlu padding lagi */
            line-height: 1.5; 
          }

          /* --- PENTING: PENGATURAN HALAMAN --- */
          .page-break { page-break-before: always; }
          .break-inside-avoid { page-break-inside: avoid; }
          
          /* --- TYPOGRAPHY & COMPONENTS --- */
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .text-justify { text-align: justify; }
          .font-bold { font-weight: 700; }
          .uppercase { text-transform: uppercase; }
          .italic { font-style: italic; }
          .text-xs { font-size: 9pt; } 
          .text-sm { font-size: 10.5pt; }
          .text-lg { font-size: 14pt; }
          .text-xl { font-size: 18pt; }
          .tracking-wide { letter-spacing: 0.05em; }
          
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .mb-4 { margin-bottom: 1rem; }
          .mb-8 { margin-bottom: 2rem; }
          .p-4 { padding: 1rem; }
          .gap-4 { gap: 1rem; }
          .w-full { width: 100%; }
          .w-half { width: 50%; }

          .section-title { 
            font-size: 11pt; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;
            border-bottom: 1px solid #000; padding-bottom: 5px; margin-bottom: 15px; margin-top: 20px;
          }
          .main-title {
            font-size: 16pt; font-weight: 800; text-align: center; margin-bottom: 40px; letter-spacing: 2px;
          }
          
          /* TABLES */
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th { background-color: #f3f4f6 !important; font-weight: 700; text-align: center; padding: 8px 10px; border: 1px solid #d1d5db; font-size: 9pt; text-transform: uppercase; }
          td { padding: 8px 10px; vertical-align: top; border: 1px solid #d1d5db; }
          .no-border-table td { border: none; padding: 4px 0; }
          
          /* BOXES & LINES */
          .photo-box { width: 30mm; height: 40mm; border: 1px dashed #9ca3af; display: flex; align-items: center; justify-content: center; background-color: #f9fafb; color: #9ca3af; font-size: 9pt; }
          .box-summary { border: 1px solid #000; padding: 20px; background-color: #fff; }
          .signature-line { border-bottom: 1px solid #000; width: 200px; margin: 0 auto; margin-top: 70px; }
          .kop-surat { border-bottom: 3px double #000; margin-bottom: 20px; padding-bottom: 10px; text-align: center; }
        `}
      </style>

      {/* --- PAGE 1: PETUNJUK --- */}
      <div className="flex flex-col justify-center" style={{minHeight: '230mm'}}> 
        <div className="main-title">PETUNJUK PENGGUNAAN</div>
        <div className="text-justify mb-10 px-4">
          <ol className="list-decimal space-y-4 leading-relaxed">
            <li><strong>Buku Laporan Pencapaian Perkembangan Anak (LPPA)</strong> ini dipergunakan selama anak didik mengikuti seluruh program pembelajaran di Sekolah SS.</li>
            <li>Apabila anak didik pindah sekolah, buku LPPA dibawa oleh anak didik sebagai bukti pencapaian kompetensi.</li>
            <li>Apabila buku LPPA hilang, dapat diganti dengan buku pengganti yang disahkan oleh kepala sekolah berdasarkan arsip.</li>
            <li>Identitas Sekolah dan Anak Didik diisi sesuai dengan dokumen resmi (Akte Kelahiran / Kartu Keluarga).</li>
            <li>Penilaian dilakukan secara <strong>kualitatif</strong> (Deskripsi) dan <strong>kuantitatif</strong> (Simbol) berdasarkan standar kurikulum.</li>
          </ol>
        </div>
        <div className="px-4 mt-8">
          <div className="main-title text-center font-bold mb-4 tracking-wide uppercase" style={{ marginBottom: '20px'}}>Keterangan Nilai</div>
          <table>
            <thead><tr><th width="15%">Kode</th><th width="30%">Kategori</th><th>Deskripsi Capaian</th></tr></thead>
            <tbody>
              <tr><td className="text-center font-bold">BB</td><td>Belum Berkembang</td><td className="text-xs">Anak melakukannya harus dengan bimbingan atau dicontohkan sepenuhnya oleh guru.</td></tr>
              <tr><td className="text-center font-bold">MB</td><td>Mulai Berkembang</td><td className="text-xs">Anak melakukannya masih harus diingatkan atau dibantu sebagian oleh guru.</td></tr>
              <tr><td className="text-center font-bold">BSH</td><td>Berkembang Sesuai Harapan</td><td className="text-xs">Anak sudah dapat melakukannya secara mandiri dan konsisten tanpa harus diingatkan.</td></tr>
              <tr><td className="text-center font-bold">BSB</td><td>Berkembang Sangat Baik</td><td className="text-xs">Anak sudah dapat melakukannya secara mandiri, konsisten, dan dapat membantu temannya.</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="page-break"></div>

      {/* --- PAGE 2: IDENTITAS SEKOLAH --- */}
      <div className="flex flex-col justify-center items-center" style={{minHeight: '230mm'}}>
        <div className="main-title">IDENTITAS<br/>SATUAN PAUD SEJENIS</div>
        <div className="w-full max-w-[180mm] border border-slate-300 p-10 shadow-sm">
          <table className="no-border-table w-full text-sm leading-loose">
            <tbody>
              <tr><td width="5%">1.</td><td width="35%">Nama Sekolah</td><td width="2%">:</td><td className="font-bold uppercase text-lg">Sekolah SS</td></tr>
              <tr><td>2.</td><td>NPSN</td><td>:</td><td>-</td></tr>
              <tr><td>3.</td><td>Alamat Sekolah</td><td>:</td><td></td></tr>
              <tr><td></td><td>Jalan</td><td>:</td><td>Perumahan Baranangsiang Indah<br/>Jl. Megamendung IV Blok E1 No. 21</td></tr>
              <tr><td></td><td>Kelurahan / Kecamatan</td><td>:</td><td>Katulampa / Bogor Timur</td></tr>
              <tr><td></td><td>Kota / Provinsi</td><td>:</td><td>Kota Bogor / Jawa Barat</td></tr>
              <tr><td></td><td>Kode Pos</td><td>:</td><td>16144</td></tr>
              <tr><td>4.</td><td>Kontak (Telp/HP)</td><td>:</td><td>0811 - 9141 - 285</td></tr>
              <tr><td>5.</td><td>Email</td><td>:</td><td>adm.sekolahss@gmail.com</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="page-break"></div>

      {/* --- PAGE 3: IDENTITAS ANAK DIDIK --- */}
      <div style={{minHeight: '230mm'}}>
        <div className="main-title">IDENTITAS ANAK DIDIK</div>
        <div className="flex justify-between items-start mb-8 mt-10">
          <div className="w-full">
            <div className="section-title">A. DATA PRIBADI</div>
            <table className="no-border-table w-full text-sm">
              <tbody>
                <tr><td width="5%">1.</td><td width="30%">Nama Lengkap</td><td width="2%">:</td><td className="font-bold uppercase text-lg">{s.nama_lengkap}</td></tr>
                <tr><td>2.</td><td>Nama Panggilan</td><td>:</td><td>{s.nama_panggilan}</td></tr>
                <tr><td>3.</td><td>Nomor Induk (NIS)</td><td>:</td><td>{s.nomor_induk || "-"}</td></tr>
                <tr><td>4.</td><td>Jenis Kelamin</td><td>:</td><td>{s.jenis_kelamin === "L" ? "Laki-laki" : "Perempuan"}</td></tr>
                <tr><td>5.</td><td>Tempat, Tanggal Lahir</td><td>:</td><td>{s.tempat_lahir}, {s.tanggal_lahir}</td></tr>
                <tr><td>6.</td><td>Agama</td><td>:</td><td>{s.agama}</td></tr>
                <tr><td>7.</td><td>Anak ke</td><td>:</td><td>{s.jumlah_saudara?.kandung ? Number(s.jumlah_saudara.kandung) + 1 : 1}</td></tr>
                <tr><td>8.</td><td>Alamat Rumah</td><td>:</td><td>{s.alamat_rumah}</td></tr>
              </tbody>
            </table>
          </div>
          <div className="pl-4">
            <div className="photo-box">
              {s.foto ? <img src={s.foto} alt="Foto" style={{width:'100%', height:'100%', objectFit:'cover'}} /> : "FOTO 3x4"}
            </div>
          </div>
        </div>
        <div className="mb-8">
          <div className="section-title">B. RIWAYAT PENERIMAAN</div>
          <table className="no-border-table w-full text-sm ml-4">
            <tbody>
              <tr><td width="5%">1.</td><td width="30%">Diterima di Kelompok</td><td width="2%">:</td><td>{terima.kelompok_umur || "B (5-6 Tahun)"}</td></tr>
              <tr><td>2.</td><td>Tanggal Diterima</td><td>:</td><td>{terima.tanggal_diterima || "-"}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="mb-8">
          <div className="section-title">C. DATA ORANG TUA / WALI</div>
          <table className="no-border-table w-full text-sm">
            <tbody>
              <tr><td width="5%">1.</td><td width="30%">Nama Ayah</td><td width="2%">:</td><td>{ayah.nama || "-"}</td></tr>
              <tr><td>2.</td><td>Nama Ibu</td><td>:</td><td>{ibu.nama || "-"}</td></tr>
              <tr><td>3.</td><td>Pekerjaan Ayah</td><td>:</td><td>{ayah.pekerjaan || "-"}</td></tr>
              <tr><td>4.</td><td>Pekerjaan Ibu</td><td>:</td><td>{ibu.pekerjaan || "-"}</td></tr>
              <tr><td>5.</td><td>Alamat Orang Tua</td><td>:</td><td>{s.alamat_rumah}</td></tr>
              <tr><td>6.</td><td>Kontak (HP)</td><td>:</td><td>{s.nomor_telepon}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className="page-break"></div>

      {/* --- PAGE 4: ISI RAPOR --- */}
      <div className="kop-surat">
        <h1 className="text-xl font-bold uppercase tracking-widest mb-1">SEKOLAH SS</h1>
        <h2 className="text-sm font-bold uppercase text-slate-600">Laporan Perkembangan Anak Didik</h2>
        <p className="text-xs italic text-slate-500 mt-1">Jl. Megamendung IV Blok E1 No. 21, Bogor Timur</p>
      </div>

      <div className="flex justify-between mb-8 bg-slate-50 p-4 border border-slate-200 text-sm">
        <div className="w-half">
          <table>
            <tbody className="no-border-table">
              <tr><td className="font-bold w-24">Nama</td><td>: {s.nama_lengkap}</td></tr>
              <tr><td className="font-bold">NIS</td><td>: {s.nomor_induk}</td></tr>
            </tbody>
          </table>
        </div>
        <div className="w-half">
          <table>
            <tbody className="no-border-table">
              <tr><td className="font-bold w-24">Kelompok</td><td>: {terima.kelompok_umur || "B (5-6 Tahun)"}</td></tr>
              <tr><td className="font-bold">Semester</td><td>: {semesterLabel} / {tahunAjaran}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* A. TABEL INDIKATOR */}
      <div className="mb-8">
        <div className="section-title">A. CAPAIAN PERKEMBANGAN</div>
        <table>
          <thead>
            <tr>
              <th className="text-left w-[70%]">ASPEK PERKEMBANGAN & INDIKATOR</th>
              <th className="text-center w-[30%]">CAPAIAN</th>
            </tr>
            <tr style={{fontSize: '8pt', backgroundColor: '#fff'}}>
              <th style={{backgroundColor: '#fff', borderRight: 'none'}}></th> 
              <th style={{padding: 0, backgroundColor: '#fff'}}>
                <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', borderCollapse: 'collapse'}}>
                  <span style={{padding: '4px', borderRight: '1px solid #d1d5db'}}>BB</span>
                  <span style={{padding: '4px', borderRight: '1px solid #d1d5db'}}>MB</span>
                  <span style={{padding: '4px', borderRight: '1px solid #d1d5db'}}>BSH</span>
                  <span style={{padding: '4px'}}>BSB</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {INDICATORS.map((section, idx) => (
              <React.Fragment key={idx}>
                <tr>
                  <td colSpan={2} className="font-bold bg-slate-50 uppercase py-2 pl-3" style={{borderBottom: '2px solid #e5e7eb'}}>
                    {section.category}
                  </td>
                </tr>
                {section.items.map((item, i) => (
                  <tr key={i}>
                    <td className="pl-6 leading-snug">{item}</td>
                    <td style={{padding: 0}}>
                      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', height: '100%', alignItems: 'center'}}>
                        {SCALES.map(scale => (
                          <div key={`${semesterKey}-${scale}`} style={{height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: scale !== 'BSB' ? '1px solid #eee' : 'none'}}>
                            {currentData.nilai?.[item] === scale ? <CheckIcon className="h-5 w-5 text-black font-extrabold" /> : ""}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* KESIMPULAN PERKEMBANGAN */}
      <div className="mb-8 break-inside-avoid">
        <div className="section-title">B. KESIMPULAN PERKEMBANGAN</div>
        <div className="box-summary">
          <table className="no-border-table w-full text-sm mb-4">
            <tbody>
              <tr><td width="20px">•</td><td width="250px">Belum Berkembang (BB)</td><td width="10px">:</td><td className="font-bold">{fmtStat(stats.BB)}</td></tr>
              <tr><td>•</td><td>Mulai Berkembang (MB)</td><td>:</td><td className="font-bold">{fmtStat(stats.MB)}</td></tr>
              <tr><td>•</td><td>Berkembang Sesuai Harapan (BSH)</td><td>:</td><td className="font-bold">{fmtStat(stats.BSH)}</td></tr>
              <tr><td>•</td><td>Berkembang Sangat Baik (BSB)</td><td>:</td><td className="font-bold">{fmtStat(stats.BSB)}</td></tr>
            </tbody>
          </table>
          <div className="pt-3 border-t border-dashed border-slate-300">
            <div className="font-bold mb-1 text-xs text-slate-500 uppercase">Deskripsi Umum</div>
            <div className="italic text-justify leading-relaxed">
              "Anak didik menunjukkan perkembangan yang positif. Sebagian besar indikator kemampuan telah dicapai sesuai tahapan usianya."
            </div>
          </div>
        </div>
      </div>

      <div className="page-break"></div>

      {/* C. CATATAN GURU */}
      <div className="mb-8">
        <div className="section-title">C. CATATAN GURU</div>
        <div className="border border-slate-300 min-h-[120px] p-6 text-justify leading-relaxed bg-slate-50">
          {currentData.catatan || "Belum ada catatan dari guru untuk semester ini."}
        </div>
      </div>

      {/* D. DATA FISIK & KEHADIRAN */}
      <div className="mb-8">
        <div className="section-title">D. DATA FISIK & KEHADIRAN</div>
        <div className="flex gap-6">
          <div className="border border-slate-300 p-5 w-half">
            <h4 className="font-bold mb-4 text-center uppercase text-xs tracking-wide border-b pb-2">Pertumbuhan Fisik</h4>
            <table className="no-border-table w-full">
              <tbody>
                <tr><td>Berat Badan</td><td className="text-right"><strong>{currentData.fisik?.bb || "-"}</strong> kg</td></tr>
                <tr><td>Tinggi Badan</td><td className="text-right"><strong>{currentData.fisik?.tb || "-"}</strong> cm</td></tr>
                <tr><td>Pendengaran</td><td className="text-right">Baik</td></tr>
                <tr><td>Penglihatan</td><td className="text-right">Baik</td></tr>
              </tbody>
            </table>
          </div>
          <div className="border border-slate-300 p-5 w-half">
            <h4 className="font-bold mb-4 text-center uppercase text-xs tracking-wide border-b pb-2">Ketidakhadiran</h4>
            <table className="no-border-table w-full">
              <tbody>
                <tr><td>Sakit</td><td className="text-right"><strong>{currentData.absen?.s || "-"}</strong> hari</td></tr>
                <tr><td>Izin</td><td className="text-right"><strong>{currentData.absen?.i || "-"}</strong> hari</td></tr>
                <tr><td>Tanpa Keterangan</td><td className="text-right"><strong>{currentData.absen?.a || "-"}</strong> hari</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* E. TANGGAPAN ORANG TUA */}
      <div className="mb-12">
        <div className="section-title">E. TANGGAPAN ORANG TUA / WALI</div>
        <div className="border border-slate-300 min-h-[80px] p-4 italic text-slate-400 bg-white">
          {currentData.komentar_ortu || "..................................................................................................................................."}
        </div>
      </div>

      {/* SIGNATURE SECTION */}
      <div className="flex justify-between mt-10 page-break-inside-avoid">
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