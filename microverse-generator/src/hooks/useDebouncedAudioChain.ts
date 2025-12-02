// useDebouncedAudioChain.ts
import { useEffect, useRef, useCallback } from 'react';
import { buildAudioGraph, EffectConfig, AudioGraph } from '../utils/audioGraph';
import { useDebouncedCallback } from './useDebouncedCallback';

export function useDebouncedAudioChain(
  ctx: AudioContext | null,
  chain: readonly EffectConfig[],
  destination: AudioNode | null,
  delayMs = 80
) {
  const graphRef = useRef<AudioGraph | null>(null);

  const rebuild = useCallback(() => {
    if (!ctx || !destination) return;
    graphRef.current?.dispose();
    graphRef.current = buildAudioGraph(ctx, chain, destination);
  }, [ctx, chain, destination]);

  const debouncedRebuild = useDebouncedCallback(rebuild, delayMs);

  useEffect(() => {
    debouncedRebuild();
  }, [debouncedRebuild]);

  useEffect(() => {
    return () => {
      graphRef.current?.dispose();
      graphRef.current = null;
    };
  }, []);

  return {
    updateEffectParams: (id: string, params: Record<string, any>) =>
      graphRef.current?.updateParams(id, params)
  };
}