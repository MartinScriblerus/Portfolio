/**
 * Component for selecting .wav files when multiple candidates are found
 */

'use client';

import { useState } from 'react';
import { getAvailableWavFiles } from '../utils/wavFileMatcher';

interface WavFileSelectorProps {
  originalFile: string;
  candidates: Array<{ filename: string; distance: number }>;
  onSelect: (selectedFile: string) => void;
  onCancel?: () => void;
}

export default function WavFileSelector({
  originalFile,
  candidates,
  onSelect,
  onCancel
}: WavFileSelectorProps) {
  const [selected, setSelected] = useState<string | null>(
    candidates[0]?.distance === 0 ? candidates[0].filename : null
  );

  const handleConfirm = () => {
    if (selected) {
      onSelect(selected);
    }
  };

  return (
    <div style={{
      marginTop: 12,
      padding: '12px',
      background: 'rgba(0,0,0,0.7)',
      border: '1px solid rgba(255,255,255,0.3)',
      borderRadius: 6,
      fontSize: '11px'
    }}>
      <div style={{ marginBottom: 8, fontWeight: 'bold', color: '#e9f1ff' }}>
        🎵 Select .wav file for: <code style={{ opacity: 0.8 }}>{originalFile}</code>
      </div>
      
      <div style={{ marginBottom: 12 }}>
        {candidates.slice(0, 5).map((candidate) => (
          <label
            key={candidate.filename}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '6px 8px',
              marginBottom: 4,
              background: selected === candidate.filename 
                ? 'rgba(74,222,128,0.2)' 
                : 'rgba(255,255,255,0.05)',
              border: selected === candidate.filename
                ? '1px solid rgba(74,222,128,0.5)'
                : '1px solid rgba(255,255,255,0.1)',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            <input
              type="radio"
              name={`wav-${originalFile}`}
              value={candidate.filename}
              checked={selected === candidate.filename}
              onChange={(e) => setSelected(e.target.value)}
              style={{ marginRight: 8 }}
            />
            <span style={{ flex: 1, color: '#e9f1ff' }}>
              {candidate.filename}
            </span>
            {candidate.distance === 0 && (
              <span style={{ fontSize: '9px', opacity: 0.7, color: '#4ade80' }}>
                exact match
              </span>
            )}
            {candidate.distance > 0 && (
              <span style={{ fontSize: '9px', opacity: 0.5 }}>
                ({candidate.distance} diff)
              </span>
            )}
          </label>
        ))}
      </div>
      
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        {onCancel && (
          <button
            onClick={onCancel}
            style={{
              padding: '4px 12px',
              fontSize: '10px',
              background: 'rgba(255,255,255,0.1)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: '#e9f1ff',
              cursor: 'pointer'
            }}
          >
            Skip
          </button>
        )}
        <button
          onClick={handleConfirm}
          disabled={!selected}
          style={{
            padding: '4px 12px',
            fontSize: '10px',
            background: selected 
              ? 'rgba(74,222,128,0.3)' 
              : 'rgba(255,255,255,0.1)',
            border: selected
              ? '1px solid rgba(74,222,128,0.5)'
              : '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: selected ? '#4ade80' : '#888',
            cursor: selected ? 'pointer' : 'not-allowed'
          }}
        >
          Use Selected
        </button>
      </div>
    </div>
  );
}
