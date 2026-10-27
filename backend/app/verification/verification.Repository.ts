import prisma from "../../lib/prisma";
import { SubmissionStatus } from "../submission/submission.Schema";

class VerificationRepository {
  async GetStages() {
    const verifiers = await prisma.tbm_user.findMany({
      where: {
        nip: { in: ["198001012005", "staff", "197903032003"] },
        is_deleted: false,
      },
    });

    const vMap: Record<string, any> = {};
    for (const v of verifiers) {
      vMap[v.nip] = v;
    }

    return [
      {
        stage: 1,
        name: "Verifikasi Unit",
        verifiers: vMap["198001012005"] ? [vMap["198001012005"]] : [],
      },
      {
        stage: 2,
        name: "Verifikasi Bagian Umum",
        verifiers: vMap["staff"] ? [vMap["staff"]] : [],
      },
      {
        stage: 3,
        name: "Verifikasi Pimpinan",
        verifiers: vMap["197903032003"] ? [vMap["197903032003"]] : [],
      },
    ];
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

      if (submission.status === SubmissionStatus.REJECTED && submission.current_stage === sc.stage) {
        state = "REJECTED";
      } else if (
        sc.stage < submission.current_stage ||
        (submission.status === SubmissionStatus.APPROVED && sc.stage <= submission.total_stages)
      ) {
        state = "DONE";
      } else if (sc.stage === submission.current_stage && submission.status === SubmissionStatus.POSTED) {
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
