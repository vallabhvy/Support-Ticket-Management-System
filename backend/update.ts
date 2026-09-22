import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.$executeRawUnsafe(`UPDATE User SET role = 'AGENT' WHERE role = 'ADMIN'`);
}

main()
  .then(() => console.log('Successfully updated users'))
  .catch((e) => console.error(e))
  .finally(() => prisma.$disconnect());
