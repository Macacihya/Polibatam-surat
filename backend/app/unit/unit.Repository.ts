import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";

class Repository {
  async bulkStore(data: Prisma.tbm_unitCreateInput[]) {
    return await prisma.tbm_unit.createMany({
      data,
      skipDuplicates: true,
    });
  }

  async fetch({
    search,
    page = 1,
    page_size = 10,
  }: {
    search?: string;

    page?: number;
    page_size?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      const where: Prisma.tbm_unitWhereInput = {
        is_deleted: false,

        ...(search && {
          OR: [{ name: { contains: search, mode: "insensitive" } }],
        }),
      };

      const count = await tx.tbm_unit.count({ where });

      const data = await tx.tbm_unit.findMany({
        where,
        skip: (page - 1) * page_size,
        take: page_size,
      });

      return {
        data: data,
        pagination: {
          page,
          page_size,
          total_items: count,
          total_pages: Math.ceil(count / page_size),
        },
      };
    });
  }

  async fetchOne({ id }: { id: string }) {
    return await prisma.tbm_unit.findUnique({
      where: { id },
    });
  }
}

export const UnitRepository = new Repository();
