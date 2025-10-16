'use client';

import React, { useCallback } from 'react';
import { useQueryStore } from '../store/useQueryStore';

export default function AskPanel() {
  const query = useQueryStore((s)=> s.query);
  const setQuery = useQueryStore((s)=> s.setQuery);
  const submit = useQueryStore((s)=> s.submit);
  const inFlight = useQueryStore((s)=> s.inFlight);

  const run = useCallback(() => {
    submit('ask-panel');
    setQuery('');
  }, [submit]);

  return (
    <div style={{ position: 'absolute', top: 16, right: 16, width: 380, padding: '12px 14px', background: 'rgba(0,0,0,0.45)', color: '#e9f1ff', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8 }}>
      <div>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ask about optics, vision, sound..." style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.25)', color: '#e9f1ff' }} />
        <button disabled={inFlight} onClick={run} style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: inFlight ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)', color: '#e9f1ff', cursor: inFlight ? 'default' : 'pointer' }}>
          {inFlight ? 'Sending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
