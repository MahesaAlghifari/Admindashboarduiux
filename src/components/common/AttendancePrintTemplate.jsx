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

const formatShortDate = (value) => {
  const raw = text(value).slice(0, 10);
  if (!raw) return "-";
  const date = new Date(`${raw}T00:00:00`);
  if (Number.isNaN(date.getTime())) return raw;
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
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
  npsn: text(profile?.npsn) || "-",
  alamat:
    text(profile?.alamat) ||
    text(profile?.alamat_jalan_2) ||
    "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  telepon: text(profile?.telepon) || "0811 - 9141 - 285",
  email: text(profile?.email) || "adm.sekolahss@gmail.com",
});

const statusLabel = (status) =>
  ({ H: "Hadir", S: "Sakit", I: "Izin", A: "Alpa" }[status] || status || "-");

function Header({ profile, title, subtitle }) {
  const s = school(profile);

  return (
    <header className="attendance-doc-header">
      <div className="attendance-logo-box">
        {schoolLogo ? (
          <img src={schoolLogo} alt={`Logo ${s.nama_sekolah}`} />
        ) : (
          <div className="attendance-logo-fallback">SS</div>
        )}
      </div>
      <div className="attendance-header-copy">
        <div className="attendance-school-name">{s.nama_sekolah}</div>
        <div className="attendance-school-meta">
          {s.alamat} · Telp {s.telepon} · {s.email}
        </div>
        <h1>{title}</h1>
        {subtitle && <div className="attendance-subtitle">{subtitle}</div>}
      </div>
    </header>
  );
}

function Signature({ classroom, headmaster, homeroomTeacher, printedAt }) {
  return (
    <div className="attendance-signatures">
      <div className="attendance-signature-block">
        <div>Mengetahui,</div>
        <div>Kepala Sekolah</div>
        <div className="attendance-signature-space" />
        <div className="attendance-signature-name">{show(headmaster?.nama_lengkap)}</div>
        <div>NIP. {show(headmaster?.nip)}</div>
      </div>
      <div className="attendance-signature-block">
        <div>{formatDate(printedAt)}</div>
        <div>{classroom ? "Wali Kelas" : "Petugas Administrasi"}</div>
        <div className="attendance-signature-space" />
        <div className="attendance-signature-name">
          {classroom ? show(homeroomTeacher?.nama_lengkap) : "________________________"}
        </div>
        <div>{classroom ? `NIP. ${show(homeroomTeacher?.nip)}` : ""}</div>
      </div>
    </div>
  );
}

function RecapDocument({
  items,
  profile,
  periodLabel,
  dateRange,
  classroom,
  classroomLabel,
  headmaster,
  homeroomTeacher,
  printedAt,
}) {
  const totals = items.reduce(
    (acc, item) => ({
      h: acc.h + item.stats.h,
      s: acc.s + item.stats.s,
      i: acc.i + item.stats.i,
      a: acc.a + item.stats.a,
      total: acc.total + item.stats.total,
    }),
    { h: 0, s: 0, i: 0, a: 0, total: 0 }
  );
  const percentage = totals.total > 0 ? Math.round((totals.h / totals.total) * 100) : 0;
  const showClass = !classroom;

  return (
    <section className="attendance-page attendance-recap-page">
      <Header
        profile={profile}
        title="REKAPITULASI PRESENSI ANAK DIDIK"
        subtitle={`${periodLabel} · ${formatDate(dateRange.dari)} s.d. ${formatDate(dateRange.sampai)}`}
      />

      <div className="attendance-meta-grid">
        <div><span>Kelas</span><b>{classroomLabel || "Semua Kelas"}</b></div>
        <div><span>Jumlah Anak</span><b>{items.length}</b></div>
        <div><span>Total Catatan Presensi</span><b>{totals.total}</b></div>
        <div><span>Persentase Hadir</span><b>{percentage}%</b></div>
      </div>

      <table className="attendance-recap-table">
        <thead>
          <tr>
            <th className="attendance-no">No</th>
            <th>NIS</th>
            <th>Nama Anak Didik</th>
            {showClass && <th>Kelas</th>}
            <th className="attendance-number">H</th>
            <th className="attendance-number">S</th>
            <th className="attendance-number">I</th>
            <th className="attendance-number">A</th>
            <th className="attendance-number">Total</th>
            <th className="attendance-number">% Hadir</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => (
            <tr key={item.id}>
              <td className="attendance-center">{index + 1}</td>
              <td>{show(item.nomor_induk || item.nisn)}</td>
              <td className="attendance-bold">{show(item.nama_lengkap)}</td>
              {showClass && <td>{show(item.classroom_name)}</td>}
              <td className="attendance-center">{item.stats.h}</td>
              <td className="attendance-center">{item.stats.s}</td>
              <td className="attendance-center">{item.stats.i}</td>
              <td className="attendance-center">{item.stats.a}</td>
              <td className="attendance-center">{item.stats.total}</td>
              <td className="attendance-center attendance-bold">{item.stats.percentage}%</td>
            </tr>
          ))}
          <tr className="attendance-total-row">
            <td colSpan={showClass ? 4 : 3}>TOTAL</td>
            <td className="attendance-center">{totals.h}</td>
            <td className="attendance-center">{totals.s}</td>
            <td className="attendance-center">{totals.i}</td>
            <td className="attendance-center">{totals.a}</td>
            <td className="attendance-center">{totals.total}</td>
            <td className="attendance-center">{percentage}%</td>
          </tr>
        </tbody>
      </table>

      <div className="attendance-legend">
        H = Hadir · S = Sakit · I = Izin · A = Alpa
      </div>

      <Signature
        classroom={classroom}
        headmaster={headmaster}
        homeroomTeacher={homeroomTeacher}
        printedAt={printedAt}
      />
    </section>
  );
}

function DetailDocument({
  item,
  profile,
  periodLabel,
  dateRange,
  classroom,
  headmaster,
  homeroomTeacher,
  printedAt,
}) {
  const history = [...(item.history || [])].sort((a, b) =>
    a.tanggal.localeCompare(b.tanggal)
  );

  return (
    <section className="attendance-page attendance-detail-page">
      <Header
        profile={profile}
        title="DETAIL PRESENSI ANAK DIDIK"
        subtitle={`${periodLabel} · ${formatDate(dateRange.dari)} s.d. ${formatDate(dateRange.sampai)}`}
      />

      <table className="attendance-identity-table">
        <tbody>
          <tr><td>Nama Anak Didik</td><td>:</td><td>{show(item.nama_lengkap)}</td></tr>
          <tr><td>NIS</td><td>:</td><td>{show(item.nomor_induk || item.nisn)}</td></tr>
          <tr><td>Kelas</td><td>:</td><td>{show(item.classroom_name)}</td></tr>
        </tbody>
      </table>

      <div className="attendance-detail-stats">
        <div><span>Hadir</span><b>{item.stats.h}</b></div>
        <div><span>Sakit</span><b>{item.stats.s}</b></div>
        <div><span>Izin</span><b>{item.stats.i}</b></div>
        <div><span>Alpa</span><b>{item.stats.a}</b></div>
        <div><span>% Hadir</span><b>{item.stats.percentage}%</b></div>
      </div>

      <table className="attendance-detail-table">
        <thead>
          <tr>
            <th className="attendance-no">No</th>
            <th>Tanggal</th>
            <th>Hari</th>
            <th>Status</th>
            <th>Keterangan</th>
          </tr>
        </thead>
        <tbody>
          {history.map((record, index) => (
            <tr key={`${record.tanggal}-${index}`}>
              <td className="attendance-center">{index + 1}</td>
              <td>{formatShortDate(record.tanggal)}</td>
              <td>{dayName(record.tanggal)}</td>
              <td className="attendance-center attendance-bold">{statusLabel(record.status)}</td>
              <td>{show(record.keterangan)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Signature
        classroom={classroom}
        headmaster={headmaster}
        homeroomTeacher={homeroomTeacher}
        printedAt={printedAt}
      />
    </section>
  );
}

export function AttendancePrintTemplate({
  mode = "recap",
  items = [],
  schoolProfile,
  periodLabel = "Periode Presensi",
  dateRange = { dari: "", sampai: "" },
  classroom = null,
  classroomLabel = "Semua Kelas",
  headmaster = null,
  homeroomTeacher = null,
  printedAt = new Date(),
}) {
  return (
    <div className="attendance-print-root">
      <style>{`
        @page attendance-landscape { size: A4 landscape; margin: 9mm 10mm 10mm; }
        @page attendance-portrait { size: A4 portrait; margin: 10mm 11mm 12mm; }
        .attendance-print-root { font-family: Arial, Helvetica, sans-serif; color: #111827; background: white; }
        .attendance-page { box-sizing: border-box; background: white; }
        .attendance-recap-page { page: attendance-landscape; }
        .attendance-detail-page { page: attendance-portrait; break-after: page; }
        .attendance-detail-page:last-child { break-after: auto; }
        .attendance-doc-header { display: flex; align-items: center; gap: 12px; border-bottom: 2px solid #111827; padding-bottom: 8px; margin-bottom: 10px; }
        .attendance-logo-box { width: 54px; height: 54px; display: flex; align-items: center; justify-content: center; flex: 0 0 54px; }
        .attendance-logo-box img { max-width: 100%; max-height: 100%; object-fit: contain; }
        .attendance-logo-fallback { width: 48px; height: 48px; border: 2px solid #111827; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 15px; }
        .attendance-header-copy { flex: 1; text-align: center; padding-right: 54px; }
        .attendance-school-name { font-size: 14pt; font-weight: 800; letter-spacing: .03em; }
        .attendance-school-meta { margin-top: 2px; font-size: 7.5pt; color: #475569; }
        .attendance-header-copy h1 { margin: 6px 0 0; font-size: 11pt; letter-spacing: .05em; }
        .attendance-subtitle { margin-top: 3px; font-size: 8pt; color: #475569; }
        .attendance-meta-grid { display: grid; grid-template-columns: repeat(4, minmax(0,1fr)); gap: 6px; margin: 10px 0; }
        .attendance-meta-grid > div { border: 1px solid #cbd5e1; padding: 6px 8px; border-radius: 4px; }
        .attendance-meta-grid span { display: block; font-size: 6.8pt; color: #64748b; text-transform: uppercase; letter-spacing: .04em; }
        .attendance-meta-grid b { display: block; margin-top: 2px; font-size: 9pt; }
        .attendance-recap-table, .attendance-detail-table { width: 100%; border-collapse: collapse; font-size: 7.5pt; }
        .attendance-recap-table th, .attendance-recap-table td, .attendance-detail-table th, .attendance-detail-table td { border: 1px solid #94a3b8; padding: 4px 5px; vertical-align: middle; }
        .attendance-recap-table th, .attendance-detail-table th { background: #e2e8f0; font-weight: 700; text-align: center; }
        .attendance-recap-table thead, .attendance-detail-table thead { display: table-header-group; }
        .attendance-recap-table tr, .attendance-detail-table tr { break-inside: avoid; }
        .attendance-no { width: 28px; }
        .attendance-number { width: 46px; }
        .attendance-center { text-align: center; }
        .attendance-bold { font-weight: 700; }
        .attendance-total-row td { background: #f1f5f9; font-weight: 800; }
        .attendance-legend { margin-top: 6px; font-size: 7pt; color: #475569; }
        .attendance-signatures { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 18px; font-size: 8pt; }
        .attendance-signature-block { text-align: center; min-height: 78px; }
        .attendance-signature-space { height: 42px; }
        .attendance-signature-name { font-weight: 700; text-decoration: underline; }
        .attendance-identity-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin: 9px 0; }
        .attendance-identity-table td { padding: 2px 3px; }
        .attendance-identity-table td:first-child { width: 130px; color: #475569; }
        .attendance-identity-table td:nth-child(2) { width: 10px; }
        .attendance-identity-table td:last-child { font-weight: 700; }
        .attendance-detail-stats { display: grid; grid-template-columns: repeat(5, minmax(0,1fr)); gap: 5px; margin: 10px 0; }
        .attendance-detail-stats > div { border: 1px solid #cbd5e1; border-radius: 4px; text-align: center; padding: 7px 4px; }
        .attendance-detail-stats span { display: block; font-size: 6.5pt; color: #64748b; text-transform: uppercase; }
        .attendance-detail-stats b { display: block; margin-top: 2px; font-size: 10pt; }
        @media print {
          .attendance-print-root { width: 100%; }
        }
      `}</style>

      {mode === "detail" ? (
        items.map((item) => (
          <DetailDocument
            key={item.id}
            item={item}
            profile={schoolProfile}
            periodLabel={periodLabel}
            dateRange={dateRange}
            classroom={classroom}
            headmaster={headmaster}
            homeroomTeacher={homeroomTeacher}
            printedAt={printedAt}
          />
        ))
      ) : (
        <RecapDocument
          items={items}
          profile={schoolProfile}
          periodLabel={periodLabel}
          dateRange={dateRange}
          classroom={classroom}
          classroomLabel={classroomLabel}
          headmaster={headmaster}
          homeroomTeacher={homeroomTeacher}
          printedAt={printedAt}
        />
      )}
    </div>
  );
}
