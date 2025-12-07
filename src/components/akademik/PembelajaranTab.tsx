import React, { useState } from "react";
import { DataTable } from "../DataTable";
import { Modal } from "../Modal";
import { aspekPembelajaran } from "../../data/dummyData";
import {
  Plus,
  ArrowLeft,
  Save,
  X,
  Eye,
  Pencil,
  Trash2,
} from "lucide-react";

type ViewMode = "list" | "view" | "edit" | "detail";
type ModalType = "sub-aspek" | "indikator" | "view-detail";

export function PembelajaranTab() {
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedAspek, setSelectedAspek] = useState<any>(null);
  const [selectedSubAspek, setSelectedSubAspek] =
    useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] =
    useState<ModalType>("sub-aspek");

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
      kode: "1.1",
      nama: "Mempercayai adanya Tuhan melalui ciptaan-Nya",
      indikators: [
        {
          id: "1-1",
          kode: "1.1.1",
          deskripsi:
            "Terbiasa menyebut nama Tuhan sebagai pencipta",
        },
        {
          id: "1-2",
          kode: "1.1.2",
          deskripsi:
            "Terbiasa mengucapkan kalimat pujian terhadap ciptaan Tuhan",
        },
      ],
    },
    {
      id: "2",
      kode: "1.2",
      nama: "Menghargai diri sendiri, orang lain, dan lingkungan sekitar sebagai rasa syukur kepada Tuhan",
      indikators: [
        {
          id: "2-1",
          kode: "1.2.1",
          deskripsi: "Menghormati (toleransi) agama orang lain",
        },
        {
          id: "2-2",
          kode: "1.2.2",
          deskripsi:
            "Terbiasa mengucapkan terima kasih sebagai wujud syukur",
        },
      ],
    },
    {
      id: "3",
      kode: "2.1",
      nama: "Memiliki perilaku yang mencerminkan hidup sehat",
      indikators: [
        {
          id: "3-1",
          kode: "2.1.1",
          deskripsi: "Terbiasa makan makanan bergizi seimbang",
        },
        {
          id: "3-2",
          kode: "2.1.2",
          deskripsi:
            "Terbiasa memelihara kebersihan diri dan lingkungan",
        },
      ],
    },
  ];

  // View/Edit Mode - Halaman Terpisah
  if (viewMode === "view" || viewMode === "edit") {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg sm:text-xl">
              {viewMode === "view" ? "Lihat" : "Edit"} Sub-Aspek
              & Indikator
            </h3>
            <p className="text-[#64748B] mt-1 text-sm sm:text-base">
              Aspek: {selectedAspek?.nama}
            </p>
          </div>
          <button
            onClick={() => setViewMode("list")}
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Kembali
          </button>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h4 className="text-base sm:text-lg">
            Daftar Sub-Aspek & Indikator
          </h4>
          {viewMode === "edit" && (
            <button
              onClick={() => {
                setModalType("sub-aspek");
                setShowModal(true);
              }}
              className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              Tambah Sub-Aspek
            </button>
          )}
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[#F6F7F9]">
                <tr>
                  <th className="text-left py-3 px-4 text-sm text-[#64748B] border-b border-[#E5E7EB] w-24">
                    Kode
                  </th>
                  <th className="text-left py-3 px-4 text-sm text-[#64748B] border-b border-[#E5E7EB]">
                    Sub-Aspek / Indikator
                  </th>
                  <th className="text-center py-3 px-4 text-sm text-[#64748B] border-b border-[#E5E7EB] w-32">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {subAspekData.map((subAspek) => (
                  <React.Fragment key={subAspek.id}>
                    {/* Baris Sub-Aspek */}
                    <tr className="bg-blue-50 border-b border-[#E5E7EB]">
                      <td className="py-3 px-4 align-top">
                        <span className="inline-block px-2 py-1 bg-[#E94640] text-white rounded text-xs">
                          {subAspek.kode}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-[#0F172A]">
                        <strong>{subAspek.nama}</strong>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedSubAspek(subAspek);
                              setModalType("view-detail");
                              setShowModal(true);
                            }}
                            className="p-2 text-[#3B82F6] hover:bg-blue-100 rounded-lg transition-colors"
                            title="Lihat Detail"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {viewMode === "edit" && (
                            <>
                              <button
                                onClick={() => {
                                  setModalType("indikator");
                                  setSelectedSubAspek(subAspek);
                                  setShowModal(true);
                                }}
                                className="p-2 text-[#22C55E] hover:bg-green-100 rounded-lg transition-colors"
                                title="Tambah Indikator"
                              >
                                <Plus className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  alert(
                                    `Edit sub-aspek: ${subAspek.nama}`,
                                  )
                                }
                                className="p-2 text-[#F59E0B] hover:bg-orange-100 rounded-lg transition-colors"
                                title="Edit Sub-Aspek"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  confirm(
                                    `Hapus sub-aspek ${subAspek.nama}?`,
                                  )
                                }
                                className="p-2 text-[#EF4444] hover:bg-red-100 rounded-lg transition-colors"
                                title="Hapus Sub-Aspek"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Baris-baris Indikator */}
                    {subAspek.indikators.map((ind) => (
                      <tr
                        key={ind.id}
                        className="border-b border-[#E5E7EB] hover:bg-[#F6F7F9]"
                      >
                        <td className="py-2 px-4 pl-12">
                          <span className="text-[#E94640] text-xs">
                            {ind.kode}
                          </span>
                        </td>
                        <td className="py-2 px-4 text-sm text-[#334155]">
                          {ind.deskripsi}
                        </td>
                        <td className="py-2 px-4">
                          {viewMode === "edit" && (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() =>
                                  alert(
                                    `Edit indikator: ${ind.deskripsi}`,
                                  )
                                }
                                className="p-2 text-[#F59E0B] hover:bg-orange-100 rounded-lg transition-colors"
                                title="Edit Indikator"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() =>
                                  confirm(
                                    `Hapus indikator ${ind.deskripsi}?`,
                                  )
                                }
                                className="p-2 text-[#EF4444] hover:bg-red-100 rounded-lg transition-colors"
                                title="Hapus Indikator"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Add/Edit */}
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title={
            modalType === "sub-aspek"
              ? "Tambah Sub-Aspek"
              : modalType === "indikator"
                ? "Tambah Indikator"
                : "Detail Sub-Aspek"
          }
          size={modalType === "view-detail" ? "lg" : "md"}
        >
          {modalType === "view-detail" && selectedSubAspek ? (
            <div className="space-y-4">
              <div className="p-4 bg-[#F6F7F9] rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 bg-[#E94640] text-white rounded text-xs">
                    {selectedSubAspek.kode}
                  </span>
                  <h4 className="text-[#0F172A]">
                    {selectedSubAspek.nama}
                  </h4>
                </div>
              </div>

              <div>
                <h5 className="mb-3 text-[#0F172A]">
                  Daftar Indikator (
                  {selectedSubAspek.indikators.length})
                </h5>
                <div className="space-y-2">
                  {selectedSubAspek.indikators.map(
                    (ind: any, idx: number) => (
                      <div
                        key={ind.id}
                        className="p-3 border border-[#E5E7EB] rounded-lg"
                      >
                        <div className="flex items-start gap-3">
                          <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-[#E94640] text-white rounded-full text-xs">
                            {idx + 1}
                          </span>
                          <div className="flex-1">
                            <p className="text-xs text-[#E94640] mb-1">
                              {ind.kode}
                            </p>
                            <p className="text-sm text-[#0F172A]">
                              {ind.deskripsi}
                            </p>
                          </div>
                        </div>
                      </div>
                    ),
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-6 py-2.5 btn-gradient rounded-lg"
                >
                  Tutup
                </button>
              </div>
            </div>
          ) : (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                alert(
                  `${
                    modalType === "sub-aspek"
                      ? "Sub-Aspek"
                      : "Indikator"
                  } berhasil ditambahkan!`,
                );
                setShowModal(false);
              }}
            >
              {modalType === "indikator" &&
                selectedSubAspek && (
                  <div className="p-3 bg-[#F6F7F9] rounded-lg">
                    <p className="text-sm text-[#64748B]">
                      Sub-Aspek:
                    </p>
                    <p className="text-[#0F172A]">
                      {selectedSubAspek.nama}
                    </p>
                  </div>
                )}

              <div>
                <label className="block mb-2 text-sm">
                  Kode{" "}
                  {modalType === "sub-aspek"
                    ? "Sub-Aspek"
                    : "Indikator"}{" "}
                  *
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder={
                    modalType === "sub-aspek"
                      ? "Contoh: 1.1"
                      : "Contoh: 1.1.1"
                  }
                  required
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">
                  {modalType === "sub-aspek"
                    ? "Nama Sub-Aspek"
                    : "Deskripsi Indikator"}{" "}
                  *
                </label>
                {modalType === "sub-aspek" ? (
                  <input
                    type="text"
                    className="input-field"
                    placeholder="Nama sub-aspek pembelajaran"
                    required
                  />
                ) : (
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="Deskripsi indikator pembelajaran"
                    required
                  />
                )}
              </div>
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
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
          )}
        </Modal>
      </div>
    );
  }

  // List Mode - Daftar Aspek
  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg sm:text-xl">
            Master Aspek Pembelajaran
          </h3>
          <p className="text-[#64748B] mt-1 text-sm sm:text-base">
            Kelola aspek, sub-aspek, dan indikator pembelajaran
          </p>
        </div>
        <button className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base w-full sm:w-auto justify-center">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
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
        onEdit={(row) => {
          setSelectedAspek(row);
          setViewMode("edit");
        }}
        onDelete={(row) => confirm(`Hapus aspek ${row.nama}?`)}
      />
    </div>
  );
}