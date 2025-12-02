// src/store/useTransportStore.ts
'use client';

import { create } from 'zustand';
import { TransportState, TimeSignature } from '../interfaces/audioInterfaces';

type TransportActions = {
  setBpm: (bpm: number) => void;
  setTimeSig: (sig: TimeSignature) => void;
  setStepsPerBeat: (spb: number) => void;
  setPlaying: (is: boolean, startedAt?: number) => void;
};

type TransportStore = TransportState & TransportActions;

export const useTransportStore = create<TransportStore>((set, get) => ({
  bpm: 120,
  timeSig: { num: 4, den: 4 },
  ppqn: 96,
  stepsPerBeat: 4, // 16ths
  startedAt: 0,
  isPlaying: false,

  setBpm: (bpm) => set({ bpm: Math.max(1, Math.min(999, bpm)) }),
  setTimeSig: (sig) => {
    const num = Math.max(1, Math.min(32, sig.num | 0));
    const den = [1, 2, 4, 8, 16, 32].includes(sig.den) ? sig.den : 4;
    set({ timeSig: { num, den } });
  },
  setStepsPerBeat: (spb) => set({ stepsPerBeat: Math.max(1, Math.min(32, spb | 0)) }),
  setPlaying: (is, startedAt) => set({ isPlaying: is, startedAt: startedAt ?? get().startedAt }),
}));