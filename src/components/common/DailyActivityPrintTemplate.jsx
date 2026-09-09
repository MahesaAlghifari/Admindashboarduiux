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
const normalized = (value) => text(value).toLowerCase().replace(/\s+/g, " ");

const formatDate = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit", month: "long", year: "numeric" }).format(date);
};

const dayName = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("id-ID", { weekday: "long" }).format(date);
};

const school = (profile) => ({
  nama_sekolah: text(profile?.nama_sekolah) || "SEKOLAH SS",
  alamat: text(profile?.alamat) || text(profile?.alamat_jalan_2) || "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  telepon: text(profile?.telepon) || "0811 - 9141 - 285",
  email: text(profile?.email) || "adm.sekolahss@gmail.com",
});

const participation = (value) => {
  const status = normalized(value);
  if (["dilakukan", "ya", "yes", "true", "1", "berpartisipasi"].includes(status)) return "Dilakukan";
  if (["tidak dilakukan", "tidak", "no", "false", "0", "tidak berpartisipasi"].includes(status)) return "Tidak Dilakukan";
  return "-";
};

function Header({ profile, record, periodLabel }) {
  const data = school(profile);
  return (
    <header className="da-header">
      <div className="da-logo">
        {schoolLogo ? <img src={schoolLogo} alt={`Logo ${data.nama_sekolah}`} /> : <div className="da-logo-fallback">SS</div>}
      </div>
      <div className="da-header-copy">
        <div className="da-school">{data.nama_sekolah}</div>
        <div className="da-school-meta">{data.alamat} · Telp {data.telepon} · {data.email}</div>
        <h1>LAPORAN AKTIVITAS HARIAN</h1>
        <div className="da-period">Per Kelas · {periodLabel}</div>
      </div>
    </header>
  );
}

function PlanGrid({ plan }) {
  const fields = [
    ["Tema", plan?.tema],
    ["Pilar Karakter", plan?.pilar_karakter],
    ["Nilai Karakter", plan?.nilai_karakter],
    ["Jurnal", plan?.jurnal],
    ["Aktivitas", plan?.aktivitas],
    ["Pembiasaan", plan?.pembiasaan],
  ];
  return <div className="da-plan-grid">{fields.map(([label, value]) => (
    <div key={label} className="da-plan-item"><span>{label}</span><b>{show(value)}</b></div>
  ))}</div>;
}

function ActivityPage({ record, profile, periodLabel, homeroomTeacher, headmaster, printedAt }) {
  return (
    <section className="da-page">
      <Header profile={profile} record={record} periodLabel={periodLabel} />
      <div className="da-identity">
        <div><span>Kelas</span><b>{show(record.classroom_name)}</b></div>
        <div><span>Hari / Tanggal</span><b>{dayName(record.tanggal)}, {formatDate(record.tanggal)}</b></div>
        <div><span>Minggu Dimulai</span><b>{formatDate(record.week_start)}</b></div>
        <div><span>Status</span><b>{record.is_holiday ? "Libur" : "Aktif"}</b></div>
      </div>

      {record.is_holiday ? (
        <div className="da-holiday"><b>HARI LIBUR</b><span>Tidak ada aktivitas dan partisipasi anak didik pada tanggal ini.</span></div>
      ) : (
        <>
          <div className="da-section-title">Rencana Kegiatan Kelas</div>
          <PlanGrid plan={record.plan} />

          <div className="da-section-title da-table-title">Aktivitas dan Refleksi Anak Didik</div>
          <table className="da-table">
            <thead>
              <tr>
                <th className="da-no">No</th>
                <th className="da-student">Anak Didik</th>
                <th>Nilai Karakter</th>
                <th>Jurnal</th>
                <th>Aktivitas</th>
                <th>Pembiasaan</th>
                <th>Makananku</th>
                <th>Perasaan</th>
                <th>Barang Besok</th>
                <th>Catatan Guru</th>
              </tr>
            </thead>
            <tbody>
              {record.items.map((student, index) => (
                <tr key={student.id ?? `${student.nama_lengkap}-${index}`}>
                  <td className="da-center">{index + 1}</td>
                  <td><b>{show(student.nama_lengkap)}</b><div className="da-nisn">{show(student.nisn || student.nomor_induk)}</div></td>
                  <td className="da-center">{participation(student.log?.nilai_karakter_status)}</td>
                  <td className="da-center">{participation(student.log?.jurnal_status)}</td>
                  <td className="da-center">{participation(student.log?.aktivitas_status)}</td>
                  <td className="da-center">{participation(student.log?.pembiasaan_status)}</td>
                  <td className="da-center">{show(student.log?.makanan)}</td>
                  <td className="da-center">{show(student.log?.perasaan)}</td>
                  <td>{show(student.log?.barang_bawaan)}</td>
                  <td>{show(student.log?.catatan_guru)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="da-summary">
            <span>Jumlah siswa <b>{record.stats.total_students}</b></span>
            <span>Data terisi <b>{record.stats.filled_students}</b></span>
            <span>Nilai karakter dilakukan <b>{record.items.filter((student) => participation(student.log?.nilai_karakter_status) === "Dilakukan").length}</b></span>
            <span>Pembiasaan dilakukan <b>{record.items.filter((student) => participation(student.log?.pembiasaan_status) === "Dilakukan").length}</b></span>
          </div>
        </>
      )}

      <div className="da-signatures">
        <div className="da-signature"><div>Mengetahui,</div><div>Kepala Sekolah</div><div className="da-sign-space" /><b>{show(headmaster?.nama_lengkap)}</b><span>NIP. {show(headmaster?.nip)}</span></div>
        <div className="da-signature"><div>Bogor, {formatDate(printedAt)}</div><div>Guru Kelas</div><div className="da-sign-space" /><b>{show(homeroomTeacher?.nama_lengkap)}</b><span>NIP. {show(homeroomTeacher?.nip)}</span></div>
      </div>

      <div className="da-footer"><span>{school(profile).nama_sekolah}</span><span>Laporan Aktivitas Harian · {show(record.classroom_name)} · {formatDate(record.tanggal)}</span></div>
    </section>
  );
}

export function DailyActivityPrintTemplate({
  records = [],
  profile,
  periodLabel = "",
  homeroomTeachers = {},
  headmaster = null,
  printedAt = new Date(),
}) {
  return (
    <div className="da-document">
      <style>{`
        @page { size:A4 landscape; margin:6mm; }
        .da-document { color:#111827; font-family:Arial,Helvetica,sans-serif; font-size:7.8pt; line-height:1.25; }
        .da-page { box-sizing:border-box; min-height:197mm; position:relative; padding-bottom:8mm; page-break-after:always; break-after:page; page-break-inside:avoid; }
        .da-page:last-child { page-break-after:auto; break-after:auto; }
        .da-header { display:flex; align-items:center; gap:8px; border-bottom:1.5px solid #111827; padding-bottom:4px; }
        .da-logo { width:40px; height:40px; display:flex; align-items:center; justify-content:center; }
        .da-logo img { max-width:100%; max-height:100%; object-fit:contain; }
        .da-logo-fallback { width:35px; height:35px; border:1.2px solid #111827; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12pt; font-weight:700; }
        .da-header-copy { flex:1; text-align:center; }
        .da-school { font-size:12pt; font-weight:700; }
        .da-school-meta { margin-top:1px; font-size:7pt; color:#6b7280; }
        .da-header h1 { margin:3px 0 0; font-size:13pt; letter-spacing:.04em; }
        .da-period { margin-top:1px; font-size:7.4pt; font-weight:600; color:#4b5563; }
        .da-identity { display:grid; grid-template-columns:1fr 1.5fr 1fr .7fr; border:1px solid #9ca3af; margin-top:5px; }
        .da-identity>div { padding:3px 6px; border-right:1px solid #d1d5db; }
        .da-identity>div:last-child { border-right:0; }
        .da-identity span { display:block; font-size:6.2pt; color:#6b7280; text-transform:uppercase; }
        .da-identity b { display:block; margin-top:1px; font-size:7.8pt; }
        .da-section-title { margin-top:5px; font-size:7.8pt; font-weight:700; text-transform:uppercase; letter-spacing:.02em; }
        .da-plan-grid { display:grid; grid-template-columns:repeat(6,minmax(0,1fr)); border:1px solid #9ca3af; margin-top:3px; }
        .da-plan-item { min-height:16mm; padding:4px 5px; border-right:1px solid #d1d5db; }
        .da-plan-item:last-child { border-right:0; }
        .da-plan-item span { display:block; font-size:5.9pt; color:#6b7280; text-transform:uppercase; }
        .da-plan-item b { display:block; margin-top:2px; font-size:7pt; white-space:pre-wrap; }
        .da-table-title { margin-top:6px; }
        .da-table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:3px; }
        .da-table th,.da-table td { border:1px solid #111827; padding:3px 3px; vertical-align:top; overflow-wrap:anywhere; }
        .da-table th { background:#f3f4f6; text-align:center; font-size:6.1pt; text-transform:uppercase; }
        .da-table td { font-size:6.4pt; line-height:1.25; }
        .da-table .da-no { width:3.5%; }
        .da-table .da-student { width:13%; }
        .da-table th:nth-child(3),.da-table th:nth-child(4),.da-table th:nth-child(5),.da-table th:nth-child(6) { width:8.5%; }
        .da-table th:nth-child(7),.da-table th:nth-child(8) { width:7%; }
        .da-table th:nth-child(9) { width:11%; }
        .da-table th:nth-child(10) { width:14.5%; }
        .da-center { text-align:center; vertical-align:middle!important; }
        .da-nisn { margin-top:1px; color:#6b7280; font-size:5.7pt; }
        .da-summary { display:flex; flex-wrap:wrap; gap:8px 14px; margin-top:5px; padding:4px 6px; border:1px solid #d1d5db; background:#f9fafb; font-size:6.4pt; }
        .da-holiday { margin-top:12mm; padding:12mm; border:1px solid #f59e0b; background:#fffbeb; text-align:center; color:#92400e; display:flex; flex-direction:column; gap:4px; }
        .da-signatures { display:grid; grid-template-columns:1fr 1fr; gap:32mm; margin:8px 20mm 0; }
        .da-signature { text-align:center; font-size:6.8pt; }
        .da-sign-space { height:14mm; }
        .da-signature b { display:block; font-size:7.2pt; text-decoration:underline; }
        .da-signature span { display:block; margin-top:1px; color:#6b7280; }
        .da-footer { position:absolute; left:0; right:0; bottom:0; border-top:1px solid #d1d5db; padding-top:2px; display:flex; justify-content:space-between; color:#6b7280; font-size:6pt; }
      `}</style>
      {records.map((record, index) => (
        <ActivityPage
          key={`${record.classroom_id}-${record.tanggal}-${index}`}
          record={record}
          profile={profile}
          periodLabel={periodLabel}
          homeroomTeacher={homeroomTeachers[String(record.classroom_id)] || null}
          headmaster={headmaster}
          printedAt={printedAt}
        />
      ))}
    </div>
  );
}

export default DailyActivityPrintTemplate;
