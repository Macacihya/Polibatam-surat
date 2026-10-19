import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import {
  SubmissionPublishSchema,
  SubmissionSchema,
  SubmissionStatus,
} from "./submission.Schema";
import { tbm_user } from "@prisma/client";
import documentRepository from "../document/document.Repository";
import moment from "moment";
import { DocxTemplateService } from "../../utils/docxtemplater";
import { NUM_ALPHABET } from "../../constants";

class SubmissionRepository {
  async Fetch({
    status,
    page = 1,
    page_size = 10,
    search,
    user,
  }: {
    status?: string;
    page?: number;
    page_size?: number;
    search?: string;
    user: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Base constraints
      const baseWhere: Prisma.tbl_submissionWhereInput = {
        ...(status && { status }),
        is_deleted: false,
      };

      // Optional search
      const searchOR: Prisma.tbl_submissionWhereInput[] | undefined = search
        ? [
            { title: { contains: search, mode: "insensitive" } },
            { remarks: { contains: search, mode: "insensitive" } },
          ]
        : undefined;

      // Admins: base + (optional) search
      if (user.is_admin) {
        const where: Prisma.tbl_submissionWhereInput = {
          ...baseWhere,
          ...(searchOR && { OR: searchOR }),
        };

        const [results, count, meta] = await Promise.all([
          tx.tbl_submission.findMany({
            where,
            include: {
              creator: true,
              verifications: {
                include: { verifier: true },
                orderBy: { stage: "asc" },
              },
            },
            skip: (page - 1) * page_size,
            take: page_size,
            orderBy: { created_at: "desc" },
          }),
          tx.tbl_submission.count({ where }),
          this.buildMeta(tx, where),
        ]);

        return this.buildResponse(results, count, page, page_size, meta);
      }

      // Non-admins: creator or assigned verifier
      const accessOR: Prisma.tbl_submissionWhereInput[] = [
        { creator_id: user.id },
        { verifications: { some: { verifier_id: user.id } } },
      ];

      const where: Prisma.tbl_submissionWhereInput = {
        ...baseWhere,
        AND: [
          { OR: accessOR }, // enforce access
          ...(searchOR ? [{ OR: searchOR }] : []), // optional search
        ],
      };

      const [results, count, meta] = await Promise.all([
        tx.tbl_submission.findMany({
          where,
          include: {
            creator: true,
            verifications: {
              include: { verifier: true },
              orderBy: { stage: "asc" },
            },
          },
          skip: (page - 1) * page_size,
          take: page_size,
          orderBy: { created_at: "desc" },
        }),
        tx.tbl_submission.count({ where }),
        this.buildMeta(tx, where),
      ]);

      return this.buildResponse(results, count, page, page_size, meta);
    });
  }

  // --- helpers ---

  buildResponse(
    results: any[],
    count: number,
    page: number,
    page_size: number,
    meta: any
  ) {
    return {
      data: results,
      meta,
      pagination: {
        page,
        page_size,
        total_items: count,
        total_pages: Math.ceil(count / page_size),
      },
    };
  }

  /** Meta counts that reuse the SAME scoped `where` without widening access. */
  async buildMeta(
    tx: Prisma.TransactionClient,
    scopedWhere: Prisma.tbl_submissionWhereInput
  ) {
    const countAll = await tx.tbl_submission.count({ where: scopedWhere });

    // Inject a status filter via AND to avoid conflicts with existing top-level status.
    const withStatus = (s: string): Prisma.tbl_submissionWhereInput => ({
      ...scopedWhere,
      AND: [
        ...(Array.isArray(scopedWhere.AND)
          ? scopedWhere.AND
          : scopedWhere.AND
          ? [scopedWhere.AND]
          : []),
        { status: s },
      ],
    });

    const [draft, posted, approved, published, rejected] = await Promise.all([
      tx.tbl_submission.count({ where: withStatus(SubmissionStatus.DRAFT) }),
      tx.tbl_submission.count({ where: withStatus(SubmissionStatus.POSTED) }),
      tx.tbl_submission.count({ where: withStatus(SubmissionStatus.APPROVED) }),
      tx.tbl_submission.count({
        where: withStatus(SubmissionStatus.PUBLISHED),
      }),
      tx.tbl_submission.count({ where: withStatus(SubmissionStatus.REJECTED) }),
    ]);

    return {
      DRAFT: draft,
      POSTED: posted,
      APPROVED: approved,
      PUBLISHED: published,
      REJECTED: rejected,
      ALL: countAll,
    };
  }

  async FetchById(submission_id: string) {
    return await prisma.tbl_submission.findFirst({
      where: { id: submission_id, is_deleted: false },
      include: {
        users: {
          include: {
            user: true,
          },
        },
        groups: {
          include: {
            group: true,
          },
        },
        units: {
          include: {
            unit: true,
          },
        },
        logs: {
          orderBy: { created_at: "desc" },
          include: {
            creator: true,
          },
        },
        verifications: {
          orderBy: { stage: "asc" },
          include: {
            verifier: true,
          },
        },
        creator: true,
        modifier: true,
      },
    });
  }

  async Store({
    data,
    creator,
  }: {
    data: SubmissionSchema;
    creator: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      const { groups, users, units, ...payload } = data;

      const submission = await tx.tbl_submission.create({
        data: {
          ...payload,
          creator_id: creator.id,
        },
      });

      if (users.length > 0) {
        await tx.tbl_submission_user.createMany({
          data: users.map((user) => ({
            user_id: user,
            submission_id: submission.id,
          })),
        });
      }

      if (groups.length > 0) {
        await tx.tbl_submission_group.createMany({
          data: groups.map((group) => ({
            group_id: group,
            submission_id: submission.id,
          })),
        });
      }

      if (units.length > 0) {
        await tx.tbl_submission_unit.createMany({
          data: units.map((unit) => ({
            unit_name: unit,
            submission_id: submission.id,
          })),
        });
      }

      await tx.tbl_submission_log.create({
        data: {
          creator_id: creator.id,
          submission_id: submission.id,

          status: SubmissionStatus.DRAFT,
          remarks: `${creator.nama} mengajukan surat keputusan ${submission.title}`,
        },
      });

      return submission;
    });
  }

  async Update({
    submission_id,
    data,
    modifier,
  }: {
    submission_id: string;
    data: SubmissionSchema;
    modifier: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      const { groups, users, units, ...payload } = data;

      const submission = await tx.tbl_submission.update({
        where: { id: submission_id },
        data: {
          ...payload,
          modifier_id: modifier.id,
        },
      });

      if (submission.status == SubmissionStatus.REJECTED && payload.status == SubmissionStatus.POSTED) {
        // Reset verifications to PENDING and restart at stage 1
        await tx.tbl_submission_verification.updateMany({
          where: { submission_id },
          data: {
            status: "PENDING",
            remarks: null,
            acted_at: null,
          },
        });

        await tx.tbl_submission.update({
          where: { id: submission_id },
          data: { current_stage: 1 },
        });

        const firstVerification = await tx.tbl_submission_verification.findFirst({
          where: { submission_id, stage: 1 },
        });
        if (firstVerification) {
          await tx.tbl_notification.create({
            data: {
              user_id: firstVerification.verifier_id,
              title: "Pengajuan SK Diajukan Ulang (Revisi)",
              message: `Pengajuan SK "${submission.title}" telah diperbaiki dan diajukan kembali untuk verifikasi Tahap 1.`,
              link: `/submission/${submission.id}`,
            },
          });
        }
      } else if (submission.status == SubmissionStatus.REJECTED) {
        await tx.tbl_submission.update({
          where: { id: submission.id },
          data: { status: SubmissionStatus.DRAFT },
        });
      }

      if (users.length > 0) {
        await tx.tbl_submission_user.deleteMany({
          where: { submission_id },
        });

        await tx.tbl_submission_user.createMany({
          data: users.map((user) => ({
            user_id: user,
            submission_id,
          })),
        });
      }

      if (groups.length > 0) {
        await tx.tbl_submission_group.deleteMany({
          where: { submission_id },
        });

        await tx.tbl_submission_group.createMany({
          data: groups.map((group) => ({
            group_id: group,
            submission_id,
          })),
        });
      }

      if (units.length > 0) {
        await tx.tbl_submission_unit.deleteMany({
          where: { submission_id },
        });

        await tx.tbl_submission_unit.createMany({
          data: units.map((unit) => ({
            unit_name: unit,
            submission_id,
          })),
        });
      }

      await tx.tbl_submission_log.create({
        data: {
          creator_id: modifier.id,
          submission_id: submission.id,

          status: SubmissionStatus.DRAFT,
          remarks: `${modifier.nama} mengubah surat keputusan ${submission.title}`,
        },
      });

      return submission;
    });
  }

  private createDocumentList({
    items,
    type = "Numeric",
    isFirstLower = false,
  }: {
    items: Prisma.JsonValue;
    type: "Numeric" | "Alphabet" | "NumAlphabet";
    isFirstLower?: boolean;
  }): { no: string; text: string }[] {
    if (!Array.isArray(items) || items.length === 0) return [];

    return items.map((element, i) => {
      const index = i + 1;

      let no: string | number;
      if (type === "Numeric") {
        no = index.toString();
      } else if (type === "Alphabet") {
        no = String.fromCharCode(97 + i).toLowerCase();
      } else if (type === "NumAlphabet") {
        no = NUM_ALPHABET[i] || `KE-${index}`;
      } else {
        throw new Error("Invalid type provided");
      }

      let text = element as string;
      if (isFirstLower) {
        text = text.charAt(0).toLowerCase() + text.slice(1);
      }

      return { no, text };
    });
  }

  async UpdateStatus({
    submission_id,
    status,

    reject_remarks,
  }: {
    submission_id: string;
    status: string;

    reject_remarks?: string;
  }) {
    return await prisma.$transaction(async (tx) => {
      const submission = await tx.tbl_submission.update({
        where: { id: submission_id },
        include: { creator: true },
        data: { status },
      });

      switch (status) {
        case SubmissionStatus.APPROVED:
          const list_consider = this.createDocumentList({
            items: submission.list_consider,
            type: "Alphabet",
          });
          const list_observe = this.createDocumentList({
            items: submission.list_observe,
            type: "Numeric",
          });
          const list_decide = this.createDocumentList({
            items: submission.list_decide,
            type: "NumAlphabet",
          });

          const filepath = await DocxTemplateService.submissionApproved({
            title: submission.title.toUpperCase(),
            list_consider: list_consider,
            list_observe: list_observe,
            list_decide: list_decide,
            date: moment(submission.pickup_plan).format("DD MMMM YYYY"),
          });

          if (!filepath) throw new Error("Gagal membuat surat keputusan");

          await tx.tbl_submission.update({
            where: { id: submission_id },
            data: { filepath },
          });

          break;
      }

      await tx.tbl_submission_log.create({
        data: {
          creator_id: submission.creator_id,
          submission_id: submission.id,

          status,
          remarks: `Surat keputusan ${submission.title} telah diubah menjadi ${status}`,
          reject_remarks,
        },
      });

      return submission;
    });
  }

  async AssignVerifiers({
    submission_id,
    verifiers,
    user,
  }: {
    submission_id: string;
    verifiers: { stage: number; stage_name?: string; verifier_id: string }[];
    user: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      const submission = await tx.tbl_submission.findFirst({
        where: { id: submission_id, is_deleted: false },
      });
      if (!submission) throw new Error("Pengajuan tidak ditemukan.");

      // Remove existing verifications for this submission
      await tx.tbl_submission_verification.deleteMany({
        where: { submission_id },
      });

      // Insert new verifiers
      await tx.tbl_submission_verification.createMany({
        data: verifiers.map((v) => ({
          submission_id,
          stage: v.stage,
          stage_name: v.stage_name || `Tahap ${v.stage}`,
          verifier_id: v.verifier_id,
          status: "PENDING",
        })),
      });

      const updatedSubmission = await tx.tbl_submission.update({
        where: { id: submission_id },
        data: {
          total_stages: verifiers.length,
          current_stage: 1,
          status: SubmissionStatus.POSTED,
        },
      });

      await tx.tbl_submission_log.create({
        data: {
          creator_id: user.id,
          submission_id,
          status: SubmissionStatus.POSTED,
          remarks: `${user.nama} mengatur alur verifikasi ${verifiers.length} tahap untuk ${submission.title}`,
        },
      });

      // Send in-app notification to Stage 1 verifier
      const firstVerifier = verifiers.find((v) => v.stage === 1);
      if (firstVerifier) {
        await tx.tbl_notification.create({
          data: {
            user_id: firstVerifier.verifier_id,
            title: "Tugas Verifikasi Tahap 1",
            message: `Pengajuan SK "${submission.title}" menunggu peninjauan dan keputusan Anda.`,
            link: `/submission/${submission.id}`,
          },
        });
      }

      return updatedSubmission;
    });
  }

  async VerifySubmission({
    submission_id,
    action,
    remarks,
    user,
  }: {
    submission_id: string;
    action: "APPROVE" | "REJECT";
    remarks?: string;
    user: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      const submission = await tx.tbl_submission.findFirst({
        where: { id: submission_id, is_deleted: false },
        include: {
          verifications: {
            orderBy: { stage: "asc" },
            include: { verifier: true },
          },
          creator: true,
        },
      });

      if (!submission) throw new Error("Pengajuan tidak ditemukan.");
      if (submission.status !== SubmissionStatus.POSTED) {
        throw new Error(
          `Pengajuan berstatus ${submission.status}, hanya pengajuan DIPOSTING yang dapat diverifikasi.`
        );
      }

      const currentVerification = submission.verifications.find(
        (v) => v.stage === submission.current_stage
      );

      if (!currentVerification) {
        throw new Error(
          `Verifikasi tahap ${submission.current_stage} belum dikonfigurasi.`
        );
      }

      if (currentVerification.verifier_id !== user.id && !user.is_admin) {
        throw new Error(
          "Anda tidak memiliki hak akses untuk memverifikasi tahap ini."
        );
      }

      if (action === "REJECT") {
        await tx.tbl_submission_verification.update({
          where: { id: currentVerification.id },
          data: {
            status: "REJECTED",
            remarks: remarks || "",
            acted_at: new Date(),
          },
        });

        const updated = await tx.tbl_submission.update({
          where: { id: submission_id },
          data: { status: SubmissionStatus.REJECTED },
        });

        await tx.tbl_submission_log.create({
          data: {
            creator_id: user.id,
            submission_id,
            status: SubmissionStatus.REJECTED,
            remarks: `Ditolak pada ${currentVerification.stage_name || `Tahap ${submission.current_stage}`} oleh ${user.nama}`,
            reject_remarks: remarks,
          },
        });

        if (submission.creator_id) {
          await tx.tbl_notification.create({
            data: {
              user_id: submission.creator_id,
              title: "Pengajuan SK Ditolak",
              message: `Pengajuan "${submission.title}" ditolak pada ${currentVerification.stage_name || `Tahap ${submission.current_stage}`}. Alasan: ${remarks}`,
              link: `/submission/${submission.id}`,
            },
          });
        }

        return updated;
      }

      // If APPROVE:
      await tx.tbl_submission_verification.update({
        where: { id: currentVerification.id },
        data: {
          status: "APPROVED",
          remarks: remarks || "",
          acted_at: new Date(),
        },
      });

      await tx.tbl_submission_log.create({
        data: {
          creator_id: user.id,
          submission_id,
          status: `TAHAP_${submission.current_stage}_DISETUJUI`,
          remarks: `Disetujui pada ${currentVerification.stage_name || `Tahap ${submission.current_stage}`} oleh ${user.nama}`,
        },
      });

      const isFinalStage = submission.current_stage >= submission.total_stages;

      if (!isFinalStage) {
        const nextStage = submission.current_stage + 1;
        const updated = await tx.tbl_submission.update({
          where: { id: submission_id },
          data: { current_stage: nextStage },
        });

        const nextVerification = submission.verifications.find(
          (v) => v.stage === nextStage
        );
        if (nextVerification) {
          await tx.tbl_notification.create({
            data: {
              user_id: nextVerification.verifier_id,
              title: `Tugas Verifikasi Tahap ${nextStage}`,
              message: `Pengajuan SK "${submission.title}" menunggu peninjauan dan keputusan Anda.`,
              link: `/submission/${submission.id}`,
            },
          });
        }

        return updated;
      }

      // FINAL APPROVAL: generate docx template
      const list_consider = this.createDocumentList({
        items: submission.list_consider,
        type: "Alphabet",
      });
      const list_observe = this.createDocumentList({
        items: submission.list_observe,
        type: "Numeric",
      });
      const list_decide = this.createDocumentList({
        items: submission.list_decide,
        type: "NumAlphabet",
      });

      const filepath = await DocxTemplateService.submissionApproved({
        title: submission.title.toUpperCase(),
        list_consider,
        list_observe,
        list_decide,
        date: moment(submission.pickup_plan).format("DD MMMM YYYY"),
      });

      if (!filepath) throw new Error("Gagal membuat borang surat keputusan");

      const updated = await tx.tbl_submission.update({
        where: { id: submission_id },
        data: {
          status: SubmissionStatus.APPROVED,
          filepath,
        },
      });

      await tx.tbl_submission_log.create({
        data: {
          creator_id: user.id,
          submission_id,
          status: SubmissionStatus.APPROVED,
          remarks: `Seluruh tahap verifikasi telah disetujui. Naskah borang SK otomatis dibuat.`,
        },
      });

      if (submission.creator_id) {
        await tx.tbl_notification.create({
          data: {
            user_id: submission.creator_id,
            title: "Pengajuan SK Disetujui Penuh",
            message: `Pengajuan "${submission.title}" telah disetujui pada seluruh tahap verifikasi dan siap diterbitkan.`,
            link: `/submission/${submission.id}`,
          },
        });
      }

      return updated;
    });
  }

  async Publish({
    submission_id,
    data,
    creator,
  }: {
    submission_id: string;
    data: SubmissionPublishSchema;
    creator: tbm_user;
  }) {
    // Use submission's existing tags (users/groups/units) as a fallback when
    // the publish payload does not explicitly provide them. This ensures that
    // access tags are preserved after publishing.
    const submissionRelations = await prisma.tbl_submission.findFirst({
      where: { id: submission_id, is_deleted: false },
      include: {
        users: true,
        groups: true,
        units: true,
      },
    });

    const submissionUsers =
      submissionRelations?.users?.map((u: any) => u.user_id) ?? [];
    const submissionGroups =
      submissionRelations?.groups?.map((g: any) => g.group_id) ?? [];
    const submissionUnits =
      submissionRelations?.units?.map((u: any) => u.unit_name) ?? [];

    return await prisma.$transaction(async (tx) => {
      await documentRepository.store({
        body: {
          type: "SURAT_KEPUTUSAN",
          code: data.code,
          name: data.title,
          date: data.date,
          filepath: data.filepath,

          // If the publish payload provides tags, use them; otherwise
          // fall back to the tags already attached to the submission.
          users:
            data.users && data.users.length > 0
              ? data.users
              : submissionUsers,
          groups:
            data.groups && data.groups.length > 0
              ? data.groups
              : submissionGroups,
          units:
            data.units && data.units.length > 0
              ? data.units
              : submissionUnits,

          remarks: "",

          submission_id,
        },
        creator,
      });

      const submission = await tx.tbl_submission.update({
        where: { id: submission_id },
        data: {
          filepath: data.filepath,
          status: SubmissionStatus.PUBLISHED,
        },
      });

      await tx.tbl_submission_log.create({
        data: {
          creator_id: creator.id,
          submission_id: submission.id,

          status: SubmissionStatus.PUBLISHED,
          remarks: `${creator.nama} telah mempublish surat keputusan ${submission.title}`,
        },
      });

      return submission;
    });
  }

  async Destroy(submission_id: string) {
    return await prisma.tbl_submission.update({
      where: { id: submission_id },
      data: { is_deleted: true },
    });
  }
}

export default new SubmissionRepository();
