const text = (value) =>
  String(value ?? "").trim();

const show = (value) =>
  text(value) || "-";

const formatPrintDate = (
  value
) => {
  const date =
    value instanceof Date
      ? value
      : new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "-";
  }

  return new Intl.DateTimeFormat(
    "id-ID",
    {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }
  ).format(date);
};

const scoreMapFrom = (
  report,
  fallbackData,
  period
) => {
  if (
    Array.isArray(
      report?.scores
    )
  ) {
    return new Map(
      report.scores.map(
        (item) => [
          String(
            item.indicator_id
          ),
          text(item.scale),
        ]
      )
    );
  }

  const semesterKey =
    period?.semester_key ||
    (Number(
      period?.semester
    ) === 2
      ? "sem2"
      : "sem1");

  const values =
    fallbackData?.[
      semesterKey
    ]?.nilai || {};

  return new Map(
    Object.entries(
      values
    ).map(
      ([key, value]) => [
        key,
        text(value),
      ]
    )
  );
};

const groupIndicators = (
  indicators
) => {
  const aspects =
    new Map();

  indicators.forEach(
    (indicator) => {
      const aspect =
        text(
          indicator.aspek
        ) || "Lainnya";

      const rawSub =
        text(
          indicator.sub_aspek
        );

      const subAspect =
        rawSub &&
        rawSub !== "-"
          ? rawSub
          : "Tanpa Subaspek";

      if (
        !aspects.has(
          aspect
        )
      ) {
        aspects.set(
          aspect,
          new Map()
        );
      }

      const subMap =
        aspects.get(
          aspect
        );

      if (
        !subMap.has(
          subAspect
        )
      ) {
        subMap.set(
          subAspect,
          []
        );
      }

      subMap
        .get(subAspect)
        .push(indicator);
    }
  );

  return Array.from(
    aspects.entries()
  ).map(
    ([aspect, subMap]) => ({
      aspect,
      subAspects:
        Array.from(
          subMap.entries()
        ).map(
          ([
            subAspect,
            items,
          ]) => ({
            subAspect,
            items,
          })
        ),
    })
  );
};

const currentSemesterData = (
  data,
  period
) => {
  const key =
    period?.semester_key ||
    (Number(
      period?.semester
    ) === 2
      ? "sem2"
      : "sem1");

  return (
    data?.[key] || {
      catatan: "",
      komentar_ortu: "",
      fisik: {
        bb: "",
        tb: "",
      },
      absen: {
        s: 0,
        i: 0,
        a: 0,
      },
    }
  );
};

const getStudentName = (
  student
) =>
  text(
    student?.peserta_didik
      ?.nama_lengkap ||
      student?.nama_lengkap
  );

const getStudentNumber = (
  student
) =>
  text(
    student?.peserta_didik
      ?.nomor_induk ||
      student?.nomor_induk ||
      student?.nisn
  );

const getStudentGender = (
  student
) =>
  text(
    student?.peserta_didik
      ?.jenis_kelamin ||
      student?.jenis_kelamin
  );

const scoreSummary = (
  scoreMap,
  indicators
) => {
  const scales = [
    {
      key: "BB",
      label:
        "Belum Berkembang",
    },
    {
      key: "MB",
      label:
        "Mulai Berkembang",
    },
    {
      key: "BSH",
      label:
        "Berkembang Sesuai Harapan",
    },
    {
      key: "BSB",
      label:
        "Berkembang Sangat Baik",
    },
  ];

  const total =
    indicators.length;

  return scales.map(
    (scale) => {
      const count =
        indicators.filter(
          (indicator) =>
            scoreMap.get(
              String(
                indicator.id
              )
            ) === scale.key
        ).length;

      const percentage =
        total > 0
          ? Math.round(
              (count /
                total) *
                100
            )
          : 0;

      return {
        ...scale,
        count,
        total,
        percentage,
      };
    }
  );
};

const automaticDescription = (summary) => {
  const total = summary[0]?.total || 0;

  if (total === 0) {
    return "Belum tersedia data penilaian yang cukup untuk menyusun kesimpulan perkembangan.";
  }

  const priority = {
    BSB: 4,
    BSH: 3,
    MB: 2,
    BB: 1,
  };

  const dominant = [...summary].sort(
    (a, b) =>
      b.count - a.count ||
      priority[b.key] - priority[a.key]
  )[0];

  if (!dominant || dominant.count === 0) {
    return "Belum tersedia data penilaian yang cukup untuk menyusun kesimpulan perkembangan.";
  }

  if (dominant.key === "BSB") {
    return `Anak didik menunjukkan perkembangan yang sangat baik. Sebanyak ${dominant.count} dari ${dominant.total} indikator (${dominant.percentage}%) berada pada kategori Berkembang Sangat Baik, menunjukkan kemampuan yang semakin matang dan konsisten dalam kegiatan pembelajaran.`;
  }

  if (dominant.key === "BSH") {
    return `Anak didik menunjukkan perkembangan yang positif dan sesuai tahapan usianya. Sebanyak ${dominant.count} dari ${dominant.total} indikator (${dominant.percentage}%) berada pada kategori Berkembang Sesuai Harapan.`;
  }

  if (dominant.key === "MB") {
    return `Anak didik mulai menunjukkan perkembangan pada berbagai kemampuan. Sebanyak ${dominant.count} dari ${dominant.total} indikator (${dominant.percentage}%) berada pada kategori Mulai Berkembang sehingga stimulasi dan pendampingan yang konsisten perlu terus diberikan.`;
  }

  return `Anak didik masih memerlukan stimulasi dan pendampingan lebih lanjut. Sebanyak ${dominant.count} dari ${dominant.total} indikator (${dominant.percentage}%) berada pada kategori Belum Berkembang dan perlu menjadi perhatian dalam kegiatan pembelajaran berikutnya.`;
};

export function RaporPrintTemplate({
  student,
  data,
  report,
  indicators = [],
  curriculum,
  classroom,
  period,
  headmaster,
  homeroomTeacher,
  printedAt,
  schoolProfile,
}) {
  const scales = [
    "BB",
    "MB",
    "BSH",
    "BSB",
  ];

  const grouped =
    groupIndicators(
      indicators
    );

  const scoreMap =
    scoreMapFrom(
      report,
      data,
      period
    );

  const summary =
    scoreSummary(
      scoreMap,
      indicators
    );

  const semesterData =
    currentSemesterData(
      data,
      period
    );

  const physical = {
    berat_badan:
      report?.fisik
        ?.berat_badan ??
      semesterData?.fisik
        ?.bb ??
      "",
    tinggi_badan:
      report?.fisik
        ?.tinggi_badan ??
      semesterData?.fisik
        ?.tb ??
      "",
  };

  const attendance = {
    sakit:
      report?.absensi
        ?.sakit ??
      semesterData?.absen
        ?.s ??
      0,
    izin:
      report?.absensi
        ?.izin ??
      semesterData?.absen
        ?.i ??
      0,
    alpa:
      report?.absensi
        ?.alpa ??
      semesterData?.absen
        ?.a ??
      0,
  };

  const catatan =
    text(
      report?.catatan
    ) ||
    text(
      semesterData
        ?.catatan
    );

  const description =
    automaticDescription(
      summary
    );

  const schoolName =
    text(
      schoolProfile
        ?.nama_sekolah
    );

  const schoolAddress =
    text(
      schoolProfile
        ?.alamat
    );

  const studentName =
    getStudentName(
      student
    );

  const studentNumber =
    getStudentNumber(
      student
    );

  const studentGender =
    getStudentGender(
      student
    );

  const classroomName =
    text(
      classroom
        ?.nama_kelas
    );

  const curriculumName =
    text(
      curriculum
        ?.nama_kurikulum
    );

  const semesterLabel =
    text(
      period
        ?.semester_label
    );

  const academicYear =
    text(
      period
        ?.tahun_ajaran
    );

  const printDate =
    formatPrintDate(
      printedAt ||
        new Date()
    );

  return (
    <div className="rapor-print">
      <style>{`
        @page {
          size: A4 portrait;
          margin: 8mm 9mm 13mm 9mm;

          @bottom-right {
            content: "Halaman " counter(page) " dari " counter(pages);
            font-family: Arial, Helvetica, sans-serif;
            font-size: 7pt;
            color: #6b7280;
          }
        }

        .rapor-print {
          width: 100%;
          background: #fff;
          color: #111827;
          font-family: Arial, Helvetica, sans-serif;
          font-size: 8.6pt;
          line-height: 1.25;
          box-sizing: border-box;
        }

        .rapor-print * {
          box-sizing: border-box;
        }

        .rp-header {
          text-align: center;
          border-bottom: 1.8px solid #111827;
          padding-bottom: 6px;
          margin-bottom: 7px;
        }

        .rp-title {
          margin: 0;
          font-size: 14pt;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .25px;
        }

        .rp-curriculum {
          margin: 2px 0 0;
          font-size: 8.5pt;
          font-weight: 600;
        }

        .rp-info {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 7px;
        }

        .rp-info td {
          padding: 1.5px 3px;
          vertical-align: top;
        }

        .rp-info-label {
          width: 86px;
          font-weight: 600;
        }

        .rp-info-separator {
          width: 8px;
          text-align: center;
        }

        .rp-section {
          margin-top: 11px;
        }

        .rp-section-title {
          margin: 0 0 4px;
          padding: 4px 6px;
          border: 1px solid #374151;
          background: #f3f4f6;
          font-size: 8.8pt;
          font-weight: 700;
          text-transform: uppercase;
        }

        .rp-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rp-table th,
        .rp-table td {
          border: 1px solid #4b5563;
          padding: 2.6px 3.5px;
          vertical-align: top;
        }

        .rp-table th {
          background: #f9fafb;
          font-size: 7.8pt;
          text-align: center;
          font-weight: 700;
        }

        .rp-aspect-row td {
          background: #e5e7eb;
          font-weight: 700;
          padding-top: 3px;
          padding-bottom: 3px;
        }

        .rp-sub-row td {
          background: #f9fafb;
          font-weight: 600;
          font-size: 7.8pt;
          padding-top: 2.5px;
          padding-bottom: 2.5px;
        }

        .rp-no {
          width: 4%;
          text-align: center;
        }

        .rp-indicator {
          width: 76%;
        }

        .rp-scale {
          width: 5%;
          text-align: center;
          vertical-align: middle !important;
          font-weight: 700;
        }

        .rp-check {
          font-size: 10pt;
          line-height: 1;
        }

        .rp-legend {
          margin-top: 3px;
          font-size: 7.2pt;
          line-height: 1.2;
        }

        .rp-summary-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rp-summary-table th,
        .rp-summary-table td {
          border: 1px solid #4b5563;
          padding: 3px 5px;
        }

        .rp-summary-table th {
          background: #f9fafb;
          text-align: left;
          width: 58%;
        }

        .rp-summary-code {
          width: 11%;
          text-align: center;
          font-weight: 700;
        }

        .rp-summary-value {
          width: 15%;
          text-align: center;
        }

        .rp-summary-percent {
          width: 16%;
          text-align: center;
        }

        .rp-description {
          margin-top: 4px;
          border: 1px solid #4b5563;
          padding: 5px 6px;
        }

        .rp-description-title {
          display: block;
          font-weight: 700;
          margin-bottom: 2px;
        }

        .rp-text-box {
          min-height: 47px;
          border: 1px solid #4b5563;
          padding: 5px 6px;
          white-space: pre-wrap;
        }

        .rp-data-table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }

        .rp-data-table th,
        .rp-data-table td {
          border: 1px solid #4b5563;
          padding: 3px 5px;
        }

        .rp-data-table th {
          background: #f9fafb;
          font-weight: 600;
          text-align: left;
        }

        .rp-data-table .rp-half-label {
          width: 22%;
        }

        .rp-data-table .rp-half-value {
          width: 28%;
        }

        .rp-signatures {
          margin-top: 18px;
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 24px;
          text-align: center;
          break-inside: avoid;
          page-break-inside: avoid;
        }

        .rp-signature-heading {
          min-height: 30px;
        }

        .rp-signature-space {
          height: 48px;
        }

        .rp-signature-name {
          font-weight: 700;
          text-decoration: underline;
        }

        .rp-signature-nip {
          margin-top: 2px;
          font-size: 8pt;
        }

        .rp-parent-name-line {
          display: inline-block;
          width: 150px;
          border-bottom: 1px solid #111827;
          min-height: 14px;
        }

        .rp-parent-label {
          margin-top: 3px;
          font-size: 7.6pt;
          color: #4b5563;
        }

        .rp-empty {
          border: 1px solid #9ca3af;
          padding: 8px;
          text-align: center;
          color: #6b7280;
        }

        @media print {
          .rapor-print {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .rp-section-title,
          .rp-aspect-row,
          .rp-sub-row,
          .rp-table tr,
          .rp-signatures {
            break-inside: avoid;
            page-break-inside: avoid;
          }
        }
      `}</style>

      <header className="rp-header">
        <h1 className="rp-title">
          Laporan Perkembangan Peserta Didik
        </h1>
        <div style={{ marginTop: "3px", fontSize: "9.5pt", fontWeight: 700 }}>
          {show(
            schoolName
          )}
        </div>
        <div style={{ marginTop: "1px", fontSize: "8pt" }}>
          {show(
            schoolAddress
          )}
        </div>
        <p className="rp-curriculum">
          {show(
            curriculumName
          )}
        </p>
      </header>

      <table className="rp-info">
        <tbody>
          <tr>
            <td className="rp-info-label">
              Nama Siswa
            </td>
            <td className="rp-info-separator">
              :
            </td>
            <td>
              {show(
                studentName
              )}
            </td>
            <td className="rp-info-label">
              Kelas
            </td>
            <td className="rp-info-separator">
              :
            </td>
            <td>
              {show(
                classroomName
              )}
            </td>
          </tr>

          <tr>
            <td className="rp-info-label">
              Nomor Induk
            </td>
            <td className="rp-info-separator">
              :
            </td>
            <td>
              {show(
                studentNumber
              )}
            </td>
            <td className="rp-info-label">
              Semester
            </td>
            <td className="rp-info-separator">
              :
            </td>
            <td>
              {show(
                semesterLabel
              )}
            </td>
          </tr>

          <tr>
            <td className="rp-info-label">
              Jenis Kelamin
            </td>
            <td className="rp-info-separator">
              :
            </td>
            <td>
              {show(
                studentGender
              )}
            </td>
            <td className="rp-info-label">
              Tahun Ajaran
            </td>
            <td className="rp-info-separator">
              :
            </td>
            <td>
              {show(
                academicYear
              )}
            </td>
          </tr>
        </tbody>
      </table>

      <section className="rp-section">
        <h2 className="rp-section-title">
          A. Capaian Perkembangan
        </h2>

        {grouped.length >
        0 ? (
          <table className="rp-table">
            <colgroup>
              <col
                style={{
                  width:
                    "4%",
                }}
              />
              <col
                style={{
                  width:
                    "76%",
                }}
              />
              <col
                style={{
                  width:
                    "5%",
                }}
              />
              <col
                style={{
                  width:
                    "5%",
                }}
              />
              <col
                style={{
                  width:
                    "5%",
                }}
              />
              <col
                style={{
                  width:
                    "5%",
                }}
              />
            </colgroup>

            <thead>
              <tr>
                <th>
                  No
                </th>
                <th>
                  Indikator
                </th>
                {scales.map(
                  (scale) => (
                    <th
                      key={
                        scale
                      }
                    >
                      {
                        scale
                      }
                    </th>
                  )
                )}
              </tr>
            </thead>

            <tbody>
              {grouped.map(
                (
                  aspect,
                  aspectIndex
                ) => (
                  <RaporAspectRows
                    key={
                      aspect.aspect
                    }
                    aspect={
                      aspect
                    }
                    aspectIndex={
                      aspectIndex
                    }
                    scoreMap={
                      scoreMap
                    }
                    scales={
                      scales
                    }
                  />
                )
              )}
            </tbody>
          </table>
        ) : (
          <div className="rp-empty">
            Belum ada indikator pada kurikulum ini.
          </div>
        )}

        <div className="rp-legend">
          <strong>BB</strong> = Belum Berkembang
          &nbsp; • &nbsp;
          <strong>MB</strong> = Mulai Berkembang
          &nbsp; • &nbsp;
          <strong>BSH</strong> = Berkembang Sesuai Harapan
          &nbsp; • &nbsp;
          <strong>BSB</strong> = Berkembang Sangat Baik
        </div>
      </section>

      <section className="rp-section">
        <h2 className="rp-section-title">
          B. Kesimpulan Perkembangan
        </h2>

        <table className="rp-summary-table">
          <thead>
            <tr>
              <th>
                Tingkat Perkembangan
              </th>
              <th className="rp-summary-code">
                Skala
              </th>
              <th className="rp-summary-value">
                Capaian
              </th>
              <th className="rp-summary-percent">
                Persentase
              </th>
            </tr>
          </thead>

          <tbody>
            {summary.map(
              (item) => (
                <tr
                  key={
                    item.key
                  }
                >
                  <td>
                    {
                      item.label
                    }
                  </td>
                  <td className="rp-summary-code">
                    {
                      item.key
                    }
                  </td>
                  <td className="rp-summary-value">
                    {item.count}/
                    {item.total}
                  </td>
                  <td className="rp-summary-percent">
                    {
                      item.percentage
                    }
                    %
                  </td>
                </tr>
              )
            )}
          </tbody>
        </table>

        <div className="rp-description">
          <span className="rp-description-title">
            Deskripsi Umum
          </span>
          {description}
        </div>
      </section>

      <section className="rp-section">
        <h2 className="rp-section-title">
          C. Catatan Guru
        </h2>

        <div className="rp-text-box">
          {show(
            catatan
          )}
        </div>
      </section>

      <section className="rp-section">
        <h2 className="rp-section-title">
          D. Data Fisik dan Kehadiran
        </h2>

        <table className="rp-data-table">
          <tbody>
            <tr>
              <th className="rp-half-label">
                Berat Badan
              </th>
              <td className="rp-half-value">
                {physical.berat_badan !==
                  null &&
                physical.berat_badan !==
                  ""
                  ? `${physical.berat_badan} kg`
                  : "-"}
              </td>
              <th className="rp-half-label">
                Sakit
              </th>
              <td className="rp-half-value">
                {attendance.sakit} hari
              </td>
            </tr>

            <tr>
              <th>
                Tinggi Badan
              </th>
              <td>
                {physical.tinggi_badan !==
                  null &&
                physical.tinggi_badan !==
                  ""
                  ? `${physical.tinggi_badan} cm`
                  : "-"}
              </td>
              <th>
                Izin
              </th>
              <td>
                {attendance.izin} hari
              </td>
            </tr>

            <tr>
              <th>
                Alpa
              </th>
              <td>
                {attendance.alpa} hari
              </td>
              <td colSpan="2" />
            </tr>
          </tbody>
        </table>
      </section>

      <section className="rp-section">
        <h2 className="rp-section-title">
          E. Tanggapan Orang Tua / Wali
        </h2>

        <div
          className="rp-text-box"
          style={{
            minHeight:
              "62px",
          }}
        >
          &nbsp;
        </div>
      </section>

      <div className="rp-signatures">
        <div>
          <div className="rp-signature-heading">
            Mengetahui,
            <br />
            Kepala Sekolah
          </div>

          <div className="rp-signature-space" />

          <div className="rp-signature-name">
            {show(
              headmaster
                ?.nama_lengkap
            )}
          </div>

          <div className="rp-signature-nip">
            NIP.{" "}
            {show(
              headmaster?.nip
            )}
          </div>
        </div>

        <div>
          <div className="rp-signature-heading">
            Mengetahui,
            <br />
            Orang Tua / Wali
          </div>

          <div className="rp-signature-space" />

          <div className="rp-parent-name-line">
            &nbsp;
          </div>
          <div className="rp-parent-label">
            Nama Orang Tua / Wali
          </div>
        </div>

        <div>
          <div className="rp-signature-heading">
            {printDate}
            <br />
            Guru Kelas
          </div>

          <div className="rp-signature-space" />

          <div className="rp-signature-name">
            {show(
              homeroomTeacher
                ?.nama_lengkap
            )}
          </div>

          <div className="rp-signature-nip">
            NIP.{" "}
            {show(
              homeroomTeacher
                ?.nip
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function RaporAspectRows({
  aspect,
  aspectIndex,
  scoreMap,
  scales,
}) {
  let number = 0;

  return (
    <>
      <tr className="rp-aspect-row">
        <td colSpan="6">
          {aspectIndex + 1}.{" "}
          {aspect.aspect}
        </td>
      </tr>

      {aspect.subAspects.map(
        (
          sub,
          subIndex
        ) => (
          <RaporSubAspectRows
            key={`${aspect.aspect}-${sub.subAspect}`}
            sub={sub}
            aspectIndex={
              aspectIndex
            }
            subIndex={
              subIndex
            }
            scoreMap={
              scoreMap
            }
            scales={
              scales
            }
            nextNumber={() => {
              number += 1;
              return number;
            }}
          />
        )
      )}
    </>
  );
}

function RaporSubAspectRows({
  sub,
  aspectIndex,
  subIndex,
  scoreMap,
  scales,
  nextNumber,
}) {
  return (
    <>
      <tr className="rp-sub-row">
        <td colSpan="6">
          {aspectIndex + 1}.
          {subIndex + 1}{" "}
          {sub.subAspect}
        </td>
      </tr>

      {sub.items.map(
        (indicator) => {
          const selected =
            scoreMap.get(
              String(
                indicator.id
              )
            ) ||
            scoreMap.get(
              indicator.deskripsi
            ) ||
            "";

          return (
            <tr
              key={
                indicator.id
              }
            >
              <td className="rp-no">
                {nextNumber()}
              </td>

              <td className="rp-indicator">
                {show(
                  indicator.deskripsi
                )}
              </td>

              {scales.map(
                (scale) => (
                  <td
                    key={
                      scale
                    }
                    className="rp-scale"
                  >
                    {selected ===
                    scale ? (
                      <span className="rp-check">
                        ✓
                      </span>
                    ) : (
                      ""
                    )}
                  </td>
                )
              )}
            </tr>
          );
        }
      )}
    </>
  );
}

export default RaporPrintTemplate;
