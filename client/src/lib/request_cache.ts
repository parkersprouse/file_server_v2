/**
 * Request cache with TTL and deduplication
 * Prevents duplicate API calls and caches results for a configurable time period
 */

interface CacheEntry<T> {
  data?: T;
  timestamp: number;
  promise?: Promise<T>;
}

export interface RequestCacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 5 minutes)
}

export class RequestCache<T> {
  private cache = new Map<string, CacheEntry<T>>();
  private ttl: number;

  constructor(options?: RequestCacheOptions) {
    this.ttl = options?.ttl ?? 5 * 60 * 1000; // 5 minutes default
  }

  /**
   * Get a cached value if it exists and hasn't expired
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if cache has expired
    if (Date.now() - entry.timestamp > this.ttl) {
      this.cache.delete(key);
      return null;
    }

    // A pending-only entry (created by `setPending` before its data arrives)
    // has no `data` yet — report it as a miss rather than returning `undefined`.
    return entry.data ?? null;
  }

  /**
   * Get a pending promise for deduplication
   */
  getPending(key: string): Promise<T> | null {
    const entry = this.cache.get(key);
    return entry?.promise ?? null;
  }

  /**
   * Set a cached value
   */
  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Set a pending promise for request deduplication
   */
  setPending(key: string, promise: Promise<T>): void {
    const existing = this.cache.get(key);
    this.cache.set(key, {
      data: existing?.data,
      promise,
      timestamp: existing?.timestamp ?? Date.now(),
    });
  }

  /**
   * Clear a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache size
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Get cache hit rate (for debugging)
   */
  getStats(): {
    size: number;
    ttl: number;
  } {
    return {
      size: this.cache.size,
      ttl: this.ttl,
    };
  }

  /**
   * Clean up expired entries (useful to call periodically)
   */
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Create a singleton cache instance for directory listings
export const directory_cache = new RequestCache<unknown[]>({
  ttl: 5 * 60 * 1000, // 5 minutes
});
