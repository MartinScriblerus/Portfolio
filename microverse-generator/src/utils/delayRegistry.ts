// src/utils/delayRegistry.ts
export function createDelayRegistry() {
  const items = new Map<string, { startedAt: number; expectedMs: number; source?: string }>();
  return {
    register(id: string, expectedMs: number, source?: string) {
      items.set(id, { startedAt: performance.now(), expectedMs, source });
    },
    complete(id: string) { items.delete(id); },
    adviseCleanup(now = performance.now()) {
      const stale: string[] = [];
      items.forEach((v, k) => {
        if (now - v.startedAt > v.expectedMs * 1.25) stale.push(k);
      });
      return stale;
    },
    list: () => Array.from(items.entries()),
  };
}