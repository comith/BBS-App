// In-memory cache for rarely-changing lookup data (category/subcategory/employee/department/group).
// Persisted on globalThis so it survives Next.js dev hot-reloads, same pattern as the Prisma singleton.
const STATIC_CACHE_TTL_MS = 5 * 60 * 1000

type CacheEntry = { data: unknown; time: number }

const globalForStaticCache = globalThis as unknown as {
  __apiGetStaticCache?: Map<string, CacheEntry>
}
const staticCache = globalForStaticCache.__apiGetStaticCache ?? new Map<string, CacheEntry>()
globalForStaticCache.__apiGetStaticCache = staticCache

export async function getCached<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const cached = staticCache.get(key)
  if (cached && Date.now() - cached.time < STATIC_CACHE_TTL_MS) {
    return cached.data as T
  }
  const data = await loader()
  staticCache.set(key, { data, time: Date.now() })
  return data
}

export function invalidateCached(key: string) {
  staticCache.delete(key)
}
