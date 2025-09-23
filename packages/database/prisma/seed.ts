// packages/database/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  await prisma.role.createMany({
    data: [{ name: 'admin' }, { name: 'user' }],
    skipDuplicates: true,
  });

  const categories = [
    { name: 'Cuidado del Hogar', display_order: 10 },
    { name: 'Cuidado Personal', display_order: 20 },
    { name: 'Despensa', display_order: 30 },
    { name: 'Bebidas', display_order: 40 },
    { name: 'Panadería y Pastelería', display_order: 50 },
    { name: 'Frescos', display_order: 60 },
    { name: 'Otros', display_order: 80 },
    { name: 'Congelados y Refrigerados', display_order: 99 }, // <-- Siempre al final
  ];

  for (const category of categories) {
    await prisma.category.upsert({
      where: { name: category.name },
      update: { display_order: category.display_order },
      create: { name: category.name, display_order: category.display_order },
    });
  }

  console.log(`Seeding finished.`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
