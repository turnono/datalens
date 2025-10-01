import type { QueryResult } from "@datalens/shared";

type CacheEntry = { value: QueryResult; expiresAt: number };

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const resultCache = new Map<string, CacheEntry>();
const inFlight = new Map<string, Promise<QueryResult>>();

export function getCacheKey(q: string, mode: string | undefined): string {
  return `${q}::${mode ?? "default"}`;
}

export function getCached(key: string): QueryResult | undefined {
  const e = resultCache.get(key);
  if (!e) return undefined;
  if (Date.now() > e.expiresAt) {
    resultCache.delete(key);
    return undefined;
  }
  return e.value;
}

export function setCached(key: string, value: QueryResult, ttlMs = ONE_DAY_MS) {
  resultCache.set(key, { value, expiresAt: Date.now() + ttlMs });
}

export function getInFlight(key: string) {
  return inFlight.get(key);
}

export function setInFlight(key: string, p: Promise<QueryResult>) {
  inFlight.set(key, p);
  p.finally(() => inFlight.delete(key)).catch(() => inFlight.delete(key));
}
