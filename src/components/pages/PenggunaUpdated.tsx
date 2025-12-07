import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Modal } from '../Modal';
import { siswa, karyawan } from '../../data/dummyData';
import { Search, Key, ToggleLeft, ToggleRight, Save, X, Edit, Eye, EyeOff, User } from 'lucide-react';

type UserType = 'siswa' | 'karyawan';

export function PenggunaUpdated() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'semua' | UserType>('semua');
  const [filterStatus, setFilterStatus] = useState<'semua' | 'aktif' | 'nonaktif'>('semua');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Gabungkan data siswa dan karyawan
  const siswaUsers = siswa.map((s) => ({
    id: s.id,
    nama: s.peserta_didik?.nama_lengkap || s.nama || 'N/A',
    username: s.peserta_didik?.nomor_induk || s.nisn || 'N/A',
    email: s.email || '-',
    tipe: 'siswa' as const,
    status: 'Aktif',
    originalData: s,
  }));

  const karyawanUsers = karyawan.map((k) => ({
    id: k.id,
    nama: k.nama || 'N/A',
    username: k.nip,
    email: k.email,
    tipe: 'karyawan' as const,
    status: 'Aktif', // Default semua karyawan aktif
    originalData: k,
  }));

  const allUsers = [...siswaUsers, ...karyawanUsers];

  // Filter data
  const filteredData = allUsers.filter((user) => {
    const matchSearch = user.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase());
    const matchType = filterType === 'semua' || user.tipe === filterType;
    const matchStatus = filterStatus === 'semua' || user.status.toLowerCase() === filterStatus;
    return matchSearch && matchType && matchStatus;
  });

  const columns = [
    { 
      key: 'nama', 
      label: 'Nama',
    },
    { 
      key: 'username', 
      label: 'Username (NISN/NIP)',
    },
    { 
      key: 'email', 
      label: 'Email',
    },
    {
      key: 'tipe',
      label: 'Tipe Pengguna',
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs ${
          value === 'siswa' 
            ? 'bg-blue-100 text-blue-700' 
            : 'bg-purple-100 text-purple-700'
        }`}>
          {value === 'siswa' ? 'Siswa' : 'Karyawan'}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status Akun',
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs ${
          value === 'Aktif' 
            ? 'bg-[#22C55E] text-white' 
            : 'bg-[#EF4444] text-white'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  const handleChangePassword = (user: any) => {
    setSelectedUser(user);
    setShowPasswordModal(true);
  };

  const handleToggleStatus = (user: any) => {
    setSelectedUser(user);
    setShowStatusModal(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleViewUser = (user: any) => {
    setSelectedUser(user);
    setShowViewModal(true);
  };

  const customActions = (row: any) => (
    <div className="flex gap-2">
      <button
        onClick={() => handleChangePassword(row)}
        className="p-2 text-[#F59E0B] hover:bg-[#FEF3C7] rounded-lg transition-colors"
        title="Ganti Password"
      >
        <Key className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleToggleStatus(row)}
        className={`p-2 rounded-lg transition-colors ${
          row.status === 'Aktif'
            ? 'text-[#EF4444] hover:bg-[#FEE2E2]'
            : 'text-[#22C55E] hover:bg-[#D1FAE5]'
        }`}
        title={row.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
      >
        {row.status === 'Aktif' ? (
          <ToggleRight className="w-4 h-4" />
        ) : (
          <ToggleLeft className="w-4 h-4" />
        )}
      </button>
      <button
        onClick={() => handleEditUser(row)}
        className="p-2 text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors"
        title="Edit Pengguna"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => handleViewUser(row)}
        className="p-2 text-[#0F172A] hover:bg-[#F6F7F9] rounded-lg transition-colors"
        title="Lihat Pengguna"
      >
        <Eye className="w-4 h-4" />
      </button>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Manajemen Pengguna</h1>
        <p className="text-[#64748B] mt-1 text-sm sm:text-base">
          Kelola akun pengguna siswa dan karyawan
        </p>
      </div>

      <div className="card p-4 sm:p-6">
        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div className="sm:col-span-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#64748B] w-5 h-5" />
              <input
                type="text"
                placeholder="Cari nama atau username..."
                className="input-field pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            <select
              className="input-field"
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="semua">Semua Tipe</option>
              <option value="siswa">Siswa</option>
              <option value="karyawan">Karyawan</option>
            </select>
          </div>
          <div>
            <select
              className="input-field"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
            >
              <option value="semua">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="nonaktif">Nonaktif</option>
            </select>
          </div>
        </div>

        {/* Info Card */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-600">Total Pengguna</p>
            <p className="text-2xl text-blue-700 mt-1">{allUsers.length}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-sm text-green-600">Akun Aktif</p>
            <p className="text-2xl text-green-700 mt-1">
              {allUsers.filter(u => u.status === 'Aktif').length}
            </p>
          </div>
          <div className="p-4 bg-red-50 rounded-xl border border-red-200">
            <p className="text-sm text-red-600">Akun Nonaktif</p>
            <p className="text-2xl text-red-700 mt-1">
              {allUsers.filter(u => u.status === 'Nonaktif').length}
            </p>
          </div>
        </div>

        {/* Table */}
        <DataTable
          columns={columns}
          data={filteredData}
          customActions={customActions}
          showView={false}
          showEdit={false}
          showDelete={false}
        />
      </div>

      {/* Modal Ganti Password */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        title="Ganti Password"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Password berhasil diubah!');
            setShowPasswordModal(false);
          }}
          className="space-y-4"
        >
          <div className="p-4 bg-[#F6F7F9] rounded-lg">
            <p className="text-sm text-[#64748B]">Pengguna</p>
            <p className="text-[#0F172A]">{selectedUser?.nama}</p>
            <p className="text-sm text-[#64748B] mt-1">
              {selectedUser?.tipe === 'siswa' ? 'Siswa' : 'Karyawan'} - {selectedUser?.username}
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm">Password Baru *</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Masukkan password baru"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block mb-2 text-sm">Konfirmasi Password *</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Konfirmasi password baru"
                required
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B]"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Minimal 6 karakter</p>
          </div>

          <div className="flex gap-3 justify-end pt-4">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
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
              Simpan Password
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Edit Pengguna - Status & Password Only */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Edit Status & Password"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Data pengguna berhasil diperbarui!');
            setShowEditModal(false);
          }}
          className="space-y-4"
        >
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Info:</strong> Form ini hanya untuk mengubah Status Akun dan Password. 
              Untuk mengubah data lain, silakan gunakan menu Edit Data Pengguna.
            </p>
          </div>

          <div className="p-4 bg-[#F6F7F9] rounded-lg">
            <p className="text-sm text-[#64748B]">Pengguna</p>
            <p className="text-[#0F172A]">{selectedUser?.nama}</p>
            <p className="text-sm text-[#64748B] mt-1">
              {selectedUser?.tipe === 'siswa' ? 'Siswa' : 'Karyawan'} - {selectedUser?.username}
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm">Status Akun *</label>
            <select className="input-field" defaultValue={selectedUser?.status}>
              <option value="Aktif">Aktif</option>
              <option value="Nonaktif">Nonaktif</option>
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm">Password Baru</label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Kosongkan jika tidak ingin mengubah password"
                minLength={6}
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B]"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#64748B] mt-1">Minimal 6 karakter</p>
          </div>

          <div>
            <label className="block mb-2 text-sm">Konfirmasi Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                className="input-field pr-10"
                placeholder="Konfirmasi password baru"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#64748B]"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
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
              Simpan Perubahan
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal Toggle Status */}
      <Modal
        isOpen={showStatusModal}
        onClose={() => setShowStatusModal(false)}
        title={selectedUser?.status === 'Aktif' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
        size="sm"
      >
        <div className="space-y-4">
          <div className="p-4 bg-[#F6F7F9] rounded-lg">
            <p className="text-sm text-[#64748B]">Pengguna</p>
            <p className="text-[#0F172A]">{selectedUser?.nama}</p>
            <p className="text-sm text-[#64748B] mt-1">
              {selectedUser?.tipe === 'siswa' ? 'Siswa' : 'Karyawan'} - {selectedUser?.username}
            </p>
          </div>

          <p className="text-[#64748B]">
            {selectedUser?.status === 'Aktif'
              ? 'Apakah Anda yakin ingin menonaktifkan akun ini? Pengguna tidak akan bisa login setelah akun dinonaktifkan.'
              : 'Apakah Anda yakin ingin mengaktifkan akun ini? Pengguna akan bisa login kembali.'}
          </p>

          <div className="flex gap-3 justify-end pt-4">
            <button
              onClick={() => setShowStatusModal(false)}
              className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]"
            >
              Batal
            </button>
            <button
              onClick={() => {
                alert(
                  selectedUser?.status === 'Aktif'
                    ? 'Akun berhasil dinonaktifkan!'
                    : 'Akun berhasil diaktifkan!'
                );
                setShowStatusModal(false);
              }}
              className={`px-6 py-2.5 text-white rounded-lg ${
                selectedUser?.status === 'Aktif'
                  ? 'bg-[#EF4444] hover:bg-[#DC2626]'
                  : 'bg-[#22C55E] hover:bg-[#16A34A]'
              }`}
            >
              {selectedUser?.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal View Detail Pengguna */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Pengguna"
        size="lg"
      >
        <div className="space-y-6">
          {/* Header dengan Foto Profil */}
          <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-[#E94640] to-[#DA393C] rounded-xl text-white">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-[#E94640]" />
            </div>
            <div>
              <h3 className="text-xl">{selectedUser?.nama}</h3>
              <p className="text-sm opacity-90">
                {selectedUser?.tipe === 'siswa' ? 'Siswa' : 'Karyawan'}
              </p>
            </div>
          </div>

          {/* Informasi Detail - 2 Kolom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <label className="block mb-1 text-sm text-[#64748B]">Nama Lengkap</label>
              <p className="text-[#0F172A]">{selectedUser?.nama}</p>
            </div>

            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <label className="block mb-1 text-sm text-[#64748B]">
                {selectedUser?.tipe === 'siswa' ? 'NISN' : 'NIP'}
              </label>
              <p className="text-[#0F172A]">{selectedUser?.username}</p>
            </div>

            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <label className="block mb-1 text-sm text-[#64748B]">Email</label>
              <p className="text-[#0F172A]">{selectedUser?.email || '-'}</p>
            </div>

            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <label className="block mb-1 text-sm text-[#64748B]">Tipe Pengguna</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                selectedUser?.tipe === 'siswa' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-purple-100 text-purple-700'
              }`}>
                {selectedUser?.tipe === 'siswa' ? 'Siswa' : 'Karyawan'}
              </span>
            </div>

            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <label className="block mb-1 text-sm text-[#64748B]">Status Akun</label>
              <span className={`inline-block px-3 py-1 rounded-full text-xs ${
                selectedUser?.status === 'Aktif' 
                  ? 'bg-[#22C55E] text-white' 
                  : 'bg-[#EF4444] text-white'
              }`}>
                {selectedUser?.status}
              </span>
            </div>

            {selectedUser?.tipe === 'siswa' && (
              <div className="p-4 bg-[#F6F7F9] rounded-lg">
                <label className="block mb-1 text-sm text-[#64748B]">Kelas</label>
                <p className="text-[#0F172A]">{selectedUser?.kelas || '-'}</p>
              </div>
            )}

            {selectedUser?.tipe === 'karyawan' && (
              <div className="p-4 bg-[#F6F7F9] rounded-lg">
                <label className="block mb-1 text-sm text-[#64748B]">Jabatan</label>
                <p className="text-[#0F172A]">{selectedUser?.jabatan || '-'}</p>
              </div>
            )}

            <div className="p-4 bg-[#F6F7F9] rounded-lg">
              <label className="block mb-1 text-sm text-[#64748B]">Tanggal Pembuatan Akun</label>
              <p className="text-[#0F172A]">01 Januari 2024</p>
            </div>
          </div>

          {/* Info Tambahan */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="text-sm mb-2 text-blue-800">Riwayat Login Terakhir</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-blue-600">Terakhir Login:</span>
                <span className="ml-2 text-blue-900">7 Desember 2024, 08:30</span>
              </div>
              <div>
                <span className="text-blue-600">Perangkat:</span>
                <span className="ml-2 text-blue-900">Web Browser</span>
              </div>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
            <button
              onClick={() => setShowViewModal(false)}
              className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Tutup
            </button>
            <button
              onClick={() => {
                setShowViewModal(false);
                setShowEditModal(true);
              }}
              className="btn-gradient px-6 py-2.5 rounded-lg flex items-center gap-2"
            >
              <Edit className="w-5 h-5" />
              Edit Pengguna
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}