/**
 * ChucK Code Inspection Utility
 * Analyzes ChucK code for errors, warnings, and suggestions
 */

export interface CodeIssue {
  type: 'error' | 'warning' | 'info';
  line?: number;
  column?: number;
  message: string;
  suggestion?: string;
}

export interface InspectionResult {
  valid: boolean;
  issues: CodeIssue[];
  suggestions: string[];
}

/**
 * Inspect ChucK code for common issues
 */
export function inspectChuckCode(code: string): InspectionResult {
  const issues: CodeIssue[] = [];
  const suggestions: string[] = [];
  const lines = code.split('\n');

  // Check for empty code
  if (!code.trim()) {
    issues.push({
      type: 'error',
      message: 'Code is empty',
      suggestion: 'Add ChucK code to execute',
    });
    return { valid: false, issues, suggestions };
  }

  // Check for common syntax issues
  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const trimmed = line.trim();

    // Check for unclosed strings
    const stringMatches = trimmed.match(/"/g);
    if (stringMatches && stringMatches.length % 2 !== 0) {
      issues.push({
        type: 'error',
        line: lineNum,
        message: 'Unclosed string literal',
        suggestion: 'Close the string with a double quote',
      });
    }

    // Check for missing semicolons (common ChucK issue)
    if (trimmed && !trimmed.startsWith('//') && !trimmed.startsWith('/*')) {
      // Lines that should end with semicolon (but not comments or control flow)
      const needsSemicolon = /(=>|@=>|=>\s*[a-zA-Z]|;\s*$)/.test(trimmed);
      if (!needsSemicolon && !trimmed.endsWith(';') && !trimmed.endsWith('{') && !trimmed.endsWith('}')) {
        // This is a warning, not an error (ChucK is flexible)
        if (trimmed.length > 10) { // Only warn on substantial lines
          issues.push({
            type: 'warning',
            line: lineNum,
            message: 'Line may need a semicolon',
            suggestion: 'Add semicolon at end of statement',
          });
        }
      }
    }

    // Check for common typos
    if (trimmed.includes('dac') && !trimmed.includes('=>') && !trimmed.includes('@=>')) {
      issues.push({
        type: 'warning',
        line: lineNum,
        message: 'dac used without connection operator',
        suggestion: 'Use => or @=> to connect to dac',
      });
    }

    // Check for infinite loops without time advancement
    if (trimmed.includes('while') && !trimmed.includes('now') && !trimmed.includes('=> now')) {
      const nextLines = lines.slice(index, index + 5).join(' ');
      if (!nextLines.includes('=> now') && !nextLines.includes('::')) {
        issues.push({
          type: 'warning',
          line: lineNum,
          message: 'while loop may need time advancement',
          suggestion: 'Add time advancement (e.g., 1::second => now;) to avoid infinite loop',
        });
      }
    }
  });

  // Check for missing dac connection
  if (!code.includes('dac') && !code.includes('adc')) {
    suggestions.push('Consider connecting output to dac for audio playback');
  }

  // Check for time advancement
  if (!code.includes('=> now') && !code.includes('::')) {
    suggestions.push('Add time advancement to allow code to execute (e.g., 1::second => now;)');
  }

  // Check for proper UGen connections
  const ugenPattern = /\b(SinOsc|SawOsc|SqrOsc|TriOsc|Noise|Impulse|Step)\b/;
  if (ugenPattern.test(code) && !code.includes('=>')) {
    issues.push({
      type: 'warning',
      message: 'UGens detected but no connections found',
      suggestion: 'Connect UGens using => or @=> operators',
    });
  }

  // Best practices suggestions
  if (code.length > 500 && !code.includes('//')) {
    suggestions.push('Consider adding comments for complex code');
  }

  const hasErrors = issues.some(i => i.type === 'error');
  
  return {
    valid: !hasErrors,
    issues,
    suggestions,
  };
}

/**
 * Format inspection result for display
 */
export function formatInspectionResult(result: InspectionResult): string {
  if (result.valid && result.issues.length === 0 && result.suggestions.length === 0) {
    return '✅ Code looks good!';
  }

  const parts: string[] = [];
  
  if (!result.valid) {
    parts.push('❌ Code has errors:');
  } else if (result.issues.length > 0) {
    parts.push('⚠️ Code has warnings:');
  }

  result.issues.forEach(issue => {
    const location = issue.line ? `Line ${issue.line}` : '';
    const icon = issue.type === 'error' ? '❌' : '⚠️';
    parts.push(`${icon} ${location} ${issue.message}`);
    if (issue.suggestion) {
      parts.push(`   💡 ${issue.suggestion}`);
    }
  });

  if (result.suggestions.length > 0) {
    parts.push('\n💡 Suggestions:');
    result.suggestions.forEach(s => parts.push(`   • ${s}`));
  }

  return parts.join('\n');
}
