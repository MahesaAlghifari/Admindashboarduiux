import React from "react";

// --- IMPORT DATA DUMMY DARI FILE GLOBAL ---
import { 
  DAYS_PRINT, 
  METRICS_PRINT, 
  DUMMY_PRINT_STUDENT, 
  DUMMY_PRINT_DATA 
} from "../../../data/dummyLaporan";

export default function PrintBukuPenghubung() {
  
  // Generate waktu cetak aktual (otomatis)
  const printDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZoneName: 'short'
  }).format(new Date());

  return (
    <>
      {/* =======================================================
          PRINT STYLE
      ======================================================= */}
      <style>
        {`
          @page {
            size: A4 portrait;
            margin: 0;
          }

          @media print {
            html,
            body {
              margin: 0;
              padding: 0;
              background: white;
            }

            body * {
              visibility: hidden;
            }

            #print-area,
            #print-area * {
              visibility: visible;
            }

            #print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 210mm;
              min-height: 297mm;
              margin: 0;
              padding: 0;
              background: white;
            }

            .no-print {
              display: none !important;
            }

            table {
              page-break-inside: auto;
            }

            tr {
              page-break-inside: avoid;
            }

            thead {
              display: table-header-group;
            }
          }
        `}
      </style>

      {/* =======================================================
          ACTION BUTTON
      ======================================================= */}
      <div className="flex justify-end mb-6 no-print">
        <button
          onClick={() => window.print()}
          className="
            px-5 py-3
            bg-[#e94640]
            hover:bg-[#d63d38]
            text-white
            rounded-2xl
            font-semibold
            shadow-lg
            transition-all
          "
        >
          Print Buku Penghubung
        </button>
      </div>

      {/* =======================================================
          PAPER WRAPPER
      ======================================================= */}
      <div className="flex justify-center">
        <div
          id="print-area"
          className="
            bg-white
            shadow-[0_10px_40px_rgba(0,0,0,0.08)]
            max-w-[210mm]
            min-h-[297mm]
            mx-auto
            rounded-[8px]
            overflow-hidden
          "
        >
          {/* =======================================================
              CONTENT
          ======================================================= */}
          <div className="px-[20mm] py-[18mm] text-slate-800">

            {/* =======================================================
                HEADER
            ======================================================= */}
            <div className="pb-7 border-b border-slate-200">
              <div className="flex justify-between items-start">
                {/* LEFT */}
                <div className="flex items-center gap-5">
                  {/* LOGO */}
                  <div
                    className="
                      w-[82px] h-[82px]
                      rounded-2xl
                      bg-gradient-to-br
                      from-red-50 to-white
                      border border-red-100
                      flex items-center justify-center
                    "
                  >
                    <span className="text-[#e94640] font-black text-lg">
                      LOGO
                    </span>
                  </div>

                  {/* SCHOOL */}
                  <div>
                    <div
                      className="
                        text-[34px]
                        font-black
                        tracking-tight
                        leading-[1.05]
                        text-slate-900
                      "
                    >
                      SEKOLAH SS
                    </div>

                    <div className="mt-2 text-[15px] font-semibold text-slate-600">
                      Buku Penghubung Siswa
                    </div>

                    <div className="mt-1 text-[12px] text-slate-400">
                      Jl. Pendidikan No.10 • Telp 08123456789
                    </div>
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-right">
                  <div
                    className="
                      text-[11px]
                      uppercase
                      tracking-[4px]
                      text-slate-400
                      font-bold
                    "
                  >
                    Periode
                  </div>

                  <div
                    className="
                      mt-3
                      text-[30px]
                      font-black
                      leading-tight
                      text-slate-900
                    "
                  >
                    {DUMMY_PRINT_STUDENT.minggu}
                  </div>

                  <div className="text-[18px] font-semibold text-slate-500">
                    {DUMMY_PRINT_STUDENT.tahun}
                  </div>
                </div>
              </div>

              {/* TITLE BAR */}
              <div
                className="
                  mt-6
                  rounded-2xl
                  bg-gradient-to-r
                  from-red-50 to-orange-50
                  border border-red-100
                  px-5 py-4
                  flex items-center justify-between
                "
              >
                <div>
                  <div
                    className="
                      text-[11px]
                      uppercase
                      tracking-[3px]
                      text-red-400
                      font-bold
                    "
                  >
                    Dokumen Akademik
                  </div>

                  <div className="mt-1 text-[20px] font-black text-slate-800">
                    Buku Penghubung Mingguan
                  </div>
                </div>

                <div
                  className="
                    px-4 py-2
                    rounded-xl
                    bg-white
                    border border-red-100
                    text-sm font-bold
                    text-red-500
                  "
                >
                  AKTIF
                </div>
              </div>
            </div>

            {/* =======================================================
                STUDENT INFO
            ======================================================= */}
            <div className="grid grid-cols-2 gap-4 mt-7">
              <InfoCard
                label="Nama Siswa"
                value={DUMMY_PRINT_STUDENT.nama}
              />
              <InfoCard
                label="Kelas"
                value={DUMMY_PRINT_STUDENT.kelas}
              />
              <InfoCard
                label="Nomor Induk"
                value={DUMMY_PRINT_STUDENT.nis}
              />
              <InfoCard
                label="Semester"
                value={DUMMY_PRINT_STUDENT.semester}
              />
            </div>

            {/* =======================================================
                TABLE
            ======================================================= */}
            <div className="mt-7">
              <table
                className="
                  w-full
                  border-separate
                  border-spacing-0
                  overflow-hidden
                  rounded-2xl
                "
              >
                {/* HEAD */}
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-y border-slate-200 border-l rounded-tl-2xl">
                      Hari
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-y border-slate-200">
                      Indikator
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-y border-slate-200">
                      Hasil / Nilai
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-y border-slate-200">
                      Catatan Orang Tua
                    </th>
                    <th className="px-5 py-4 text-left text-[11px] uppercase tracking-[2px] font-bold text-slate-500 border-y border-slate-200 border-r rounded-tr-2xl">
                      Catatan Guru
                    </th>
                  </tr>
                </thead>

                {/* BODY */}
                <tbody>
                  {DAYS_PRINT.map((day, dayIndex) => {
                    const dayData = DUMMY_PRINT_DATA[day];

                    return (
                      <React.Fragment key={day}>
                        {METRICS_PRINT.map((metric, idx) => (
                          <tr
                            key={`${day}-${metric.key}`}
                            className={dayIndex % 2 === 0 ? "bg-white" : "bg-slate-50/40"}
                          >
                            {/* DAY */}
                            {idx === 0 && (
                              <td
                                rowSpan={METRICS_PRINT.length}
                                className="border-b border-x border-slate-200 px-5 py-5 align-top font-bold text-sm text-slate-700"
                              >
                                {day}
                              </td>
                            )}

                            {/* LABEL */}
                            <td className="border-b border-x border-slate-200 px-5 py-4 text-sm font-semibold text-slate-700">
                              {metric.label}
                            </td>

                            {/* VALUE */}
                            <td className="border-b border-x border-slate-200 px-5 py-4 text-sm text-slate-600">
                              {dayData[metric.key]}
                            </td>

                            {/* NOTES */}
                            {idx === 0 && (
                              <>
                                <td
                                  rowSpan={METRICS_PRINT.length}
                                  className="border-b border-x border-slate-200 px-5 py-4 align-top text-sm leading-[1.8] text-slate-600 w-[240px]"
                                >
                                  {dayData.catatan_ortu}
                                </td>
                                <td
                                  rowSpan={METRICS_PRINT.length}
                                  className="border-b border-x border-slate-200 px-5 py-4 align-top text-sm leading-[1.8] text-slate-600 w-[240px]"
                                >
                                  {dayData.catatan_guru}
                                </td>
                              </>
                            )}
                          </tr>
                        ))}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* =======================================================
                SIGNATURE
            ======================================================= */}
            <div className="mt-16 grid grid-cols-2 gap-24">
              <SignatureCard title="Orang Tua / Wali" />
              <SignatureCard title="Guru Kelas" />
            </div>

            {/* =======================================================
                FOOTER
            ======================================================= */}
            <div
              className="
                mt-12
                pt-5
                border-t border-slate-200
                flex justify-between
                text-[11px]
                text-slate-400
              "
            >
              <span>
                Dicetak pada: {printDate}
              </span>
              <span>
                Buku Penghubung Digital PAUD
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/* =======================================================
    INFO CARD
======================================================= */

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4">
      <div className="text-[10px] uppercase tracking-[2px] text-slate-400 font-bold">
        {label}
      </div>
      <div className="mt-2 text-[20px] font-bold text-slate-800 leading-snug">
        {value}
      </div>
    </div>
  );
}

/* =======================================================
    SIGNATURE CARD
======================================================= */

function SignatureCard({ title }) {
  return (
    <div className="text-center">
      <div className="text-[15px] font-semibold text-slate-600 mb-28">
        {title}
      </div>
      <div className="border-t border-slate-400 pt-3 text-sm font-semibold text-slate-700">
        ( _______________________ )
      </div>
    </div>
  );
}