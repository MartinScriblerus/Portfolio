/**
 * Component for displaying ChucK code in a copyable format for WebChucK IDE
 */

'use client';

import { useState } from 'react';
import { DSPDoc } from '../types/dsp-rag';
import { formatDSPCodeForIDE } from '../lib/dsp-rag/search-dsp-docs';

interface ChuckCodeDisplayProps {
  doc: DSPDoc & { similarity?: number };
  onCopy?: (code: string) => void;
}

export default function ChuckCodeDisplay({ doc, onCopy }: ChuckCodeDisplayProps) {
  const [copied, setCopied] = useState(false);
  
  // Extract actual code - formatDSPCodeForIDE now prefers 'content' field
  let code = formatDSPCodeForIDE(doc);
  
  // If the code still looks like metadata (contains "---" separators or is just a description), 
  // try to use content field directly
  if ((code.includes('---') && !code.includes('=>')) || (code.length < 50 && !code.includes('=>'))) {
    // Prefer 'content' field which should have actual code
    if (doc.content && doc.content.trim().length > 20) {
      const header = `// ${doc.title || 'ChucK Example'}\n`;
      code = header + doc.content.trim();
    } else if (code.includes('[') && code.includes(']')) {
      // Might be a JSON array string - try to parse it
      try {
        const parsed = JSON.parse(code);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const firstItem = String(parsed[0] || '');
          if (firstItem.length > 50 && firstItem.includes('=>')) {
            code = firstItem;
          }
        }
      } catch {
        // Not JSON, keep original
      }
    }
  }
  
  const similarity = doc.similarity ? `${(doc.similarity * 100).toFixed(0)}% match` : '';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onCopy?.(code);
    });
  };
  
  return (
    <div style={{
      marginTop: 12,
      padding: '12px',
      background: 'rgba(0,0,0,0.6)',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: 6,
      fontFamily: 'monospace',
      fontSize: '11px'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: 8
      }}>
        <div>
          <strong style={{ color: '#e9f1ff' }}>{doc.title || 'ChucK Code'}</strong>
          {similarity && (
            <span style={{ marginLeft: 8, opacity: 0.7, fontSize: '10px' }}>
              {similarity}
            </span>
          )}
        </div>
        <button
          onClick={handleCopy}
          style={{
            padding: '4px 8px',
            fontSize: '10px',
            background: copied ? 'rgba(74,222,128,0.3)' : 'rgba(255,255,255,0.1)',
            border: '1px solid rgba(255,255,255,0.2)',
            borderRadius: 4,
            color: '#e9f1ff',
            cursor: 'pointer'
          }}
        >
          {copied ? '✓ Copied' : 'Copy to IDE'}
        </button>
      </div>
      
      <pre style={{
        margin: 0,
        padding: '8px',
        background: 'rgba(0,0,0,0.4)',
        borderRadius: 4,
        overflowX: 'auto',
        whiteSpace: 'pre',
        color: '#e9f1ff',
        fontSize: '11px',
        lineHeight: '1.4'
      }}>
        <code>{code}</code>
      </pre>
      
      {doc.perceptual_tags && doc.perceptual_tags.length > 0 && (
        <div style={{ 
          marginTop: 8, 
          fontSize: '10px', 
          opacity: 0.7,
          display: 'flex',
          gap: 4,
          flexWrap: 'wrap'
        }}>
          {doc.perceptual_tags.map(tag => (
            <span key={tag} style={{
              padding: '2px 6px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: 3
            }}>
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
