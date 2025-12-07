import React, { useState } from 'react';
import { Shield, Settings, Database, Download, Upload, Clock } from 'lucide-react';
import { DataTable } from '../DataTable';
import { roles } from '../../data/dummyData';

type ActiveTab = 'roles' | 'system' | 'preferences' | 'backup';

export function Pengaturan() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('roles');

  const tabs = [
    { id: 'roles', label: 'Manajemen Role', icon: Shield },
    { id: 'system', label: 'System Configuration', icon: Settings },
    { id: 'preferences', label: 'System Preferences', icon: Settings },
    { id: 'backup', label: 'Cadangan Data', icon: Database },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1>Pengaturan Sistem</h1>
        <p className="text-[#64748B] mt-1">Konfigurasi sistem dan hak akses</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex overflow-x-auto border-b border-[#E5E7EB]">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-6 py-4 whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-[#E94640] text-[#E94640]'
                    : 'border-transparent text-[#64748B] hover:text-[#E94640]'
                }`}
              >
                <Icon className="w-5 h-5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'roles' && <RolesTab />}
          {activeTab === 'system' && <SystemTab />}
          {activeTab === 'preferences' && <PreferencesTab />}
          {activeTab === 'backup' && <BackupTab />}
        </div>
      </div>
    </div>
  );
}

function RolesTab() {
  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'nama', label: 'Nama Role' },
    { key: 'hakAkses', label: 'Hak Akses' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3>Daftar Role</h3>
        <button className="btn-gradient px-4 py-2 rounded-lg">Tambah Role</button>
      </div>
      <DataTable
        columns={columns}
        data={roles}
        onEdit={(row) => alert(`Edit role: ${row.nama}`)}
      />

      <div className="card p-6 bg-[#F6F7F9] mt-6">
        <h4 className="mb-4">Matrix Hak Akses</h4>
        <p className="text-[#64748B] mb-4">Kelola hak akses untuk setiap role</p>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-[#E5E7EB]">
              <tr>
                <th className="text-left py-3 px-4">Modul</th>
                <th className="text-center py-3 px-4">Administrator</th>
                <th className="text-center py-3 px-4">Kepala Sekolah</th>
                <th className="text-center py-3 px-4">Guru</th>
                <th className="text-center py-3 px-4">Bendahara</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB]">
              {['Dashboard', 'Karyawan', 'Siswa', 'Akademik', 'Keuangan', 'Laporan'].map((modul) => (
                <tr key={modul}>
                  <td className="py-3 px-4">{modul}</td>
                  <td className="text-center py-3 px-4">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </td>
                  <td className="text-center py-3 px-4">
                    <input type="checkbox" defaultChecked className="w-5 h-5" />
                  </td>
                  <td className="text-center py-3 px-4">
                    <input type="checkbox" className="w-5 h-5" />
                  </td>
                  <td className="text-center py-3 px-4">
                    <input type="checkbox" className="w-5 h-5" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SystemTab() {
  return (
    <div className="space-y-6">
      <h3>Konfigurasi Sistem</h3>

      <div className="card p-6">
        <h4 className="mb-4">Informasi Sekolah</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">Nama Sekolah</label>
            <input
              type="text"
              defaultValue="PAUD Yayasan Suci Sutjipto"
              className="input-field"
            />
          </div>
          <div>
            <label className="block mb-2">NPSN</label>
            <input type="text" defaultValue="12345678" className="input-field" />
          </div>
          <div>
            <label className="block mb-2">Alamat</label>
            <input
              type="text"
              defaultValue="Jl. Pendidikan No. 123, Jakarta"
              className="input-field"
            />
          </div>
          <div>
            <label className="block mb-2">Telepon</label>
            <input type="tel" defaultValue="021-12345678" className="input-field" />
          </div>
          <div>
            <label className="block mb-2">Email</label>
            <input
              type="email"
              defaultValue="info@paudsuci.sch.id"
              className="input-field"
            />
          </div>
          <div>
            <label className="block mb-2">Website</label>
            <input type="url" defaultValue="www.paudsuci.sch.id" className="input-field" />
          </div>
        </div>
      </div>

      <div className="card p-6">
        <h4 className="mb-4">Kalender Akademik</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-2">Awal Tahun Ajaran</label>
            <input type="date" defaultValue="2024-07-15" className="input-field" />
          </div>
          <div>
            <label className="block mb-2">Akhir Tahun Ajaran</label>
            <input type="date" defaultValue="2025-06-30" className="input-field" />
          </div>
          <div>
            <label className="block mb-2">Tanggal Pembagian Rapor Semester 1</label>
            <input type="date" defaultValue="2024-12-20" className="input-field" />
          </div>
          <div>
            <label className="block mb-2">Tanggal Pembagian Rapor Semester 2</label>
            <input type="date" defaultValue="2025-06-25" className="input-field" />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-gradient px-6 py-2.5 rounded-lg">Simpan Pengaturan</button>
      </div>
    </div>
  );
}

function PreferencesTab() {
  return (
    <div className="space-y-6">
      <h3>Preferensi Sistem</h3>

      <div className="card p-6">
        <div className="space-y-6">
          <div>
            <label className="block mb-2">Zona Waktu</label>
            <select className="input-field">
              <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
              <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
              <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Bahasa Sistem</label>
            <select className="input-field">
              <option value="id">Bahasa Indonesia</option>
              <option value="en">English</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Format Tanggal</label>
            <select className="input-field">
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>

          <div>
            <label className="block mb-2">Format Mata Uang</label>
            <select className="input-field">
              <option value="IDR">Rupiah (Rp)</option>
              <option value="USD">US Dollar ($)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="btn-gradient px-6 py-2.5 rounded-lg">Simpan Preferensi</button>
      </div>
    </div>
  );
}

function BackupTab() {
  const backupHistory = [
    {
      id: '1',
      nama: 'backup_full_20241205.zip',
      tipe: 'Full Backup',
      ukuran: '256 MB',
      tanggal: '2024-12-05 02:00:00',
      user: 'System Auto',
    },
    {
      id: '2',
      nama: 'backup_keuangan_20241204.zip',
      tipe: 'Modul Keuangan',
      ukuran: '45 MB',
      tanggal: '2024-12-04 15:30:00',
      user: 'Admin',
    },
    {
      id: '3',
      nama: 'backup_full_20241204.zip',
      tipe: 'Full Backup',
      ukuran: '248 MB',
      tanggal: '2024-12-04 02:00:00',
      user: 'System Auto',
    },
  ];

  const columns = [
    { key: 'nama', label: 'Nama File' },
    { key: 'tipe', label: 'Tipe Backup' },
    { key: 'ukuran', label: 'Ukuran' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'user', label: 'Dibuat Oleh' },
  ];

  return (
    <div className="space-y-6">
      <h3>Cadangan Data</h3>

      {/* Backup Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button className="card p-6 hover:shadow-lg transition-all text-left">
          <Database className="w-12 h-12 text-[#E94640] mb-4" />
          <h4>Backup Full</h4>
          <p className="text-[#64748B] mt-2">Cadangkan semua data sistem</p>
        </button>

        <button className="card p-6 hover:shadow-lg transition-all text-left">
          <Upload className="w-12 h-12 text-[#3B82F6] mb-4" />
          <h4>Unggah Backup</h4>
          <p className="text-[#64748B] mt-2">Restore dari file backup</p>
        </button>

        <button className="card p-6 hover:shadow-lg transition-all text-left">
          <Clock className="w-12 h-12 text-[#22C55E] mb-4" />
          <h4>Jadwal Otomatis</h4>
          <p className="text-[#64748B] mt-2">Atur backup otomatis</p>
        </button>
      </div>

      {/* Backup Per Module */}
      <div className="card p-6">
        <h4 className="mb-4">Backup Per Modul</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {['Keuangan', 'Karyawan', 'Siswa', 'Akademik', 'Penilaian', 'Presensi', 'Pengguna'].map(
            (modul) => (
              <button
                key={modul}
                className="px-4 py-3 border border-[#E5E7EB] rounded-lg hover:border-[#E94640] hover:bg-[#E94640]/5 transition-colors"
              >
                <Download className="w-5 h-5 mx-auto mb-2 text-[#E94640]" />
                <p className="text-[#0F172A]">{modul}</p>
              </button>
            )
          )}
        </div>
      </div>

      {/* Backup Schedule */}
      <div className="card p-6">
        <h4 className="mb-4">Jadwal Backup Otomatis</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <input type="checkbox" defaultChecked className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-[#0F172A]">Backup Otomatis Harian</p>
              <p className="text-[#64748B]">Setiap hari pukul 02:00 WIB</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <input type="checkbox" className="w-5 h-5" />
            <div className="flex-1">
              <p className="text-[#0F172A]">Backup Otomatis Mingguan</p>
              <p className="text-[#64748B]">Setiap Minggu pukul 00:00 WIB</p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup History */}
      <div>
        <h4 className="mb-4">Riwayat Cadangan</h4>
        <DataTable
          columns={columns}
          data={backupHistory}
          onView={(row) => alert(`Download: ${row.nama}`)}
          onDelete={(row) => confirm(`Hapus backup ${row.nama}?`)}
          showActions={true}
          onEdit={undefined}
        />
      </div>
    </div>
  );
}
