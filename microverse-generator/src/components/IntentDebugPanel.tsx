'use client';

import { useIntentDebugStore } from '../store/useIntentDebugStore';
import { useState } from 'react';

// Minimal floating panel (dev only) to visualize last intent outputs.
// You can conditionally render this only in development.

export function IntentDebugPanel() {
  const { last, history, clear } = useIntentDebugStore();
  const [open, setOpen] = useState(false);
  if (!last) return null;
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, fontFamily: 'monospace', zIndex: 9999 }}>
      <button style={{ fontSize: 11, padding: '2px 6px' }} onClick={() => setOpen(o => !o)}>
        intent {open ? '▼' : '▲'}
      </button>
      {open && (
        <div style={{ background: 'rgba(0,0,0,0.72)', color: '#ddd', padding: 8, width: 320, maxHeight: 320, overflow: 'auto', border: '1px solid #444', borderRadius: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <strong style={{ fontSize: 12 }}>Last intent</strong>
            <button style={{ fontSize: 10 }} onClick={clear}>clear</button>
          </div>
          <div style={{ fontSize: 11, marginBottom: 4 }}>
            <div><span style={{ color: '#888' }}>query:</span> {last.query}</div>
            {last.visual?.targetColor && (
              <div><span style={{ color: '#888' }}>target:</span> rgb({last.visual.targetColor.r},{last.visual.targetColor.g},{last.visual.targetColor.b})</div>
            )}
            {last.audio && (
              <div><span style={{ color: '#888' }}>audio:</span> {JSON.stringify(last.audio)}</div>
            )}
            {last.stats && (
              <div style={{ marginTop: 4, lineHeight: 1.3 }}>
                <span style={{ color: '#888' }}>stats:</span>{' '}
                top {last.stats.topSim?.toFixed(3)} | mean5 {last.stats.meanTop5?.toFixed(3)} | med {last.stats.median?.toFixed(3)}<br />
                thr {last.stats.thresholdUsed?.toFixed(3)} | kept {last.stats.filteredCount}/{last.stats.count} | cache {last.stats.cacheHit ? 'hit' : 'miss'}
              </div>
            )}
          </div>
          {last.visual?.ops && (
            <details open>
              <summary style={{ cursor: 'pointer' }}>ops</summary>
              <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{JSON.stringify(last.visual.ops, null, 2)}</pre>
            </details>
          )}
          {last.sources && (
            <details>
              <summary style={{ cursor: 'pointer' }}>sources ({last.sources.length})</summary>
              <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{JSON.stringify(last.sources.slice(0,6), null, 2)}</pre>
            </details>
          )}
          <details>
            <summary style={{ cursor: 'pointer' }}>history ({history.length})</summary>
            <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }}>{history.slice(0,8).map(h => `${Math.round((performance.now()-h.at)/1000)}s ago: ${h.query}`).join('\n')}</pre>
          </details>
        </div>
      )}
    </div>
  );
}
