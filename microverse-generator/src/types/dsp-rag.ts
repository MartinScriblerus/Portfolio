/**
 * MCP Schema for DSP RAG Vector Store
 * Single source of truth for all documents/patches/examples ingested into Supabase
 */

export type DocType = 'code' | 'doc' | 'ir' | 'audio' | 'patch' | 'paper';
export type Language = 'chuck' | 'faust' | 'pd' | 'max' | 'js' | 'glsl' | 'text';
export type Tool = 'webchuck' | 'faust' | 'meyda' | 'librosa' | 'hydra' | 'mingus' | 'tunejs';
export type License = 'cc-by' | 'cc0' | 'public-domain' | 'gpl' | 'mit' | 'proprietary';

export interface DSPDoc {
  id: string; // UUID
  title: string;
  type: DocType;
  language: Language;
  tool: Tool;
  content: string; // raw text or code
  tokens_est?: number;
  chunk_of?: string | null; // UUID of parent doc if chunked
  chunk_index?: number;
  chunk_total?: number;
  perceptual_tags: string[]; // e.g., ["bright", "metallic", "sustain"]
  technical_tags: string[]; // e.g., ["comb-filter", "fft", "grain-delay"]
  params?: {
    ugens?: string[]; // e.g., ["SndBuf", "Granulator", "LPF"]
    typical_ranges?: Record<string, [number, number]>; // e.g., {"grain_ms": [10, 200]}
  };
  example_usage?: string | string[]; // Can be string (legacy) or array of strings. Defaults to [] if null/undefined.
  license: License;
  source_url?: string;
  created_at: string; // ISO timestamp
  
  // Embeddings (384-dim to match existing setup)
  embed_semantic?: number[]; // for text/semantic search
  embed_code?: number[]; // for code structure search (optional, can use semantic initially)
  
  // Optional numeric audio features for IRs or sample metadata
  mfcc_mean?: number[];
  spectral_centroid?: number;
  spectral_flux?: number;
  loudness?: number;
}

export interface BlockSketch {
  blocks: Array<{
    id: string;
    type: string;
    notes?: string;
    params: Record<string, any>;
  }>;
  connect: Array<[string, string]>; // [from_id, to_id]
}

export interface GoalDescriptor {
  perceptual_tags: string[];
  technical_targets: Record<string, any>; // parameter ranges or feature targets
  time_scale?: string; // e.g., "short", "medium", "long"
  dynamic_range?: string; // e.g., "narrow", "wide"
}

export type IntentType = 
  | 'CREATE_SOUND'
  | 'MODIFY_SOUND'
  | 'EXPLAIN_CONCEPT'
  | 'TRANSLATE_CODE'
  | 'SUGGEST_PARAMS'
  | 'VISUALIZE'
  | 'RETRIEVE_EXAMPLE';

export interface IntentClassification {
  intent: IntentType;
  confidence: number;
  structured_goal?: GoalDescriptor;
  target_language?: Language;
  user_text: string;
}

export interface CodegenResult {
  code: string;
  language: Language;
  explanation: string;
  tweak_sliders?: Array<{
    param: string;
    range: [number, number];
    default: number;
    description: string;
  }>;
}

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  features?: {
    spectralCentroid: number;
    spectralFlux: number;
    rms: number;
  };
  recommendations?: Array<{
    param: string;
    change: 'increase' | 'decrease' | 'set';
    value?: number;
    reason: string;
  }>;
}

export interface PatchGenerationResult {
  intent: IntentType;
  block_sketch: BlockSketch;
  code: CodegenResult;
  validation: ValidationResult;
  retrieved_docs: Array<DSPDoc & { similarity: number }>;
  explanation: string; // mapping: user phrase → features → DSP choices
}


