import { create } from 'zustand';

// Visual system (Hydra) shared state
// - Ops registry with on/off + strength [0..1]
// - Global strength scaling (weak/strong)
// - Intro pixelation controller

export type OpKey =
  | 'saturate' | 'contrast' | 'brightness' | 'hue' | 'invert' | 'colorama'
  | 'posterize' | 'pixelate' | 'kaleid' | 'rotate' | 'scale' | 'scrollX' | 'scrollY'
  | 'modulate' | 'modulateHue';

export type OpCfg = { on: boolean; strength: number };
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
  // derived helpers
  strengthScale: () => number;
  // actions
  toggleOp: (key: OpKey) => void;
  setOpStrength: (key: OpKey, s: number) => void;
  setStrongMode: (v: boolean) => void;
  registerUserClick: () => void;
  skipIntro: () => void;
  recomputeIntro: (now: number, dtSec: number) => void; // recompute pxVal & possibly end intro
}

const defaultOps: OpsRegistry = {
  saturate: { on: true,  strength: 0.6 },
  contrast: { on: true,  strength: 0.85 },
  brightness: { on: true, strength: 0.5 },
  hue: { on: false, strength: 0.15 },
  invert: { on: false, strength: 0.0 },
  colorama: { on: false, strength: 0.02 },
  posterize: { on: false, strength: 0.25 },
  pixelate: { on: false, strength: 0.2 },
  kaleid: { on: false, strength: 0.4 },
  rotate: { on: false, strength: 0.15 },
  scale: { on: false, strength: 0.15 },
  scrollX: { on: false, strength: 0.05 },
  scrollY: { on: false, strength: 0.0 },
  modulate: { on: false, strength: 0.15 },
  modulateHue: { on: false, strength: 0.15 },
};

export const useVisStore = create<VisState>((set, get) => ({
  ops: defaultOps,
  strongMode: false,
  intro: { active: true, start: performance.now(), durationMs: 45_000, clickScore: 0, hardClicks: 0, pxVal: 220 },

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
}));
