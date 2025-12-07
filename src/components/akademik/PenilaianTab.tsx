import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { StatusBadge } from '../StatusBadge';
import { siswa, kelas, indikatorPembelajaran } from '../../data/dummyData';
import { ArrowLeft, Save, X } from 'lucide-react';

type ViewMode = 'list' | 'edit';

export function PenilaianTab() {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);
  const [penilaianData, setPenilaianData] = useState<Record<string, { nilai: string; catatan: string }>>({});

  const dataSiswa = siswa.slice(0, 10).map((s) => ({
    ...s,
    nama: s.pesertaDidik?.nama || 'N/A',
    nisn: s.pesertaDidik?.nisn || 'N/A',
    kelas: s.pesertaDidik?.kelas || '-',
    guru: 'Rina Wulandari, S.Pd',
    statusPenilaian: s.id === '1' ? 'Final' : 'Draft',
  }));

  const filteredData = selectedKelas ? dataSiswa.filter(s => s.kelas === selectedKelas) : [];

  const columns = [
    { key: 'nama', label: 'Nama Siswa' },
    { key: 'nisn', label: 'NISN' },
    { key: 'guru', label: 'Guru' },
    {
      key: 'statusPenilaian',
      label: 'Status Penilaian',
      render: (value: string) => <StatusBadge status={value} type="penilaian" />,
    },
  ];

  const handleNilaiChange = (indikatorId: string, nilai: string) => {
    setPenilaianData({
      ...penilaianData,
      [indikatorId]: {
        ...penilaianData[indikatorId],
        nilai,
      },
    });
  };

  const handleCatatanChange = (indikatorId: string, catatan: string) => {
    setPenilaianData({
      ...penilaianData,
      [indikatorId]: {
        ...penilaianData[indikatorId],
        catatan,
      },
    });
  };

  // Group indikator berdasarkan aspek
  const aspekGroups = indikatorPembelajaran.reduce((acc: any, ind) => {
    if (!acc[ind.aspek]) {
      acc[ind.aspek] = [];
    }
    acc[ind.aspek].push(ind);
    return acc;
  }, {});

  if (viewMode === 'edit' && selectedSiswa) {
    return (
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg sm:text-xl">Input Nilai - {selectedSiswa.nama}</h3>
            <p className="text-[#64748B] mt-1 text-sm sm:text-base">NISN: {selectedSiswa.nisn} | Kelas: {selectedSiswa.kelas}</p>
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
          <form className="space-y-6">
            <div>
              <h4 className="mb-4 text-base sm:text-lg">Penilaian Berdasarkan Indikator Pembelajaran</h4>
              
              {Object.entries(aspekGroups).map(([aspekNama, indikators]: [string, any]) => (
                <div key={aspekNama} className="mb-8 p-4 sm:p-6 border border-[#E5E7EB] rounded-xl bg-[#F6F7F9]">
                  <h4 className="text-[#0F172A] mb-4 text-sm sm:text-base pb-3 border-b border-[#E5E7EB]">
                    {aspekNama}
                  </h4>
                  
                  <div className="space-y-6">
                    {indikators.map((indikator: any) => (
                      <div key={indikator.id} className="bg-white p-4 rounded-lg border border-[#E5E7EB]">
                        {/* Sub Aspek & Indikator */}
                        <div className="mb-4">
                          <div className="flex items-start gap-2 mb-2">
                            <span className="text-xs font-semibold text-white bg-[#E94640] px-2 py-1 rounded">
                              {indikator.kode}
                            </span>
                            <div className="flex-1">
                              <p className="text-sm text-[#64748B]">{indikator.subAspek}</p>
                            </div>
                          </div>
                          <p className="text-sm sm:text-base text-[#0F172A] ml-12">
                            <strong>Indikator:</strong> {indikator.indikator}
                          </p>
                        </div>

                        {/* Radio Buttons untuk Nilai */}
                        <div className="mb-4">
                          <label className="block mb-3 text-sm">Pilih Nilai *</label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {[
                              { value: 'BB', label: 'BB - Belum Berkembang', color: 'bg-[#EF4444]' },
                              { value: 'MB', label: 'MB - Mulai Berkembang', color: 'bg-[#F59E0B]' },
                              { value: 'BSH', label: 'BSH - Berkembang Sesuai Harapan', color: 'bg-[#3B82F6]' },
                              { value: 'BSB', label: 'BSB - Berkembang Sangat Baik', color: 'bg-[#22C55E]' },
                            ].map((option) => (
                              <label 
                                key={option.value} 
                                className="flex items-center gap-3 p-3 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] cursor-pointer transition-colors"
                              >
                                <input
                                  type="radio"
                                  name={`nilai-${indikator.id}`}
                                  value={option.value}
                                  checked={penilaianData[indikator.id]?.nilai === option.value}
                                  onChange={(e) => handleNilaiChange(indikator.id, e.target.value)}
                                  className="w-4 h-4"
                                />
                                <div className="flex items-center gap-2 flex-1">
                                  <div className={`w-3 h-3 rounded-full ${option.color}`} />
                                  <span className="text-xs sm:text-sm">{option.label}</span>
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        {/* Catatan */}
                        <div>
                          <label className="block mb-2 text-sm">Catatan</label>
                          <textarea
                            className="input-field text-sm sm:text-base"
                            rows={2}
                            placeholder="Catatan penilaian untuk indikator ini..."
                            value={penilaianData[indikator.id]?.catatan || ''}
                            onChange={(e) => handleCatatanChange(indikator.id, e.target.value)}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
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
                type="button" 
                className="px-6 py-2.5 bg-[#F59E0B] text-white rounded-lg hover:bg-[#D97706] flex items-center justify-center gap-2 text-sm sm:text-base"
                onClick={() => {
                  alert('Nilai disimpan sebagai Draft');
                }}
              >
                Simpan sebagai Draft
              </button>
              <button 
                type="submit" 
                className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 text-sm sm:text-base"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Nilai berhasil difinalisasi!');
                  setViewMode('list');
                }}
              >
                <Save className="w-5 h-5" />
                Finalisasi Nilai
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl">Penilaian Siswa</h3>
      
      <div className="card p-4 bg-[#E0F2FE] border border-[#3B82F6]">
        <p className="text-[#1E40AF] text-sm sm:text-base">
          <strong>Status Penilaian:</strong> Draft (bebas edit) | Final (tidak bisa diedit)
        </p>
      </div>

      <div className="card p-4">
        <label className="block mb-2 text-sm">Pilih Kelas *</label>
        <select 
          className="input-field text-sm sm:text-base" 
          value={selectedKelas} 
          onChange={(e) => setSelectedKelas(e.target.value)}
        >
          <option value="">-- Pilih Kelas --</option>
          {kelas.map((k) => (
            <option key={k.id} value={k.nama}>{k.nama}</option>
          ))}
        </select>
      </div>

      {selectedKelas ? (
        <DataTable
          columns={columns}
          data={filteredData}
          onView={(row) => {
            setSelectedSiswa(row);
            setViewMode('edit');
          }}
          showActions={true}
        />
      ) : (
        <div className="text-center text-[#64748B] py-12 text-sm sm:text-base">
          Pilih kelas terlebih dahulu untuk menampilkan daftar siswa
        </div>
      )}
    </div>
  );
}