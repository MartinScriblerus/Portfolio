import { NextRequest } from 'next/server';

type OpCfg = { on: boolean; strength: number };
type VisualControl = {
  ops?: Partial<Record<string, OpCfg>>;
  targetColor?: { r: number; g: number; b: number };
};

type AudioControl = {
  tempo?: number; // bpm
  filter?: number; // 0..1
  reverb?: number; // 0..1
  pattern?: string;
};

type IntentResponse = {
  visual: VisualControl;
  audio: AudioControl;
  meta: { sources: Array<{ work?: string; author?: string; topic?: string[]; similarity?: number }> };
};

function clamp01(n: number) { return Math.max(0, Math.min(1, n)); }

function scoreFromTopics(topics: string[] | undefined, key: string) {
  const arr = (topics || []).map((t) => t.toLowerCase());
  return arr.includes(key) ? 1 : 0;
}

function mapDocsToControls(docs: any[]): IntentResponse {
  // Aggregate simple signals from top results
  let vVision = 0, vAudio = 0, vColor = 0, vPsycho = 0, vOptics = 0;
  let best: any = null;
  for (const d of docs) {
    const t = (d.topic ?? d.metadata?.topic) as string[] | undefined;
    vVision += scoreFromTopics(t, 'vision');
    vAudio += scoreFromTopics(t, 'audio');
    vColor += scoreFromTopics(t, 'colour') + scoreFromTopics(t, 'color');
    vPsycho += scoreFromTopics(t, 'psychophysics') + scoreFromTopics(t, 'psychology');
    vOptics += scoreFromTopics(t, 'optics');
    if (!best) best = d;
  }
  const totalSig = Math.max(1, vVision + vAudio + vColor + vPsycho + vOptics);
  const ops: Record<string, OpCfg> = {};
  // Visual ops mapping
  if (vVision > 0) {
    ops.contrast = { on: true, strength: clamp01(0.6 + 0.1 * vVision) };
    ops.kaleid = { on: true, strength: clamp01(0.3 + 0.1 * vVision) };
  }
  if (vColor > 0) {
    ops.hue = { on: true, strength: clamp01(0.4 + 0.12 * vColor) };
    ops.saturate = { on: true, strength: clamp01(0.7) };
  }
  if (vOptics > 0) {
    ops.pixelate = { on: true, strength: clamp01(0.2 + 0.1 * vOptics) };
    ops.rotate = { on: true, strength: 0.18 };
  }
  if (vPsycho > 0) {
    ops.modulate = { on: true, strength: clamp01(0.2 + 0.1 * vPsycho) };
    ops.modulateHue = { on: true, strength: 0.18 };
  }
  if (vAudio > 0) {
    // Use scroll to suggest streaming motion when audio topics are foregrounded
    ops.scrollX = { on: true, strength: 0.22 };
  }
  // Audio mapping
  const audio: AudioControl = {
    tempo: 100 + Math.round(20 * (vAudio / totalSig)),
    filter: clamp01(0.35 + 0.1 * (vPsycho / totalSig)),
    reverb: clamp01(0.25 + 0.1 * (vVision / totalSig)),
    pattern: vAudio > 0 ? 'rhythmic' : 'pad',
  };
  // Target color hint (simple tie: color topics → slightly warmer)
  const targetColor = vColor > 0 ? { r: 0.65, g: 0.5, b: 0.45 } : undefined;
  return {
    visual: { ops, targetColor },
    audio,
    meta: { sources: docs.map((d) => ({ work: d.work ?? d.metadata?.work, author: d.author ?? d.metadata?.author, topic: d.topic ?? d.metadata?.topic, similarity: d.similarity })) },
  };
}

export async function POST(req: NextRequest) {
  try {
  const { query, topK = 3 } = await req.json();
    if (!query || typeof query !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing query' }), { status: 400, headers: { 'content-type': 'application/json' } });
    }
    // Call existing exact-search endpoint to get semantic neighbors
    const url = new URL('/api/rag/search', req.url);
    // NOTE: /api/rag/search expects { text, k } not { query, topK }
    const ragRes = await fetch(url.toString(), {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ text: query, k: topK })
    });
    if (!ragRes.ok) {
      const text = await ragRes.text();
      return new Response(JSON.stringify({ error: 'RAG search failed', details: text }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
  const ragData = await ragRes.json();
    if (!ragData || typeof ragData !== 'object') {
      return new Response(JSON.stringify({ error: 'Invalid RAG response shape' }), { status: 500, headers: { 'content-type': 'application/json' } });
    }
    const docs = Array.isArray((ragData as any).results) ? (ragData as any).results : [];
    if (!docs.length) {
      return new Response(JSON.stringify({ visual: { ops: {} }, audio: {}, meta: { sources: [], stats: (ragData as any).stats || null } }), { status: 200, headers: { 'content-type': 'application/json' } });
    }
    const controls = mapDocsToControls(docs);
    const payload = { ...controls, meta: { ...controls.meta, stats: (ragData as any).stats || null } };
    return new Response(JSON.stringify(payload satisfies IntentResponse), { status: 200, headers: { 'content-type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e?.message ?? 'Unknown error' }), { status: 500, headers: { 'content-type': 'application/json' } });
  }
}
