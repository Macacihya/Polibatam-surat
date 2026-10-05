import { Prisma } from "@prisma/client";
import prisma from "../../lib/prisma";
import { GroupSchema } from "./group.Schema";

class GroupRepository {
  async FetchGroup({
    search,
    page = 1,
    page_size = 10,
  }: {
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      const where: Prisma.tbm_groupWhereInput = {
        is_deleted: false,
        ...(search && {
          OR: [{ name: { contains: search, mode: "insensitive" } }],
        }),
      };

      const results = await tx.tbm_group.findMany({
        where,
        orderBy: { created_at: "desc" },
        take: page_size,
        skip: (page - 1) * page_size,
        include: {
          creator: true,
        },
      });

      const count = await tx.tbm_group.count({ where });

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

  async FetchGroupById(id: string) {
    return await prisma.tbm_group.findFirst({
      where: {
        id,
        is_deleted: false,
      },
      include: {
        creator: true,
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
      },
    });
  }

  async FetchGroupByName(name: string) {
    return await prisma.tbm_group.findFirst({
      where: {
        name,
        is_deleted: false,
      },
    });
  }

  async StoreGroup(data: GroupSchema) {
    return await prisma.$transaction(async (tx) => {
      const { users, units, ...payload } = data;

      const group = await tx.tbm_group.create({
        data: payload,
      });

      if (users?.length)
        for (const user_id of users) {
          await tx.tbm_group_user.create({
            data: {
              user_id: user_id,
              group_id: group.id,
            },
          });
        }

      if (units?.length)
        for (const unit_name of units) {
          await tx.tbm_group_unit.create({
            data: {
              unit_name: unit_name,
              group_id: group.id,
            },
          });
        }

      return group;
    });
  }

  async UpdateGroup(id: string, data: GroupSchema) {
    return await prisma.$transaction(async (tx) => {
      const { users, units, ...payload } = data;

      const group = await tx.tbm_group.update({
        where: { id },
        data: payload,
      });

      await tx.tbm_group_user.deleteMany({ where: { group_id: id } });

      if (users?.length)
        for (const user_id of users) {
          await tx.tbm_group_user.create({
            data: {
              user_id: user_id,
              group_id: group.id,
            },
          });
        }

      await tx.tbm_group_unit.deleteMany({ where: { group_id: id } });

      if (units?.length)
        for (const unit_name of units) {
          await tx.tbm_group_unit.create({
            data: {
              unit_name: unit_name,
              group_id: group.id,
            },
          });
        }

      return group;
    });
  }

  async DestroyGroup(id: string) {
    return await prisma.tbm_group.update({
      where: {
        id,
      },
      data: {
        is_deleted: true,
      },
    });
  }
}

export default new GroupRepository();
