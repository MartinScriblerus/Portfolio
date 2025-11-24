'use client';

import { create } from 'zustand';
import { useSignalBus } from './useSignalBus';

// Music variable sources that can be latched to
export type MusicVariableSource = 
  | 'none' 
  | 'count' 
  | 'bpm' 
  | 'onsets'
  | 'rms'
  | 'spectralCentroid'
  | 'spectralRolloff'
  | 'zcr'
  | 'mfcc0' | 'mfcc1' | 'mfcc2' | 'mfcc3' | 'mfcc4' | 'mfcc5' | 'mfcc6' | 'mfcc7' | 'mfcc8' | 'mfcc9' | 'mfcc10' | 'mfcc11' | 'mfcc12'
  | 'chroma0' | 'chroma1' | 'chroma2' | 'chroma3' | 'chroma4' | 'chroma5' | 'chroma6' | 'chroma7' | 'chroma8' | 'chroma9' | 'chroma10' | 'chroma11';

// Operator for transforming music variable values
export type MusicOperator = 'none' | 'multiply' | 'divide' | 'add' | 'subtract' | 'power' | 'sqrt' | 'log';

// Control configuration for a single parameter
export interface HydraControlParam {
  value: number;
  min: number;
  max: number;
  step?: number;
  musicSource: MusicVariableSource;
  musicOperator: MusicOperator;
  musicOperand: number; // Value to use with operator (e.g., multiply by this)
}

// Control configuration for an effect
export interface HydraEffectControl {
  enabled: boolean;
  params: Record<string, HydraControlParam>;
}

// Store state
export interface HydraControlsState {
  effects: {
    pixelate: HydraEffectControl;
    modulateHue: HydraEffectControl;
    invert: HydraEffectControl;
    kaleid: HydraEffectControl;
    repeat: HydraEffectControl;
    saturate: HydraEffectControl;
    contrast: HydraEffectControl;
    brightness: HydraEffectControl;
    hue: HydraEffectControl;
    posterize: HydraEffectControl;
    modulate: HydraEffectControl;
    luma: HydraEffectControl;
  };
  
  // Actions
  setEffectEnabled: (effect: keyof HydraControlsState['effects'], enabled: boolean) => void;
  setParamValue: (effect: keyof HydraControlsState['effects'], param: string, value: number) => void;
  setParamMin: (effect: keyof HydraControlsState['effects'], param: string, min: number) => void;
  setParamMax: (effect: keyof HydraControlsState['effects'], param: string, max: number) => void;
  setParamMusicSource: (effect: keyof HydraControlsState['effects'], param: string, source: MusicVariableSource) => void;
  setParamMusicOperator: (effect: keyof HydraControlsState['effects'], param: string, operator: MusicOperator) => void;
  setParamMusicOperand: (effect: keyof HydraControlsState['effects'], param: string, operand: number) => void;
  getEffectValue: (effect: keyof HydraControlsState['effects'], param: string, musicData?: any) => number;
}

// Helper to create default param
const createParam = (value: number, min: number, max: number, step?: number): HydraControlParam => ({
  value,
  min,
  max,
  step: step ?? (max - min) / 100,
  musicSource: 'none',
  musicOperator: 'none',
  musicOperand: 1,
});

// Helper to create default effect
const createEffect = (params: Record<string, HydraControlParam>): HydraEffectControl => ({
  enabled: false,
  params,
});

export const useHydraControlsStore = create<HydraControlsState>((set, get) => ({
  effects: {
    pixelate: createEffect({
      amount: createParam(50, 1, 300, 1), // Based on code: 2-180 typical, but can go higher
    }),
    modulateHue: createEffect({
      amount: createParam(0.1, 0, 1, 0.01), // 0-1 range
    }),
    invert: createEffect({
      amount: createParam(0, 0, 1, 0.01), // 0-1 range
    }),
    kaleid: createEffect({
      sides: createParam(6, 1, 16, 1), // 1-16 sides
      segments: createParam(1, 1, 8, 1), // 1-8 segments
    }),
    repeat: createEffect({
      x: createParam(3, 1, 16, 1), // 1-16 repeats (based on code usage)
      y: createParam(3, 1, 16, 1), // 1-16 repeats
    }),
    saturate: createEffect({
      amount: createParam(0.6, 0, 2, 0.01), // 0-2 range (code uses 0.5-1.5 typically)
    }),
    contrast: createEffect({
      amount: createParam(0.85, 0, 2, 0.01), // 0-2 range (code uses 0.5-1.5 typically)
    }),
    brightness: createEffect({
      amount: createParam(0.5, 0, 2, 0.01), // 0-2 range
    }),
    hue: createEffect({
      amount: createParam(0, -1, 1, 0.01), // -1 to 1 range
    }),
    posterize: createEffect({
      levels: createParam(8, 2, 32, 1), // 2-32 levels
    }),
    modulate: createEffect({
      amount: createParam(0.15, 0, 1, 0.01), // 0-1 range
    }),
    luma: createEffect({
      threshold: createParam(0.5, 0, 1, 0.01), // 0-1 threshold
    }),
  },

  setEffectEnabled: (effect, enabled) =>
    set((state) => ({
      effects: {
        ...state.effects,
        [effect]: { ...state.effects[effect], enabled },
      },
    })),

  setParamValue: (effect, param, value) =>
    set((state) => {
      const paramConfig = state.effects[effect].params[param];
      if (!paramConfig) return state;
      const clamped = Math.max(paramConfig.min, Math.min(paramConfig.max, value));
      console.log(`[HydraControls] setParamValue: ${effect}.${param} = ${clamped}`);
      return {
        effects: {
          ...state.effects,
          [effect]: {
            ...state.effects[effect],
            params: {
              ...state.effects[effect].params,
              [param]: { ...paramConfig, value: clamped },
            },
          },
        },
      };
    }),

  setParamMin: (effect, param, min) =>
    set((state) => {
      const paramConfig = state.effects[effect].params[param];
      if (!paramConfig) return state;
      return {
        effects: {
          ...state.effects,
          [effect]: {
            ...state.effects[effect],
            params: {
              ...state.effects[effect].params,
              [param]: { ...paramConfig, min, value: Math.max(min, paramConfig.value) },
            },
          },
        },
      };
    }),

  setParamMax: (effect, param, max) =>
    set((state) => {
      const paramConfig = state.effects[effect].params[param];
      if (!paramConfig) return state;
      return {
        effects: {
          ...state.effects,
          [effect]: {
            ...state.effects[effect],
            params: {
              ...state.effects[effect].params,
              [param]: { ...paramConfig, max, value: Math.min(max, paramConfig.value) },
            },
          },
        },
      };
    }),

  setParamMusicSource: (effect, param, source) =>
    set((state) => {
      const paramConfig = state.effects[effect].params[param];
      if (!paramConfig) return state;
      return {
        effects: {
          ...state.effects,
          [effect]: {
            ...state.effects[effect],
            params: {
              ...state.effects[effect].params,
              [param]: { ...paramConfig, musicSource: source },
            },
          },
        },
      };
    }),

  setParamMusicOperator: (effect, param, operator) =>
    set((state) => {
      const paramConfig = state.effects[effect].params[param];
      if (!paramConfig) return state;
      return {
        effects: {
          ...state.effects,
          [effect]: {
            ...state.effects[effect],
            params: {
              ...state.effects[effect].params,
              [param]: { ...paramConfig, musicOperator: operator },
            },
          },
        },
      };
    }),

  setParamMusicOperand: (effect, param, operand) =>
    set((state) => {
      const paramConfig = state.effects[effect].params[param];
      if (!paramConfig) return state;
      return {
        effects: {
          ...state.effects,
          [effect]: {
            ...state.effects[effect],
            params: {
              ...state.effects[effect].params,
              [param]: { ...paramConfig, musicOperand: operand },
            },
          },
        },
      };
    }),

  getEffectValue: (effect, param, musicData) => {
    const state = get();
    const paramConfig = state.effects[effect]?.params[param];
    if (!paramConfig) return 0;

    let baseValue = paramConfig.value;

    // If latched to music variable, compute the value
    if (paramConfig.musicSource !== 'none' && musicData) {
      let musicValue = 0;

      // Get music variable value
      switch (paramConfig.musicSource) {
        case 'count':
          musicValue = (window as any).__clickCount ?? 0;
          break;
        case 'bpm':
          musicValue = (window as any).__bpm ?? 120;
          break;
        case 'onsets':
          musicValue = useSignalBus.getState().onsetPulse ?? 0;
          break;
        case 'rms':
          musicValue = musicData.rms ?? 0;
          break;
        case 'spectralCentroid':
          musicValue = musicData.spectralCentroid ?? 0;
          break;
        case 'spectralRolloff':
          musicValue = musicData.spectralRolloff ?? 0;
          break;
        case 'zcr':
          musicValue = musicData.zcr ?? 0;
          break;
        default:
          if (paramConfig.musicSource.startsWith('mfcc')) {
            const idx = parseInt(paramConfig.musicSource.replace('mfcc', ''));
            musicValue = (musicData.mfcc?.[idx] ?? 0);
          } else if (paramConfig.musicSource.startsWith('chroma')) {
            const idx = parseInt(paramConfig.musicSource.replace('chroma', ''));
            musicValue = (musicData.chroma?.[idx] ?? 0);
          }
          break;
      }

      // Apply operator
      const op = paramConfig.musicOperator;
      const operand = paramConfig.musicOperand;

      switch (op) {
        case 'multiply':
          baseValue = musicValue * operand;
          break;
        case 'divide':
          baseValue = operand !== 0 ? musicValue / operand : baseValue;
          break;
        case 'add':
          baseValue = musicValue + operand;
          break;
        case 'subtract':
          baseValue = musicValue - operand;
          break;
        case 'power':
          baseValue = Math.pow(musicValue, operand);
          break;
        case 'sqrt':
          baseValue = Math.sqrt(Math.max(0, musicValue));
          break;
        case 'log':
          baseValue = Math.log(Math.max(0.001, musicValue));
          break;
        case 'none':
        default:
          baseValue = musicValue;
          break;
      }
    }

    // Clamp to param range
    return Math.max(paramConfig.min, Math.min(paramConfig.max, baseValue));
  },
}));

