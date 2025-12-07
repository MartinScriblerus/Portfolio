/**
 * Supabase client utilities for DSP RAG
 * Provides typed access to dsp_docs table
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { DSPDoc } from '@/types/dsp-rag';

let cachedClient: SupabaseClient | null = null;

export function getSupabaseDSPClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase client not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  
  cachedClient = createClient(supabaseUrl, supabaseKey);
  return cachedClient;
}

/**
 * Search DSP documents using semantic similarity
 */
export async function searchDSPDocs(
  query: string,
  options?: {
    k?: number;
    minSimilarity?: number;
    language?: string;
    type?: string;
    tool?: string;
    perceptualTags?: string[];
    technicalTags?: string[];
  }
): Promise<Array<DSPDoc & { similarity: number }>> {
  const supabase = getSupabaseDSPClient();
  
  // Get embedding for query
  const embeddingResponse = await fetch('/api/embed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: query })
  });
  
  if (!embeddingResponse.ok) {
    throw new Error('Failed to get embedding');
  }
  
  const { embedding } = await embeddingResponse.json();
  
  // Call the match_dsp_docs RPC function
  const { data, error } = await supabase.rpc('match_dsp_docs', {
    query_embedding: embedding,
    match_count: options?.k || 12,
    min_similarity: options?.minSimilarity || 0.5,
    filter_language: options?.language || null,
    filter_type: options?.type || null,
    filter_tool: options?.tool || null,
    perceptual_tags_filter: options?.perceptualTags || null,
    technical_tags_filter: options?.technicalTags || null
  });
  
  if (error) {
    console.error('DSP docs search error:', error);
    throw error;
  }
  
  return (data || []).map((doc: any) => ({
    id: doc.id,
    title: doc.title,
    type: doc.type as any,
    language: doc.language as any,
    tool: doc.tool as any,
    content: doc.content,
    perceptual_tags: doc.perceptual_tags || [],
    technical_tags: doc.technical_tags || [],
    params: doc.params,
    example_usage: doc.example_usage,
    license: doc.license as any,
    source_url: doc.source_url,
    similarity: doc.similarity || 0
  }));
}

/**
 * Get a single DSP document by ID
 */
export async function getDSPDoc(id: string): Promise<DSPDoc | null> {
  const supabase = getSupabaseDSPClient();
  
  const { data, error } = await supabase
    .from('dsp_docs')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    console.error('Error fetching DSP doc:', error);
    return null;
  }
  
  return data as DSPDoc;
}

/**
 * Insert a DSP document (requires service role key)
 */
export async function insertDSPDoc(doc: Partial<DSPDoc> & { content: string }): Promise<DSPDoc> {
  const supabase = getSupabaseDSPClient();
  
  const { data, error } = await supabase
    .from('dsp_docs')
    .insert(doc)
    .select()
    .single();
  
  if (error) {
    throw new Error(`Failed to insert DSP doc: ${error.message}`);
  }
  
  return data as DSPDoc;
}

/**
 * Count documents in dsp_docs table
 */
export async function countDSPDocs(): Promise<number> {
  const supabase = getSupabaseDSPClient();
  
  const { count, error } = await supabase
    .from('dsp_docs')
    .select('*', { count: 'exact', head: true });
  
  if (error) {
    throw new Error(`Failed to count DSP docs: ${error.message}`);
  }
  
  return count || 0;
}


