/**
 * RAG Chunking Strategy for DSP & Code
 * Optimized for context-aware retrieval, preserving code integrity, 
 * and surfacing parameter ranges and perceptual descriptors
 */

import { DSPDoc } from '@/types/dsp-rag';

export interface ChunkingOptions {
  maxTokens?: number; // max tokens per chunk (default 800-1200)
  overlapPercent?: number; // overlap between chunks (default 10-20%)
  preserveCodeBlocks?: boolean; // keep code blocks intact
}

const DEFAULT_OPTIONS: Required<ChunkingOptions> = {
  maxTokens: 1000,
  overlapPercent: 15,
  preserveCodeBlocks: true
};

/**
 * Estimate token count (rough approximation: ~4 chars per token)
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Split text at logical boundaries (sentence, paragraph, code block)
 */
function splitAtBoundaries(text: string): string[] {
  const boundaries: string[] = [];
  
  // Split by code blocks first (preserve them)
  const codeBlockRegex = /```[\s\S]*?```/g;
  const codeBlocks: string[] = [];
  let lastIndex = 0;
  let match;
  
  while ((match = codeBlockRegex.exec(text)) !== null) {
    // Add text before code block
    if (match.index > lastIndex) {
      boundaries.push(text.slice(lastIndex, match.index));
    }
    // Add code block as a single boundary
    boundaries.push(match[0]);
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    boundaries.push(text.slice(lastIndex));
  }
  
  // Further split non-code boundaries by paragraphs
  const splitBoundaries: string[] = [];
  for (const boundary of boundaries) {
    if (boundary.startsWith('```')) {
      splitBoundaries.push(boundary); // keep code blocks intact
    } else {
      // Split by double newlines (paragraphs)
      const paragraphs = boundary.split(/\n\n+/);
      splitBoundaries.push(...paragraphs);
    }
  }
  
  return splitBoundaries;
}

/**
 * Chunk a document into smaller pieces for RAG
 */
export function chunkDocument(
  doc: DSPDoc,
  options: ChunkingOptions = {}
): DSPDoc[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: DSPDoc[] = [];
  
  const content = doc.content;
  const totalTokens = estimateTokens(content);
  
  // If content fits in one chunk, return as-is
  if (totalTokens <= opts.maxTokens) {
    return [doc];
  }
  
  // Split into logical boundaries
  const boundaries = splitAtBoundaries(content);
  
  let currentChunk = '';
  let currentTokens = 0;
  let chunkIndex = 0;
  
  for (let i = 0; i < boundaries.length; i++) {
    const boundary = boundaries[i];
    const boundaryTokens = estimateTokens(boundary);
    
    // If a single boundary exceeds maxTokens, force it into its own chunk
    if (boundaryTokens > opts.maxTokens) {
      // Save current chunk if it exists
      if (currentChunk.trim()) {
        chunks.push(createChunkDoc(doc, currentChunk, chunkIndex, chunks.length + 1));
        chunkIndex++;
        currentChunk = '';
        currentTokens = 0;
      }
      
      // Split the oversized boundary (by sentences if possible)
      const sentences = boundary.split(/(?<=[.!?])\s+/);
      let sentenceChunk = '';
      let sentenceTokens = 0;
      
      for (const sentence of sentences) {
        const sentenceTokenCount = estimateTokens(sentence);
        
        if (sentenceTokens + sentenceTokenCount > opts.maxTokens && sentenceChunk.trim()) {
          chunks.push(createChunkDoc(doc, sentenceChunk, chunkIndex, chunks.length + 1));
          chunkIndex++;
          sentenceChunk = '';
          sentenceTokens = 0;
        }
        
        sentenceChunk += sentence + ' ';
        sentenceTokens += sentenceTokenCount;
      }
      
      if (sentenceChunk.trim()) {
        chunks.push(createChunkDoc(doc, sentenceChunk, chunkIndex, chunks.length + 1));
        chunkIndex++;
      }
      
      continue;
    }
    
    // Check if adding this boundary would exceed maxTokens
    if (currentTokens + boundaryTokens > opts.maxTokens && currentChunk.trim()) {
      // Save current chunk
      chunks.push(createChunkDoc(doc, currentChunk, chunkIndex, chunks.length + 1));
      chunkIndex++;
      
      // Start new chunk with overlap if enabled
      if (opts.overlapPercent > 0) {
        // Include last portion of previous chunk (overlap)
        const overlapSize = Math.floor(opts.maxTokens * (opts.overlapPercent / 100));
        const sentences = currentChunk.split(/(?<=[.!?])\s+/);
        let overlapText = '';
        let overlapTokens = 0;
        
        // Take last sentences that fit in overlap
        for (let j = sentences.length - 1; j >= 0; j--) {
          const sentence = sentences[j];
          const sentenceTokens = estimateTokens(sentence);
          
          if (overlapTokens + sentenceTokens <= overlapSize) {
            overlapText = sentence + ' ' + overlapText;
            overlapTokens += sentenceTokens;
          } else {
            break;
          }
        }
        
        currentChunk = overlapText;
        currentTokens = overlapTokens;
      } else {
        currentChunk = '';
        currentTokens = 0;
      }
    }
    
    currentChunk += boundary + '\n\n';
    currentTokens += boundaryTokens;
  }
  
  // Add final chunk
  if (currentChunk.trim()) {
    chunks.push(createChunkDoc(doc, currentChunk, chunkIndex, chunks.length + 1));
  }
  
  // Update chunk_total for all chunks
  const totalChunks = chunks.length;
  chunks.forEach(chunk => {
    if (chunk.chunk_total !== undefined) {
      chunk.chunk_total = totalChunks;
    }
  });
  
  return chunks;
}

/**
 * Create a chunk document from parent doc
 */
function createChunkDoc(
  parent: DSPDoc,
  content: string,
  chunkIndex: number,
  estimatedTotal: number
): DSPDoc {
  return {
    ...parent,
    id: `${parent.id}-chunk-${chunkIndex}`,
    content: content.trim(),
    chunk_of: parent.id,
    chunk_index: chunkIndex,
    chunk_total: estimatedTotal,
    tokens_est: estimateTokens(content),
    title: `${parent.title} (Part ${chunkIndex + 1})`
  };
}

/**
 * Extract metadata from code (UGens, parameters, etc.)
 */
export function extractCodeMetadata(code: string): {
  ugens: string[];
  params: Record<string, any>;
} {
  const ugens: Set<string> = new Set();
  const params: Record<string, any> = {};
  
  // Common ChucK UGens
  const ugenPattern = /\b(SinOsc|SawOsc|SndBuf|Granulator|LPF|HPF|BPF|Comb|DelayA|DelayP|JCRev|ADSR|Gain|Noise|Impulse|WvIn|WvOut|OscIn|OscOut|STK.*)\b/g;
  
  let match;
  while ((match = ugenPattern.exec(code)) !== null) {
    ugens.add(match[1]);
  }
  
  // Extract parameter assignments (basic heuristic)
  // Look for patterns like: 440 => osc.freq;
  const paramPattern = /(\w+)\s*=>\s*(\w+)\.(\w+)/g;
  const paramMap: Record<string, any> = {};
  
  while ((match = paramPattern.exec(code)) !== null) {
    const [, value, ugen, param] = match;
    const key = `${ugen}.${param}`;
    
    // Try to parse numeric values
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      paramMap[key] = numValue;
    } else {
      paramMap[key] = value;
    }
  }
  
  if (Object.keys(paramMap).length > 0) {
    params.assigned = paramMap;
  }
  
  return {
    ugens: Array.from(ugens),
    params
  };
}

/**
 * Extract perceptual and technical tags from text
 */
export function extractTags(text: string): {
  perceptual: string[];
  technical: string[];
} {
  const perceptualTags: string[] = [];
  const technicalTags: string[] = [];
  
  const perceptualKeywords: Record<string, string[]> = {
    bright: ['bright', 'shiny', 'sparkly', 'crisp', 'brilliant'],
    dark: ['dark', 'muffled', 'warm', 'wooly', 'dull'],
    metallic: ['metallic', 'steel', 'tinny', 'bell-like', 'resonant'],
    warm: ['warm', 'smooth', 'creamy', 'soft', 'velvety'],
    harsh: ['harsh', 'aggressive', 'edgy', 'sharp', 'piercing'],
    shimmer: ['shimmer', 'shimmery', 'sparkle', 'glitter', 'twinkling'],
    ambient: ['ambient', 'atmospheric', 'distant', 'spacey', 'ethereal'],
    percussive: ['percussive', 'punchy', 'snappy', 'tight', 'crisp attack'],
    granular: ['granular', 'grainy', 'textured', 'cloudy', 'particle'],
    resonant: ['resonant', 'ringing', 'echoing', 'reverberant', 'hall-like']
  };
  
  const technicalKeywords: Record<string, string[]> = {
    'comb-filter': ['comb', 'comb filter', 'feedback delay'],
    'lowpass': ['lowpass', 'lpf', 'low pass filter'],
    'highpass': ['highpass', 'hpf', 'high pass filter'],
    'bandpass': ['bandpass', 'bpf', 'band pass filter'],
    'granular': ['granular', 'granulator', 'grain', 'granular synthesis'],
    'delay': ['delay', 'echo', 'delay line'],
    'reverb': ['reverb', 'reverberation', 'hall', 'room'],
    'distortion': ['distortion', 'overdrive', 'saturation', 'waveshaper'],
    'fm': ['fm', 'frequency modulation', 'fm synthesis'],
    'am': ['am', 'amplitude modulation', 'ring modulation'],
    'fft': ['fft', 'spectral', 'spectrum'],
    'filter-sweep': ['filter sweep', 'filter automation', 'wah'],
    'envelope': ['envelope', 'adsr', 'attack decay sustain release']
  };
  
  const lowerText = text.toLowerCase();
  
  // Extract perceptual tags
  for (const [tag, keywords] of Object.entries(perceptualKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      perceptualTags.push(tag);
    }
  }
  
  // Extract technical tags
  for (const [tag, keywords] of Object.entries(technicalKeywords)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      technicalTags.push(tag);
    }
  }
  
  return {
    perceptual: perceptualTags,
    technical: technicalTags
  };
}

/**
 * Process a document: extract metadata, chunk if needed, add embeddings placeholder
 */
export function processDocument(
  doc: DSPDoc,
  options: ChunkingOptions = {}
): DSPDoc[] {
  // Extract metadata if not already present
  if (doc.type === 'code' && (!doc.ugens || doc.ugens.length === 0)) {
    const metadata = extractCodeMetadata(doc.content);
    doc.ugens = metadata.ugens;
    if (!doc.params) {
      doc.params = metadata.params;
    }
  }
  
  // Extract tags if not present
  if ((!doc.perceptual_tags || doc.perceptual_tags.length === 0) ||
      (!doc.technical_tags || doc.technical_tags.length === 0)) {
    const tags = extractTags(doc.content);
    doc.perceptual_tags = doc.perceptual_tags || tags.perceptual;
    doc.technical_tags = doc.technical_tags || tags.technical;
  }
  
  // Estimate tokens if not present
  if (!doc.tokens_est) {
    doc.tokens_est = estimateTokens(doc.content);
  }
  
  // Chunk if needed
  if (doc.tokens_est > (options.maxTokens || DEFAULT_OPTIONS.maxTokens)) {
    return chunkDocument(doc, options);
  }
  
  return [doc];
}


