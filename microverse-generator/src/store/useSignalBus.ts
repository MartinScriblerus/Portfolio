'use client';

import { create } from 'zustand';

export type GuideMetrics = {
  echo: number;
  tension: number;
  drift: number;
  cache?: 'hit' | 'miss';
};

export type RGBState = { r: number; g: number; b: number; energy: number };

type SignalBusState = {
  metrics: GuideMetrics | null;
  rgb: RGBState;
  impact: number; // hydra impact 0..1
  pulse: number;  // background pulse 0..1
  setMetrics: (m: GuideMetrics | null) => void;
  setRGB: (c: RGBState) => void;
  setImpactPulse: (v: { impact?: number; pulse?: number }) => void;
};

export const useSignalBus = create<SignalBusState>((set) => ({
  metrics: null,
  rgb: { r: 0, g: 0, b: 0, energy: 0 },
  impact: 0,
  pulse: 0,
  setMetrics: (m) => set({ metrics: m }),
  setRGB: (c) => set({ rgb: c }),
  setImpactPulse: ({ impact, pulse }) => set((s) => ({ impact: impact ?? s.impact, pulse: pulse ?? s.pulse })),
}));
