'use client';

import { create } from 'zustand';

export type QuerySource = 'guide' | 'ask-panel' | 'other';

type QueryState = {
  query: string;
  submitVersion: number;
  inFlight: boolean;
  lastSource?: QuerySource;
  setQuery: (q: string) => void;
  submit: (source?: QuerySource) => void;
  setInFlight: (v: boolean) => void;
};

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
const DEBOUNCE_MS = 350;

export const useQueryStore = create<QueryState>((set) => ({
  query: '',
  submitVersion: 0,
  inFlight: false,
  lastSource: undefined,
  setQuery: (q) => set({ query: q }),
  submit: (source) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      set((s) => ({ submitVersion: s.submitVersion + 1, lastSource: source }));
    }, DEBOUNCE_MS);
  },
  setInFlight: (v) => set({ inFlight: v }),
}));
