// src/clock/beatClock.ts
export type Transport = {
  bpm: number;
  numerator: number;
  denominator: number;
  subdivisionMs: number; // smallest step interval
};

export type TickEvent = {
  now: number;
  wallClock: number;
  stepIdx: number;
  beatIdx: number;
  measureIdx: number;
  stepInBeat: number;
  beatInMeasure: number;
  plannedAt: number;
  driftMs: number;
  intervalMs: number;
};

export type BeatClockHandle = {
  start: () => void;
  stop: () => void;
  isRunning: () => boolean;
  updateTransport: (t: Partial<Transport>) => void;
  subscribe: (fn: (e: TickEvent) => void) => () => void;
  snapshot: () => { stepIdx: number; beatIdx: number; measureIdx: number };
};

export function createBeatClock(initial: Transport): BeatClockHandle {
  let transport: Transport = { ...initial };
  let running = false;
  let rafId: number | null = null;
  let backupId: number | null = null;
  let listeners = new Set<(e: TickEvent) => void>();

  let stepIdx = 0;
  let beatIdx = 0;
  let measureIdx = 0;
  let nextPlanned = 0;

  const stepsPerBeat = () => {
    const beatMs = (60000 / transport.bpm) * (4 / transport.denominator);
    return Math.max(1, Math.round(beatMs / transport.subdivisionMs));
  };

  function emit(e: TickEvent) {
    listeners.forEach(fn => {
      try { fn(e); } catch {}
    });
  }

  function loop() {
    if (!running) return;
    const now = performance.now();
    while (running && now + 1 >= nextPlanned) {
      const spb = stepsPerBeat();
      const stepInBeat = stepIdx % spb;
      const beatInMeasure = beatIdx % transport.numerator;

      emit({
        now,
        wallClock: Date.now(),
        stepIdx,
        beatIdx,
        measureIdx,
        stepInBeat,
        beatInMeasure,
        plannedAt: nextPlanned,
        driftMs: now - nextPlanned,
        intervalMs: transport.subdivisionMs,
      });

      stepIdx++;
      if (stepInBeat + 1 >= spb) {
        beatIdx++;
        if (beatInMeasure + 1 >= transport.numerator) {
          measureIdx++;
        }
      }
      nextPlanned += transport.subdivisionMs;
    }
    rafId = requestAnimationFrame(loop);
  }

  function realign(anchor = performance.now()) {
    nextPlanned = anchor + transport.subdivisionMs;
  }

  function start() {
    if (running) return;
    running = true;
    realign();
    rafId = requestAnimationFrame(loop);
    backupId = window.setInterval(loop, Math.max(8, transport.subdivisionMs / 2));
  }

  function stop() {
    running = false;
    if (rafId != null) cancelAnimationFrame(rafId);
    if (backupId != null) clearInterval(backupId);
    rafId = null;
    backupId = null;
  }

  function updateTransport(t: Partial<Transport>) {
    transport = { ...transport, ...t };
    realign(performance.now());
  }

  function subscribe(fn: (e: TickEvent) => void) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  function snapshot() {
    return { stepIdx, beatIdx, measureIdx };
  }

  return { start, stop, isRunning: () => running, updateTransport, subscribe, snapshot };
}