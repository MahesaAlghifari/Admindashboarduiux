import { useState } from "react";
import { useNavigate } from "react-router-dom"; // 1. Import useNavigate
import {
  UserIcon,
  LockClosedIcon,
  EyeIcon,
  EyeSlashIcon,
  CheckCircleIcon
} from "@heroicons/react/24/outline";

// --- IMPORT LANGSUNG DATA DUMMY ---
import { DATA_STAFF_DUMMY } from "../../data/dummyStaff"; 

export default function LoginPage() {
  // --- STATE ---
  const navigate = useNavigate(); // 2. Init Navigate
  const [nik, setNik] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // --- HANDLER: LOGIN ---
  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setIsLoading(true);

    // Simulasi delay network
    setTimeout(() => {
      // 1. Cari user berdasarkan NIK
      const user = DATA_STAFF_DUMMY.find((u) => u.pribadi.nik === nik);

      if (!user) {
        setError("NIK tidak ditemukan dalam database.");
        setIsLoading(false);
        return;
      }

      // 2. Cek Password
      if (user.password !== password) {
        setError("Password salah. Pastikan password sesuai data (default: DDMMYYYY).");
        setIsLoading(false);
        return;
      }

      // 3. Login Berhasil
      // SIMPAN SESSION KE LOCALSTORAGE (PENTING AGAR PRIVATE ROUTE BEKERJA)
      localStorage.setItem("user_session", JSON.stringify(user));

      setSuccess(true);
      setIsLoading(false);
      
      console.log("Login Sukses:", user.pribadi.nama_lengkap);

      // 4. Redirect ke Dashboard setelah delay singkat
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500); // Tunggu 1.5 detik agar user lihat pesan sukses dulu
      
    }, 800);
  };

  return (
    <div className="flex items-center justify-center  font-sans p-4">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap'); body { font-family: 'Inter', sans-serif; }`}</style>

      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl flex overflow-hidden border border-slate-100 min-h-[500px]">
        
        {/* LEFT SIDE: BRANDING */}
        <div className="hidden md:flex flex-col justify-between w-1/2 bg-[#e94640] p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
          
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-lg mb-6 flex items-center justify-center">
               <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
               </svg>
            </div>
            <h1 className="text-3xl font-bold mb-2">Sistem Dashboard PAUD</h1>
            <p className="text-red-100 text-sm leading-relaxed">
              Platform terintegrasi untuk memantau perkembangan anak, presensi, dan laporan harian dengan mudah dan transparan.
            </p>
          </div>

          <div className="relative z-10 text-xs text-red-200">
            &copy; 2026 PAUD Dashboard System
          </div>
        </div>

        {/* RIGHT SIDE: LOGIN FORM */}
        <div className="w-full md:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">Login Staff</h2>
              <p className="text-sm text-slate-500 mt-2">Masukan NIK dan Password Anda.</p>
            </div>

            {/* NOTIFICATIONS */}
            {error && (
              <div className="mb-6 bg-rose-50 border border-rose-100 text-rose-600 text-xs font-medium px-4 py-3 rounded-lg flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                <div className="mt-0.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div></div>
                {error}
              </div>
            )}

            {success ? (
               <div className="text-center py-10 animate-in fade-in zoom-in duration-300">
                  <div className="mx-auto w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                    <CheckCircleIcon className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">Login Berhasil!</h3>
                  <p className="text-slate-500 text-sm mt-2">Mengalihkan ke Dashboard...</p>
               </div>
            ) : (
              /* FORM INPUTS */
              <form onSubmit={handleLogin} className="space-y-5">
                
                {/* Input NIK */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide mb-1.5">Nomor Induk (NIK)</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      value={nik}
                      onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, ""))} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none transition-all placeholder:text-slate-400"
                      placeholder="Contoh: 327301..."
                      required
                    />
                    <UserIcon className="h-5 w-5 text-slate-400 absolute left-3 top-2.5" />
                  </div>
                </div>

                {/* Input Password */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wide">Password</label>
                  </div>
                  <div className="relative">
                    <input 
                      type={showPassword ? "text" : "password"} 
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 focus:bg-white focus:border-[#e94640] focus:ring-1 focus:ring-[#e94640] outline-none transition-all placeholder:text-slate-400 font-mono"
                      placeholder="DDMMYYYY"
                      required
                    />
                    <LockClosedIcon className="h-5 w-5 text-slate-400 absolute left-3 top-2.5" />
                    <button 
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  disabled={isLoading}
                  className="w-full py-2.5 bg-[#e94640] hover:bg-[#d63d38] text-white font-bold rounded-lg shadow-md hover:shadow-lg transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex justify-center items-center gap-2 mt-4"
                >
                  {isLoading ? "Memproses..." : "Masuk Dashboard"}
                </button>
              </form>
            )}

            {/* TEST CREDENTIALS HINT */}
            <div className="mt-8 pt-6 border-t border-slate-100 text-center">
               <p className="text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-2">Test Accounts</p>
               <div className="flex flex-wrap justify-center gap-2">
                 <span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">Kepsek: 3273011205750001 / 12051975</span>
                 <span className="px-2 py-1 bg-slate-100 rounded text-[10px] text-slate-600 font-mono">Guru: 3204014101900003 / 01011990</span>
               </div>
            </div>

        </div>
      </div>
    </div>
  );
}