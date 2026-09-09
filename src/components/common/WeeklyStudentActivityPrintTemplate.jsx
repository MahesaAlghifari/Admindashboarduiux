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
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
};

const shortDate = (value) => {
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

const school = (profile) => ({
  nama_sekolah: text(profile?.nama_sekolah) || "SEKOLAH SS",
  alamat:
    text(profile?.alamat) ||
    text(profile?.alamat_jalan_2) ||
    "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  telepon: text(profile?.telepon) || "0811 - 9141 - 285",
  email: text(profile?.email) || "adm.sekolahss@gmail.com",
});

const planField = (day, item, key) =>
  text(day?.plan?.[key]) || text(item?.plan?.[key]);

const journalValue = (day, item) =>
  text(day?.plan?.jurnal) ||
  text(day?.plan?.isi_jurnal) ||
  text(item?.plan?.jurnal) ||
  text(item?.plan?.isi_jurnal);

const assessmentStatus = (day, key) => {
  const aliases = {
    jurnal: ["jurnal_status"],
    nilai_karakter: ["nilai_karakter_status", "pilar_karakter_status"],
    aktivitas: ["aktivitas_status"],
    pembiasaan: ["pembiasaan_status"],
  };
  for (const candidate of aliases[key] || []) {
    const value = normalized(day?.log?.[candidate]);
    if (value) return value;
  }
  return "";
};

const participationLabel = (value) => {
  const status = normalized(value);
  if (["dilakukan", "ya", "yes", "true", "1", "berpartisipasi"].includes(status)) {
    return "Dilakukan";
  }
  if (["tidak dilakukan", "tidak", "no", "false", "0", "tidak berpartisipasi"].includes(status)) {
    return "Tidak Dilakukan";
  }
  return "-";
};

const weekLabel = (item) => {
  const explicit = text(item?.week_label) || text(item?.week_number) || text(item?.minggu_ke);
  if (explicit) return explicit.replace(/^minggu\s*/i, "");
  const rawWeek = text(item?.week);
  if (rawWeek && !/^\d{4}-\d{2}-\d{2}$/.test(rawWeek)) {
    return rawWeek.replace(/^minggu\s*/i, "");
  }
  return `${shortDate(item?.week_start)} – ${shortDate(item?.week_end)}`;
};

function PageHeader({ profile, item, pageNumber }) {
  const data = school(profile);
  return (
    <header className="wsa-header">
      <div className="wsa-logo">
        {schoolLogo ? (
          <img src={schoolLogo} alt={`Logo ${data.nama_sekolah}`} />
        ) : (
          <div className="wsa-logo-fallback">SS</div>
        )}
      </div>
      <div className="wsa-header-copy">
        <div className="wsa-school">{data.nama_sekolah}</div>
        <div className="wsa-school-meta">
          {data.alamat} · Telp {data.telepon} · {data.email}
        </div>
        <h1>AKTIVITAS HARIAN</h1>
        <div className="wsa-subtitle">
          Minggu {weekLabel(item)} · Lembar {pageNumber} dari 2
        </div>
      </div>
    </header>
  );
}

function StudentIdentity({ item }) {
  return (
    <div className="wsa-identity">
      <div><span>Nama Anak Didik</span><b>{show(item?.nama_lengkap)}</b></div>
      <div><span>NIS</span><b>{show(item?.nomor_induk || item?.nis || item?.nisn)}</b></div>
      <div><span>Kelas</span><b>{show(item?.classroom_name)}</b></div>
      <div><span>Periode Minggu</span><b>{formatDate(item?.week_start)} s.d. {formatDate(item?.week_end)}</b></div>
    </div>
  );
}

function Participation({ value }) {
  return (
    <div className="wsa-participation">
      <b>{participationLabel(value)}</b>
    </div>
  );
}

function PlanCell({ value, status }) {
  return (
    <td>
      <div className="wsa-plan-value">{show(value)}</div>
      <Participation value={status} />
    </td>
  );
}

function DaysTable({ item, days }) {
  return (
    <table className="wsa-table">
      <thead>
        <tr>
          <th>Hari / Tanggal</th>
          <th>Tema</th>
          <th>Pilar Karakter</th>
          <th>Nilai Karakter</th>
          <th>Jurnal</th>
          <th>Aktivitas</th>
          <th>Pembiasaan</th>
        </tr>
      </thead>
      <tbody>
        {days.map((day) => (
          <tr key={day?.tanggal || day?.hari}>
            <td className="wsa-day"><b>{show(day?.hari)}</b><span>{shortDate(day?.tanggal)}</span></td>
            {day?.is_holiday ? (
              <td colSpan={6} className="wsa-holiday">Hari Libur</td>
            ) : (
              <>
                <td><div className="wsa-plan-value">{show(planField(day, item, "tema"))}</div></td>
                <td><div className="wsa-plan-value">{show(planField(day, item, "pilar_karakter"))}</div></td>
                <PlanCell value={planField(day, item, "nilai_karakter")} status={assessmentStatus(day, "nilai_karakter")} />
                <PlanCell value={journalValue(day, item)} status={assessmentStatus(day, "jurnal")} />
                <PlanCell value={planField(day, item, "aktivitas")} status={assessmentStatus(day, "aktivitas")} />
                <PlanCell value={planField(day, item, "pembiasaan")} status={assessmentStatus(day, "pembiasaan")} />
              </>
            )}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

const foodOptions = ["Habis", "Tersisa", "Tidak Makan"];
const feelingOptions = [["Senang", "😊"], ["Sedih", "😟"], ["Lelah", "😐"], ["Lainnya", ""]];

function CheckCell({ active, note = "" }) {
  return (
    <td className="wsa-check-cell">
      <span className={`wsa-check-box ${active ? "wsa-check-box-active" : ""}`}>
        {active ? "✓" : ""}
      </span>
      {note ? <span className="wsa-check-note">{note}</span> : null}
    </td>
  );
}

function ReflectionRow({ day }) {
  const meal = normalized(day?.log?.makanan);
  const feeling = normalized(day?.log?.perasaan);
  const rawFeeling = text(day?.log?.perasaan);
  const customFeeling = rawFeeling && !["senang", "sedih", "lelah"].includes(feeling)
    ? rawFeeling
    : "";

  return (
    <tr>
      <td className="wsa-ref-day"><b>{show(day?.hari)}</b><span>{shortDate(day?.tanggal)}</span></td>
      {day?.is_holiday ? (
        <td colSpan={9} className="wsa-holiday">Hari Libur</td>
      ) : (
        <>
          {foodOptions.map((option) => (
            <CheckCell
              key={`food-${option}`}
              active={meal === normalized(option) || (option === "Tidak Makan" && meal === "tidak")}
            />
          ))}
          {feelingOptions.map(([label]) => (
            <CheckCell
              key={`feeling-${label}`}
              active={label === "Lainnya" ? Boolean(customFeeling) : feeling === normalized(label)}
              note={label === "Lainnya" && customFeeling ? customFeeling : ""}
            />
          ))}
          <td className="wsa-ref-text">{show(day?.log?.barang_bawaan)}</td>
          <td className="wsa-ref-text">{show(day?.log?.catatan_guru || day?.communication_teacher_note)}</td>
        </>
      )}
    </tr>
  );
}

function ReflectionTable({ days }) {
  return (
    <table className="wsa-ref-table">
      <thead>
        <tr>
          <th rowSpan={2}>Hari / Tanggal</th>
          <th colSpan={3}>Makananku</th>
          <th colSpan={4}>Perasaanku Hari Ini</th>
          <th rowSpan={2}>Barang yang dibawa besok</th>
          <th rowSpan={2}>Catatan Guru</th>
        </tr>
        <tr className="wsa-ref-options">
          <th>Habis</th>
          <th>Tersisa</th>
          <th>Tidak Makan</th>
          <th>😊<br />Senang</th>
          <th>😟<br />Sedih</th>
          <th>😐<br />Lelah</th>
          <th>Lainnya</th>
        </tr>
      </thead>
      <tbody>
        {days.map((day) => <ReflectionRow key={`reflection-${day?.tanggal || day?.hari}`} day={day} />)}
      </tbody>
    </table>
  );
}

function SignatureArea({ profile, homeroomTeacher, headmaster, printedAt }) {
  return (
    <div className="wsa-signatures">
      <div className="wsa-document-label">
        <b>{school(profile).nama_sekolah}</b>
        <span>Dokumen aktivitas mingguan anak didik</span>
      </div>
      <div className="wsa-signature">
        <div>Mengetahui,</div><div>Kepala Sekolah</div><div className="wsa-sign-space" />
        <b>{show(headmaster?.nama_lengkap)}</b><span>NIP. {show(headmaster?.nip)}</span>
      </div>
      <div className="wsa-signature">
        <div>Bogor, {formatDate(printedAt)}</div><div>Guru Kelas</div><div className="wsa-sign-space" />
        <b>{show(homeroomTeacher?.nama_lengkap)}</b><span>NIP. {show(homeroomTeacher?.nip)}</span>
      </div>
    </div>
  );
}

function Footer({ profile, item, pageNumber }) {
  return (
    <div className="wsa-footer">
      <span>{school(profile).nama_sekolah}</span>
      <span>Aktivitas Mingguan · {show(item?.nama_lengkap)} · Minggu {weekLabel(item)} · {pageNumber}/2</span>
    </div>
  );
}

function PlanPage({ item, profile }) {
  const days = Array.isArray(item?.days) ? item.days : [];
  return (
    <section className="wsa-page">
      <PageHeader profile={profile} item={item} pageNumber={1} />
      <StudentIdentity item={item} />
      <DaysTable item={item} days={days.slice(0, 5)} />
      <Footer profile={profile} item={item} pageNumber={1} />
    </section>
  );
}

function ReflectionPage({ item, profile, homeroomTeacher, headmaster, printedAt }) {
  const days = Array.isArray(item?.days) ? item.days : [];
  return (
    <section className="wsa-page">
      <PageHeader profile={profile} item={item} pageNumber={2} />
      <div className="wsa-ref-title">
        <b>{show(item?.nama_lengkap)}</b>
        <span>{show(item?.classroom_name)} · {formatDate(item?.week_start)} s.d. {formatDate(item?.week_end)}</span>
      </div>
      <ReflectionTable days={days.slice(0, 5)} />
      <SignatureArea
        profile={profile}
        homeroomTeacher={homeroomTeacher}
        headmaster={headmaster}
        printedAt={printedAt}
      />
      <Footer profile={profile} item={item} pageNumber={2} />
    </section>
  );
}

export function WeeklyStudentActivityPrintTemplate({
  items = [],
  profile,
  homeroomTeachers = {},
  headmaster = null,
  printedAt = new Date(),
}) {
  return (
    <div className="wsa-document">
      <style>{`
        @page { size: A4 landscape; margin: 7mm; }
        .wsa-document { color:#111827; font-family:Arial,Helvetica,sans-serif; font-size:8.4pt; line-height:1.3; }
        .wsa-page { box-sizing:border-box; min-height:196mm; position:relative; padding-bottom:8mm; page-break-after:always; break-after:page; page-break-inside:avoid; }
        .wsa-page:last-child { page-break-after:auto; break-after:auto; }
        .wsa-header { display:flex; align-items:center; gap:8px; border-bottom:1.5px solid #111827; padding-bottom:4px; }
        .wsa-logo { width:40px; height:40px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }
        .wsa-logo img { max-width:100%; max-height:100%; object-fit:contain; }
        .wsa-logo-fallback { width:35px; height:35px; border:1.2px solid #111827; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12pt; font-weight:700; }
        .wsa-header-copy { flex:1; text-align:center; }
        .wsa-school { font-size:12pt; font-weight:700; }
        .wsa-school-meta { margin-top:1px; font-size:7.1pt; color:#6b7280; }
        .wsa-header h1 { margin:3px 0 0; font-size:13pt; letter-spacing:.04em; }
        .wsa-subtitle { margin-top:1px; font-size:7.6pt; color:#4b5563; font-weight:600; }
        .wsa-identity { display:grid; grid-template-columns:1.5fr 1.1fr .8fr 1.5fr; border:1px solid #9ca3af; margin-top:5px; }
        .wsa-identity>div { padding:3px 6px; border-right:1px solid #d1d5db; }
        .wsa-identity>div:last-child { border-right:0; }
        .wsa-identity span { display:block; font-size:6.4pt; color:#6b7280; text-transform:uppercase; }
        .wsa-identity b { display:block; margin-top:1px; font-size:8pt; }
        .wsa-table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:6px; }
        .wsa-table th,.wsa-table td { border:1px solid #111827; vertical-align:top; overflow-wrap:anywhere; }
        .wsa-table th { background:#f3f4f6; padding:4px 3px; text-align:center; font-size:7.2pt; text-transform:uppercase; }
        .wsa-table td { padding:4px; font-size:7.1pt; height:25mm; }
        .wsa-table th:first-child,.wsa-table td:first-child { width:10%; }
        .wsa-table th:nth-child(2),.wsa-table td:nth-child(2) { width:10%; }
        .wsa-table th:nth-child(3),.wsa-table td:nth-child(3) { width:12%; }
        .wsa-table th:nth-child(4),.wsa-table td:nth-child(4) { width:15%; }
        .wsa-table th:nth-child(5),.wsa-table td:nth-child(5) { width:14%; }
        .wsa-table th:nth-child(6),.wsa-table td:nth-child(6) { width:19%; }
        .wsa-table th:nth-child(7),.wsa-table td:nth-child(7) { width:20%; }
        .wsa-day,.wsa-ref-day { text-align:center; vertical-align:middle!important; }
        .wsa-day b,.wsa-ref-day b { display:block; font-size:8pt; }
        .wsa-day span,.wsa-ref-day span { display:block; margin-top:2px; color:#6b7280; font-size:6.4pt; }
        .wsa-plan-value { min-height:8mm; font-weight:600; white-space:pre-wrap; }
        .wsa-participation { border-top:1px dashed #9ca3af; margin-top:3px; padding-top:2px; }
        .wsa-participation span { display:block; font-size:4.8pt; color:#6b7280; text-transform:uppercase; letter-spacing:.02em; }
        .wsa-participation b { display:block; font-size:6.8pt; }
        .wsa-holiday { text-align:center; vertical-align:middle!important; font-weight:700; color:#92400e; background:#fffbeb; }
        .wsa-ref-title { display:flex; justify-content:space-between; align-items:center; border:1px solid #9ca3af; margin-top:5px; padding:4px 7px; }
        .wsa-ref-title b { font-size:8.4pt; }
        .wsa-ref-title span { color:#6b7280; font-size:7pt; }
        .wsa-ref-table { width:100%; border-collapse:collapse; table-layout:fixed; margin-top:6px; }
        .wsa-ref-table th,.wsa-ref-table td { border:1px solid #111827; vertical-align:top; }
        .wsa-ref-table th { background:#f3f4f6; padding:4px 3px; text-align:center; font-size:7pt; text-transform:uppercase; }
        .wsa-ref-table td { padding:4px; height:20mm; font-size:6.8pt; }
        .wsa-ref-table th[rowspan="2"] { vertical-align:middle; }
        .wsa-ref-options th { font-size:6.2pt; font-weight:600; text-transform:none; padding:3px 2px; }
        .wsa-ref-table th:first-child,.wsa-ref-table td:first-child { width:10%; }
        .wsa-check-cell { width:6.5%; text-align:center; vertical-align:middle!important; padding:3px!important; }
        .wsa-ref-table th:nth-last-child(2),.wsa-ref-table td:nth-last-child(2) { width:17%; }
        .wsa-ref-table th:last-child,.wsa-ref-table td:last-child { width:21%; }
        .wsa-check-box { width:11px; height:11px; border:1.2px solid #111827; display:inline-flex; align-items:center; justify-content:center; font-size:8px; line-height:1; font-weight:700; }
        .wsa-check-box-active { background:#f3f4f6; }
        .wsa-check-note { display:block; margin-top:2px; font-size:5.8pt; line-height:1.15; overflow-wrap:anywhere; }
        .wsa-ref-text { white-space:pre-wrap; overflow-wrap:anywhere; }
        .wsa-signatures { display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px; margin-top:9px; align-items:end; }
        .wsa-document-label { border:1px solid #d1d5db; padding:6px 8px; display:flex; flex-direction:column; gap:2px; color:#4b5563; }
        .wsa-signature { text-align:center; font-size:7pt; }
        .wsa-sign-space { height:17mm; }
        .wsa-signature b { display:block; text-decoration:underline; font-size:7.5pt; }
        .wsa-signature span { display:block; margin-top:1px; color:#6b7280; }
        .wsa-footer { position:absolute; bottom:0; left:0; right:0; border-top:1px solid #d1d5db; padding-top:2px; display:flex; justify-content:space-between; color:#6b7280; font-size:6.2pt; }
        @media screen { .wsa-page { margin:0 auto 20px; background:#fff; } }
      `}</style>

      {items.flatMap((item) => {
        const teacher = homeroomTeachers[String(item?.classroom_id)] || null;
        return [
          <PlanPage key={`${item?.id || item?.nisn || item?.nama_lengkap}-1`} item={item} profile={profile} />,
          <ReflectionPage
            key={`${item?.id || item?.nisn || item?.nama_lengkap}-2`}
            item={item}
            profile={profile}
            homeroomTeacher={teacher}
            headmaster={headmaster}
            printedAt={printedAt}
          />,
        ];
      })}
    </div>
  );
}

export default WeeklyStudentActivityPrintTemplate;
