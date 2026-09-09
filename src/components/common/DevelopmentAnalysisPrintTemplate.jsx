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
const show = (value, suffix = "") =>
  value === null || value === undefined || value === "" ? "-" : `${value}${suffix}`;

const school = (profile) => ({
  nama_sekolah: text(profile?.nama_sekolah) || "SEKOLAH SS",
  alamat:
    text(profile?.alamat) ||
    text(profile?.alamat_jalan_2) ||
    "Jl. Megamendung IV Blok E1 No. 21, Bogor Timur",
  telepon: text(profile?.telepon) || "0811 - 9141 - 285",
  email: text(profile?.email) || "adm.sekolahss@gmail.com",
});

function Header({ profile, subtitle }) {
  const s = school(profile);
  return (
    <header className="dap-header">
      <div className="dap-logo">
        {schoolLogo ? <img src={schoolLogo} alt={`Logo ${s.nama_sekolah}`} /> : <b>SS</b>}
      </div>
      <div className="dap-head-copy">
        <div className="dap-school">{s.nama_sekolah}</div>
        <div className="dap-meta">{s.alamat} · {s.telepon} · {s.email}</div>
        <h1>ANALISA GRAFIK PERKEMBANGAN</h1>
        <div className="dap-subtitle">{subtitle}</div>
      </div>
    </header>
  );
}

function Metric({ label, value }) {
  return (
    <div className="dap-metric">
      <span>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Sparkline({ points, field, suffix }) {
  const values = points
    .map((point) => Number(point?.[field]))
    .filter((value) => Number.isFinite(value));
  if (values.length < 2) return <div className="dap-empty-chart">Data tren belum cukup</div>;

  const width = 720;
  const height = 150;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const coords = points
    .map((point, index) => {
      const value = Number(point?.[field]);
      if (!Number.isFinite(value)) return null;
      const x = 30 + (index * (width - 60)) / Math.max(1, points.length - 1);
      const y = height - 25 - ((value - min) / span) * (height - 50);
      return { x, y, value, label: point.label };
    })
    .filter(Boolean);

  return (
    <div className="dap-spark-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="dap-spark">
        <line x1="30" y1={height - 25} x2={width - 30} y2={height - 25} stroke="#cbd5e1" />
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          points={coords.map((point) => `${point.x},${point.y}`).join(" ")}
        />
        {coords.map((point, index) => (
          <g key={`${field}-${index}`}>
            <circle cx={point.x} cy={point.y} r="4" fill="currentColor" />
            <text x={point.x} y={point.y - 9} textAnchor="middle" fontSize="11">
              {point.value}{suffix}
            </text>
          </g>
        ))}
      </svg>
      <div className="dap-axis-labels">
        {points.map((point, index) => <span key={index}>{point.label}</span>)}
      </div>
    </div>
  );
}

function ClassReport({ analysis, profile, periodLabel, classroomLabel, printedAt }) {
  return (
    <section className="dap-page">
      <Header profile={profile} subtitle={`${periodLabel} · ${classroomLabel}`} />
      <div className="dap-metrics">
        <Metric label="Siswa" value={analysis.summary.total_students} />
        <Metric label="Punya Data" value={analysis.summary.students_with_data} />
        <Metric label="Rata-rata Tinggi" value={show(analysis.summary.latest_avg_height, " cm")} />
        <Metric label="Rata-rata Berat" value={show(analysis.summary.latest_avg_weight, " kg")} />
        <Metric label="Δ Tinggi Rata-rata" value={show(analysis.summary.avg_height_change, " cm")} />
        <Metric label="Δ Berat Rata-rata" value={show(analysis.summary.avg_weight_change, " kg")} />
      </div>

      <h2>Tren Rata-rata Tinggi Badan</h2>
      <Sparkline points={analysis.summary.trend} field="average_height" suffix=" cm" />
      <h2>Tren Rata-rata Berat Badan</h2>
      <Sparkline points={analysis.summary.trend} field="average_weight" suffix=" kg" />

      <h2>Distribusi Status Tersimpan</h2>
      <table className="dap-table dap-small-table">
        <thead><tr><th>Status</th><th>Jumlah</th></tr></thead>
        <tbody>
          {analysis.summary.status_distribution.map((item) => (
            <tr key={item.status}><td>{item.status}</td><td>{item.count}</td></tr>
          ))}
        </tbody>
      </table>

      <h2>Ringkasan Siswa</h2>
      <table className="dap-table">
        <thead>
          <tr><th>No</th><th>Nama</th><th>Kelas</th><th>Tinggi Terakhir</th><th>Berat Terakhir</th><th>Δ Tinggi</th><th>Δ Berat</th><th>Status</th></tr>
        </thead>
        <tbody>
          {analysis.students.map((student, index) => (
            <tr key={student.id}>
              <td>{index + 1}</td><td>{student.nama_lengkap}</td><td>{student.classroom_name || "-"}</td>
              <td>{show(student.latest?.tinggi_badan, " cm")}</td><td>{show(student.latest?.berat_badan, " kg")}</td>
              <td>{show(student.delta_tinggi, " cm")}</td><td>{show(student.delta_berat, " kg")}</td>
              <td>{student.latest?.status_gizi || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="dap-footer">Dicetak {printedAt.toLocaleString("id-ID")} · Status gizi mengikuti data yang tersimpan di modul Perkembangan.</footer>
    </section>
  );
}

function StudentReport({ student, profile, periodLabel, printedAt }) {
  const points = student.developments.map((item) => ({
    ...item,
    label: `${item.tahun_ajaran} S${item.semester}`,
  }));

  return (
    <section className="dap-page">
      <Header profile={profile} subtitle={`${student.nama_lengkap} · ${student.classroom_name || "-"} · ${periodLabel}`} />
      <div className="dap-metrics">
        <Metric label="NIS" value={student.nomor_induk || student.nis || student.nisn || "-"} />
        <Metric label="Pengukuran" value={student.developments.length} />
        <Metric label="Tinggi Terakhir" value={show(student.latest?.tinggi_badan, " cm")} />
        <Metric label="Berat Terakhir" value={show(student.latest?.berat_badan, " kg")} />
        <Metric label="Δ Tinggi" value={show(student.delta_tinggi, " cm")} />
        <Metric label="Δ Berat" value={show(student.delta_berat, " kg")} />
      </div>

      <h2>Tren Tinggi Badan</h2>
      <Sparkline points={points} field="tinggi_badan" suffix=" cm" />
      <h2>Tren Berat Badan</h2>
      <Sparkline points={points} field="berat_badan" suffix=" kg" />

      <h2>Riwayat Pengukuran</h2>
      <table className="dap-table">
        <thead><tr><th>Periode</th><th>Tinggi</th><th>Berat</th><th>BMI</th><th>Status Tersimpan</th></tr></thead>
        <tbody>
          {student.developments.map((item) => (
            <tr key={`${item.tahun_ajaran}-${item.semester}`}>
              <td>{item.tahun_ajaran} · Semester {item.semester === 1 ? "I" : "II"}</td>
              <td>{show(item.tinggi_badan, " cm")}</td><td>{show(item.berat_badan, " kg")}</td>
              <td>{show(item.bmi)}</td><td>{item.status_gizi || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <footer className="dap-footer">Dicetak {printedAt.toLocaleString("id-ID")} · Grafik bersifat visualisasi data tersimpan, bukan diagnosis medis.</footer>
    </section>
  );
}

export function DevelopmentAnalysisPrintTemplate({
  mode = "class",
  analysis,
  student = null,
  profile,
  periodLabel = "Semua Periode",
  classroomLabel = "Semua Kelas",
  printedAt = new Date(),
}) {
  return (
    <div className="dap-document">
      <style>{`
        @page { size: A4 landscape; margin: 8mm; }
        .dap-document { font-family: Arial, Helvetica, sans-serif; color: #111827; font-size: 8pt; }
        .dap-page { page-break-after: always; break-after: page; }
        .dap-page:last-child { page-break-after: auto; break-after: auto; }
        .dap-header { display:flex; align-items:center; gap:10px; border-bottom:2px solid #111827; padding-bottom:6px; }
        .dap-logo { width:48px; height:48px; display:flex; align-items:center; justify-content:center; }
        .dap-logo img { max-width:100%; max-height:100%; object-fit:contain; }
        .dap-head-copy { flex:1; text-align:center; padding-right:48px; }
        .dap-school { font-size:13pt; font-weight:700; }
        .dap-meta { font-size:6.8pt; color:#64748b; margin-top:2px; }
        .dap-head-copy h1 { margin:4px 0 0; font-size:12pt; }
        .dap-subtitle { margin-top:2px; font-size:7.5pt; color:#475569; font-weight:600; }
        .dap-metrics { display:grid; grid-template-columns:repeat(6,1fr); gap:5px; margin-top:7px; }
        .dap-metric { border:1px solid #cbd5e1; padding:5px 6px; min-height:34px; }
        .dap-metric span { display:block; font-size:6.3pt; color:#64748b; text-transform:uppercase; }
        .dap-metric b { display:block; margin-top:2px; font-size:9pt; }
        .dap-page h2 { font-size:8.5pt; margin:8px 0 4px; text-transform:uppercase; }
        .dap-spark-wrap { border:1px solid #cbd5e1; padding:4px 6px 3px; color:#334155; }
        .dap-spark { width:100%; height:105px; display:block; }
        .dap-axis-labels { display:flex; justify-content:space-between; gap:4px; font-size:6pt; color:#64748b; }
        .dap-axis-labels span { flex:1; text-align:center; }
        .dap-empty-chart { height:55px; display:flex; align-items:center; justify-content:center; border:1px dashed #cbd5e1; color:#94a3b8; }
        .dap-table { width:100%; border-collapse:collapse; table-layout:fixed; }
        .dap-table th,.dap-table td { border:1px solid #cbd5e1; padding:3px 4px; overflow-wrap:anywhere; }
        .dap-table th { background:#f1f5f9; font-size:6.6pt; text-transform:uppercase; }
        .dap-small-table { width:45%; }
        .dap-footer { margin-top:6px; padding-top:4px; border-top:1px solid #cbd5e1; color:#64748b; font-size:6.4pt; }
      `}</style>
      {mode === "student" && student ? (
        <StudentReport student={student} profile={profile} periodLabel={periodLabel} printedAt={printedAt} />
      ) : (
        <ClassReport analysis={analysis} profile={profile} periodLabel={periodLabel} classroomLabel={classroomLabel} printedAt={printedAt} />
      )}
    </div>
  );
}
