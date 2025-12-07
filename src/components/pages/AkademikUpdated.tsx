import React, { useState } from "react";
import { StandardToolbar } from "../StandardToolbar";
import { DataTable } from "../DataTable";
import { StatusBadge } from "../StatusBadge";
import { Modal } from "../Modal";
import {
  kurikulum,
  aspekPembelajaran,
  kelas,
  siswa,
  karyawan,
  pengumuman,
  tahunAjar,
} from "../../data/dummyData";
import {
  Plus,
  Calendar,
  Users,
  BookOpen,
  FileText,
  Save,
  X,
  Eye,
  Printer,
  ArrowLeft,
} from "lucide-react";

type ActiveTab =
  | "kurikulum"
  | "pembelajaran"
  | "kelas"
  | "penilaian"
  | "presensi"
  | "aktivitas"
  | "pengumuman"
  | "rapor";

type ViewMode = "list" | "add" | "edit" | "view" | "detail";

// Helper function to get current week dates
const getCurrentWeekDates = (mingguKe: number) => {
  const baseDate = new Date(2024, 11, 2); // Start from December 2, 2024
  const weekOffset = (mingguKe - 1) * 7;
  const dates = [];

  for (let i = 0; i < 5; i++) {
    // Monday to Friday
    const date = new Date(baseDate);
    date.setDate(baseDate.getDate() + weekOffset + i);
    dates.push(date.toISOString().split("T")[0]);
  }

  return dates;
};

export function Akademik() {
  const [activeTab, setActiveTab] =
    useState<ActiveTab>("kurikulum");

  const tabs = [
    { id: "kurikulum", label: "Kurikulum", icon: BookOpen },
    {
      id: "pembelajaran",
      label: "Pembelajaran",
      icon: BookOpen,
    },
    { id: "kelas", label: "Kelas", icon: Users },
    { id: "penilaian", label: "Penilaian", icon: FileText },
    { id: "presensi", label: "Presensi", icon: Calendar },
    {
      id: "aktivitas",
      label: "Aktivitas Harian",
      icon: FileText,
    },
    { id: "pengumuman", label: "Pengumuman", icon: FileText },
    { id: "rapor", label: "Rapor Siswa", icon: FileText },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Akademik</h1>
        <p className="text-[#64748B] mt-1">
          Kelola kurikulum, pembelajaran, dan penilaian
        </p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex overflow-x-auto border-b border-[#E5E7EB]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id as ActiveTab)
                }
                className={`px-6 py-4 whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-[#E94640] text-[#E94640]"
                    : "border-transparent text-[#64748B] hover:text-[#E94640]"
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === "kurikulum" && <KurikulumTab />}
          {activeTab === "pembelajaran" && <PembelajaranTab />}
          {activeTab === "kelas" && <KelasTab />}
          {activeTab === "penilaian" && <PenilaianTab />}
          {activeTab === "presensi" && <PresensiTab />}
          {activeTab === "aktivitas" && <AktivitasTab />}
          {activeTab === "pengumuman" && <PengumumanTab />}
          {activeTab === "rapor" && <RaporTab />}
        </div>
      </div>
    </div>
  );
}

// Kurikulum Tab
function KurikulumTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const columns = [
    { key: "nama", label: "Nama Kurikulum" },
    { key: "tahunAjar", label: "Tahun Ajar" },
    {
      key: "status",
      label: "Status",
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  if (viewMode === "add" || viewMode === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3>
            {viewMode === "add" ? "Tambah" : "Edit"} Kurikulum
          </h3>
          <button
            onClick={() => setViewMode("list")}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="card p-6">
          <form className="space-y-4">
            <div>
              <label className="block mb-2">
                Nama Kurikulum *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: Kurikulum Merdeka"
                defaultValue={selectedItem?.nama}
              />
            </div>
            <div>
              <label className="block mb-2">Tahun Ajar *</label>
              <select
                className="input-field"
                defaultValue={selectedItem?.tahunAjar}
              >
                <option value="">Pilih Tahun Ajar</option>
                {tahunAjar.map((ta) => (
                  <option key={ta.value} value={ta.value}>
                    {ta.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block mb-2">Status *</label>
              <select
                className="input-field"
                defaultValue={selectedItem?.status}
              >
                <option value="">Pilih Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Tidak Aktif">Tidak Aktif</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Deskripsi</label>
              <textarea
                className="input-field"
                rows={4}
                placeholder="Deskripsi kurikulum"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setViewMode("list")}
                className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
              <button
                type="submit"
                className="btn-gradient px-6 py-2.5 rounded-lg flex items-center gap-2"
              >
                <Save className="w-5 h-5" />
                Simpan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3>Daftar Kurikulum</h3>
        <button
          onClick={() => setViewMode("add")}
          className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Tambah Kurikulum
        </button>
      </div>
      <DataTable
        columns={columns}
        data={kurikulum}
        onView={(row) => {
          setSelectedItem(row);
          setViewMode("view");
        }}
        onEdit={(row) => {
          setSelectedItem(row);
          setViewMode("edit");
        }}
        onDelete={(row) => {
          setSelectedItem(row);
          setShowDeleteModal(true);
        }}
      />

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Konfirmasi Hapus"
        size="sm"
      >
        <div className="space-y-4">
          <p>
            Apakah Anda yakin ingin menghapus kurikulum{" "}
            <strong>{selectedItem?.nama}</strong>?
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]"
            >
              Batal
            </button>
            <button
              onClick={() => {
                setShowDeleteModal(false);
                setViewMode("list");
              }}
              className="px-6 py-2.5 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626]"
            >
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Pembelajaran Tab
function PembelajaranTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedAspek, setSelectedAspek] = useState<any>(null);
  const [showSubAspekModal, setShowSubAspekModal] =
    useState(false);
  const [showIndikatorModal, setShowIndikatorModal] =
    useState(false);

  const columns = [
    { key: "nama", label: "Aspek Pembelajaran" },
    {
      key: "jumlahSubAspek",
      label: "Sub Aspek",
      render: (value: number) => `${value} Sub Aspek`,
    },
    {
      key: "jumlahIndikator",
      label: "Indikator",
      render: () => "15 Indikator",
    },
  ];

  const subAspekData = [
    {
      id: "1",
      kode: "3.1",
      nama: "Mengenal kegiatan beribadah sehari-hari",
      jumlahIndikator: 5,
    },
    {
      id: "2",
      kode: "3.2",
      nama: "Mengenal perilaku baik sebagai cerminan akhlak mulia",
      jumlahIndikator: 4,
    },
    {
      id: "3",
      kode: "4.1",
      nama: "Melakukan kegiatan beribadah sehari-hari",
      jumlahIndikator: 6,
    },
  ];

  const indikatorData = [
    {
      id: "1",
      kode: "3.1.1",
      deskripsi:
        "Anak mampu menyebutkan doa sebelum dan sesudah makan",
    },
    {
      id: "2",
      kode: "3.1.2",
      deskripsi:
        "Anak mampu menyebutkan doa sebelum dan sesudah tidur",
    },
    {
      id: "3",
      kode: "3.1.3",
      deskripsi: "Anak mampu menyebutkan doa kedua orang tua",
    },
    {
      id: "4",
      kode: "3.1.4",
      deskripsi: "Anak mampu menyebutkan rukun islam",
    },
    {
      id: "5",
      kode: "3.1.5",
      deskripsi: "Anak mengenal sholat 5 waktu",
    },
  ];

  if (viewMode === "view" && selectedAspek) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3>Sub-Aspek & Indikator Pembelajaran</h3>
            <p className="text-[#64748B] mt-1">
              Aspek: {selectedAspek.nama}
            </p>
          </div>
          <button
            onClick={() => setViewMode("list")}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
        </div>

        <div className="flex justify-between items-center">
          <h4>Daftar Sub-Aspek</h4>
          <button
            onClick={() => setShowSubAspekModal(true)}
            className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Tambah Sub-Aspek
          </button>
        </div>

        <div className="space-y-3">
          {subAspekData.map((sub) => (
            <div key={sub.id} className="card p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="text-[#0F172A]">
                    {sub.kode} &mdash; {sub.nama}
                  </h4>
                  <p className="text-[#64748B] mt-1">
                    {sub.jumlahIndikator} Indikator
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowIndikatorModal(true)}
                    className="text-[#3B82F6] hover:underline flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    Lihat Indikator
                  </button>
                  <button className="text-[#F59E0B] hover:underline">
                    Edit
                  </button>
                  <button className="text-[#EF4444] hover:underline">
                    Hapus
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Indikator */}
        <Modal
          isOpen={showIndikatorModal}
          onClose={() => setShowIndikatorModal(false)}
          title="Daftar Indikator"
          size="xl"
        >
          <div className="space-y-4">
            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <h4>
                Sub-Aspek: 3.1 &mdash; Mengenal kegiatan
                beribadah sehari-hari
              </h4>
            </div>
            <div className="flex justify-end">
              <button className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Tambah Indikator
              </button>
            </div>
            <div className="space-y-2">
              {indikatorData.map((ind) => (
                <div
                  key={ind.id}
                  className="p-4 border border-[#E5E7EB] rounded-lg flex justify-between items-center"
                >
                  <div>
                    <span className="text-[#E94640] font-semibold">
                      {ind.kode}
                    </span>
                    <p className="text-[#0F172A] mt-1">
                      {ind.deskripsi}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-[#F59E0B] hover:underline">
                      Edit
                    </button>
                    <button className="text-[#EF4444] hover:underline">
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Modal>

        {/* Modal Sub-Aspek */}
        <Modal
          isOpen={showSubAspekModal}
          onClose={() => setShowSubAspekModal(false)}
          title="Tambah Sub-Aspek"
          size="lg"
        >
          <form className="space-y-4">
            <div>
              <label className="block mb-2">
                Kode Sub-Aspek *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Contoh: 3.1"
              />
            </div>
            <div>
              <label className="block mb-2">
                Nama Sub-Aspek *
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Nama sub-aspek pembelajaran"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setShowSubAspekModal(false)}
                className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-gradient px-6 py-2.5 rounded-lg"
              >
                Simpan
              </button>
            </div>
          </form>
        </Modal>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3>Master Aspek Pembelajaran</h3>
          <p className="text-[#64748B] mt-1">
            Kelola aspek, sub-aspek, dan indikator pembelajaran
          </p>
        </div>
        <button className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Tambah Aspek
        </button>
      </div>
      <DataTable
        columns={columns}
        data={aspekPembelajaran}
        onView={(row) => {
          setSelectedAspek(row);
          setViewMode("view");
        }}
        onEdit={(row) => alert(`Edit aspek: ${row.nama}`)}
        onDelete={(row) => confirm(`Hapus aspek ${row.nama}?`)}
      />
    </div>
  );
}

// ... Continue in next message due to length