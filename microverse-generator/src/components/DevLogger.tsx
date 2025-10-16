'use client';

import { useEffect } from 'react';
import { useAskStore } from '../store/useAskStore';
import { useIntentDebugStore } from '../store/useIntentDebugStore';

export default function DevLogger() {
  const textResults = useAskStore(s => s.textResults);
  const lastIntent = useIntentDebugStore(s => s.last);

  useEffect(() => {
    if (!textResults) return;
    console.log('[dev] Ask results updated:', { count: textResults.length, sample: textResults.slice(0, 2) });
  }, [textResults]);

  useEffect(() => {
    if (!lastIntent) return;
    console.log('[dev] Intent updated:', lastIntent);
  }, [lastIntent]);

  return null;
}
