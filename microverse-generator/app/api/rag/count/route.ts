import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  const { count, error } = await supabase.from('documents').select('*', { count: 'exact', head: true });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  return new Response(JSON.stringify({ count }), { headers: { 'Content-Type': 'application/json' } });
}
