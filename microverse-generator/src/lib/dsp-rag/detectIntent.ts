/**
 * Simple intent detection for routing queries in PhilosopherGuide
 * Determines if query should go to DSP generation or RAG search
 */

export type QueryIntent = 'dsp' | 'rag' | 'visual' | 'unknown';

/**
 * Quick pattern-based intent detection
 * Returns 'dsp' if query seems to be about sound/code generation
 */
export function detectQueryIntent(query: string): QueryIntent {
  const lower = query.toLowerCase();
  
  // DSP/Sound creation keywords
  const dspKeywords = [
    'create', 'make', 'generate', 'build',
    'sound', 'audio', 'synthesize', 'synth',
    'chuck', 'faust', 'patch', 'code',
    'granular', 'filter', 'oscillator', 'effect',
    'metallic', 'bright', 'dark', 'warm',
    'lead', 'pad', 'bass', 'drum'
  ];
  
  // Visual keywords
  const visualKeywords = [
    'visual', 'hydra', 'video', 'graphics',
    'pattern', 'color', 'render'
  ];
  
  const dspScore = dspKeywords.filter(kw => lower.includes(kw)).length;
  const visualScore = visualKeywords.filter(kw => lower.includes(kw)).length;
  
  if (dspScore >= 2 || (dspScore >= 1 && (lower.includes('create') || lower.includes('make')))) {
    return 'dsp';
  }
  
  if (visualScore >= 2) {
    return 'visual';
  }
  
  // Default to RAG for philosophical/text queries
  return 'rag';
}

/**
 * More sophisticated intent detection using the intent router
 * (Can be enhanced with LLM-based classification later)
 */
export async function detectIntentWithRouter(query: string): Promise<QueryIntent> {
  try {
    // Use the existing intent router for classification
    const { routeIntent } = await import('./intent-router');
    const { classification } = await routeIntent(query);
    
    const intent = classification.intent;
    
    if (intent === 'CREATE_SOUND' || intent === 'MODIFY_SOUND' || 
        intent === 'TRANSLATE_CODE' || intent === 'SUGGEST_PARAMS') {
      return 'dsp';
    }
    
    if (intent === 'VISUALIZE') {
      return 'visual';
    }
    
    // EXPLAIN_CONCEPT, RETRIEVE_EXAMPLE → RAG
    return 'rag';
  } catch (error) {
    console.warn('Intent router failed, using pattern matching:', error);
    return detectQueryIntent(query);
  }
}
