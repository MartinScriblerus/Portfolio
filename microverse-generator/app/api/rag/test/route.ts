import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(_req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(url, key);
  // Get one existing embedding from the table
  const { data: row, error: ferr } = await supabase
    .from('documents')
    .select('id, work, author, embedding')
    .limit(1)
    .single();
  if (ferr) return new Response(JSON.stringify({ error: ferr.message }), { status: 500 });
  if (!row) return new Response(JSON.stringify({ error: 'no rows found' }), { status: 404 });
  // Ensure the embedding is a number[] (Supabase may return vector as a string)
  let embedding: number[];
  const raw = (row as any).embedding;
  if (Array.isArray(raw)) {
    embedding = raw.map((x: any) => Number(x));
  } else if (typeof raw === 'string') {
    try {
      // Commonly comes back like "[0.1, -0.2, ...]" — JSON.parse will handle it
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) throw new Error('parsed embedding is not an array');
      embedding = parsed.map((x: any) => Number(x));
    } catch (e) {
      // Fallback: strip braces and split
      const cleaned = raw.replace(/[\{\}\[\]]/g, '');
      embedding = cleaned.split(',').map((s: string) => Number(s.trim())).filter((n: any) => Number.isFinite(n));
    }
  } else {
    return new Response(JSON.stringify({ error: 'unexpected embedding type' }), { status: 500 });
  }
  // Call RPC using that embedding; should always return nearest neighbors
  const { data, error } = await (supabase as any).rpc('match_documents', {
    query_embedding: embedding,
    match_count: 5,
    min_similarity: -1.0,
  });

  console.log("@@@ RPC DATA: ", data);

  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  const { data: exactData, error: exactErr } = await (supabase as any).rpc('match_documents_exact', {
    query_embedding: embedding,
    match_count: 5,
  });
  if (exactErr) return new Response(JSON.stringify({ error: exactErr.message }), { status: 500 });
  // Cross-check: compute cosine similarities in Node from all rows
  const { data: allRows, error: allErr } = await supabase
    .from('documents')
    .select('id, work, author, content, embedding');
  if (allErr) return new Response(JSON.stringify({ error: allErr.message }), { status: 500 });

  function toVec(v: any): number[] | null {
    if (Array.isArray(v)) return v.map((x: any) => Number(x));
    if (typeof v === 'string') {
      try {
        const p = JSON.parse(v);
        if (Array.isArray(p)) return p.map((x: any) => Number(x));
      } catch {}
      const cleaned = v.replace(/[\{\}\[\]]/g, '');
      const nums = cleaned.split(',').map((s: string) => Number(s.trim())).filter((n: any) => Number.isFinite(n));
      return nums.length ? nums : null;
    }
    return null;
  }
  function cosine(a: number[], b: number[]) {
    let dot = 0, na = 0, nb = 0;
    const len = Math.min(a.length, b.length);
    for (let i = 0; i < len; i++) { const x = a[i], y = b[i]; dot += x*y; na += x*x; nb += y*y; }
    if (!na || !nb) return 0;
    return dot / (Math.sqrt(na) * Math.sqrt(nb));
  }
  const local = (allRows || [])
    .map((r: any) => {
      const v = toVec(r.embedding);
      const sim = v ? cosine(embedding, v) : null;
      return sim == null ? null : { id: r.id, work: r.work, author: r.author, content: r.content, similarity: sim };
    })
    .filter(Boolean as any)
    .sort((a: any, b: any) => b.similarity - a.similarity)
    .slice(0, 5);

  return new Response(
    JSON.stringify({
      seed: { id: row.id, work: row.work, author: row.author },
  rpcResults: data,
  exactResults: exactData,
      localResults: local,
      totals: { allRows: allRows?.length ?? 0, rpcCount: (data as any[])?.length ?? 0, localCount: local.length },
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );
}
