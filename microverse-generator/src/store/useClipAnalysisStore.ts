"use client";
import { create } from 'zustand';

export type ClipAnalysis = {
  filename: string;
  features: any; // Partial<MeydaFeaturesObject> but kept as any to avoid tight coupling
  ts: number;    // timestamp when saved
};

interface ClipAnalysisState {
  byFile: Record<string, ClipAnalysis>;
  lastKey: string | null;
  setAnalysis: (filename: string, features: any) => void;
  clear: (filename?: string) => void;
}

export const useClipAnalysisStore = create<ClipAnalysisState>((set, get) => ({
  byFile: {},
  lastKey: null,
  setAnalysis: (filename, features) => {
    const entry: ClipAnalysis = { filename, features, ts: Date.now() };
    set((s) => ({ byFile: { ...s.byFile, [filename]: entry }, lastKey: filename }));
  },
  clear: (filename) => {
    if (!filename) {
      set({ byFile: {}, lastKey: null });
      return;
    }
    const next = { ...get().byFile };
    delete next[filename];
    const lastKey = get().lastKey === filename ? null : get().lastKey;
    set({ byFile: next, lastKey });
  },
}));
