import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Modal } from '../Modal';
import { PrintPresensiModal } from '../PrintPresensiModal';
import { siswa, kelas, karyawan } from '../../data/dummyData';
import { Printer, ArrowLeft, Save, X, Plus, Calendar } from 'lucide-react';

type ViewMode = 'list' | 'edit';

export function PresensiTab() {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedPresensi, setSelectedPresensi] = useState<any>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedPrintData, setSelectedPrintData] = useState<any>(null);
  const [presensiStatus, setPresensiStatus] = useState<Record<string, string>>({});

  const presensiData = [
    {
      id: '1',
      tanggal: '2024-12-02',
      kelas: 'Kelas A',
      guru: 'Rina Wulandari, S.Pd',
      hadir: 10,
      izin: 1,
      sakit: 1,
      alpha: 0,
    },
    {
      id: '2',
      tanggal: '2024-12-03',
      kelas: 'Kelas B',
      guru: 'Dewi Kartika, S.Pd',
      hadir: 11,
      izin: 2,
      sakit: 0,
      alpha: 0,
    },
    {
      id: '3',
      tanggal: '2024-12-04',
      kelas: 'Kelas A',
      guru: 'Rina Wulandari, S.Pd',
      hadir: 11,
      izin: 0,
      sakit: 1,
      alpha: 0,
    },
    {
      id: '4',
      tanggal: '2024-12-05',
      kelas: 'Kelas B',
      guru: 'Dewi Kartika, S.Pd',
      hadir: 12,
      izin: 1,
      sakit: 0,
      alpha: 0,
    },
  ];

  const siswaPresensi = siswa.slice(0, 12).map((s, idx) => ({
    ...s,
    status: presensiStatus[s.id] || (idx < 10 ? 'Hadir' : idx === 10 ? 'Izin' : 'Sakit'),
  }));

  const filteredPresensi = selectedKelas 
    ? presensiData.filter(p => p.kelas === selectedKelas) 
    : presensiData;

  const columns = [
    { key: 'tanggal', label: 'Tanggal' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'guru', label: 'Guru' },
    { key: 'hadir', label: 'Hadir' },
    { key: 'izin', label: 'Izin' },
    { key: 'sakit', label: 'Sakit' },
    { key: 'alpha', label: 'Alpha' },
  ];

  const handleView = (row: any) => {
    setSelectedPresensi(row);
    setShowViewModal(true);
  };

  const handleEdit = (row: any) => {
    setSelectedPresensi(row);
    // Initialize presensi status
    const initialStatus: Record<string, string> = {};
    siswaPresensi.forEach((s, idx) => {
      initialStatus[s.id] = idx < 10 ? 'Hadir' : idx === 10 ? 'Izin' : 'Sakit';
    });
    setPresensiStatus(initialStatus);
    setViewMode('edit');
  };

  const handleStatusChange = (siswaId: string, status: string) => {
    setPresensiStatus({
      ...presensiStatus,
      [siswaId]: status,
    });
  };

  const countStatus = (status: string) => {
    return Object.values(presensiStatus).filter(s => s === status).length;
  };

  if (viewMode === 'edit' && selectedPresensi) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg sm:text-xl">Edit Presensi</h3>
            <p className="text-[#64748B] mt-1 text-sm sm:text-base">
              Kelas: {selectedPresensi.kelas} | Tanggal: {selectedPresensi.tanggal}
            </p>
          </div>
          <button 
            onClick={() => setViewMode('list')} 
            className="px-4 py-2 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2 text-sm sm:text-base"
          >
            <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            Kembali
          </button>
        </div>

        <div className="card p-4 sm:p-6">
          <form className="space-y-4">
            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-[#F6F7F9] rounded-lg mb-6">
              <div className="text-center">
                <p className="text-sm text-[#64748B]">Hadir</p>
                <p className="text-xl sm:text-2xl text-[#22C55E]">{countStatus('Hadir')}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#64748B]">Izin</p>
                <p className="text-xl sm:text-2xl text-[#3B82F6]">{countStatus('Izin')}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#64748B]">Sakit</p>
                <p className="text-xl sm:text-2xl text-[#F59E0B]">{countStatus('Sakit')}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-[#64748B]">Alpha</p>
                <p className="text-xl sm:text-2xl text-[#EF4444]">{countStatus('Alpha')}</p>
              </div>
            </div>

            {/* Tabel Presensi dengan Radio Buttons */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#E5E7EB]">
                    <th className="text-left py-3 px-2 text-sm sm:text-base">No</th>
                    <th className="text-left py-3 px-2 text-sm sm:text-base">Nama Siswa</th>
                    <th className="text-left py-3 px-2 text-sm sm:text-base hidden sm:table-cell">NISN</th>
                    <th className="text-left py-3 px-2 text-sm sm:text-base">Status Kehadiran</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaPresensi.map((s, idx) => (
                    <tr key={s.id} className="border-b border-[#E5E7EB]">
                      <td className="py-3 px-2 text-sm sm:text-base">{idx + 1}</td>
                      <td className="py-3 px-2 text-sm sm:text-base">{s.nama}</td>
                      <td className="py-3 px-2 text-sm sm:text-base hidden sm:table-cell">{s.nisn}</td>
                      <td className="py-3 px-2">
                        {/* Radio Buttons untuk Status */}
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                          {[
                            { value: 'Hadir', label: 'Hadir', color: 'text-[#22C55E]' },
                            { value: 'Izin', label: 'Izin', color: 'text-[#3B82F6]' },
                            { value: 'Sakit', label: 'Sakit', color: 'text-[#F59E0B]' },
                            { value: 'Alpha', label: 'Alpha', color: 'text-[#EF4444]' },
                          ].map((option) => (
                            <label key={option.value} className="flex items-center gap-1.5 cursor-pointer">
                              <input
                                type="radio"
                                name={`status-${s.id}`}
                                value={option.value}
                                checked={presensiStatus[s.id] === option.value}
                                onChange={(e) => handleStatusChange(s.id, e.target.value)}
                                className="w-4 h-4"
                              />
                              <span className={`text-xs sm:text-sm ${option.color}`}>{option.label}</span>
                            </label>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
              <button 
                type="button" 
                onClick={() => setViewMode('list')} 
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
                  alert('Presensi berhasil disimpan!');
                  setViewMode('list');
                }}
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h3 className="text-lg sm:text-xl">Presensi Siswa</h3>
        <button
          onClick={() => setShowGenerateModal(true)}
          className="btn-gradient px-4 py-2 rounded-lg flex items-center gap-2 text-sm sm:text-base"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          Buat Presensi Baru
        </button>
      </div>
      
      <div className="card p-4">
        <label className="block mb-2 text-sm">Filter Kelas</label>
        <select 
          className="input-field text-sm sm:text-base" 
          value={selectedKelas} 
          onChange={(e) => setSelectedKelas(e.target.value)}
        >
          <option value="">Semua Kelas</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.nama}>{k.nama}</option>
          ))}
        </select>
      </div>

      <DataTable
        columns={columns}
        data={filteredPresensi}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={(row) => confirm(`Hapus presensi tanggal ${row.tanggal}?`)}
        customActions={(row) => (
          <button
            onClick={() => {
              setSelectedPrintData(row);
              setShowPrintModal(true);
            }}
            className="p-2 text-[#3B82F6] hover:bg-blue-100 rounded-lg transition-colors"
            title="Cetak Presensi"
          >
            <Printer className="w-4 h-4" />
          </button>
        )}
      />

      {/* Modal View Detail Presensi */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title="Detail Presensi"
        size="lg"
      >
        {selectedPresensi && (
          <div className="space-y-6">
            {/* Info Presensi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F6F7F9] rounded-lg">
              <div>
                <p className="text-sm text-[#64748B]">Tanggal</p>
                <p className="text-base sm:text-lg">{selectedPresensi.tanggal}</p>
              </div>
              <div>
                <p className="text-sm text-[#64748B]">Kelas</p>
                <p className="text-base sm:text-lg">{selectedPresensi.kelas}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-sm text-[#64748B]">Guru Pengajar</p>
                <p className="text-base sm:text-lg">{selectedPresensi.guru}</p>
              </div>
            </div>

            {/* Summary Kehadiran */}
            <div>
              <h4 className="mb-4 text-base sm:text-lg">Ringkasan Kehadiran</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 border border-[#E5E7EB] rounded-lg text-center">
                  <p className="text-sm text-[#64748B]">Hadir</p>
                  <p className="text-2xl text-[#22C55E] mt-2">{selectedPresensi.hadir}</p>
                </div>
                <div className="p-4 border border-[#E5E7EB] rounded-lg text-center">
                  <p className="text-sm text-[#64748B]">Izin</p>
                  <p className="text-2xl text-[#3B82F6] mt-2">{selectedPresensi.izin}</p>
                </div>
                <div className="p-4 border border-[#E5E7EB] rounded-lg text-center">
                  <p className="text-sm text-[#64748B]">Sakit</p>
                  <p className="text-2xl text-[#F59E0B] mt-2">{selectedPresensi.sakit}</p>
                </div>
                <div className="p-4 border border-[#E5E7EB] rounded-lg text-center">
                  <p className="text-sm text-[#64748B]">Alpha</p>
                  <p className="text-2xl text-[#EF4444] mt-2">{selectedPresensi.alpha}</p>
                </div>
              </div>
            </div>

            {/* Daftar Siswa Detail */}
            <div>
              <h4 className="mb-4 text-base sm:text-lg">Detail Kehadiran Siswa</h4>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {siswaPresensi.map((s, idx) => (
                  <div key={s.id} className="flex items-center justify-between p-3 border border-[#E5E7EB] rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm sm:text-base">{idx + 1}. {s.nama}</p>
                      <p className="text-xs sm:text-sm text-[#64748B]">NISN: {s.nisn}</p>
                    </div>
                    <div>
                      <span className={`px-3 py-1 rounded-full text-xs sm:text-sm ${
                        s.status === 'Hadir' ? 'bg-[#22C55E] text-white' :
                        s.status === 'Izin' ? 'bg-[#3B82F6] text-white' :
                        s.status === 'Sakit' ? 'bg-[#F59E0B] text-white' :
                        'bg-[#EF4444] text-white'
                      }`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal Print Presensi */}
      <PrintPresensiModal
        isOpen={showPrintModal}
        onClose={() => setShowPrintModal(false)}
        data={selectedPrintData}
      />

      {/* Modal Generate Presensi Baru */}
      <Modal
        isOpen={showGenerateModal}
        onClose={() => setShowGenerateModal(false)}
        title="Buat Presensi Baru"
        size="md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            alert('Presensi baru berhasil dibuat! Silakan isi kehadiran siswa.');
            setShowGenerateModal(false);
          }}
          className="space-y-4"
        >
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>ℹ️ Info:</strong> Form ini akan membuat daftar presensi kosong untuk kelas dan tanggal yang dipilih. 
              Setelah dibuat, Anda dapat mengisi kehadiran siswa melalui menu Edit.
            </p>
          </div>

          <div>
            <label className="block mb-2 text-sm">Tanggal Presensi *</label>
            <input
              type="date"
              className="input-field"
              defaultValue={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">Pilih Kelas *</label>
            <select className="input-field" required>
              <option value="">Pilih Kelas</option>
              {kelas.map((k) => (
                <option key={k.id} value={k.nama}>
                  {k.nama}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm">Guru Pengajar *</label>
            <select className="input-field" required>
              <option value="">Pilih Guru</option>
              {karyawan
                .filter((k) => k.jabatan === 'Guru')
                .map((k) => (
                  <option key={k.id} value={k.nama}>
                    {k.nama}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block mb-2 text-sm">Mata Pelajaran (Opsional)</label>
            <input
              type="text"
              className="input-field"
              placeholder="Contoh: Matematika, Bahasa Indonesia"
            />
          </div>

          <div>
            <label className="block mb-2 text-sm">Keterangan (Opsional)</label>
            <textarea
              className="input-field"
              rows={3}
              placeholder="Catatan tambahan untuk presensi ini"
            />
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
            <button
              type="button"
              onClick={() => setShowGenerateModal(false)}
              className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center gap-2"
            >
              <X className="w-5 h-5" />
              Batal
            </button>
            <button
              type="submit"
              className="btn-gradient px-6 py-2.5 rounded-lg flex items-center gap-2"
            >
              <Calendar className="w-5 h-5" />
              Buat Presensi
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}