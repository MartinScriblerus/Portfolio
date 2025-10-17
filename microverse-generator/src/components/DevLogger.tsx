'use client';

import { useEffect, useRef } from 'react';
import { useAskStore } from '../store/useAskStore';
import { useIntentDebugStore } from '../store/useIntentDebugStore';
import { useSignalBus } from '../store/useSignalBus';
import { useVisStore } from '../store/useVisStore';
import { useAgentStore } from '../agent/useAgentStore';

// Central Zustand logger: coalesces rapid updates across stores and logs a single snapshot
// of hydra/babylon (signal bus + vis), chuck (via window globals if available), and chat (ask/intent).
export default function DevLogger() {
  const rafId = useRef<number | null>(null);
  const pending = useRef(false);

  useEffect(() => {
    const scheduleLog = () => {
      if (pending.current) return;
      pending.current = true;
      rafId.current = requestAnimationFrame(() => {
        pending.current = false;
        // Snapshot all stores at the same moment
        const bus = useSignalBus.getState();
        const vis = useVisStore.getState();
        const agent = useAgentStore.getState();
        const ask = useAskStore.getState();
        const intent = useIntentDebugStore.getState();
        const w: any = typeof window !== 'undefined' ? window : {};

        const activeOps = Object.entries(vis.ops)
          .filter(([, v]) => v?.on)
          .reduce((acc, [k, v]) => { acc[k] = (v as any).strength; return acc; }, {} as Record<string, number>);

        const snapshot = {
          ts: performance.now(),
          bus: {
            rgb: bus.rgb,
            impact: bus.impact,
            pulse: bus.pulse,
            metrics: bus.metrics,
          },
          vis: {
            strongMode: vis.strongMode,
            targetColorBias: vis.targetColorBias,
            colorBiasWeight: vis.colorBiasWeight,
            activeOps,
          },
          agent: agent.telemetry,
          chat: {
            resultsCount: ask.textResults?.length ?? 0,
            lastIntent: intent.last?.query ?? null,
            stats: intent.last?.stats ?? null,
          },
          audio: {
            amp: w.__audioAmp ?? null,
            tempo: w.__audioTempo ?? null,
            beat: w.__audioBeat ?? null,
          },
        };
        // Single consolidated log
        // Use a collapsed group for readability
        try {
        //   console.groupCollapsed('[zustand] snapshot');
        //   console.log(snapshot);
          console.groupEnd();
        } catch {
        //   console.log('[zustand] snapshot', snapshot);
        }
      });
    };

    // Subscribe to all relevant stores; any change schedules a coalesced log
    const unsubs = [
      useSignalBus.subscribe(scheduleLog),
      useVisStore.subscribe(scheduleLog),
      useAgentStore.subscribe(scheduleLog),
      useAskStore.subscribe(scheduleLog),
      useIntentDebugStore.subscribe(scheduleLog),
    ];

    // Initial log
    scheduleLog();

    return () => {
      unsubs.forEach(u => { try { u(); } catch {} });
      if (rafId.current != null) cancelAnimationFrame(rafId.current);
    };
  }, []);

  return null;
}
