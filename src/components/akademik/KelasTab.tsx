import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Modal } from '../Modal';
import { kelas, siswa, karyawan, tahunAjar } from '../../data/dummyData';
import { Plus, Save, X } from 'lucide-react';

export function KelasTab() {
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [selectedSiswaIds, setSelectedSiswaIds] = useState<string[]>([]);

  const columns = [
    { key: 'nama', label: 'Nama Kelas' },
    { key: 'waliKelas', label: 'Wali Kelas' },
    { key: 'tahunAjar', label: 'Tahun Ajar' },
    { key: 'jumlahSiswa', label: 'Jumlah Siswa' },
  ];

  const handleView = (row: any) => {
    setSelectedItem(row);
    const siswaInKelas = siswa.filter(s => s.kelasId === row.id).map(s => s.id);
    setSelectedSiswaIds(siswaInKelas);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedItem(row);
    const siswaInKelas = siswa.filter(s => s.kelasId === row.id).map(s => s.id);
    setSelectedSiswaIds(siswaInKelas);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedItem(null);
    setSelectedSiswaIds([]);
  };

  const toggleSiswa = (siswaId: string) => {
    if (selectedSiswaIds.includes(siswaId)) {
      setSelectedSiswaIds(selectedSiswaIds.filter(id => id !== siswaId));
    } else {
      setSelectedSiswaIds([...selectedSiswaIds, siswaId]);
    }
  };

  const siswaInKelas = siswa.filter(s => selectedSiswaIds.includes(s.id));
  const availableSiswa = siswa;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg sm:text-xl">Daftar Kelas</h3>
        <button className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base">
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="hidden sm:inline">Tambah Kelas</span>
          <span className="sm:hidden">Tambah</span>
        </button>
      </div>
      
      <DataTable
        columns={columns}
        data={kelas}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(row) => confirm(`Hapus kelas ${row.nama}?`)}
      />

      {/* Modal View/Edit Kelas */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalMode === 'view' ? 'Detail Kelas' : 'Edit Kelas'}
        size="xl"
      >
        <form className="space-y-6">
          {/* Informasi Kelas */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Informasi Kelas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">Nama Kelas *</label>
                <input
                  type="text"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedItem?.nama}
                  disabled={modalMode === 'view'}
                  placeholder="Contoh: Kelas A"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Wali Kelas *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedItem?.waliKelasId}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Wali Kelas</option>
                  {karyawan.filter(k => k.jabatan.includes('Guru')).map((guru) => (
                    <option key={guru.id} value={guru.id}>{guru.nama}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Tahun Ajar *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedItem?.tahunAjar}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Tahun Ajar</option>
                  {tahunAjar.map((ta) => (
                    <option key={ta.value} value={ta.value}>{ta.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Jumlah Siswa</label>
                <input
                  type="text"
                  className="input-field bg-[#F6F7F9] text-sm sm:text-base"
                  value={selectedSiswaIds.length}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Daftar Siswa di Kelas */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Daftar Siswa di Kelas</h4>
            {siswaInKelas.length > 0 ? (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {siswaInKelas.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-[#F6F7F9] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base">{idx + 1}. {s.nama}</p>
                      <p className="text-xs sm:text-sm text-[#64748B]">NISN: {s.nisn}</p>
                    </div>
                    {modalMode === 'edit' && (
                      <button
                        type="button"
                        onClick={() => toggleSiswa(s.id)}
                        className="text-[#EF4444] hover:underline text-sm"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#64748B] text-sm">Belum ada siswa di kelas ini</div>
            )}
          </div>

          {/* Tambah Siswa (Only in Edit Mode) */}
          {modalMode === 'edit' && (
            <div>
              <h4 className="mb-4 text-base sm:text-lg">Tambah Siswa ke Kelas</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto border border-[#E5E7EB] rounded-lg p-4">
                {availableSiswa.length > 0 ? (
                  availableSiswa.map((s) => {
                    const isInClass = selectedSiswaIds.includes(s.id);
                    return (
                      <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-[#F6F7F9] rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isInClass}
                          onChange={() => toggleSiswa(s.id)}
                          className="w-4 h-4"
                        />
                        <div className="flex-1">
                          <p className="text-sm sm:text-base">{s.nama}</p>
                          <p className="text-xs sm:text-sm text-[#64748B]">NISN: {s.nisn} | Kelas saat ini: {s.kelas}</p>
                        </div>
                      </label>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-[#64748B] text-sm">Semua siswa sudah ditambahkan</div>
                )}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          {modalMode === 'edit' && (
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
                onClick={(e) => {
                  e.preventDefault();
                  alert('Data kelas berhasil diupdate!');
                  handleCloseModal();
                }}
              >
                <Save className="w-5 h-5" />
                Simpan Perubahan
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}
