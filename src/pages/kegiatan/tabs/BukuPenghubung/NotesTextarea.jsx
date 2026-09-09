export default function NotesTextarea({
  value,
  onChange,
  placeholder,
  color = "amber"
}) {
  const styles = {
    amber: `
      bg-amber-50/20
      border-amber-100
      focus:border-amber-300
      focus:ring-amber-200
    `,
    blue: `
      bg-blue-50/20
      border-blue-100
      focus:border-blue-300
      focus:ring-blue-200
    `
  };

  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`
        w-full h-full min-h-[160px]
        p-3 bg-white/60
        border rounded-lg resize-none
        focus:outline-none focus:ring-1
        transition-all text-xs
        placeholder-slate-400 leading-relaxed
        ${styles[color]}
      `}
    />
  );
}