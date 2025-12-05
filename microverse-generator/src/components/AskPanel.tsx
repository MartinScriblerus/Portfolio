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
    <div 
      role="region"
      aria-label="Ask panel"
      style={{ position: 'absolute', top: 16, right: 16, width: 380, padding: '12px 14px', background: 'rgba(0,0,0,0.45)', color: '#e9f1ff', fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8, zIndex: 10050 }}
    >
      <div>
        <label htmlFor="ask-panel-input" className="sr-only">
          Ask about optics, vision, or sound
        </label>
        <input 
          id="ask-panel-input"
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="ask about optics, vision, sound..." 
          aria-label="Ask about optics, vision, or sound"
          style={{ width: '100%', padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: 'rgba(0,0,0,0.25)', color: '#e9f1ff' }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !inFlight && query.trim()) {
              run();
            }
          }}
        />
        <button 
          id="ask-panel-send"
          disabled={inFlight} 
          onClick={run}
          aria-label={inFlight ? 'Sending query' : 'Send query'}
          style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.18)', background: inFlight ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.25)', color: '#e9f1ff', cursor: inFlight ? 'default' : 'pointer' }}
        >
          {inFlight ? 'SSSSSending…' : 'Send'}
        </button>
      </div>
    </div>
  );
}
