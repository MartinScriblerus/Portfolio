import { useMemo } from 'react';

// Minimal shape for a knob entry passed to Babylon: [label, preset]
export type KnobEntry = [string, any];

export type UseKnobModelParams = {
  mode: 'synth' | 'effects';
  fxRadioValue: string; // e.g., 'osc1', 'stk', 'sampler', 'audioin'
  moogGrandmotherEffectsRef: React.MutableRefObject<any>;
  universalSourcesRef: React.MutableRefObject<any>;
  currentEffectTypeRef?: React.MutableRefObject<string>;
  selectedEffects?: Array<{ VarName?: string; Type?: string; On?: boolean }>;
};

export function useKnobModel(params: UseKnobModelParams) {
  const {
    mode,
    fxRadioValue,
    moogGrandmotherEffectsRef,
    universalSourcesRef,
    currentEffectTypeRef,
    selectedEffects = [],
  } = params;

  const { visibleKnobs, count } = useMemo(() => {
    // Default: synth view uses Moog Grandmother default knobs
    if (mode === 'synth') {
      const mgm = moogGrandmotherEffectsRef.current || {};
      const arr: KnobEntry[] = Object.values(mgm).map((i: any) => [i.label, i]);
      return { visibleKnobs: arr, count: arr.length };
    }

    // Effects view: derive from current source effects
    const sources = universalSourcesRef.current || {};
    const source = sources?.[fxRadioValue];
    const effects = source?.effects || {};

    // If a current effect type is set, show its presets
    const effectType = currentEffectTypeRef?.current;
    if (effectType && effects[effectType] && effects[effectType].presets) {
      const presets = effects[effectType].presets;
      const arr: KnobEntry[] = Object.entries(presets).map(([name, preset]) => [name, preset]);
      return { visibleKnobs: arr, count: arr.length };
    }

    // Fallback: aggregate presets from selected or ON effects
    const active = selectedEffects.length > 0
      ? selectedEffects
      : Object.values(effects).filter((e: any) => e.On);

    const collected: KnobEntry[] = [];
    active.forEach((e: any) => {
      const presets = e.presets || {};
      Object.entries(presets).forEach(([name, preset]) => {
        collected.push([name, preset]);
      });
    });

    return { visibleKnobs: collected, count: collected.length };
  }, [mode, fxRadioValue, moogGrandmotherEffectsRef.current, universalSourcesRef.current, currentEffectTypeRef?.current, selectedEffects]);

  return { visibleKnobs, count } as const;
}
