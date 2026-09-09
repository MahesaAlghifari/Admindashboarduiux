import React from "react";

const componentImages = import.meta.glob("../**/*.{png,jpg,jpeg,webp,svg}", {
  eager: true,
  query: "?url",
  import: "default",
});

const imageEntries = Object.entries(componentImages);
const logoEntry =
  imageEntries.find(([path]) => /logo/i.test(path)) ||
  imageEntries.find(([path]) => /sekolah.?ss/i.test(path)) ||
  (imageEntries.length === 1 ? imageEntries[0] : null);
const schoolLogo = logoEntry ? logoEntry[1] : "";

const text = (value) => String(value ?? "").trim();
const show = (value) => text(value) || "-";

const countValue = (value) => {
  if (value === "" || value === null || value === undefined) return "0";
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? String(parsed) : "-";
};

const measurementValue = (value, unit = "") => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0
    ? `${parsed}${unit ? ` ${unit}` : ""}`
    : "-";
};

const distanceValue = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? `${parsed} km` : "-";
};

const dateLabel = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";

  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const classroomNameOf = (student) =>
  text(student?.classroom?.nama_kelas) ||
  text(student?.classroom_name) ||
  text(student?.classroom_nama) ||
  text(student?.nama_kelas);

const academicYearOf = (student) =>
  text(student?.status?.tahun_pelajaran) ||
  text(student?.tahun_ajaran) ||
  text(student?.tahun_pelajaran);

const parentOf = (student) => ({
  ...(student?.parent_detail ?? {}),
  ...(student?.parent ?? {}),
});

const developmentOf = (student) => ({
  ...(student?.development ?? {}),
  ...(student?.dev ?? {}),
});

const educationModeOf = (student) => {
  if (
    text(student?.nama_lembaga_asal) ||
    text(student?.alamat_lembaga_asal) ||
    text(student?.kelompok_umur_sebelumnya)
  ) {
    return "pindahan";
  }

  if (
    text(student?.asal_peserta_didik) ||
    text(student?.nama_lembaga) ||
    text(student?.alamat_lembaga)
  ) {
    return "baru";
  }

  return "";
};

const exitModeOf = (student) => {
  const status = student?.status ?? {};
  const reason = text(status?.alasan_keluar).toLocaleLowerCase("id");

  if (/lulus|tamat/.test(reason)) return "lulus";
  if (reason || text(status?.ke_lembaga)) return "pindah";

  if (
    text(status?.lembaga_lanjutan) ||
    text(status?.nomor_surat_keterangan) ||
    text(status?.tanggal_keluar) ||
    status?.status_aktif === false
  ) {
    return "lulus";
  }

  return "";
};

const currentEducationStatusOf = (student) =>
  student?.status?.status_aktif === false ? "Tidak Aktif" : "Aktif";

const school = (profile) => ({
  nama_sekolah:
    text(profile?.nama_sekolah) ||
    text(profile?.school_name) ||
    text(profile?.nama) ||
    "SEKOLAH SS",
  alamat:
    text(profile?.alamat) ||
    text(profile?.alamat_sekolah) ||
    text(profile?.alamat_jalan_2) ||
    text(profile?.address) ||
    "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  telepon:
    text(profile?.telepon) ||
    text(profile?.no_telepon) ||
    text(profile?.phone) ||
    "0811 - 9141 - 285",
  email:
    text(profile?.email) ||
    text(profile?.email_sekolah) ||
    "adm.sekolahss@gmail.com",
  npsn: text(profile?.npsn),
  logo:
    text(profile?.logo) ||
    text(profile?.logo_sekolah) ||
    text(profile?.school_logo) ||
    schoolLogo,
});

function Header({ profile, subtitle }) {
  const data = school(profile);

  return (
    <header className="mb-header">
      <div className="mb-logo">
        {data.logo ? (
          <img src={data.logo} alt={`Logo ${data.nama_sekolah}`} />
        ) : (
          <div className="mb-logo-fallback">SS</div>
        )}
      </div>

      <div className="mb-header-copy">
        <div className="mb-school-name">{data.nama_sekolah}</div>
        <div className="mb-school-meta">
          {data.alamat} · Telp {data.telepon} · {data.email}
          {data.npsn ? ` · NPSN ${data.npsn}` : ""}
        </div>
        <h1>BUKU INDUK PESERTA DIDIK</h1>
        <div className="mb-header-subtitle">{subtitle}</div>
      </div>
    </header>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="mb-info-row">
      <div className="mb-info-label">{label}</div>
      <div className="mb-info-sep">:</div>
      <div className="mb-info-value">{show(value)}</div>
    </div>
  );
}

function SectionTitle({ code, children }) {
  return (
    <div className="mb-section-title">
      <span>{code}</span>
      <b>{children}</b>
    </div>
  );
}

function DataGrid({ left = [], right = [] }) {
  return (
    <div className="mb-data-grid">
      <div className="mb-data-column">
        {left.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
      <div className="mb-data-column">
        {right.map(([label, value]) => (
          <InfoRow key={label} label={label} value={value} />
        ))}
      </div>
    </div>
  );
}

function WideRow({ label, value }) {
  return (
    <div className="mb-wide-row">
      <InfoRow label={label} value={value} />
    </div>
  );
}

function StudentIdentity({ student }) {
  const classroomName = classroomNameOf(student);
  const academicYear = academicYearOf(student);

  return (
    <div className="mb-student-identity">
      <div className="mb-photo">
        {text(student?.foto) ? (
          <img src={student.foto} alt={text(student?.nama_lengkap)} />
        ) : (
          <span>FOTO<br />3 × 4</span>
        )}
      </div>

      <div className="mb-identity-data">
        <InfoRow label="Nama Lengkap" value={student?.nama_lengkap} />
        <InfoRow label="NIS" value={student?.nomor_induk || student?.nis || student?.nisn} />
        <InfoRow label="NIK" value={student?.nik} />
        <InfoRow label="Penempatan Kelas" value={classroomName} />
        <InfoRow label="Tahun Ajaran" value={academicYear} />
        <InfoRow label="Status Pendidikan" value={currentEducationStatusOf(student)} />
      </div>
    </div>
  );
}

function DevelopmentHistory({ rows = [] }) {
  const normalized = Array.isArray(rows) ? rows.slice(0, 3) : [];

  if (
    normalized.length === 0 ||
    !normalized.some(
      (row) =>
        text(row?.tahun) ||
        Number(row?.berat_badan) > 0 ||
        Number(row?.tinggi_badan) > 0 ||
        text(row?.penyakit) ||
        text(row?.kelainan_jiwa)
    )
  ) {
    return <div className="mb-empty-note">Belum ada riwayat keadaan jasmani.</div>;
  }

  return (
    <table className="mb-history-table">
      <thead>
        <tr>
          <th>Tahun</th>
          <th>Berat Badan</th>
          <th>Tinggi Badan</th>
          <th>Penyakit</th>
          <th>Kelainan</th>
        </tr>
      </thead>
      <tbody>
        {normalized.map((row, index) => (
          <tr key={`${text(row?.tahun)}-${index}`}>
            <td>{show(row?.tahun)}</td>
            <td>{measurementValue(row?.berat_badan, "kg")}</td>
            <td>{measurementValue(row?.tinggi_badan, "cm")}</td>
            <td>{show(row?.penyakit)}</td>
            <td>{show(row?.kelainan_jiwa)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EducationHistoryBlock({ student }) {
  const status = student?.status ?? {};
  const mode = educationModeOf(student);

  if (mode === "pindahan") {
    return (
      <div className="mb-context-block">
        <div className="mb-context-heading">Pindah Dari</div>
        <DataGrid
          left={[
            ["Pindah Dari", student?.nama_lembaga_asal],
            ["Kelompok / Kelas Sebelumnya", student?.kelompok_umur_sebelumnya],
          ]}
          right={[
            ["Tanggal Keluar Lembaga Sebelumnya", dateLabel(status?.tanggal_pindah)],
            ["Alamat Lembaga Asal", student?.alamat_lembaga_asal],
          ]}
        />
      </div>
    );
  }

  if (mode === "baru") {
    const fromHome = text(student?.asal_peserta_didik) === "Rumah";
    return (
      <div className="mb-context-block">
        <div className="mb-context-heading">Masuk Menjadi Peserta Didik Baru</div>
        <DataGrid
          left={[
            ["Asal Peserta Didik", student?.asal_peserta_didik],
            ["Nama Lembaga", fromHome ? "-" : student?.nama_lembaga],
          ]}
          right={[
            [
              "Tanggal Keluar Lembaga Sebelumnya",
              fromHome ? "-" : dateLabel(status?.tanggal_pindah),
            ],
            ["Alamat Lembaga", fromHome ? "-" : student?.alamat_lembaga],
          ]}
        />
      </div>
    );
  }

  return (
    <div className="mb-empty-note">Riwayat masuk siswa belum dipilih pada StudentForm.</div>
  );
}

function ExitStatusBlock({ student }) {
  const status = student?.status ?? {};
  const mode = exitModeOf(student);

  if (mode === "pindah") {
    return (
      <div className="mb-context-block">
        <div className="mb-context-heading">Status Keluar: Pindah / Mengundurkan Diri</div>
        <DataGrid
          left={[
            ["Ke Lembaga", status?.ke_lembaga],
            ["Tanggal Keluar", dateLabel(status?.tanggal_keluar)],
          ]}
          right={[["Alasan / Sebab", status?.alasan_keluar]]}
        />
      </div>
    );
  }

  if (mode === "lulus") {
    return (
      <div className="mb-context-block">
        <div className="mb-context-heading">Status Keluar: Lulus / Melanjutkan</div>
        <DataGrid
          left={[
            ["Melanjutkan ke Lembaga", status?.lembaga_lanjutan],
            ["Tanggal Keluar", dateLabel(status?.tanggal_keluar)],
          ]}
          right={[["Nomor/Tgl. Surat Ket.", status?.nomor_surat_keterangan]]}
        />
      </div>
    );
  }

  return (
    <div className="mb-context-block">
      <div className="mb-context-heading">Status Keluar: Belum Keluar</div>
      <div className="mb-empty-note">Siswa masih berada di lembaga.</div>
    </div>
  );
}

function SignatureArea() {
  return (
    <div className="mb-signatures">
      <div className="mb-signature-box">
        <span>Orang Tua / Wali</span>
        <div className="mb-sign-space" />
        <b>(................................................)</b>
      </div>
      <div className="mb-signature-box">
        <span>Mengetahui,</span>
        <span>Kepala Sekolah</span>
        <div className="mb-sign-space" />
        <b>(................................................)</b>
      </div>
    </div>
  );
}

function PageFooter({ student, page }) {
  return (
    <div className="mb-footer">
      <span>Buku Induk Peserta Didik</span>
      <span>{show(student?.nama_lengkap)} · {show(student?.nisn)} · Halaman {page}/2</span>
    </div>
  );
}

function FirstPage({ student, profile }) {
  const parent = parentOf(student);

  return (
    <section className="mb-page">
      <Header profile={profile} subtitle="Identitas, Domisili, Orang Tua & Wali" />
      <StudentIdentity student={student} />

      <SectionTitle code="A">IDENTITAS</SectionTitle>
      <DataGrid
        left={[
          ["Nama Lengkap", student?.nama_lengkap],
          ["Nama Panggilan", student?.nama_panggilan],
          ["NIS", student?.nomor_induk || student?.nis || student?.nisn],
          ["NIK", student?.nik],
          ["Tempat Lahir", student?.tempat_lahir],
        ]}
        right={[
          ["Tanggal Lahir", dateLabel(student?.tanggal_lahir)],
          ["Jenis Kelamin", student?.jenis_kelamin],
          ["Agama", student?.agama],
          ["Kewarganegaraan", student?.kewarganegaraan],
        ]}
      />

      <SectionTitle code="B">DOMISILI</SectionTitle>
      <WideRow label="Alamat Lengkap" value={student?.alamat_lengkap} />
      <DataGrid
        left={[
          ["Nomor Telepon Rumah", student?.no_telepon_rumah],
          ["Status Tempat Tinggal", student?.status_tempat_tinggal],
          ["Jarak ke Sekolah", distanceValue(student?.jarak_ke_sekolah)],
          ["Bahasa Sehari-hari", student?.bahasa_sehari_hari],
        ]}
        right={[
          ["Saudara Kandung", countValue(student?.jumlah_saudara_kandung)],
          ["Saudara Tiri", countValue(student?.jumlah_saudara_tiri)],
          ["Saudara Angkat", countValue(student?.jumlah_saudara_angkat)],
        ]}
      />

      <SectionTitle code="C">ORANG TUA & WALI</SectionTitle>
      <WideRow label="Nomor Ponsel Orang Tua" value={parent?.no_hp_ortu} />
      <DataGrid
        left={[
          ["Nama Ayah", parent?.nama_ayah],
          ["Pendidikan Ayah", parent?.pendidikan_ayah],
          ["Pekerjaan Ayah", parent?.pekerjaan_ayah],
          ["Nama Ibu", parent?.nama_ibu],
          ["Pendidikan Ibu", parent?.pendidikan_ibu],
          ["Pekerjaan Ibu", parent?.pekerjaan_ibu],
        ]}
        right={[
          ["Nama Wali", parent?.nama_wali],
          ["Pendidikan Wali", parent?.pendidikan_wali],
          ["Pekerjaan Wali", parent?.pekerjaan_wali],
          ["Hubungan", parent?.hubungan_keluarga_wali],
        ]}
      />

      <PageFooter student={student} page={1} />
    </section>
  );
}

function SecondPage({ student }) {
  const status = student?.status ?? {};
  const development = developmentOf(student);
  const classroomName = classroomNameOf(student);
  const academicYear = academicYearOf(student);
  const history = Array.isArray(development?.riwayat_perkembangan)
    ? development.riwayat_perkembangan
    : [];

  return (
    <section className="mb-page mb-page-continuation">
      <div className="mb-page-identity">
        <div><span>Nama Peserta Didik</span><b>{show(student?.nama_lengkap)}</b></div>
        <div><span>NIS</span><b>{show(student?.nomor_induk || student?.nis || student?.nisn)}</b></div>
        <div><span>Penempatan Kelas</span><b>{show(classroomName)}</b></div>
        <div><span>Tahun Ajaran</span><b>{show(academicYear)}</b></div>
      </div>

      <SectionTitle code="D">PERKEMBANGAN — KEADAAN JASMANI (RIWAYAT)</SectionTitle>
      <DevelopmentHistory rows={history} />

      <SectionTitle code="E">PENDIDIKAN</SectionTitle>
      <EducationHistoryBlock student={student} />

      <div className="mb-subtitle">Lembaga Saat Ini</div>
      <DataGrid
        left={[
          ["Tahun Ajaran", academicYear],
          ["Tanggal Masuk", dateLabel(status?.tanggal_masuk)],
          ["Status Pendidikan", currentEducationStatusOf(student)],
        ]}
        right={[
          ["Penempatan Kelas", classroomName],
          ["Prestasi Belajar", development?.prestasi_belajar],
        ]}
      />

      <div className="mb-subtitle">Status Keluar dari Lembaga</div>
      <ExitStatusBlock student={student} />

      <div className="mb-subtitle">Catatan Penting</div>
      <div className="mb-notes">{show(student?.catatan_penting)}</div>

      <SignatureArea />
      <PageFooter student={student} page={2} />
    </section>
  );
}

export function StudentMasterBookPrintTemplate({
  students = [],
  profile = {},
}) {
  return (
    <div className="student-master-book-print">
      {students.map((student, index) => {
        const key =
          student?.id ??
          student?.student_id ??
          student?.nisn ??
          student?.nik ??
          index;

        return (
          <div className="mb-student-document" key={key}>
            <FirstPage student={student} profile={profile} />
            <SecondPage student={student} />
          </div>
        );
      })}
    </div>
  );
}

export const studentMasterBookPrintCss = `
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
`;