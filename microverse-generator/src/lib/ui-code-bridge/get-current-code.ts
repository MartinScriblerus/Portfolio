/**
 * UI Code Bridge
 * Gets current ChucK code from UI state
 * Helps bridge between UI interactions and generated code
 * 
 * IMPORTANT: Use the `useChuckCodeState` hook instead of these functions.
 * The hook listens for 'chuck:code-updated' events from ChuckSetup.
 * 
 * To get current code in a component:
 * ```ts
 * import { useChuckCodeState } from '../hooks/useChuckCodeState';
 * 
 * const codeState = useChuckCodeState();
 * const currentCode = codeState.code; // Current ChucK code or null
 * const inspection = codeState.inspection; // Code inspection results
 * ```
 * 
 * ChuckSetup should emit 'chuck:code-updated' events when code changes:
 * ```ts
 * window.dispatchEvent(new CustomEvent('chuck:code-updated', { 
 *   detail: { code: generatedCode } 
 * }));
 * ```
 */

/**
 * @deprecated Use useChuckCodeState hook instead
 * This function is kept for backwards compatibility but returns null.
 * The hook automatically listens for code updates via events.
 */
export async function getCurrentChuckCode(): Promise<string | null> {
  console.warn('[getCurrentChuckCode] Deprecated: Use useChuckCodeState hook instead');
  return null;
}

/**
 * @deprecated Use useChuckCodeState hook instead
 */
export async function getCurrentCodeFromRefs(): Promise<string | null> {
  console.warn('[getCurrentCodeFromRefs] Deprecated: Use useChuckCodeState hook instead');
  return null;
}

/**
 * Compare UI-generated code with user-provided code
 * Useful for debugging differences
 */
export function compareCodes(uiCode: string, userCode: string): {
  identical: boolean;
  differences: Array<{ line: number; ui: string; user: string }>;
} {
  const uiLines = uiCode.split('\n');
  const userLines = userCode.split('\n');
  const differences: Array<{ line: number; ui: string; user: string }> = [];

  const maxLines = Math.max(uiLines.length, userLines.length);
  
  for (let i = 0; i < maxLines; i++) {
    const uiLine = uiLines[i] || '';
    const userLine = userLines[i] || '';
    
    if (uiLine.trim() !== userLine.trim()) {
      differences.push({
        line: i + 1,
        ui: uiLine,
        user: userLine,
      });
    }
  }

  return {
    identical: differences.length === 0,
    differences,
  };
}

