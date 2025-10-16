'use client';

import { useEffect, useRef } from 'react';

type AudioControl = {
  tempo?: number;
  filter?: number; // 0..1
  reverb?: number; // 0..1
  pattern?: string;
};

function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

export default function WebChuckController({ control }: { control?: AudioControl }) {
  const state = useRef<{ tempo: number; filter: number; reverb: number; pattern: string }>({ tempo: 100, filter: 0.4, reverb: 0.3, pattern: 'pad' });

  useEffect(() => {
    if (!control) return;
    const next = {
      tempo: typeof control.tempo === 'number' ? control.tempo : state.current.tempo,
      filter: typeof control.filter === 'number' ? control.filter : state.current.filter,
      reverb: typeof control.reverb === 'number' ? control.reverb : state.current.reverb,
      pattern: control.pattern ?? state.current.pattern,
    };
    // simple smoothing over a few animation frames
    const steps = 8; let i = 0;
    const id = requestAnimationFrame(function tick() {
      i++;
      const t = Math.min(1, i / steps);
      const cur = state.current;
      const tempo = lerp(cur.tempo, next.tempo, t);
      const filter = lerp(cur.filter, next.filter, t);
      const reverb = lerp(cur.reverb, next.reverb, t);
      // TODO: hook up to your actual WebChucK interface here
      try {
        (window as any).__chuckSet?.('tempo', tempo);
        (window as any).__chuckSet?.('filter', filter);
        (window as any).__chuckSet?.('reverb', reverb);
        if (next.pattern !== cur.pattern) (window as any).__chuckSet?.('pattern', next.pattern);
      } catch {}
      if (t < 1) requestAnimationFrame(tick);
    });
    state.current = next;
    return () => cancelAnimationFrame(id);
  }, [control]);

  return null;
}
