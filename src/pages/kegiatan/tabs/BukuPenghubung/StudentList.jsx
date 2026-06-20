import { PencilSquareIcon } from "@heroicons/react/24/outline";

export default function StudentList({
  students,
  onOpen
}) {
  return (
    <div className="flex-1 relative border border-slate-200
    rounded-xl overflow-hidden mb-6 shadow-sm">

      <table className="min-w-full divide-y divide-slate-100">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-semibold">
              No
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold">
              Nama Siswa
            </th>

            <th className="px-6 py-4 text-left text-xs font-semibold">
              Nomor Induk
            </th>

            <th className="px-6 py-4 text-right text-xs font-semibold">
              Aksi
            </th>
          </tr>
        </thead>

        <tbody className="divide-y divide-slate-100 bg-white">
          {students.map((siswa, index) => (
            <tr
              key={siswa.id}
              className="hover:bg-slate-50 transition-colors"
            >
              <td className="px-6 py-4 text-sm">
                {index + 1}
              </td>

              <td className="px-6 py-4 text-sm font-semibold">
                {siswa.peserta_didik.nama_lengkap}
              </td>

              <td className="px-6 py-4 text-sm font-mono">
                {siswa.peserta_didik.nomor_induk}
              </td>

              <td className="px-6 py-4 text-right">
                <button
                  onClick={() => onOpen(siswa)}
                  className="inline-flex items-center gap-2
                  px-3 py-1.5 rounded-lg border"
                >
                  <PencilSquareIcon className="h-4 w-4" />
                  Input Jurnal
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}