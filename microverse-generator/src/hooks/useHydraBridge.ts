// src/hooks/useHydraBridge.ts
import { useEffect, useRef } from 'react';
import Hydra from 'hydra-synth';

export type HydraBridge = {
  onTick: (t: {
    beatInMeasure: number;
    stepInBeat: number;
    intervalMs: number;
    driftMs: number;
    measureIdx: number;
  }) => void;
  updateTransport: (bpm: number, num: number, den: number) => void;
  updateFeature: (name: string, value: number) => void;
  setProgram: (fn: (h: any, ctx: any) => void) => void;
};

export function useHydraBridge(canvasRef: React.RefObject<HTMLCanvasElement>): HydraBridge {
  const hydraRef = useRef<any>(null);
  const ctxRef = useRef<any>({
    bpm: 120,
    num: 4,
    den: 4,
    energy: 0,
    bass: 0,
    beatPulse: 0,
    measurePhase: 0,
    drift: 0,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    // eslint-disable-next-line new-cap
    const hydra = new (Hydra as any)({ canvas, detectAudio: false, makeGlobal: true });
    hydraRef.current = hydra;

    // Baseline patch referencing ctxRef dynamically
    const ctx = ctxRef.current;
    // @ts-ignore
    osc(() => 10 + (ctx.energy || 0) * 50, 0.1, () => 0.8 + ctx.beatPulse * 0.25)
      .kaleid(() => 3 + ctx.measurePhase * 8)
      // .modulate(osc((2, 0.1, 2), () => 0.1 + ctx.bass * 0.35)
      .out();

    return () => {
      try { hydra.o?.forEach((o: any) => o?.clear?.()); } catch {}
      try { hydra?.sandbox?.destroy?.(); } catch {}
    };
  }, [canvasRef.current]);

  return {
    onTick: (t) => {
      const ctx = ctxRef.current;
      if (t.stepInBeat === 0) {
        const prev = ctx.beatPulse || 0;
        ctx.beatPulse = Math.max(0, prev * 0.85 + 0.5);
      } else {
        ctx.beatPulse = ctx.beatPulse * 0.9;
      }
      // measure phase 0..1
      const stepsPerBeatApprox = Math.max(1, Math.round(((60000 / ctx.bpm) * (4 / ctx.den)) / t.intervalMs));
      ctx.measurePhase = (t.beatInMeasure + t.stepInBeat / stepsPerBeatApprox) / ctx.num;
      ctx.drift = t.driftMs;
    },
    updateTransport: (bpm, num, den) => {
      const ctx = ctxRef.current;
      ctx.bpm = bpm; ctx.num = num; ctx.den = den;
    },
    updateFeature: (name, value) => {
      const ctx = ctxRef.current;
      if (name === 'rms' || name === 'energy') ctx.energy = value;
      if (name === 'bass') ctx.bass = value;
    },
    setProgram: (fn) => {
      const h = hydraRef.current;
      if (!h) return;
      fn(h, ctxRef.current);
    },
  };
}