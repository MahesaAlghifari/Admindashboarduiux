import React, { useState } from 'react';
import { StandardToolbar } from '../StandardToolbar';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import { Modal } from '../Modal';
import {
  kurikulum,
  aspekPembelajaran,
  kelas,
  siswa,
  karyawan,
  pengumuman,
  tahunAjar,
} from '../../data/dummyData';
import { Plus, Calendar, Users, BookOpen, FileText, Save, X, Eye, Printer, ArrowLeft, Edit, Trash2, Pencil } from 'lucide-react';
import { KelasTab } from '../akademik/KelasTab';
import { PenilaianTab } from '../akademik/PenilaianTab';
import { PresensiTab } from '../akademik/PresensiTab';
import { RaporTab } from '../akademik/RaporTab';
import { PembelajaranTab } from '../akademik/PembelajaranTab';

type ActiveTab =
  | 'pembelajaran'
  | 'kelas'
  | 'penilaian'
  | 'presensi'
  | 'aktivitas'
  | 'pengumuman'
  | 'rapor';

type ViewMode = 'list' | 'add' | 'edit' | 'view' | 'detail';

export function Akademik() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('pembelajaran');

  const tabs = [
    { id: 'pembelajaran', label: 'Pembelajaran', icon: BookOpen },
    { id: 'kelas', label: 'Kelas', icon: Users },
    { id: 'penilaian', label: 'Penilaian', icon: FileText },
    { id: 'presensi', label: 'Presensi', icon: Calendar },
    { id: 'aktivitas', label: 'Aktivitas Harian', icon: FileText },
    { id: 'pengumuman', label: 'Pengumuman', icon: FileText },
    { id: 'rapor', label: 'Rapor Siswa', icon: FileText },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl">Akademik</h1>
        <p className="text-[#64748B] mt-1 text-sm sm:text-base">Kelola kurikulum, pembelajaran, dan penilaian</p>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex overflow-x-auto border-b border-[#E5E7EB] scrollbar-hide">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`px-4 sm:px-6 py-3 sm:py-4 whitespace-nowrap flex items-center gap-2 border-b-2 transition-colors text-sm sm:text-base ${
                  activeTab === tab.id
                    ? 'border-[#E94640] text-[#E94640]'
                    : 'border-transparent text-[#64748B] hover:text-[#E94640]'
                }`}
              >
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">{tab.label}</span>
                <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 sm:p-6">
          {activeTab === 'pembelajaran' && <PembelajaranTab />}
          {activeTab === 'kelas' && <KelasTab />}
          {activeTab === 'penilaian' && <PenilaianTab />}
          {activeTab === 'presensi' && <PresensiTab />}
          {activeTab === 'aktivitas' && <AktivitasTab />}
          {activeTab === 'pengumuman' && <PengumumanTab />}
          {activeTab === 'rapor' && <RaporTab />}
        </div>
      </div>
    </div>
  );
}

// Aktivitas Tab
function AktivitasTab() {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [tanggalAktivitas, setTanggalAktivitas] = useState(new Date().toISOString().split('T')[0]);
  const [tema, setTema] = useState('Diri Sendiri');
  const [pilarKarakter, setPilarKarakter] = useState('Mandiri');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  const aktivitasSiswa = siswa.slice(0, 12).map((s) => ({
    ...s,
    catatanGuru: 'Anak aktif mengikuti pembelajaran',
    catatanOrtu: 'Terima kasih Bu Guru',
  }));

  const filteredSiswa = selectedKelas ? aktivitasSiswa.filter(s => s.kelas === selectedKelas) : [];

  if (viewMode === 'detail' && selectedSiswa) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h3>Detail Aktivitas - {selectedSiswa.nama}</h3>
            <p className="text-[#64748B] mt-1">NISN: {selectedSiswa.nisn} | Tanggal: {tanggalAktivitas} | Tema: {tema}</p>
          </div>
          <button onClick={() => setViewMode('list')} className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
        </div>

        <div className="card p-6">
          <form className="space-y-6">
            {/* Form untuk 5 hari (Senin - Jumat) */}
            {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'].map((hari, idx) => (
              <div key={hari} className="p-4 border-2 border-[#E5E7EB] rounded-xl">
                <h4 className="mb-4 text-[#E94640]">{hari}</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-2">Tanggal *</label>
                    <input type="date" className="input-field" />
                  </div>

                  <div>
                    <label className="block mb-2">Jurnal *</label>
                    <select className="input-field">
                      <option value="">Pilih Jurnal</option>
                      <option>Berbaris</option>
                      <option>Upacara</option>
                      <option>Senam</option>
                      <option>Pembelajaran Inti</option>
                      <option>Istirahat</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2">Pilar Karakter *</label>
                    <select className="input-field">
                      <option value="">Pilih Pilar</option>
                      <option>Religius</option>
                      <option>Nasionalis</option>
                      <option>Mandiri</option>
                      <option>Gotong Royong</option>
                      <option>Integritas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2">Aktivitas *</label>
                    <select className="input-field">
                      <option value="">Pilih Aktivitas</option>
                      <option>Berdoa</option>
                      <option>Bernyanyi</option>
                      <option>Bercerita</option>
                      <option>Menggambar</option>
                      <option>Bermain</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2">Pembiasaan *</label>
                    <select className="input-field">
                      <option value="">Pilih Pembiasaan</option>
                      <option>Cuci Tangan</option>
                      <option>Antri</option>
                      <option>Berbagi</option>
                      <option>Membuang Sampah</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-2">Partisipasi Anak *</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`partisipasi-${idx}`} value="Ya" className="w-4 h-4" />
                        <span>Ya</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`partisipasi-${idx}`} value="Tidak" className="w-4 h-4" />
                        <span>Tidak</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2">Makananku *</label>
                    <div className="flex gap-4 mt-2">
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`makanan-${idx}`} value="Habis" className="w-4 h-4" />
                        <span>Habis</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`makanan-${idx}`} value="Tersisa" className="w-4 h-4" />
                        <span>Tersisa</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`makanan-${idx}`} value="Tidak Makan" className="w-4 h-4" />
                        <span>Tidak Makan</span>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block mb-2">Perasaanku *</label>
                    <div className="flex gap-4 mt-2 flex-wrap">
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`perasaan-${idx}`} value="Senang" className="w-4 h-4" />
                        <span>Senang</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`perasaan-${idx}`} value="Sedih" className="w-4 h-4" />
                        <span>Sedih</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`perasaan-${idx}`} value="Lelah" className="w-4 h-4" />
                        <span>Lelah</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input type="radio" name={`perasaan-${idx}`} value="Lainnya" className="w-4 h-4" />
                        <span>Lainnya</span>
                      </label>
                    </div>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2">Barang yang dibawa besok</label>
                    <input type="text" className="input-field" placeholder="Contoh: Pensil warna, buku gambar" />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2">Catatan Guru</label>
                    <textarea className="input-field" rows={3} placeholder="Catatan untuk orang tua..." />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block mb-2">Catatan Orang Tua</label>
                    <textarea className="input-field" rows={3} placeholder="Catatan dari orang tua..." />
                  </div>
                </div>
              </div>
            ))}

            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2">
                <X className="w-5 h-5" />
                Batal
              </button>
              <button type="submit" className="btn-gradient px-6 py-2.5 rounded-lg flex items-center gap-2">
                <Save className="w-5 h-5" />
                Simpan Aktivitas Mingguan
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
        <div>
          <h3>Aktivitas Harian Siswa</h3>
          <p className="text-[#64748B] mt-1">Jurnal dan catatan aktivitas harian siswa</p>
        </div>
      </div>

      <div className="card p-6">
        <h4 className="mb-4">Aktivitas Mingguan</h4>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block mb-2">Pilih Kelas *</label>
            <select className="input-field" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
              <option value="">-- Pilih Kelas --</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.nama}>{k.nama}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block mb-2">Tanggal Aktivitas *</label>
            <input type="date" className="input-field" value={tanggalAktivitas} onChange={(e) => setTanggalAktivitas(e.target.value)} />
          </div>
          <div>
            <label className="block mb-2">Tema *</label>
            <input type="text" className="input-field" value={tema} onChange={(e) => setTema(e.target.value)} placeholder="Tema pembelajaran" />
          </div>
          <div>
            <label className="block mb-2">Pilar Karakter *</label>
            <select className="input-field" value={pilarKarakter} onChange={(e) => setPilarKarakter(e.target.value)}>
              <option>Pilih Pilar</option>
              <option>Religius</option>
              <option>Nasionalis</option>
              <option>Mandiri</option>
              <option>Gotong Royong</option>
              <option>Integritas</option>
            </select>
          </div>
        </div>
      </div>

      {selectedKelas ? (
        <div className="card p-6">
          <h4 className="mb-4">Daftar Siswa - {selectedKelas}</h4>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="text-left py-3 px-2">No</th>
                  <th className="text-left py-3 px-2">Nama</th>
                  <th className="text-left py-3 px-2">NISN</th>
                  <th className="text-left py-3 px-2">Catatan Guru</th>
                  <th className="text-left py-3 px-2">Catatan Orang Tua</th>
                  <th className="text-left py-3 px-2">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredSiswa.map((s, idx) => (
                  <tr key={s.id} className="border-b border-[#E5E7EB]">
                    <td className="py-3 px-2">{idx + 1}</td>
                    <td className="py-3 px-2">{s.nama}</td>
                    <td className="py-3 px-2">{s.nisn}</td>
                    <td className="py-3 px-2 text-[#64748B]">{s.catatanGuru}</td>
                    <td className="py-3 px-2 text-[#64748B]">{s.catatanOrtu}</td>
                    <td className="py-3 px-2">
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedSiswa(s);
                            setViewMode('detail');
                          }}
                          className="text-[#3B82F6] hover:underline flex items-center gap-1"
                        >
                          <Eye className="w-4 h-4" />
                          Input Detail
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="text-center text-[#64748B] py-12">
          Pilih kelas terlebih dahulu untuk menampilkan daftar siswa
        </div>
      )}
    </div>
  );
}

// Pengumuman Tab
function PengumumanTab() {
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const columns = [
    { key: 'judul', label: 'Judul' },
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'target', label: 'Target' },
  ];

  if (viewMode === 'add' || viewMode === 'edit') {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3>{viewMode === 'add' ? 'Buat' : 'Edit'} Pengumuman</h3>
          <button onClick={() => setViewMode('list')} className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]">
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>
        <div className="card p-6">
          <form className="space-y-4">
            <div>
              <label className="block mb-2">Judul Pengumuman *</label>
              <input type="text" className="input-field" placeholder="Judul pengumuman" defaultValue={selectedItem?.judul} />
            </div>
            <div>
              <label className="block mb-2">Target *</label>
              <select className="input-field" defaultValue={selectedItem?.target}>
                <option value="">Pilih Target</option>
                <option value="Semua">Semua</option>
                <option value="Orang Tua">Orang Tua</option>
                <option value="Guru">Guru</option>
                <option value="Kelas A">Kelas A</option>
                <option value="Kelas B">Kelas B</option>
              </select>
            </div>
            <div>
              <label className="block mb-2">Tanggal Publikasi *</label>
              <input type="date" className="input-field" defaultValue={selectedItem?.tanggal} />
            </div>
            <div>
              <label className="block mb-2">Isi Pengumuman *</label>
              <textarea className="input-field" rows={6} placeholder="Tulis isi pengumuman..." />
            </div>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setViewMode('list')} className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2">
                <X className="w-5 h-5" />
                Batal
              </button>
              <button type="submit" className="btn-gradient px-6 py-2.5 rounded-lg flex items-center gap-2">
                <Save className="w-5 h-5" />
                Publikasikan
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  if (viewMode === 'view' && selectedItem) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3>Detail Pengumuman</h3>
          <button onClick={() => setViewMode('list')} className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2">
            <ArrowLeft className="w-5 h-5" />
            Kembali
          </button>
        </div>
        <div className="card p-6">
          <div className="space-y-4">
            <div>
              <label className="block mb-2">Judul</label>
              <p className="text-[#0F172A]">{selectedItem.judul}</p>
            </div>
            <div>
              <label className="block mb-2">Tanggal</label>
              <p className="text-[#0F172A]">{selectedItem.tanggal}</p>
            </div>
            <div>
              <label className="block mb-2">Target</label>
              <p className="text-[#0F172A]">{selectedItem.target}</p>
            </div>
            <div>
              <label className="block mb-2">Isi Pengumuman</label>
              <p className="text-[#0F172A]">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3>Daftar Pengumuman</h3>
        <button onClick={() => setViewMode('add')} className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Buat Pengumuman
        </button>
      </div>
      <DataTable
        columns={columns}
        data={pengumuman}
        onView={(row) => {
          setSelectedItem(row);
          setViewMode('view');
        }}
        onEdit={(row) => {
          setSelectedItem(row);
          setViewMode('edit');
        }}
        onDelete={(row) => {
          setSelectedItem(row);
          setShowDeleteModal(true);
        }}
      />

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Konfirmasi Hapus" size="sm">
        <div className="space-y-4">
          <p>Apakah Anda yakin ingin menghapus pengumuman <strong>{selectedItem?.judul}</strong>?</p>
          <div className="flex gap-3 justify-end">
            <button onClick={() => setShowDeleteModal(false)} className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9]">
              Batal
            </button>
            <button onClick={() => { setShowDeleteModal(false); setViewMode('list'); }} className="px-6 py-2.5 bg-[#EF4444] text-white rounded-lg hover:bg-[#DC2626]">
              Hapus
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}