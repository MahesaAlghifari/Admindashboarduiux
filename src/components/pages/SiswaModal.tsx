import React, { useState } from 'react';
import { StandardToolbar } from '../StandardToolbar';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import { Modal } from '../Modal';
import { siswa as siswaData, kelas, tahunAjar } from '../../data/dummyData';
import { Save, X } from 'lucide-react';

export function Siswa() {
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterKelas, setFilterKelas] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('view');

  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'nisn', label: 'NISN' },
    { key: 'kelas', label: 'Kelas' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  // Transform data untuk DataTable dengan flatten structure
  const transformedData = siswaData.map((s) => ({
    ...s,
    nama: s.pesertaDidik?.nama || 'N/A',
    nisn: s.pesertaDidik?.nisn || 'N/A',
    kelas: s.pesertaDidik?.kelas || '-',
    status: s.pesertaDidik?.status || 'Aktif',
    originalData: s, // Simpan data asli untuk modal
  }));

  const filteredData = transformedData.filter((s) => {
    const matchSearch =
      s.nama?.toLowerCase().includes(searchValue.toLowerCase()) ||
      s.nisn?.toLowerCase().includes(searchValue.toLowerCase());
    const matchKelas = !filterKelas || s.kelas === filterKelas;
    const matchStatus = !filterStatus || s.status === filterStatus;
    return matchSearch && matchKelas && matchStatus;
  });

  const handleView = (row: any) => {
    setSelectedSiswa(row.originalData || row);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedSiswa(row.originalData || row);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedSiswa(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleDelete = (row: any) => {
    const nama = row.originalData?.pesertaDidik?.nama || row.nama;
    if (confirm(`Hapus siswa ${nama}?`)) {
      alert('Data siswa dihapus');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedSiswa(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1>Manajemen Siswa</h1>
        <p className="text-[#64748B] mt-1">Kelola data siswa dan informasi akademik</p>
      </div>

      <StandardToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClick={() => console.log('Search:', searchValue)}
        searchPlaceholder="Cari nama atau NISN siswa..."
        filters={[
          {
            label: 'Filter Kelas',
            value: filterKelas,
            options: kelas.map((k) => ({ label: k.nama, value: k.nama })),
            onChange: setFilterKelas,
          },
          {
            label: 'Filter Status',
            value: filterStatus,
            options: [
              { label: 'Aktif', value: 'Aktif' },
              { label: 'Lulus', value: 'Lulus' },
              { label: 'Pindah', value: 'Pindah' },
            ],
            onChange: setFilterStatus,
          },
        ]}
        onAddClick={handleAdd}
        addButtonText="Tambah Siswa"
      />

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
          modalMode === 'add'
            ? 'Tambah Siswa Baru'
            : modalMode === 'edit'
            ? 'Edit Data Siswa'
            : 'Detail Siswa'
        }
        size="xl"
      >
        <form className="space-y-6">
          {/* Informasi Pribadi */}
          <div>
            <h4 className="mb-4">Informasi Pribadi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Nama Lengkap *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.nama}
                  disabled={modalMode === 'view'}
                  placeholder="Nama lengkap siswa"
                />
              </div>
              <div>
                <label className="block mb-2">NISN *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.nisn}
                  disabled={modalMode === 'view'}
                  placeholder="Nomor Induk Siswa Nasional"
                />
              </div>
              <div>
                <label className="block mb-2">NIK *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.nik}
                  disabled={modalMode === 'view'}
                  placeholder="Nomor Induk Kependudukan"
                />
              </div>
              <div>
                <label className="block mb-2">Tempat Lahir *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.tempatLahir}
                  disabled={modalMode === 'view'}
                  placeholder="Kota tempat lahir"
                />
              </div>
              <div>
                <label className="block mb-2">Tanggal Lahir *</label>
                <input
                  type="date"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.tanggalLahir}
                  disabled={modalMode === 'view'}
                />
              </div>
              <div>
                <label className="block mb-2">Jenis Kelamin *</label>
                <select
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.jenisKelamin}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block mb-2">Agama *</label>
                <select
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.agama}
                  disabled={modalMode === 'view'}
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
                <label className="block mb-2">Anak Ke</label>
                <input
                  type="number"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.anakKe}
                  disabled={modalMode === 'view'}
                  placeholder="1"
                  min="1"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2">Alamat Lengkap *</label>
              <textarea
                className="input-field"
                rows={3}
                defaultValue={selectedSiswa?.pesertaDidik?.alamat}
                disabled={modalMode === 'view'}
                placeholder="Alamat lengkap tempat tinggal"
              />
            </div>
          </div>

          {/* Informasi Akademik */}
          <div>
            <h4 className="mb-4">Informasi Akademik</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Kelas *</label>
                <select
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.kelas}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Kelas</option>
                  {kelas.map((k) => (
                    <option key={k.id} value={k.nama}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2">Tahun Ajar *</label>
                <select
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.tahunAjar}
                  disabled={modalMode === 'view'}
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
                <label className="block mb-2">Tanggal Masuk *</label>
                <input
                  type="date"
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.tanggalMasuk}
                  disabled={modalMode === 'view'}
                />
              </div>
              <div>
                <label className="block mb-2">Status *</label>
                <select
                  className="input-field"
                  defaultValue={selectedSiswa?.pesertaDidik?.status}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Lulus">Lulus</option>
                  <option value="Pindah">Pindah</option>
                  <option value="Keluar">Keluar</option>
                </select>
              </div>
            </div>
          </div>

          {/* Informasi Orang Tua */}
          <div>
            <h4 className="mb-4">Informasi Orang Tua/Wali</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2">Nama Ayah *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orangTuaWali?.ayah?.nama}
                  disabled={modalMode === 'view'}
                  placeholder="Nama lengkap ayah"
                />
              </div>
              <div>
                <label className="block mb-2">Pekerjaan Ayah</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orangTuaWali?.ayah?.pekerjaan}
                  disabled={modalMode === 'view'}
                  placeholder="Pekerjaan ayah"
                />
              </div>
              <div>
                <label className="block mb-2">Nama Ibu *</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orangTuaWali?.ibu?.nama}
                  disabled={modalMode === 'view'}
                  placeholder="Nama lengkap ibu"
                />
              </div>
              <div>
                <label className="block mb-2">Pekerjaan Ibu</label>
                <input
                  type="text"
                  className="input-field"
                  defaultValue={selectedSiswa?.orangTuaWali?.ibu?.pekerjaan}
                  disabled={modalMode === 'view'}
                  placeholder="Pekerjaan ibu"
                />
              </div>
              <div>
                <label className="block mb-2">No. HP Orang Tua *</label>
                <input
                  type="tel"
                  className="input-field"
                  defaultValue={selectedSiswa?.orangTuaWali?.teleponOrtu}
                  disabled={modalMode === 'view'}
                  placeholder="+62 812-xxxx-xxxx"
                />
              </div>
              <div>
                <label className="block mb-2">Email Orang Tua</label>
                <input
                  type="email"
                  className="input-field"
                  defaultValue={selectedSiswa?.orangTuaWali?.emailOrtu}
                  disabled={modalMode === 'view'}
                  placeholder="email@example.com"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          {modalMode !== 'view' && (
            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
              <button
                type="button"
                onClick={handleCloseModal}
                className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
              <button
                type="submit"
                className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-5 h-5" />
                {modalMode === 'add' ? 'Simpan Data' : 'Update Data'}
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}