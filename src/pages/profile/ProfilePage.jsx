import { useEffect, useState } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  KeyRound,
  BadgeCheck,
  Building2,
  GraduationCap,
  Pencil,
  Save,
  XCircle,
  Loader2,
  Camera
} from "lucide-react";

export default function ProfilePage() {
  // --- STATE ---
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState(null);
  const [activeTab, setActiveTab] = useState("detail");
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingSave, setIsLoadingSave] = useState(false);

  // --- 1. LOAD DATA AWAL ---
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = () => {
    const session = localStorage.getItem("user_session");
    if (session) {
      try {
        const parsedUser = JSON.parse(session);
        setUser(parsedUser);
        setFormData(parsedUser);
      } catch (error) {
        console.error("Error parsing user session", error);
      }
    }
  };

  // --- HANDLERS ---
  const handleInputChange = (section, field, value) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleCancelEdit = () => {
    setFormData(user); // Reset data
    setIsEditing(false);
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setIsLoadingSave(true);

    // SIMULASI SAVE
    setTimeout(() => {
        setUser(formData);
        localStorage.setItem("user_session", JSON.stringify(formData));
        
        setIsLoadingSave(false);
        setIsEditing(false);
        alert("Profil berhasil diperbarui!");
        window.dispatchEvent(new Event("storage")); 
    }, 1000);
  };

  if (!user || !formData) {
    return <div className="p-8 text-center text-slate-500 flex justify-center mt-10"><Loader2 className="animate-spin mr-2"/> Memuat data profil...</div>;
  }

  const formatDate = (dateString) => {
    if (!dateString || dateString === "-") return "-";
    try {
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('id-ID', options);
    } catch (e) { return dateString; }
  };

  return (
    // HAPUS padding atas berlebihan, langsung ke layout utama
    <div className="p-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-20">
      
      {/* DULU ADA HEADER DISINI (JUDUL "PROFIL SAYA"). 
          SUDAH DIHAPUS AGAR TIDAK DOBEL.
      */}

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* === SIDEBAR KIRI: IDENTITAS & NAVIGASI === */}
        <aside className="w-full lg:w-80 shrink-0 space-y-6">
            
            {/* 1. KARTU IDENTITAS (Minimalis) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative group">
                 {/* Background Aksen Kecil di Atas */}
                 <div className="h-24 bg-[#EB4C42] relative">
                    <div className="absolute inset-0 bg-black/5 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                 </div>
                 
                 <div className="px-6 pb-6 text-center -mt-12 relative z-10">
                    {/* Avatar */}
                    <div className="inline-block relative">
                        <div className="w-24 h-24 rounded-full border-[4px] border-white bg-slate-100 shadow-md overflow-hidden flex items-center justify-center">
                            {user.pribadi.foto ? (
                                <img src={user.pribadi.foto} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User className="w-10 h-10 text-slate-400" />
                            )}
                        </div>
                        {/* Tombol Edit Foto (Hanya Hiasan) */}
                        {isEditing && (
                            <button className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full hover:bg-slate-700 shadow-sm border-2 border-white">
                                <Camera className="w-3 h-3" />
                            </button>
                        )}
                    </div>

                    <h2 className="mt-3 text-lg font-bold text-slate-900">{user.pribadi.nama_lengkap}</h2>
                    <p className="text-sm text-slate-500 mb-4">{user.kepegawaian.jabatan}</p>
                    
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs font-mono text-slate-600">
                        <BadgeCheck className="w-3 h-3 text-slate-400" />
                        {user.pribadi.nip || "NON-NIP"}
                    </div>
                 </div>

                 {/* Tombol Aksi (Edit/Save) */}
                 <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                    {activeTab === 'detail' && !isEditing && (
                        <button 
                            onClick={() => setIsEditing(true)}
                            className="w-full flex justify-center items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 text-sm font-bold rounded-lg hover:border-[#EB4C42] hover:text-[#EB4C42] transition-all shadow-sm"
                        >
                            <Pencil className="w-3.5 h-3.5" /> Edit Data
                        </button>
                    )}

                    {isEditing && (
                        <div className="grid grid-cols-2 gap-2">
                            <button 
                                onClick={handleCancelEdit}
                                disabled={isLoadingSave}
                                className="flex justify-center items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-100 transition-colors"
                            >
                                Batal
                            </button>
                            <button 
                                onClick={handleSaveProfile}
                                disabled={isLoadingSave}
                                className="flex justify-center items-center gap-2 px-3 py-2 bg-[#EB4C42] text-white text-sm font-bold rounded-lg hover:bg-[#d63d38] transition-colors shadow-sm"
                            >
                                {isLoadingSave ? <Loader2 className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />}
                                Simpan
                            </button>
                        </div>
                    )}
                 </div>
            </div>

            {/* 2. MENU NAVIGASI (Vertical) */}
            <nav className="space-y-1">
                <button
                  onClick={() => { if(!isEditing) setActiveTab("detail")}}
                  disabled={isEditing} 
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === "detail" ? "bg-white shadow-sm text-[#EB4C42] font-bold ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/60 hover:text-slate-700"} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <User className="w-4 h-4" /> Informasi Pribadi
                </button>
                <button
                  onClick={() => { if(!isEditing) setActiveTab("security")}}
                  disabled={isEditing}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm rounded-xl transition-all ${activeTab === "security" ? "bg-white shadow-sm text-[#EB4C42] font-bold ring-1 ring-slate-200" : "text-slate-500 hover:bg-white/60 hover:text-slate-700"} ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <KeyRound className="w-4 h-4" /> Password & Keamanan
                </button>
            </nav>
        </aside>

        {/* === KONTEN UTAMA (KANAN) === */}
        <main className="flex-1 min-w-0">
          
          {/* --- TAB DETAIL INFORMASI --- */}
          {activeTab === "detail" && (
             <form onSubmit={handleSaveProfile} className="space-y-6">
                
                {/* SECTION: DATA PRIBADI */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#EB4C42]" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Data Pribadi</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput 
                            label="Nama Lengkap" 
                            value={formData.pribadi.nama_lengkap} 
                            onChange={(e) => handleInputChange('pribadi', 'nama_lengkap', e.target.value)}
                            isEditing={isEditing}
                        />
                        
                        <FormSelect
                            label="Jenis Kelamin"
                            value={formData.pribadi.jenis_kelamin}
                            onChange={(e) => handleInputChange('pribadi', 'jenis_kelamin', e.target.value)}
                            isEditing={isEditing}
                            options={["Laki-laki", "Perempuan"]}
                        />

                         <FormInput 
                            label="Tempat Lahir" 
                            value={formData.pribadi.tempat_lahir} 
                            onChange={(e) => handleInputChange('pribadi', 'tempat_lahir', e.target.value)}
                            isEditing={isEditing}
                        />

                         <FormInput 
                            label="Tanggal Lahir" 
                            type="date"
                            value={formData.pribadi.tanggal_lahir} 
                            displayValue={formatDate(formData.pribadi.tanggal_lahir)}
                            onChange={(e) => handleInputChange('pribadi', 'tanggal_lahir', e.target.value)}
                            isEditing={isEditing}
                        />
                    </div>
                </div>

                {/* SECTION: KONTAK */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Phone className="w-4 h-4 text-emerald-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Kontak & Alamat</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput 
                            label="Email" 
                            type="email"
                            value={formData.kontak.email} 
                            onChange={(e) => handleInputChange('kontak', 'email', e.target.value)}
                            isEditing={isEditing}
                            icon={Mail}
                        />
                        <FormInput 
                            label="Nomor WhatsApp" 
                            value={formData.kontak.no_hp} 
                            onChange={(e) => handleInputChange('kontak', 'no_hp', e.target.value)}
                            isEditing={isEditing}
                            icon={Phone}
                        />
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Alamat Domisili</label>
                            {isEditing ? (
                                <textarea 
                                    rows={2}
                                    value={formData.pribadi.alamat_lengkap}
                                    onChange={(e) => handleInputChange('pribadi', 'alamat_lengkap', e.target.value)}
                                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm focus:ring-2 focus:ring-red-100 focus:border-[#EB4C42] outline-none transition-all resize-none"
                                />
                            ) : (
                                <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                    <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                                    <span className="text-sm font-medium text-slate-800">{formData.pribadi.alamat_lengkap}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* SECTION: KEPEGAWAIAN */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 opacity-80">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Building2 className="w-4 h-4 text-blue-600" />
                        </div>
                        <h3 className="text-base font-bold text-slate-900">Data Kepegawaian (Read-Only)</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <FormInput label="NIK (Nomor Induk)" value={formData.pribadi.nik} isEditing={false} disabled />
                        <FormInput label="NIP / NIY" value={formData.pribadi.nip || "-"} isEditing={false} disabled />
                        <FormInput label="Jabatan" value={formData.kepegawaian.jabatan} isEditing={false} disabled />
                        <FormSelect
                            label="Pendidikan Terakhir"
                            value={formData.pribadi.pendidikan_terakhir}
                            onChange={(e) => handleInputChange('pribadi', 'pendidikan_terakhir', e.target.value)}
                            isEditing={isEditing}
                            options={["SMA/SMK", "D3", "S1", "S2", "S3", "Lainnya"]}
                        />
                    </div>
                </div>
             </form>
          )}

          {/* --- TAB KEAMANAN --- */}
          {activeTab === "security" && (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8">
               <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center">
                      <KeyRound className="w-4 h-4 text-orange-600" />
                    </div>
                    <h3 className="text-base font-bold text-slate-900">Ganti Password</h3>
               </div>

               <form className="space-y-5 max-w-lg" onSubmit={(e) => { e.preventDefault(); alert("Fitur ganti password berhasil disimulasikan!"); }}>
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 mb-6">
                     <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password Saat Ini</label>
                     <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-100 focus:border-[#EB4C42] outline-none transition-all bg-white" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Password Baru</label>
                      <input type="password" placeholder="Min. 8 karakter" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-100 focus:border-[#EB4C42] outline-none transition-all" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Konfirmasi</label>
                      <input type="password" placeholder="Ulangi password" className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:ring-2 focus:ring-red-100 focus:border-[#EB4C42] outline-none transition-all" />
                    </div>
                  </div>
                  
                  <div className="pt-6">
                     <button type="submit" className="px-6 py-2.5 text-sm font-bold text-white bg-[#EB4C42] hover:bg-[#d63d38] rounded-lg shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                        <Save className="w-4 h-4"/> Update Password
                     </button>
                  </div>
               </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// --- KOMPONEN INPUT SEDERHANA ---

function FormInput({ label, value, onChange, isEditing, type = "text", icon: Icon, disabled, displayValue }) {
    const finalDisplayValue = displayValue !== undefined ? displayValue : value;
    
    return (
        <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
            {isEditing && !disabled ? (
                <div className="relative">
                    <input 
                        type={type}
                        value={value || ""}
                        onChange={onChange}
                        className={`w-full rounded-lg border border-slate-300 ${Icon ? 'pl-9' : 'pl-3'} pr-3 py-2 text-sm focus:ring-2 focus:ring-red-100 focus:border-[#EB4C42] outline-none transition-all shadow-sm`}
                    />
                     {Icon && <Icon className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />}
                </div>
            ) : (
                <div className={`flex items-center gap-2 p-2.5 ${disabled ? 'bg-slate-50/50' : 'bg-slate-50'} rounded-lg border border-slate-100`}>
                    {Icon && <Icon className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-800'} truncate`}>{finalDisplayValue || "-"}</span>
                </div>
            )}
        </div>
    )
}

function FormSelect({ label, value, onChange, isEditing, options = [], disabled }) {
    return (
        <div>
            <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">{label}</label>
            {isEditing && !disabled ? (
                 <div className="relative">
                    <select 
                        value={value || ""}
                        onChange={onChange}
                        className="w-full rounded-lg border border-slate-300 pl-3 pr-8 py-2 text-sm focus:ring-2 focus:ring-red-100 focus:border-[#EB4C42] outline-none transition-all appearance-none bg-white cursor-pointer shadow-sm"
                    >
                        <option value="">- Pilih -</option>
                        {options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                 </div>
            ) : (
                <div className="flex items-center gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                    <span className={`text-sm font-medium ${disabled ? 'text-slate-500' : 'text-slate-800'}`}>{value || "-"}</span>
                </div>
            )}
        </div>
    )
}