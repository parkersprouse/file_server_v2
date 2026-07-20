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
   * Resolve `key` through the cache: return fresh cached data, join an
   * in-flight request for the same key, or run `factory` and cache its result.
   *
   * A rejected `factory` promise removes its pending entry, so a transient
   * failure is retried on the next call instead of poisoning the key until the
   * TTL expires. The rejection still propagates to every caller awaiting it.
   */
  async fetch(key: string, factory: () => Promise<T>): Promise<T> {
    const existing = this.cache.get(key);
    if (existing && Date.now() - existing.timestamp <= this.ttl) {
      if (existing.data !== undefined) return existing.data;
      if (existing.promise) return existing.promise;
    }

    const promise = factory().then((data) => {
      this.cache.set(key, {
        data,
        timestamp: Date.now(),
      });
      return data;
    });
    this.cache.set(key, {
      promise,
      timestamp: Date.now(),
    });
    promise.catch(() => {
      // Only clean up our own entry — a newer request may have replaced it.
      if (this.cache.get(key)?.promise === promise) this.cache.delete(key);
    });

    return promise;
  }
}

// Create a singleton cache instance for directory listings
export const directory_cache = new RequestCache<unknown[]>({
  ttl: 5 * 60 * 1000, // 5 minutes
});
