import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

async function getEmbed(text: string): Promise<number[]> {
  const t = await import('@xenova/transformers');
  const { pipeline } = t as any;
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  const out = await extractor(text, { pooling: 'mean', normalize: true });
  return Array.from(out.data as Float32Array);
}

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

export async function POST(req: NextRequest) {
  try {
    const { text, k = 5 } = await req.json();
    if (!text || typeof text !== 'string') {
      return new Response(JSON.stringify({ error: 'text is required' }), { status: 400 });
    }
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    const qvec = await getEmbed(text);
    const { data: allRows, error } = await supabase
      .from('documents')
      .select('id, work, author, content, embedding');
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

    const scored = (allRows || [])
      .map((r: any) => {
        const v = toVec(r.embedding);
        const sim = v ? cosine(qvec, v) : null;
        return sim == null ? null : { id: r.id, work: r.work, author: r.author, content: r.content, similarity: sim };
      })
      .filter(Boolean as any)
      .sort((a: any, b: any) => b.similarity - a.similarity)
      .slice(0, Math.max(1, Math.min(50, Number(k) || 5)));

    return new Response(JSON.stringify({ results: scored }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
