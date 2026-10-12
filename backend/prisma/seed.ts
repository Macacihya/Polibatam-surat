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
      nip: "dosen",
      nama: "Dr. Budi Santoso, M.Kom (Dummy)",
      email: "dosen@polibatam.ac.id",
      is_admin: false,
      unit: "Jurusan Teknik Informatika",
      staff: "Tenaga Pendidik",
      status_karyawan: "Dosen Tetap",
    },
    {
      nip: "staff",
      nama: "Siti Rahmawati, S.Tr.Kom (Dummy)",
      email: "staff@polibatam.ac.id",
      is_admin: false,
      unit: "Bagian Umum & Keuangan",
      staff: "Tenaga Kependidikan",
      status_karyawan: "Pegawai Tetap",
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
