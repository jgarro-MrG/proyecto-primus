// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);
  await prisma.role.createMany({
    data: [{ name: 'admin' }, { name: 'user' }],
    skipDuplicates: true, // No fallará si los roles ya existen
  });
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });