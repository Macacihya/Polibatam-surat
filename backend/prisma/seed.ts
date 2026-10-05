import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // const data = {
  //   uid: "199102032018031001",
  // };
  // const default_admin = await prisma.tbm_admin.upsert({
  //   where: { uid: data.uid },
  //   update: data,
  //   create: data,
  // });
  // console.log({
  //   default_admin,
  // });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
