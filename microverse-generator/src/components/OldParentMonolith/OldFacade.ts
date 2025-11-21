// Minimal facade for light integration between Old-* components
// Keep types and helpers tiny and behavior-neutral.

export type SourceName = 'osc1' | 'stk1' | 'sampler' | 'audioin';

export type Chain = {
  osc1: string[];
  stk1: string[];
  sampler: string[];
  audioin: string[];
};

export type EffectPreset = {
  name: string;
  label?: string;
  type?: string;
  value?: any;
};

// Helper to pick the chain for current source name
export function getChainForSource(chain: Chain, sourceName: SourceName): string[] {
  switch (sourceName) {
    case 'osc1':
      return chain.osc1;
    case 'stk1':
      return chain.stk1;
    case 'sampler':
      return chain.sampler;
    case 'audioin':
      return chain.audioin;
    default:
      return [];
  }
}

// Re-export utility used widely to avoid deep import paths in multiple files
export { getConvertedRadio } from '../../utils/utils';
