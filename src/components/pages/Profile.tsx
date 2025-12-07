import React, { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, X, Camera } from 'lucide-react';

export function Profile() {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1>Profil Saya</h1>
        <p className="text-[#64748B] mt-1">Kelola informasi profil dan keamanan akun Anda</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="card p-6">
            <div className="flex flex-col items-center">
              <div className="relative">
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-[#E94640] to-[#DA393C] flex items-center justify-center text-white text-4xl">
                  AD
                </div>
                <button className="absolute bottom-0 right-0 w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-[#E5E7EB] hover:bg-[#F6F7F9]">
                  <Camera className="w-5 h-5 text-[#64748B]" />
                </button>
              </div>
              <h3 className="mt-4 text-center">Admin Sekolah</h3>
              <p className="text-[#64748B] text-center mt-1">Administrator</p>
              <span className="mt-3 px-3 py-1 bg-[#DCFCE7] text-[#16A34A] rounded-full">Aktif</span>
            </div>

            <div className="mt-6 pt-6 border-t border-[#E5E7EB] space-y-3">
              <div className="flex items-center gap-3 text-[#64748B]">
                <Mail className="w-5 h-5" />
                <span className="text-sm">admin@paud-suci.sch.id</span>
              </div>
              <div className="flex items-center gap-3 text-[#64748B]">
                <Phone className="w-5 h-5" />
                <span className="text-sm">+62 812-3456-7890</span>
              </div>
              <div className="flex items-center gap-3 text-[#64748B]">
                <Calendar className="w-5 h-5" />
                <span className="text-sm">Bergabung: Jan 2024</span>
              </div>
            </div>
          </div>
        </div>

        {/* Information Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3>Informasi Pribadi</h3>
                <p className="text-[#64748B] mt-1">Update informasi pribadi Anda</p>
              </div>
              {!isEditing ? (
                <button onClick={() => setIsEditing(true)} className="btn-gradient px-4 py-2 rounded-lg w-full sm:w-auto">
                  Edit Profil
                </button>
              ) : (
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => setIsEditing(false)} className="flex-1 sm:flex-none px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]">
                    <X className="w-5 h-5 mx-auto sm:mx-0" />
                  </button>
                  <button className="flex-1 sm:flex-none btn-gradient px-4 py-2 rounded-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    <span className="hidden sm:inline">Simpan</span>
                  </button>
                </div>
              )}
            </div>

            <form className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Nama Lengkap *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    defaultValue="Admin Sekolah" 
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block mb-2">Username *</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    defaultValue="admin" 
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Email *</label>
                  <input 
                    type="email" 
                    className="input-field" 
                    defaultValue="admin@paud-suci.sch.id" 
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block mb-2">No. Telepon *</label>
                  <input 
                    type="tel" 
                    className="input-field" 
                    defaultValue="+62 812-3456-7890" 
                    disabled={!isEditing}
                  />
                </div>
              </div>

              <div>
                <label className="block mb-2">Alamat</label>
                <textarea 
                  className="input-field" 
                  rows={3} 
                  defaultValue="Jl. Pendidikan No. 123, Jakarta" 
                  disabled={!isEditing}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block mb-2">Tanggal Lahir</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    defaultValue="1990-01-01" 
                    disabled={!isEditing}
                  />
                </div>
                <div>
                  <label className="block mb-2">Jenis Kelamin</label>
                  <select className="input-field" disabled={!isEditing}>
                    <option>Laki-laki</option>
                    <option>Perempuan</option>
                  </select>
                </div>
              </div>
            </form>
          </div>

          {/* Security Settings */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
              <div>
                <h3>Keamanan Akun</h3>
                <p className="text-[#64748B] mt-1">Kelola password dan keamanan akun</p>
              </div>
              {!isChangingPassword && (
                <button onClick={() => setIsChangingPassword(true)} className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] w-full sm:w-auto">
                  Ubah Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <form className="space-y-4">
                <div>
                  <label className="block mb-2">Password Lama *</label>
                  <input type="password" className="input-field" placeholder="Masukkan password lama" />
                </div>
                <div>
                  <label className="block mb-2">Password Baru *</label>
                  <input type="password" className="input-field" placeholder="Masukkan password baru" />
                </div>
                <div>
                  <label className="block mb-2">Konfirmasi Password Baru *</label>
                  <input type="password" className="input-field" placeholder="Konfirmasi password baru" />
                </div>
                <div className="flex flex-col sm:flex-row gap-3 justify-end">
                  <button type="button" onClick={() => setIsChangingPassword(false)} className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2">
                    <X className="w-5 h-5" />
                    Batal
                  </button>
                  <button type="submit" className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2">
                    <Save className="w-5 h-5" />
                    Simpan Password
                  </button>
                </div>
              </form>
            )}

            {!isChangingPassword && (
              <div className="p-4 bg-[#F6F7F9] rounded-lg">
                <p className="text-[#64748B]">Password terakhir diubah: 15 November 2024</p>
              </div>
            )}
          </div>

          {/* Activity Log */}
          <div className="card p-6">
            <h3 className="mb-4">Aktivitas Terakhir</h3>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row justify-between p-3 bg-[#F6F7F9] rounded-lg gap-2">
                <div>
                  <p className="text-[#0F172A]">Login ke sistem</p>
                  <p className="text-[#64748B] text-sm">IP: 192.168.1.1</p>
                </div>
                <span className="text-[#64748B] text-sm">5 Des 2024, 08:30</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-3 bg-[#F6F7F9] rounded-lg gap-2">
                <div>
                  <p className="text-[#0F172A]">Update data siswa</p>
                  <p className="text-[#64748B] text-sm">Mahesa Al Ghifari</p>
                </div>
                <span className="text-[#64748B] text-sm">4 Des 2024, 14:20</span>
              </div>
              <div className="flex flex-col sm:flex-row justify-between p-3 bg-[#F6F7F9] rounded-lg gap-2">
                <div>
                  <p className="text-[#0F172A]">Input presensi kelas A</p>
                  <p className="text-[#64748B] text-sm">12 siswa hadir</p>
                </div>
                <span className="text-[#64748B] text-sm">4 Des 2024, 09:15</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
