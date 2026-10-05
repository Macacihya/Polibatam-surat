export type PolibatamResponseLogin = {
  error_code: number;
  error_desc: string;
  data: {
    secretkey: string;
  };
};

export type PolibatamResponseBiodata = {
  error_code: number;
  error_desc: string;
  data: PolibatamBiodata;
};

export type PolibatamBiodata = {
  id: string;
  nik: string;
  nama: string;
  role: string;
  status_karyawan: string;
  jk: string;
  email: string;
  status_kontrak: string;
  unit_kerja: string;
  nik_kepala: string;
  nama_kepala: string;
  kelas: string;
  pararel: string;
  dosen_wali: string;
  status_mahasiswa: string;
  angkatan: string;
  semester_masuk: string;
  jenis_daftar: string;
  jurusan: string;
  prodi: string;
  jenjang: string;
  is_admin: boolean;
};

export type PolibatamPegawai = {
  NIK: string;
  NIP: string;
  NAMA: string;
  GELAR_DPN: string | null;
  GELAR_BLK: string;
  AGAMA: string;
  EMAIL: string;
  SEX: string;
  NOMOR_STATUS_KARYAWAN: string;
  STATUS_KARYAWAN: string;
  NOMOR_STATUS_KONTRAK: string;
  STATUS_KONTRAK: string;
  NOMOR_STAFF: string;
  STAFF: string;
  NOMOR_UNIT: string;
  UNIT: string;
  LINE_NUMBER: string;
  IS_ADMIN: boolean;
};

export type PolibatamUnit = {
  ID: string;
  UNIT: string;
  NIK_KEPALA: string;
  NAMA_KEPALA: string;
};
