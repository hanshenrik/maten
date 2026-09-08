/**
 * Simple request-scoped cache for Supabase queries.
 * 
 * Usage:
 *   const cache = createQueryCache();
 *   const cachedResult = await cache.getOrSet(cacheKey, () => 
 *     supabase.from('table').select('*').eq('id', 1)
 *   );
 */

// Cache TTL in milliseconds (5 minutes)
const CACHE_TTL = 5 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Create a new request-scoped query cache.
 * Each HTTP request should create its own cache instance.
 */
export function createQueryCache() {
  const cache = new Map<string, CacheEntry<any>>();

  return {
    /**
     * Get a value from cache or set it if not present.
     * @param key - Unique cache key
     * @param fetchFn - Function to fetch the data if not cached
     */
    getOrSet: async <T>(
      key: string,
      fetchFn: () => Promise<T>
    ): Promise<T> => {
      const cached = cache.get(key);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }

      const data = await fetchFn();
      cache.set(key, { data, timestamp: Date.now() });
      return data;
    },

    /**
     * Get a value from cache without fetching.
     */
    get: <T>(key: string): T | undefined => {
      const cached = cache.get(key);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        return cached.data;
      }
      return undefined;
    },

    /**
     * Set a value in the cache.
     */
    set: <T>(key: string, data: T): void => {
      cache.set(key, { data, timestamp: Date.now() });
    },

    /**
     * Check if a key exists and is valid.
     */
    has: (key: string): boolean => {
      const cached = cache.get(key);
      return !!(cached && Date.now() - cached.timestamp < CACHE_TTL);
    },

    /**
     * Clear the entire cache.
     */
    clear: (): void => {
      cache.clear();
    },

    /**
     * Delete a specific key from cache.
     */
    delete: (key: string): void => {
      cache.delete(key);
    },
  };
}

/**
 * Generate a consistent cache key from query parameters.
 */
export function generateCacheKey(
  table: string,
  operation: string,
  params?: Record<string, any>
): string {
  const paramString = params
    ? Object.entries(params)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}:${JSON.stringify(v)}`)
        .join("|")
    : "";
  return `${table}:${operation}:${paramString}`;
}
