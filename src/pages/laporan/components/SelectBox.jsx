export default function SelectBox({
  options = [],
  value,
  onChange,
  label,
  placeholder = "Pilih opsi",
  className = ""
}) {
  return (
    <div className={`flex flex-col ${className}`}>

      {/* LABEL */}
      {label && (
        <label
          className="
            mb-1.5 ml-1
            text-[10px]
            font-bold
            uppercase
            tracking-[1.5px]
            text-slate-400
          "
        >
          {label}
        </label>
      )}

      {/* SELECT WRAPPER */}
      <div className="relative">

        <select
          value={value}
          onChange={(e) =>
            onChange &&
            onChange(e.target.value)
          }
          className="
            appearance-none
            w-full
            rounded-xl
            border border-slate-200
            bg-slate-50
            px-4 pr-11 py-2.5
            text-sm
            font-medium
            text-slate-700
            transition-all
            outline-none
            focus:border-[#e94640]
            focus:ring-4
            focus:ring-red-50
            cursor-pointer
          "
        >

          {/* PLACEHOLDER */}
          {!value && (
            <option value="">
              {placeholder}
            </option>
          )}

          {/* OPTIONS */}
          {options.map((option) => (
            <option
              key={option}
              value={option}
            >
              {option}
            </option>
          ))}
        </select>

        {/* ARROW */}
        <div
          className="
            pointer-events-none
            absolute inset-y-0 right-0
            flex items-center
            px-3
            text-slate-400
          "
        >

          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="w-4 h-4"
          >
            <path
              fillRule="evenodd"
              d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
              clipRule="evenodd"
            />
          </svg>
        </div>
      </div>
    </div>
  );
}