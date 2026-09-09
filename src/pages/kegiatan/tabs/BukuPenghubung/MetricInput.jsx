export default function MetricInput({
  metric,
  value,
  onChange
}) {
  if (metric.type === "select") {
    return (
      <select
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-white border border-slate-200 rounded p-1.5
        focus:outline-none focus:border-[#e94640]
        focus:ring-1 focus:ring-red-100 text-sm"
      >
        <option value="">- Pilih -</option>

        {metric.options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div className="relative">
      <input
        type={metric.type || "text"}
        value={value || ""}
        min={metric.min}
        max={metric.max}
        onChange={(e) => onChange(e.target.value)}
        placeholder={metric.placeholder || "..."}
        className="w-full bg-white border border-slate-200 rounded p-1.5
        focus:outline-none focus:border-[#e94640]
        focus:ring-1 focus:ring-red-100 text-sm
        placeholder-slate-300"
      />

      {metric.unit && (
        <span className="absolute right-3 top-1.5 text-xs text-slate-400">
          {metric.unit}
        </span>
      )}
    </div>
  );
}