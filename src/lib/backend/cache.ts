type CacheEntry<T> = {
  value: T
  expiresAt: number
}

/// Global in-memory cache (single-worker)
// TODO: Check for race conditions in async code
export class KVCache<K, V> {
  private cache = new Map<K, CacheEntry<V>>()

  /// Sets a value in the cache with an expiry time
  public set(key: K, value: V, ttlMs: number): void {
    const expiresAt = Date.now() + ttlMs
    this.cache.set(key, { value, expiresAt })
  }

  /// Gets a value from the cache, returns undefined if expired or not found
  public get(key: K): V | undefined {
    const entry = this.cache.get(key)

    if (!entry) {
      return undefined
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key)
      return undefined
    }

    return entry.value
  }

  /// Deletes a specific key from the cache
  public delete(key: K): boolean {
    return this.cache.delete(key)
  }

  /// Clears all expired entries from the cache
  public flush(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key)
      }
    }
  }

  /// Clears the entire cache
  public clear(): void {
    this.cache.clear()
  }

  /// Gets the number of entries in the cache (including expired ones)
  public size(): number {
    return this.cache.size
  }

  /// Checks if a key exists and is not expired
  public has(key: K): boolean {
    return this.get(key) !== undefined
  }
}

export type Cached<TArgs extends readonly unknown[], TReturn> = ((...args: TArgs) => TReturn | Promise<TReturn>) & { clear: (...args: TArgs) => void }

/// Memoizes calls to a function. Also adds a method `clear` which can be used
/// to clear a single key from the cache.
export function cached<TArgs extends readonly unknown[], TReturn>(
  ttlSeconds: number,
  fn: (...args: TArgs) => TReturn | Promise<TReturn>
): Cached<TArgs, TReturn> {
  const cache: KVCache<string, TReturn> = new KVCache()

  const memoizedFn = async (...args: TArgs): Promise<TReturn> => {
    const key = JSON.stringify(args)

    const cached = cache.get(key)
    if (cached !== undefined) {
      console.debug('CACHE HIT', key)
      return cached
    }

    const result = await fn(...args)
    console.debug('CACHE MISS', key)
    cache.set(key, result, ttlSeconds * 1000)
    return result
  }

  memoizedFn.clear = (...args: TArgs): void => {
    cache.delete(JSON.stringify(args))
  }

  return memoizedFn
}
