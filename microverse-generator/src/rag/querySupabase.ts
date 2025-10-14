import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
export function getSupabaseClient(): SupabaseClient {
  if (cachedClient) return cachedClient;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    // Do not throw at import time; delay error until someone actually tries to use it
    throw new Error('Supabase client not configured: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }
  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}

export type MatchRow = { id: string; work: string; author: string; content: string; similarity: number };

export async function matchDocuments(queryEmbedding: number[], matchCount = 5, minSimilarity = 0.2) {
  const supabase = getSupabaseClient();
  const { data, error } = await (supabase as any).rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    min_similarity: minSimilarity,
  });
  if (error) throw error;
  return data as MatchRow[];
}
