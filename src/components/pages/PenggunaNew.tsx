import React, { useState } from 'react';
import { StandardToolbar } from '../StandardToolbar';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import { Modal } from '../Modal';
import { users as penggunaData } from '../../data/dummyData';
import { Save, X, Eye, EyeOff } from 'lucide-react';

export function Pengguna() {
  const [selectedPengguna, setSelectedPengguna] = useState<any>(null);
  const [searchValue, setSearchValue] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'view' | 'edit'>('view');
  const [showPassword, setShowPassword] = useState(false);

  const columns = [
    { key: 'idUser', label: 'Username' },
    { key: 'nama', label: 'Nama Lengkap' },
    { key: 'email', label: 'Email' },
    { key: 'role', label: 'Role' },
    {
      key: 'status',
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const filteredData = penggunaData.filter((p) => {
    const matchSearch =
      p.idUser.toLowerCase().includes(searchValue.toLowerCase()) ||
      p.nama.toLowerCase().includes(searchValue.toLowerCase()) ||
      p.email.toLowerCase().includes(searchValue.toLowerCase());
    const matchRole = !filterRole || p.role === filterRole;
    const matchStatus = !filterStatus || p.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const handleView = (row: any) => {
    setSelectedPengguna(row);
    setModalMode('view');
    setShowModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedPengguna(row);
    setModalMode('edit');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPengguna(null);
    setShowPassword(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Manajemen Pengguna</h1>
        <p className="text-[#64748B] mt-1 text-sm sm:text-base">Kelola akun pengguna sistem</p>
      </div>

      <StandardToolbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onSearchClick={() => console.log('Search:', searchValue)}
        searchPlaceholder="Cari username, nama, atau email..."
        filters={[
          {
            label: 'Filter Role',
            value: filterRole,
            options: [
              { label: 'Admin', value: 'Admin' },
              { label: 'Guru', value: 'Guru' },
              { label: 'Orang Tua', value: 'Orang Tua' },
            ],
            onChange: setFilterRole,
          },
          {
            label: 'Filter Status',
            value: filterStatus,
            options: [
              { label: 'Aktif', value: 'Aktif' },
              { label: 'Non-Aktif', value: 'Non-Aktif' },
            ],
            onChange: setFilterStatus,
          },
        ]}
        showAddButton={false}
      />

      <DataTable
        columns={columns}
        data={filteredData}
        onView={handleView}
        onEdit={handleEdit}
        showActions={true}
      />

      {/* Modal View/Edit - NO DELETE */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={modalMode === 'edit' ? 'Edit Pengguna' : 'Detail Pengguna'}
        size="lg"
      >
        <form className="space-y-6">
          {/* Informasi Akun - Read Only */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Informasi Akun</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-sm">Username</label>
                <input
                  type="text"
                  className="input-field bg-[#F6F7F9] text-sm sm:text-base"
                  defaultValue={selectedPengguna?.idUser}
                  disabled
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Nama Lengkap</label>
                <input
                  type="text"
                  className="input-field bg-[#F6F7F9] text-sm sm:text-base"
                  defaultValue={selectedPengguna?.nama}
                  disabled
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Email</label>
                <input
                  type="email"
                  className="input-field bg-[#F6F7F9] text-sm sm:text-base"
                  defaultValue={selectedPengguna?.email}
                  disabled
                />
              </div>
              <div>
                <label className="block mb-2 text-sm">Role</label>
                <input
                  type="text"
                  className="input-field bg-[#F6F7F9] text-sm sm:text-base"
                  defaultValue={selectedPengguna?.role}
                  disabled
                />
              </div>
            </div>
          </div>

          {/* Yang Bisa Diedit: Password & Status */}
          <div>
            <h4 className="mb-4 text-base sm:text-lg">Pengaturan Akses</h4>
            <div className="space-y-4">
              {modalMode === 'edit' && (
                <div>
                  <label className="block mb-2 text-sm">Password Baru</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="input-field pr-12 text-sm sm:text-base"
                      placeholder="Kosongkan jika tidak ingin mengubah password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#E94640]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  <p className="text-xs text-[#64748B] mt-1">
                    Min. 8 karakter, kombinasi huruf dan angka
                  </p>
                </div>
              )}

              <div>
                <label className="block mb-2 text-sm">Status Akun *</label>
                <select
                  className="input-field text-sm sm:text-base"
                  defaultValue={selectedPengguna?.status}
                  disabled={modalMode === 'view'}
                >
                  <option value="Aktif">Aktif</option>
                  <option value="Non-Aktif">Non-Aktif</option>
                </select>
                {modalMode === 'view' && (
                  <p className="text-xs text-[#64748B] mt-1">
                    Status saat ini: <StatusBadge status={selectedPengguna?.status} />
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Informasi Tambahan */}
          <div className="p-4 bg-[#F6F7F9] rounded-lg">
            <h4 className="mb-2 text-sm sm:text-base">Informasi Login Terakhir</h4>
            <div className="space-y-1 text-xs sm:text-sm text-[#64748B]">
              <p>Login terakhir: {selectedPengguna?.lastLogin || '5 Des 2024, 08:30'}</p>
              <p>IP Address: {selectedPengguna?.lastIp || '192.168.1.1'}</p>
            </div>
          </div>

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
              >
                <Save className="w-5 h-5" />
                Update Pengguna
              </button>
            </div>
          )}
        </form>
      </Modal>
    </div>
  );
}