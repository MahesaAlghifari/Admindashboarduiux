import { useState, useEffect } from "react";
import {
  EyeIcon,
  PencilSquareIcon,
  TrashIcon,
  PlusIcon,
  XMarkIcon,
  UserCircleIcon,
  FunnelIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  PhotoIcon,       // Icon Baru
  ArrowUpTrayIcon  // Icon Baru
} from "@heroicons/react/24/outline";
import { DATA_SISWA_DUMMY } from "../../../data/dummySiswa";

// --- 1. STYLES & INITIAL STATE ---
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

const INITIAL_STATE = {
  id: null,
  peserta_didik: {
    nama_lengkap: "", nama_panggilan: "", jenis_kelamin: "Laki-laki", tempat_lahir: "", tanggal_lahir: "",
    agama: "", kewarganegaraan: "Indonesia", jumlah_saudara: { kandung: 0, tiri: 0, angkat: 0 },
    bahasa_sehari_hari: "", keadaan_jasmani: { berat_badan: "", tinggi_badan: "", golongan_darah: "", penyakit_pernah_diderita: "" },
    alamat_rumah: "", nomor_telepon: "62",
    status_tempat_tinggal: "", jarak_ke_sekolah: "", nomor_induk: "",
    foto: "", // FIELD BARU UNTUK FOTO
  },
  orang_tua_kandung: {
    ayah: { nama: "", pendidikan: "", pekerjaan: "" },
    ibu: { nama: "", pendidikan: "", pekerjaan: "" },
  },
  wali_peserta_didik: { nama: "", hubungan_keluarga: "", pendidikan_tertinggi: "", pekerjaan: "" },
  pendidikan_sebelumnya: { asal_peserta_didik: "", nama_lembaga: "", alamat_lembaga: "" },
  pindahan: { nama_lembaga_asal: "", alamat_lembaga_asal: "", kelompok_umur_sebelumnya: "" },
  diterima_di_lembaga: { tanggal_diterima: "", kelompok_umur: "" },
  perkembangan_peserta_didik: {
    prestasi_belajar: "",
    keadaan_jasmani: "",
    riwayat_perkembangan: [
      { tahun: "", berat_badan: "", tinggi_badan: "", penyakit: "", kelainan_jiwa: "" },
      { tahun: "", berat_badan: "", tinggi_badan: "", penyakit: "", kelainan_jiwa: "" },
      { tahun: "", berat_badan: "", tinggi_badan: "", penyakit: "", kelainan_jiwa: "" },
    ],
  },
  meninggalkan_lembaga: {
    tamat_belajar: { tahun_pelajaran: "", nomor_surat_keterangan: "", lembaga_lanjutan: "" },
    pindah_lembaga: { dari_kelompok_umur: "", ke_lembaga: "", tingkat_kelompok_umur: "", tanggal_pindah: "" },
    keluar_lembaga: { tanggal_keluar: "", alasan: "" },
  },
  lain_lain: { catatan_penting: "" },
};

const TABS = [
  { id: "section_a", label: "Keterangan Peserta Didik" },
  { id: "section_b", label: "Orang Tua / Wali" },
  { id: "section_c", label: "Perkembangan" },
  { id: "section_d", label: "Meninggalkan & Lainnya" },
];

// --- 2. MAIN COMPONENT ---
export default function Siswa() {
  const [data, setData] = useState(DATA_SISWA_DUMMY);
  const [keyword, setKeyword] = useState("");
  const [selectedYear, setSelectedYear] = useState("");

  // PAGINATION STATE
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [openModal, setOpenModal] = useState(false);
  const [openView, setOpenView] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selected, setSelected] = useState(null);
  const [activeTab, setActiveTab] = useState("section_a");
  const [form, setForm] = useState(INITIAL_STATE);

  // 1. Logic Filter (Search & Year)
  const filtered = data.filter((item) => {
    const nameMatch = item.peserta_didik.nama_lengkap.toLowerCase().includes(keyword.toLowerCase());
    const year = (item.diterima_di_lembaga.tanggal_diterima || "").split('-')[0];
    const yearMatch = selectedYear ? year === selectedYear : true;
    return nameMatch && yearMatch;
  });

  // 2. Logic Pagination Data Slicing
  const totalItems = filtered.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = filtered.slice(startIndex, endIndex);

  // 3. Logic Generate Nomor Halaman
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
  }, [keyword, selectedYear, itemsPerPage]);

  const uniqueYears = [...new Set(data.map(item =>
    (item.diterima_di_lembaga.tanggal_diterima || "").split('-')[0]
  ))].filter(Boolean).sort().reverse();

  const handleAdd = () => {
    setForm(JSON.parse(JSON.stringify(INITIAL_STATE)));
    setIsEdit(false);
    setActiveTab("section_a");
    setOpenModal(true);
  };

  const handleEdit = (item) => {
    const itemCopy = JSON.parse(JSON.stringify(item));
    if (!itemCopy.perkembangan_peserta_didik.riwayat_perkembangan || itemCopy.perkembangan_peserta_didik.riwayat_perkembangan.length < 3) {
      itemCopy.perkembangan_peserta_didik.riwayat_perkembangan = INITIAL_STATE.perkembangan_peserta_didik.riwayat_perkembangan;
    }
    setForm(itemCopy);
    setIsEdit(true);
    setActiveTab("section_a");
    setOpenModal(true);
  };

  const handleView = (item) => {
    setSelected(item);
    setActiveTab("section_a");
    setOpenView(true);
  };

  const handleDelete = (id) => {
    if (confirm("Yakin hapus data siswa ini?")) {
      setData(data.filter((item) => item.id !== id));
    }
  };

  const handleSave = () => {
    // Generate placeholder avatar if photo is empty
    if (!form.peserta_didik.foto) {
      form.peserta_didik.foto = `https://ui-avatars.com/api/?name=${encodeURIComponent(form.peserta_didik.nama_lengkap)}&background=random`;
    }

    if (isEdit) {
      setData(data.map((item) => (item.id === form.id ? form : item)));
    } else {
      setData([...data, { ...form, id: Date.now() }]);
    }
    setOpenModal(false);
  };

  const updateForm = (path, value) => {
    setForm((prev) => {
      const newState = { ...prev };
      let current = newState;
      for (let i = 0; i < path.length - 1; i++) {
        if (Array.isArray(current[path[i]])) {
          current[path[i]] = [...current[path[i]]];
        } else {
          current[path[i]] = { ...current[path[i]] };
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
      return newState;
    });
  };

  return (
    <div className=" md:p-4 text-slate-800 ">
      <FontStyles />

      {/* HEADER */}
      <div className="max-w-8xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Data Peserta Didik</h1>
            <p className="text-slate-500 mt-1">Kelola formulir siswa (Buku Induk).</p>
          </div>
          <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">

            {/* Filter Tahun */}
            <div className="relative w-full md:w-48 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <CalendarDaysIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#e94640]" />
              </div>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full pl-10 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:border-[#e94640] focus:ring-4 focus:ring-[#e94640]/10 outline-none shadow-sm transition-all appearance-none cursor-pointer"
              >
                <option value="">Semua Tahun</option>
                {uniqueYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-slate-500">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
              </div>
            </div>

            <div className="relative w-full md:w-72 group">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FunnelIcon className="h-5 w-5 text-slate-400 group-focus-within:text-[#e94640]" />
              </div>
              <input
                type="text"
                placeholder="Cari nama siswa..."
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-sm focus:border-[#e94640] focus:ring-4 focus:ring-[#e94640]/10 outline-none shadow-sm transition-all"
              />
            </div>

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

      {/* TABLE & PAGINATION CONTAINER */}
      <div className="max-w-8xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <div className="overflow-x-auto flex-1">
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50/80">
              <tr>
                {["Tanggal Diterima", "Nama Lengkap", "L/P", "NIS", "Nama Ibu", "Aksi"].map((h) => (
                  <th key={h} className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => (
                <tr key={item.id} className="hover:bg-[#e94640]/5 transition-colors group">
                  <td className="px-6 py-4 text-sm text-slate-400 text-xs">{item.diterima_di_lembaga.tanggal_diterima}</td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-700">
                    <div className="flex items-center gap-4">
                      <span>{item.peserta_didik.nama_lengkap}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span >
                      {item.peserta_didik.jenis_kelamin}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-500">{item.peserta_didik.nomor_induk || "-"}</td>
                  <td className="px-6 py-4 text-sm text-slate-600">{item.orang_tua_kandung.ibu.nama || "-"}</td>
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
                  <td colSpan="6" className="px-6 py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center">
                      <UserCircleIcon className="h-12 w-12 mb-2 opacity-50" />
                      <p className="text-sm font-medium">
                        {data.length === 0 ? "Belum ada data siswa." : "Tidak ditemukan data yang cocok."}
                      </p>
                      {data.length === 0 && (
                        <button onClick={handleAdd} className="mt-4 text-[#e94640] hover:underline text-sm font-medium">Tambah Siswa Baru</button>
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
                <option value={50}>50</option>
              </select>
              <span>data</span>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-slate-500 hidden md:block">
                Menampilkan <span className="font-semibold text-slate-700">{Math.min(startIndex + 1, totalItems)}</span> - <span className="font-semibold text-slate-700">{Math.min(endIndex, totalItems)}</span> dari <span className="font-semibold text-slate-700">{totalItems}</span> data
              </span>

              <div className="inline-flex items-center rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed border-r border-slate-100 transition-colors"
                >
                  <ChevronLeftIcon className="h-4 w-4" />
                </button>

                {getPaginationGroup().map((pageNumber) => (
                  <button
                    key={pageNumber}
                    onClick={() => setCurrentPage(pageNumber)}
                    className={`px-3.5 py-2 text-sm font-medium transition-colors border-r border-slate-100 last:border-r-0 
                      ${currentPage === pageNumber
                        ? "bg-[#e94640] text-white"
                        : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                  >
                    {pageNumber}
                  </button>
                ))}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="p-2.5 text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
          title={isEdit ? "Edit Data Siswa" : "Tambah Siswa Baru"}
          onClose={() => setOpenModal(false)}
          footer={
            <>
              <button onClick={() => setOpenModal(false)} className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">Batal</button>
              <button onClick={handleSave} className="px-5 py-2.5 rounded-xl bg-[#e94640] text-white text-sm font-semibold shadow-md shadow-[#e94640]/20 hover:bg-[#d63d38] transition-all">Simpan Perubahan</button>
            </>
          }
        >
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="p-6 md:p-8">
            <FormContent activeTab={activeTab} form={form} updateForm={updateForm} />
          </div>
        </ModalLayout>
      )}

      {/* MODAL VIEW */}
      {openView && selected && (
        <ModalLayout
          title="Detail Lengkap Peserta Didik"
          onClose={() => setOpenView(false)}
          footer={
            <button onClick={() => setOpenView(false)} className="px-6 py-2.5 rounded-xl bg-slate-100 text-slate-700 text-sm font-semibold hover:bg-slate-200 transition-colors">Tutup</button>
          }
        >
          <TabNavigation activeTab={activeTab} setActiveTab={setActiveTab} />
          <div className="p-6 md:p-8">
            <ViewContent activeTab={activeTab} data={selected} />
          </div>
        </ModalLayout>
      )}
    </div>
  );
}

// --- 4. FORM CONTENT (UPDATED WITH PHOTO) ---
function FormContent({ activeTab, form, updateForm }) {

  // Logic Preview Foto
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const previewUrl = URL.createObjectURL(file);
      updateForm(['peserta_didik', 'foto'], previewUrl);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">

      {/* SECTION A */}
      {activeTab === "section_a" && (
        <>
          <Section title="Identitas Dasar">

            {/* INPUT FOTO SECTION */}
            <div className="mb-6 flex items-center gap-6 bg-slate-50 p-5 rounded-xl border border-slate-100">
              <div className="h-24 w-24 shrink-0 rounded-full bg-white border-2 border-dashed border-slate-300 overflow-hidden flex items-center justify-center relative group">
                {form.peserta_didik.foto ? (
                  <img
                    src={form.peserta_didik.foto}
                    alt="Preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="text-center p-2">
                    <PhotoIcon className="h-8 w-8 text-slate-300 mx-auto" />
                  </div>
                )}
              </div>

              <div className="flex-1">
                <label className="block text-sm font-semibold text-slate-700 mb-1">Foto Siswa</label>
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

                  {form.peserta_didik.foto && (
                    <button
                      onClick={() => updateForm(['peserta_didik', 'foto'], "")}
                      className="text-xs text-red-500 hover:text-red-700 font-medium"
                    >
                      Hapus Foto
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input label="Nama Lengkap" value={form.peserta_didik.nama_lengkap} onChange={(v) => updateForm(['peserta_didik', 'nama_lengkap'], v)} />
              <Input label="Nama Panggilan" value={form.peserta_didik.nama_panggilan} onChange={(v) => updateForm(['peserta_didik', 'nama_panggilan'], v)} />
              <Input label="Nomor Induk" type="number" value={form.peserta_didik.nomor_induk} onChange={(v) => updateForm(['peserta_didik', 'nomor_induk'], v)} />
              <RadioGroup
                label="Jenis Kelamin"
                options={['Laki-laki', 'Perempuan']}
                value={form.peserta_didik.jenis_kelamin}
                onChange={(v) => updateForm(['peserta_didik', 'jenis_kelamin'], v)}
              />
              <Input label="Tempat Lahir" value={form.peserta_didik.tempat_lahir} onChange={(v) => updateForm(['peserta_didik', 'tempat_lahir'], v)} />
              <Input label="Tanggal Lahir" type="date" value={form.peserta_didik.tanggal_lahir} onChange={(v) => updateForm(['peserta_didik', 'tanggal_lahir'], v)} />
              <Input label="Agama" value={form.peserta_didik.agama} onChange={(v) => updateForm(['peserta_didik', 'agama'], v)} />
              <Input label="Kewarganegaraan" value={form.peserta_didik.kewarganegaraan} onChange={(v) => updateForm(['peserta_didik', 'kewarganegaraan'], v)} />
            </div>
          </Section>

          <Section title="Keluarga & Bahasa">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Input label="Saudara Kandung" type="number" value={form.peserta_didik.jumlah_saudara.kandung} onChange={(v) => updateForm(['peserta_didik', 'jumlah_saudara', 'kandung'], v)} />
              <Input label="Saudara Tiri" type="number" value={form.peserta_didik.jumlah_saudara.tiri} onChange={(v) => updateForm(['peserta_didik', 'jumlah_saudara', 'tiri'], v)} />
              <Input label="Saudara Angkat" type="number" value={form.peserta_didik.jumlah_saudara.angkat} onChange={(v) => updateForm(['peserta_didik', 'jumlah_saudara', 'angkat'], v)} />
            </div>
            <div className="mt-4">
              <Input label="Bahasa Sehari-hari" value={form.peserta_didik.bahasa_sehari_hari} onChange={(v) => updateForm(['peserta_didik', 'bahasa_sehari_hari'], v)} />
            </div>
          </Section>

          <Section title="Keadaan Jasmani">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <Input label="Berat Badan (kg)" type="number" value={form.peserta_didik.keadaan_jasmani.berat_badan} onChange={(v) => updateForm(['peserta_didik', 'keadaan_jasmani', 'berat_badan'], v)} />
              <Input label="Tinggi Badan (cm)" type="number" value={form.peserta_didik.keadaan_jasmani.tinggi_badan} onChange={(v) => updateForm(['peserta_didik', 'keadaan_jasmani', 'tinggi_badan'], v)} />
              <Input label="Golongan Darah" value={form.peserta_didik.keadaan_jasmani.golongan_darah} onChange={(v) => updateForm(['peserta_didik', 'keadaan_jasmani', 'golongan_darah'], v)} />
              <div className="md:col-span-1">
                <Input label="Penyakit diderita" value={form.peserta_didik.keadaan_jasmani.penyakit_pernah_diderita} onChange={(v) => updateForm(['peserta_didik', 'keadaan_jasmani', 'penyakit_pernah_diderita'], v)} />
              </div>
            </div>
          </Section>

          <Section title="Kontak">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 my-4">
              <PhoneInput
                label="No. Telepon / HP (WhatsApp)"
                value={form.peserta_didik.nomor_telepon}
                onChange={(v) => updateForm(['peserta_didik', 'nomor_telepon'], v)}
              />
              <Input label="Bertempat tinggal pada" placeholder="Orang tua/Wali/Asrama" value={form.peserta_didik.status_tempat_tinggal} onChange={(v) => updateForm(['peserta_didik', 'status_tempat_tinggal'], v)} />
              <Input label="Jarak ke Sekolah (km)" type="number" value={form.peserta_didik.jarak_ke_sekolah} onChange={(v) => updateForm(['peserta_didik', 'jarak_ke_sekolah'], v)} />
            </div>
            <TextArea label="Alamat Rumah" value={form.peserta_didik.alamat_rumah} onChange={(v) => updateForm(['peserta_didik', 'alamat_rumah'], v)} />
          </Section>
        </>
      )}

      {/* ... SECTION B, C, D tidak berubah ... */}
      {activeTab === "section_b" && (
        <>
          <Section title="Orang Tua Kandung">
            <div className="space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input label="Nama Ayah" value={form.orang_tua_kandung.ayah.nama} onChange={(v) => updateForm(['orang_tua_kandung', 'ayah', 'nama'], v)} />
                <Input label="Nama Ibu" value={form.orang_tua_kandung.ibu.nama} onChange={(v) => updateForm(['orang_tua_kandung', 'ibu', 'nama'], v)} />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input label="Pendidikan Ayah" value={form.orang_tua_kandung.ayah.pendidikan} onChange={(v) => updateForm(['orang_tua_kandung', 'ayah', 'pendidikan'], v)} />
                <Input label="Pendidikan Ibu" value={form.orang_tua_kandung.ibu.pendidikan} onChange={(v) => updateForm(['orang_tua_kandung', 'ibu', 'pendidikan'], v)} />
              </div>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <Input label="Pekerjaan Ayah" value={form.orang_tua_kandung.ayah.pekerjaan} onChange={(v) => updateForm(['orang_tua_kandung', 'ayah', 'pekerjaan'], v)} />
                <Input label="Pekerjaan Ibu" value={form.orang_tua_kandung.ibu.pekerjaan} onChange={(v) => updateForm(['orang_tua_kandung', 'ibu', 'pekerjaan'], v)} />
              </div>
            </div>
          </Section>
          <Section title="Wali Peserta Didik (Jika ada)">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <Input label="Nama Wali" value={form.wali_peserta_didik.nama} onChange={(v) => updateForm(['wali_peserta_didik', 'nama'], v)} />
              <Input label="Hubungan Keluarga" value={form.wali_peserta_didik.hubungan_keluarga} onChange={(v) => updateForm(['wali_peserta_didik', 'hubungan_keluarga'], v)} />
              <Input label="Pendidikan Tertinggi" value={form.wali_peserta_didik.pendidikan_tertinggi} onChange={(v) => updateForm(['wali_peserta_didik', 'pendidikan_tertinggi'], v)} />
              <Input label="Pekerjaan" value={form.wali_peserta_didik.pekerjaan} onChange={(v) => updateForm(['wali_peserta_didik', 'pekerjaan'], v)} />
            </div>
          </Section>
        </>
      )}

      {activeTab === "section_c" && (
        <>
          <Section title="Pendidikan Sebelumnya">
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Masuk menjadi peserta didik baru</label>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Asal Peserta Didik" value={form.pendidikan_sebelumnya.asal_peserta_didik} onChange={(v) => updateForm(['pendidikan_sebelumnya', 'asal_peserta_didik'], v)} />
                  <Input label="Nama Lembaga" value={form.pendidikan_sebelumnya.nama_lembaga} onChange={(v) => updateForm(['pendidikan_sebelumnya', 'nama_lembaga'], v)} />
                  <Input label="Alamat Lembaga" value={form.pendidikan_sebelumnya.alamat_lembaga} onChange={(v) => updateForm(['pendidikan_sebelumnya', 'alamat_lembaga'], v)} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Pindah dari lembaga lain</label>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Nama Lembaga" value={form.pindahan.nama_lembaga_asal} onChange={(v) => updateForm(['pindahan', 'nama_lembaga_asal'], v)} />
                  <Input label="Alamat Lembaga" value={form.pindahan.alamat_lembaga_asal} onChange={(v) => updateForm(['pindahan', 'alamat_lembaga_asal'], v)} />
                  <Input label="Dari tingkat kel. umur" value={form.pindahan.kelompok_umur_sebelumnya} onChange={(v) => updateForm(['pindahan', 'kelompok_umur_sebelumnya'], v)} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Diterima di lembaga ini</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Pada Tanggal" type="date" value={form.diterima_di_lembaga.tanggal_diterima} onChange={(v) => updateForm(['diterima_di_lembaga', 'tanggal_diterima'], v)} />
                  <Input label="Kelompok Umur" value={form.diterima_di_lembaga.kelompok_umur} onChange={(v) => updateForm(['diterima_di_lembaga', 'kelompok_umur'], v)} />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Prestasi Belajar">
            <TextArea label="Prestasi" value={form.perkembangan_peserta_didik.prestasi_belajar} onChange={(v) => updateForm(['perkembangan_peserta_didik', 'prestasi_belajar'], v)} />
          </Section>

          <Section title="Keadaan Jasmani (Riwayat)">
            <p className="text-xs text-slate-400 mb-3">*Isi tabel berikut sesuai perkembangan anak selama 3 tahun</p>
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">Aspek</th>
                    {[0, 1, 2].map((i) => (
                      <th key={i} className="px-4 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider w-1/4">
                        Tahun Ke-{i + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">a. Tahun</td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="20xx"
                          value={form.perkembangan_peserta_didik.riwayat_perkembangan[i]?.tahun || ""}
                          onChange={(e) => updateForm(['perkembangan_peserta_didik', 'riwayat_perkembangan', i, 'tahun'], e.target.value)}
                          className="w-full text-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e94640]/10 transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">b. Berat Badan (kg)</td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="kg"
                          value={form.perkembangan_peserta_didik.riwayat_perkembangan[i]?.berat_badan || ""}
                          onChange={(e) => updateForm(['perkembangan_peserta_didik', 'riwayat_perkembangan', i, 'berat_badan'], e.target.value)}
                          className="w-full text-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e94640]/10 transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">c. Tinggi Badan (cm)</td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="px-2 py-2">
                        <input
                          type="number"
                          placeholder="cm"
                          value={form.perkembangan_peserta_didik.riwayat_perkembangan[i]?.tinggi_badan || ""}
                          onChange={(e) => updateForm(['perkembangan_peserta_didik', 'riwayat_perkembangan', i, 'tinggi_badan'], e.target.value)}
                          className="w-full text-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e94640]/10 transition-all"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">d. Penyakit</td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="px-2 py-2">
                        <textarea
                          rows={2}
                          placeholder="-"
                          value={form.perkembangan_peserta_didik.riwayat_perkembangan[i]?.penyakit || ""}
                          onChange={(e) => updateForm(['perkembangan_peserta_didik', 'riwayat_perkembangan', i, 'penyakit'], e.target.value)}
                          className="w-full text-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e94640]/10 transition-all resize-none"
                        />
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-slate-700">e. Kelainan</td>
                    {[0, 1, 2].map((i) => (
                      <td key={i} className="px-2 py-2">
                        <textarea
                          rows={2}
                          placeholder="-"
                          value={form.perkembangan_peserta_didik.riwayat_perkembangan[i]?.kelainan_jiwa || ""}
                          onChange={(e) => updateForm(['perkembangan_peserta_didik', 'riwayat_perkembangan', i, 'kelainan_jiwa'], e.target.value)}
                          className="w-full text-center rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-sm focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#e94640]/10 transition-all resize-none"
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {activeTab === "section_d" && (
        <>
          <Section title="Meninggalkan Lembaga Ini">
            <div className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Tamat Belajar</label>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Tahun Pelajaran" value={form.meninggalkan_lembaga.tamat_belajar.tahun_pelajaran} onChange={(v) => updateForm(['meninggalkan_lembaga', 'tamat_belajar', 'tahun_pelajaran'], v)} />
                  <Input label="Nomor/Tgl. Surat Ket." value={form.meninggalkan_lembaga.tamat_belajar.nomor_surat_keterangan} onChange={(v) => updateForm(['meninggalkan_lembaga', 'tamat_belajar', 'nomor_surat_keterangan'], v)} />
                  <Input label="Melanjutkan ke Lembaga" value={form.meninggalkan_lembaga.tamat_belajar.lembaga_lanjutan} onChange={(v) => updateForm(['meninggalkan_lembaga', 'tamat_belajar', 'lembaga_lanjutan'], v)} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Pindah Lembaga</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Input label="Dari kelompok umur" value={form.meninggalkan_lembaga.pindah_lembaga.dari_kelompok_umur} onChange={(v) => updateForm(['meninggalkan_lembaga', 'pindah_lembaga', 'dari_kelompok_umur'], v)} />
                  <Input label="Ke Lembaga" value={form.meninggalkan_lembaga.pindah_lembaga.ke_lembaga} onChange={(v) => updateForm(['meninggalkan_lembaga', 'pindah_lembaga', 'ke_lembaga'], v)} />
                  <Input label="Tingkat Kelompok Umur" value={form.meninggalkan_lembaga.pindah_lembaga.tingkat_kelompok_umur} onChange={(v) => updateForm(['meninggalkan_lembaga', 'pindah_lembaga', 'tingkat_kelompok_umur'], v)} />
                  <Input label="Tanggal Pindah" type="date" value={form.meninggalkan_lembaga.pindah_lembaga.tanggal_pindah} onChange={(v) => updateForm(['meninggalkan_lembaga', 'pindah_lembaga', 'tanggal_pindah'], v)} />
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-sm font-semibold text-slate-700 mb-3">Keluar Lembaga</label>
                <div className="grid grid-cols-1 gap-4">
                  <Input label="Tanggal" type="date" value={form.meninggalkan_lembaga.keluar_lembaga.tanggal_keluar} onChange={(v) => updateForm(['meninggalkan_lembaga', 'keluar_lembaga', 'tanggal_keluar'], v)} />
                  <TextArea label="Sebab / Alasan" value={form.meninggalkan_lembaga.keluar_lembaga.alasan} onChange={(v) => updateForm(['meninggalkan_lembaga', 'keluar_lembaga', 'alasan'], v)} />
                </div>
              </div>
            </div>
          </Section>

          <Section title="Lain - Lain">
            <TextArea label="Catatan Penting" value={form.lain_lain.catatan_penting} onChange={(v) => updateForm(['lain_lain', 'catatan_penting'], v)} />
          </Section>
        </>
      )}
    </div>
  );
}

// --- 5. VIEW CONTENT (UPDATED) ---
function ViewContent({ activeTab, data }) {
  const formatPhoneView = (num) => {
    if (!num) return "-";
    const raw = num.toString();
    if (raw.length < 3) return "+" + raw;
    if (raw.length < 6) return `+${raw.slice(0, 2)} ${raw.slice(2)}`;
    if (raw.length < 10) return `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5)}`;
    return `+${raw.slice(0, 2)} ${raw.slice(2, 5)} ${raw.slice(5, 9)} ${raw.slice(9)}`;
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-8">

      {activeTab === "section_a" && (
        <>
          <Section title="Keterangan Peserta Didik">

            {/* VIEW FOTO BESAR */}
            <div className="flex flex-col md:flex-row gap-8 mb-8">
              <div className="shrink-0 flex justify-center md:justify-start">
                <div className="h-32 w-32 rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden shadow-sm">
                  {data.peserta_didik.foto ? (
                    <img src={data.peserta_didik.foto} alt="Foto Siswa" className="h-full w-full object-cover" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-slate-300">
                      <UserCircleIcon className="h-16 w-16" />
                    </div>
                  )}
                </div>
              </div>

              <div className="grow">
                <ViewGrid>
                  <ViewItem label="Nama Lengkap" value={data.peserta_didik.nama_lengkap} />
                  <ViewItem label="Nama Panggilan" value={data.peserta_didik.nama_panggilan} />
                  <ViewItem label="Nomor Induk" value={data.peserta_didik.nomor_induk} />
                  <ViewItem label="Jenis Kelamin" value={data.peserta_didik.jenis_kelamin} />
                  <ViewItem label="TTL" value={`${data.peserta_didik.tempat_lahir}, ${data.peserta_didik.tanggal_lahir}`} />
                  <ViewItem label="Agama" value={data.peserta_didik.agama} />
                  <ViewItem label="Kewarganegaraan" value={data.peserta_didik.kewarganegaraan} />
                  <ViewItem label="Bahasa" value={data.peserta_didik.bahasa_sehari_hari} />
                  <ViewItem label="Saudara (K/T/A)" value={`${data.peserta_didik.jumlah_saudara.kandung} / ${data.peserta_didik.jumlah_saudara.tiri} / ${data.peserta_didik.jumlah_saudara.angkat}`} />
                </ViewGrid>
              </div>
            </div>
          </Section>
          <Section title="Keadaan Jasmani">
            <ViewGrid>
              <ViewItem label="Berat/Tinggi" value={`${data.peserta_didik.keadaan_jasmani.berat_badan} kg / ${data.peserta_didik.keadaan_jasmani.tinggi_badan} cm`} />
              <ViewItem label="Gol. Darah" value={data.peserta_didik.keadaan_jasmani.golongan_darah} />
              <ViewItem label="Penyakit" value={data.peserta_didik.keadaan_jasmani.penyakit_pernah_diderita} span2 />
            </ViewGrid>
          </Section>
          <Section title="Alamat">
            <ViewGrid>
              <ViewItem label="Alamat Rumah" value={data.peserta_didik.alamat_rumah} span2 />
              <ViewItem label="Telepon" value={formatPhoneView(data.peserta_didik.nomor_telepon)} />
              <ViewItem label="Status Tinggal" value={data.peserta_didik.status_tempat_tinggal} />
              <ViewItem label="Jarak" value={`${data.peserta_didik.jarak_ke_sekolah} km`} />
            </ViewGrid>
          </Section>
        </>
      )}

      {/* ... SECTION B, C, D tidak berubah view-nya, hanya copy paste logic sebelumnya ... */}
      {activeTab === "section_b" && (
        <>
          <Section title="Orang Tua Kandung">
            <ViewGrid>
              <ViewItem label="Nama Ayah" value={data.orang_tua_kandung.ayah.nama} />
              <ViewItem label="Nama Ibu" value={data.orang_tua_kandung.ibu.nama} />
              <ViewItem label="Pekerjaan Ayah" value={data.orang_tua_kandung.ayah.pekerjaan} />
              <ViewItem label="Pekerjaan Ibu" value={data.orang_tua_kandung.ibu.pekerjaan} />
            </ViewGrid>
          </Section>
          <Section title="Wali">
            <ViewGrid>
              <ViewItem label="Nama Wali" value={data.wali_peserta_didik.nama} />
              <ViewItem label="Hubungan" value={data.wali_peserta_didik.hubungan_keluarga} />
            </ViewGrid>
          </Section>
        </>
      )}

      {activeTab === "section_c" && (
        <>
          <Section title="Perkembangan">
            <ViewGrid>
              <ViewItem label="Asal Peserta Didik" value={data.pendidikan_sebelumnya.asal_peserta_didik} />
              <ViewItem label="Pindahan Dari" value={data.pindahan.nama_lembaga_asal} />
              <ViewItem label="Diterima Tanggal" value={data.diterima_di_lembaga.tanggal_diterima} />
              <ViewItem label="Kelompok Umur" value={data.diterima_di_lembaga.kelompok_umur} />
              <ViewItem label="Prestasi" value={data.perkembangan_peserta_didik.prestasi_belajar} span2 />
            </ViewGrid>
          </Section>

          <Section title="Riwayat Jasmani (3 Tahun)">
            <div className="overflow-hidden rounded-xl border border-slate-200 mt-2">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-bold text-slate-500 uppercase">Aspek</th>
                    {[0, 1, 2].map(i => <th key={i} className="px-4 py-2 text-center text-xs font-bold text-slate-500 uppercase">Thn {i + 1}</th>)}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-100">
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-slate-700">Tahun</td>
                    {[0, 1, 2].map(i => <td key={i} className="px-4 py-2 text-center text-sm text-slate-600">{data.perkembangan_peserta_didik.riwayat_perkembangan?.[i]?.tahun || "-"}</td>)}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-slate-700">Berat (kg)</td>
                    {[0, 1, 2].map(i => <td key={i} className="px-4 py-2 text-center text-sm text-slate-600">{data.perkembangan_peserta_didik.riwayat_perkembangan?.[i]?.berat_badan || "-"}</td>)}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-slate-700">Tinggi (cm)</td>
                    {[0, 1, 2].map(i => <td key={i} className="px-4 py-2 text-center text-sm text-slate-600">{data.perkembangan_peserta_didik.riwayat_perkembangan?.[i]?.tinggi_badan || "-"}</td>)}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-slate-700">Penyakit</td>
                    {[0, 1, 2].map(i => <td key={i} className="px-4 py-2 text-center text-sm text-slate-600">{data.perkembangan_peserta_didik.riwayat_perkembangan?.[i]?.penyakit || "-"}</td>)}
                  </tr>
                  <tr>
                    <td className="px-4 py-2 text-sm font-medium text-slate-700">Kelainan</td>
                    {[0, 1, 2].map(i => <td key={i} className="px-4 py-2 text-center text-sm text-slate-600">{data.perkembangan_peserta_didik.riwayat_perkembangan?.[i]?.kelainan_jiwa || "-"}</td>)}
                  </tr>
                </tbody>
              </table>
            </div>
          </Section>
        </>
      )}

      {activeTab === "section_d" && (
        <>
          <Section title="Meninggalkan Lembaga">
            <ViewGrid>
              <ViewItem label="Tamat Tahun" value={data.meninggalkan_lembaga.tamat_belajar.tahun_pelajaran} />
              <ViewItem label="Lanjut ke" value={data.meninggalkan_lembaga.tamat_belajar.lembaga_lanjutan} />
              <ViewItem label="Pindah ke" value={data.meninggalkan_lembaga.pindah_lembaga.ke_lembaga} />
              <ViewItem label="Alasan Keluar" value={data.meninggalkan_lembaga.keluar_lembaga.alasan} />
            </ViewGrid>
          </Section>
          <Section title="Lain-lain">
            <ViewItem label="Catatan" value={data.lain_lain.catatan_penting} span2 />
          </Section>
        </>
      )}
    </div>
  );
}

// --- SHARED UI COMPONENTS (SAMA SEPERTI SEBELUMNYA) ---

function ActionButton({ onClick, icon, colorClass }) {
  return <button onClick={onClick} className={`p-1.5 rounded-lg transition-all ${colorClass}`}>{icon}</button>;
}

function TabNavigation({ activeTab, setActiveTab }) {
  return (
    <div className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 pt-2">
      <div className="flex gap-6 overflow-x-auto pb-px scrollbar-hide">
        {TABS.map((tab) => (
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
function RadioGroup({ label, value, onChange, options }) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide ml-0.5">
        {label}
      </label>
      <div className="flex items-center gap-6 w-full py-2.5">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2.5 cursor-pointer group">
            <input
              type="radio"
              name={label}
              value={opt}
              checked={value === opt}
              onChange={() => onChange(opt)}
              className="w-4 h-4 accent-[#e94640] cursor-pointer"
            />
            <span className={`text-sm font-medium transition-colors ${value === opt ? "text-slate-900" : "text-slate-500 group-hover:text-slate-700"
              }`}>
              {opt}
            </span>
          </label>
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

// REVISI: Komponen khusus Input Telepon
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
      <input
        type="text"
        value={formatPhoneDisplay(value)}
        onChange={handleInputChange}
        placeholder="+62 8xx xxxx xxxx"
        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 transition-all focus:border-[#e94640] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#e94640]/10 hover:bg-slate-100/50"
      />
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