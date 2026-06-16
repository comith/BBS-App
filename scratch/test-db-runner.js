const { execSync } = require('child_process');
const fs = require('fs');

async function check() {
  const code = `
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();
    async function main() {
      const records = await prisma.record.findMany({
        where: { date: { gte: '2026-01-01', lte: '2026-12-31' } },
        include: { aiInsight: true },
        take: 9999,
      });
      const sizeBytes = Buffer.byteLength(JSON.stringify(records));
      console.log("Full records with AiInsight size:", sizeBytes / 1024 / 1024, "MB");
      
      const recordsLean = await prisma.record.findMany({
        where: { date: { gte: '2026-01-01', lte: '2026-12-31' } },
        include: { aiInsight: { select: { id: true } } },
        take: 9999,
      });
      const sizeLean = Buffer.byteLength(JSON.stringify(recordsLean));
      console.log("Records with only AiInsight ID size:", sizeLean / 1024 / 1024, "MB");
    }
    main().finally(() => prisma.$disconnect());
  `;
  fs.writeFileSync('scratch/test-db2.js', code);
  try {
    const res = execSync('npx env-cmd -f .env.local node scratch/test-db2.js');
    console.log(res.toString());
  } catch (e) {
    console.log(e.stdout ? e.stdout.toString() : e.message);
    console.log(e.stderr ? e.stderr.toString() : '');
  }
}
check();
