import { Prisma, tbm_user } from "@prisma/client";
import prisma from "../../lib/prisma";
import { RegulationBulkSchema, RegulationSchema } from "./regulation.Schema";

class Repository {
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
      const where: Prisma.tbm_regulationWhereInput = {
        is_deleted: false,
      };

      if (search) {
        where.OR = [{ title: { contains: search, mode: "insensitive" } }];
      }

      const count = await tx.tbm_regulation.count({ where });

      const data = await tx.tbm_regulation.findMany({
        where,
        orderBy: { created_at: "desc" },
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
    return await prisma.tbm_regulation.findFirst({
      where: { id, is_deleted: false },
    });
  }

  async create({
    creator,
    data,
  }: {
    creator: tbm_user;
    data: RegulationSchema;
  }) {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.tbm_regulation.create({
        data: {
          ...data,
          creator_id: creator.id,
        },
      });

      return result;
    });
  }

  async bulkCreate({
    creator,
    data,
  }: {
    creator: tbm_user;
    data: RegulationBulkSchema;
  }) {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.tbm_regulation.createMany({
        data: data.map((item) => ({
          ...item,
          creator_id: creator.id,
        })),
      });

      return result;
    });
  }

  async update({
    id,
    data,
    modifier,
  }: {
    id: string;
    data: RegulationSchema;
    modifier: tbm_user;
  }) {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.tbm_regulation.update({
        where: { id },
        data: {
          ...data,
          modifier_id: modifier.id,
        },
      });

      return result;
    });
  }

  async delete({ id, modifier }: { id: string; modifier: tbm_user }) {
    return await prisma.$transaction(async (tx) => {
      const result = await tx.tbm_regulation.update({
        where: { id },
        data: {
          is_deleted: true,
          modifier_id: modifier.id,
        },
      });

      return result;
    });
  }
}

export const RegulationRepository = new Repository();
