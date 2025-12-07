import React, { useState } from 'react';
import { DataTable } from '../DataTable';
import { Modal } from '../Modal';
import { siswa, kelas } from '../../data/dummyData';
import { Save, X, Download } from 'lucide-react';

export function RaporTab() {
  const [showModal, setShowModal] = useState(false);
  const [selectedSiswa, setSelectedSiswa] = useState<any>(null);

  const raporData = siswa.map((s) => ({
    ...s,
    tahunAjar: '2024/2025',
    semester: 'I & II',
    status: s.id === '1' || s.id === '13' ? 'Sudah Terbit' : 'Belum Terbit',
  }));

  const columns = [
    { key: 'nama', label: 'Nama Siswa' },
    { key: 'nisn', label: 'NISN' },
    { key: 'kelas', label: 'Kelas' },
    { key: 'tahunAjar', label: 'Tahun Ajar' },
    { 
      key: 'status', 
      label: 'Status',
      render: (value: string) => (
        <span className={`px-3 py-1 rounded-full text-xs ${
          value === 'Sudah Terbit' 
            ? 'bg-[#22C55E] text-white' 
            : 'bg-[#F59E0B] text-white'
        }`}>
          {value}
        </span>
      ),
    },
  ];

  const handleView = (row: any) => {
    setSelectedSiswa(row);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg sm:text-xl">Rapor Siswa</h3>

      <DataTable
        columns={columns}
        data={raporData}
        onView={handleView}
        showEdit={false}
        showDelete={false}
      />

      {/* Modal Rapor */}
      {showModal && selectedSiswa && (
        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          title=""
          size="full"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl">
                Rapor Siswa
              </h3>
              <p className="text-sm text-[#64748B] mt-1">
                Laporan Hasil Perkembangan Anak Didik
              </p>
            </div>
            <button
              onClick={() => setShowModal(false)}
              className="p-2 hover:bg-[#F6F7F9] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Info Siswa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6 p-4 bg-[#F6F7F9] rounded-xl">
            <div>
              <label className="text-sm text-[#64748B]">
                Nama Anak Didik
              </label>
              <p className="text-[#0F172A]">
                {selectedSiswa.nama}
              </p>
            </div>
            <div>
              <label className="text-sm text-[#64748B]">
                Kelompok (Usia)
              </label>
              <p className="text-[#0F172A]">
                {selectedSiswa.kelas} ({selectedSiswa.kelas === 'Kelas A' ? '4-5 Tahun' : '5-6 Tahun'})
              </p>
            </div>
            <div className="sm:col-span-2">
              <label className="text-sm text-[#64748B]">
                Tahun Pelajaran
              </label>
              <p className="text-[#0F172A]">{selectedSiswa.tahunAjar}</p>
            </div>
          </div>

          {/* Tabel Penilaian */}
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
            <div className="bg-gradient-to-r from-[#E94640] to-[#DA393C] text-white p-3 text-center">
              <h4>
                Indikator dan Tingkat Pencapaian Perkembangan
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#F6F7F9]">
                  <tr>
                    <th
                      className="text-left py-3 px-3 text-sm text-[#64748B] border-r border-[#E5E7EB]"
                      rowSpan={2}
                    >
                      Penilaian
                    </th>
                    <th
                      className="text-center py-3 px-3 text-sm text-[#64748B] border-r border-[#E5E7EB]"
                      colSpan={4}
                    >
                      Semester I
                    </th>
                    <th
                      className="text-center py-3 px-3 text-sm text-[#64748B]"
                      colSpan={4}
                    >
                      Semester II
                    </th>
                  </tr>
                  <tr>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      BB
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      MB
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      BSH
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      BSB
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      BB
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      MB
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                      BSH
                    </th>
                    <th className="text-center py-2 px-2 text-xs text-[#64748B] border-t border-[#E5E7EB]">
                      BSB
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {/* NILAI AGAMA DAN MORAL */}
                  <tr className="bg-blue-50">
                    <td
                      colSpan={9}
                      className="py-2 px-3 text-[#0F172A] border-b border-[#E5E7EB]"
                    >
                      NILAI AGAMA DAN MORAL
                    </td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-2 px-3 text-sm text-[#0F172A] border-r border-[#E5E7EB]">
                      1.1 Mempercayai adanya Tuhan melalui ciptaan-Nya
                    </td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td></td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB] hover:bg-[#F6F7F9]">
                    <td className="py-2 px-3 pl-6 text-sm text-[#334155] border-r border-[#E5E7EB]">
                      1. Terbiasa menyebut nama Tuhan sebagai pencipta
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s1"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="radio"
                        name="1-1-1-s2"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB] hover:bg-[#F6F7F9]">
                    <td className="py-2 px-3 pl-6 text-sm text-[#334155] border-r border-[#E5E7EB]">
                      2. Terbiasa mengucapkan kalimat pujian terhadap
                      ciptaan Tuhan
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s1"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-1-2-s2"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="radio"
                        name="1-1-2-s2"
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-2 px-3 text-sm text-[#0F172A] border-r border-[#E5E7EB]">
                      1.2 Menghargai diri sendiri, orang lain, dan
                      lingkungan sekitar sebagai rasa syukur kepada Tuhan
                    </td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td></td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB] hover:bg-[#F6F7F9]">
                    <td className="py-2 px-3 pl-6 text-sm text-[#334155] border-r border-[#E5E7EB]">
                      1. Menghormati (toleransi) agama orang lain
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s1"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="1-2-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="radio"
                        name="1-2-1-s2"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                  </tr>
                  {/* FISIK MOTORIK */}
                  <tr className="bg-green-50">
                    <td
                      colSpan={9}
                      className="py-2 px-3 text-[#0F172A] border-b border-[#E5E7EB]"
                    >
                      FISIK MOTORIK
                    </td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB]">
                    <td className="py-2 px-3 text-sm text-[#0F172A] border-r border-[#E5E7EB]">
                      2.1 Memiliki perilaku yang mencerminkan hidup sehat
                    </td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td className="border-r border-[#E5E7EB]"></td>
                    <td></td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB] hover:bg-[#F6F7F9]">
                    <td className="py-2 px-3 pl-6 text-sm text-[#334155] border-r border-[#E5E7EB]">
                      1. Terbiasa makan makanan bergizi seimbang
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s1"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-1-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="radio"
                        name="2-1-1-s2"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                  </tr>
                  <tr className="border-b border-[#E5E7EB] hover:bg-[#F6F7F9]">
                    <td className="py-2 px-3 pl-6 text-sm text-[#334155] border-r border-[#E5E7EB]">
                      2. Terbiasa memelihara kebersihan diri dan
                      lingkungan
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s1"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s1"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s2"
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name="2-1-2-s2"
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="radio"
                        name="2-1-2-s2"
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Catatan Semester */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-[#64748B] mb-2">
                Catatan Semester I
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 text-sm"
                placeholder="Masukkan catatan perkembangan anak..."
                defaultValue="Anak menunjukkan perkembangan yang baik dalam aspek nilai agama dan moral."
              />
            </div>
            <div>
              <label className="block text-sm text-[#64748B] mb-2">
                Catatan Semester II
              </label>
              <textarea
                rows={4}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 text-sm"
                placeholder="Masukkan catatan perkembangan anak..."
              />
            </div>
          </div>

          {/* Program Ekstrakurikuler */}
          <div className="border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
            <div className="bg-[#F6F7F9] p-3">
              <h4 className="text-[#0F172A]">
                Program Kegiatan Ekstrakurikuler
              </h4>
            </div>
            <table className="w-full">
              <thead className="bg-[#F6F7F9]">
                <tr>
                  <th
                    className="text-left py-2 px-3 text-sm text-[#64748B] border-r border-[#E5E7EB]"
                    rowSpan={2}
                  >
                    No
                  </th>
                  <th
                    className="text-left py-2 px-3 text-sm text-[#64748B] border-r border-[#E5E7EB]"
                    rowSpan={2}
                  >
                    Program Kegiatan
                  </th>
                  <th
                    className="text-center py-2 px-3 text-sm text-[#64748B] border-r border-[#E5E7EB]"
                    colSpan={4}
                  >
                    Semester I
                  </th>
                  <th
                    className="text-center py-2 px-3 text-sm text-[#64748B]"
                    colSpan={4}
                  >
                    Semester II
                  </th>
                </tr>
                <tr>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    A
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    B
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    C
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    D
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    A
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    B
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-r border-t border-[#E5E7EB]">
                    C
                  </th>
                  <th className="text-center py-2 px-2 text-xs text-[#64748B] border-t border-[#E5E7EB]">
                    D
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { no: 1, name: 'Menari' },
                  { no: 2, name: 'Menyanyi' },
                  { no: 3, name: 'Melukis' },
                  { no: 4, name: 'Olahraga' },
                ].map((activity) => (
                  <tr
                    key={activity.no}
                    className="border-b border-[#E5E7EB]"
                  >
                    <td className="text-center py-2 px-3 text-sm border-r border-[#E5E7EB]">
                      {activity.no}
                    </td>
                    <td className="py-2 px-3 text-sm border-r border-[#E5E7EB]">
                      {activity.name}
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s1`}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s1`}
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s1`}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s1`}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s2`}
                        className="w-4 h-4"
                        defaultChecked
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s2`}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2 border-r border-[#E5E7EB]">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s2`}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="text-center py-2 px-2">
                      <input
                        type="radio"
                        name={`extra-${activity.no}-s2`}
                        className="w-4 h-4"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pertumbuhan & Kehadiran */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-[#E5E7EB] rounded-xl p-4">
              <h4 className="text-[#0F172A] mb-3">
                Semester I
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#64748B] mb-2">
                    1. Pertumbuhan
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#64748B]">
                        Berat Badan
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                          defaultValue="18"
                        />
                        <span className="text-xs text-[#64748B]">Kg</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#64748B]">
                        Tinggi Badan
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                          defaultValue="105"
                        />
                        <span className="text-xs text-[#64748B]">cm</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#64748B] mb-2">
                    2. Kehadiran
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">
                        Sakit
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                          defaultValue="2"
                        />
                        <span className="text-xs text-[#64748B]">
                          hari
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Izin</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                          defaultValue="1"
                        />
                        <span className="text-xs text-[#64748B]">
                          hari
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">
                        Tanpa Keterangan
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                          defaultValue="0"
                        />
                        <span className="text-xs text-[#64748B]">
                          hari
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-[#E5E7EB] rounded-xl p-4">
              <h4 className="text-[#0F172A] mb-3">
                Semester II
              </h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-[#64748B] mb-2">
                    1. Pertumbuhan
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[#64748B]">
                        Berat Badan
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-[#64748B]">Kg</span>
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-[#64748B]">
                        Tinggi Badan
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-full px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-[#64748B]">cm</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#64748B] mb-2">
                    2. Kehadiran
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">
                        Sakit
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-[#64748B]">
                          hari
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">Izin</span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-[#64748B]">
                          hari
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#64748B]">
                        Tanpa Keterangan
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          className="w-16 px-2 py-1 border border-[#E5E7EB] rounded text-sm"
                          placeholder="0"
                        />
                        <span className="text-xs text-[#64748B]">
                          hari
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Komentar Orang Tua */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm text-[#64748B] mb-2">
                Komentar Orang Tua Semester I
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 text-sm"
                placeholder="Komentar dari orang tua..."
              />
            </div>
            <div>
              <label className="block text-sm text-[#64748B] mb-2">
                Komentar Orang Tua Semester II
              </label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E94640]/20 text-sm"
                placeholder="Komentar dari orang tua..."
              />
            </div>
          </div>

          {/* Tanda Tangan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="border border-[#E5E7EB] rounded-xl p-4">
              <h4 className="text-[#0F172A] mb-4 text-center">
                Tanda Tangan Semester I
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-[#64748B] mb-12">
                    Kepala TK
                  </p>
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <p className="text-sm text-[#0F172A]">
                      Dr. Siti Aminah, S.Pd
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#64748B] mb-12">
                    Guru Kelas
                  </p>
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <p className="text-sm text-[#0F172A]">
                      Rina Wulandari, S.Pd
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="border border-[#E5E7EB] rounded-xl p-4">
              <h4 className="text-[#0F172A] mb-4 text-center">
                Tanda Tangan Semester II
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <p className="text-sm text-[#64748B] mb-12">
                    Kepala TK
                  </p>
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <p className="text-sm text-[#0F172A]">
                      Dr. Siti Aminah, S.Pd
                    </p>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#64748B] mb-12">
                    Guru Kelas
                  </p>
                  <div className="border-t border-[#E5E7EB] pt-2">
                    <p className="text-sm text-[#0F172A]">
                      Rina Wulandari, S.Pd
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => setShowModal(false)}
              className="w-full sm:flex-1 px-4 py-3 border border-[#E5E7EB] rounded-xl hover:bg-[#F6F7F9] transition-colors"
            >
              Tutup
            </button>
            <button className="w-full sm:flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E94640] to-[#DA393C] text-white rounded-xl hover:shadow-lg transition-all">
              <Save className="w-5 h-5" />
              Simpan Rapor
            </button>
            <button className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#E94640] to-[#DA393C] text-white rounded-xl hover:shadow-lg transition-all">
              <Download className="w-5 h-5" />
              Export PDF
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
