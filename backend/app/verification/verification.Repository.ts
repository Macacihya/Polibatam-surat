import prisma from "../../lib/prisma";
import { SubmissionStatus } from "../submission/submission.Schema";

class VerificationRepository {
  async GetStages() {
    let stages = await prisma.tbm_verification_stage.findMany({
      orderBy: { id: "asc" },
      include: {
        verifiers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (stages.length === 0) {
      // Seed default 3 stages
      await prisma.tbm_verification_stage.createMany({
        data: [
          {
            id: 1,
            name: "Verifikasi Unit",
            is_by_unit: true,
            description: "Verifikasi oleh Pimpinan Unit/Kajur pengusul",
          },
          {
            id: 2,
            name: "Verifikasi Bagian Umum",
            is_by_unit: false,
            description: "Verifikasi administrasi bagian umum & keuangan",
          },
          {
            id: 3,
            name: "Verifikasi Pimpinan",
            is_by_unit: false,
            description: "Pengesahan akhir oleh Wadir / Direktur",
          },
        ],
      });

      // Hubungkan verifikator default jika ada akun dummy/seed
      const defaultUsers = await prisma.tbm_user.findMany({
        where: {
          nip: { in: ["198001012005", "staff", "197903032003"] },
          is_deleted: false,
        },
      });

      for (const u of defaultUsers) {
        const stageId =
          u.nip === "198001012005" ? 1 : u.nip === "staff" ? 2 : 3;
        await prisma.tbm_verification_stage_verifier
          .create({
            data: {
              stage_id: stageId,
              user_id: u.id,
            },
          })
          .catch(() => {});
      }

      stages = await prisma.tbm_verification_stage.findMany({
        orderBy: { id: "asc" },
        include: {
          verifiers: {
            include: {
              user: true,
            },
          },
        },
      });
    }

    return stages.map((s) => ({
      stage: s.id,
      name: s.name,
      description: s.description,
      is_by_unit: s.is_by_unit,
      verifiers: s.verifiers
        .map((v) => v.user)
        .filter((u) => u && !u.is_deleted),
    }));
  }

  async AddVerifier({ stage, nip }: { stage: number; nip: string }) {
    const user = await prisma.tbm_user.findFirst({
      where: {
        OR: [{ nip: String(nip) }, { id: String(nip) }],
        is_deleted: false,
      },
    });

    if (!user) {
      throw new Error(`Pegawai dengan NIP ${nip} tidak ditemukan.`);
    }

    const stageRecord = await prisma.tbm_verification_stage.findUnique({
      where: { id: Number(stage) },
    });

    if (!stageRecord) {
      throw new Error(`Tahap verifikasi ${stage} tidak valid.`);
    }

    const existing = await prisma.tbm_verification_stage_verifier.findUnique({
      where: {
        stage_id_user_id: {
          stage_id: Number(stage),
          user_id: user.id,
        },
      },
    });

    if (existing) {
      throw new Error(`${user.nama} sudah terdaftar pada Tahap ${stage}.`);
    }

    await prisma.tbm_verification_stage_verifier.create({
      data: {
        stage_id: Number(stage),
        user_id: user.id,
      },
    });

    return {
      message: `${user.nama} berhasil ditambahkan sebagai Verifikator Tahap ${stage}.`,
      user,
    };
  }

  async RemoveVerifier({ stage, nip }: { stage: number; nip: string }) {
    const user = await prisma.tbm_user.findFirst({
      where: {
        OR: [{ nip: String(nip) }, { id: String(nip) }],
      },
    });

    if (!user) {
      throw new Error(`Pegawai dengan NIP ${nip} tidak ditemukan.`);
    }

    await prisma.tbm_verification_stage_verifier.deleteMany({
      where: {
        stage_id: Number(stage),
        user_id: user.id,
      },
    });

    return {
      message: `${user.nama} berhasil dihapus dari daftar Verifikator Tahap ${stage}.`,
    };
  }

  async GetApprovals({
    stage = 1,
    page = 1,
    page_size = 10,
    search = "",
  }: {
    stage?: number;
    page?: number;
    page_size?: number;
    search?: string;
  }) {
    const current_stage = Number(stage) || 1;
    const skip = (Number(page) - 1) * Number(page_size);
    const take = Number(page_size);

    const whereBase: any = {
      is_deleted: false,
      status: SubmissionStatus.POSTED,
    };

    const whereStage: any = {
      ...whereBase,
      current_stage: current_stage,
      ...(search ? { title: { contains: search, mode: "insensitive" } } : {}),
    };

    const [rows, total_items, count1, count2, count3] = await Promise.all([
      prisma.tbl_submission.findMany({
        where: whereStage,
        skip,
        take,
        orderBy: { updated_at: "desc" },
        include: {
          creator: true,
          verifications: {
            include: { verifier: true },
          },
        },
      }),
      prisma.tbl_submission.count({ where: whereStage }),
      prisma.tbl_submission.count({
        where: { ...whereBase, current_stage: 1 },
      }),
      prisma.tbl_submission.count({
        where: { ...whereBase, current_stage: 2 },
      }),
      prisma.tbl_submission.count({
        where: { ...whereBase, current_stage: 3 },
      }),
    ]);

    const formattedRows = rows.map((r) => ({
      id: r.id,
      title: r.title,
      type: r.type,
      status: r.status,
      current_stage: r.current_stage,
      creator: r.creator,
      created_at: r.created_at,
      stage_entered_at: r.updated_at,
    }));

    return {
      rows: formattedRows,
      pagination: {
        page: Number(page),
        page_size: Number(page_size),
        total_items,
        total_pages: Math.max(1, Math.ceil(total_items / take)),
      },
      meta: {
        per_stage: { 1: count1, 2: count2, 3: count3 },
      },
    };
  }

  async GetTracking(submission_id: string) {
    const submission = await prisma.tbl_submission.findFirst({
      where: { id: submission_id, is_deleted: false },
      include: {
        creator: true,
        verifications: {
          include: { verifier: true },
        },
        logs: {
          orderBy: { created_at: "desc" },
          include: { creator: true },
        },
      },
    });

    if (!submission) throw new Error("Pengajuan tidak ditemukan");

    const stageConfig = [
      { stage: 1, name: "Verifikasi Unit" },
      { stage: 2, name: "Verifikasi Bagian Umum" },
      { stage: 3, name: "Verifikasi Pimpinan" },
    ];

    const steps = stageConfig.map((sc) => {
      const v = submission.verifications.find((x) => x.stage === sc.stage);
      let state = "PENDING";

      if (v?.status === "APPROVED") {
        state = "DONE";
      } else if (v?.status === "REJECTED") {
        state = "REJECTED";
      } else if (
        submission.status === SubmissionStatus.REJECTED &&
        submission.current_stage === sc.stage
      ) {
        state = "REJECTED";
      } else if (
        ["APPROVED", "PUBLISHED"].includes(submission.status) &&
        sc.stage <= (submission.total_stages || 3)
      ) {
        state = "DONE";
      } else if (sc.stage < submission.current_stage) {
        state = "DONE";
      } else if (
        sc.stage === submission.current_stage &&
        submission.status === SubmissionStatus.POSTED
      ) {
        state = "CURRENT";
      }

      const acted = state === "DONE" || state === "REJECTED";

      return {
        stage: sc.stage,
        name: v?.stage_name || sc.name,
        state,
        verifiers: v?.verifier ? [v.verifier] : [],
        acted_by: acted ? v?.verifier : null,
        acted_at: acted ? v?.acted_at || v?.updated_at : null,
        remarks: state === "REJECTED" ? v?.remarks : null,
      };
    });

    return {
      current_stage: submission.current_stage,
      steps,
    };
  }
}

export default new VerificationRepository();
