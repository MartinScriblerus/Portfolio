"use client";

import { useBeatGridStore } from '../store/useBeatGridStore';

// Backwards-compatible wrapper for the consolidated timing state.
export const useTimingStore = (selector?: any) => (useBeatGridStore as any)(selector);

// Usage remains: const bpm = useTimingStore(s => s.bpm);