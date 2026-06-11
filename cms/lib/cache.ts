/**
 * Simple in-memory TTL cache for GitHub API responses.
 * Warm Vercel instances share memory between requests — this significantly
 * reduces GitHub API round-trips (200-400ms each) during active sessions.
 */

type Entry = { data: unknown; expires: number };
const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { store.delete(key); return null; }
  return entry.data as T;
}

export function cacheSet(key: string, data: unknown, ttlMs = 30_000) {
  store.set(key, { data, expires: Date.now() + ttlMs });
}

export function cacheInvalidate(prefix: string) {
  Array.from(store.keys()).forEach(key => {
    if (key.startsWith(prefix)) store.delete(key);
  });
}
