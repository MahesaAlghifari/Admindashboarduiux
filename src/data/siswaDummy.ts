// Data Siswa dengan Struktur Buku Induk PAUD
// Menggunakan format nested structure sesuai standar PAUD

export const siswa = [
  // Kelas A - 12 siswa
  {
    id: '1',
    status: 'Aktif',
    kelasId: '1',
    peserta_didik: {
      nama_lengkap: 'Aisyah Zahra Putri',
      nama_panggilan: 'Aisyah',
      jenis_kelamin: 'Perempuan',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2020-03-15',
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
      alamat_rumah: 'Jl. Kebon Jeruk No. 12, Jakarta Barat',
      telepon_hp: '081234560001',
      status_tempat_tinggal: 'Rumah Sendiri',
      jarak_ke_sekolah: '2 km',
      nomor_induk: '0124567890'
    },
    orang_tua: {
      ayah: {
        nama: 'Muhammad Rizki',
        pendidikan: 'S1',
        pekerjaan: 'Wiraswasta'
      },
      ibu: {
        nama: 'Siti Fatimah',
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
        kelompok_umur: 'Kelas A'
      },
      prestasi_belajar: 'Sangat Baik',
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
    }
  },
  {
    id: '2',
    status: 'Aktif',
    kelasId: '1',
    peserta_didik: {
      nama_lengkap: 'Farhan Ahmad Hakim',
      nama_panggilan: 'Farhan',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2020-04-20',
      agama: 'Islam',
      kewarganegaraan: 'Indonesia',
      jumlah_saudara: {
        kandung: '0',
        tiri: '0',
        angkat: '0'
      },
      bahasa_sehari_hari: 'Indonesia',
      keadaan_jasmani: {
        berat_badan: '19',
        tinggi_badan: '107',
        golongan_darah: 'B',
        riwayat_penyakit: '-'
      },
      alamat_rumah: 'Jl. Mampang No. 8, Jakarta Selatan',
      telepon_hp: '081234560002',
      status_tempat_tinggal: 'Rumah Sendiri',
      jarak_ke_sekolah: '1.5 km',
      nomor_induk: '0124567891'
    },
    orang_tua: {
      ayah: {
        nama: 'Ahmad Fauzi',
        pendidikan: 'S2',
        pekerjaan: 'PNS'
      },
      ibu: {
        nama: 'Dewi Sartika',
        pendidikan: 'S1',
        pekerjaan: 'Guru'
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
        kelompok_umur: 'Kelas A'
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
    }
  },
  {
    id: '3',
    status: 'Aktif',
    kelasId: '1',
    peserta_didik: {
      nama_lengkap: 'Naura Kamila Azzahra',
      nama_panggilan: 'Naura',
      jenis_kelamin: 'Perempuan',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2020-05-10',
      agama: 'Islam',
      kewarganegaraan: 'Indonesia',
      jumlah_saudara: {
        kandung: '2',
        tiri: '0',
        angkat: '0'
      },
      bahasa_sehari_hari: 'Indonesia',
      keadaan_jasmani: {
        berat_badan: '17',
        tinggi_badan: '103',
        golongan_darah: 'O',
        riwayat_penyakit: '-'
      },
      alamat_rumah: 'Jl. Tebet Raya No. 45, Jakarta Selatan',
      telepon_hp: '081234560003',
      status_tempat_tinggal: 'Rumah Sendiri',
      jarak_ke_sekolah: '3 km',
      nomor_induk: '0124567892'
    },
    orang_tua: {
      ayah: {
        nama: 'Doni Pratama',
        pendidikan: 'S1',
        pekerjaan: 'Karyawan Swasta'
      },
      ibu: {
        nama: 'Ratna Sari',
        pendidikan: 'D3',
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
        kelompok_umur: 'Kelas A'
      },
      prestasi_belajar: 'Sangat Baik',
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
    }
  },
  {
    id: '4',
    status: 'Aktif',
    kelasId: '1',
    peserta_didik: {
      nama_lengkap: 'Rizky Aditya Pratama',
      nama_panggilan: 'Rizky',
      jenis_kelamin: 'Laki-laki',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2020-02-28',
      agama: 'Islam',
      kewarganegaraan: 'Indonesia',
      jumlah_saudara: {
        kandung: '1',
        tiri: '0',
        angkat: '0'
      },
      bahasa_sehari_hari: 'Indonesia',
      keadaan_jasmani: {
        berat_badan: '20',
        tinggi_badan: '108',
        golongan_darah: 'AB',
        riwayat_penyakit: '-'
      },
      alamat_rumah: 'Jl. Cempaka Putih No. 22, Jakarta Pusat',
      telepon_hp: '081234560004',
      status_tempat_tinggal: 'Rumah Sendiri',
      jarak_ke_sekolah: '2.5 km',
      nomor_induk: '0124567893'
    },
    orang_tua: {
      ayah: {
        nama: 'Budi Setiawan',
        pendidikan: 'S1',
        pekerjaan: 'Wiraswasta'
      },
      ibu: {
        nama: 'Ani Widiastuti',
        pendidikan: 'SMA',
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
        kelompok_umur: 'Kelas A'
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
    }
  },
  {
    id: '5',
    status: 'Aktif',
    kelasId: '1',
    peserta_didik: {
      nama_lengkap: 'Salma Nurhaliza',
      nama_panggilan: 'Salma',
      jenis_kelamin: 'Perempuan',
      tempat_lahir: 'Jakarta',
      tanggal_lahir: '2020-06-05',
      agama: 'Islam',
      kewarganegaraan: 'Indonesia',
      jumlah_saudara: {
        kandung: '0',
        tiri: '0',
        angkat: '0'
      },
      bahasa_sehari_hari: 'Indonesia',
      keadaan_jasmani: {
        berat_badan: '16',
        tinggi_badan: '102',
        golongan_darah: 'A',
        riwayat_penyakit: '-'
      },
      alamat_rumah: 'Jl. Pasar Minggu No. 17, Jakarta Selatan',
      telepon_hp: '081234560005',
      status_tempat_tinggal: 'Rumah Sendiri',
      jarak_ke_sekolah: '1 km',
      nomor_induk: '0124567894'
    },
    orang_tua: {
      ayah: {
        nama: 'Hendra Gunawan',
        pendidikan: 'S2',
        pekerjaan: 'Dosen'
      },
      ibu: {
        nama: 'Lia Amelia',
        pendidikan: 'S1',
        pekerjaan: 'Karyawan Swasta'
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
        kelompok_umur: 'Kelas A'
      },
      prestasi_belajar: 'Sangat Baik',
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
    }
  },
];
