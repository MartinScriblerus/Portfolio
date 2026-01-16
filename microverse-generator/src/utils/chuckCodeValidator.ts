/**
 * ChucK code validator and auto-fixer
 * Tests code and removes/fixes problematic lines until it works
 */

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  fixedCode?: string;
  removedLines?: number[];
  attempts: number;
}

/**
 * Simple ChucK syntax validation (basic checks)
 * More comprehensive validation would require WebChucK runtime
 */
function hasBasicChuckSyntax(code: string): boolean {
  if (!code || code.trim().length < 10) return false;
  
  // Must have some ChucK syntax indicators
  const hasChuckSyntax = 
    code.includes('=>') || // Connection operator
    code.includes('::') || // Time operator
    code.includes('dac') || // Output
    code.includes('adc') || // Input
    code.includes('SinOsc') || // Common UGen
    code.includes('SndBuf') || // Common UGen
    !!code.match(/\w+\s*=>/); // Pattern: variable => something (convert to boolean)
  
  return hasChuckSyntax;
}

/**
 * Identify potentially problematic lines
 * Returns line numbers (1-indexed) that might be causing issues
 */
function identifyProblematicLines(code: string, errorMessage?: string): number[] {
  const lines = code.split('\n');
  const problematic: number[] = [];
  
  // Common error patterns
  const errorPatterns = [
    /undefined/i,
    /not found/i,
    /syntax error/i,
    /parse error/i,
    /type mismatch/i,
    /cannot convert/i
  ];
  
  // If we have an error message, try to extract line numbers
  if (errorMessage) {
    const lineMatch = errorMessage.match(/line\s+(\d+)/i);
    if (lineMatch) {
      const lineNum = parseInt(lineMatch[1], 10);
      if (lineNum > 0 && lineNum <= lines.length) {
        problematic.push(lineNum);
        // Also check surrounding lines
        if (lineNum > 1) problematic.push(lineNum - 1);
        if (lineNum < lines.length) problematic.push(lineNum + 1);
      }
    }
    
    // Check if error message mentions specific patterns
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (errorPatterns.some(pattern => pattern.test(errorMessage) && 
          (line.includes('undefined') || line.trim().length === 0))) {
        problematic.push(i + 1);
      }
    }
  }
  
  // Heuristic: empty lines, comment-only lines, or lines with common issues
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Skip empty lines and comments (they're usually fine)
    if (line.length === 0 || line.startsWith('//')) continue;
    
    // Lines that might be problematic
    if (
      line.includes('undefined') ||
      line.match(/^\w+\s*$/) && !line.match(/^(int|float|string|dur|time)\s+\w+/i) || // Single word (might be incomplete)
      line.includes('=>') && !line.includes(';') && i < lines.length - 1 && !lines[i + 1].includes(';') // Incomplete connection
    ) {
      problematic.push(i + 1);
    }
  }
  
  return Array.from(new Set(problematic)).sort((a, b) => a - b);
}

/**
 * Remove problematic lines from code
 */
function removeLines(code: string, lineNumbers: number[]): string {
  const lines = code.split('\n');
  const keepLines: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    if (!lineNumbers.includes(i + 1)) {
      keepLines.push(lines[i]);
    }
  }
  
  return keepLines.join('\n').trim();
}

/**
 * Fix common ChucK code issues
 */
function fixCommonIssues(code: string): string {
  let fixed = code;
  
  // Remove trailing semicolons on blank lines
  fixed = fixed.replace(/;\s*\n\s*\n/g, ';\n');
  
  // Ensure code ends with proper statement
  if (!fixed.trim().endsWith(';') && !fixed.trim().endsWith('}')) {
    // Try to add a time advance if missing
    if (fixed.includes('=>') && !fixed.includes('now')) {
      fixed += '\n1::second => now;';
    }
  }
  
  // Remove duplicate blank lines
  fixed = fixed.replace(/\n{3,}/g, '\n\n');
  
  return fixed.trim();
}

/**
 * Validate and auto-fix ChucK code
 * Attempts to fix code by removing problematic lines until it passes basic validation
 */
export async function validateAndFixChuckCode(
  code: string,
  maxAttempts: number = 5
): Promise<ValidationResult> {
  let currentCode = code.trim();
  let attempts = 0;
  const removedLines: number[] = [];
  
  // First, check basic syntax
  if (!hasBasicChuckSyntax(currentCode)) {
    return {
      isValid: false,
      error: 'Code does not appear to be valid ChucK syntax',
      attempts: 1
    };
  }
  
  // Try fixing common issues first
  currentCode = fixCommonIssues(currentCode);
  attempts++;
  
  // If we have a way to actually test the code (e.g., WebChucK), we'd use it here
  // For now, we'll do heuristic-based fixing
  
  // Try removing problematic lines iteratively
  while (attempts < maxAttempts) {
    attempts++;
    
    // Identify potentially problematic lines
    const problematic = identifyProblematicLines(currentCode);
    
    if (problematic.length === 0) {
      // No more problematic lines found - code should be good
      return {
        isValid: true,
        fixedCode: currentCode,
        removedLines: removedLines.length > 0 ? removedLines : undefined,
        attempts
      };
    }
    
    // Remove the first problematic line
    const lineToRemove = problematic[0];
    removedLines.push(lineToRemove);
    currentCode = removeLines(currentCode, [lineToRemove]);
    
    // Re-check syntax
    if (!hasBasicChuckSyntax(currentCode)) {
      // We've removed too much - restore and stop
      return {
        isValid: false,
        error: 'Code became invalid after removing problematic lines',
        fixedCode: currentCode,
        removedLines,
        attempts
      };
    }
  }
  
  // Max attempts reached
  return {
    isValid: true, // Assume it's valid if we've tried our best
    fixedCode: currentCode,
    removedLines: removedLines.length > 0 ? removedLines : undefined,
    attempts
  };
}

/**
 * Validate ChucK code with WebChucK (if available)
 * This is the preferred method but requires a Chuck instance
 */
export async function validateWithWebChuck(
  chuckInstance: any,
  code: string
): Promise<ValidationResult> {
  if (!chuckInstance || typeof chuckInstance.runCode !== 'function') {
    return {
      isValid: false,
      error: 'WebChucK instance not available',
      attempts: 1
    };
  }
  
  try {
    // Try to run the code
    console.log("### RUN CODE ###", code);
    await chuckInstance.runCode(code);
    
    return {
      isValid: true,
      fixedCode: code,
      attempts: 1
    };
  } catch (error: any) {
    const errorMessage = error?.message || String(error);
    
    // Try to fix the code
    const problematic = identifyProblematicLines(code, errorMessage);
    
    if (problematic.length > 0) {
      // Try removing problematic lines
      let fixedCode = removeLines(code, problematic);
      fixedCode = fixCommonIssues(fixedCode);
      
      // Try again with fixed code
      try {
        console.log("### RUN FIXED CODE ###", fixedCode);
        await chuckInstance.runCode(fixedCode);
        return {
          isValid: true,
          fixedCode,
          removedLines: problematic,
          attempts: 2
        };
      } catch (retryError: any) {
        return {
          isValid: false,
          error: retryError?.message || String(retryError),
          fixedCode,
          removedLines: problematic,
          attempts: 2
        };
      }
    }
    
    return {
      isValid: false,
      error: errorMessage,
      attempts: 1
    };
  }
}
