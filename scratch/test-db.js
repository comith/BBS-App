const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  console.time("fetch records");
  const records = await prisma.record.findMany({
    take: 9999,
  });
  console.timeEnd("fetch records");
  console.log("Records length:", records.length);
  
  console.time("fetch records with aiInsight");
  const recordsWithAi = await prisma.record.findMany({
    include: { aiInsight: true },
    take: 9999,
  });
  console.timeEnd("fetch records with aiInsight");
  console.log("RecordsWithAi length:", recordsWithAi.length);
}
main().finally(() => prisma.$disconnect());
