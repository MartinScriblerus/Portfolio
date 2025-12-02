'use client';

import { create } from 'zustand';

type KeyboardState = {
  // Traditional keyboard settings (for beat grid note builder)
  key: string;
  scale: string;
  chordValue: string;
  chordLabel: string;
  
  // Octave ranges (shared with microtonal)
  octaveMax: number;
  octaveMin: number;
  
  // Actions
  setKey: (key: string) => void;
  setScale: (scale: string) => void;
  setChord: (value: string, label: string) => void;
  setOctaveRange: (min: number, max: number) => void;
  updateKeyScaleChord: (key: string, scale: string, chordValue: string, chordLabel: string, octaveMax: number, octaveMin: number) => void;
};

export const useKeyboardStore = create<KeyboardState>((set) => ({
  // Defaults
  key: 'C',
  scale: 'Diatonic',
  chordValue: 'M',
  chordLabel: 'Major Triad',
  octaveMax: 4,
  octaveMin: 1,
  
  // Actions
  setKey: (key) => set({ key }),
  setScale: (scale) => set({ scale }),
  setChord: (value, label) => set({ chordValue: value, chordLabel: label }),
  setOctaveRange: (min, max) => set({ octaveMin: min, octaveMax: max }),
  updateKeyScaleChord: (key, scale, chordValue, chordLabel, octaveMax, octaveMin) => {
    set({
      key,
      scale,
      chordValue,
      chordLabel,
      octaveMax: Number(octaveMax) || 4,
      octaveMin: Number(octaveMin) || 1,
    });
  },
}));

