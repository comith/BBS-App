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

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';

async function isOllamaOnline() {
  try {
    const start = Date.now();
    const response = await fetch(`${OLLAMA_URL}/api/tags`, {
      method: 'GET',
      signal: AbortSignal.timeout(2500),
    });
    const duration = Date.now() - start;
    console.log(`Ollama responded in ${duration}ms. Status: ${response.status} (${response.statusText})`);
    return response.ok;
  } catch (err) {
    console.error(`Ollama check failed:`, err.message);
    return false;
  }
}

async function run() {
  console.log("Checking DB connection and records...");
  try {
    const totalBBS = await prisma.record.count();
    const pendingBBS = await prisma.record.count({
      where: { aiInsight: null, observedWork: { not: null } }
    });
    const failedBBS = await prisma.record.count({
      where: { aiInsight: { category: 'FAILED' } }
    });

    const totalSHE = await prisma.recordShe.count();
    const pendingSHE = await prisma.recordShe.count({
      where: { aiInsight: null, observedWork: { not: null } }
    });
    const failedSHE = await prisma.recordShe.count({
      where: { aiInsight: { category: 'FAILED' } }
    });

    console.log(`BBS Records: Total=${totalBBS}, Pending AI=${pendingBBS}, Failed AI=${failedBBS}`);
    console.log(`SHE Records: Total=${totalSHE}, Pending AI=${pendingSHE}, Failed AI=${failedSHE}`);
  } catch (err) {
    console.error("Database check failed:", err.message);
  }

  console.log("\nChecking Ollama status...");
  const online = await isOllamaOnline();
  console.log(`Ollama online status: ${online}`);
}

run().finally(() => {
  prisma.$disconnect();
  pool.end();
});
