import { ArrowLeftIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { Link } from "react-router-dom";

export default function AccessDeniedPage() {
  return (
    <div className="flex min-h-[420px] items-center justify-center px-4 py-12">
      <div className="max-w-md text-center">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-[#e94640]">
          <LockClosedIcon className="h-7 w-7" />
        </span>
        <h1 className="mt-5 text-xl font-semibold text-slate-900">Akses tidak tersedia</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Akun Anda tidak memiliki izin untuk membuka halaman ini. Hubungi pimpinan sekolah jika Anda memerlukan akses tambahan.
        </p>
        <Link to="/dashboard" className="mt-6 inline-flex h-10 items-center gap-2 rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-800">
          <ArrowLeftIcon className="h-4 w-4" /> Kembali ke Dashboard
        </Link>
      </div>
    </div>
  );
}
