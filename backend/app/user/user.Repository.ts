import { Prisma, tbm_user } from "@prisma/client";
import prisma from "../../lib/prisma";
import { PolibatamBiodata, PolibatamResponseBiodata, User } from "../../types";
import { PolibatamAct } from "../../lib/polibatam";
import { polibatamInstance } from "../../utils/axios";

class UserRepository {
  async fetchAdmins() {
    return await prisma.tbm_user
      .findMany({
        where: { is_admin: true },
      })
      .then((users) => users.map((user) => user.nip));
  }

  async bulkStore(users: tbm_user[]) {
    for (const user of users) {
      if (!user.nip) continue;

      await prisma.tbm_user.upsert({
        where: { nip: user.nip },
        update: user,
        create: user,
      });
    }
  }

  async checkOrInsertUser({
    nip,
    secretkey,
  }: {
    nip: string;
    secretkey: string;
  }) {
    const user = await prisma.tbm_user.findFirst({
      where: { nip },
    });

    if (!user) {
      const biodataResponse: PolibatamResponseBiodata = await polibatamInstance(
        {
          method: "POST",
          data: {
            act: PolibatamAct.GetBiodata,
            secretkey: secretkey,
          },
        }
      );

      console.log(biodataResponse);

      return await prisma.tbm_user.create({
        data: {
          id: biodataResponse.data.id,
          nip: biodataResponse.data.id,
          nama: biodataResponse.data.nama,
          email: biodataResponse.data.email,
          is_admin: false,
        },
      });
    }

    return user;
  }

  async FetchUser({
    search,
    page = 1,
    page_size = 10,
  }: {
    search?: string;
    page?: number;
    page_size?: number;
  }) {
    return await prisma.$transaction(async (tx) => {
      const where: Prisma.tbm_userWhereInput = {
        is_deleted: false,
        ...(search && {
          OR: [
            { nip: { contains: search, mode: "insensitive" } },
            { nama: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }),
      };

      const results = await tx.tbm_user.findMany({
        where,
        orderBy: { nama: "asc" },
        take: page_size,
        skip: (page - 1) * page_size,
      });

      const count = await tx.tbm_user.count({ where });

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

  async FetchUserByNIP(nip: string) {
    return await prisma.tbm_user.findFirst({
      where: { nip },
    });
  }

  Upsert = async (data: PolibatamBiodata) => {
    const user = await prisma.tbm_user.findFirst({
      where: { id: data.id },
    });

    if (!user) {
      return await prisma.tbm_user.create({
        data: {
          id: data.id,
          nip: data.id,
          nama: data.nama,
          email: data.email,
          is_admin: false,
        },
      });
    }

    return user;
  };

  async ToggleUserRole(nip: string) {
    return await prisma.$transaction(async (tx) => {
      const user = await tx.tbm_user.findUnique({
        where: { nip },
      });

      if (!user) throw new Error("User not found");

      return await tx.tbm_user.update({
        where: { nip },
        data: {
          is_admin: !user.is_admin,
        },
      });
    });
  }
}

export default new UserRepository();
