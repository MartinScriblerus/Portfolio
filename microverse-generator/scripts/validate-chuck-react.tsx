/**
 * React component helper for validating ChucK code
 * Use this from your React component with WebChucK to validate scraped examples
 * 
 * Usage in your React component:
 * 
 * import { validateChuckCodeWithWebChuck } from './scripts/validate-chuck-react';
 * 
 * const isValid = await validateChuckCodeWithWebChuck(chuckRef.current, codeString);
 */

import { Chuck } from 'webchuck';

/**
 * Validate ChucK code by attempting to run it in WebChucK
 * Returns { valid: boolean, errors: string[] }
 */
export async function validateChuckCodeWithWebChuck(
  chuckInstance: typeof Chuck | null | any,
  code: string
): Promise<{ valid: boolean; errors: string[] }> {
  if (!chuckInstance) {
    return { valid: false, errors: ['ChucK instance not available'] };
  }
  
  const errors: string[] = [];
  
  try {
    // Try to run the code - if it throws, it's invalid
    await chuckInstance && await chuckInstance.runCode(code);
    
    // If it runs without throwing, it's at least syntactically valid
    // You might want to let it run briefly and then stop it
    // For now, we'll consider it valid if it doesn't throw
    
    return { valid: true, errors: [] };
    
  } catch (error: any) {
    errors.push(error.message || String(error));
    return { valid: false, errors };
  } finally {
    // Clean up - you might want to remove the shred or clear state
    // chuckInstance.clearChuckInstance();
  }
}

/**
 * Batch validate multiple code samples
 */
export async function validateChuckFiles(
  chuckInstance: typeof Chuck | null,
  files: Array<{ name: string; code: string }>
): Promise<Array<{ name: string; valid: boolean; errors: string[] }>> {
  const results = [];
  
  for (const file of files) {
    const validation = await validateChuckCodeWithWebChuck(chuckInstance, file.code);
    results.push({
      name: file.name,
      ...validation
    });
    
    // Small delay between validations
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}
