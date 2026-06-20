import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export default function EmptyState({
  title = "Data tidak ditemukan",
  description = "Coba ubah filter atau kata kunci pencarian.",
  colSpan = 7
}) {
  return (
    <tr>
      <td
        colSpan={colSpan}
        className="px-6 py-16"
      >

        <div
          className="
            flex flex-col
            items-center
            justify-center
            text-center
          "
        >

          {/* ICON */}
          <div
            className="
              w-16 h-16
              rounded-full
              bg-slate-100
              flex items-center justify-center
              mb-5
            "
          >
            <MagnifyingGlassIcon
              className="
                w-8 h-8
                text-slate-400
              "
            />
          </div>

          {/* TITLE */}
          <h3
            className="
              text-lg
              font-bold
              text-slate-700
              mb-2
            "
          >
            {title}
          </h3>

          {/* DESCRIPTION */}
          <p
            className="
              max-w-sm
              text-sm
              leading-relaxed
              text-slate-400
            "
          >
            {description}
          </p>
        </div>
      </td>
    </tr>
  );
}