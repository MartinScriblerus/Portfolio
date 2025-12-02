// src/utils/timingTrace.ts
import type { TickEvent } from '../clock/beatClock';

export function createTimingTrace({ maxEvents = 1500, warnDriftMs = 4 } = {}) {
  const fine: TickEvent[] = [];
  const aggregates: { measureIdx: number; avgDriftMs: number; maxDriftMs: number; steps: number }[] = [];
  let current: { measureIdx: number; avgDriftMs: number; maxDriftMs: number; steps: number } | null = null;

  return {
    onTick(t: TickEvent) {
      if (fine.length >= maxEvents) fine.shift();
      fine.push(t);

      if (t.driftMs > warnDriftMs && t.stepInBeat === 0) {
        // Optional drift warning; keep console quiet in prod
        // console.warn('[timing drift]', t.driftMs.toFixed(2), 'ms @ beat', t.beatIdx);
      }

      if (t.beatInMeasure === 0 && t.stepInBeat === 0) {
        if (current) aggregates.push({ ...current });
        current = { measureIdx: t.measureIdx, avgDriftMs: 0, maxDriftMs: 0, steps: 0 };
      }
      current ??= { measureIdx: t.measureIdx, avgDriftMs: 0, maxDriftMs: 0, steps: 0 };
      current.steps++;
      current.avgDriftMs = ((current.avgDriftMs * (current.steps - 1)) + t.driftMs) / current.steps;
      current.maxDriftMs = Math.max(current.maxDriftMs, t.driftMs);
    },
    getFine: () => fine.slice(),
    getAggregates: () => aggregates.slice(-64),
  };
}