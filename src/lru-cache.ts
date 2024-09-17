/**
 * A Least Recently Used (LRU) cache with Time-to-Live (TTL) support. Items are kept in the cache until they either
 * reach their TTL or the cache reaches its size and/or item limit. When the limit is exceeded, the cache evicts the
 * item that was least recently accessed (based on the timestamp of access). Items are also automatically evicted if they
 * are expired, as determined by the TTL.
 * An item is considered accessed, and its last accessed timestamp is updated, whenever `has`, `get`, or `set` is called with its key.
 *
 * Implement the LRU cache provider here and use the lru-cache.test.ts to check your implementation.
 * You're encouraged to add additional functions that make working with the cache easier for consumers.
 */

type LRUCacheProviderOptions = {
  ttl: number // Time to live in milliseconds
  itemLimit: number
}
type LRUCacheProvider<T> = {
  has: (key: string) => boolean
  get: (key: string) => T | undefined
  set: (key: string, value: T) => void
}
type CacheItem<T> = {
  value: T
  ttl: number
}

// TODO: Implement LRU cache provider
export function createLRUCacheProvider<T>({
  ttl,
  itemLimit,
}: LRUCacheProviderOptions): LRUCacheProvider<T> {
  const cache = new Map<string, CacheItem<T>>();
  const capacity = itemLimit;

  return {
    has: (key: string) => {
      const item = cache.get(key);
      if(!item) return false;
      if (item.ttl < +new Date()) {
        cache.delete(key);
        return false;
      }

      cache.delete(key);
      cache.set(key, {value: item.value, ttl: +new Date() + ttl});

      return true;
    },
    get: (key: string): (T | undefined) => {
      const item = cache.get(key);
      if(!item) return;
      if (item.ttl < +new Date()) {
        cache.delete(key);
        return;
      }

      cache.delete(key);
      cache.set(key, {value: item.value, ttl: +new Date() + ttl});

      return item.value;
    },
    set: (key: string, value: T) => {
      cache.delete(key);
      cache.set(key, {value, ttl: +new Date() + ttl});

      if (cache.size > capacity) {
        // since entries() is iterable, I think this is optimal (IMBW)
        for (const [key, value] of cache.entries()) {
          cache.delete(key);
          break;
        }
      }
    },
  }
}
