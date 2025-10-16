'use client';

import { useCallback, useMemo, useRef } from 'react';
import { useVisStore } from '../store/useVisStore';
import { useIntentDebugStore } from '../store/useIntentDebugStore';

type OpCfg = { on: boolean; strength: number };
type VisualControl = {
  ops?: Partial<Record<string, OpCfg>>;
  targetColor?: { r: number; g: number; b: number };
};

type AudioControl = {
  tempo?: number;
  filter?: number;
  reverb?: number;
  pattern?: string;
};

type IntentOut = { visual: VisualControl; audio: AudioControl; meta?: any };

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number) {
  let t: any;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}

export function useIntentBridge(options?: { cooldownMs?: number; onAudio?: (a: AudioControl) => void; debug?: boolean }) {
  const mergeOps = useVisStore((s) => s.mergeOps as (p: any) => void);
  const setBias = useVisStore((s) => s.setTargetColorBias);
  const setLast = useIntentDebugStore((s) => s.setLast);
  const lastAt = useRef(0);
  const cooldown = options?.cooldownMs ?? 6000;

  const applyControls = useCallback((out: IntentOut) => {
    if (out?.visual?.ops) {
      const partial: Record<any, OpCfg> = {};
      for (const k of Object.keys(out.visual.ops)) {
        const cfg = (out.visual.ops as any)[k];
        if (!cfg) continue;
        partial[k as any] = { on: !!cfg.on, strength: Math.max(0, Math.min(1, Number(cfg.strength) || 0)) };
      }
      mergeOps(partial as any);
    }
    if (out?.visual?.targetColor) {
      setBias(out.visual.targetColor);
    }
    if (options?.onAudio && out?.audio) options.onAudio(out.audio);
  }, [mergeOps, setBias, options]);

  const run = useCallback(async (query: string, topK = 3) => {
    const now = Date.now();
    if (now - lastAt.current < cooldown) return; // throttle
    lastAt.current = now;
    const res = await fetch('/api/intent', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ query, topK })
    });
    if (!res.ok) {
      console.warn('[intentBridge] request failed', res.status);
      try {
        const err = await res.json();
        console.warn('[intentBridge] error body', err);
      } catch {}
      return;
    }
    const json: IntentOut = await res.json();
    applyControls(json);
    if (options?.debug) {
      try {
        const stats = (json as any).meta?.stats || null;
        setLast({
          at: performance.now(),
          query,
            visual: {
              ops: json.visual?.ops as any,
              targetColor: json.visual?.targetColor ?? null,
            },
            audio: json.audio as any,
            sources: (json as any).meta?.sources,
            stats,
        });
      } catch {}
    }
  }, [applyControls, cooldown]);

  const debouncedRun = useMemo(() => debounce(run, 350), [run]);
  return { run: debouncedRun };
}
