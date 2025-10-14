import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export type MatchRow = { id: string; work: string; author: string; content: string; similarity: number };

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function matchDocuments(queryEmbedding: number[], matchCount = 5, minSimilarity = 0.2) {
  const { data, error } = await (supabase as any).rpc('match_documents', {
    query_embedding: queryEmbedding,
    match_count: matchCount,
    min_similarity: minSimilarity,
  });
  if (error) throw error;
  return data as MatchRow[];
}
