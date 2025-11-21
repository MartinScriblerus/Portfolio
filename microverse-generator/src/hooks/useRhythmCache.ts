import { useEffect, useMemo, useRef } from 'react';
import { useBeatGridStore } from '../store/useBeatGridStore';

// Types of the cache we build. Adapt as your DFS/next-event needs grow.
export type RhythmEvent = {
  y: number;                // row index
  x: number;                // col index
  t: number;                // start time (beats or seconds depending on your convention)
  length: number;           // normalized length
  velocity: number;         // normalized velocity
  fileIdxs?: number[];      // optional sample indices
  noteNames?: string[];     // optional note names
};

export type RhythmCache = {
  version: number;          // mirrors gridVersion at build time
  events: RhythmEvent[];    // flattened DFS/sequence for quick traversal
  // Optionally include maps for "next event" lookups per (y,x)
  nextByCell: Record<string, RhythmEvent | undefined>;
};

/**
 * useRhythmCache
 * - Rebuilds a DFS/next-event cache when the gridVersion changes.
 * - Returns a stable ref to the cache for consumers to traverse without re-renders.
 *
 * NOTES:
 * - Effects/STK integration:
 *   When reintegrating effects/STK that influence timing or scheduling, you can:
 *   (1) Subscribe to their versions here and include them in the recompute condition.
 *   (2) Or call useBeatGridStore.getState().bumpGridVersion() from those systems
 *       to force a recompute using the same global trigger.
 */
export function useRhythmCache() {
  const gridVersion = useBeatGridStore((s) => s.gridVersion);
  const grid = useBeatGridStore((s) => s.masterPatternsHashHook);

  // NOTE (effects/STK): If effects/STK should also trigger recompute, either:
  // - add selectors here, e.g. const fxVersion = useFXStore(s => s.version);
  // - and include them in the dependency list below (gridVersion, fxVersion).
  // - OR call bumpGridVersion() in those change paths.

  const cacheRef = useRef<RhythmCache>({
    version: -1,
    events: [],
    nextByCell: {},
  });

  // Build cache whenever the version changes. We read the latest grid snapshot.
  useEffect(() => {
    const next = buildCacheFromGrid(grid, gridVersion);
    cacheRef.current = next;
  }, [gridVersion, grid]);

  // Expose the cache and version as stable references
  return useMemo(
    () => ({
      cacheRef,
      version: cacheRef.current.version,
    }),
    [cacheRef.current.version]
  );
}

function buildCacheFromGrid(
  grid: Record<string, Record<string, any>>,
  version: number
): RhythmCache {
  const events: RhythmEvent[] = [];
  const nextByCell: Record<string, RhythmEvent | undefined> = {};

  // Traverse rows (y) then columns (x). Adjust ordering to your timing model.
  const yKeys = Object.keys(grid).sort((a, b) => Number(a) - Number(b));
  for (const yKey of yKeys) {
    const row = grid[yKey] || {};
    const xKeys = Object.keys(row).sort((a, b) => Number(a) - Number(b));
    for (const xKey of xKeys) {
      const cell = row[xKey] || {};
      const subdivisions = Number(cell.subdivisions ?? 1);
      const length = Number(cell.length ?? 1);
      const velocity = Number(cell.velocity ?? 0.5);
      const fileIdxs: number[] | undefined = cell.fileNums ? Array.from(cell.fileNums) : undefined;
      const noteNames: string[] | undefined = cell.noteName ? Array.from(cell.noteName) : undefined;

      // Simple placement: treat each subdivision as a separate event
      // t is normalized to x + k/subdivisions; adapt to your beat model as needed
      for (let k = 0; k < Math.max(1, subdivisions); k++) {
        const evt: RhythmEvent = {
          y: Number(yKey),
          x: Number(xKey),
          t: Number(xKey) + k / Math.max(1, subdivisions),
          length,
          velocity,
          fileIdxs,
          noteNames,
        };
        events.push(evt);
      }
    }
  }

  // Sort by t (then by y/x for deterministic ordering)
  events.sort((a, b) => (a.t - b.t) || (a.y - b.y) || (a.x - b.x));

  // Build a simple next-event lookup per cell (first next after t)
  // Consumers can build more detailed structures from events if needed
  for (let i = 0; i < events.length; i++) {
    const cur = events[i];
    const key = `${cur.y}_${cur.x}`;
    // First-next mapping: choose the next timeline event after current
    // This is a simple heuristic; extend as needed
    let nextEvt: RhythmEvent | undefined = undefined;
    for (let j = i + 1; j < events.length; j++) {
      if (events[j].t >= cur.t) { nextEvt = events[j]; break; }
    }
    // Only set if not assigned to keep the earliest "next"
    if (nextByCell[key] === undefined) {
      nextByCell[key] = nextEvt;
    }
  }

  return {
    version,
    events,
    nextByCell,
  };
}






