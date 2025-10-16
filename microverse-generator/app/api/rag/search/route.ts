import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Simple in-memory LRU for query embeddings (per serverless instance lifetime)
type CacheEntry = { key: string; vec: number[]; at: number };
const EMBED_CACHE_MAX = 40;
const embedCache: CacheEntry[] = [];

function getCachedEmbedding(key: string): number[] | null {
  const idx = embedCache.findIndex(e => e.key === key);
  if (idx === -1) return null;
  const entry = embedCache[idx];
  // promote to front (MRU)
  embedCache.splice(idx, 1);
  embedCache.unshift(entry);
  return entry.vec;
}

function putCachedEmbedding(key: string, vec: number[]) {
  const existingIdx = embedCache.findIndex(e => e.key === key);
  if (existingIdx !== -1) embedCache.splice(existingIdx, 1);
  embedCache.unshift({ key, vec, at: Date.now() });
  if (embedCache.length > EMBED_CACHE_MAX) embedCache.pop();
}

let extractorPromise: Promise<any> | null = null;
async function ensureExtractor() {
  if (!extractorPromise) {
    extractorPromise = (async () => {
      const t = await import('@xenova/transformers');
      const { pipeline } = t as any;
      return pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
    })();
  }
  return extractorPromise;
}

async function getEmbed(text: string): Promise<number[]> {
  const cached = getCachedEmbedding(text);
  if (cached) return cached;
  const extractor = await ensureExtractor();
  const out = await extractor(text, { pooling: 'mean', normalize: true });
  const arr = Array.from(out.data as Float32Array);
  putCachedEmbedding(text, arr);
  return arr;
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

    const sims = (allRows || [])
      .map((r: any) => {
        const v = toVec(r.embedding);
        if (!v) return null;
        const sim = cosine(qvec, v);
        return { id: r.id, work: r.work, author: r.author, content: r.content, similarity: sim };
      })
      .filter(Boolean as any) as Array<{ id: string; work: string; author: string; content: string; similarity: number }>;

    sims.sort((a, b) => b.similarity - a.similarity);

    // Similarity statistics
    const topSim = sims.length ? sims[0].similarity : 0;
    const meanTop5 = sims.slice(0, 5).reduce((acc, s) => acc + s.similarity, 0) / Math.max(1, Math.min(5, sims.length));
    const median = (() => {
      if (!sims.length) return 0;
      const vals = sims.map(s => s.similarity).sort((a,b)=>a-b);
      const mid = Math.floor(vals.length / 2);
      return vals.length % 2 ? vals[mid] : (vals[mid - 1] + vals[mid]) / 2;
    })();
    // Dynamic threshold: keep docs >= 0.6 * topSim; else fallback to top k
    const dynamicBase = 0.6;
    const threshold = topSim * dynamicBase;
    const filtered = sims.filter(s => s.similarity >= threshold);
    // Diversify: limit to one per author/work pair when possible
    const base = (filtered.length ? filtered : sims);
    const seen = new Set<string>();
    const diversified: typeof sims = [];
    for (const s of base) {
      const key = `${(s.author||'')}::${(s.work||'')}`.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        diversified.push(s);
      }
      if (diversified.length >= Math.max(1, Math.min(50, Number(k) || 5))) break;
    }
    const final = diversified.length ? diversified : base.slice(0, Math.max(1, Math.min(50, Number(k) || 5)));

    return new Response(JSON.stringify({
      results: final,
      stats: {
        count: sims.length,
        topSim,
        meanTop5,
        median,
        thresholdUsed: threshold,
        filteredCount: final.length,
        cacheSize: embedCache.length,
        cacheHit: !!getCachedEmbedding(text) // quick second lookup to mark hit (acceptable minor cost)
      }
    }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
