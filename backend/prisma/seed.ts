import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // 1. Users
  const users = [
    {
      nip: "admin",
      nama: "Super Administrator (Dummy)",
      email: "admin@polibatam.ac.id",
      is_admin: true,
      unit: "Pusat Informasi & Komputer (P3M)",
      staff: "Tenaga Kependidikan",
      status_karyawan: "PNS",
    },
    {
      nip: "administrasi",
      nama: "Regina Administrasi, S.Sos (Dummy)",
      email: "administrasi@polibatam.ac.id",
      is_admin: true,
      unit: "Urusan Administrasi",
      staff: "Administrasi",
      status_karyawan: "PNS",
    },
    {
      nip: "dosen",
      nama: "Dr. Budi Santoso, M.Kom (Dummy)",
      email: "dosen@polibatam.ac.id",
      is_admin: false,
      unit: "Jurusan Teknik Informatika",
      staff: "Tenaga Pendidik",
      status_karyawan: "Dosen Tetap",
    },
    // Verifikator Tahap 1: Verifikasi Unit
    {
      nip: "198001012005",
      nama: "Ahmad Fauzi, M.T.",
      email: "ahmad@polibatam.ac.id",
      is_admin: false,
      unit: "Jurusan Teknik Elektro",
      staff: "Tenaga Pendidik",
      status_karyawan: "PNS",
    },
    // Verifikator Tahap 2: Verifikasi Bagian Umum
    {
      nip: "staff",
      nama: "Siti Rahmawati, S.tr.kom",
      email: "staff@polibatam.ac.id",
      is_admin: false,
      unit: "Bagian Umum & Keuangan",
      staff: "Tenaga Kependidikan",
      status_karyawan: "Pegawai Tetap",
    },
    // Verifikator Tahap 3: Verifikasi Pimpinan
    {
      nip: "197903032003",
      nama: "Hendra Wijaya, M.si.",
      email: "hendra@polibatam.ac.id",
      is_admin: false,
      unit: "Wakil Direktur I",
      staff: "Wakil Direktur",
      status_karyawan: "PNS",
    },
    {
      nip: "wadir",
      nama: "Dr. Ahmad Riyadi, S.T., M.T. (Wakil Direktur I)",
      email: "wadir@polibatam.ac.id",
      is_admin: false,
      unit: "Pimpinan Politeknik Negeri Batam",
      staff: "Wakil Direktur",
      status_karyawan: "PNS",
    },
    {
      nip: "direktur",
      nama: "Ir. Bambang Hendrawan, S.T., M.S.M., Ph.D. (Direktur)",
      email: "direktur@polibatam.ac.id",
      is_admin: false,
      unit: "Pimpinan Politeknik Negeri Batam",
      staff: "Direktur",
      status_karyawan: "PNS",
    },
  ];

  for (const u of users) {
    await prisma.tbm_user.upsert({
      where: { nip: u.nip },
      update: u,
      create: { id: u.nip, ...u },
    });
  }

  // 2. Units
  const units = [
    "Pusat Informasi & Komputer (P3M)",
    "Jurusan Teknik Informatika",
    "Jurusan Teknik Elektro",
    "Jurusan Teknik Mesin",
    "Jurusan Manajemen Bisnis",
    "Bagian Umum & Keuangan",
    "Urusan Administrasi",
    "Wakil Direktur I",
    "Pimpinan Politeknik Negeri Batam",
  ];

  for (const name of units) {
    await prisma.tbm_unit.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // 3. Groups
  const groups = [
    { name: "Tim Pengembang Kurikulum", note: "Kelompok kerja kurikulum program studi" },
    { name: "Satgas MBKM Polibatam", note: "Tim pelaksana Merdeka Belajar Kampus Merdeka" },
    { name: "Panitia Yudisium & Wisuda", note: "Kepanitiaan acara wisuda tahun berjalan" },
  ];

  for (const g of groups) {
    const existing = await prisma.tbm_group.findFirst({ where: { name: g.name } });
    if (!existing) {
      await prisma.tbm_group.create({ data: g });
    }
  }

  // 4. Sample Notifications untuk Pengujian Notifikasi
  const notifications = [
    {
      user_id: "198001012005",
      title: "Tugas Verifikasi Unit (Tahap 1)",
      message: 'Pengajuan SK "Penetapan Dosen Pembimbing Tugas Akhir Semester Ganjil" menunggu peninjauan dan verifikasi Anda.',
      link: "/verification",
      is_read: false,
    },
    {
      user_id: "staff",
      title: "Tugas Verifikasi Bagian Umum (Tahap 2)",
      message: 'Pengajuan SK "Panitia Workshop Kurikulum OBE Jurusan Elektro" menunggu pemeriksaan administrasi Anda.',
      link: "/verification",
      is_read: false,
    },
    {
      user_id: "197903032003",
      title: "Tugas Verifikasi Pimpinan (Tahap 3)",
      message: 'Pengajuan SK "Kegiatan Seminar Nasional Applied Technology 2026" menunggu persetujuan akhir Wakil Direktur I.',
      link: "/verification",
      is_read: false,
    },
  ];

  for (const n of notifications) {
    const existing = await prisma.tbl_notification.findFirst({
      where: { user_id: n.user_id, title: n.title },
    });
    if (!existing) {
      await prisma.tbl_notification.create({ data: n });
    }
  }

  console.log("Seeding data dummy berhasil!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
