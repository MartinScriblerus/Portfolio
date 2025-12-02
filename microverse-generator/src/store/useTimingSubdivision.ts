'use client';

import { create } from 'zustand';
import type { Subdivision } from '../utils/siteHelpers';

type TimingSubdivisionStore = {
  subdivision: Subdivision;
  setSubdivision: (s: Subdivision) => void;
};

export const useTimingSubdivision = create<TimingSubdivisionStore>((set) => ({
  subdivision: { unit: '1/16' }, // default straight 16ths
  setSubdivision: (s) => set({ subdivision: s }),
}));