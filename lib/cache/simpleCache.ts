// lib/cache/simpleCache.ts
// Simple in-memory cache for frontend data

export class SimpleCache<T> {
  private cache: Map<string, T> = new Map();
  private ttl: number;
  private maxSize: number;

  constructor(ttlMs: number = 60000, maxSize: number = 500) {
    this.ttl = ttlMs;
    this.maxSize = maxSize;
  }

  set(key: string, value: T) {
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
    setTimeout(() => this.cache.delete(key), this.ttl);
  }

  get(key: string): T | undefined {
    return this.cache.get(key);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  clear() {
    this.cache.clear();
  }
}

// Usage example:
// const cache = new SimpleCache<Record<string, unknown>>(60000);
// cache.set('DISCOVER_OBJECTS', data);
// cache.get('DISCOVER_OBJECTS');
