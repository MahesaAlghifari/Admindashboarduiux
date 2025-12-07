import React, { useState, useRef, useEffect } from 'react';
import { Modal } from './Modal';
import { X, Printer, Download } from 'lucide-react';
import { kelas, siswa } from '../data/dummyData';
import logo from 'figma:asset/bc989057a5aac4bc88bb651b4a8226696378ac70.png';

interface PrintPresensiModalProps {
  isOpen: boolean;
  onClose: () => void;
  data?: any;
}

export function PrintPresensiModal({ isOpen, onClose, data }: PrintPresensiModalProps) {
  const [selectedKelas, setSelectedKelas] = useState('');
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const printRef = useRef<HTMLDivElement>(null);

  // Auto-fill dari data yang dipilih
  useEffect(() => {
    if (data) {
      setSelectedKelas(data.kelas || '');
      setSelectedDate(data.tanggal || new Date().toISOString().split('T')[0]);
    }
  }, [data]);

  const siswaData = siswa
    .filter((s) => !selectedKelas || s.pesertaDidik?.kelas === selectedKelas)
    .slice(0, 15)
    .map((s, idx) => ({
      id: s.id,
      nama: s.pesertaDidik?.nama || 'N/A',
      nisn: s.pesertaDidik?.nisn || 'N/A',
      kelas: s.pesertaDidik?.kelas || '-',
      status: idx < 12 ? 'Hadir' : idx === 12 ? 'Izin' : idx === 13 ? 'Sakit' : 'Alpha',
    }));

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    // Create new window for printing
    const printWindow = window.open('', '', 'width=800,height=600');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Cetak Presensi - ${selectedDate}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Arial', sans-serif;
              padding: 20px;
              background: white;
            }
            .print-container {
              max-width: 800px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #E94640;
              padding-bottom: 15px;
              margin-bottom: 20px;
            }
            .logo {
              width: 80px;
              height: 80px;
              margin: 0 auto 10px;
            }
            .header h1 {
              font-size: 24px;
              color: #0F172A;
              margin-bottom: 5px;
            }
            .header h2 {
              font-size: 18px;
              color: #E94640;
              margin-bottom: 5px;
            }
            .header p {
              font-size: 12px;
              color: #64748B;
            }
            .info-section {
              margin: 20px 0;
              display: flex;
              justify-content: space-between;
            }
            .info-item {
              font-size: 14px;
            }
            .info-label {
              color: #64748B;
              font-weight: bold;
            }
            .info-value {
              color: #0F172A;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background: linear-gradient(135deg, #E94640, #DA393C);
              color: white;
              padding: 12px 8px;
              text-align: left;
              font-size: 14px;
              border: 1px solid #ddd;
            }
            td {
              padding: 10px 8px;
              border: 1px solid #ddd;
              font-size: 13px;
            }
            tr:nth-child(even) {
              background-color: #F6F7F9;
            }
            .signature-section {
              margin-top: 40px;
              display: flex;
              justify-content: space-between;
            }
            .signature-box {
              text-align: center;
              width: 200px;
            }
            .signature-line {
              margin-top: 60px;
              border-top: 1px solid #0F172A;
              padding-top: 5px;
              font-size: 12px;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 11px;
              color: #64748B;
              border-top: 1px solid #E5E7EB;
              padding-top: 10px;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for images to load before printing
    printWindow.onload = () => {
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }, 250);
    };
  };

  const handleDownloadPDF = () => {
    // For simple implementation, we'll use print to PDF
    // User can select "Save as PDF" in print dialog
    handlePrint();
    alert('Silakan pilih "Save as PDF" di dialog cetak untuk menyimpan sebagai PDF');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Cetak Presensi" size="xl">
      <div className="space-y-6">
        {/* Form Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-[#F6F7F9] rounded-lg">
          <div>
            <label className="block mb-2 text-sm">Pilih Kelas *</label>
            <select
              className="input-field"
              value={selectedKelas}
              onChange={(e) => setSelectedKelas(e.target.value)}
              required
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
            <label className="block mb-2 text-sm">Tanggal *</label>
            <input
              type="date"
              className="input-field"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Preview Area */}
        {selectedKelas && (
          <div className="border border-[#E5E7EB] rounded-lg p-6 bg-white">
            <div ref={printRef} className="print-container">
              {/* Header with Logo */}
              <div className="header">
                <img src={logo} alt="Logo" className="logo" />
                <h1>YAYASAN SUCI SUTJIPTO</h1>
                <h2>PAUD SEKOLAH SS</h2>
                <p>
                  Jl. Contoh No. 123, Jakarta | Telp: (021) 1234567 | Email:
                  info@paudss.sch.id
                </p>
              </div>

              {/* Document Title */}
              <div style={{ textAlign: 'center', margin: '20px 0' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A' }}>
                  DAFTAR PRESENSI SISWA
                </h3>
              </div>

              {/* Info Section */}
              <div className="info-section">
                <div className="info-item">
                  <span className="info-label">Kelas: </span>
                  <span className="info-value">{selectedKelas}</span>
                </div>
                <div className="info-item">
                  <span className="info-label">Tanggal: </span>
                  <span className="info-value">{formatDate(selectedDate)}</span>
                </div>
              </div>

              {/* Attendance Table */}
              <table>
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>No</th>
                    <th>NISN</th>
                    <th>Nama Siswa</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Hadir</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Izin</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Sakit</th>
                    <th style={{ width: '80px', textAlign: 'center' }}>Alpha</th>
                  </tr>
                </thead>
                <tbody>
                  {siswaData.map((s, idx) => (
                    <tr key={s.id}>
                      <td style={{ textAlign: 'center' }}>{idx + 1}</td>
                      <td>{s.nisn}</td>
                      <td>{s.nama}</td>
                      <td style={{ textAlign: 'center' }}>
                        {s.status === 'Hadir' ? '✓' : ''}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.status === 'Izin' ? '✓' : ''}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.status === 'Sakit' ? '✓' : ''}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {s.status === 'Alpha' ? '✓' : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div style={{ marginTop: '20px', padding: '10px', background: '#F6F7F9', borderRadius: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-around', fontSize: '14px' }}>
                  <div>
                    <strong>Total Hadir:</strong> {siswaData.filter(s => s.status === 'Hadir').length}
                  </div>
                  <div>
                    <strong>Total Izin:</strong> {siswaData.filter(s => s.status === 'Izin').length}
                  </div>
                  <div>
                    <strong>Total Sakit:</strong> {siswaData.filter(s => s.status === 'Sakit').length}
                  </div>
                  <div>
                    <strong>Total Alpha:</strong> {siswaData.filter(s => s.status === 'Alpha').length}
                  </div>
                </div>
              </div>

              {/* Signature Section */}
              <div className="signature-section">
                <div className="signature-box">
                  <p style={{ fontSize: '12px', marginBottom: '5px' }}>Mengetahui,</p>
                  <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Kepala Sekolah</p>
                  <div className="signature-line">(...........................)</div>
                </div>
                <div className="signature-box">
                  <p style={{ fontSize: '12px', marginBottom: '5px' }}>
                    Jakarta, {formatDate(selectedDate)}
                  </p>
                  <p style={{ fontSize: '13px', fontWeight: 'bold' }}>Guru Kelas</p>
                  <div className="signature-line">(...........................)</div>
                </div>
              </div>

              {/* Footer */}
              <div className="footer">
                Dicetak pada: {new Date().toLocaleString('id-ID')} | PAUD Yayasan Suci
                Sutjipto
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-[#E5E7EB]">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 border border-[#E5E7EB] rounded-lg hover:bg-[#F6F7F9] flex items-center justify-center gap-2"
          >
            <X className="w-5 h-5" />
            Tutup
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={!selectedKelas}
            className="px-6 py-2.5 bg-[#3B82F6] text-white rounded-lg hover:bg-[#2563EB] disabled:bg-[#94A3B8] flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Download PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!selectedKelas}
            className="btn-gradient px-6 py-2.5 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer className="w-5 h-5" />
            Cetak
          </button>
        </div>
      </div>
    </Modal>
  );
}