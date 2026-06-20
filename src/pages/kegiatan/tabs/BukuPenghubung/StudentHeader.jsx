import {
  ArrowLeftIcon,
  ChatBubbleBottomCenterTextIcon
} from "@heroicons/react/24/outline";

export default function StudentHeader({
  student,
  onBack
}) {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm
    flex flex-col md:flex-row justify-between items-center gap-4">

      <div className="flex items-center gap-4 w-full md:w-auto">
        <button
          onClick={onBack}
          className="p-2 rounded-lg bg-slate-50 text-slate-500
          border border-slate-200 hover:bg-white"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>

        <div>
          <h2 className="text-lg font-bold text-slate-800">
            {student.peserta_didik.nama_lengkap}
          </h2>

          <div className="flex items-center gap-2 mt-0.5">
            <span
              className="text-xs text-slate-500 font-mono
              bg-slate-100 px-1.5 py-0.5 rounded"
            >
              {student.peserta_didik.nomor_induk}
            </span>

            <span className="text-xs text-slate-400">•</span>

            <span className="text-xs text-slate-500 font-medium">
              Buku Penghubung Digital
            </span>
          </div>
        </div>
      </div>

      <div
        className="flex bg-blue-50 px-3 py-1.5 rounded-lg
        text-blue-700 font-medium text-xs items-center gap-2"
      >
        <ChatBubbleBottomCenterTextIcon className="h-4 w-4" />
        Jurnal Harian
      </div>
    </div>
  );
}