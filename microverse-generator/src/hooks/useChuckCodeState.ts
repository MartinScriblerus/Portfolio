/**
 * Hook to observe current ChucK code state
 * Provides current code, errors, and state changes for RAG system
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { inspectChuckCode, InspectionResult } from '../lib/code-inspection/inspect-chuck';

export interface ChuckCodeState {
  code: string | null;
  codeHash: string | null; // Hash to detect changes
  inspection: InspectionResult | null;
  lastUpdated: number;
  error: string | null;
}

/**
 * Observe ChucK code state from UI
 * Polls for changes and provides inspection results
 */
export function useChuckCodeState(pollInterval: number = 2000): ChuckCodeState {
  const [state, setState] = useState<ChuckCodeState>({
    code: null,
    codeHash: null,
    inspection: null,
    lastUpdated: 0,
    error: null,
  });

  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const getCurrentCode = useCallback(async (): Promise<string | null> => {
    // Code state is populated via custom events from ChuckSetup
    // ChuckSetup emits 'chuck:code-updated' events when code changes
    // This function is kept for future direct access if needed
    return null;
  }, []);

  const updateState = useCallback(async () => {
    const code = await getCurrentCode();
    
    if (!code) {
      setState(prev => ({
        ...prev,
        code: null,
        codeHash: null,
        inspection: null,
        error: null,
      }));
      return;
    }

    // Hash code to detect changes
    const codeHash = await hashString(code);
    
    // Only update if code changed
    if (codeHash === state.codeHash) {
      return;
    }

    // Inspect code
    const inspection = inspectChuckCode(code);

    setState({
      code,
      codeHash,
      inspection,
      lastUpdated: Date.now(),
      error: null,
    });
  }, [getCurrentCode, state.codeHash]);

  useEffect(() => {
    // Initial update
    updateState();

    // Poll for changes
    pollRef.current = setInterval(updateState, pollInterval);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [updateState, pollInterval]);

  // Listen for custom events from ChuckSetup when code changes
  useEffect(() => {
    const handleCodeUpdate = (event: CustomEvent<{ code: string }>) => {
      const code = event.detail.code;
      hashString(code).then(codeHash => {
        const inspection = inspectChuckCode(code);
        setState({
          code,
          codeHash,
          inspection,
          lastUpdated: Date.now(),
          error: null,
        });
      });
    };

    window.addEventListener('chuck:code-updated', handleCodeUpdate as EventListener);
    
    return () => {
      window.removeEventListener('chuck:code-updated', handleCodeUpdate as EventListener);
    };
  }, []);

  return state;
}

/**
 * Simple string hash function
 */
async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  // Convert to ArrayBuffer to satisfy TypeScript's strict typing
  const buffer = data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength);
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Format code state for RAG context
 */
export function formatCodeStateForRAG(state: ChuckCodeState): string {
  if (!state.code) {
    return 'No ChucK code currently active.';
  }

  const parts: string[] = [];
  parts.push(`Current ChucK code (${state.code.split('\n').length} lines):`);
  parts.push('```chuck');
  parts.push(state.code);
  parts.push('```');

  if (state.inspection) {
    if (!state.inspection.valid) {
      parts.push('\n⚠️ Code has issues:');
      state.inspection.issues.forEach(issue => {
        parts.push(`- ${issue.type === 'error' ? '❌' : '⚠️'} ${issue.message}`);
        if (issue.suggestion) {
          parts.push(`  💡 ${issue.suggestion}`);
        }
      });
    }

    if (state.inspection.suggestions.length > 0) {
      parts.push('\n💡 Suggestions:');
      state.inspection.suggestions.forEach(s => parts.push(`- ${s}`));
    }
  }

  return parts.join('\n');
}
