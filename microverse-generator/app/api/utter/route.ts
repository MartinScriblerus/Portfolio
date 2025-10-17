import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';

// Simple in-memory cache and rate limiter (best-effort in serverless; may reset on cold start)
const CACHE = new Map<string, { text: string; at: number }>();
const RL = new Map<string, { count: number; resetAt: number }>();

// Config
const MAX_TOKENS = 140; // keep it short; 2–3 sentences
const WINDOW_MS = 60_000; // rate limit window
const MAX_REQ_PER_WINDOW = 20; // per IP
const CACHE_TTL_MS = 10 * 60_000; // 10 minutes

type UtterInput = {
  query?: string;
  snippets?: string[]; // top RAG snippets
  keywords?: string[]; // extracted
  citations?: Array<{ author?: string; work?: string }>; // vernacular cite list
  bans?: string[]; // phrases to avoid repeating
  style?: { persona?: string; tone?: string };
};

export async function POST(req: NextRequest) {
  // Rate limit by IP
  const fwd = req.headers.get('x-forwarded-for');
  const real = req.headers.get('x-real-ip');
  const ip = (fwd ? fwd.split(',')[0].trim() : (real || 'anon'));
  if (!rateLimit(String(ip))) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const body = (await req.json().catch(() => ({}))) as UtterInput;
  const { query = '', snippets = [], keywords = [], citations = [], bans = [], style } = body;

  // Cache key = hash of essential inputs
  const key = hash({ q: query, s: snippets.slice(0, 4), k: keywords.slice(0, 8), c: citations.slice(0, 2), b: bans.slice(0, 8), v: 1 });
  const cached = CACHE.get(key);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ text: cached.text, meta: { cache: 'hit' } });
  }

  // Try style-pack as few-shot hints
  const stylePack = await loadStylePack();
  const mergedBans: string[] = Array.from(new Set([...(stylePack?.bans || []), ...bans]));
  const persona = style?.persona || 'A knowing, terse, enigma-loving, playful philosopher-narrator.';
  const tone = style?.tone || 'Early modern clarity inspired by Simon Ockley\'s 1708 translation of Hayy ibn Yaqzan.';

  const llmText = await tryLLM({ query, snippets, keywords, citations, bans: mergedBans, persona, tone, stylePack });
  let outText = (llmText && sanitize(llmText, mergedBans)) || sanitize(ruleBasedFallback({ query, snippets, keywords, citations, stylePack }), mergedBans);
  outText = clarityFilter(outText);
  outText = ensureCTA(outText);
  const finalText = outText;

  CACHE.set(key, { text: finalText, at: Date.now() });
  return NextResponse.json({ text: finalText, meta: { cache: 'miss' } });
}

function rateLimit(id: string): boolean {
  const now = Date.now();
  const curr = RL.get(id) || { count: 0, resetAt: now + WINDOW_MS };
  if (now > curr.resetAt) {
    curr.count = 0; curr.resetAt = now + WINDOW_MS;
  }
  curr.count += 1;
  RL.set(id, curr);
  return curr.count <= MAX_REQ_PER_WINDOW;
}

function hash(obj: any): string {
  const s = JSON.stringify(obj);
  return crypto.createHash('sha1').update(s).digest('hex');
}

async function loadStylePack(): Promise<null | any> {
  try {
    const p = process.cwd() + '/content/style-pack.json';
    const txt = await fs.readFile(p, 'utf8');
    return JSON.parse(txt);
  } catch {
    return null;
  }
}

async function tryLLM(params: { query: string; snippets: string[]; keywords: string[]; citations: Array<{ author?: string; work?: string }>; bans: string[]; persona: string; tone: string; stylePack: any }): Promise<string | null> {
  const { query, snippets, keywords, citations, bans, persona, tone, stylePack } = params;
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const messages = buildPrompt({ query, snippets, keywords, citations, bans, persona, tone, stylePack });
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages,
        max_tokens: MAX_TOKENS,
        temperature: 0.65,
        presence_penalty: 0.2,
        frequency_penalty: 0.2,
      })
    });
    if (!res.ok) return null;
    const j = await res.json();
    const text = j?.choices?.[0]?.message?.content?.trim();
    return text || null;
  } catch {
    return null;
  }
}

function buildPrompt({ query, snippets, keywords, citations, bans, persona, tone, stylePack }: any) {
  const fewShot = (stylePack?.fewShot ?? []).slice(0, 3).map((s: any) => ({ role: 'user', content: s.prompt }),);
  const fewAns = (stylePack?.fewShot ?? []).slice(0, 3).map((s: any) => ({ role: 'assistant', content: s.reply }));
  const bansLine = bans.length ? `Avoid these exact phrases: ${bans.map((q: string) => `“${q}”`).join(', ')}.` : '';
  const cAuthors = citations.filter((c: any) => c.author).map((c: any) => c.author);
  const userPayload = [
    `query: ${query}`,
    keywords.length ? `keywords: ${keywords.slice(0,8).join(', ')}` : '',
  snippets.length ? `snippets: ${snippets.slice(0,3).map((s: string)=>s.slice(0,240)).join(' \n— ')}` : '',
    citations.length ? `citations: ${citations.slice(0,2).map((c: any)=> `${c.author||''}${c.work? ' — '+c.work:''}`).join(' | ')}` : '',
  ].filter(Boolean).join('\n');

  return [
    { role: 'system', content: `${persona} Write in ${tone} Keep it concise (2–3 sentences). Be vivid but spare. Prefer plain, modern wording—no archaic or unclear phrases (avoid forms like “these sort of men”, “thereof”, “such like”). Be specific; avoid vague pronouns without clear referent. Use no more than one vernacular citation. Do not quote more than a short phrase from snippets. End with one short, concrete call-to-action relevant to sight/sound or a prompt to enter text. ${bansLine}` },
    ...(fewShot as any[]),
    ...(fewAns as any[]),
    { role: 'user', content: userPayload },
  ];
}

function ruleBasedFallback({ query, snippets, keywords, citations, stylePack }: any): string {
  const openers: string[] = stylePack?.openers || [
    'Mark what is before you and be sparing of words.',
    'Consider what lies plain; the rest will follow.',
    'Take the hint; let the mind do the longer work.'
  ];
  const maxims: string[] = stylePack?.maxims || [
    'Sight makes borders; sound makes returns.',
    'Call nothing secret but call it patient.',
    'What repeats gains shape; what fades gains room.'
  ];
  const cites = citations?.[0] ? `${citations[0].author || 'a classic'}${citations[0].work ? ' in '+citations[0].work : ''} leans this way. Could we move in that direction? Try this... ` : '';
    const op = pick(openers);
    const mx = pick(maxims);
    // Use the top snippet (phrase/chunk) for line2 if available, else fallback to maxim
    const topChunk = snippets && snippets.length ? snippets[0] : '';
    // Remove any comparison/side-by-side phrasing
    const line2 = topChunk ? `Consider: ${topChunk}` : mx;
    return [op, line2, cites].filter(Boolean).join(' ');
}

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function sanitize(text: string, bans: string[]): string {
  let out = text || '';
  for (const b of bans || []) {
    const re = new RegExp(b.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    out = out.replace(re, '');
  }
  return out.replace(/\s{2,}/g, ' ').trim();
}

// Remove unclear/archaic fragments; drop sentences with blacklisted patterns
function clarityFilter(text: string): string {
  if (!text) return text;
  const blacklist = [
    /these sort of\b/i,
    /those other\b/i,
    /such like\b/i,
    /thereof\b/i,
    /hereof\b/i,
    /whereof\b/i,
    // Drop imperative "Say …"-style fragments if any slip through
    /^\s*say\b/i,
    /\bSay\s+“[^”]*”\.?/,
  ];
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter(s => !blacklist.some(re => re.test(s)));
  const cleaned = kept.join(' ').trim();
  return cleaned || text;
}

function ensureCTA(text: string): string {
  const hasCTA = /\b(click|tap|type|enter|name|choose|tilt|lean|look|listen)\b/i.test(text);
  if (hasCTA) return text;
  const ctas = [
    'Name a color or a sound.',
    'Tap once to stir the image.',
    'Type one word you trust.',
    'Lean left or right—choose a side.',
  ];
  return `${text} ${pick(ctas)}`.trim();
}
