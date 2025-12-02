// useDebouncedCallback.ts
import { useRef, useEffect, useCallback } from 'react';

export function useDebouncedCallback<T extends any[]>(
  fn: (...args: T) => void,
  delayMs: number
) {
  const fnRef = useRef(fn);
  const timerRef = useRef<number | null>(null);
  useEffect(() => { fnRef.current = fn; }, [fn]);

  return useCallback((...args: T) => {
    if (timerRef.current != null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => {
      fnRef.current(...args);
      timerRef.current = null;
    }, delayMs);
  }, [delayMs]);
}