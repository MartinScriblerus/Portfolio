'use client';

import { create } from 'zustand';

export interface IntentDebugRecord {
  at: number; // performance.now timestamp
  query: string;
  visual?: {
    ops?: Record<string, { on: boolean; strength: number }>;
    targetColor?: { r: number; g: number; b: number } | null;
  };
  audio?: Record<string, any> | null;
  sources?: Array<{ work?: string; author?: string; topic?: string; similarity?: number }>;
  stats?: { topSim?: number; meanTop5?: number; median?: number; thresholdUsed?: number; filteredCount?: number; count?: number; cacheHit?: boolean } | null;
}

interface IntentDebugState {
  last?: IntentDebugRecord;
  history: IntentDebugRecord[]; // capped
  setLast: (rec: IntentDebugRecord) => void;
  clear: () => void;
}

export const useIntentDebugStore = create<IntentDebugState>((set, get) => ({
  last: undefined,
  history: [],
  setLast: (rec) => set(() => {
    const hist = [rec, ...get().history];
    // cap history to avoid unbounded growth
    if (hist.length > 25) hist.length = 25;
    return { last: rec, history: hist };
  }),
  clear: () => set({ history: [], last: undefined }),
}));
