'use client';

import { create } from 'zustand';

export type GuideMetrics = {
  // cryptic labels: echo (recent similarity), tension (contradiction strength), drift (history breadth), cache?: 'hit'|'miss'
  echo: number;        // 0..1, how similar current query is to recent memory
  tension: number;     // 0..1, contradiction intensity
  drift: number;       // 0..1, dispersion of themes in history
  cache?: 'hit' | 'miss';
};

type GuideMetricsState = {
  metrics: GuideMetrics | null;
  setMetrics: (m: GuideMetrics | null) => void;
};

export const useGuideMetricsStore = create<GuideMetricsState>((set) => ({
  metrics: null,
  setMetrics: (m) => set({ metrics: m }),
}));
