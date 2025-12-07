import React, { useState } from 'react';
import { StandardToolbar } from '../StandardToolbar';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import { Modal } from '../Modal';
import { karyawan as karyawanData } from '../../data/dummyData';
import { Save, X } from 'lucide-react';

export function Karyawan() {
  const [selectedKaryawan, setSelectedKaryawan] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterJabatan, setFilterJabatan] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'add' | 'edit'>('view');

  const columns = [
    { key: 'nama', label: 'Nama' },
    { key: 'nip', label: 'NIP' },
    { key: 'jabatan', label: 'Jabatan' },
    {
      key: 'status',
      label: 'Status',
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

  const handleView = (row: any) => {
    setSelectedKaryawan(row);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedKaryawan(row);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleAdd = () => {
    setSelectedKaryawan(null);
    setModalMode('add');
    setShowModal(true);
  };

  const handleDelete = (row: any) => {
    if (confirm(`Hapus karyawan ${row.nama}?`)) {
      alert('Data karyawan dihapus');
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedKaryawan(null);
  };

  const jabatanOptions = [
    { label: 'Kepala Sekolah', value: 'Kepala Sekolah' },
    { label: 'Guru', value: 'Guru' },
    { label: 'TU', value: 'TU' },
    { label: 'Penjaga', value: 'Penjaga' },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Manajemen Karyawan</h1>
        <p className="text-[#64748B] mt-1 text-sm sm:text-base">Kelola data karyawan dan staff sekolah</p>
      </div>

      <StandardToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClick={() => console.log('Search:', searchValue)}
        searchPlaceholder="Cari nama atau NIP karyawan..."
        filters={[
          {
            label: 'Filter Jabatan',
            value: filterJabatan,
            options: jabatanOptions,
            onChange: setFilterJabatan,
          },
          {
            label: 'Filter Status',
            value: filterStatus,
            options: [
              { label: 'Aktif', value: 'Aktif' },
              { label: 'Cuti', value: 'Cuti' },
              { label: 'Non-Aktif', value: 'Non-Aktif' },
            ],
            onChange: setFilterStatus,
          },
        ]}
        onAddClick={handleAdd}
        addButtonText="Tambah Karyawan"
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
            ? 'Tambah Karyawan Baru'
            : modalMode === 'edit'
            ? 'Edit Data Karyawan'
            : 'Detail Karyawan'
        }
        size="xl"
      >
        <form className="space-y-6">
          {/* Data Pribadi */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Data Pribadi</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">Nama Lengkap *</label>
                <input
                  type="text"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.nama}
                  disabled={modalMode === 'view'}
                  placeholder="Nama lengkap karyawan"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">NIP *</label>
                <input
                  type="text"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.nip}
                  disabled={modalMode === 'view'}
                  placeholder="Nomor Induk Pegawai"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">NIK *</label>
                <input
                  type="text"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.nik}
                  disabled={modalMode === 'view'}
                  placeholder="Nomor Induk Kependudukan"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Tempat Lahir *</label>
                <input
                  type="text"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.tempatLahir}
                  disabled={modalMode === 'view'}
                  placeholder="Kota tempat lahir"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Tanggal Lahir *</label>
                <input
                  type="date"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.tanggalLahir}
                  disabled={modalMode === 'view'}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Jenis Kelamin *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.jenisKelamin}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Jenis Kelamin</option>
                  <option value="Laki-laki">Laki-laki</option>
                  <option value="Perempuan">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Agama *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.agama}
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
                <label className="block mb-2 text-sm">Pendidikan Terakhir *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.pendidikan}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Pendidikan</option>
                  <option value="SMA/SMK">SMA/SMK</option>
                  <option value="D3">D3</option>
                  <option value="S1">S1</option>
                  <option value="S2">S2</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="block mb-2 text-sm">Alamat Lengkap *</label>
              <textarea
                className="input-field text-sm sm:text-base"
                rows={3}
                defaultValue={selectedKaryawan?.alamat}
                disabled={modalMode === 'view'}
                placeholder="Alamat lengkap tempat tinggal"
              />
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
                  disabled={modalMode === 'view'}
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
                <label className="block mb-2 text-sm">Tanggal Bergabung *</label>
                <input
                  type="date"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.tanggalBergabung}
                  disabled={modalMode === 'view'}
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Status Kepegawaian *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.status}
                  disabled={modalMode === 'view'}
                >
                  <option value="">Pilih Status</option>
                  <option value="Aktif">Aktif</option>
                  <option value="Cuti">Cuti</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
              </div>
              <div>
                <label className="block mb-2 text-sm">Gaji Pokok</label>
                <input
                  type="number"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.gaji}
                  disabled={modalMode === 'view'}
                  placeholder="5000000"
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
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.noHp}
                  disabled={modalMode === 'view'}
                  placeholder="+62 812-xxxx-xxxx"
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedKaryawan?.email}
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
                className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2 text-sm sm:text-base"
              >
                <X className="w-5 h-5" />
                Batal
              </button>
              <button
                type="submit"
                className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
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