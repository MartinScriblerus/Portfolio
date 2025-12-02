'use client';

import { create } from 'zustand';

export type MicrotoneOption = {
  value: string;
  name: string;
  label: string;
  description?: string;
};

type MicrotonalState = {
  selected: MicrotoneOption | null;
  stepsPerOctave: number; // EDO
  cents: number[] | null; // custom tuning intervals per octave (optional)
  baseMidi: number; // reference for octave naming (default C4 = 60)
  useSharps: boolean; // true => sharps, false => flats
  showFraction: boolean; // show n/N under the main label
  setScale: (opt: MicrotoneOption) => void;
  setEdo: (n: number) => void;
  setCents: (arr: number[] | null) => void;
  setBaseMidi: (m: number) => void;
  toggleSharps: () => void;
  toggleShowFraction: () => void;
};

export const useMicrotonalStore = create<MicrotonalState>((set, get) => ({
  selected: null,
  stepsPerOctave: 12,
  cents: null,
  baseMidi: 60,
  useSharps: true,
  showFraction: true,
  setScale: (opt) => {
    // Try to infer EDO from name if it looks like "19-EDO" or "19 EDO"
    const m = /(^|\D)(\d{1,3})\s*-?\s*EDO/i.exec(opt.name || opt.value || '');
    const current = get().stepsPerOctave;
    const inferred = m ? Math.max(2, Math.min(96, parseInt(m[2], 10))) : current;
    set({ selected: opt, stepsPerOctave: inferred });
  },
  setEdo: (n) => set({ stepsPerOctave: Math.max(2, Math.min(96, Math.floor(n))) }),
  setCents: (arr) => set({ cents: arr }),
  setBaseMidi: (m) => set({ baseMidi: Math.floor(m) }),
  toggleSharps: () => set(s => ({ useSharps: !s.useSharps })),
  toggleShowFraction: () => set(s => ({ showFraction: !s.showFraction })),
}));
