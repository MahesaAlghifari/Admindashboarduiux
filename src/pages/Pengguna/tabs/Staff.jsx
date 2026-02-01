import { useState, useEffect } from "react";
import {
    EyeIcon,
    PencilSquareIcon,
    TrashIcon,
    PlusIcon,
    XMarkIcon,
    UserCircleIcon,
    FunnelIcon,
    ChevronLeftIcon,
    ChevronRightIcon,
    BriefcaseIcon,
    PhotoIcon // Icon baru untuk placeholder foto
} from "@heroicons/react/24/outline";
import { DATA_STAFF_DUMMY } from "../../../data/dummyStaff";
import {
    // ... icon lainnya
    ArrowUpTrayIcon // <--- TAMBAHKAN INI
} from "@heroicons/react/24/outline";
// --- 1. STYLES & CONSTANTS ---
const FontStyles = () => (
    <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    body { font-family: 'Inter', sans-serif; background-color: #F8FAFC; }
    ::-webkit-scrollbar { width: 8px; height: 8px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 4px; }
    ::-webkit-scrollbar-thumb:hover { background: #94A3B8; }
  `}</style>
);

const LIST_JABATAN = [
    "Pembina", "Ketua Yayasan", "Sekretaris Yayasan", "Bendahara Yayasan",
    "Pengawas Yayasan", "Kepala Sekolah", "Wakil Kepala Sekolah",
    "Guru", "Staff", "Lainnya",
];

const INITIAL_STATE = {
    id: null,
    pribadi: {
        nama_lengkap: "",
        nip: "",
        nik: "",
        tempat_lahir: "",
        tanggal_lahir: "",
        jenis_kelamin: "Laki-laki",
        agama: "Islam",
        pendidikan_terakhir: "S1",
        alamat_lengkap: "",
        foto: "", // VARIABEL BARU
    },
    kepegawaian: {
        jabatan: "Guru",
        tanggal_bergabung: "",
        gaji_pokok: "",
    },
    kontak: {
        no_hp: "62",
        email: "",
    },
};

const TABS = [
    { id: "tab_pribadi", label: "Data Pribadi" },
    { id: "tab_kepegawaian", label: "Kepegawaian" },
    { id: "tab_kontak", label: "Kontak" },
];

// --- 2. MAIN COMPONENT ---
export default function Staff() {
    const [data, setData] = useState(DATA_STAFF_DUMMY);
    const [keyword, setKeyword] = useState("");
    const [selectedJabatan, setSelectedJabatan] = useState("");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    const [openModal, setOpenModal] = useState(false);
    const [openView, setOpenView] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [selected, setSelected] = useState(null);
    const [activeTab, setActiveTab] = useState("tab_pribadi");
    const [form, setForm] = useState(INITIAL_STATE);

    // Filter Logic
    const filtered = data.filter((item) => {
        const nameMatch = item.pribadi.nama_lengkap.toLowerCase().includes(keyword.toLowerCase());
        const jabatanMatch = selectedJabatan ? item.kepegawaian.jabatan === selectedJabatan : true;
        return nameMatch && jabatanMatch;
    });

    // Pagination Logic
    const totalItems = filtered.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filtered.slice(startIndex, endIndex);

    const getPaginationGroup = () => {
        if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
        let start = Math.max(1, currentPage - 2);
        let end = Math.min(totalPages, start + 4);
        if (end - start < 4) start = Math.max(1, end - 4);
        const pages = [];
        for (let i = start; i <= end; i++) pages.push(i);
        return pages;
    };

    useEffect(() => {
        setCurrentPage(1);
    }, [keyword, itemsPerPage, selectedJabatan]);

    const handleAdd = () => {
        setForm(JSON.parse(JSON.stringify(INITIAL_STATE)));
        setIsEdit(false);
        setActiveTab("tab_pribadi");
        setOpenModal(true);
    };

    const handleEdit = (item) => {
        setForm(JSON.parse(JSON.stringify(item)));
        setIsEdit(true);
        setActiveTab("tab_pribadi");
        setOpenModal(true);
    };

    const handleView = (item) => {
        setSelected(item);
        setActiveTab("tab_pribadi");
        setOpenView(true);
    };

    const handleDelete = (id) => {
        if (confirm("Yakin hapus data staff ini?")) {
            setData(data.filter((item) => item.id !== id));
        }
    };

    const handleSave = () => {
        if (isEdit) {
            setData(data.map((item) => (item.id === form.id ? form : item)));
        } else {
            // Gunakan placeholder avatar jika foto kosong saat tambah baru
            const newStaff = { ...form, id: Date.now() };
            if (!newStaff.pribadi.foto) {
                newStaff.pribadi.foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.pribadi.nama_lengkap)}&background=random`;
            }
            setData([...data, newStaff]);
        }
        setOpenModal(false);
    };

    const updateForm = (path, value) => {
        setForm((prev) => {
            const newState = { ...prev };
            let current = newState;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newState;
        });
    };

    return (
        <div className="md:p-4 text-slate-800">
            <FontStyles />

            {/* HEADER */}
            <div className="max-w-8xl mx-auto mb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Staff & Guru</h1>
                        <p className="text-slate-500 mt-1">Kelola data kepegawaian, guru, dan staff tata usaha.</p>
                    </div>
                    <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                        {/* Filter Jabatan */}
                        <div className="relative w-full md:w-56 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BriefcaseIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#e94640]" />
                            </div>
                            <select
                                value={selectedJabatan}
                                onChange={(e) => setSelectedJabatan(e.target.value)}
                                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-[#e94640] focus:ring-4 focus:ring-[#e94640]/10 outline-none shadow-sm transition-all appearance-none cursor-pointer"
                            >
                                <option value="">Semua Jabatan</option>
                                {LIST_JABATAN.map((jabatan) => (
                                    <option key={jabatan} value={jabatan}>{jabatan}</option>
                                ))}
                            </select>
                            <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="relative w-full md:w-72 group">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FunnelIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#e94640]" />
                            </div>
                            <input
                                type="text"
                                placeholder="Cari nama staff / NIP..."
                                value={keyword}
                                onChange={(e) => setKeyword(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#e94640] focus:ring-4 focus:ring-[#e94640]/10 outline-none shadow-sm transition-all"
                            />
                        </div>

                        {/* Add Button */}
                        <button
                            onClick={handleAdd}
                            className="flex items-center justify-center gap-2 rounded-xl bg-[#e94640] px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#e94640]/20 hover:bg-[#d63d38] active:scale-95 transition-all"
                        >
                            <PlusIcon className="h-5 w-5" />
                            <span>Tambah</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TABLE */}
            <div className="max-w-8xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-slate-50/80">
                            <tr>
                                {["NIP / NIK", "Nama Lengkap", "Jabatan", "No. HP", "Aksi"].map((h) => (
                                    <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {paginatedData.map((item) => (
                                <tr key={item.id} className="hover:bg-[#e94640]/5 transition-colors group">
                                    <td className="px-6 py-4 text-sm font-mono text-slate-500">
                                        {item.pribadi.nip || item.pribadi.nik || "-"}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium text-slate-700">
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col">
                                                <span>{item.pribadi.nama_lengkap}</span>
                                                <span className="text-xs text-slate-400 font-normal md:hidden">{item.kepegawaian.jabatan}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-600">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                                            {item.kepegawaian.jabatan}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-slate-500">
                                        <PhoneDisplay value={item.kontak.no_hp} />
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-start gap-2">
                                            <ActionButton onClick={() => handleView(item)} icon={<EyeIcon className="h-5 w-5" />} colorClass="text-slate-400 hover:text-[#e94640] hover:bg-[#e94640]/10" />
                                            <ActionButton onClick={() => handleEdit(item)} icon={<PencilSquareIcon className="h-5 w-5" />} colorClass="text-slate-400 hover:text-amber-600 hover:bg-amber-50" />
                                            <ActionButton onClick={() => handleDelete(item.id)} icon={<TrashIcon className="h-5 w-5" />} colorClass="text-slate-400 hover:text-rose-600 hover:bg-rose-50" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {paginatedData.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-16 text-center text-slate-400">
                                        <div className="flex flex-col items-center">
                                            <UserCircleIcon className="h-12 w-12 mb-2 opacity-50" />
                                            <p className="text-sm font-medium">
                                                {data.length === 0 ? "Belum ada data staff." : "Tidak ditemukan data yang cocok."}
                                            </p>
                                            {data.length === 0 && (
                                                <button onClick={handleAdd} className="mt-4 text-[#e94640] hover:underline text-sm font-medium">Tambah Staff Baru</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* PAGINATION FOOTER */}
                {totalItems > 0 && (
                    <div className="border-t border-slate-200 bg-slate-50/50 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>Tampilkan</span>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                                className="bg-white border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-[#e94640] focus:border-[#e94640] block w-16 p-1.5 cursor-pointer outline-none"
                            >
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                            </select>
                            <span>data</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-slate-500 hidden md:block">
                                {Math.min(startIndex + 1, totalItems)} - {Math.min(endIndex, totalItems)} dari {totalItems}
                            </span>
                            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                                <button
                                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="p-2.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50 border-r border-slate-100"
                                >
                                    <ChevronLeftIcon className="h-4 w-4" />
                                </button>
                                {getPaginationGroup().map((pageNumber) => (
                                    <button
                                        key={pageNumber}
                                        onClick={() => setCurrentPage(pageNumber)}
                                        className={`px-3.5 py-2 text-sm font-medium border-r border-slate-100 last:border-r-0 ${currentPage === pageNumber ? "bg-[#e94640] text-white" : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        {pageNumber}
                                    </button>
                                ))}
                                <button
                                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="p-2.5 text-slate-500 hover:bg-slate-50 disabled:opacity-50"
                                >
                                    <ChevronRightIcon className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* MODAL ADD / EDIT */}
            {openModal && (
                <ModalLayout
                    title={isEdit ? "Edit Data Staff" : "Tambah Staff Baru"}
                    onClose={() => setOpenModal(false)}
                    footer={
                        <>
                            <button onClick={() => setOpenModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Batal</button>
                            <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-[#e94640] text-white text-sm font-semibold shadow-md shadow-[#e94640]/20 hover:bg-[#d63d38] transition-all">Simpan</button>
                        </>
                    }
                >
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
                    <div className="p-6 md:p-8">
                        <FormContent activeTab={activeTab} form={form} updateForm={updateForm} />
                    </div>
                </ModalLayout>
            )}

            {/* MODAL VIEW */}
            {openView && selected && (
                <ModalLayout
                    title="Detail Staff"
                    onClose={() => setOpenView(false)}
                    footer={
                        <button onClick={() => setOpenView(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Tutup</button>
                    }
                >
                    <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} tabs={TABS} />
                    <div className="p-6 md:p-8">
                        <ViewContent activeTab={activeTab} data={selected} />
                    </div>
                </ModalLayout>
            )}
        </div>
    );
}

// --- 3. SUB-COMPONENTS & FORM CONTENT ---

function FormContent({ activeTab, form, updateForm }) {

    // Logic untuk menangani upload file & preview gambar
    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Membuat URL sementara dari file lokal agar bisa dipreview
            const previewUrl = URL.createObjectURL(file);
            updateForm(['pribadi', 'foto'], previewUrl);
        }
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            {activeTab === "tab_pribadi" && (
                <>
                    <Section title="Identitas Pribadi">

                        {/* --- BAGIAN FOTO UPLOAD --- */}
                        <div className="mb-6 flex items-center gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
                            {/* Area Preview Foto */}
                            <div className="h-24 w-24 shrink-0 rounded-full bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center relative group">
                                {form.pribadi.foto ? (
                                    <img
                                        src={form.pribadi.foto}
                                        alt="Preview"
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="text-center p-2">
                                        <PhotoIcon className="h-8 w-8 text-slate-300 mx-auto" />
                                    </div>
                                )}
                            </div>

                            {/* Area Tombol Upload */}
                            <div className="flex-1">
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Profil</label>
                                <p className="text-xs text-slate-500 mb-3">Format: JPG, PNG. Maksimal 2MB.</p>

                                <div className="flex items-center gap-3">
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-slate-300 hover:text-[#e94640] transition-all shadow-sm"
                                    >
                                        <ArrowUpTrayIcon className="h-4 w-4" />
                                        Pilih File
                                        <input
                                            id="file-upload"
                                            name="file-upload"
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                        />
                                    </label>

                                    {/* Tombol Hapus Foto (Opsional) */}
                                    {form.pribadi.foto && (
                                        <button
                                            onClick={() => updateForm(['pribadi', 'foto'], "")}
                                            className="text-xs text-red-500 hover:text-red-700 font-medium"
                                        >
                                            Hapus Foto
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                        {/* --- END BAGIAN FOTO --- */}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <Input label="Nama Lengkap" value={form.pribadi.nama_lengkap} onChange={(v) => updateForm(['pribadi', 'nama_lengkap'], v)} />
                            </div>
                            <Input label="NIP (Opsional)" value={form.pribadi.nip} onChange={(v) => updateForm(['pribadi', 'nip'], v)} />
                            <Input label="NIK (KTP)" type="number" value={form.pribadi.nik} onChange={(v) => updateForm(['pribadi', 'nik'], v)} />
                            <RadioGroup
                                label="Jenis Kelamin"
                                options={['Laki-laki', 'Perempuan']}
                                value={form.pribadi.jenis_kelamin}
                                onChange={(v) => updateForm(['pribadi', 'jenis_kelamin'], v)}
                            />
                            <Input label="Agama" value={form.pribadi.agama} onChange={(v) => updateForm(['pribadi', 'agama'], v)} />
                            <Input label="Tempat Lahir" value={form.pribadi.tempat_lahir} onChange={(v) => updateForm(['pribadi', 'tempat_lahir'], v)} />
                            <Input label="Tanggal Lahir" type="date" value={form.pribadi.tanggal_lahir} onChange={(v) => updateForm(['pribadi', 'tanggal_lahir'], v)} />
                            <Select
                                label="Pendidikan Terakhir"
                                options={['SMA/SMK', 'D3', 'S1', 'S2', 'S3', 'Lainnya']}
                                value={form.pribadi.pendidikan_terakhir}
                                onChange={(v) => updateForm(['pribadi', 'pendidikan_terakhir'], v)}
                            />
                        </div>
                    </Section>
                </>
            )}

            {activeTab === "tab_kepegawaian" && (
                <Section title="Data Kepegawaian">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Select
                            label="Jabatan"
                            options={LIST_JABATAN}
                            value={form.kepegawaian.jabatan}
                            onChange={(v) => updateForm(['kepegawaian', 'jabatan'], v)}
                        />
                        <Input label="Tanggal Bergabung" type="date" value={form.kepegawaian.tanggal_bergabung} onChange={(v) => updateForm(['kepegawaian', 'tanggal_bergabung'], v)} />
                        <Input label="Gaji Pokok" type="number" value={form.kepegawaian.gaji_pokok} onChange={(v) => updateForm(['kepegawaian', 'gaji_pokok'], v)} placeholder="Rp" />
                    </div>
                </Section>
            )}

            {activeTab === "tab_kontak" && (
                <Section title="Kontak Dihubungi">
                    <div className="grid grid-cols-1 gap-6">
                        <PhoneInput label="Nomor HP (WhatsApp)" value={form.kontak.no_hp} onChange={(v) => updateForm(['kontak', 'no_hp'], v)} />
                        <Input label="Alamat Email" type="email" value={form.kontak.email} onChange={(v) => updateForm(['kontak', 'email'], v)} placeholder="contoh@sekolah.sch.id" />
                    </div>
                    <div className="mt-6">
                        <TextArea label="Alamat Lengkap" value={form.pribadi.alamat_lengkap} onChange={(v) => updateForm(['pribadi', 'alamat_lengkap'], v)} />
                    </div>
                </Section>
            )}
        </div>
    );
}

function ViewContent({ activeTab, data }) {
    const formatCurrency = (val) => {
        if (!val) return "-";
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(val);
    };

    return (
        <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">
            {activeTab === "tab_pribadi" && (
                <Section title="Data Pribadi">
                    {/* FOTO DI VIEW DETAIL */}
                    <div className="flex flex-col md:flex-row gap-8 mb-8">
                        <div className="shrink-0 flex justify-center md:justify-start">
                            <div className="h-32 w-32 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
                                {data.pribadi.foto ? (
                                    <img src={data.pribadi.foto} alt="Foto Profil" className="h-full w-full object-cover" />
                                ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                                        <UserCircleIcon className="h-16 w-16" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="grow">
                            <ViewGrid>
                                <ViewItem label="Nama Lengkap" value={data.pribadi.nama_lengkap} span2 />
                                <ViewItem label="NIP" value={data.pribadi.nip} />
                                <ViewItem label="NIK" value={data.pribadi.nik} />
                                <ViewItem label="TTL" value={`${data.pribadi.tempat_lahir}, ${data.pribadi.tanggal_lahir}`} />
                                <ViewItem label="Jenis Kelamin" value={data.pribadi.jenis_kelamin} />
                                <ViewItem label="Agama" value={data.pribadi.agama} />
                                <ViewItem label="Pendidikan" value={data.pribadi.pendidikan_terakhir} />
                                <ViewItem label="Alamat" value={data.pribadi.alamat_lengkap} span2 />
                            </ViewGrid>
                        </div>
                    </div>
                </Section>
            )}
            {activeTab === "tab_kepegawaian" && (
                <Section title="Kepegawaian">
                    <ViewGrid>
                        <ViewItem label="Jabatan" value={data.kepegawaian.jabatan} />
                        <ViewItem label="Tgl Bergabung" value={data.kepegawaian.tanggal_bergabung} />
                        <ViewItem label="Gaji Pokok" value={formatCurrency(data.kepegawaian.gaji_pokok)} />
                    </ViewGrid>
                </Section>
            )}
            {activeTab === "tab_kontak" && (
                <Section title="Kontak">
                    <ViewGrid>
                        <ViewItem label="Nomor HP" value={<PhoneDisplay value={data.kontak.no_hp} />} />
                        <ViewItem label="Email" value={data.kontak.email} />
                    </ViewGrid>
                </Section>
            )}
        </div>
    );
}

// --- SHARED UI HELPER COMPONENTS ---

function ActionButton({ onClick, icon, colorClass }) {
    return <button onClick={onClick} className={`p-1.5 rounded-lg transition-all ${colorClass}`}>{icon}</button>;
}

function PhoneDisplay({ value }) {
    if (!value) return "-";
    const raw = value.toString();
    let formatted = "";
    if (raw.length < 3) formatted = "+" + raw;
    else if (raw.length < 6) formatted = `+${raw.slice(0, 2)} ${raw.slice(2)}`;
    else if (raw.length < 10) formatted = `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5)}`;
    else formatted = `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 9)} ${raw.slice(9)}`;
    return <span>{formatted}</span>;
}

function TabNavigation({ activeTab, setActiveTab, tabs }) {
    return (
        <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 pt-2">
            <div className="flex gap-6 overflow-x-auto pb-px scrollbar-hide">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`whitespace-nowrap pb-3 text-sm font-medium border-b-2 transition-all duration-200 ${activeTab === tab.id ? "border-[#e94640] text-[#e94640]" : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
        </div>
    );
}

function ModalLayout({ title, onClose, footer, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 transition-opacity">
            <div className="flex max-h-[90vh] w-full max-w-4xl flex-col rounded-2xl bg-white shadow-2xl overflow-hidden ring-1 ring-slate-900/5">
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5 bg-white">
                    <h2 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h2>
                    <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all"><XMarkIcon className="h-5 w-5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto bg-white scrollbar-thin">{children}</div>
                {footer && <div className="flex justify-end gap-3 border-t border-slate-100 bg-slate-50/50 px-6 py-4">{footer}</div>}
            </div>
        </div>
    );
}

function Section({ title, children }) {
    return (
        <div className="group">
            <div className="flex items-center gap-3 mb-5">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">{title}</h3>
                <div className="h-px flex-1 bg-slate-100 group-hover:bg-slate-200 transition-colors"></div>
            </div>
            <div className="px-1">{children}</div>
        </div>
    );
}

function Input({ label, value, onChange, type = "text", placeholder }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">{label}</label>
            <input type={type} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || `Masukkan ${label.toLowerCase()}...`} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 hover:bg-slate-100/50" />
        </div>
    );
}

function PhoneInput({ label, value, onChange }) {
    const formatPhoneDisplay = (val) => {
        if (!val) return "";
        const raw = val.toString();
        if (raw.length < 3) return "+" + raw;
        if (raw.length < 6) return `+${raw.slice(0, 2)} ${raw.slice(2)}`;
        if (raw.length < 10) return `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5)}`;
        return `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 9)} ${raw.slice(9)}`;
    };
    const handleInputChange = (e) => {
        let raw = e.target.value.replace(/\D/g, "");
        onChange(raw);
    };
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">{label}</label>
            <input type="text" value={formatPhoneDisplay(value)} onChange={handleInputChange} placeholder="+62 8xx xxxx xxxx" className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 hover:bg-slate-100/50" />
        </div>
    );
}

function TextArea({ label, value, onChange, placeholder }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">{label}</label>
            <textarea rows={3} value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder || `Masukkan ${label.toLowerCase()}...`} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 hover:bg-slate-100/50 resize-none" />
        </div>
    );
}

function Select({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">{label}</label>
            <div className="relative">
                <select value={value || ""} onChange={(e) => onChange(e.target.value)} className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 cursor-pointer hover:bg-slate-100/50">
                    {options.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-slate-500"><svg className="h-4 w-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg></div>
            </div>
        </div>
    );
}

function RadioGroup({ label, value, onChange, options }) {
    return (
        <div className="flex flex-col gap-2">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">{label}</label>
            <div className="flex items-center gap-6 w-full py-2.5">
                {options.map((opt) => (
                    <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
                        <input type="radio" name={label} value={opt} checked={value === opt} onChange={() => onChange(opt)} className="w-4 h-4 accent-[#e94640] cursor-pointer" />
                        <span className={`text-sm font-medium transition-colors ${value === opt ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"}`}>{opt}</span>
                    </label>
                ))}
            </div>
        </div>
    );
}

function ViewGrid({ children }) {
    return <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">{children}</div>;
}

function ViewItem({ label, value, span2 = false }) {
    return (
        <div className={`flex flex-col border-b border-slate-100 pb-3 group ${span2 ? 'md:col-span-2' : ''}`}>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
            <span className="text-base font-medium text-slate-800 leading-relaxed group-hover:text-[#e94640] transition-colors">{value || "-"}</span>
        </div>
    );
}