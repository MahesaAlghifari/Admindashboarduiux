import { useState, useEffect } from "react";
import {
  MagnifyingGlassIcon,
  CheckCircleIcon,
  XCircleIcon,
  XMarkIcon,
  BriefcaseIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PencilSquareIcon,
  ArrowDownTrayIcon
} from "@heroicons/react/24/outline";

// --- IMPORT DATA DUMMY ---
import { DATA_SISWA_DUMMY, DATA_KELAS_DUMMY } from "../../data/dummySiswa"; 
import { DATA_STAFF_DUMMY } from "../../data/dummyStaff"; 

// --- 1. UTILS & STYLES ---
const FontStyles = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #ffffff; }
  `}</style>
);

// --- HELPER: GENERATOR KREDENSIAL (PASS = TGL LAHIR) ---
const generateNewCredential = (nama, nomorInduk, tanggalLahir) => {
  const cleanNameFull = nama ? nama.toLowerCase().replace(/[^a-z0-9]/g, "") : "user";
  
  // Logic Password: Ubah Tanggal Lahir (YYYY-MM-DD) menjadi DDMMYYYY
  let defaultPass = "123456"; // Fallback jika tgl lahir kosong
  
  if (tanggalLahir) {
    // Cek apakah formatnya YYYY-MM-DD (standard JSON/SQL)
    const parts = tanggalLahir.split('-'); // [YYYY, MM, DD]
    if (parts.length === 3) {
        // Gabungkan jadi DDMMYYYY
        defaultPass = `${parts[2]}${parts[1]}${parts[0]}`;
    } else {
        // Jika format lain, ambil angkanya saja
        defaultPass = tanggalLahir.replace(/[^0-9]/g, '');
    }
  }

  return {
    username: cleanNameFull,
    nik: nomorInduk, 
    password: defaultPass
  };
};

const ALL_STATUS_OPTIONS = {
  Siswa: ["Aktif", "Lulus", "Pindah", "Dikeluarkan"],
  Staff: ["Aktif", "Cuti", "Non-Aktif/Keluar"],
};

const KELAS_OPTIONS = DATA_KELAS_DUMMY.map(k => k.nama).sort();
const TABS = ["Siswa Aktif", "Siswa Nonaktif", "Staff"];

export default function UserManagement() {
  // --- 2. STATE ---
  const [users, setUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("Siswa Aktif");
  const [search, setSearch] = useState("");
  
  // STATE FILTER
  const [filterAkses, setFilterAkses] = useState("all"); 
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterKelas, setFilterKelas] = useState("all"); 

  // PAGINATION
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [form, setForm] = useState({
    status_utama: "",
    kelas: "",
    username: "",
    nik: "",
    password: "",
    is_active: true
  });

  // --- 3. INIT DATA (LOAD AWAL) ---
  useEffect(() => {
    const mappedSiswa = DATA_SISWA_DUMMY.map((siswa) => {
      const nama = siswa.peserta_didik.nama_lengkap;
      const nisn = siswa.peserta_didik.nomor_induk || "-";
      const tglLahir = siswa.peserta_didik.tanggal_lahir || "2020-01-01"; // Ambil Tgl Lahir
      
      const kelasObj = DATA_KELAS_DUMMY.find(k => k.id === siswa.class_id);
      const namaKelas = kelasObj ? kelasObj.nama : "-";
      
      const creds = generateNewCredential(nama, nisn, tglLahir); 

      return {
        unique_id: `siswa_${siswa.id}`,
        original_id: siswa.id,
        role: "Siswa",
        nama: nama,
        nomor_induk: nisn,
        tgl_lahir: tglLahir, // Simpan untuk referensi
        kelas: namaKelas,
        jabatan: "Siswa",
        status_utama: "Aktif", 
        username: creds.username, 
        nik: nisn, 
        password: creds.password, 
        is_active: true
      };
    });

    const mappedStaff = DATA_STAFF_DUMMY.map((staff) => {
      const nama = staff.pribadi.nama_lengkap;
      const nip = staff.pribadi.nip || staff.pribadi.nik || "-";
      const tglLahir = staff.pribadi.tanggal_lahir || "1990-01-01"; // Ambil Tgl Lahir Staff

      const creds = generateNewCredential(nama, nip, tglLahir);

      return {
        unique_id: `staff_${staff.id}`,
        original_id: staff.id,
        role: "Staff",
        nama: nama,
        nomor_induk: nip,
        tgl_lahir: tglLahir, // Simpan untuk referensi
        kelas: "-", 
        jabatan: staff.kepegawaian?.jabatan || "Guru Mapel",
        status_utama: staff.kepegawaian?.status_kepegawaian || "Aktif",
        username: creds.username, 
        nik: nip, 
        password: creds.password, 
        is_active: true
      };
    });

    setUsers([...mappedSiswa, ...mappedStaff]);
  }, []);

  useEffect(() => {
    setFilterStatus("all"); 
    setFilterKelas("all");
    setSearch("");
    setCurrentPage(1);
  }, [activeTab]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterAkses, filterStatus, filterKelas, itemsPerPage]);

  // --- 4. LOGIC FILTER ---
  const filteredUsers = users.filter(u => {
    let matchTab = false;
    if (activeTab === "Siswa Aktif") matchTab = u.role === "Siswa" && u.status_utama === "Aktif";
    else if (activeTab === "Siswa Nonaktif") matchTab = u.role === "Siswa" && u.status_utama !== "Aktif";
    else if (activeTab === "Staff") matchTab = u.role === "Staff";

    const matchSearch = u.nama.toLowerCase().includes(search.toLowerCase()) || 
                        u.nomor_induk.includes(search) || 
                        u.username.includes(search) ||
                        u.nik.includes(search);
    
    let matchAkses = true;
    if (filterAkses === "active") matchAkses = u.is_active === true;
    if (filterAkses === "inactive") matchAkses = u.is_active === false;

    let matchStatus = true;
    if (filterStatus !== "all" && activeTab !== "Siswa Aktif") matchStatus = u.status_utama === filterStatus;

    let matchKelas = true;
    if (u.role === "Siswa" && filterKelas !== "all") matchKelas = u.kelas === filterKelas;

    return matchTab && matchSearch && matchAkses && matchStatus && matchKelas;
  });

  // --- 5. PAGINATION ---
  const totalItems = filteredUsers.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // --- 6. HANDLERS ---
  const handleEdit = (user) => {
    setSelectedUser(user);
    setForm({
      status_utama: user.status_utama,
      kelas: user.kelas,
      username: user.username,
      nik: user.nik || user.nomor_induk,
      password: user.password,
      is_active: user.is_active
    });
    setIsModalOpen(true);
  };

  const generateSingleCreds = () => {
    if(!selectedUser) return;
    // Panggil generator dengan tanggal lahir user yang sedang diedit
    const newCreds = generateNewCredential(selectedUser.nama, selectedUser.nomor_induk, selectedUser.tgl_lahir);
    setForm(prev => ({ ...prev, ...newCreds }));
  };

  const handleSave = () => {
    setUsers(users.map(u => {
      if (u.unique_id === selectedUser.unique_id) {
        return {
          ...u,
          status_utama: form.status_utama,
          kelas: form.kelas,
          username: form.username,
          nik: form.nik,
          password: form.password,
          is_active: form.is_active
        };
      }
      return u;
    }));
    setIsModalOpen(false);
  };

  // --- DOWNLOAD JSON (Staff Only) ---
  const handleDownloadJSON = () => {
    const staffData = users
        .filter(u => u.role === "Staff")
        .map(u => ({
            id: u.original_id,
            nama: u.nama,
            nik: u.nik,       
            username: u.username,
            password: u.password, // Password sudah format DDMMYYYY
            role: "staff",   
            is_active: u.is_active
        }));

    const jsonString = JSON.stringify(staffData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const href = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = href;
    link.download = "staff-credentials.json";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 flex flex-col h-full animate-in fade-in duration-300">
      <FontStyles />

      {/* HEADER SECTION */}
      <div className="bg-white pb-6 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Manajemen Pengguna</h1>
                <p className="text-sm text-slate-500 mt-1">Kelola akses login (NIK & Tgl Lahir) dan status pengguna sekolah.</p>
            </div>
        </div>

        {/* FILTERS */}
        <div className="flex flex-col xl:flex-row gap-6 justify-between items-start xl:items-center border-t border-slate-100 pt-6">
            <div className="w-full xl:w-auto overflow-x-auto">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <div className="bg-slate-100 p-1 rounded-lg flex shrink-0">
                        {TABS.map((tab) => (
                            <button 
                                key={tab} 
                                onClick={() => setActiveTab(tab)} 
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                                    activeTab === tab 
                                    ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200" 
                                    : "text-slate-500 hover:text-slate-700"
                                }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="flex items-center gap-2">
                        {activeTab.includes("Siswa") && (
                            <select 
                                value={filterKelas} 
                                onChange={(e) => setFilterKelas(e.target.value)} 
                                className="pl-3 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#e94640] cursor-pointer"
                            >
                                <option value="all">Semua Kelas</option>
                                {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                            </select>
                        )}
                        <select 
                            value={filterAkses} 
                            onChange={(e) => setFilterAkses(e.target.value)} 
                            className="pl-3 pr-8 py-1.5 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#e94640] cursor-pointer"
                        >
                            <option value="all">Semua Akses</option>
                            <option value="active">Login Aktif</option>
                            <option value="inactive">Login Nonaktif</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-3 w-full xl:w-auto">
                {/* SEARCH */}
                <div className="relative w-full xl:w-64">
                    <input 
                        type="text" 
                        placeholder="Cari Nama/NIK/Username..." 
                        value={search} 
                        onChange={(e) => setSearch(e.target.value)} 
                        className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg outline-none focus:border-[#e94640] transition-all shadow-sm" 
                    />
                    <MagnifyingGlassIcon className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
                </div>
                
                {/* TOMBOL EXPORT JSON */}
                <button 
                    onClick={handleDownloadJSON}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm whitespace-nowrap"
                    title="Download Data Staff untuk Login"
                >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    JSON Staff
                </button>
            </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="flex-1 relative border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
        <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50 sticky top-0 z-10">
                <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pengguna</th>
                    {activeTab.includes("Siswa") && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Kelas</th>}
                    {activeTab === "Staff" && <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Jabatan</th>}
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">ID Login (NIK)</th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">Akses</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Aksi</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
                {paginatedData.map((user) => (
                <tr key={user.unique_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-slate-800">{user.nama}</div>
                        <div className="text-xs text-slate-500 font-mono mt-0.5">{user.nomor_induk}</div>
                    </td>

                    {activeTab.includes("Siswa") && (
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                                {user.kelas}
                            </span>
                        </td>
                    )}

                    {activeTab === "Staff" && (
                        <td className="px-6 py-4">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                <BriefcaseIcon className="h-3.5 w-3.5 text-slate-500" />
                                {user.jabatan}
                            </span>
                        </td>
                    )}

                    <td className="px-6 py-4"><StatusBadge status={user.status_utama} /></td>
                    
                    <td className="px-6 py-4">
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-slate-700">{user.nik || "-"}</span>
                            {user.username && <span className="text-[10px] text-slate-400 font-mono">user: {user.username}</span>}
                        </div>
                    </td>
                    
                    <td className="px-6 py-4 text-center">
                    {user.is_active ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100 uppercase"><CheckCircleIcon className="h-3 w-3" /> Aktif</span>
                    ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200 uppercase"><XCircleIcon className="h-3 w-3" /> Off</span>
                    )}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                        <button onClick={() => handleEdit(user)} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 text-xs font-medium hover:border-[#e94640] hover:text-[#e94640] hover:bg-red-50 transition-all">
                            <PencilSquareIcon className="h-4 w-4" /> Edit
                        </button>
                    </td>
                </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* PAGINATION FOOTER */}
      {totalItems > 0 && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between">
            <div className="text-xs text-slate-500">
                Menampilkan <span className="font-bold">{startIndex + 1}</span> - <span className="font-bold">{Math.min(startIndex + itemsPerPage, totalItems)}</span> dari <span className="font-bold">{totalItems}</span> data
            </div>
            <div className="flex items-center gap-4">
                <button onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"><ChevronLeftIcon className="h-4 w-4" /></button>
                <span className="text-xs text-slate-600 font-medium">Halaman {currentPage} dari {totalPages}</span>
                <button onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-1.5 rounded hover:bg-slate-100 disabled:opacity-30 text-slate-500"><ChevronRightIcon className="h-4 w-4" /></button>
            </div>
        </div>
      )}

      {/* MODAL EDIT */}
      {isModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800">Edit Akses & Status</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600"><XMarkIcon className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-5">
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <div className="text-sm font-bold text-slate-800">{selectedUser.nama}</div>
                <div className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                    <span className="bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono">{selectedUser.nomor_induk}</span>
                    <span>•</span>
                    <span>{selectedUser.role}</span>
                    {selectedUser.tgl_lahir && (
                        <>
                        <span>•</span>
                        <span className="text-slate-400">Lahir: {selectedUser.tgl_lahir}</span>
                        </>
                    )}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div className={selectedUser.role === 'Staff' ? 'col-span-2' : ''}>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Status Aktif</label>
                    <select value={form.status_utama} onChange={(e) => setForm({...form, status_utama: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#e94640] outline-none">
                      {ALL_STATUS_OPTIONS[selectedUser.role].map(opt => <option key={opt} value={opt}>{opt}</option>)}
                    </select>
                  </div>
                  {selectedUser.role === "Siswa" && (
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5">Kelas</label>
                        <select value={form.kelas} onChange={(e) => setForm({...form, kelas: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#e94640] outline-none">
                          {KELAS_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
                        </select>
                      </div>
                  )}
              </div>

              <div className="pt-2 border-t border-slate-100">
                <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-bold text-slate-500 uppercase">Kredensial Login</label>
                    <button onClick={generateSingleCreds} className="text-[10px] font-bold text-[#e94640] hover:underline" title="Reset ke Default: Tgl Lahir (DDMMYYYY)">Auto-Fill (Reset Password)</button>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-[10px] text-slate-400 mb-1">NIK / ID LOGIN</p>
                        <input type="text" value={form.nik} onChange={(e) => setForm({...form, nik: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#e94640] outline-none" placeholder="Masukkan NIK" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1">USERNAME</p>
                            <input type="text" value={form.username} onChange={(e) => setForm({...form, username: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#e94640] outline-none" placeholder="Username" />
                        </div>
                        <div>
                            <p className="text-[10px] text-slate-400 mb-1">PASSWORD (Default: DDMMYYYY)</p>
                            <input type="text" value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-[#e94640] outline-none font-mono" placeholder="Password" />
                        </div>
                    </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-sm font-medium text-slate-700">Izinkan Login ke Dashboard?</span>
                <button 
                  onClick={() => setForm({...form, is_active: !form.is_active})}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${form.is_active ? 'bg-[#e94640]' : 'bg-slate-300'}`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-white">Batal</button>
              <button onClick={handleSave} className="px-4 py-2 rounded-lg bg-[#e94640] text-white text-sm font-semibold hover:bg-[#d63d38] transition-all">Simpan Perubahan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  let colorClass = "bg-slate-100 text-slate-600 border-slate-200";
  switch (status) {
    case "Aktif": colorClass = "bg-emerald-50 text-emerald-700 border-emerald-100"; break;
    case "Lulus": colorClass = "bg-blue-50 text-blue-700 border-blue-100"; break;
    case "Cuti": colorClass = "bg-amber-50 text-amber-700 border-amber-100"; break;
    case "Dikeluarkan":
    case "Non-Aktif/Keluar": colorClass = "bg-rose-50 text-rose-700 border-rose-100"; break;
    default: break;
  }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wide ${colorClass}`}>
      {status}
    </span>
  );
}