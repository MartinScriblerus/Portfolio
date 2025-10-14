'use client';

import React, { useCallback, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { matchDocuments, type MatchRow, getSupabaseClient } from '../rag/querySupabase';

// Lazy import transformers at runtime to avoid SSR issues
const loadEmbedder = async () => {
  const t = await import('@xenova/transformers');
  const { pipeline } = t as any;
  const extractor = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  return async (text: string) => {
    const out = await extractor(text, { pooling: 'mean', normalize: true });
    return Array.from(out.data as Float32Array);
  };
};

export default function AskPanel() {
  const [query, setQuery] = useState('vision and distance');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<MatchRow[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const embedderRef = useRef<null | ((text: string) => Promise<number[]>)>(null);

  const ensureEmbedder = useCallback(async () => {
    if (!embedderRef.current) {
      embedderRef.current = await loadEmbedder();
    }
    return embedderRef.current;
  }, []);

  const run = useCallback(async () => {
    setLoading(true); setErr(null);
    try {
      // Prefer server-side embedding to avoid browser CORS on model downloads
      const apiRes = await fetch('/api/embed', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: query }) });
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
        const embed = await ensureEmbedder();
        vec = await embed(query);
      }
      if (!vec) throw new Error('Could not construct embedding vector');
      // First try the new server-side exact search for reliable results on tiny datasets
      let data: MatchRow[] | null = null;
      try {
        const sres = await fetch('/api/rag/search', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: query, k: 5 }) });
        if (sres.ok) {
          const sj = await sres.json();
          data = (sj.results || []) as MatchRow[];
        }
      } catch {}
      if (!data || data.length === 0) {
        // If server exact search fails, try approximate RPC
        data = await matchDocuments(vec, 5, 0.6);
      }
      if (!data || data.length === 0) {
        // fallback 1: widen threshold further
        data = await matchDocuments(vec, 5, -1.0);
      }
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
      setResults(data ?? []);
    } catch (e: any) {
      setErr(e?.message || String(e));
    } finally {
      setLoading(false);
    }
  }, [query, ensureEmbedder]);

  return (
    <div style={{ position:'absolute', top: 16, right: 16, width: 380, padding:'12px 14px', background:'rgba(0,0,0,0.45)', color:'#e9f1ff', fontFamily:'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', border:'1px solid rgba(255,255,255,0.15)', borderRadius:8 }}>
      <div style={{ fontSize: 14, opacity: 0.8, marginBottom: 6 }}>RAG test</div>
      <div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ask about optics, vision, sound..." style={{ width:'100%', padding:'8px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.18)', background:'rgba(0,0,0,0.25)', color:'#e9f1ff' }} />
        <button disabled={loading} onClick={run} style={{ marginTop:8, padding:'8px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.18)', background: loading ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)', color:'#e9f1ff', cursor: loading ? 'default' : 'pointer' }}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>
      {err && <div style={{ marginTop:8, color:'#ffb3b3' }}>{err}</div>}
      <div style={{ marginTop:8 }}>
        {results.map((r) => (
          <div key={r.id} style={{ marginBottom:8, padding:'8px', background:'rgba(255,255,255,0.06)', borderRadius:6 }}>
            <div style={{ fontSize:12, opacity:0.8 }}>{r.author} — {r.work} ({Math.round(r.similarity*100)}%)</div>
            <div style={{ fontSize:14, whiteSpace:'pre-wrap' }}>{r.content}</div>
          </div>
        ))}
        {!results.length && !loading && <div style={{ fontSize: 12, opacity: 0.75 }}>No results yet.</div>}
      </div>
    </div>
  );
}
