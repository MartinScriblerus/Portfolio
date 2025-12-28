'use client';

import { useBeatGridStore } from './useBeatGridStore';

// Backwards-compatible wrapper for subdivision state now stored in useBeatGridStore
export const useTimingSubdivision = (selector?: any) => (useBeatGridStore as any)(selector);