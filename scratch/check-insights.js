const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const dbUrl = process.env.DATABASE_URL || "postgresql://localhost:5432/postgres";
const rawUrl = new URL(dbUrl);
const schema = rawUrl.searchParams.get('schema') || 'public';
rawUrl.searchParams.delete('schema');

const pool = new Pool({
  connectionString: rawUrl.toString(),
  connectionTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  max: 10,
});

const adapter = new PrismaPg(pool, { schema });
const prisma = new PrismaClient({ adapter });

async function run() {
  const recordId = "BBS_1781591608493";
  const record = await prisma.record.findUnique({
    where: { id: recordId },
    include: { aiInsight: true }
  });
  console.log(`Record ${recordId}:`, JSON.stringify(record, null, 2));
}

run().finally(() => {
  prisma.$disconnect();
  pool.end();
});
