import React, { useEffect, useMemo, useRef, useState } from "react";
import { StandardToolbar } from "../StandardToolbar";
import { DataTable } from "../DataTable";
import { StatusBadge } from "../StatusBadge";
import { Modal } from "../Modal";
import { Save, X } from "lucide-react";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  mapEmployeeToUiRow,
  updateEmployee,
} from "../../api/employees";

export function Karyawan() {
  const isMountedRef = useRef(true);
  const [karyawanData, setKaryawanData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedKaryawan, setSelectedKaryawan] = useState<any>(null);
  const [searchValue, setSearchValue] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "add" | "edit">("view");

  const loadEmployees = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const apiEmployees = await fetchEmployees();
      const mapped = apiEmployees.map(mapEmployeeToUiRow);
      if (isMountedRef.current) setKaryawanData(mapped);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data karyawan";
      if (isMountedRef.current) setLoadError(message);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    void loadEmployees();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "nama", label: "Nama" },
    { key: "nip", label: "NIP" },
    { key: "jabatan", label: "Jabatan" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => {
        // Generate status based on other fields if not available
        return <StatusBadge status="Aktif" />;
      },
    },
  ];

  const filteredData = karyawanData.filter((k) => {
    const matchSearch =
      k.nama.toLowerCase().includes(searchValue.toLowerCase()) ||
      k.nip.toLowerCase().includes(searchValue.toLowerCase());
    const matchJabatan = !filterJabatan || k.jabatan === filterJabatan;
    const matchStatus = !filterStatus || k.status === filterStatus;
    return matchSearch && matchJabatan && matchStatus;
  });

  const transformedData = useMemo(() => {
    return filteredData.map((row) => ({
      ...row,
      originalData: row,
    }));
  }, [filteredData]);

  const handleView = (row: any) => {
    setSelectedKaryawan(row.originalData || row);
    setModalMode("view");
    setSaveError(null);
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedKaryawan(row.originalData || row);
    setModalMode("edit");
    setSaveError(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedKaryawan(null);
    setModalMode("add");
    setSaveError(null);
    setShowModal(true);
  };

  const handleDelete = async (row: any) => {
    const nama = row?.originalData?.nama || row?.nama;
    const employeeId = row?.originalData?.originalApi?.employeeid;

    if (!employeeId) {
      alert("Tidak bisa menghapus: employeeid tidak ditemukan");
      return;
    }

    if (!confirm(`Hapus karyawan ${nama}?`)) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await deleteEmployee(employeeId);
      await loadEmployees();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menghapus data karyawan";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedKaryawan(null);
    setSaveError(null);
  };

  const jabatanOptions = [
    { label: "Kepala Sekolah", value: "Kepala Sekolah" },
    { label: "Guru", value: "Guru" },
    { label: "TU", value: "TU" },
    { label: "Penjaga", value: "Penjaga" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Manajemen Karyawan</h1>
        <p className="text-[#64748B] mt-1 text-sm sm:text-base">
          Kelola data karyawan dan staff sekolah
        </p>
      </div>

      <StandardToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClick={() => console.log("Search:", searchValue)}
        searchPlaceholder="Cari nama atau NIP karyawan..."
        filters={[
          {
            label: "Filter Jabatan",
            value: filterJabatan,
            options: jabatanOptions,
            onChange: setFilterJabatan,
          },
          {
            label: "Filter Status",
            value: filterStatus,
            options: [
              { label: "Aktif", value: "Aktif" },
              { label: "Cuti", value: "Cuti" },
              { label: "Non-Aktif", value: "Non-Aktif" },
            ],
            onChange: setFilterStatus,
          },
        ]}
        onAddClick={handleAdd}
        addButtonText="Tambah Karyawan"
      />

      {loadError && <div className="text-[#EF4444] text-sm">{loadError}</div>}
      {isLoading && (
        <div className="text-[#64748B] text-sm">Memuat data karyawan...</div>
      )}

      <DataTable
        columns={columns}
        data={transformedData}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      {/* Modal Add/Edit/View */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={
          modalMode === "add"
            ? "Tambah Karyawan Baru"
            : modalMode === "edit"
            ? "Edit Data Karyawan"
            : "Detail Karyawan"
        }
        size="xl"
      >
        <form
          className="space-y-6"
          onSubmit={async (e) => {
            e.preventDefault();
            if (modalMode === "view") return;

            setIsSaving(true);
            setSaveError(null);

            const formData = new FormData(e.currentTarget);
            const getString = (key: string) => {
              const raw = formData.get(key);
              if (raw === null || raw === undefined) return "";
              return String(raw).trim();
            };

            const photo = getString("photo");

            // Backend memvalidasi `photo` sebagai string (bukan file upload).
            // Add: wajib isi photo agar DB tidak error.
            if (modalMode === "add" && !photo) {
              setSaveError("Photo wajib diisi (string/nama file)");
              setIsSaving(false);
              return;
            }

            const payload = {
              nip: getString("nip") || null,
              fullname: getString("fullname") || null,
              gender: getString("gender") || null,
              fronttitle: getString("fronttitle") || null,
              backtitle: getString("backtitle") || null,
              education: getString("education") || null,
              contact: getString("contact") || null,
              email: getString("email") || null,
              address: getString("address") || null,
              place_of_birth: getString("place_of_birth") || null,
              birthdate: getString("birthdate") || null,
              npwp: getString("npwp") || null,
              marital_status: getString("marital_status") || null,
              photo:
                modalMode === "edit" && !photo
                  ? selectedKaryawan?.originalApi?.photo ?? ""
                  : photo,
            };

            try {
              if (modalMode === "add") {
                await createEmployee(payload);
              } else {
                const employeeId = selectedKaryawan?.originalApi?.employeeid;
                if (!employeeId) {
                  throw new Error(
                    "Tidak bisa update: employeeid tidak ditemukan"
                  );
                }
                await updateEmployee(employeeId, payload);
              }

              await loadEmployees();
              handleCloseModal();
            } catch (error) {
              const message =
                error instanceof Error
                  ? error.message
                  : "Gagal menyimpan perubahan data karyawan";
              setSaveError(message);
            } finally {
              setIsSaving(false);
            }
          }}
        >
          {saveError && (
            <div className="text-[#EF4444] text-sm">{saveError}</div>
          )}
          {/* Data Pribadi */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Data Pribadi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">Nama Lengkap *</label>
                <input
                  type="text"
                  name="fullname"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.fullname ||
                    selectedKaryawan?.nama
                  }
                  disabled={modalMode === "view"}
                  placeholder="Nama lengkap karyawan"
                  required={modalMode !== "view"}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">NIP *</label>
                <input
                  type="text"
                  name="nip"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.nip || selectedKaryawan?.nip
                  }
                  disabled={modalMode === "view"}
                  placeholder="Nomor Induk Pegawai"
                  required={modalMode !== "view"}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">NIK *</label>
                <input
                  type="text"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.nik}
                  disabled={modalMode === "view"}
                  placeholder="Nomor Induk Kependudukan"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Tempat Lahir *</label>
                <input
                  type="text"
                  name="place_of_birth"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.place_of_birth ||
                    selectedKaryawan?.tempatLahir
                  }
                  disabled={modalMode === "view"}
                  placeholder="Kota tempat lahir"
                  required={modalMode !== "view"}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Tanggal Lahir *</label>
                <input
                  type="date"
                  name="birthdate"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.birthdate ||
                    selectedKaryawan?.tanggalLahir
                  }
                  disabled={modalMode === "view"}
                  required={modalMode !== "view"}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Jenis Kelamin *</label>
                <select
                  name="gender"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.gender ||
                    selectedKaryawan?.jenisKelamin
                  }
                  disabled={modalMode === "view"}
                  required={modalMode !== "view"}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="laki-laki">Laki-laki</option>
                  <option value="perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Agama *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.agama}
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih Agama</option>
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">
                  Pendidikan Terakhir *
                </label>
                <select
                  name="education"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.education ||
                    selectedKaryawan?.pendidikan
                  }
                  disabled={modalMode === "view"}
                  required={modalMode !== "view"}
                >
                  <option value="">Pilih Pendidikan</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Gelar Depan</label>
                <input
                  type="text"
                  name="fronttitle"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.originalApi?.fronttitle || ""}
                  disabled={modalMode === "view"}
                  placeholder="dr"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Gelar Belakang</label>
                <input
                  type="text"
                  name="backtitle"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.originalApi?.backtitle || ""}
                  disabled={modalMode === "view"}
                  placeholder="S.Kom"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2 text-sm">Alamat Lengkap *</label>
              <textarea
                name="address"
                className="input-field text-sm sm:text-base"
                rows={3}
                defaultValue={
                  selectedKaryawan?.originalApi?.address ||
                  selectedKaryawan?.alamat
                }
                disabled={modalMode === "view"}
                placeholder="Alamat lengkap tempat tinggal"
                required={modalMode !== "view"}
              />
            </div>

            <div className="mt-4">
              <label className="block mb-2 text-sm">
                Photo {modalMode === "add" ? "*" : ""}
              </label>
              <input
                type="text"
                name="photo"
                className="input-field text-sm sm:text-base"
                defaultValue={selectedKaryawan?.originalApi?.photo || ""}
                disabled={modalMode === "view"}
                required={modalMode === "add"}
                placeholder="nama_file_foto.png"
              />
              {modalMode !== "add" && selectedKaryawan?.originalApi?.photo && (
                <p className="text-xs text-[#64748B] mt-1">
                  Foto saat ini: {String(selectedKaryawan.originalApi.photo)}
                </p>
              )}
            </div>
          </div>

          {/* Data Kepegawaian */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Data Kepegawaian</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">Jabatan *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.jabatan}
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih Jabatan</option>
                  {jabatanOptions.map((j) => (
                    <option key={j.value} value={j.value}>
                      {j.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">
                  Tanggal Bergabung *
                </label>
                <input
                  type="date"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.tanggalBergabung}
                  disabled={modalMode === "view"}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">
                  Status Kepegawaian *
                </label>
                <select
                  name="marital_status"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.marital_status ||
                    selectedKaryawan?.status ||
                    ""
                  }
                  disabled={modalMode === "view"}
                  required={modalMode !== "view"}
                >
                  <option value="">Pilih Status</option>
                  <option value="single">Single</option>
                  <option value="married">Married</option>
                  <option value="divorced">Divorced</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Gaji Pokok</label>
                <input
                  type="number"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.gaji}
                  disabled={modalMode === "view"}
                  placeholder="5000000"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">NPWP *</label>
                <input
                  type="text"
                  name="npwp"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.originalApi?.npwp || ""}
                  disabled={modalMode === "view"}
                  placeholder="00000"
                  required={modalMode !== "view"}
                />
              </div>
            </div>
          </div>

          {/* Kontak */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Informasi Kontak</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">No. HP *</label>
                <input
                  type="tel"
                  name="contact"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.contact ||
                    selectedKaryawan?.noHp
                  }
                  disabled={modalMode === "view"}
                  placeholder="+62 812-xxxx-xxxx"
                  required={modalMode !== "view"}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  name="email"
                  className="input-field text-sm sm:text-base"
                  defaultValue={
                    selectedKaryawan?.originalApi?.email ||
                    selectedKaryawan?.email
                  }
                  disabled={modalMode === "view"}
                  placeholder="email@example.com"
                  required={modalMode !== "view"}
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {modalMode !== "view" && (
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
              <button
                type="submit"
                className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isSaving}
              >
                <Save className="w-5 h-5" />
                {isSaving
                  ? "Menyimpan..."
                  : modalMode === "add"
                  ? "Simpan Data"
                  : "Update Data"}
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
