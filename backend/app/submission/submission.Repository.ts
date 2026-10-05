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
            include: { creator: true },
            skip: (page - 1) * page_size,
            take: page_size,
            orderBy: { created_at: "desc" },
          }),
          tx.tbl_submission.count({ where }),
          this.buildMeta(tx, where),
        ]);

        return this.buildResponse(results, count, page, page_size, meta);
      }

      // Non-admins: ONLY creator or submitter
      const accessOR: Prisma.tbl_submissionWhereInput[] = [
        { creator_id: user.id }, // created by the user
        // { users: { some: { user_id: user.id } } }, // explicitly submitted by the user
      ];

      const where: Prisma.tbl_submissionWhereInput = {
        ...baseWhere,
        AND: [
          { OR: accessOR }, // enforce access
          ...(searchOR ? [{ OR: searchOR }] : []), // optional search
        ],
      };

      console.log("where", where);
      for (const element of (where as any).AND ?? []) {
        console.log("element", element);
      }

      const [results, count, meta] = await Promise.all([
        tx.tbl_submission.findMany({
          where,
          include: { creator: true },
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

      if (submission.status == SubmissionStatus.REJECTED) {
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
