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

// Operation types for nesting
export type HydraOperationType = 'source' | 'transform' | 'compositor';
export type HydraSourceType = 'osc' | 'noise' | 'shape' | 'gradient' | 'src';
export type HydraTransformType = 'repeat' | 'kaleid' | 'rotate' | 'scale' | 'scrollX' | 'scrollY' | 'pixelate' | 'saturate' | 'contrast' | 'brightness' | 'hue' | 'posterize' | 'invert' | 'luma' | 'colorama';
export type HydraCompositorType = 'modulate' | 'modulateHue' | 'modulateScale' | 'modulateRotate' | 'blend' | 'add' | 'mult' | 'diff' | 'layer' | 'mask';

// Operation chain node - supports nesting
export interface HydraOperationChain {
  id: string;
  type: HydraOperationType;
  operation: HydraSourceType | HydraTransformType | HydraCompositorType;
  enabled: boolean;
  params: Record<string, HydraControlParam>;
  parentId?: string; // For nesting - which operation this is nested under
  order: number; // Order in the chain (0 = first)
  innerSourceId?: string; // For compositors - ID of the inner source chain
  output?: 'o0' | 'o1' | 'o2' | 'o3'; // Which output buffer to render to (defaults to o0)
}

// Store state
export interface HydraControlsState {
  // Legacy flat structure (kept for backward compatibility)
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
  
  // New nested chain structure
  chains: HydraOperationChain[];
  
  // Legacy actions (kept for backward compatibility)
  setEffectEnabled: (effect: keyof HydraControlsState['effects'], enabled: boolean) => void;
  setParamValue: (effect: keyof HydraControlsState['effects'], param: string, value: number) => void;
  setParamMin: (effect: keyof HydraControlsState['effects'], param: string, min: number) => void;
  setParamMax: (effect: keyof HydraControlsState['effects'], param: string, max: number) => void;
  setParamMusicSource: (effect: keyof HydraControlsState['effects'], param: string, source: MusicVariableSource) => void;
  setParamMusicOperator: (effect: keyof HydraControlsState['effects'], param: string, operator: MusicOperator) => void;
  setParamMusicOperand: (effect: keyof HydraControlsState['effects'], param: string, operand: number) => void;
  getEffectValue: (effect: keyof HydraControlsState['effects'], param: string, musicData?: any) => number;
  
  // New chain actions
  addChain: (type: HydraOperationType, operation: string, params: Record<string, HydraControlParam>, parentId?: string) => string;
  removeChain: (id: string) => void;
  setChainEnabled: (id: string, enabled: boolean) => void;
  setChainParamValue: (id: string, param: string, value: number) => void;
  setChainParamMin: (id: string, param: string, min: number) => void;
  setChainParamMax: (id: string, param: string, max: number) => void;
  setChainParamMusicSource: (id: string, param: string, source: MusicVariableSource) => void;
  setChainParamMusicOperator: (id: string, param: string, operator: MusicOperator) => void;
  setChainParamMusicOperand: (id: string, param: string, operand: number) => void;
  setChainParent: (id: string, parentId: string | undefined) => void;
  setChainOrder: (id: string, order: number) => void;
  setChainInnerSource: (id: string, innerSourceId: string | undefined) => void;
  getChainValue: (id: string, param: string, musicData?: any) => number;
  getChainTree: () => HydraOperationChain[]; // Returns chains in tree order (roots first, then children)
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

// Helper to get default params for an operation
const getDefaultParams = (operation: string): Record<string, HydraControlParam> => {
  switch (operation) {
    case 'osc':
      return {
        freq: createParam(1.0, 0, 100, 0.01), // Frequency: 0-100 Hz (much wider range for more visible effects)
        sync: createParam(0.05, 0, 1, 0.01), // Sync: 0-1
        offset: createParam(0, 0, Math.PI * 2, 0.01), // Offset: 0 to 2π radians
      };
    case 'noise':
      return {
        scale: createParam(1.0, 0, 10, 0.01),
      };
    case 'shape':
      return {
        sides: createParam(3, 3, 10, 1),
        radius: createParam(0.5, 0, 1, 0.01),
      };
    case 'gradient':
      return {
        speed: createParam(1, 0, 5, 0.01), // Gradient speed
      };
    case 'voronoi':
      return {
        scale: createParam(1.0, 0, 10, 0.01), // Voronoi scale
        speed: createParam(1.0, 0, 5, 0.01), // Voronoi speed
      };
    case 'src':
      return {}; // src() takes no parameters - it references the video buffer (s0)
    case 'repeat':
      return {
        x: createParam(3, 1, 16, 1),
        y: createParam(3, 1, 16, 1),
      };
    case 'kaleid':
      return {
        sides: createParam(6, 1, 16, 1),
        segments: createParam(1, 1, 8, 1),
      };
    case 'pixelate':
      return {
        amount: createParam(50, 1, 300, 1),
      };
    case 'saturate':
      return {
        amount: createParam(0.6, 0, 2, 0.01),
      };
    case 'contrast':
      return {
        amount: createParam(0.85, 0, 2, 0.01),
      };
    case 'brightness':
      return {
        amount: createParam(0.5, 0, 2, 0.01),
      };
    case 'hue':
      return {
        amount: createParam(0, -1, 1, 0.01),
      };
    case 'posterize':
      return {
        levels: createParam(8, 2, 32, 1),
      };
    case 'invert':
      return {
        amount: createParam(0, 0, 1, 0.01),
      };
    case 'luma':
      return {
        threshold: createParam(0.5, 0, 1, 0.01),
      };
    case 'rotate':
      return {
        angle: createParam(0, 0, Math.PI * 2, 0.01), // Rotation angle in radians
        speed: createParam(0, -2, 2, 0.01), // Rotation speed
      };
    case 'scale':
      return {
        amount: createParam(1, 0.1, 3, 0.01), // Scale factor
      };
    case 'scrollX':
      return {
        amount: createParam(0, -2, 2, 0.01), // Scroll amount X
        speed: createParam(0, -2, 2, 0.01), // Scroll speed X
      };
    case 'scrollY':
      return {
        amount: createParam(0, -2, 2, 0.01), // Scroll amount Y
        speed: createParam(0, -2, 2, 0.01), // Scroll speed Y
      };
    case 'colorama':
      return {
        amount: createParam(0, 0, 1, 0.01), // Colorama intensity
      };
    case 'modulate':
    case 'modulateHue':
    case 'modulateScale':
    case 'modulateRotate':
      return {
        amount: createParam(0.15, 0, 1, 0.01),
      };
    case 'blend':
    case 'add':
    case 'mult':
    case 'diff':
    case 'layer':
      return {
        amount: createParam(0.5, 0, 1, 0.01),
      };
    case 'mask':
      return {
        amount: createParam(0.5, 0, 1, 0.01),
      };
    default:
      return {};
  }
};

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
  
  chains: [],

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
  
  // Chain actions
  addChain: (type, operation, params, parentId) => {
    const id = `chain_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const state = get();
    const maxOrder = state.chains.length > 0 
      ? Math.max(...state.chains.map(c => c.order)) 
      : -1;
    
    const defaultParams = getDefaultParams(operation);
    const finalParams = params || defaultParams;
    
    // Auto-ground sources on video node for better UX
    // If adding a source (not src itself) and no parent specified, find or create video node
    let finalParentId = parentId;
    if (type === 'source' && operation !== 'src' && !parentId) {
      // Look for existing src() node
      const videoNode = state.chains.find(c => c.type === 'source' && c.operation === 'src');
      if (videoNode) {
        finalParentId = videoNode.id;
      } else {
        // Create an implicit video node if it doesn't exist
        const videoId = `chain_video_${Date.now()}`;
        set((s) => ({
          chains: [
            ...s.chains,
            {
              id: videoId,
              type: 'source' as HydraOperationType,
              operation: 'src' as HydraSourceType,
              enabled: true, // Video node is always enabled
              params: {},
              parentId: undefined,
              order: 0, // Video node comes first
            },
          ],
        }));
        finalParentId = videoId;
      }
    }
    
    set((state) => ({
      chains: [
        ...state.chains,
        {
          id,
          type,
          operation: operation as HydraSourceType | HydraTransformType | HydraCompositorType,
          enabled: false,
          params: finalParams,
          parentId: finalParentId,
          order: maxOrder + 1,
        },
      ],
    }));
    return id;
  },
  
  removeChain: (id) =>
    set((state) => ({
      chains: state.chains.filter(c => c.id !== id && c.parentId !== id && c.innerSourceId !== id),
    })),
  
  setChainEnabled: (id, enabled) =>
    set((state) => ({
      chains: state.chains.map(c => c.id === id ? { ...c, enabled } : c),
    })),
  
  setChainParamValue: (id, param, value) =>
    set((state) => {
      const chain = state.chains.find(c => c.id === id);
      if (!chain || !chain.params[param]) return state;
      const paramConfig = chain.params[param];
      const clamped = Math.max(paramConfig.min, Math.min(paramConfig.max, value));
      return {
        chains: state.chains.map(c =>
          c.id === id
            ? {
                ...c,
                params: {
                  ...c.params,
                  [param]: { ...paramConfig, value: clamped },
                },
              }
            : c
        ),
      };
    }),
  
  setChainParamMin: (id, param, min) =>
    set((state) => {
      const chain = state.chains.find(c => c.id === id);
      if (!chain || !chain.params[param]) return state;
      const paramConfig = chain.params[param];
      return {
        chains: state.chains.map(c =>
          c.id === id
            ? {
                ...c,
                params: {
                  ...c.params,
                  [param]: { ...paramConfig, min, value: Math.max(min, paramConfig.value) },
                },
              }
            : c
        ),
      };
    }),
  
  setChainParamMax: (id, param, max) =>
    set((state) => {
      const chain = state.chains.find(c => c.id === id);
      if (!chain || !chain.params[param]) return state;
      const paramConfig = chain.params[param];
      return {
        chains: state.chains.map(c =>
          c.id === id
            ? {
                ...c,
                params: {
                  ...c.params,
                  [param]: { ...paramConfig, max, value: Math.min(max, paramConfig.value) },
                },
              }
            : c
        ),
      };
    }),
  
  setChainParamMusicSource: (id, param, source) =>
    set((state) => {
      const chain = state.chains.find(c => c.id === id);
      if (!chain || !chain.params[param]) return state;
      const paramConfig = chain.params[param];
      return {
        chains: state.chains.map(c =>
          c.id === id
            ? {
                ...c,
                params: {
                  ...c.params,
                  [param]: { ...paramConfig, musicSource: source },
                },
              }
            : c
        ),
      };
    }),
  
  setChainParamMusicOperator: (id, param, operator) =>
    set((state) => {
      const chain = state.chains.find(c => c.id === id);
      if (!chain || !chain.params[param]) return state;
      const paramConfig = chain.params[param];
      return {
        chains: state.chains.map(c =>
          c.id === id
            ? {
                ...c,
                params: {
                  ...c.params,
                  [param]: { ...paramConfig, musicOperator: operator },
                },
              }
            : c
        ),
      };
    }),
  
  setChainParamMusicOperand: (id, param, operand) =>
    set((state) => {
      const chain = state.chains.find(c => c.id === id);
      if (!chain || !chain.params[param]) return state;
      const paramConfig = chain.params[param];
      return {
        chains: state.chains.map(c =>
          c.id === id
            ? {
                ...c,
                params: {
                  ...c.params,
                  [param]: { ...paramConfig, musicOperand: operand },
                },
              }
            : c
        ),
      };
    }),
  
  setChainParent: (id, parentId) =>
    set((state) => ({
      chains: state.chains.map(c => c.id === id ? { ...c, parentId } : c),
    })),
  
  setChainOrder: (id, order) =>
    set((state) => ({
      chains: state.chains.map(c => c.id === id ? { ...c, order } : c),
    })),
  
  setChainInnerSource: (id, innerSourceId) =>
    set((state) => ({
      chains: state.chains.map(c => c.id === id ? { ...c, innerSourceId } : c),
    })),
  
  getChainValue: (id, param, musicData) => {
    const state = get();
    const chain = state.chains.find(c => c.id === id);
    if (!chain || !chain.params[param]) return 0;
    const paramConfig = chain.params[param];
    
    let baseValue = paramConfig.value;
    
    // If latched to music variable, compute the value (same logic as getEffectValue)
    if (paramConfig.musicSource !== 'none' && musicData) {
      let musicValue = 0;
      
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
    
    return Math.max(paramConfig.min, Math.min(paramConfig.max, baseValue));
  },
  
  getChainTree: () => {
    const state = get();
    const chains = [...state.chains];
    
    // Sort by order, then by parent relationship
    chains.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      // If same order, roots come first
      if (!a.parentId && b.parentId) return -1;
      if (a.parentId && !b.parentId) return 1;
      return 0;
    });
    
    return chains;
  },
}));

