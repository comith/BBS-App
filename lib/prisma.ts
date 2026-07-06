import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const dbUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL || "postgresql://localhost:5432/postgres";
  const rawUrl = new URL(dbUrl)
  const schema = rawUrl.searchParams.get('schema') || 'public'
  rawUrl.searchParams.delete('schema')

  const pool = new Pool({
    connectionString: rawUrl.toString(),
    connectionTimeoutMillis: 30000,
    idleTimeoutMillis: 30000,
    max: 50,
  })

  // Prevent unhandled 'error' event from crashing the process
  pool.on('error', (err) => {
    console.error('[prisma] Idle client error:', err.message)
  })

  const adapter = new PrismaPg(pool, { schema })
  return new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
