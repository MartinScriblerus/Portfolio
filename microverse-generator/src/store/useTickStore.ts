"use client";

import { useBeatGridStore } from './useBeatGridStore';

// Backwards-compatible wrapper for tick state now stored in useBeatGridStore
export const useTickStore = (selector?: any) => (useBeatGridStore as any)(selector);

// Usage: const time = useTickStore(s => s.time);