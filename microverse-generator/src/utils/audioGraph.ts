// audioGraph.ts
export type EffectConfig = { id: string; params?: Record<string, number | string> };

export type BuiltNode = {
  input: AudioNode;
  output: AudioNode;
  dispose: () => void;
  update?: (params: Record<string, any>) => void;
};

export type EffectBuilder = (ctx: AudioContext, config: EffectConfig) => BuiltNode;

// Registry of effect builders
export const EFFECTS: Record<string, EffectBuilder> = {
  drive: (ctx, cfg) => {
    const input = ctx.createGain();
    const out = ctx.createGain();
    // ... your waveshaper, gains, etc.
    input.connect(out);
    return {
      input,
      output: out,
      dispose: () => {
        try { input.disconnect(); } catch {}
        try { out.disconnect(); } catch {}
      },
      update: (p) => {
        // update params on the fly, e.g. out.gain.value = p.gain ?? out.gain.value;
      }
    };
  },
  delay: (ctx, cfg) => {
    const input = ctx.createGain();
    const out = ctx.createGain();
    const delay = ctx.createDelay(4.0);
    delay.delayTime.setTargetAtTime(Number(cfg.params?.time ?? 0.3), ctx.currentTime, 0.015);
    input.connect(delay).connect(out);
    return {
      input, output: out,
      dispose: () => {
        try { input.disconnect(); } catch {}
        try { delay.disconnect(); } catch {}
        try { out.disconnect(); } catch {}
      },
      update: (p) => {
        if (typeof p.time === 'number') {
          delay.delayTime.setTargetAtTime(p.time, ctx.currentTime, 0.02);
        }
      }
    };
  },
  // ...more effects
};

export type AudioGraph = {
  nodes: BuiltNode[];
  start: AudioNode;       // first input
  end: AudioNode;         // last output
  dispose: () => void;
  updateParams: (id: string, params: Record<string, any>) => void;
};

export function buildAudioGraph(
  ctx: AudioContext,
  chain: readonly EffectConfig[],
  destination: AudioNode
): AudioGraph {
  const nodes: BuiltNode[] = [];

  for (const cfg of chain) {
    const builder = EFFECTS[cfg.id];
    if (!builder) continue;
    nodes.push(builder(ctx, cfg));
  }

  // Wire
  for (let i = 0; i < nodes.length; i++) {
    const a = nodes[i];
    const b = nodes[i + 1];
    if (b) {
      a.output.connect(b.input);
    }
  }
  const start = nodes[0]?.input ?? destination;
  const end = nodes[nodes.length - 1]?.output ?? destination;
  if (nodes.length > 0) end.connect(destination);

  return {
    nodes,
    start,
    end,
    dispose: () => {
      try { end.disconnect(); } catch {}
      nodes.forEach(n => n.dispose());
    },
    updateParams: (id, params) => {
      const n = nodes.find(n => n && (/* optionally check n.meta.id === id */ true));
      if (n?.update) n.update(params);
    }
  };
}