/* eslint-disable @typescript-eslint/no-use-before-define */
'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAgentStore } from '../agent/useAgentStore';
import { stepAgent, registerTasks } from '../agent/taskEngine';
import { getSupabaseClient, matchDocuments, MatchRow } from '../rag/querySupabase';
import { useAskStore } from '../store/useAskStore';
import { useQueryStore } from '../store/useQueryStore';
import { useGuideMetricsStore } from '../store/useGuideMetricsStore';
import { useSignalBus } from '../store/useSignalBus';
import { randomCTA, randomStarter } from '../content/prompts';



export default function PhilosopherGuide() {

  // Select fields individually to avoid creating new objects every render
  const currentTaskId = useAgentStore((s) => s.currentTaskId);
  const tasks = useAgentStore((s) => s.tasks);
  const status = useAgentStore((s) => s.status);
  const [text, setText] = useState<string>('');
  const query = useQueryStore((s) => s.query);
  const setQuery = useQueryStore((s) => s.setQuery);
  const submitVersion = useQueryStore((s) => s.submitVersion);
  const setInFlight = useQueryStore((s) => s.setInFlight);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const embedderRef = useRef<null | ((text: string) => Promise<number[]>)>(null);
  // Embedding cache for history similarity
  const historyEmbedCache = useRef<Record<string, number[]>>({});
  const setTextResults = useAskStore(s => s.setTextResults);
  const [chat, setChat] = useState<Array<{ role: 'guide' | 'you'; text: string }>>([
    { role: 'guide', text: '' }
  ]);
  // Track user input history with embeddings for long-form consequences
  const [history, setHistory] = useState<Array<{ text: string; ts: number; emb: number[] }>>([]);
  const setGuideMetrics = useGuideMetricsStore((s) => s.setMetrics);
  const setBusMetrics = useSignalBus((s) => s.setMetrics);
  const bansRef = useRef<string[]>([]);
  const lastTwoTextsRef = useRef<string[]>([]);
  const lastInputAtRef = useRef<number>(Date.now());
  const lastStylizerAtRef = useRef<number>(0);

  const task = useMemo(() => tasks.find((t) => t.id === currentTaskId), [tasks, currentTaskId]);

  // On task changes, seed a guide line to keep it alive.
  useEffect(() => {
    if (!task) return;
    setChat((c) => c.length === 0 ? [{ role: 'guide', text: task.name }] : c);
  }, [task?.id]);

  // Register a small default sequence of tasks once
  useEffect(() => {
    const s = useAgentStore.getState();
    const initialPrompts = [
      "How does the paradox resolve?",
      "What don't we know that we don't know?",
      "What can't be seen here?",
      "What can't we ignore here?",
      "Note where light meets darkness. What is passing between them?",
      'Look closely. What patterns or principles emerge?'
    ]
    // Proper random index in [0, length)
    const idx = Math.floor(Math.random() * initialPrompts.length);
    setChat([{ role: 'guide', text: initialPrompts[idx] }])
    if (s.tasks.length === 0) {
      registerTasks([
        {
          id: 't1',
          name: 'Tap upon the surface thrice to awaken the image',
          check: (t) => t.clicks >= 3,
          onSuccess: () => console.log('[Agent] t1 success'),
        },
        {
          id: 't2',
          name: 'Hold the world steady—bring your gaze to the proper distance',
          check: (t) => t.cameraRadius >= 14, // reached after the expansion lerp
          onSuccess: () => console.log('[Agent] t2 success'),
        },
        {
          id: 't3',
          name: 'Resolve the veil—wait until the image clears on its own',
          check: (t) => t.past30 === true, // after the video clears
          onSuccess: () => console.log('[Agent] t3 success'),
        },
      ]);
    }
  }, []);

  // Poll agent checks lightly
  useEffect(() => {
    const id = setInterval(() => stepAgent(), 200);
    return () => clearInterval(id);
  }, []);

  const ensureEmbedder = useCallback(async () => {
    if (!embedderRef.current) {
      embedderRef.current = await loadEmbedder();
    }
    return embedderRef.current;
  }, []);

  const run = useCallback(async () => {
    setLoading(true); setErr(null);
    setInFlight(true);
    try {
      const q = (query || '').trim();
      if (!q) { setLoading(false); setInFlight(false); return; }
      // Capture then clear the input so it feels immediate, without racing the snapshot
      setQuery('');
      // Prefer server-side embedding to avoid browser CORS on model downloads
      const apiRes = await fetch('/api/embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: q }) });
      let vec: number[] | null = null;
      if (apiRes.ok) {
        const j = await apiRes.json();
        const raw = j.embedding;
        if (Array.isArray(raw)) {
          vec = raw.map((x: any) => Number(x));
        } else if (typeof raw === 'string') {
          try {
            const parsed = JSON.parse(raw);
            vec = Array.isArray(parsed) ? parsed.map((x: any) => Number(x)) : null;
          } catch {
            // unsupported shape
            vec = null;
          }
        } else {
          vec = null;
        }
      } else {
        // Fallback to client embedding
        const embed: any = await ensureEmbedder();
        vec = await embed(q);
      }
      if (!vec) throw new Error('Could not construct embedding vector');
      // Store in history (long-form consequences)
      const now = Date.now();
      setHistory((h) => [...h, { text: q, ts: now, emb: vec as number[] }]);

      // First try the new server-side exact search for reliable results on tiny datasets
      let data: MatchRow[] | null = null;
      try {
        const sres = await fetch('/api/rag/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: q, k: 5 }) });
        if (sres.ok) {
          const sj = await sres.json();
          data = (sj.results || []) as MatchRow[];
        }
      } catch { }
      if (!data || data.length === 0) {
        // If server exact search fails, try approximate RPC
        data = await matchDocuments(vec, 5, 0.6);
      }
      // Remove overly-permissive threshold fallback that caused generic matches to dominate
      if (!data || data.length === 0) {
        // fallback 2: exact search RPC (sequential scan)
        const supabase2 = getSupabaseClient();
        const { data: exact, error: exErr } = await (supabase2 as any).rpc('match_documents_exact', {
          query_embedding: vec,
          match_count: 5,
        });
        if (exErr) {
          console.error('exact search error', exErr);
        } else {
          data = exact as MatchRow[];
        }
      }
      if (!data || data.length === 0) {
        // fallback 3: fetch some docs directly to validate RLS/connection
        const supabase = getSupabaseClient();
        const { data: direct, error: derr } = await supabase.from('documents').select('id, work, author, content').limit(3);
        if (derr) throw derr;
        // cast into MatchRow-ish objects without similarity
        data = (direct ?? []).map((d: any) => ({ ...d, similarity: 0 })) as MatchRow[];
      }
      let matches = data ?? [];
      // Diversify by author/work to reduce dominance by a single source
      if (matches.length > 0) {
        const seen = new Set<string>();
        const diverse: MatchRow[] = [];
        for (const m of matches) {
          const key = `${(m as any).author || ''}::${(m as any).work || ''}`.toLowerCase();
          if (!seen.has(key)) {
            seen.add(key);
            diverse.push(m);
          }
          if (diverse.length >= 5) break;
        }
        matches = diverse.length ? diverse : matches;
      }
      // Filter out operational/README-like content from being used in prose
      const isOperational = (m: any) => {
        const a = String(m.author || '').toLowerCase();
        const w = String(m.work || '').toLowerCase();
        const c = String(m.content || '').toLowerCase();
        return (
          a.includes('readme') || w.includes('readme') ||
          a.includes('unknown') && w.includes('readme') ||
          /npm\s+run|yarn\s+|ingest|build|start|script|cli|--dry-run/.test(c)
        );
      };
      matches = matches.filter(m => !isOperational(m));
      setResults(matches);

      // Compose reply: hybrid LLM only under certain conditions
      const tensionScore = computeTension(matches);
      const varietyLow = looksSimilar(lastTwoTextsRef.current[0], lastTwoTextsRef.current[1]);
      const paused = Date.now() - lastInputAtRef.current > 10_000; // 10s beat
      const useLLM = tensionScore > 0.55 || varietyLow || paused;

      let replyText: string | null = null;
      let promptText: string | undefined;
      let stylizerUsed = false;
      const stylizerCooldownOk = Date.now() - lastStylizerAtRef.current > 4000; // 4s cooldown
      if (useLLM && stylizerCooldownOk) {
        const snippets = matches.slice(0, 3).map((m: any) => String(m.content || '').slice(0, 240));
        const keywords = extractWeightedKeywords(matches, 8).map(k => k.term);
        const citations = extractCitations(matches, 2);
        const bans = bansRef.current.slice(-8);
        try {
          const res = await fetch('/api/utter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query: q, snippets, keywords, citations, bans, style: { persona: 'A knowing, terse, enigma-loving, playful philosopher-narrator.', tone: "Early modern clarity inspired by Ockley's 1708 Hayy ibn Yaqzan." } }) });
          if (res.ok) {
            const j = await res.json();
            const candidate = (j?.text || '').trim();
            if (candidate && !looksSimilar(candidate, lastTwoTextsRef.current[0])) {
              replyText = candidate;
              stylizerUsed = true;
              lastStylizerAtRef.current = Date.now();
            }
          }
        } catch { }
      }
      if (!replyText) {
        const utter = await composeGenericReply({ query: q, currentEmb: vec!, history, matches });
        replyText = utter.text; promptText = utter.prompt;
      }

  // Single-line update: only the latest guide text
  setChat((c) => [{ role: 'guide', text: replyText! }]);
  // No extra prompt line; CTA already embedded in the main text when needed

      // Track bans and last outputs for variety
      bansRef.current = [...bansRef.current, replyText!].slice(-20);
      lastTwoTextsRef.current = [replyText!, lastTwoTextsRef.current[0]].slice(0, 2);

      // Compute enigmatic metrics for the upper-left overlay
      const echo = computeEcho(vec!, history);
      const tension = computeTension(matches);
      const drift = computeDrift(history);
  const m = { echo, tension, drift, cache: stylizerUsed ? 'hit' : undefined as 'hit'|'miss'|undefined };
  setGuideMetrics(m);
  try { setBusMetrics(m); } catch {}
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
      setInFlight(false);
    }
  }, [query, ensureEmbedder]);

  // React to shared submit events (from AskPanel or others)
  useEffect(() => {
    // Guard: ignore empty/placeholder queries
    if (!query || !query.trim()) return;
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [submitVersion]);

  useEffect(() => {
    if (results && results.length >= 0) {
      setTextResults(results);
    }
  }, [results, setTextResults])

  if (!task) return null;

  return (
    <div style={{ position: 'absolute', bottom: 16, right: 16, maxWidth: 540, padding: '12px 14px', background: 'rgba(0,0,0,0.5)', color: '#e9f1ff', fontFamily: 'serif', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}>
      {/* <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 6, marginLeft: 4 }}>Guide</div> */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 240, overflowY: 'auto', paddingRight: 8 }}>
        {chat.map((m, i) => (
          <div key={i} style={{ whiteSpace: 'pre-wrap', fontSize: 16, margin: 4, opacity: m.role === 'you' ? 0.9 : 1 }}>
            <span style={{ opacity: 0.7 }}>
              {m.role === 'you' ? 'You' : 'Guide'}: </span>
            {m.text}
          </div>
        ))}
      </div>
      {/* <div style={{ marginTop:8, fontSize: 12, opacity: 0.8 }}>Status: {status}</div> */}
      {/* <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 6 }}><Title text={titleText} /></div> */}
      <div style={{ margin: 0, marginTop: 12, width: '100%', display: 'flex', gap: 8, flexDirection: 'row' }}>
        <input value={query} onChange={(e) => { setQuery(e.target.value); lastInputAtRef.current = Date.now(); }} placeholder="ask about optics, vision, sound..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.25)', color: '#e9f1ff', maxWidth: '420px' }} />
        <button disabled={loading} onClick={run} style={{ marginTop: 8, marginLeft: 12, padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: loading ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)', color: '#e9f1ff', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
function loadEmbedder(): any {
  // Lightweight, deterministic hashing-based vectorizer as a last resort.
  // Not meaningful semantically, but stable for similarity ranking during dev.
  return async (text: string) => {
    const dim = 384;
    const v = new Float32Array(dim);
    const t = (text || '').toLowerCase();
    for (let i = 0; i < t.length; i++) {
      const code = t.charCodeAt(i);
      const j = (code * 131 + i * 17) % dim;
      v[j] += 1;
    }
    // L2 normalize
    let n = 0; for (let i = 0; i < dim; i++) n += v[i] * v[i];
    n = Math.sqrt(n) || 1;
    return Array.from(v, (x) => x / n);
  };
}

// ----- Text generation helpers (single-voice) -----

function defaultPrompt(): string { return randomStarter(); }

function cosine(a: number[], b: number[]): number {
  const n = Math.min(a.length, b.length);
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < n; i++) { const x = a[i]; const y = b[i]; dot += x * y; na += x * x; nb += y * y; }
  return dot / ((Math.sqrt(na) * Math.sqrt(nb)) || 1);
}

function average(arr: number[]): number { return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0; }

type GenericReplyArgs = {
  query: string;
  currentEmb: number[];
  history: Array<{ text: string; ts: number; emb: number[] }>;
  matches: MatchRow[];
}

async function composeGenericReply({ query, currentEmb, history, matches }: GenericReplyArgs): Promise<{ text: string; prompt?: string }> {
  // Compute history weights: recency and strong-match rule
  const weights = weightHistory({ currentEmb, history });
  const recentThemes = topHistoryTokens({ history, weights, take: 3 });
  const kw = extractWeightedKeywords(matches, 8);
  const terms = cleanTerms(kw.map(k => k.term));
  const rankedCites = rankCitations(matches, terms, 2);

  // Detect contradictions or enigma-worthy tensions
  const contradiction = detectContradiction(terms, rankedCites.map(c => ({ author: c.author, work: c.work })));
  if (contradiction) {
    const { a, b, thinkers } = contradiction;
    const thinkerLine = thinkers?.length ? `${thinkers[0]} and ${thinkers[1] || 'a skeptic'}` : 'two stubborn friends';
    const opener = recentThemes.length ? `You orbit ${recentThemes[0]}, and it splits: ${a} vs ${b}.` : `Your query fractures: ${a} vs ${b}.`;
    const prod = `Both can be true, if the frame shifts. ${thinkerLine} would grin.`;
    const ask = `Which side do you want to lean on, or do we keep the hinge and listen to its creak?`;
    const weave = buildPhiloWeave(matches, terms);
    const firstCite = rankedCites.find(c => !(weave.cite && c.author === weave.cite.author && c.work === weave.cite.work));
    const citeLine = firstCite ? vernacularCite(firstCite) : '';
  let text = [opener, weave.line, prod, citeLine].filter(Boolean).join(' ');
  text = ensureCTAClient(text);
  text = tightenUtteranceKeepCTA(text, 260);
  // @@@ opener, weave, prod, cite 
  text = sanitizeFinal(text);
  return { text, prompt: ask };
  }

  const picked = pickN(terms, 2);
  const safePicked = picked.filter(t => !isJunkKeyword(t));
  const themeLine = recentThemes.length
    ? `You keep circling ${recentThemes[0]}${recentThemes[1] ? ` and ${recentThemes[1]}` : ''}.`
    : (safePicked[0] ? `You bring ${safePicked[0]}.` : `You're onto something.`);
  const philoWeave = buildPhiloWeave(matches, terms);
  const riffLine = riffOnKeywords(safePicked as string[], query);
  // Rich two-quote weave path
  const primaryCite = philoWeave.cite;
  let secondCite: (typeof rankedCites)[number] | undefined;
  for (const c of rankedCites) {
    if (!primaryCite || c.author !== primaryCite.author || c.work !== primaryCite.work) { secondCite = c; break; }
  }
  const opticsSoundSet = new Set(['optics', 'vision', 'light', 'eye', 'mirror', 'form', 'color', 'colour', 'sound', 'hearing', 'echo', 'voice', 'acoustics']);
  const domainFocus = terms.some(t => opticsSoundSet.has(t));
  // Only allow dual weave from the 3rd user turn onward (history excludes current input here)
  const allowDual = (history?.length || 0) >= 2;
  const includeSecond = !!secondCite && allowDual && (domainFocus || (secondCite!.score >= 0.9) || Math.random() < 0.3);
  const dual = includeSecond ? buildDualWeave(matches, terms, primaryCite, secondCite) : null;
  const citeLine2 = (!dual && includeSecond && secondCite) ? shortCiteClause(secondCite) : '';

  if (dual) {
    // Build weighted CTA (click/navigate/type) with a hard pause before it
    const cta = chooseCTA();
    let text = [themeLine, dual.text].filter(Boolean).join(' ');
    text = sanitizeFinal(text);
    text = `${text}\n\n${cta}`;
    // No extra prompt; CTA is embedded explicitly
    return { text };
  } else {
    const lines = [themeLine, philoWeave.line, riffLine, citeLine2].filter(Boolean);
    let text = lines.join(' ');
    text = ensureCTAClient(text);
    text = tightenUtteranceKeepCTA(text, 260);
    // @@@ theme, weave, riff, cite
    text = sanitizeFinal(text);
    return { text, prompt: defaultPrompt() };
  }
}

function pickN<T>(arr: T[], n: number): T[] {
  if (!arr || arr.length === 0 || n <= 0) return [] as T[];
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
}

function weightHistory({ currentEmb, history }: { currentEmb: number[]; history: Array<{ text: string; ts: number; emb: number[] }> }): number[] {
  const now = Date.now();
  const tauMs = 10 * 60 * 1000; // 10 minutes half-life-ish
  return history.map((h) => {
    const age = now - h.ts;
    const rec = Math.exp(-age / tauMs);
    const sim = cosine(currentEmb, h.emb);
    const simRounded = Math.round(sim * 10) / 10; // one-decimal precision
    const strongMatch = simRounded === 1.0 ? 1.0 : 0;
    // Full weight if strong-match; otherwise recency * similarity
    const w = strongMatch ? 1.0 : rec * Math.max(0, sim);
    return w;
  });
}

function topHistoryTokens({ history, weights, take = 3 }: { history: Array<{ text: string }>; weights: number[]; take?: number }): string[] {
  const counts: Record<string, number> = {};
  const stop = STOPWORDS;
  history.forEach((h, i) => {
    const w = weights[i] || 0;
    const tokens = tokenize(h.text);
    for (const t of tokens) counts[t] = (counts[t] || 0) + w;
  });
  const arr = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([t]) => t);
  return arr.slice(0, take);
}

function extractWeightedKeywords(matches: MatchRow[], take = 8): Array<{ term: string; score: number }> {
  const counts: Record<string, number> = {};
  for (const m of matches || []) {
    const sim = Number((m as any).similarity ?? 0.5);
    const content = String((m as any).content || '');
    const tokens = tokenize(content);
    for (const t of tokens) counts[t] = (counts[t] || 0) + sim;
  }
  const arr = Object.entries(counts).map(([term, score]) => ({ term, score })).sort((a, b) => b.score - a.score);
  return arr.slice(0, take);
}

function extractCitations(matches: MatchRow[], take = 2): Array<{ author?: string; work?: string }> {
  const seen = new Set<string>();
  const out: Array<{ author?: string; work?: string }> = [];
  for (const m of matches || []) {
    const author = (m as any).author as string | undefined;
    const work = (m as any).work as string | undefined;
    const key = `${author || ''}::${work || ''}`;
    if ((author || work) && !seen.has(key)) {
      seen.add(key);
      out.push({ author, work });
      if (out.length >= take) break;
    }
  }
  return out;
}

function rankCitations(matches: MatchRow[], focusTerms: string[], take = 2): Array<{ author?: string; work?: string; score: number }> {
  const set = new Set((focusTerms || []).map(t => t.toLowerCase()));
  const seen = new Set<string>();
  const scored: Array<{ author?: string; work?: string; score: number }> = [];
  for (const m of matches || []) {
    const author = (m as any).author as string | undefined;
    const work = (m as any).work as string | undefined;
    const content = String((m as any).content || '');
    const sim = Number((m as any).similarity ?? 0);
    const key = `${author || ''}::${work || ''}`;
    if (!author && !work) continue;
    if (seen.has(key)) continue;
    // skip operational
    if (/readme/i.test(author || '') || /readme/i.test(work || '') || /npm\s+run|ingest|--dry-run|build|yarn\s+/i.test(content)) continue;
    const overlap = tokenize(content).filter(t => set.has(t)).length;
    const score = Math.max(0, sim) + overlap * 0.25;
    seen.add(key);
    scored.push({ author, work, score });
  }
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, take);
}

function vernacularCite(c: { author?: string; work?: string }): string {
  const a = (c.author || '').trim();
  const w = (c.work || '').trim();
  if (!a && !w) return '';
  if (/readme/i.test(a) || /readme/i.test(w)) return '';
  // Self-contained cite line (no dangling comma/colon)
  const variants = [
    () => `As ${a}${w ? `, in ${w}` : ''}, has it.`,
    () => `${a}${w ? ` (${w})` : ''} leans this way.`,
    () => `Even ${a}${w ? ` in ${w}` : ''} would nod.`,
  ];
  const pick = variants[(Math.random() * variants.length) | 0];
  return pick();
}

// A short, non-dangling clause for a secondary cite (keeps cadence tight)
function shortCiteClause(c: { author?: string; work?: string }): string {
  const a = (c.author || '').trim();
  const w = (c.work || '').trim();
  if (!a && !w) return '';
  if (/readme/i.test(a) || /readme/i.test(w)) return '';
  const variants = [
    () => `${a}${w ? `, ${w}` : ''} echoes the point.`,
    () => `So does ${a}${w ? `, ${w}` : ''}.`,
    () => `${a}${w ? ` (${w})` : ''} agrees enough.`,
  ];
  const pick = variants[(Math.random() * variants.length) | 0];
  return pick();
}

// Build a richer two-quote weave with a small transition; aim for clarity and a comparison setup.
function buildDualWeave(matches: MatchRow[], focusTerms: string[], a?: { author?: string; work?: string }, b?: { author?: string; work?: string }): { text: string } {
  // Collect candidate sentences keyed by author/work
  const take = Math.min(6, matches.length);
  type Cand = { author?: string; work?: string; s1: string; s2?: string; score: number };
  const keyset = new Set(focusTerms.map(s => s.toLowerCase()));
  const byKey: Record<string, Cand> = {};
  for (let i = 0; i < take; i++) {
    const m: any = matches[i];
    const content = String(m.content || '');
    const author = m.author as string | undefined;
    const work = m.work as string | undefined;
    if (!author && !work) continue;
    const segs = splitSentences(content);
    for (let j = 0; j < segs.length; j++) {
      const seg = segs[j];
      const tok = tokenize(seg);
      const overlap = tok.filter(t => keyset.has(t)).length;
      if (overlap === 0) continue;
      const key = `${author||''}::${work||''}`;
      const s1 = shortenForQuote(seg, 18);
      const s2 = segs[j+1] ? shortenForQuote(segs[j+1], 14) : undefined;
      const score = overlap / Math.max(1, tok.length);
      const cur = byKey[key];
      if (!cur || score > cur.score) byKey[key] = { author, work, s1, s2, score };
    }
  }
  const cands = Object.values(byKey);
  if (cands.length < 2) return { text: '' };
  const pickA = a ? cands.find(c => c.author === a.author && c.work === a.work) || cands[0] : cands[0];
  const pickB = b ? cands.find(c => c.author === b.author && c.work === b.work) || cands[1] : cands[1];
  if (!pickA || !pickB || (pickA.author === pickB.author && pickA.work === pickB.work)) {
    // fallback: simple weave
    const tagA = `${pickA?.author||'one voice'}${pickA?.work?`, ${pickA.work}`:''}`;
    return { text: `As ${tagA} has it: ${pickA?.s1||''}.` };
  }
  const transVariants = [
    (a:string,b:string)=> `Hold these together: ${a} and ${b}.`,
    (a:string,b:string)=> `Set them side by side—${a} and ${b}.`,
    (a:string,b:string)=> `Let two speak: ${a}, then ${b}.`,
  ];
  const nameA = `${pickA.author||'one'}${pickA.work?` (${pickA.work})`:''}`;
  const nameB = `${pickB.author||'another'}${pickB.work?` (${pickB.work})`:''}`;
  const trans = transVariants[(Math.random()*transVariants.length)|0](nameA, nameB);
  const qa = `${pickA.s1}${pickA.s2? ` ${pickA.s2}`:''}`.replace(/\s{2,}/g,' ').trim();
  const qb = `${pickB.s1}${pickB.s2? ` ${pickB.s2}`:''}`.replace(/\s{2,}/g,' ').trim();
  const line = `${trans} ${pickA.author||'One'}: “${qa}” ${pickB.author||'Another'}: “${qb}”`;
  return { text: line };
}

// Weighted CTA (click cubes, navigate environment, or add text)
function chooseCTA(): string {
  try {
    const t = useAgentStore.getState().telemetry;
    const clicks = t.clicks || 0;
    const cam = t.cameraRadius || 0;
    const opts: Array<{w:number, s:()=>string}> = [
      { w: Math.max(1, 4 - clicks), s: ()=> 'Click a cube to tilt the pattern.' },
      { w: cam < 10 ? 3 : 1,        s: ()=> 'Drag or scroll to change your distance.' },
      { w: 2,                        s: ()=> 'Type one word you trust.' },
    ];
    const sum = opts.reduce((a,o)=>a+o.w,0);
    let r = Math.random()*sum;
    for (const o of opts) { if ((r -= o.w) <= 0) return o.s(); }
    return opts[0].s();
  } catch {
    const fallback = ['Click a cube to tilt the pattern.', 'Drag or scroll to change your distance.', 'Type one word you trust.'];
    return fallback[(Math.random()*fallback.length)|0];
  }
}

function riffOnKeywords(kw: string[], query: string): string {
  const [a, b] = kw;
  if (a && b) {
    const variants = [
      () => `${a} and ${b}, side by side.`,
      () => `${a} with ${b}: one will come forward.`,
      () => `Between ${a} and ${b}, the edge appears.`,
    ];
    const pick = variants[(Math.random() * variants.length) | 0];
    return pick();
  }
  if (a) {
    const single = [
      () => `${a} stands out for now.`,
      () => `On ${a}, clarity gathers.`,
      () => `${a} keeps returning.`,
    ];
    const pick = single[(Math.random() * single.length) | 0];
    return pick();
  }
  return '';
}

const STOPWORDS = new Set<string>([
  'the', 'and', 'a', 'an', 'to', 'of', 'in', 'on', 'for', 'with', 'as', 'by', 'is', 'it', 'that', 'this', 'be', 'are', 'was', 'were', 'or', 'at', 'from', 'but', 'so', 'if', 'into', 'about', 'over', 'under', 'between', 'within', 'without', 'you', 'your', 'we', 'our', 'they', 'their', 'i', 'me', 'my', 'mine', 'ours', 'theirs', 'he', 'she', 'his', 'her', 'its', 'not', 'no', 'yes', 'do', 'does', 'did', 'done', 'can', 'could', 'should', 'would', 'will', 'shall'
]);

function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-zA-Z][a-zA-Z\-']+/g) || [])
    .filter(t => !STOPWORDS.has(t) && t.length > 2);
}

function isJunkKeyword(t: string): boolean {
  const junk = new Set<string>(['which', 'there', 'here', 'where', 'when', 'then', 'also', 'much', 'many', 'very', 'thing', 'things', 'any', 'bring']);
  return !t || t.length < 3 || STOPWORDS.has(t) || junk.has(t.toLowerCase());
}

function cleanTerms(terms: string[]): string[] {
  const uniq = Array.from(new Set((terms || []).map(t => String(t || '').trim().toLowerCase())));
  return uniq.filter(t => !isJunkKeyword(t));
}
// --- Metrics helpers ---
function computeEcho(currentEmb: number[], history: Array<{ emb: number[] }>): number {
  if (!history.length) return 0;
  const sims = history.slice(-5).map(h => cosine(currentEmb, h.emb));
  return clamp01(average(sims.map(x => Math.max(0, x))));
}

function computeTension(matches: MatchRow[]): number {
  const kw = extractWeightedKeywords(matches, 12).map(k => k.term);
  const contradiction = detectContradiction(kw, extractCitations(matches, 3));
  if (!contradiction) return 0;
  // crude: higher when both are near top of kw list
  const aIdx = kw.findIndex(t => t === contradiction.a);
  const bIdx = kw.findIndex(t => t === contradiction.b);
  const aScore = aIdx >= 0 ? 1 - aIdx / Math.max(1, kw.length - 1) : 0;
  const bScore = bIdx >= 0 ? 1 - bIdx / Math.max(1, kw.length - 1) : 0;
  return clamp01((aScore + bScore) / 2);
}

function computeDrift(history: Array<{ text: string }>): number {
  if (history.length < 2) return 0;
  const tokens = new Set<string>();
  history.slice(-10).forEach(h => tokenize(h.text).forEach(t => tokens.add(t)));
  // normalize by a soft scale: more unique tokens → more drift
  const count = tokens.size;
  return clamp01(Math.log(1 + count) / Math.log(1 + 50));
}

function clamp01(x: number): number { return Math.max(0, Math.min(1, x)); }

function looksSimilar(a?: string, b?: string): boolean {
  if (!a || !b) return false;
  const na = a.replace(/\s+/g, ' ').toLowerCase();
  const nb = b.replace(/\s+/g, ' ').toLowerCase();
  if (na === nb) return true;
  // simple Jaccard on words
  const sa = new Set(na.split(' '));
  const sb = new Set(nb.split(' '));
  let inter = 0;
  for (const w of sa) if (sb.has(w)) inter++;
  const j = inter / Math.max(1, sa.size + sb.size - inter);
  return j > 0.6;
}

function hasCTAVerb(s: string): boolean {
  return /\b(click|tap|type|enter|name|say|choose|tilt|lean|look|listen)\b/i.test(s);
}

function tightenUtteranceKeepCTA(text: string, maxChars = 260): string {
  let out = (text || '').trim();
  if (out.length <= maxChars) return out;
  const sents = out.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
  if (sents.length === 0) return out.slice(0, maxChars).trim();
  // Keep the last CTA sentence if present
  let cta: string | null = null;
  for (let i = sents.length - 1; i >= 0; i--) {
    if (hasCTAVerb(sents[i])) { cta = sents[i]; sents.splice(i, 1); break; }
  }
  const budget = maxChars - (cta ? cta.length + 1 : 0);
  let acc = '';
  for (const s of sents) {
    if ((acc + (acc ? ' ' : '') + s).length <= budget) {
      acc = acc ? acc + ' ' + s : s;
    } else {
      break;
    }
  }
  if (!acc) acc = sents[0]?.slice(0, Math.max(0, budget)).trim() || '';
  out = cta ? `${acc} ${cta}`.trim() : acc.trim();
  return out;
}

// --- Philosopher weave: pull short, clear fragments from RAG and modernize ---
function buildPhiloWeave(matches: MatchRow[], focusTerms: string[]): { line: string; cite?: { author?: string; work?: string } } {
  if (!matches || matches.length === 0) return { line: '' };
  const sents: Array<{ text: string; author?: string; work?: string; score: number }> = [];
  const keyset = new Set(focusTerms.map(s => s.toLowerCase()));
  const take = Math.min(3, matches.length);
  const looksOperational = (author?: string, work?: string, content?: string) => {
    const a = (author || '').toLowerCase();
    const w = (work || '').toLowerCase();
    const c = (content || '').toLowerCase();
    return a.includes('readme') || w.includes('readme') || /npm\s+run|ingest|--dry-run|yarn\s+/.test(c);
  };
  for (let i = 0; i < take; i++) {
    const m: any = matches[i];
    const content = String(m.content || '');
    const author = m.author as string | undefined;
    const work = m.work as string | undefined;
    if (looksOperational(author, work, content)) continue;
    const segs = splitSentences(content);
    for (const seg of segs) {
      const tok = tokenize(seg);
      const overlap = tok.filter(t => keyset.has(t)).length;
      if (overlap === 0) continue;
      const short = shortenForQuote(seg, 12); // <= ~12 words when quoting
      const clean = modernizeArchaic(short);
      if (clean.length < 6) continue;
      sents.push({ text: clean, author, work, score: overlap / Math.max(1, tok.length) });
    }
  }
  if (sents.length === 0) return { line: '' };
  sents.sort((a, b) => b.score - a.score);
  const top = sents[0];
  const tag = top.author ? `${top.author}${top.work ? `, in the work titled ${top.work}` : ''}` : 'one voice';
  return { line: `As ${tag} has it: ${top.text}.`, cite: { author: top.author, work: top.work } };
}

function splitSentences(text: string): string[] {
  return (text || '')
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function shortenForQuote(sentence: string, maxWords = 12): string {
  const words = sentence.split(/\s+/).filter(Boolean);
  if (words.length <= maxWords) return sentence;
  // prefer to keep a fragment containing sight/sound-related terms
  const interesting = ['sight', 'vision', 'light', 'eye', 'mirror', 'form', 'sound', 'hearing', 'echo', 'voice'];
  const indices = words
    .map((w, i) => ({ w: w.toLowerCase().replace(/[^a-z\-']/g, ''), i }))
    .filter(x => interesting.includes(x.w))
    .map(x => x.i);
  const center = indices.length ? indices[0] : Math.floor(words.length / 2);
  const start = Math.max(0, center - Math.floor(maxWords / 2));
  const slice = words.slice(start, start + maxWords).join(' ');
  return slice.replace(/^[,;:\-—]+|[,;:\-—]+$/g, '');
}

function modernizeArchaic(text: string): string {
  const repl: Array<[RegExp, string]> = [
    [/\bthereof\b/gi, 'of it'],
    [/\bwhereof\b/gi, 'of which'],
    [/\bhereof\b/gi, 'of this'],
    [/\bwhilst\b/gi, 'while'],
    [/\bperadventure\b/gi, 'perhaps'],
    [/\bunto\b/gi, 'to'],
    [/\bMen\b/g, 'people'],
    [/\bsuch like\b/gi, ''],
    [/\bthese sort of\b/gi, 'these'],
  ];
  let out = text;
  for (const [re, to] of repl) out = out.replace(re, to).trim();
  return out.replace(/\s{2,}/g, ' ').trim();
}

function ensureCTAClient(text: string): string {
  const hasCTA = /\b(click|tap|type|enter|name|say|choose|tilt|lean|look|listen)\b/i.test(text);
  if (hasCTA) return text;
  return `${text} ${randomCTA()}`.trim();
}

// Strip clipped or command-like artifacts at the end and remove stray beginnings
function sanitizeFinal(text: string): string {
  if (!text) return text;
  let out = text.trim();
  // Remove trailing fragments like ': it', '—it', ', it', or lone colon/hyphen
  out = out.replace(/[:\u2014\-]\s*(it|this|that)\.?\s*$/i, '.');
  out = out.replace(/[:\u2014\-]\s*$/,'');
  // Remove programmatic phrasing
  out = out.replace(/\bchoose one to push\b/gi, '');
  // Collapse spaces and tidy
  out = out.replace(/\s{2,}/g, ' ').trim();
  // Ensure ends with period if missing
  if (!/[.!?]\s*$/.test(out)) out += '.';
  return out;
}

// --- Contradiction detection ---
function detectContradiction(terms: string[], cites: Array<{ author?: string; work?: string }>): { a: string; b: string; thinkers?: string[] } | null {
  const pairs: Array<[string, string]> = [
    ['light', 'darkness'],
    ['silence', 'noise'],
    ['order', 'chaos'],
    ['being', 'nothing'],
    ['appearance', 'reality'],
    ['body', 'mind'],
    ['reason', 'emotion'],
    ['one', 'many'],
    ['finite', 'infinite'],
  ];
  const set = new Set(terms.map(t => t.toLowerCase()));
  for (const [a, b] of pairs) {
    if (set.has(a) && set.has(b)) {
      const thinkers = opposingThinkers(cites);
      return { a, b, thinkers };
    }
  }
  // If terms suggest paradox (e.g., both 'stillness' and 'motion')
  if (set.has('stillness') && set.has('motion')) {
    return { a: 'stillness', b: 'motion', thinkers: opposingThinkers(cites) };
  }
  return null;
}

function opposingThinkers(cites: Array<{ author?: string; work?: string }>): string[] | undefined {
  const pool = cites.map(c => c.author).filter(Boolean) as string[];
  // Fallback pairs if RAG lacks explicit authors
  // Revisit this list now that the relevant vector data is clearer
  const canonicalPairs: Array<[string, string]> = [
    ['Heraclitus', 'Parmenides'],
    ['Plato', 'Aristotle'],
    ['Descartes', 'Hume'],
    ['Kant', 'Nietzsche'],
    ['Wittgenstein', 'Heidegger'],
  ];
  if (pool.length >= 2) return pickN(Array.from(new Set(pool)), 2);
  const picked = pickN(canonicalPairs, 1)[0];
  return picked ? [picked[0], picked[1]] : undefined;
}

