/**
 * Search DSP docs table for ChucK code examples
 * Client-side helper for querying dsp_docs table
 */

import { createClient } from '@supabase/supabase-js';
import { DSPDoc, Language } from '../../types/dsp-rag';

// Timeout helper
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
    )
  ]);
}

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
    console.log('[searchDSPDocsClient] Starting search for:', query);
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get embedding for query with timeout (30 seconds)
    console.log('[searchDSPDocsClient] Getting embedding...');
    const embedRes = await withTimeout(
      fetch('/api/embed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: query })
      }),
      30000,
      'Embedding request timed out after 30s'
    );
    
    if (!embedRes.ok) {
      const errorText = await embedRes.text().catch(() => 'Unknown error');
      console.warn('[searchDSPDocsClient] Failed to get embedding:', embedRes.status, errorText);
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
    
    console.log('[searchDSPDocsClient] Got embedding, length:', embedding.length);
    
    // Call match_dsp_docs RPC function with timeout (20 seconds)
    // Use explicit parameter names to avoid PostgREST ambiguity
    console.log('[searchDSPDocsClient] Calling match_dsp_docs RPC...');
    const rpcPromise = (supabase as any).rpc('match_dsp_docs', {
      query_embedding: embedding,
      match_count: k,
      min_similarity: 0.4,
      filter_language: filters?.language || null,
      perceptual_tags_filter: filters?.perceptualTags || null,
      technical_tags_filter: filters?.technicalTags || null
      // Explicitly NOT including filter_type or filter_tool to use the 6-parameter version
    });
    
    const { data, error } = await withTimeout(
      rpcPromise,
      20000,
      'Supabase RPC call timed out after 20s'
    );
    
    if (error) {
      console.error('[searchDSPDocsClient] RPC error:', error);
      // Check for function ambiguity error (PGRST203)
      if (error.code === 'PGRST203' || error.message?.includes('Could not choose the best candidate function')) {
        console.error('[searchDSPDocsClient] ❌ FUNCTION AMBIGUITY ERROR (PGRST203)');
        console.error('[searchDSPDocsClient] Multiple match_dsp_docs functions exist in Supabase.');
        console.error('[searchDSPDocsClient] 📖 See FIX_SUPABASE_FUNCTION.md for detailed instructions');
        console.error('[searchDSPDocsClient] 🔧 Quick fix: Go to Supabase SQL Editor and run:');
        console.error('[searchDSPDocsClient] DROP FUNCTION IF EXISTS public.match_dsp_docs(double precision[], integer, double precision, text, text, text, text[], text[]);');
      }
      // Check if it's a function not found error
      if (error.message?.includes('function') || error.code === '42883') {
        console.error('[searchDSPDocsClient] match_dsp_docs function may not exist in Supabase. Please run the migration.');
      }
      return [];
    }
    
    const results = (data || []).map((doc: any) => ({
      ...doc,
      similarity: doc.similarity || 0
    }));
    
    console.log('[searchDSPDocsClient] Found', results.length, 'results');
    return results;
    
  } catch (error: any) {
    console.error('[searchDSPDocsClient] Error:', error);
    if (error.message?.includes('timed out')) {
      console.error('[searchDSPDocsClient] Request timed out - check Supabase connection and RPC function');
    }
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
