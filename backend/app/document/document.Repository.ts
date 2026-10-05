import { Prisma, tbl_document, tbm_user } from "@prisma/client";
import prisma from "../../lib/prisma";

import { DocumentSchema } from "./document.Schema";
import moment from "moment";

class DocumentRepository {
  async fetch({
    type,
    search,
    page = 1,
    page_size = 10,
    user,
    start_date = moment().startOf("month").toDate(),
    end_date = moment().endOf("month").toDate(),
  }: {
    type?: "SURAT_TUGAS" | "SURAT_KEPUTUSAN";
    search?: string;
    page?: number;
    page_size?: number;
    user: tbm_user;
    start_date?: Date;
    end_date?: Date;
  }) {
    return await prisma.$transaction(async (tx) => {
      // Base constraints always applied
      const baseWhere: Prisma.tbl_documentWhereInput = {
        ...(type && { type }),
        date: { gte: start_date, lte: end_date },
        is_deleted: false,
      };

      // Optional search clauses
      const searchOR: Prisma.tbl_documentWhereInput[] | undefined = search
        ? [
            { code: { contains: search, mode: "insensitive" } },
            { name: { contains: search, mode: "insensitive" } },
            { remarks: { contains: search, mode: "insensitive" } },
          ]
        : undefined;

      // Admins: only base + search
      if (user.is_admin) {
        const where: Prisma.tbl_documentWhereInput = {
          ...baseWhere,
          ...(searchOR && { OR: searchOR }),
        };

        const [results, count] = await Promise.all([
          tx.tbl_document.findMany({
            where,
            take: page_size,
            skip: (page - 1) * page_size,
            orderBy: { date: "desc" },
          }),
          tx.tbl_document.count({ where }),
        ]);

        return {
          data: results,
          pagination: {
            page,
            page_size,
            total_items: count,
            total_pages: Math.ceil(count / page_size),
          },
        };
      }

      // Non-admins: build strict access OR
      const accessOR: Prisma.tbl_documentWhereInput[] = [
        // Explicitly shared with the user
        { users: { some: { user_id: user.id } } },
        // Shared via a group the user belongs to
        {
          groups: {
            some: {
              group: {
                users: { some: { user_id: user.id } },
              },
            },
          },
        },
      ];

      // Only include unit gate if user.unit is present and non-empty
      if (user.unit && user.unit.trim() !== "") {
        // Prefer filtering on the join scalar to avoid unnecessary nested traversal
        accessOR.push({ units: { some: { unit_name: user.unit } } });
        // If you prefer via relation:
        // accessOR.push({ units: { some: { unit: { name: user.unit } } } });
      }

      // If user has no groups/units and nothing was added (shouldn't happen with the 2 defaults),
      // you can hard block by forcing no results:
      if (accessOR.length === 0) {
        return {
          data: [] as tbl_document[],
          pagination: { page, page_size, total_items: 0, total_pages: 0 },
        };
      }

      // Combine: base AND (access OR …) AND (search OR …?)
      const where: Prisma.tbl_documentWhereInput = {
        ...baseWhere,
        AND: [
          { OR: accessOR },
          ...(searchOR
            ? ([{ OR: searchOR }] as Prisma.tbl_documentWhereInput[])
            : []),
        ],
      };

      const [results, count] = await Promise.all([
        tx.tbl_document.findMany({
          where,
          take: page_size,
          skip: (page - 1) * page_size,
          orderBy: { date: "desc" },
        }),
        tx.tbl_document.count({ where }),
      ]);

      return {
        data: results,
        pagination: {
          page,
          page_size,
          total_items: count,
          total_pages: Math.ceil(count / page_size),
        },
      };
    });
  }

  async fetchById(id: string) {
    const document = await prisma.tbl_document.findUnique({
      where: { id },
      include: {
        groups: {
          include: {
            group: {
              include: {
                users: {
                  include: {
                    user: true,
                  },
                },
              },
            },
          },
        },
        users: {
          include: {
            user: true,
          },
        },
        units: {
          include: {
            unit: true,
          },
        },
        creator: true,
        modifier: true,
        submission: true,
      },
    });

    const unit_users = await prisma.tbm_user.findMany({
      where: {
        OR: [
          { unit: { in: document?.units?.map((du) => du.unit_name) } },
          {
            units: {
              some: {
                name: { in: document?.units?.map((du) => du.unit_name) },
              },
            },
          },
        ],
      },
    });

    const users = [
      ...(document?.users ?? []).map((user) => user.user as tbm_user),
      ...(document?.groups ?? [])
        .flatMap((group) => group?.group?.users ?? [])
        .map((user) => user.user as tbm_user),
      ...unit_users,
    ];

    const unique_users = Array.from(new Set(users));

    return {
      ...document,
      unique_users,
    };
  }

  async store({ body, creator }: { body: DocumentSchema; creator: tbm_user }) {
    return await prisma.$transaction(async (tx) => {
      const { groups, users, units, ...data } = body;

      const document = await tx.tbl_document.create({
        data: {
          ...data,
          creator_id: creator.id,
        },
      });

      if (users && users.length > 0) {
        for (const user_id of users) {
          await tx.tbl_document_user.create({
            data: {
              user_id,
              document_id: document.id,
            },
          });
        }
      }

      if (groups && groups.length > 0) {
        for (const group_id of groups) {
          await tx.tbl_document_group.create({
            data: {
              group_id,
              document_id: document.id,
            },
          });
        }
      }

      if (units && units.length > 0) {
        for (const unit_name of units) {
          await tx.tbl_document_unit.create({
            data: {
              unit_name,
              document_id: document.id,
            },
          });
        }
      }

      return document;
    });
  }

  async update({
    id,
    body,
    modifier,
  }: {
    id: string;
    body: DocumentSchema;
    modifier: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      const { groups, users, units, ...data } = body;

      const document = await tx.tbl_document.update({
        where: { id },
        data: {
          ...data,
          modifier_id: modifier.id,
        },
      });

      await tx.tbl_document_user.deleteMany({
        where: { document_id: id },
      });

      await tx.tbl_document_group.deleteMany({
        where: { document_id: id },
      });

      await tx.tbl_document_unit.deleteMany({
        where: { document_id: id },
      });

      if (users && users.length > 0) {
        for (const user_id of users) {
          await tx.tbl_document_user.create({
            data: {
              user_id,
              document_id: document.id,
            },
          });
        }
      }

      if (groups && groups.length > 0) {
        for (const group_id of groups) {
          await tx.tbl_document_group.create({
            data: {
              group_id,
              document_id: document.id,
            },
          });
        }
      }

      if (units && units.length > 0) {
        for (const unit_name of units) {
          await tx.tbl_document_unit.create({
            data: {
              unit_name,
              document_id: document.id,
            },
          });
        }
      }

      return document;
    });
  }

  async destroy(id: string) {
    return await prisma.tbl_document.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}

export default new DocumentRepository();
