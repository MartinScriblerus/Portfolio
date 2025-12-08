/**
 * Type definitions for DSP RAG (Retrieval-Augmented Generation) system
 * Used for ChucK and Hydra code examples stored in the dsp_docs table
 */

export type Language = 'chuck' | 'hydra' | 'other';

export interface DSPDoc {
  id?: string;
  title?: string;
  example_usage?: string | string[]; // Fragmentary logs/descriptions - not actual code
  content?: string; // Actual ChucK code - use this for code generation
  perceptual_tags?: string[];
  technical_tags?: string[];
  language?: Language;
  embedding?: number[];
  // Additional metadata fields that might exist
  description?: string;
  category?: string;
  params?: {
    ugens?: string[]; // UGen names - useful for search but not for code display
  };
  created_at?: string;
  updated_at?: string;
}
