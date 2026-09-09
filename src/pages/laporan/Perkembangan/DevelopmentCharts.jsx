import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

function ChartCard({ title, subtitle, children }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4">
        <h3 className="text-sm font-semibold text-slate-800">{title}</h3>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
}

function MetricChart({ data, dataKey, name, unit }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} unit={unit} />
        <Tooltip />
        <Line
          type="monotone"
          dataKey={dataKey}
          name={name}
          stroke="currentColor"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4 }}
          connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export default function DevelopmentCharts({
  mode,
  summary,
  student,
  studentTrend,
}) {
  if (mode === "student") {
    return (
      <div className="grid gap-5 xl:grid-cols-2">
        <ChartCard title="Tren Tinggi Badan" subtitle={student?.nama_lengkap || "-"}>
          <MetricChart
            data={studentTrend}
            dataKey="tinggi"
            name="Tinggi"
            unit=" cm"
          />
        </ChartCard>
        <ChartCard title="Tren Berat Badan" subtitle={student?.nama_lengkap || "-"}>
          <MetricChart
            data={studentTrend}
            dataKey="berat"
            name="Berat"
            unit=" kg"
          />
        </ChartCard>
      </div>
    );
  }

  return (
    <>
      <ChartCard
        title="Tren Rata-rata Tinggi Badan"
        subtitle="Rata-rata tinggi siswa pada setiap semester yang memiliki data."
      >
        <MetricChart
          data={summary?.trend ?? []}
          dataKey="average_height"
          name="Tinggi"
          unit=" cm"
        />
      </ChartCard>
      <ChartCard
        title="Tren Rata-rata Berat Badan"
        subtitle="Rata-rata berat siswa pada setiap semester yang memiliki data."
      >
        <MetricChart
          data={summary?.trend ?? []}
          dataKey="average_weight"
          name="Berat"
          unit=" kg"
        />
      </ChartCard>
    </>
  );
}
