import { create } from 'zustand';

interface TickState {
  time: number;
  delta: number;
  setTick: (time: number, delta: number) => void;
}

export const useTickStore = create<TickState>((set: any) => ({
  time: 0,
  delta: 0,
  setTick: (time: any, delta: any) => set({ time, delta }),
}));