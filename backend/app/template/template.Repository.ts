import prisma from "../../lib/prisma";

export interface TemplateFilter {
  search?: string;
  type?: string;
  is_active?: boolean;
}

class TemplateRepository {
  async SeedDefaultTemplate() {
    const count = await prisma.tbm_template.count();
    if (count > 0) return;

    await prisma.tbm_template.create({
      data: {
        code: "SK-PANITIA-2026",
        title: "SK Pengangkatan Panitia Pelaksana Kegiatan",
        type: "SK Non-Honor",
        description: "Template standar penerbitan SK panitia acara, seminar, dan workshop di lingkungan Polibatam.",
        filepath: "templates/submission-approved-template.docx",
        is_active: true,
        schema_fields: [
          {
            key: "nama_kegiatan",
            label: "Nama Acara / Kegiatan",
            type: "text",
            placeholder: "Contoh: Seminar Nasional Vokasi & Teknologi 2026",
            required: true,
          },
          {
            key: "tempat_kegiatan",
            label: "Tempat / Ruangan Pelaksanaan",
            type: "text",
            placeholder: "Contoh: Auditorium Utama Polibatam",
            required: true,
          },
          {
            key: "tanggal_kegiatan",
            label: "Tanggal / Rentang Waktu Kegiatan",
            type: "text",
            placeholder: "Contoh: 15 - 16 Desember 2026",
            required: true,
          },
          {
            key: "deskripsi_tugas",
            label: "Uraian Ringkas Tugas & Tanggung Jawab",
            type: "textarea",
            placeholder: "Melaksanakan persiapan, koordinasi peserta, dan pelaporan pelaksanaan kegiatan...",
            required: false,
          },
          {
            key: "susunan_panitia",
            label: "Daftar Susunan Panitia",
            type: "table_list",
            columns: [
              { key: "nama", label: "Nama Lengkap & Gelar" },
              { key: "jabatan", label: "Jabatan dalam Kepanitiaan (Ketua/Sekretaris/Anggota)" },
            ],
          },
        ],
      },
    });
  }

  async FetchAll(filter: TemplateFilter = {}) {
    await this.SeedDefaultTemplate();

    const where: any = {
      is_deleted: false,
    };

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: "insensitive" } },
        { code: { contains: filter.search, mode: "insensitive" } },
      ];
    }

    if (filter.type) {
      where.type = filter.type;
    }

    if (typeof filter.is_active === "boolean") {
      where.is_active = filter.is_active;
    }

    return await prisma.tbm_template.findMany({
      where,
      orderBy: { created_at: "desc" },
    });
  }

  async FetchById(id: string) {
    const template = await prisma.tbm_template.findFirst({
      where: { id, is_deleted: false },
    });

    if (!template) {
      throw new Error("Template surat tidak ditemukan.");
    }

    return template;
  }

  async Store(data: {
    code: string;
    title: string;
    type: string;
    description?: string;
    filepath: string;
    schema_fields: any;
  }) {
    const existing = await prisma.tbm_template.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new Error(`Template dengan kode "${data.code}" sudah ada.`);
    }

    return await prisma.tbm_template.create({
      data: {
        code: data.code,
        title: data.title,
        type: data.type,
        description: data.description || "",
        filepath: data.filepath,
        schema_fields: data.schema_fields || [],
        is_active: true,
      },
    });
  }

  async Update(
    id: string,
    data: {
      title?: string;
      description?: string;
      type?: string;
      is_active?: boolean;
      filepath?: string;
      schema_fields?: any;
    }
  ) {
    await this.FetchById(id);

    return await prisma.tbm_template.update({
      where: { id },
      data: {
        ...data,
        updated_at: new Date(),
      },
    });
  }

  async Destroy(id: string) {
    await this.FetchById(id);

    return await prisma.tbm_template.update({
      where: { id },
      data: {
        is_deleted: true,
        updated_at: new Date(),
      },
    });
  }
}

export default new TemplateRepository();
