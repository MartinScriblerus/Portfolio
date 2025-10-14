import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

let embedderPromise: Promise<(text: string) => Promise<number[]>> | null = null;

async function ensureEmbedder() {
  if (!embedderPromise) {
    embedderPromise = (async () => {
      const t = await import('@xenova/transformers');
      const { pipeline } = t as any;
      const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
      return async (text: string) => {
        const out = await extractor(text, { pooling: 'mean', normalize: true });
        return Array.from(out.data as Float32Array);
      };
    })();
  }
  return embedderPromise;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text = (body?.text ?? '').toString();
    if (!text) return new Response(JSON.stringify({ error: 'Missing text' }), { status: 400 });
    const embed = await ensureEmbedder();
    const embedding = await embed(text);
    return new Response(JSON.stringify({ embedding }), { headers: { 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message || String(e) }), { status: 500 });
  }
}
