// timingStore.ts
import {create} from 'zustand';
export const useTimingStore = create(set => ({
  bpm: 120,
  setBpm: (bpm: number) => set({ bpm }),
  beatMs: 500,
  setBeatMs: (beatMs: number) => set({ beatMs }),
}));
// In any file:
// import { useTimingStore } from './timingStore';
// const bpm = useTimingStore(s => s.bpm);