"use client";

import { create } from 'zustand';
// UI presents exactly two options per category; keep cycling logic in sync

type Category = 'isomorphic' | 'tonnetz';

type LayoutState = {
  category: Category;
  layoutIndex: number; // index within filtered list by category
  setCategory: (c: Category) => void;
  setLayoutIndex: (i: number) => void;
  cycleLayout: (dir: 1 | -1) => void;
};

export const useLayoutStore = create<LayoutState>((set, get) => ({
  category: 'isomorphic',
  layoutIndex: 0,
  setCategory: (c) => set({ category: c, layoutIndex: 0 }),
  setLayoutIndex: (i) => set({ layoutIndex: Math.max(0, i) }),
  cycleLayout: (dir) => {
    const { category, layoutIndex } = get();
    const count = category === 'tonnetz' ? 2 : 2; // two options for each category
    const next = (layoutIndex + dir + count) % count;
    set({ layoutIndex: next });
  },
}));
