import React from "react";
import { DATA_STAFF_DUMMY } from "../../data/dummyStaff";
import { DATA_KELAS_DUMMY } from "../../data/dummySiswa";

export const AktivitasPrintTemplate = React.forwardRef(({ student, bulanLabel, aktivitasData }, ref) => {
    if (!student) return <div ref={ref}></div>;

    const s = student.peserta_didik || {};

    // Data Guru Kelas
    const siswaKelas = DATA_KELAS_DUMMY.find((k) => k.id === student.class_id);
    const guruKelas = DATA_STAFF_DUMMY.find((staff) => staff.id === siswaKelas?.wali_kelas_id);
    const guruNama = guruKelas?.pribadi?.nama_lengkap || ".........................";
    const kepsekNama = DATA_STAFF_DUMMY.find((staff) => staff.kepegawaian.jabatan === "Kepala Sekolah")?.pribadi.nama_lengkap || "..........................";
    // Data Dummy Spesifik Meniru Template Gambar (Senin - Jumat)
    const tema = "6 / Indonesiaku";
    const pilarKarakter = "Pahlawan";

    const records = aktivitasData && aktivitasData.length === 5 ? aktivitasData : [
        { hari: "Senin", tanggal: "25 Agustus 2025", jurnal: "Mewarnai", pilar: "Pahlawan dan kontribusinya bagi bangsa", aktivitas: "Mewarnai Pahlawan Ki Hajar Dewantara", pembiasaan: "Izin kepada guru apabila ingin keluar kelas" },
        { hari: "Selasa", tanggal: "26 Agustus 2025", jurnal: "Menggunting dan menempel", pilar: "Mengenal tokoh pahlawan Indonesia", aktivitas: "Membuat kolase gambar pahlawan", pembiasaan: "Mengucapkan salam saat masuk kelas" },
        { hari: "Rabu", tanggal: "27 Agustus 2025", jurnal: "Menyusun dan menempel", pilar: "Siapa pahlawan sebenarnya", aktivitas: "Membuat tentara dari susunan geometri", pembiasaan: "Izin kepada guru apabila ingin keluar kelas" },
        { hari: "Kamis", tanggal: "28 Agustus 2025", jurnal: "Menggambar", pilar: "Meneladani sikap pahlawan", aktivitas: "Menggambar kegiatan membantu teman", pembiasaan: "Merapikan alat belajar setelah digunakan" },
        { hari: "Jum'at", tanggal: "29 Agustus 2025", jurnal: "Menyusun dan menempel", pilar: "Mengungkapkan rasa terima kasih kepada ibu", aktivitas: "Membuat bunga dari tutup botol", pembiasaan: "Izin kepada guru apabila ingin keluar kelas" }
    ];

    return (
        <div ref={ref} className="bg-white text-black print-container">

            {/* =======================================================
          PRINT STYLE: A4 LANDSCAPE & COMIC FONT
      ======================================================= */}
            <style type="text/css" media="print">
                {`
          @page { 
            size: A4 landscape; 
            margin: 10mm 15mm; 
          }
          body { 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
            font-family: 'Comic Sans MS', 'Chalkboard SE', 'Comic Neue', sans-serif; 
            color: #000; 
            margin: 0; 
            padding: 0; 
          }
          .print-container { width: 100%; margin: 0; padding: 0; line-height: 1.4; }
          .page-break { page-break-before: always; }
          
          /* Utility Classes */
          .text-center { text-align: center; }
          .font-bold { font-weight: bold; }
          .flex { display: flex; }
          .justify-between { justify-content: space-between; }
          .items-center { align-items: center; }
          .align-middle { vertical-align: middle; }
          
          /* Table Styles */
          table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
          th, td { border: 1px solid #000; padding: 6px; font-size: 11pt; vertical-align: top; }
          th { text-align: center; font-weight: bold; }
          
          /* Custom Boxes */
          .dashed-box { border: 1.5px dashed #000; padding: 10px; }
          .checkbox-box { width: 16px; height: 16px; border: 1px solid #000; display: inline-block; margin-top: 4px; }
          
          /* Grid Layouts */
          .grid-3-cols { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
          
          .signature-line { border-bottom: 1.5px solid #000; width: 200px; margin: 0 auto; margin-top: 50px; }
        `}
            </style>

            {/* =======================================================
          HALAMAN 1: TABEL AKTIVITAS HARIAN
      ======================================================= */}
            <div className="flex justify-between items-start mb-4">
                {/* Header Kiri */}
                <div className="dashed-box" style={{ width: '45%' }}>
                    <table style={{ border: 'none', marginBottom: 0 }}>
                        <tbody>
                            <tr>
                                <td style={{ border: 'none', padding: '2px 0', width: '35%', fontWeight: 'bold' }}>Minggu/ Tema</td>
                                <td style={{ border: 'none', padding: '2px 0', width: '5%' }}>:</td>
                                <td style={{ border: 'none', padding: '2px 0', width: '60%', color: '#4b5563' }}>{tema}</td>
                            </tr>
                            <tr>
                                <td style={{ border: 'none', padding: '2px 0', fontWeight: 'bold' }}>Pilar Karakter</td>
                                <td style={{ border: 'none', padding: '2px 0' }}>:</td>
                                <td style={{ border: 'none', padding: '2px 0', color: '#4b5563' }}>{pilarKarakter}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Header Kanan */}
                <div style={{ width: '50%', textAlign: 'right' }}>
                    <h1 style={{
                        fontSize: '32pt',
                        fontWeight: '900',
                        margin: 0,
                        textTransform: 'uppercase',
                        color: '#000',
                        textShadow: '2px 2px 4px rgba(135, 206, 235, 0.8)'
                    }}>
                        AKTIVITAS HARIAN
                    </h1>
                </div>
            </div>

            <table>
                <thead>
                    <tr>
                        <th colSpan="1" style={{ width: '16%' }}>Hari/Tanggal</th>
                        <th colSpan="2" style={{ width: '21%' }}>Jurnal</th>
                        <th colSpan="2" style={{ width: '21%' }}>Pilar Karakter</th>
                        <th colSpan="2" style={{ width: '21%' }}>Aktivitas 1</th>
                        <th colSpan="2" style={{ width: '21%' }}>Pembiasaan</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Data 5 Hari */}
                    {records.map((rec, idx) => (
                        <tr key={idx}>
                            <td colSpan="1" className="text-center font-bold">
                                {rec.hari}, <br /> {rec.tanggal}
                            </td>
                            <td colSpan="2" style={{ color: '#4b5563' }}>{rec.jurnal}</td>
                            <td colSpan="2" style={{ color: '#4b5563' }}>{rec.pilar}</td>
                            <td colSpan="2" style={{ color: '#4b5563' }}>{rec.aktivitas}</td>
                            <td colSpan="2" style={{ color: '#4b5563' }}>{rec.pembiasaan}</td>
                        </tr>
                    ))}

                    {/* Partisipasi Anak Header */}
                    <tr>
                        <td colSpan="1" rowSpan="2" className="text-center font-bold align-middle">
                            Partisipasi Anak
                        </td>
                        <td className="text-center font-bold">Ya</td><td className="text-center font-bold">Tidak</td>
                        <td className="text-center font-bold">Ya</td><td className="text-center font-bold">Tidak</td>
                        <td className="text-center font-bold">Ya</td><td className="text-center font-bold">Tidak</td>
                        <td className="text-center font-bold">Ya</td><td className="text-center font-bold">Tidak</td>
                    </tr>
                    {/* Partisipasi Anak Checkboxes */}
                    <tr>
                        <td style={{ height: '25px' }}></td><td></td>
                        <td></td><td></td>
                        <td></td><td></td>
                        <td></td><td></td>
                    </tr>
                </tbody>
            </table>


            {/* =======================================================
          HALAMAN 2: EVALUASI HARIAN (MAKANAN & PERASAAN)
      ======================================================= */}
            <div className="page-break"></div>

            <div className="text-center mb-6">
                <h1 style={{ fontSize: '24pt', fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>
                    EVALUASI HARIAN
                </h1>
            </div>

            <div className="grid-3-cols">
                {records.map((rec, idx) => (
                    <div key={idx} className="dashed-box flex flex-col justify-between" style={{ minHeight: '220px' }}>
                        <div>
                            <div className="text-center font-bold mb-1" style={{ fontSize: '12pt', borderBottom: '1px solid #000', paddingBottom: '4px' }}>
                                {rec.hari}
                            </div>

                            <div className="text-center font-bold mt-2 mb-2">Makananku</div>
                            <div className="flex justify-around mb-2 text-center text-sm" style={{ color: '#4b5563' }}>
                                <div>Habis<br /><span className="checkbox-box"></span></div>
                                <div>Tersisa<br /><span className="checkbox-box"></span></div>
                                <div>Tidak Makan<br /><span className="checkbox-box"></span></div>
                            </div>

                            <div style={{ borderTop: '1px dashed #000', margin: '10px -10px' }}></div>

                            <div className="text-center font-bold mt-2 mb-2">Perasaanku Hari Ini</div>
                            <div className="flex justify-around items-end mb-2 text-center text-sm" style={{ color: '#4b5563' }}>
                                <div><span style={{ fontSize: '18pt' }}>😊</span><br />Senang<br /><span className="checkbox-box"></span></div>
                                <div><span style={{ fontSize: '18pt' }}>😟</span><br />Sedih<br /><span className="checkbox-box"></span></div>
                                <div><span style={{ fontSize: '18pt' }}>😫</span><br />Lelah<br /><span className="checkbox-box"></span></div>
                                <div><br />Lainnya<br /><div style={{ borderBottom: '1px solid #000', width: '40px', marginTop: '5px' }}></div></div>
                            </div>
                        </div>

                        <div>
                            <div style={{ borderTop: '1px dashed #000', margin: '10px -10px 0 -10px' }}></div>
                            <div className="font-bold mt-2 pt-2 pb-2">Barang yang dibawa besok :</div>
                            <div style={{ borderBottom: '1px solid #000', width: '100%', height: '20px' }}></div>
                        </div>
                    </div>
                ))}

                {/* Box kosong untuk menggenapkan grid menjadi 6 kotak (opsional untuk catatan tambahan) */}
                <div className="dashed-box flex flex-col justify-center items-center text-slate-400">
                    <span className="font-bold">Catatan Mingguan</span>
                </div>
            </div>


            {/* =======================================================
          HALAMAN 3: TABEL CATATAN GURU & ORANG TUA
      ======================================================= */}
            <div className="page-break"></div>

            <div className="text-center mb-6">
                <h1 style={{ fontSize: '24pt', fontWeight: '900', textTransform: 'uppercase', color: '#000' }}>
                    CATATAN GURU & ORANG TUA
                </h1>
            </div>

            <table>
                <thead>
                    <tr>
                        <th style={{ width: '20%', padding: '10px' }}>Hari / Tanggal</th>
                        <th style={{ width: '40%', padding: '10px' }}>Catatan Guru</th>
                        <th style={{ width: '40%', padding: '10px' }}>Catatan Orang Tua</th>
                    </tr>
                </thead>
                <tbody>
                    {records.map((rec, idx) => (
                        <tr key={`note-${idx}`}>
                            <td className="text-center font-bold align-middle" style={{ padding: '15px' }}>
                                {rec.hari}, <br /> {rec.tanggal}
                            </td>
                            <td style={{ height: '90px' }}>
                                {/* Area kosong untuk ditulis tangan oleh guru */}
                            </td>
                            <td style={{ height: '90px' }}>
                                {/* Area kosong untuk ditulis tangan oleh orang tua */}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Bagian Tanda Tangan */}
            <div className="flex justify-between" style={{ marginTop: '40px', padding: '0 50px' }}>
                <div className="text-center">
                    <p className="font-bold">Mengetahui,<br />Kepala Sekolah</p>
                    <div className="signature-line"></div>
                    <p className="font-bold mt-2">{kepsekNama}</p>
                </div>
                <div className="text-center">
                    <p className="font-bold">
                        Bogor, .............................. 202...
                        <br />Guru Kelas
                    </p>
                    <div className="signature-line"></div>
                    <p className="font-bold mt-2">{guruNama}</p>
                </div>
            </div>

        </div>
    );
});