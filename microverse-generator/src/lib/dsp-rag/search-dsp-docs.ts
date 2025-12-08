/**
 * Search DSP docs table for ChucK code examples
 * Client-side helper for querying dsp_docs table
 */

import { createClient } from '@supabase/supabase-js';
import { DSPDoc, Language } from '../../types/dsp-rag';

export async function searchDSPDocsClient(
  query: string,
  filters?: {
    language?: Language;
    perceptualTags?: string[];
    technicalTags?: string[];
  },
  k: number = 8
): Promise<Array<DSPDoc & { similarity: number }>> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.warn('[searchDSPDocsClient] Supabase not configured');
    return [];
  }
  
  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get embedding for query
    const embedRes = await fetch('/api/embed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: query })
    });
    
    if (!embedRes.ok) {
      console.warn('[searchDSPDocsClient] Failed to get embedding');
      return [];
    }
    
    const embedData = await embedRes.json();
    const embedding = Array.isArray(embedData.embedding) 
      ? embedData.embedding.map((x: any) => Number(x))
      : [];
    
    if (embedding.length === 0) {
      console.warn('[searchDSPDocsClient] Empty embedding');
      return [];
    }
    
    // Call match_dsp_docs RPC function
    const { data, error } = await (supabase as any).rpc('match_dsp_docs', {
      query_embedding: embedding,
      match_count: k,
      min_similarity: 0.4,
      filter_language: filters?.language || null,
      perceptual_tags_filter: filters?.perceptualTags || null,
      technical_tags_filter: filters?.technicalTags || null
    });
    
    if (error) {
      console.error('[searchDSPDocsClient] RPC error:', error);
      return [];
    }
    
    return (data || []).map((doc: any) => ({
      ...doc,
      similarity: doc.similarity || 0
    }));
    
  } catch (error: any) {
    console.error('[searchDSPDocsClient] Error:', error);
    return [];
  }
}

/**
 * Extract code from DSP docs for display
 * Prefers 'content' field (actual code) over 'example_usage' (fragmentary logs)
 */
export function formatDSPCodeForIDE(doc: DSPDoc): string {
  // Prefer 'content' field which contains actual ChucK code
  if (doc.content && doc.content.trim().length > 20) {
    const header = `// ${doc.title || 'ChucK Example'}\n`;
    const tags = doc.perceptual_tags?.length 
      ? `// Tags: ${doc.perceptual_tags.join(', ')}\n`
      : '';
    return header + tags + doc.content.trim();
  }
  
  // Fallback to example_usage if content not available
  const examples = doc.example_usage 
    ? (Array.isArray(doc.example_usage) ? doc.example_usage : [doc.example_usage])
    : [];
  
  if (examples.length === 0) {
    return `// ${doc.title || 'No example code available'}`;
  }
  
  // Use first example, or combine if multiple
  let code = examples[0];
  
  // Add helpful comments
  const header = `// ${doc.title || 'ChucK Example'}\n`;
  const tags = doc.perceptual_tags?.length 
    ? `// Tags: ${doc.perceptual_tags.join(', ')}\n`
    : '';
  
  return header + tags + code;
}
