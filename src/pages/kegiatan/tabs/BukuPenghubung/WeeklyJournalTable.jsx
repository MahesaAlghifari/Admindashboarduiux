import React from "react";

import MetricInput from "./MetricInput";
import NotesTextarea from "./NotesTextarea";

import { DAYS, METRICS } from "./constants";
import { getDayData } from "./helpers";

export default function WeeklyJournalTable({
  selectedWeek,
  student,
  penghubungData,
  onChange
}) {
  return (
    <div className="overflow-auto flex-1">
      <table className="min-w-full divide-y divide-slate-200 border-collapse">
        <thead className="bg-slate-50 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 w-28">Hari</th>

            <th className="px-4 py-3 w-48 text-left">
              Indikator
            </th>

            <th className="px-4 py-3 w-64 text-left">
              Hasil / Nilai
            </th>

            <th className="px-4 py-3 text-left bg-amber-50">
              Catatan Orang Tua
            </th>

            <th className="px-4 py-3 text-left bg-blue-50">
              Catatan Guru
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 text-sm">
          {DAYS.map((day) => {
            const dayData = getDayData({
              penghubungData,
              selectedWeek,
              studentId: student.id,
              day
            });

            return (
              <React.Fragment key={day}>
                {METRICS.map((metric, idx) => (
                  <tr key={`${day}-${metric.key}`}>
                    {idx === 0 && (
                      <td
                        rowSpan={METRICS.length}
                        className="px-4 py-4 font-bold text-center"
                      >
                        {day}
                      </td>
                    )}

                    <td className="px-4 py-2">
                      {metric.label}
                    </td>

                    <td className="px-2 py-1">
                      <MetricInput
                        metric={metric}
                        value={dayData[metric.key]}
                        onChange={(value) =>
                          onChange(day, metric.key, value)
                        }
                      />
                    </td>

                    {idx === 0 && (
                      <>
                        <td
                          rowSpan={METRICS.length}
                          className="p-2 align-top"
                        >
                          <NotesTextarea
                            value={dayData.catatan_ortu}
                            onChange={(value) =>
                              onChange(day, "catatan_ortu", value)
                            }
                            placeholder="Tulis pesan dari rumah..."
                            color="amber"
                          />
                        </td>

                        <td
                          rowSpan={METRICS.length}
                          className="p-2 align-top"
                        >
                          <NotesTextarea
                            value={dayData.catatan_guru}
                            onChange={(value) =>
                              onChange(day, "catatan_guru", value)
                            }
                            placeholder="Tulis pesan dari sekolah..."
                            color="blue"
                          />
                        </td>
                      </>
                    )}
                  </tr>
                ))}

                <tr>
                  <td
                    colSpan="5"
                    className="bg-slate-100 h-2"
                  />
                </tr>
              </React.Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}