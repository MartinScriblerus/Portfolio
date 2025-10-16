import { create } from 'zustand';

// Visual system (Hydra) shared state
// - Ops registry with on/off + strength [0..1]
// - Global strength scaling (weak/strong)
// - Intro pixelation controller

// Allow flexible op names while we iterate on the palette
export type OpKey = string;

// Keep core fields and allow extra params for richer ops (serializable only)
export type OpCfg = { on: boolean; strength: number; [key: string]: any };
export type OpsRegistry = Record<OpKey, OpCfg>;

export interface IntroState {
  active: boolean;
  start: number;      // ms since perf.now captured at activation
  durationMs: number; // full length if no clicks accelerate
  clickScore: number; // decays over time
  hardClicks: number; // total clicks
  pxVal: number;      // computed pixel size (if active)
}

export interface VisState {
  ops: OpsRegistry;
  strongMode: boolean;
  intro: IntroState;
  targetColorBias?: { r: number; g: number; b: number } | null;
  colorBiasWeight: number; // 0..1 mix of targetColorBias into base color
  // derived helpers
  strengthScale: () => number;
  // actions
  toggleOp: (key: OpKey) => void;
  setOpStrength: (key: OpKey, s: number) => void;
  setStrongMode: (v: boolean) => void;
  registerUserClick: () => void;
  skipIntro: () => void;
  recomputeIntro: (now: number, dtSec: number) => void; // recompute pxVal & possibly end intro
  mergeOps: (partial: Partial<Record<OpKey, OpCfg>>) => void;
  setTargetColorBias: (bias: { r: number; g: number; b: number } | null) => void;
  setColorBiasWeight: (w: number) => void;
}

const defaultOps: OpsRegistry = {
  // Core set (safe defaults)
  saturate:  { on: true,  strength: 0.6 },
  contrast:  { on: true,  strength: 0.85 },
  brightness:{ on: true,  strength: 0.5 },
  hue:       { on: false, strength: 0.15 },
  invert:    { on: false, strength: 0.0 },
  colorama:  { on: false, strength: 0.02 },
  posterize: { on: false, strength: 0.25 },
  pixelate:  { on: false, strength: 0.2 },
  kaleid:    { on: false, strength: 0.4 },
  rotate:    { on: false, strength: 0.15 },
  scale:     { on: false, strength: 0.15 },
  scrollX:   { on: false, strength: 0.05 },
  scrollY:   { on: false, strength: 0.0 },
  modulate:  { on: false, strength: 0.15 },
  modulateHue:{ on: false, strength: 0.15 },

  // New experimental ops (serializable descriptors; renderer may ignore until supported)
  luma:            { on: false, strength: 0.15 },
  modulateScale:   { on: false, strength: 0.15 },
  modulateRepeatX: { on: false, strength: 0.15, params: { repsBase: 3, offsetBase: 0.2 } },
  modulateRepeatY: { on: false, strength: 0.15, params: { repsBase: 3, offsetBase: 0.2 } },
  repeat:          { on: false, strength: 0.15, params: { x: 3, y: 3 } },
  tapO1:           { on: false, strength: 0.0 },
  tapO2:           { on: false, strength: 0.0 },
  // Placeholder entries (ignored by renderer for now; kept for future mapping)
  mask:            { on: false, strength: 0.15 },
  modulateKaleid:  { on: false, strength: 0.15 },
  voronoi:         { on: false, strength: 0.15 },
  mult:            { on: false, strength: 0.15 },
  add:             { on: false, strength: 0.15 },
  sub:             { on: false, strength: 0.15 },
  offset:          { on: false, strength: 0.15 },
  layer:           { on: false, strength: 0.15 },
};

export const useVisStore = create<VisState>((set, get) => ({
  ops: defaultOps,
  strongMode: false,
  intro: { active: true, start: performance.now(), durationMs: 45_000, clickScore: 0, hardClicks: 0, pxVal: 220 },
  targetColorBias: null,
  colorBiasWeight: 0.25,

  strengthScale: () => (get().strongMode ? 0.8 : 0.08),

  toggleOp: (key) => set((s) => ({ ops: { ...s.ops, [key]: { ...s.ops[key], on: !s.ops[key].on } } })),
  setOpStrength: (key, strength) => set((s) => ({ ops: { ...s.ops, [key]: { ...s.ops[key], strength: Math.max(0, Math.min(1, strength)) } } })),
  setStrongMode: (v) => set({ strongMode: !!v }),
  registerUserClick: () => set((s) => ({ intro: { ...s.intro, hardClicks: s.intro.hardClicks + 1, clickScore: Math.min(50, s.intro.clickScore + 1.0) } })),
  skipIntro: () => set((s) => ({ intro: { ...s.intro, active: false } })),
  recomputeIntro: (now, dtSec) => {
    const s = get();
    if (!s.intro.active) return;
    const clickScore = Math.max(0, s.intro.clickScore - dtSec * 0.6);
    const t01 = Math.min(1, Math.max(0, (now - s.intro.start) / s.intro.durationMs));
    const basePx = 220 - t01 * (220 - 16);
    const pxVal = Math.max(1, Math.floor(basePx * Math.exp(-0.28 * clickScore)));
    const done = (s.intro.hardClicks >= 12 && clickScore >= 7) || t01 >= 1 || pxVal <= 2;
    set({ intro: { ...s.intro, clickScore, pxVal, active: done ? false : s.intro.active } });
  },
  mergeOps: (partial) => set((s) => {
    const next: OpsRegistry = { ...s.ops } as OpsRegistry;
    for (const key in partial) {
      const k = key as OpKey;
      const cur = next[k] ?? { on: false, strength: 0 };
      const inc = partial[k]!;
      next[k] = { on: inc.on ?? cur.on, strength: typeof inc.strength === 'number' ? Math.max(0, Math.min(1, inc.strength)) : cur.strength };
    }
    return { ops: next };
  }),
  setTargetColorBias: (bias) => set({ targetColorBias: bias }),
  setColorBiasWeight: (w) => set({ colorBiasWeight: Math.max(0, Math.min(1, Number(w) || 0)) }),
}));
