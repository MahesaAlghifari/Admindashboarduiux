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

const formatDate = (value) => {
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

const school = (profile) => ({
  nama_sekolah: text(profile?.nama_sekolah) || "SEKOLAH SS",
  npsn: text(profile?.npsn) || "-",
  alamat_jalan_1:
    text(profile?.alamat_jalan_1) || "Perumahan Baranangsiang Indah",
  alamat_jalan_2:
    text(profile?.alamat_jalan_2) || "Jl. Megamendung IV Blok E1 No. 21",
  kelurahan_kecamatan:
    text(profile?.kelurahan_kecamatan) || "Katulampa / Bogor Timur",
  kota_provinsi:
    text(profile?.kota_provinsi) || "Kota Bogor / Jawa Barat",
  kode_pos: text(profile?.kode_pos) || "16144",
  telepon: text(profile?.telepon) || "0811 - 9141 - 285",
  email: text(profile?.email) || "adm.sekolahss@gmail.com",
});

const guideItems = [
  "Buku Laporan Pencapaian Perkembangan Anak (LPPA) ini dipergunakan selama anak didik mengikuti seluruh program pembelajaran di Sekolah SS.",
  "Apabila anak didik pindah sekolah, buku LPPA dibawa oleh anak didik sebagai bukti pencapaian kompetensi.",
  "Apabila buku LPPA hilang, dapat diganti dengan buku pengganti yang disahkan oleh kepala sekolah berdasarkan arsip.",
  "Identitas Sekolah dan Anak Didik diisi sesuai dengan dokumen resmi (Akte Kelahiran / Kartu Keluarga).",
  "Penilaian dilakukan secara kualitatif (Deskripsi) dan kuantitatif (Simbol) berdasarkan standar kurikulum.",
];

const scaleRows = [
  {
    code: "BB",
    category: "Belum Berkembang",
    description:
      "Anak melakukannya harus dengan bimbingan atau dicontohkan sepenuhnya oleh guru.",
  },
  {
    code: "MB",
    category: "Mulai Berkembang",
    description:
      "Anak melakukannya masih harus diingatkan atau dibantu sebagian oleh guru.",
  },
  {
    code: "BSH",
    category: "Berkembang Sesuai Harapan",
    description:
      "Anak sudah dapat melakukannya secara mandiri dan konsisten tanpa harus diingatkan.",
  },
  {
    code: "BSB",
    category: "Berkembang Sangat Baik",
    description:
      "Anak sudah dapat melakukannya secara mandiri, konsisten, dan dapat membantu temannya.",
  },
];

function Footer({ schoolName }) {
  return (
    <div className="lppa-front-footer">
      <span>{schoolName}</span>
      <span>LPPA</span>
    </div>
  );
}

function Cover({ profile, identity, period }) {
  const s = school(profile);

  return (
    <section className="lppa-front-page lppa-cover">
      <div className="lppa-cover-inner">
        <div className="lppa-logo-box">
          {schoolLogo ? (
            <img src={schoolLogo} alt={`Logo ${s.nama_sekolah}`} />
          ) : (
            <div className="lppa-logo-fallback">SS</div>
          )}
        </div>
        <div className="lppa-cover-school">{s.nama_sekolah}</div>
        <div className="lppa-cover-rule" />
        <h1>BUKU LAPORAN PENCAPAIAN PERKEMBANGAN ANAK</h1>
        <div className="lppa-cover-acronym">(LPPA)</div>
        <div className="lppa-cover-period">
          <div>{period?.semester_label || "Semester"}</div>
          <div>Tahun Ajaran {period?.tahun_ajaran || "-"}</div>
        </div>
        <div className="lppa-cover-student">
          <div className="lppa-cover-label">Nama Anak Didik</div>
          <div className="lppa-cover-name">{show(identity?.nama_lengkap)}</div>
          <div className="lppa-cover-meta">
            NIS {show(identity?.nomor_induk || identity?.nis || identity?.nisn)} · {show(identity?.classroom_name)}
          </div>
        </div>
        <div className="lppa-cover-address">
          {s.alamat_jalan_1}<br />
          {s.alamat_jalan_2}, {s.kelurahan_kecamatan}<br />
          {s.kota_provinsi} · {s.kode_pos}
        </div>
      </div>
      <Footer schoolName={s.nama_sekolah} />
    </section>
  );
}

function Guide({ profile }) {
  const s = school(profile);

  return (
    <section className="lppa-front-page">
      <h2 className="lppa-page-title">PETUNJUK PENGGUNAAN</h2>
      <ol className="lppa-guide-list">
        {guideItems.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ol>

      <h3 className="lppa-section-heading">KETERANGAN NILAI</h3>
      <table className="lppa-table lppa-scale-table">
        <thead>
          <tr>
            <th className="lppa-code-col">KODE</th>
            <th className="lppa-category-col">KATEGORI</th>
            <th>DESKRIPSI CAPAIAN</th>
          </tr>
        </thead>
        <tbody>
          {scaleRows.map((row) => (
            <tr key={row.code}>
              <td className="lppa-center lppa-bold">{row.code}</td>
              <td className="lppa-bold">{row.category}</td>
              <td>{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <Footer schoolName={s.nama_sekolah} />
    </section>
  );
}

function SchoolIdentity({ profile }) {
  const s = school(profile);

  return (
    <section className="lppa-front-page">
      <h2 className="lppa-page-title">IDENTITAS</h2>
      <div className="lppa-subtitle">SATUAN PAUD SEJENIS</div>

      <table className="lppa-identity-table">
        <tbody>
          <tr>
            <td className="lppa-no">1.</td>
            <td className="lppa-label">Nama Sekolah</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value lppa-bold">{s.nama_sekolah}</td>
          </tr>
          <tr>
            <td className="lppa-no">2.</td>
            <td className="lppa-label">NPSN</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">{s.npsn}</td>
          </tr>
          <tr>
            <td className="lppa-no" rowSpan={6}>3.</td>
            <td className="lppa-label">Alamat Sekolah</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value" />
          </tr>
          <tr>
            <td className="lppa-label lppa-indent">Jalan</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">
              {s.alamat_jalan_1}<br />
              {s.alamat_jalan_2}
            </td>
          </tr>
          <tr>
            <td className="lppa-label lppa-indent">Kelurahan / Kecamatan</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">{s.kelurahan_kecamatan}</td>
          </tr>
          <tr>
            <td className="lppa-label lppa-indent">Kota / Provinsi</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">{s.kota_provinsi}</td>
          </tr>
          <tr>
            <td className="lppa-label lppa-indent">Kode Pos</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">{s.kode_pos}</td>
          </tr>
          <tr>
            <td className="lppa-label" />
            <td className="lppa-separator" />
            <td className="lppa-value" />
          </tr>
          <tr>
            <td className="lppa-no">4.</td>
            <td className="lppa-label">Kontak (Telp/HP)</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">{s.telepon}</td>
          </tr>
          <tr>
            <td className="lppa-no">5.</td>
            <td className="lppa-label">Email</td>
            <td className="lppa-separator">:</td>
            <td className="lppa-value">{s.email}</td>
          </tr>
        </tbody>
      </table>

      <div className="lppa-school-card">
        <div className="lppa-school-card-name">{s.nama_sekolah}</div>
        <div>{s.alamat_jalan_1}</div>
        <div>{s.alamat_jalan_2}</div>
        <div>{s.kelurahan_kecamatan}, {s.kota_provinsi} {s.kode_pos}</div>
        <div>{s.telepon} · {s.email}</div>
      </div>
      <Footer schoolName={s.nama_sekolah} />
    </section>
  );
}

function PairRow({ a, av, b, bv }) {
  return (
    <tr>
      <td className="lppa-pair-label">{a}</td>
      <td className="lppa-pair-colon">:</td>
      <td>{show(av)}</td>
      <td className="lppa-pair-label">{b}</td>
      <td className="lppa-pair-colon">:</td>
      <td>{show(bv)}</td>
    </tr>
  );
}

function StudentIdentity({ profile, identity }) {
  const s = school(profile);
  const parent = identity?.parent || {};
  const status = identity?.status || {};
  const siblings = [
    Number(identity?.jumlah_saudara_kandung) || 0,
    Number(identity?.jumlah_saudara_tiri) || 0,
    Number(identity?.jumlah_saudara_angkat) || 0,
  ].reduce((sum, value) => sum + value, 0);
  const birth = [text(identity?.tempat_lahir), formatDate(identity?.tanggal_lahir)]
    .filter((value) => value && value !== "-")
    .join(", ");
  const distance = Number(identity?.jarak_ke_sekolah);

  return (
    <section className="lppa-front-page lppa-student-page">
      <h2 className="lppa-page-title">IDENTITAS ANAK DIDIK</h2>

      <h3 className="lppa-section-heading lppa-section-first">A. DATA PRIBADI</h3>
      <table className="lppa-table lppa-pair-table">
        <tbody>
          <PairRow a="Nama Lengkap" av={identity?.nama_lengkap} b="Nama Panggilan" bv={identity?.nama_panggilan} />
          <PairRow a="NIS" av={identity?.nomor_induk || identity?.nis || identity?.nisn} b="NIK" bv={identity?.nik} />
          <PairRow a="Tempat, Tanggal Lahir" av={birth} b="Jenis Kelamin" bv={identity?.jenis_kelamin} />
          <PairRow a="Agama" av={identity?.agama} b="Kewarganegaraan" bv={identity?.kewarganegaraan} />
          <PairRow a="Bahasa Sehari-hari" av={identity?.bahasa_sehari_hari} b="Status Tempat Tinggal" bv={identity?.status_tempat_tinggal} />
          <PairRow a="Nomor telepon rumah" av={identity?.no_telepon_rumah} b="Jumlah Saudara" bv={siblings || "-"} />
          <PairRow a="Jarak ke Sekolah" av={Number.isFinite(distance) && distance > 0 ? `${distance} km` : "-"} b="Kelas/Kelompok" bv={identity?.classroom_name} />
          <tr>
            <td className="lppa-pair-label">Alamat Lengkap</td>
            <td className="lppa-pair-colon">:</td>
            <td colSpan={4}>{show(identity?.alamat_lengkap)}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="lppa-section-heading">B. RIWAYAT PENERIMAAN</h3>
      <table className="lppa-table lppa-pair-table">
        <tbody>
          <PairRow a="Tahun Pelajaran" av={status.tahun_pelajaran} b="Tanggal Masuk" bv={formatDate(status.tanggal_masuk)} />
          <PairRow a="Kelompok Umur" av={status.kelompok_umur} b="Asal Peserta Didik" bv={identity?.asal_peserta_didik} />
          <PairRow a="Nama Lembaga" av={identity?.nama_lembaga} b="Kelompok Sebelumnya" bv={identity?.kelompok_umur_sebelumnya} />
          <tr>
            <td className="lppa-pair-label">Alamat Lembaga</td>
            <td className="lppa-pair-colon">:</td>
            <td colSpan={4}>{show(identity?.alamat_lembaga)}</td>
          </tr>
          <tr>
            <td className="lppa-pair-label">Lembaga Asal/Pindahan</td>
            <td className="lppa-pair-colon">:</td>
            <td>{show(identity?.nama_lembaga_asal)}</td>
            <td className="lppa-pair-label">Alamat Lembaga Asal</td>
            <td className="lppa-pair-colon">:</td>
            <td>{show(identity?.alamat_lembaga_asal)}</td>
          </tr>
        </tbody>
      </table>

      <h3 className="lppa-section-heading">C. DATA ORANG TUA / WALI</h3>
      <table className="lppa-table lppa-parent-table">
        <thead>
          <tr>
            <th>Hubungan</th>
            <th>Nama</th>
            <th>Pendidikan</th>
            <th>Pekerjaan</th>
            <th>Kontak</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="lppa-bold">Ayah</td>
            <td>{show(parent.nama_ayah)}</td>
            <td>{show(parent.pendidikan_ayah)}</td>
            <td>{show(parent.pekerjaan_ayah)}</td>
            <td>{show(parent.kontak_ayah || parent.no_hp_ortu)}</td>
          </tr>
          <tr>
            <td className="lppa-bold">Ibu</td>
            <td>{show(parent.nama_ibu)}</td>
            <td>{show(parent.pendidikan_ibu)}</td>
            <td>{show(parent.pekerjaan_ibu)}</td>
            <td>{show(parent.kontak_ibu || parent.no_hp_ortu)}</td>
          </tr>
          <tr>
            <td className="lppa-bold">Wali</td>
            <td>{show(parent.nama_wali)}</td>
            <td>{show(parent.pendidikan_wali)}</td>
            <td>{show(parent.pekerjaan_wali)}</td>
            <td>{show(parent.kontak_wali || parent.no_hp_ortu)}</td>
          </tr>
          <tr>
            <td className="lppa-bold">Hubungan Wali</td>
            <td colSpan={4}>{show(parent.hubungan_keluarga_wali)}</td>
          </tr>
        </tbody>
      </table>
      <Footer schoolName={s.nama_sekolah} />
    </section>
  );
}

export function RaporCompleteDocument({
  schoolProfile,
  identity,
  period,
  children,
}) {
  return (
    <div className="lppa-complete-document">
      <style>{`
        .lppa-complete-document { color: #111827; font-family: Arial, Helvetica, sans-serif; }
        .lppa-front-page { position: relative; min-height: 279mm; box-sizing: border-box; padding: 10mm 9mm 14mm; background: #fff; break-after: page; page-break-after: always; font-size: 9pt; line-height: 1.45; }
        .lppa-front-footer { position: absolute; left: 9mm; right: 9mm; bottom: 4mm; display: flex; justify-content: space-between; border-top: .25mm solid #d1d5db; padding-top: 2mm; font-size: 7pt; color: #6b7280; }
        .lppa-cover { padding: 14mm 14mm 14mm; }
        .lppa-cover-inner { min-height: 248mm; border: .65mm solid #1f2937; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 18mm 14mm 13mm; box-sizing: border-box; }
        .lppa-logo-box { height: 42mm; width: 42mm; display: flex; align-items: center; justify-content: center; margin-bottom: 7mm; }
        .lppa-logo-box img { display: block; max-height: 42mm; max-width: 42mm; object-fit: contain; }
        .lppa-logo-fallback { width: 34mm; height: 34mm; border: .8mm solid #1f2937; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 22pt; font-weight: 800; }
        .lppa-cover-school { font-size: 15pt; font-weight: 800; letter-spacing: .12em; }
        .lppa-cover-rule { width: 72mm; height: .6mm; background: #111827; margin: 5mm 0 11mm; }
        .lppa-cover h1 { max-width: 140mm; margin: 0; font-size: 22pt; line-height: 1.35; letter-spacing: .035em; }
        .lppa-cover-acronym { margin-top: 4mm; font-size: 16pt; font-weight: 700; }
        .lppa-cover-period { margin-top: 12mm; font-size: 11pt; line-height: 1.65; }
        .lppa-cover-student { width: 125mm; margin-top: 14mm; border-top: .3mm solid #9ca3af; border-bottom: .3mm solid #9ca3af; padding: 6mm 4mm; }
        .lppa-cover-label { font-size: 8pt; text-transform: uppercase; letter-spacing: .12em; color: #6b7280; }
        .lppa-cover-name { margin-top: 2mm; font-size: 15pt; font-weight: 800; }
        .lppa-cover-meta { margin-top: 2mm; font-size: 8.5pt; color: #4b5563; }
        .lppa-cover-address { margin-top: auto; font-size: 8.5pt; line-height: 1.65; color: #374151; }
        .lppa-page-title { margin: 0; padding-bottom: 4mm; border-bottom: .6mm solid #1f2937; text-align: center; font-size: 15pt; letter-spacing: .06em; }
        .lppa-subtitle { margin-top: 4mm; text-align: center; font-size: 10pt; font-weight: 700; letter-spacing: .08em; }
        .lppa-guide-list { margin: 7mm 0 8mm; padding-left: 7mm; }
        .lppa-guide-list li { margin-bottom: 3.2mm; padding-left: 2mm; text-align: justify; }
        .lppa-section-heading { margin: 7mm 0 3mm; padding: 2.2mm 3mm; background: #f3f4f6; border-left: 1mm solid #374151; font-size: 9.5pt; letter-spacing: .04em; }
        .lppa-section-first { margin-top: 5mm; }
        .lppa-table { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .lppa-table th, .lppa-table td { border: .25mm solid #6b7280; padding: 2.3mm 2.5mm; vertical-align: top; }
        .lppa-table th { background: #f3f4f6; text-align: center; font-size: 8pt; letter-spacing: .025em; }
        .lppa-scale-table { font-size: 8.5pt; }
        .lppa-code-col { width: 13mm; }
        .lppa-category-col { width: 48mm; }
        .lppa-center { text-align: center; }
        .lppa-bold { font-weight: 700; }
        .lppa-identity-table { width: 100%; margin-top: 10mm; border-collapse: collapse; font-size: 10pt; }
        .lppa-identity-table td { padding: 2.7mm 1.5mm; vertical-align: top; }
        .lppa-no { width: 8mm; text-align: right; padding-right: 2mm !important; }
        .lppa-label { width: 53mm; }
        .lppa-separator { width: 5mm; text-align: center; }
        .lppa-value { border-bottom: .25mm dotted #9ca3af; }
        .lppa-indent { padding-left: 7mm !important; }
        .lppa-school-card { margin: 16mm auto 0; width: 125mm; border: .4mm solid #9ca3af; padding: 7mm; text-align: center; font-size: 8.5pt; line-height: 1.65; }
        .lppa-school-card-name { margin-bottom: 2mm; font-size: 11pt; font-weight: 800; }
        .lppa-student-page { font-size: 8pt; }
        .lppa-pair-table td { padding: 1.7mm 2mm; vertical-align: top; word-break: break-word; }
        .lppa-pair-table td:nth-child(1), .lppa-pair-table td:nth-child(4) { width: 29mm; }
        .lppa-pair-table td:nth-child(2), .lppa-pair-table td:nth-child(5) { width: 4mm; text-align: center; }
        .lppa-pair-label { font-weight: 600; background: #f9fafb; }
        .lppa-pair-colon { text-align: center; }
        .lppa-parent-table { font-size: 7.8pt; }
        .lppa-parent-table th:nth-child(1) { width: 22mm; }
        .lppa-parent-table th:nth-child(2) { width: 42mm; }
        .lppa-parent-table th:nth-child(3) { width: 31mm; }
        .lppa-parent-table th:nth-child(4) { width: 38mm; }
        .lppa-parent-table th:nth-child(5) { width: 37mm; }
        @media print {
          .lppa-front-page { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}</style>
      <Cover profile={schoolProfile} identity={identity} period={period} />
      <Guide profile={schoolProfile} />
      <SchoolIdentity profile={schoolProfile} />
      <StudentIdentity profile={schoolProfile} identity={identity} />
      {children}
    </div>
  );
}
