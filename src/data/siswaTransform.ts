// Transform existing siswa data to new Buku Induk format
// This adds nested peserta_didik structure to existing flat data

export function transformSiswaToNested(siswa: any) {
  return siswa.map((s: any) => ({
    id: s.id,
    status: s.status,
    kelasId: s.kelasId,
    
    // NEW: Nested structure for Buku Induk PAUD
    peserta_didik: {
      nama_lengkap: s.nama,
      nama_panggilan: s.nama.split(' ')[0], // First name as nickname
      jenis_kelamin: s.jenisKelamin,
      tempat_lahir: s.tempatLahir,
      tanggal_lahir: s.tanggalLahir,
      agama: 'Islam',
      kewarganegaraan: 'Indonesia',
      jumlah_saudara: {
        kandung: '1',
        tiri: '0',
        angkat: '0'
      },
      bahasa_sehari_hari: 'Indonesia',
      keadaan_jasmani: {
        berat_badan: '18',
        tinggi_badan: '105',
        golongan_darah: 'A',
        riwayat_penyakit: '-'
      },
      alamat_rumah: s.alamat,
      telepon_hp: s.teleponOrtu,
      status_tempat_tinggal: 'Rumah Sendiri',
      jarak_ke_sekolah: '2 km',
      nomor_induk: s.nisn,
      kelas: s.kelas  // Keep for compatibility
    },
    
    orang_tua: {
      ayah: {
        nama: s.namaAyah,
        pendidikan: 'S1',
        pekerjaan: 'Wiraswasta'
      },
      ibu: {
        nama: s.namaIbu,
        pendidikan: 'S1',
        pekerjaan: 'Ibu Rumah Tangga'
      }
    },
    
    wali: {
      nama: '-',
      hubungan_keluarga: '-',
      pendidikan_tertinggi: '-',
      pekerjaan: '-'
    },
    
    perkembangan_peserta_didik: {
      pendidikan_sebelumnya: '-',
      masuk_peserta_didik_baru: {
        asal_peserta_didik: 'Baru',
        nama_lembaga: '-',
        alamat_lembaga: '-'
      },
      pindah_dari_lembaga_lain: {
        nama_lembaga_asal: '-',
        alamat_lembaga_asal: '-',
        dari_kelompok_umur: '-'
      },
      diterima_di_lembaga_ini: {
        tanggal_diterima: '2023-07-10',
        kelompok_umur: s.kelas
      },
      prestasi_belajar: 'Baik',
      keadaan_jasmani_per_tahun: []
    },
    
    meninggalkan_lembaga: {
      tamat_belajar: {
        tahun_pelajaran: '',
        nomor_tanggal_surat: '',
        melanjutkan_ke_lembaga: ''
      },
      pindah_lembaga: {
        dari_kelompok_umur: '',
        ke_lembaga: '',
        tingkat_kelompok_umur: '',
        tanggal_pindah: ''
      },
      keluar_lembaga: {
        tanggal: '',
        sebab_alasan: ''
      }
    },
    
    lain_lain: {
      catatan_penting: ''
    },
    
    // Keep old properties for backward compatibility  
    nama: s.nama,
    nisn: s.nisn,
    kelas: s.kelas,
    jenisKelamin: s.jenisKelamin,
    tempatLahir: s.tempatLahir,
    tanggalLahir: s.tanggalLahir,
    alamat: s.alamat,
    namaAyah: s.namaAyah,
    namaIbu: s.namaIbu,
    teleponOrtu: s.teleponOrtu,
    email: s.email
  }));
}
