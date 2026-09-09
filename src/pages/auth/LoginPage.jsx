import { useMemo, useState } from "react";
import {
  AcademicCapIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  EyeIcon,
  EyeSlashIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import {
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useAuth } from "../../auth/useAuth";

const BRAND = "#ef4d45";

const cleanNikValue = (value) =>
  String(value ?? "").replace(/\D/g, "");

const errorMessage = (error) => {
  if (error?.status === 401) {
    return "NIK atau kata sandi yang Anda masukkan salah.";
  }

  if (error?.status === 422) {
    return (
      error?.message ||
      "NIK atau kata sandi tidak valid."
    );
  }

  if (
    error?.status === 0 ||
    error?.name === "TypeError"
  ) {
    return "Tidak dapat terhubung ke server. Periksa koneksi lalu coba lagi.";
  }

  return (
    error?.message ||
    "Login gagal. Silakan coba kembali."
  );
};

function BrandMark() {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/20 bg-white/10 text-white shadow-sm backdrop-blur-sm">
        <AcademicCapIcon className="h-5 w-5" />
      </span>

      <div>
        <p className="text-[13px] font-semibold tracking-tight text-white">
          SS EduSphere
        </p>
        <p className="mt-0.5 text-[10px] text-white/60">
          School Management System
        </p>
      </div>
    </div>
  );
}

function Benefit({ children }) {
  return (
    <li className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white/10">
        <CheckCircleIcon className="h-3.5 w-3.5 text-white/80" />
      </span>
      <span className="text-[11px] leading-5 text-white/70">
        {children}
      </span>
    </li>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticating } = useAuth();

  const [nik, setNik] = useState("");
  const [password, setPassword] =
    useState("");
  const [showPassword, setShowPassword] =
    useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] =
    useState(false);

  const cleanNik = useMemo(
    () => cleanNikValue(nik),
    [nik]
  );

  const nikInvalid =
    submitted && cleanNik.length === 0;
  const passwordInvalid =
    submitted && password.length === 0;

  const canSubmit =
    cleanNik.length > 0 &&
    password.length > 0 &&
    !isAuthenticating;

  const handleLogin = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setError("");

    if (!cleanNik || !password) return;

    try {
      await login({
        nik: cleanNik,
        password,
      });

      const destination =
        location.state?.from &&
        location.state.from !== "/login"
          ? location.state.from
          : "/dashboard";

      navigate(destination, {
        replace: true,
      });
    } catch (loginError) {
      setError(errorMessage(loginError));
    }
  };

  return (
    <main className="flex min-h-dvh w-full items-center justify-center bg-[#f6f7f9] p-4 sm:p-6 lg:p-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_24px_70px_-38px_rgba(15,23,42,0.34)] lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden min-h-[620px] overflow-hidden bg-[#ef4d45] p-8 lg:flex lg:flex-col lg:justify-between xl:p-10">
          <div className="pointer-events-none absolute inset-0 overflow-hidden">
            <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border-[48px] border-white/[0.06]" />
            <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full border-[54px] border-white/[0.05]" />
            <div className="absolute left-12 top-40 h-px w-28 bg-white/10" />
          </div>

          <div className="relative z-10">
            <BrandMark />

            <div className="mt-20 max-w-sm">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.08] px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
                <ShieldCheckIcon className="h-3.5 w-3.5" />
                Portal Internal Sekolah
              </span>

              <h1 className="mt-5 text-[32px] font-semibold leading-[1.18] tracking-[-0.035em] text-white">
                Kelola operasional sekolah dari satu tempat.
              </h1>

              <p className="mt-4 max-w-xs text-[12px] leading-6 text-white/65">
                Akses data siswa, akademik, administrasi,
                keuangan, dan laporan melalui portal staf
                yang terintegrasi.
              </p>

              <ul className="mt-8 space-y-3">
                <Benefit>
                  Informasi sekolah tersusun dalam satu
                  dashboard.
                </Benefit>
                <Benefit>
                  Akses pengguna mengikuti peran dan
                  kewenangan akun.
                </Benefit>
                <Benefit>
                  Data operasional tersedia untuk kebutuhan
                  harian dan pelaporan.
                </Benefit>
              </ul>
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
            <p className="text-[10px] text-white/45">
              © {new Date().getFullYear()} SS EduSphere
            </p>
            <p className="text-[10px] text-white/45">
              Sistem Informasi Sekolah
            </p>
          </div>
        </section>

        <section className="flex min-h-[600px] flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 lg:hidden">
            <div className="flex items-center gap-2.5">
              <span
                className="flex h-9 w-9 items-center justify-center rounded-xl text-white"
                style={{ backgroundColor: BRAND }}
              >
                <AcademicCapIcon className="h-[18px] w-[18px]" />
              </span>
              <div>
                <p className="text-[12px] font-semibold text-slate-800">
                  SS EduSphere
                </p>
                <p className="text-[9px] text-slate-400">
                  School Management System
                </p>
              </div>
            </div>

            <span className="rounded-full border border-slate-100 bg-slate-50 px-2.5 py-1 text-[9px] font-semibold text-slate-500">
              Portal Staf
            </span>
          </div>

          <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-10 lg:px-12 xl:px-16">
            <div className="w-full max-w-sm">
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#ef4d45]">
                  Selamat datang kembali
                </span>

                <h2 className="mt-2 text-[27px] font-semibold tracking-[-0.03em] text-slate-900">
                  Masuk ke akun Anda
                </h2>

                <p className="mt-2 text-[12px] leading-5 text-slate-400">
                  Gunakan NIK dan kata sandi yang telah
                  terdaftar pada sistem sekolah.
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mt-5 flex items-start gap-3 rounded-xl border border-rose-100 bg-rose-50/70 px-3.5 py-3"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-rose-100">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                  </span>
                  <p className="text-[11px] leading-5 text-rose-600">
                    {error}
                  </p>
                </div>
              )}

              <form
                onSubmit={handleLogin}
                className="mt-7 space-y-4"
                noValidate
              >
                <div>
                  <label
                    htmlFor="nik"
                    className="mb-1.5 block text-[11px] font-semibold text-slate-600"
                  >
                    NIK
                  </label>

                  <div className="relative">
                    <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="nik"
                      name="nik"
                      type="text"
                      inputMode="numeric"
                      autoComplete="username"
                      autoFocus
                      value={nik}
                      onChange={(event) => {
                        setNik(
                          cleanNikValue(
                            event.target.value
                          )
                        );
                        if (error) setError("");
                      }}
                      disabled={isAuthenticating}
                      aria-invalid={nikInvalid}
                      aria-describedby={
                        nikInvalid
                          ? "nik-error"
                          : undefined
                      }
                      placeholder="Masukkan NIK"
                      className={`h-11 w-full rounded-xl border bg-white pl-10 pr-3.5 text-[12px] font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                        nikInvalid
                          ? "border-rose-300 ring-2 ring-rose-100"
                          : "border-slate-200 hover:border-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-100"
                      }`}
                    />
                  </div>

                  {nikInvalid && (
                    <p
                      id="nik-error"
                      className="mt-1.5 text-[10px] text-rose-500"
                    >
                      NIK wajib diisi.
                    </p>
                  )}
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="text-[11px] font-semibold text-slate-600"
                    >
                      Kata sandi
                    </label>

                    <span className="text-[9px] text-slate-400">
                      Case-sensitive
                    </span>
                  </div>

                  <div className="relative">
                    <LockClosedIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

                    <input
                      id="password"
                      name="password"
                      type={
                        showPassword
                          ? "text"
                          : "password"
                      }
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(
                          event.target.value
                        );
                        if (error) setError("");
                      }}
                      disabled={isAuthenticating}
                      aria-invalid={
                        passwordInvalid
                      }
                      aria-describedby={
                        passwordInvalid
                          ? "password-error"
                          : undefined
                      }
                      placeholder="Masukkan kata sandi"
                      className={`h-11 w-full rounded-xl border bg-white pl-10 pr-11 text-[12px] font-medium text-slate-800 outline-none transition placeholder:font-normal placeholder:text-slate-300 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400 ${
                        passwordInvalid
                          ? "border-rose-300 ring-2 ring-rose-100"
                          : "border-slate-200 hover:border-slate-300 focus:border-[#ef4d45] focus:ring-2 focus:ring-red-100"
                      }`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      disabled={isAuthenticating}
                      className="absolute right-2.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-50 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      aria-pressed={showPassword}
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-4 w-4" />
                      ) : (
                        <EyeIcon className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  {passwordInvalid && (
                    <p
                      id="password-error"
                      className="mt-1.5 text-[10px] text-rose-500"
                    >
                      Kata sandi wajib diisi.
                    </p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="group flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-[#ef4d45] px-4 text-[12px] font-semibold text-white shadow-sm transition hover:bg-[#df433c] focus:outline-none focus:ring-2 focus:ring-red-200 focus:ring-offset-2 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-[#ef4d45]"
                >
                  {isAuthenticating ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/35 border-t-white" />
                      Memeriksa akun...
                    </>
                  ) : (
                    <>
                      Masuk ke Dashboard
                      <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 rounded-xl border border-slate-100 bg-slate-50/70 px-3.5 py-3">
                <div className="flex items-start gap-2.5">
                  <ShieldCheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="text-[10px] leading-4 text-slate-400">
                    Akses hanya untuk pengguna yang telah
                    terdaftar. Jika lupa kata sandi atau
                    mengalami kendala akun, hubungi
                    administrator sekolah.
                  </p>
                </div>
              </div>

              <p className="mt-6 text-center text-[9px] leading-4 text-slate-300 lg:hidden">
                © {new Date().getFullYear()} SS EduSphere
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
