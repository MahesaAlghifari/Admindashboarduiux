import React, { useEffect, useMemo, useRef, useState } from "react";
import { StandardToolbar } from "../StandardToolbar";
import { DataTable } from "../DataTable";
import { StatusBadge } from "../StatusBadge";
import { Modal } from "../Modal";
import { kelas, tahunAjar } from "../../data/dummyData";
import { Save, X } from "lucide-react";
import {
  createStudent,
  deleteStudent,
  fetchStudents,
  mapStudentToBukuInduk,
  uiStatusToApiStatus,
  updateStudent,
} from "../../api/students";

export function Siswa() {
  const isMountedRef = useRef(true);
  const [siswaData, setSiswaData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [searchValue, setSearchValue] = useState("");
  const [filterKelas, setFilterKelas] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<"view" | "add" | "edit">("view");

  const loadStudents = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      const apiStudents = await fetchStudents();
      const mapped = apiStudents.map(mapStudentToBukuInduk);
      if (isMountedRef.current) setSiswaData(mapped);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal memuat data siswa";
      if (isMountedRef.current) setLoadError(message);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    void loadStudents();

    return () => {
      isMountedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const columns = [
    { key: "nama", label: "Nama" },
    { key: "nisn", label: "NISN" },
    { key: "kelas", label: "Kelas" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  // Transform data untuk DataTable dengan flatten structure
  const transformedData = useMemo(() => {
    return siswaData.map((s: any) => ({
      ...s,
      nama: s.peserta_didik?.nama_lengkap || s.nama || "N/A",
      nisn: s.peserta_didik?.nomor_induk || s.nisn || "N/A",
      kelas: s.peserta_didik?.kelas || s.kelas || "-",
      status: s.status || "Aktif",
      originalData: s, // Simpan data asli untuk modal
    }));
  }, [siswaData]);

  const kelasOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        transformedData
          .map((s: any) => s.kelas)
          .filter((v: any) => typeof v === "string" && v.trim().length > 0)
      )
    ) as string[];
    return values.map((value) => ({ label: value, value }));
  }, [transformedData]);

  const filteredData = transformedData.filter((s: any) => {
    const matchSearch =
      s.nama?.toLowerCase().includes(searchValue.toLowerCase()) ||
      s.nisn?.toLowerCase().includes(searchValue.toLowerCase());
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  const handleView = (row: any) => {
    setSelectedSiswa(row.originalData || row);
    setModalMode("view");
    setSaveError(null);
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedSiswa(row.originalData || row);
    setModalMode("edit");
    setSaveError(null);
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedSiswa(null);
    setModalMode("add");
    setSaveError(null);
    setShowModal(true);
  };

  const handleDelete = async (row: any) => {
    const nama = row.originalData?.peserta_didik?.nama_lengkap || row.nama;
    const studentId = row.originalData?.originalApi?.studentid;

    if (!studentId) {
      alert("Tidak bisa menghapus: studentid tidak ditemukan");
      return;
    }

    if (!confirm(`Hapus siswa ${nama}?`)) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      await deleteStudent(studentId);
      await loadStudents();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menghapus data siswa";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSiswa(null);
    setSaveError(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

    const getNumberOrNull = (key: string) => {
      const value = getString(key);
      if (!value) return null;
      const num = Number(value);
      return Number.isFinite(num) ? num : null;
    };

    const payload = {
      // IDs (string/number) agar cocok dengan backend
      classid: getString("classid") || null,
      schoolyearid: getString("schoolyearid") || "1",

      student_number: getString("student_number") || null,
      fullname: getString("fullname") || null,
      // Backend/DB error indicates nickname has no default; send empty string instead of null.
      nickname: getString("nickname"),
      birthplace: getString("birthplace") || null,
      birthdate: getString("birthdate") || null,
      gender: getString("gender") || null,
      religion: getString("religion") || null,
      nationality: getString("nationality") || null,
      home_language: getString("home_language") || null,
      address: getString("address") || null,
      distance_km: getString("distance_km") || null,
      contact: getString("contact") || null,
      datejoin: getString("datejoin") || null,
      status: uiStatusToApiStatus(getString("status")) || null,

      // REQUIRED by BE validation
      studentfeeamount: getNumberOrNull("studentfeeamount"),
      contract: getString("contract") || null,

      siblings_full: getNumberOrNull("siblings_full"),
      siblings_step: getNumberOrNull("siblings_step"),
      siblings_adopted: getNumberOrNull("siblings_adopted"),
    };

    try {
      if (modalMode === "add") {
        await createStudent(payload);
      } else {
        const studentId = selectedSiswa?.originalApi?.studentid;
        if (!studentId) {
          throw new Error("Tidak bisa update: studentid tidak ditemukan");
        }
        await updateStudent(studentId, payload);
      }

      await loadStudents();
      handleCloseModal();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Gagal menyimpan perubahan data siswa";
      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Manajemen Siswa</h1>
        <p className="text-[#64748B] mt-1">
          Kelola data siswa dan informasi akademik
        </p>
      </div>

      <StandardToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClick={() => console.log("Search:", searchValue)}
        searchPlaceholder="Cari nama atau NISN siswa..."
        filters={[
          {
            label: "Filter Kelas",
            value: filterKelas,
            options: kelasOptions,
            onChange: setFilterKelas,
          },
          {
            label: "Filter Status",
            value: filterStatus,
            options: [
              { label: "Aktif", value: "Aktif" },
              { label: "Lulus", value: "Lulus" },
              { label: "Pindah", value: "Pindah" },
            ],
            onChange: setFilterStatus,
          },
        ]}
        onAddClick={handleAdd}
        addButtonText="Tambah Siswa"
      />

      {loadError && <div className="text-[#EF4444] text-sm">{loadError}</div>}
      {isLoading && (
        <div className="text-[#64748B] text-sm">Memuat data siswa...</div>
      )}

      <DataTable
        columns={columns}
        data={filteredData}
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
            ? "Tambah Siswa Baru"
            : modalMode === "edit"
            ? "Edit Data Siswa"
            : "Detail Siswa"
        }
        size="xl"
      >
        <form className="space-y-6" onSubmit={handleSubmit}>
          {saveError && (
            <div className="text-[#EF4444] text-sm">{saveError}</div>
          )}
          {/* Informasi Pribadi */}
          <div>
            <h4 className="mb-4">Informasi Pribadi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Nama Lengkap *</label>
                <input
                  name="fullname"
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.nama_lengkap ||
                    selectedSiswa?.nama
                  }
                  disabled={modalMode === "view"}
                  placeholder="Nama lengkap siswa"
                />
              </div>
              <div>
                <label className="block mb-2">Nama Panggilan</label>
                <input
                  name="nickname"
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.peserta_didik?.nama_panggilan}
                  disabled={modalMode === "view"}
                  placeholder="Nama panggilan"
                />
              </div>
              <div>
                <label className="block mb-2">Nomor Induk *</label>
                <input
                  name="student_number"
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.nomor_induk ||
                    selectedSiswa?.nisn
                  }
                  disabled={modalMode === "view"}
                  placeholder="Nomor Induk Siswa"
                />
              </div>
              <div>
                <label className="block mb-2">Tempat Lahir *</label>
                <input
                  name="birthplace"
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.tempat_lahir ||
                    selectedSiswa?.tempatLahir
                  }
                  disabled={modalMode === "view"}
                  placeholder="Kota tempat lahir"
                />
              </div>
              <div>
                <label className="block mb-2">Tanggal Lahir *</label>
                <input
                  name="birthdate"
                  type="date"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.tanggal_lahir ||
                    selectedSiswa?.tanggalLahir
                  }
                  disabled={modalMode === "view"}
                />
              </div>
              <div>
                <label className="block mb-2">Jenis Kelamin *</label>
                <select
                  name="gender"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.jenis_kelamin ||
                    selectedSiswa?.jenisKelamin
                  }
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Agama *</label>
                <select
                  name="religion"
                  className="input-field"
                  defaultValue={selectedSiswa?.peserta_didik?.agama}
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
                <label className="block mb-2">Kewarganegaraan *</label>
                <select
                  name="nationality"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.originalApi?.nationality ||
                    selectedSiswa?.peserta_didik?.kewarganegaraan ||
                    ""
                  }
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih</option>
                  <option value="WNI">WNI</option>
                  <option value="WNA">WNA</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Bahasa Sehari-hari</label>
                <input
                  name="home_language"
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.bahasa_sehari_hari
                  }
                  disabled={modalMode === "view"}
                  placeholder="Indonesia"
                />
              </div>
              <div>
                <label className="block mb-2">Telepon/HP</label>
                <input
                  name="contact"
                  type="tel"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.telepon_hp ||
                    selectedSiswa?.teleponOrtu
                  }
                  disabled={modalMode === "view"}
                  placeholder="+62 812-xxxx-xxxx"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2">Alamat Rumah *</label>
              <textarea
                name="address"
                className="input-field"
                rows={3}
                defaultValue={
                  selectedSiswa?.peserta_didik?.alamat_rumah ||
                  selectedSiswa?.alamat
                }
                disabled={modalMode === "view"}
                placeholder="Alamat lengkap tempat tinggal"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block mb-2">Status Tempat Tinggal</label>
                <select
                  name="living_with_ui"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.status_tempat_tinggal
                  }
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih Status</option>
                  <option value="Rumah Sendiri">Rumah Sendiri</option>
                  <option value="Rumah Orang Tua">Rumah Orang Tua</option>
                  <option value="Rumah Sewa">Rumah Sewa</option>
                  <option value="Rumah Dinas">Rumah Dinas</option>
                  <option value="Lainnya">Lainnya</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Jarak ke Sekolah</label>
                <input
                  name="distance_km"
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.peserta_didik?.jarak_ke_sekolah}
                  disabled={modalMode === "view"}
                  placeholder="2 km"
                />
              </div>
            </div>
          </div>

          {/* Jumlah Saudara */}
          <div>
            <h4 className="mb-4">Jumlah Saudara</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block mb-2">Kandung</label>
                <input
                  name="siblings_full"
                  type="number"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.jumlah_saudara?.kandung || "0"
                  }
                  disabled={modalMode === "view"}
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-2">Tiri</label>
                <input
                  name="siblings_step"
                  type="number"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.jumlah_saudara?.tiri || "0"
                  }
                  disabled={modalMode === "view"}
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-2">Angkat</label>
                <input
                  name="siblings_adopted"
                  type="number"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.jumlah_saudara?.angkat || "0"
                  }
                  disabled={modalMode === "view"}
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Keadaan Jasmani */}
          <div>
            <h4 className="mb-4">Keadaan Jasmani</h4>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <div>
                <label className="block mb-2">Berat Badan (kg)</label>
                <input
                  type="number"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.keadaan_jasmani?.berat_badan
                  }
                  disabled={modalMode === "view"}
                  placeholder="18"
                  min="0"
                  step="0.1"
                />
              </div>
              <div>
                <label className="block mb-2">Tinggi Badan (cm)</label>
                <input
                  type="number"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.keadaan_jasmani?.tinggi_badan
                  }
                  disabled={modalMode === "view"}
                  placeholder="105"
                  min="0"
                />
              </div>
              <div>
                <label className="block mb-2">Golongan Darah</label>
                <select
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.keadaan_jasmani
                      ?.golongan_darah
                  }
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Riwayat Penyakit</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.peserta_didik?.keadaan_jasmani
                      ?.riwayat_penyakit
                  }
                  disabled={modalMode === "view"}
                  placeholder="-"
                />
              </div>
            </div>
          </div>

          {/* Informasi Akademik */}
          <div>
            <h4 className="mb-4">Informasi Akademik</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Kelas *</label>
                <select
                  name="classid"
                  className="input-field"
                  defaultValue={selectedSiswa?.kelasId || ""}
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih Kelas</option>
                  {kelas.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>

              <input
                type="hidden"
                name="schoolyearid"
                value={String(selectedSiswa?.originalApi?.schoolyearid ?? "1")}
                readOnly
              />

              <div>
                <label className="block mb-2">Tanggal Diterima</label>
                <input
                  name="datejoin"
                  type="date"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.perkembangan_peserta_didik
                      ?.diterima_di_lembaga_ini?.tanggal_diterima
                  }
                  disabled={modalMode === "view"}
                />
              </div>

              <div>
                <label className="block mb-2">Biaya SPP *</label>
                <input
                  name="studentfeeamount"
                  type="number"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.originalApi?.studentfeeamount ?? ""
                  }
                  disabled={modalMode === "view"}
                  placeholder="90000"
                  min="0"
                />
              </div>

              <div>
                <label className="block mb-2">Contract *</label>
                <input
                  name="contract"
                  type="number"
                  className="input-field"
                  defaultValue={selectedSiswa?.originalApi?.contract ?? ""}
                  disabled={modalMode === "view"}
                  placeholder="1"
                  min="1"
                />
              </div>
              <div>
                <label className="block mb-2">Status *</label>
                <select
                  name="status"
                  className="input-field"
                  defaultValue={selectedSiswa?.status}
                  disabled={modalMode === "view"}
                >
                  <option value="">Pilih Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Pindah">Pindah</option>
                  <option value="Keluar">Keluar</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Pendidikan Sebelumnya</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.perkembangan_peserta_didik
                      ?.pendidikan_sebelumnya
                  }
                  disabled={modalMode === "view"}
                  placeholder="-"
                />
              </div>
            </div>
          </div>

          {/* Informasi Orang Tua */}
          <div>
            <h4 className="mb-4">Informasi Orang Tua</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Nama Ayah *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.orang_tua?.ayah?.nama ||
                    selectedSiswa?.namaAyah
                  }
                  disabled={modalMode === "view"}
                  placeholder="Nama lengkap ayah"
                />
              </div>
              <div>
                <label className="block mb-2">Pendidikan Ayah</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orang_tua?.ayah?.pendidikan}
                  disabled={modalMode === "view"}
                  placeholder="S1/D3/SMA/dll"
                />
              </div>
              <div>
                <label className="block mb-2">Pekerjaan Ayah</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orang_tua?.ayah?.pekerjaan}
                  disabled={modalMode === "view"}
                  placeholder="Pekerjaan ayah"
                />
              </div>
              <div>
                <label className="block mb-2">Nama Ibu *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={
                    selectedSiswa?.orang_tua?.ibu?.nama ||
                    selectedSiswa?.namaIbu
                  }
                  disabled={modalMode === "view"}
                  placeholder="Nama lengkap ibu"
                />
              </div>
              <div>
                <label className="block mb-2">Pendidikan Ibu</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orang_tua?.ibu?.pendidikan}
                  disabled={modalMode === "view"}
                  placeholder="S1/D3/SMA/dll"
                />
              </div>
              <div>
                <label className="block mb-2">Pekerjaan Ibu</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orang_tua?.ibu?.pekerjaan}
                  disabled={modalMode === "view"}
                  placeholder="Pekerjaan ibu"
                />
              </div>
            </div>
          </div>

          {/* Informasi Wali (jika ada) */}
          <div>
            <h4 className="mb-4">Informasi Wali (Optional)</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Nama Wali</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.wali?.nama}
                  disabled={modalMode === "view"}
                  placeholder="Nama lengkap wali"
                />
              </div>
              <div>
                <label className="block mb-2">Hubungan Keluarga</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.wali?.hubungan_keluarga}
                  disabled={modalMode === "view"}
                  placeholder="Kakek/Nenek/Paman/dll"
                />
              </div>
              <div>
                <label className="block mb-2">Pendidikan Wali</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.wali?.pendidikan_tertinggi}
                  disabled={modalMode === "view"}
                  placeholder="S1/D3/SMA/dll"
                />
              </div>
              <div>
                <label className="block mb-2">Pekerjaan Wali</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.wali?.pekerjaan}
                  disabled={modalMode === "view"}
                  placeholder="Pekerjaan wali"
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
                disabled={isSaving}
                className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2"
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
