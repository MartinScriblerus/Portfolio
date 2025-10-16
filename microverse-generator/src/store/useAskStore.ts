'use client';

import { create } from 'zustand';
import type { MatchRow } from '../rag/querySupabase';

type AskState = {
  textResults: MatchRow[];
  setTextResults: (rows: MatchRow[]) => void;
};

export const useAskStore = create<AskState>((set) => ({
  textResults: [],
  setTextResults: (rows) => set({ textResults: rows || [] }),
}));
