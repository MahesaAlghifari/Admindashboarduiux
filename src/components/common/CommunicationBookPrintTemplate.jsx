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

const school = (profile) => ({
  nama_sekolah: text(profile?.nama_sekolah) || "SEKOLAH SS",
  alamat:
    text(profile?.alamat) ||
    text(profile?.alamat_jalan_2) ||
    "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  telepon: text(profile?.telepon) || "0811 - 9141 - 285",
  email: text(profile?.email) || "adm.sekolahss@gmail.com",
});

function Header({ profile, periodLabel }) {
  const s = school(profile);

  return (
    <header className="cb-print-header">
      <div className="cb-print-logo">
        {schoolLogo ? (
          <img src={schoolLogo} alt={`Logo ${s.nama_sekolah}`} />
        ) : (
          <div className="cb-print-logo-fallback">SS</div>
        )}
      </div>
      <div className="cb-print-header-copy">
        <div className="cb-print-school">{s.nama_sekolah}</div>
        <div className="cb-print-school-meta">
          {s.alamat} · Telp {s.telepon} · {s.email}
        </div>
        <h1>LAPORAN BUKU PENGHUBUNG</h1>
        <div className="cb-print-period">Per Siswa · {periodLabel}</div>
      </div>
    </header>
  );
}

function BabChoice({ value }) {
  const normalized = text(value).toLowerCase();
  const yes = ["ya", "true", "1"].includes(normalized);
  const no = normalized && !yes;

  return (
    <div className="cb-choice-wrap">
      <span className="cb-choice"><b>{yes ? "✓" : ""}</b> Ya</span>
      <span className="cb-choice"><b>{no ? "✓" : ""}</b> Tidak</span>
    </div>
  );
}

function WeekPage({
  item,
  book,
  profile,
  periodLabel,
  homeroomTeacher,
  printedAt,
}) {
  const firstDate = book.days[0]?.tanggal;
  const lastDate = book.days.at(-1)?.tanggal;

  return (
    <section className="cb-print-page">
      <Header profile={profile} periodLabel={periodLabel} />

      <div className="cb-print-identity">
        <div>
          <span>Nama Anak Didik</span>
          <b>{show(item.nama_lengkap)}</b>
        </div>
        <div>
          <span>NIS</span>
          <b>{show(item.nomor_induk || item.nis || item.nisn)}</b>
        </div>
        <div>
          <span>Kelas</span>
          <b>{show(item.classroom_name)}</b>
        </div>
        <div>
          <span>Minggu</span>
          <b>{show(book.week)}</b>
        </div>
        <div className="cb-print-period-cell">
          <span>Periode Minggu</span>
          <b>{formatDate(firstDate)} s.d. {formatDate(lastDate)}</b>
        </div>
      </div>

      <table className="cb-print-table">
        <thead>
          <tr>
            <th className="cb-day-col">Hari / Tanggal</th>
            <th className="cb-sleep-col">Jam Tidur</th>
            <th className="cb-bab-col">Anak BAB</th>
            <th className="cb-temp-col">Suhu Tubuh</th>
            <th className="cb-breakfast-col">Menu Sarapan</th>
            <th className="cb-note-col">Catatan Orang Tua</th>
            <th className="cb-note-col">Catatan Guru</th>
          </tr>
        </thead>
        <tbody>
          {book.days.map((day) => (
            <tr key={`${book.week}-${day.hari}`}>
              <td>
                <b>{day.hari}</b>
                <div className="cb-date">{formatShortDate(day.tanggal)}</div>
                {day.is_holiday && (
                  <div className="cb-holiday">{day.holiday_label || "Libur"}</div>
                )}
              </td>
              <td>{show(day.jam_tidur)}</td>
              <td><BabChoice value={day.anak_bab} /></td>
              <td className="cb-center">
                {text(day.suhu_tubuh) ? `${day.suhu_tubuh} °C` : "-"}
              </td>
              <td>{show(day.menu_sarapan)}</td>
              <td className="cb-note-cell">{show(day.catatan_ortu)}</td>
              <td className="cb-note-cell">{show(day.catatan_guru)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="cb-print-signatures">
        <div className="cb-signature">
          <div>Mengetahui,</div>
          <div>Orang Tua / Wali</div>
          <div className="cb-signature-space" />
          <div className="cb-signature-line">( ____________________ )</div>
        </div>
        <div className="cb-signature">
          <div>{formatDate(printedAt)}</div>
          <div>Wali Kelas</div>
          <div className="cb-signature-space" />
          <div className="cb-signature-name">{show(homeroomTeacher?.nama_lengkap)}</div>
          <div>NIP. {show(homeroomTeacher?.nip)}</div>
        </div>
      </div>

      <div className="cb-print-footer">
        <span>{school(profile).nama_sekolah}</span>
        <span>Buku Penghubung · {show(item.nama_lengkap)} · {show(book.week)}</span>
      </div>
    </section>
  );
}

export function CommunicationBookPrintTemplate({
  items = [],
  profile,
  periodLabel = "",
  homeroomTeachers = {},
  printedAt = new Date(),
}) {
  return (
    <div className="cb-print-document">
      <style>{`
        @page { size:A4 landscape; margin:6mm; }

        .cb-print-document { color:#111827; font-family:Arial,Helvetica,sans-serif; font-size:8.2pt; line-height:1.28; }

        .cb-print-page {
          box-sizing: border-box;
          width: 100%;
          page-break-after: always;
          break-after: page;
          page-break-inside: avoid;
          break-inside: avoid-page;
        }

        .cb-print-page:last-child {
          page-break-after: auto;
          break-after: auto;
        }

        .cb-print-header { display:flex; align-items:center; gap:8px; border-bottom:1.5px solid #111827; padding-bottom:4px; }

        .cb-print-logo { width:40px; height:40px; display:flex; align-items:center; justify-content:center; flex:0 0 auto; }

        .cb-print-logo img {
          max-width: 100%;
          max-height: 100%;
          object-fit: contain;
        }

        .cb-print-logo-fallback { width:35px; height:35px; border:1.2px solid #111827; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:12pt; font-weight:700; }

        .cb-print-header-copy {
          flex: 1;
          text-align: center;
        }

        .cb-print-school { font-size:12pt; font-weight:700; }

        .cb-print-school-meta { margin-top:1px; font-size:7pt; color:#6b7280; }

        .cb-print-header h1 { margin:3px 0 0; font-size:13pt; letter-spacing:.04em; }

        .cb-print-period { margin-top:1px; font-size:7.4pt; font-weight:600; color:#4b5563; }

        .cb-print-identity {
          display: grid;
          margin-top: 5px;
          grid-template-columns: 1.35fr 1fr .75fr .75fr 1.45fr;
          border: 1px solid #9ca3af;
        }

        .cb-print-identity > div {
          min-height: 30px;
          border-right: 1px solid #d1d5db;
          padding: 4px 6px;
          box-sizing: border-box;
        }

        .cb-print-identity > div:last-child {
          border-right: 0;
        }

        .cb-print-identity span {
          display: block;
          font-size: 7pt;
          text-transform: uppercase;
          color: #6b7280;
          letter-spacing: .03em;
        }

        .cb-print-identity b {
          display: block;
          margin-top: 2px;
          font-size: 9pt;
        }

        .cb-print-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
          margin-top: 6px;
        }

        .cb-print-table th,
        .cb-print-table td {
          border: 1px solid #9ca3af;
          padding: 5px 6px;
          vertical-align: top;
          overflow-wrap: anywhere;
        }

        .cb-print-table th {
          background: #f3f4f6;
          text-align: center;
          font-size: 8pt;
          text-transform: uppercase;
          letter-spacing: .02em;
        }

        .cb-print-table tbody tr {
          height: 18mm;
        }

        .cb-day-col { width: 10%; }
        .cb-sleep-col { width: 9%; }
        .cb-bab-col { width: 10%; }
        .cb-temp-col { width: 8%; }
        .cb-breakfast-col { width: 13%; }
        .cb-note-col { width: 25%; }

        .cb-date {
          margin-top: 2px;
          font-size: 7.5pt;
          color: #6b7280;
        }

        .cb-holiday {
          display: inline-block;
          margin-top: 4px;
          padding: 1px 5px;
          border: 1px solid #f59e0b;
          border-radius: 999px;
          font-size: 6.8pt;
          font-weight: 700;
          color: #92400e;
        }

        .cb-center { text-align: center; }

        .cb-note-cell {
          font-size: 8.5pt;
          line-height: 1.3;
        }

        .cb-choice-wrap {
          display: flex;
          flex-direction: column;
          gap: 3px;
          font-size: 8pt;
        }

        .cb-choice {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          white-space: nowrap;
        }

        .cb-choice b {
          display: inline-flex;
          width: 12px;
          height: 12px;
          align-items: center;
          justify-content: center;
          border: 1px solid #6b7280;
          font-size: 8pt;
          line-height: 1;
        }

        .cb-print-signatures {
          display: flex;
          justify-content: space-between;
          gap: 20mm;
          margin: 7px 10mm 0;
        }

        .cb-signature {
          width: 62mm;
          text-align: center;
          font-size: 8.5pt;
        }

        .cb-signature-space { height: 11mm; }
        .cb-signature-name { font-weight: 700; text-decoration: underline; }
        .cb-signature-line { font-weight: 600; }

        .cb-print-footer {
          margin-top: 5px;
          border-top: 1px solid #d1d5db;
          padding-top: 4px;
          display: flex;
          justify-content: space-between;
          gap: 12px;
          font-size: 7pt;
          color: #6b7280;
        }

        @media screen {
          .cb-print-page {
            background: white;
            margin: 0 auto 18px;
            padding: 7mm;
            max-width: 297mm;
            box-shadow: 0 8px 30px rgba(15, 23, 42, .12);
          }
        }

        @media print {
          .cb-print-page {
            margin: 0;
            padding: 0;
          }
        }
      `}</style>

      {items.flatMap((item) =>
        (item.books || []).map((book) => (
          <WeekPage
            key={`${item.id}-${book.week}`}
            item={item}
            book={book}
            profile={profile}
            periodLabel={periodLabel}
            homeroomTeacher={homeroomTeachers[String(item.classroom_id)] || null}
            printedAt={printedAt}
          />
        ))
      )}
    </div>
  );
}
