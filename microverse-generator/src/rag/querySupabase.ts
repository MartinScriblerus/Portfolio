import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let configError: Error | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  if (configError) throw configError;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    configError = new Error('Supabase client not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw configError;
  }
  
  // Validate URL format
  try {
    new URL(supabaseUrl);
  } catch (e) {
    configError = new Error(`Invalid Supabase URL: ${supabaseUrl}`);
    throw configError;
  }
  
  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}

export type MatchRow = { id: string; work: string; author: string; content: string; similarity: number };

export async function matchDocuments(queryEmbedding: number[], matchCount = 5, minSimilarity = 0.2): Promise<MatchRow[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await (supabase as any).rpc('match_documents', {
      query_embedding: queryEmbedding,
      match_count: matchCount,
      min_similarity: minSimilarity,
    });
    
    if (error) {
      console.error('[matchDocuments] Supabase RPC error:', error);
      // Check for DNS/connection errors
      if (error.message?.includes('resolve') || error.message?.includes('ERR_NAME_NOT_RESOLVED') || error.code === 'ENOTFOUND') {
        throw new Error('Supabase connection failed: Check your NEXT_PUBLIC_SUPABASE_URL. The project may be paused or the URL may be incorrect.');
      }
      throw error;
    }
    
    return (data || []) as MatchRow[];
  } catch (e: any) {
    // Re-throw with more context if it's a configuration error
    if (e.message?.includes('not configured') || e.message?.includes('Invalid Supabase URL')) {
      throw e;
    }
    // Wrap other errors
    throw new Error(`RAG search failed: ${e.message || String(e)}`);
  }
}
